from django.db.models.signals import post_save
from django.dispatch import receiver
from models import Transaction
from src.apps.common.tasks import send_user_mail
from src.apps.notification.models import Notification

@receiver(post_save, sender=Transaction)
def notify_transaction_participant(sender, instance, created, **kwargs):
    """
    Send notification/email to the participant whenever a new transaction is created.
    """
    if not created:
        return  # Only trigger on new transactions

    # Only notify if transaction type is LEND
    if instance.transaction_type == Transaction.LEND:
        recipient = instance.participant
        initiator = instance.initiator

        subject = f"New Transaction from {initiator.username}"
        message = (
            f"{initiator.username} has created a transaction of ${instance.amount} "
            f"as a {instance.get_transaction_type_display()}.\n"
            f"Description: {instance.description or 'No description'}"
        )

        # 1️⃣ Send email + notification using Celery task
        send_user_mail.delay(subject, [recipient.email], message)

        # 2️⃣ Optional: save notification in DB if you want immediate frontend fetch
        # Notification.objects.create(recipient=recipient, message=message)
