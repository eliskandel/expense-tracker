from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg
from decimal import Decimal

from src.apps.expense.models import Expense, ExpenseShare
from src.apps.common.tasks import send_user_mail
from src.apps.notification.models import Notification  # optional


ANOMALY_FACTOR = Decimal('1.5')  # 1.5x average

@receiver(post_save, sender=Expense)
def expense_anomaly_alert(sender, instance, created, **kwargs):
    if not created:
        return  # Only check new expenses

    user = instance.paid_by
    category = instance.category
    expense_month = instance.date.replace(day=1)

    # Calculate average of previous expenses for this user, category, month
    previous_expenses = Expense.objects.filter(
        paid_by=user,
        category=category,
        date__year=instance.date.year,
        date__month=instance.date.month
    ).exclude(id=instance.id)  # exclude current expense

    avg_expense = previous_expenses.aggregate(avg=Avg('amount'))['avg'] or Decimal('0')

    # Check if current expense is unusually large
    if avg_expense > 0 and instance.amount >= ANOMALY_FACTOR * avg_expense:
        subject = f"Unusual Expense Alert: {category.name}"
        message = (
            f"⚠️ You just added an expense of ${instance.amount}, "
            f"which is more than 1.5× the average of your previous expenses (${avg_expense:.2f}) "
            f"in this category for this month."
        )
        recipients = [user.email]

        # Send email + create notification
        send_user_mail.delay(subject, recipients, message)
        # Optional: also save in DB
        # Notification.objects.create(recipient=user, message=message)


@receiver(post_save, sender=Expense)
def update_expense_shares_on_settlement(sender, instance, **kwargs):
    """
    Signal to update all related ExpenseShare objects when an Expense is settled.
    This handles the case where an entire expense is marked as settled from the main expense object.
    """
    if instance.is_settled and instance.group:
        # Get all related ExpenseShare objects that are not yet settled
        unsettled_shares = ExpenseShare.objects.filter(
            expense=instance,
            is_settled=False
        )
        
        # Check if there are any unsettled shares to avoid unnecessary updates
        if unsettled_shares.exists():
            # Update all of them in a single database query for efficiency
            unsettled_shares.update(is_settled=True)