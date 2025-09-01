from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionRetrieveUpdateDestroyView,
    TransactionVerificationDetailView
)

urlpatterns = [
    path(
        'transactions/',
        TransactionListCreateView.as_view(),
        name='transaction-list'
    ),
    path(
        'transactions/<int:pk>/',
        TransactionRetrieveUpdateDestroyView.as_view(),
        name='transaction-detail'
    ),
    path(
        'transactions/<int:pk>/verification/',
        TransactionVerificationDetailView.as_view(),
        name='transaction-verification'
    ),
]