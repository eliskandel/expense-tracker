from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from src.apps.notification.models import Notification

@shared_task
def send_user_mail(subject, recipients, message, create_notification=True):

    # 1️⃣ Send email
    mail = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.EMAIL_HOST_USER,
        to=recipients
    )
    mail.send()

    # 2️⃣ Create in-app notification
    if create_notification:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for email in recipients:
            try:
                user = User.objects.get(email=email)
                Notification.objects.create(recipient=user, message=message)
            except User.DoesNotExist:
                pass  # skip if no user with that email
