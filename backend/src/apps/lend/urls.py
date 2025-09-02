from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionRetrieveUpdateDestroyView,
    TransactionVerificationDetailView,
)

urlpatterns = [
    # List all transactions or create a new one
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),

    # Retrieve, update, or delete a single transaction by its ID
    path('<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='transaction-detail'),

    # View and update a transaction's verification status by its transaction ID
    path('<int:pk>/verify/', TransactionVerificationDetailView.as_view(), name='transaction-verify'),
]
