from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionRetrieveUpdateDestroyView,
    TransactionVerificationView,
    TransactionMarkPaidView
)

urlpatterns = [
    # URL for listing all transactions and creating a new one
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),

    # URL for retrieving, updating, or deleting a specific transaction
    path('<int:id>/', TransactionRetrieveUpdateDestroyView.as_view(), name='transaction-detail'),
    

    path('<int:id>/verify/', TransactionVerificationView.as_view(), name='transaction-verify'),
    path('<int:id>/paid/', TransactionMarkPaidView.as_view(), name='transaction-mark-paid'),
]
