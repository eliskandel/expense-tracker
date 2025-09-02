from django.db import models
from django.conf import settings
from src.apps.common.models import BaseModel
from src.apps.expense.models import Expense


class Event(BaseModel):
	name = models.CharField(max_length=255)
	description = models.TextField(blank=True)
	date = models.DateField()
	location = models.CharField(max_length=255, blank=True)
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='events_created')
	participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='event_participants')

	def __str__(self):
		return self.name

class EventTransaction(models.Model):
	event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='transactions')
	amount = models.DecimalField(max_digits=10, decimal_places=2)
	created_at = models.DateTimeField(auto_now_add=True)

class EventExpense(BaseModel):

	event = models.ForeignKey(
		Event,
		on_delete=models.CASCADE,
		related_name='event_expenses',
		help_text='The event this expense belongs to.'
	)
	description = models.TextField(
		blank=True,
		help_text='A detailed description of the expense.'
	)
	amount = models.DecimalField(
		max_digits=10,
		decimal_places=2,
		help_text='The total amount of the expense.'
	)
	paid_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,  # Use SET_NULL to keep the expense record if the user is deleted
		related_name='event_expenses_paid',
		null=True, # Allows the field to be null for SET_NULL
		help_text='The user who paid for this expense.'
	)

	def __str__(self):
		return f"Expense for {self.event.name}: {self.description} - {self.amount}"
