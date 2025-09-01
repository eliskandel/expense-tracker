from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import date

from src.apps.expense.models import Expense
from src.apps.budget.models import Budget
from src.apps.common.tasks import send_user_mail  # Celery task

THRESHOLD_WARNING = Decimal('0.8')  # 80%

@receiver(post_save, sender=Expense)
def check_budget_on_expense(sender, instance, **kwargs):
    """
    Check all budgets for the expense's category and month.
    Notify the user if the threshold is exceeded.
    """
    user = instance.paid_by
    expense_category = instance.category
    expense_month = instance.date.replace(day=1)  # normalize month

    # Get budgets for the user for this category and month
    budgets = Budget.objects.filter(
        user=user,
        category=expense_category,
        month=expense_month
    )

    for budget in budgets:
        total_expense = budget.total_expense
        allowed_expense = budget.allowed_expense

        if total_expense >= allowed_expense * THRESHOLD_WARNING:
            # Send notification
            # send_user_mail.delay(
            #     subject=f"Budget Alert: {budget.category.name} - {budget.month.strftime('%B %Y')}",
            #     recipients=[user.email],
            #     message=(
            #         f"Warning! You have spent {total_expense} out of "
            #         f"{allowed_expense} allowed for category '{budget.category.name}' this month."
            #     )
            # )
            pass