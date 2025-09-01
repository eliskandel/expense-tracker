from django.urls import path
from .views import (
    ExpenseListCreateView,
    ExpenseRetrieveUpdateDestroyView,
    CategoryListCreateView,
    FinancialSummaryView,
    RecentTransactionsView,
    GroupListCreate,
    GroupDetail,
    ExpenseShareList,
    ExpenseShareDetail,
    SettlementCreate
)

urlpatterns = [
    # Expense and Category URLs
    path('', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('<int:pk>/', ExpenseRetrieveUpdateDestroyView.as_view(), name='expense-detail'),
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),

    # Group URLs
    path('groups/', GroupListCreate.as_view(), name='group-list-create'),
    path('groups/<int:pk>/', GroupDetail.as_view(), name='group-detail'),

    # Expense Share and Settlement URLs
    path('expenseshares/', ExpenseShareList.as_view(), name='expenseshare-list'),
    path('expenseshares/<int:pk>/', ExpenseShareDetail.as_view(), name='expenseshare-detail'),
    path('settlements/', SettlementCreate.as_view(), name='settlement-create'),

    # Reporting URLs
    path('report/', FinancialSummaryView.as_view(), name='financial-summary'),
    path('reports/transactions/', RecentTransactionsView.as_view(), name='recent-transactions')
]
