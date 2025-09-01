# src/expense/urls.py
from django.urls import path
from .views import BudgetListCreateView, BudgetDetailView

urlpatterns = [
    path('budgets/', BudgetListCreateView.as_view(), name='budget-list-create'),
    path('budgets/<int:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
]
