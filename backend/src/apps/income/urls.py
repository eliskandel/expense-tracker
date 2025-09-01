from django.urls import path
from .views import (
    IncomeListCreateView,
    IncomeRetrieveUpdateDestroyView
)

urlpatterns = [
    path('income/', IncomeListCreateView.as_view(), name='income-list-create'),
    path('income/<int:pk>/', IncomeRetrieveUpdateDestroyView.as_view(), name='income-detail'),
]