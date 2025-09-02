from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from src.apps.budget.models import Budget
from src.apps.common.tasks import send_user_mail

THRESHOLD_WARNING = 0.8  # 80% of budget

@receiver(post_save, sender=Budget)
def budget_threshold_alert(sender, instance, created, **kwargs):
    if instance.total_expense >= instance.allowed_expense * Decimal(THRESHOLD_WARNING):
        subject = f"Budget Alert for {instance.month.strftime('%B %Y')}"
        message = (
            f"⚠️ Warning! You have spent {instance.total_expense} "
            f"out of {instance.allowed_expense} allowed for {instance.month.strftime('%B %Y')}."
        )
        recipients = [instance.user.email]

        # Call Celery task
        send_user_mail.delay(subject, recipients, message)
