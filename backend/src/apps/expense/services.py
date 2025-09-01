from datetime import date, timedelta
from django.db.models import Sum, DecimalField
from django.db.models.functions import Coalesce

from datetime import date, timedelta
from django.db.models import Sum, F
from django.db.models.functions import Coalesce, ExtractWeekDay
from django.db.models import DecimalField

class FinancialSummaryService:
    def __init__(self, user, income_model, expense_model):
        self.user = user
        self.Income = income_model
        self.Expense = expense_model

    def get_financial_summary(self, period_days: int) -> dict:
        """Get financial summary for the specified period with all required data for the frontend."""
        end_date = date.today()
        start_date = end_date - timedelta(days=period_days)
        
        return {
            'total_income': self.get_total_income(start_date, end_date),
            'total_expenses': self.get_total_expenses(start_date, end_date),
            'total_balance': self.get_total_balance(start_date, end_date),
            'daily_expenses': self._get_daily_expenses(start_date, end_date),
            'expense_breakdown': self._get_expense_breakdown(start_date, end_date),
        }

    def get_total_balance(self, start_date, end_date) -> float:
        """Get total balance for the specified period"""
        total_income = self.get_total_income(start_date, end_date)
        total_expenses = self.get_total_expenses(start_date, end_date)
        return total_income - total_expenses

    def get_total_income(self, start_date, end_date) -> float:
        """Get total income for the specified period"""
        if not self.Income:
            return 0.0
            
        total = self.Income.objects.filter(
            user=self.user,
            date__range=[start_date, end_date],
        ).aggregate(total=Coalesce(Sum('amount'), 0, output_field=DecimalField()))['total']
        
        return float(total)

    def get_total_expenses(self, start_date, end_date) -> float:
        """Get total expenses for the specified period"""
        if not self.Expense:
            return 0.0
            
        total = self.Expense.objects.filter(
            paid_by=self.user,
            date__range=[start_date, end_date],
            group=None
        ).aggregate(total=Coalesce(Sum('amount'), 0, output_field=DecimalField()))['total']
        
        return float(total)

    def _get_daily_expenses(self, start_date, end_date) -> list:
        """
        Get daily expense totals for the specified period.
        Groups expenses by the day of the week and returns a list of dictionaries.
        """
        if not self.Expense:
            return []

        # Use ExtractWeekDay to group expenses by day of the week (1=Sunday, 2=Monday, ...)
        daily_data = self.Expense.objects.filter(
            paid_by=self.user,
            date__range=[start_date, end_date],
            group=None
        ).annotate(
            day_of_week=ExtractWeekDay('date')
        ).values('day_of_week').annotate(
            total_amount=Coalesce(Sum('amount'), 0, output_field=DecimalField())
        ).order_by('day_of_week')

        # Map the day number to a day name for the frontend
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return [{
            'day_of_week': day_names[item['day_of_week'] - 1],
            'total_amount': float(item['total_amount'])
        } for item in daily_data]

    def _get_expense_breakdown(self, start_date, end_date) -> list:
        """
        Get expense breakdown by category for the specified period.
        Groups expenses by category and returns a list with category name, total amount, and color.
        """
        if not self.Expense:
            return []
            
        # Define a list of colors for the chart
        colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
        
        # Aggregate expenses by category
        breakdown_data = self.Expense.objects.filter(
            paid_by=self.user,
            date__range=[start_date, end_date],
            group=None
        ).values('category__name').annotate(
            total_amount=Coalesce(Sum('amount'), 0, output_field=DecimalField())
        )
        
        # Map the results to the required frontend format and assign a color
        response_data = []
        for i, item in enumerate(breakdown_data):
            response_data.append({
                'category_name': item['category__name'],
                'total_amount': float(item['total_amount']),
                'color': colors[i % len(colors)],  # Cycle through the colors
            })
            
        return response_data

class TransactionService:
    def __init__(self, user, income_model, expense_model):
        self.user = user
        self.Income = income_model
        self.Expense = expense_model

    def get_user_transactions(self, limit: int = 10) -> list:
        """
        Get recent transactions for the user, combining income and expenses.

        Args:
            limit (int): Maximum number of transactions to return per type.
        
        Returns:
            list: Combined and sorted list of transactions by date (most recent first).
        """
        transactions = []

        # Fetch recent expenses
        expenses = self.Expense.objects.filter(paid_by=self.user, group=None).order_by('-date')[:limit]
        for expense in expenses:
            transactions.append({
                'type': 'expense',
                'description': expense.description,
                'amount': float(expense.amount),
                'date': expense.date,
                'category': expense.category.name if expense.category else None
            })

        # Fetch recent incomes
        incomes = self.Income.objects.filter(user=self.user).order_by('-date')[:limit]
        for income in incomes:
            transactions.append({
                'type': 'income',
                'description': income.description,
                'amount': float(income.amount),
                'date': income.date,
                'category': income.category.name if income.category else None
            })

        # Sort all transactions by date (most recent first)
        return sorted(transactions, key=lambda x: x['date'], reverse=True)
