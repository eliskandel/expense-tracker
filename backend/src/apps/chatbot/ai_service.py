import google.generativeai as genai
from django.conf import settings
from datetime import datetime
from decimal import Decimal
from django.db.models import Sum, Q
from src.apps.expense.models import Expense, Category as ExpenseCategory
from src.apps.budget.models import Budget
from src.apps.income.models import Income
from google.api_core.exceptions import GoogleAPIError, InvalidArgument

class FinancialAIService:
    def __init__(self):
        try:
            genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            # Handle cases where the API key is not configured correctly
            raise ValueError(f"Failed to configure Gemini API: {e}")

    def get_user_financial_context(self, user):
        """Gather user's financial data for AI context"""
        current_month = datetime.now().month
        current_year = datetime.now().year

        # Get current month's expenses
        monthly_expenses = Expense.objects.filter(
            paid_by=user,
            date__month=current_month,
            date__year=current_year
        ).select_related('category')

        # Get current month's income
        monthly_income = Income.objects.filter(
            user=user,
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        # Get budgets
        user_budgets = Budget.objects.filter(
            user=user,
            month__month=current_month,
            month__year=current_year
        ).select_related('category')

        # Calculate expense totals by category
        expense_by_category = {}
        total_monthly_expenses = Decimal('0')

        for expense in monthly_expenses:
            category_name = expense.category.name
            if category_name not in expense_by_category:
                expense_by_category[category_name] = Decimal('0')
            expense_by_category[category_name] += expense.amount
            total_monthly_expenses += expense.amount

        # Get recent expenses (last 5) - convert Decimal amounts to float
        recent_expenses = []
        for expense in monthly_expenses.order_by('-date')[:5]:
            recent_expenses.append({
                'description': expense.description,
                'amount': float(expense.amount),  # Convert to float
                'category__name': expense.category.name,
                'date': expense.date.isoformat()
            })

        # Budget analysis
        budget_analysis = []
        for budget in user_budgets:
            budget_analysis.append({
                'category': budget.category.name,
                'allowed': float(budget.allowed_expense),
                'spent': float(budget.total_expense),
                'remaining': float(budget.remaining_budget),
                'percentage_used': float(budget.total_expense / budget.allowed_expense * 100) if budget.allowed_expense > 0 else 0
            })

        # Return all values as floats for JSON serialization
        return {
            'monthly_income': float(monthly_income),
            'monthly_expenses': float(total_monthly_expenses),
            'expense_by_category': {k: float(v) for k, v in expense_by_category.items()},
            'recent_expenses': recent_expenses,
            'budget_analysis': budget_analysis,
            'month_year': f"{datetime.now().strftime('%B %Y')}"
        }

    def create_system_prompt(self, user_context):
        """Create a system prompt with user's financial context"""

        system_prompt = f"""You are Rupaiyaa AI, a friendly financial assistant for Nepalese youth. You help with budgeting, expense tracking, and financial advice with cultural context for Nepal.

USER'S FINANCIAL SUMMARY ({user_context['month_year']}):
- Monthly Income: NPR {user_context['monthly_income']:,.2f}
- Monthly Expenses: NPR {user_context['monthly_expenses']:,.2f}
- Net Position: NPR {user_context['monthly_income'] - user_context['monthly_expenses']:,.2f}

EXPENSE BREAKDOWN:"""

        for category, amount in user_context['expense_by_category'].items():
            system_prompt += f"\n- {category}: NPR {amount:,.2f}"

        if user_context['recent_expenses']:
            system_prompt += f"\n\nRECENT EXPENSES:"
            for expense in user_context['recent_expenses']:
                system_prompt += f"\n- {expense['description']}: NPR {expense['amount']} ({expense['category__name']}) on {expense['date']}"

        if user_context['budget_analysis']:
            system_prompt += f"\n\nBUDGET STATUS:"
            for budget in user_context['budget_analysis']:
                status = "⚠️ Over Budget" if budget['percentage_used'] > 100 else "✅ On Track" if budget['percentage_used'] < 80 else "🔶 Watch Spending"
                system_prompt += f"\n- {budget['category']}: {budget['percentage_used']:.1f}% used (NPR {budget['spent']:.2f} of NPR {budget['allowed']:.2f}) {status}"

        system_prompt += """

GUIDELINES:
- Be conversational and friendly, like talking to a friend
- Use Nepalese context (mention momo, dal-bhat, local transport, etc. when relevant)
- Provide practical, actionable advice
- If asked about specific expenses, refer to their actual data
- Help with budgeting, saving tips, and expense analysis
- Keep responses concise but helpful
- Use NPR currency format
- Be encouraging about their financial journey

Remember: You're helping young Nepalese people build better financial habits!"""

        return system_prompt

    def get_ai_response_sync(self, user_message, user_context):
        """Synchronous version for simpler implementation"""
        try:
            system_prompt = self.create_system_prompt(user_context)

            # Combine system prompt and user message
            full_prompt = f"{system_prompt}\n\nUser Question: {user_message}\n\nResponse:"

            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=500,
                    temperature=0.7,
                )
            )

            return response.text.strip()
        
        except (GoogleAPIError, InvalidArgument) as e:
            # Handle specific API errors
            return f"I ran into a problem with my AI brain. It seems like there's an API issue: {str(e)}"
        
        except Exception as e:
            # Fallback response for any other unexpected errors
            return f"I'm having trouble connecting right now, but I can see from your data that you've spent NPR {user_context['monthly_expenses']:,.2f} this month. Your recent expenses include some interesting items! Try asking me again in a moment."