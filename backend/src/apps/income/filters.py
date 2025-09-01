from django_filters import rest_framework as filters
from .models import Income
class IncomeFilter(filters.FilterSet):
    class Meta:
        model = Income
        fields = {
            'user': ['exact'],
            'amount': ['lt', 'gt', 'exact'],
            'description': ['icontains'],
            'date': ['exact', 'year__gt', 'year__lt'],
            'category': ['exact'],
            'group': ['exact'],
        }