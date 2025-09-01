from django_filters import rest_framework as filters
from .models import Transaction

class TransactionFilter(filters.FilterSet):
    is_verified = filters.BooleanFilter(method='filter_is_verified')

    class Meta:
        model = Transaction
        fields = {
            'transaction_type': ['exact'],
            'status': ['exact'],
        }
    
    def filter_is_verified(self, queryset, name, value):
        # Filter transactions based on the verification status of their related
        # TransactionVerification object.
        return queryset.filter(is_verified=value)
