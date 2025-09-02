from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction
from src.apps.common.tasks import send_user_mail

@receiver(post_save, sender=Transaction)
def transaction_status_handler(sender, instance, created, **kwargs):
    """
    Handles sending emails and creating notifications on transaction status changes.
    """
    subject = "Transaction Update"
    message = ""
    recipients = []

    # Case 1: New transaction created
    if created:
        subject = f"New Transaction from {instance.initiator.username}"
        message = (
            f"You have a new lending transaction from {instance.initiator.username} for an amount of "
            f"{instance.amount} with a due date of {instance.due_date}. "
            f"Please review and verify the transaction."
        )
        recipients = [instance.participant.email]

    # Case 2: Existing transaction updated
    else:
        # Check for status changes
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                if instance.status == Transaction.ACCEPTED:
                    subject = "Transaction Accepted"
                    message = (
                        f"The transaction with {instance.initiator.username} has been accepted. "
                        "It is now ready for payment."
                    )
                    recipients = [instance.initiator.email, instance.participant.email]
                
                elif instance.status == Transaction.PAID:
                    subject = "Transaction Paid"
                    message = (
                        f"The transaction with {instance.initiator.username} has been marked as PAID. "
                        f"Thank you for using our service."
                    )
                    recipients = [instance.initiator.email, instance.participant.email]

        except sender.DoesNotExist:
            # This case should not happen under normal circumstances for updates
            pass

    # Send the email if there are recipients
    if recipients and message:
        send_user_mail.delay(
            subject=subject,
            message=message,
            recipients=recipients
        )
