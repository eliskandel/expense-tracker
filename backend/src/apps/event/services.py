from django.db.models import Sum
from .models import EventExpense

class EventExpenseService:

    @staticmethod
    def calculate_total_expenses(event_id):
  
        total = EventExpense.objects.filter(
            event__id=event_id
        ).aggregate(total_amount=Sum('amount'))['total_amount']

        return total if total is not None else 0.0
