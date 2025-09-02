from django.db import models
from django.conf import settings
from src.apps.common.models import BaseModel

class Reminder(models.Model):
    """
    A model to store reminders that are not tied to a specific event.
    """
    class CategoryChoices(models.TextChoices):
        GENERAL = 'General', 'General'
        WORK = 'Work', 'Work'
        PERSONAL = 'Personal', 'Personal'
        SHOPPING = 'Shopping', 'Shopping'
        FINANCE = 'Finance', 'Finance'
        OTHER = 'Other', 'Other'

    message = models.TextField(
        help_text='The message to be sent as a reminder.'
    )
    due_date = models.DateTimeField(
        help_text='The date and time when the reminder should be triggered.'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reminders',
        help_text='The user to whom this reminder is addressed.'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether the reminder is still active.'
    )
    category = models.CharField(
        max_length=50,
        choices=CategoryChoices.choices,
        default=CategoryChoices.GENERAL,
        help_text='The category for this reminder.'
    )

    class Meta:
        verbose_name = "Reminder"
        verbose_name_plural = "Reminders"
        ordering = ['due_date']

    def __str__(self):
        return f"[{self.category}] Reminder for {self.recipient.username} on {self.due_date.strftime('%Y-%m-%d %H:%M')}"
