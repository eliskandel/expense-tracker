from celery import shared_task
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

from src.apps.notification.models import Notification
from .models import Reminder

@shared_task
def send_user_mail(subject, recipients, message, create_notification=True):
    """
    Celery task to send an email and create an in-app notification.
    """
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
        User = get_user_model()
        for email in recipients:
            try:
                user = User.objects.get(email=email)
                Notification.objects.create(recipient=user, message=message)
            except User.DoesNotExist:
                pass  # skip if no user with that email


@shared_task
def send_reminder_notification(reminder_id):
    """
    Celery task to send a reminder notification.
    It creates a notification and deactivates the reminder.
    """
    try:
        reminder = Reminder.objects.get(pk=reminder_id)

        # Only proceed if the reminder is active and the due date has passed
        if reminder.is_active and reminder.due_date <= timezone.now():
            # Create a simple notification record
            Notification.objects.create(
                recipient=reminder.recipient,
                message=f"Reminder: {reminder.message}",
                is_read=False
            )
            print(f"Reminder notification sent for ID {reminder_id}")

            # Deactivate the reminder after it's been sent
            reminder.is_active = False
            reminder.save()

    except Reminder.DoesNotExist:
        print(f"Reminder with ID {reminder_id} not found.")
