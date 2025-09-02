from django.urls import path
from .views import (
	EventListCreateView, EventRetrieveUpdateDestroyView,
	EventTransactionListCreateView, EventTransactionRetrieveUpdateDestroyView,
	EventExpenseListCreateView, EventExpenseRetrieveUpdateDestroyView
)

urlpatterns = [
	# URLs for Event model
	path('', EventListCreateView.as_view(), name='events-list-create'),
	path('<int:pk>/', EventRetrieveUpdateDestroyView.as_view(), name='events-detail'),

	# URLs for EventTransaction model
	path('transactions/', EventTransactionListCreateView.as_view(), name='event-transactions-list-create'),
	path('transactions/<int:pk>/', EventTransactionRetrieveUpdateDestroyView.as_view(), name='event-transactions-detail'),

	# URLs for EventExpense model
	path('expenses/', EventExpenseListCreateView.as_view(), name='event-expenses-list-create'),
	path('expenses/<int:pk>/', EventExpenseRetrieveUpdateDestroyView.as_view(), name='event-expenses-detail'),
]
