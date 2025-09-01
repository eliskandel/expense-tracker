from django.core.mail import EmailMessage
from celery import shared_task
from django.conf import settings

@shared_task
def send_user_mail(subject,recipients,message):
    mail = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.EMAIL_HOST_USER,
        to=recipients
    )
    mail.send()



# from celery import shared_task
# from django.core.mail import send_mail
# from django.conf import settings
# from src.apps.budget.models import Budget
# from datetime import date
# from decimal import Decimal
# THRESHOLD_WARNING = 0.8  # 80% threshold

# @shared_task
# def send_budget_notifications():
#     """
#     Check all users' budgets and send notifications if the threshold is exceeded.
#     """
#     today = date.today()
#     first_day_of_month = today.replace(day=1)

#     budgets = Budget.objects.filter(month=first_day_of_month)
#     for budget in budgets:
#         if budget.total_expense >= budget.allowed_expense * Decimal(THRESHOLD_WARNING):
#             user = budget.user
#             send_mail(
#                 subject=f"Budget Alert for {budget.month.strftime('%B %Y')}",
#                 message=f"Warning! You have spent {budget.total_expense} "
#                         f"out of {budget.allowed_expense} allowed this month.",
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[user.email]
#             )
