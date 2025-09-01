from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionRetrieveUpdateDestroyView,
    TransactionVerificationDetailView
)

urlpatterns = [
    path(
        '',
        TransactionListCreateView.as_view(),
        name='transaction-list'
    ),
    path(
        '<int:pk>/',
        TransactionRetrieveUpdateDestroyView.as_view(),
        name='transaction-detail'
    ),
    path(
        '<int:pk>/verification/',
        TransactionVerificationDetailView.as_view(),
        name='transaction-verification'
    ),
]