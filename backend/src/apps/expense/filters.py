import django_filters
from .models import Expense

class ExpenseFilter(django_filters.FilterSet):
    class Meta:
        model = Expense
        # The 'user' field was renamed to 'paid_by'
        fields = ['paid_by', 'category']
