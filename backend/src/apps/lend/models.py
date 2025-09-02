from django.db import models
from src.apps.auth.models import User


class Transaction(models.Model):
 
    LEND = 'L'
    TYPE_CHOICES = [
        (LEND, 'Lend'),
    ]

    PENDING = 'P'
    ACCEPTED = 'A'
    PAID = 'D'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (PAID, 'Paid'),
    ]

    initiator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='initiated_transactions',
        help_text="The user who initiated the transaction."
    )
    participant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='participated_transactions',
        help_text="The other user involved in the transaction."
    )
    transaction_type = models.CharField(
        max_length=1,
        choices=TYPE_CHOICES,
        help_text="The type of transaction (Lend or Borrow)."
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="The amount of money transacted."
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Annual interest rate in percentage."
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="The date the amount is due."
    )
    status = models.CharField(
        max_length=1,
        choices=STATUS_CHOICES,
        default=PENDING,
        help_text="The current status of the transaction."
    )
    description = models.TextField(
        blank=True,
        help_text="A brief description of the transaction."
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    verified_by_initiator = models.BooleanField(
        default=False,
        help_text="Whether the initiator has verified the transaction."
    )
    verified_by_participant = models.BooleanField(
        default=False,
        help_text="Whether the participant has verified the transaction."
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Indicates if both the initiator and the participant have verified the transaction."
    )


    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.initiator} {self.get_transaction_type_display()} {self.amount} to {self.participant}"
