from django.urls import path
from .views import (
	EventListCreateView, EventRetrieveUpdateDestroyView,
	EventExpenseListCreateView, EventExpenseRetrieveUpdateDestroyView,
    EventTotalExpensesView
)

urlpatterns = [
	# URLs for Event model
	path('', EventListCreateView.as_view(), name='events-list-create'),
	path('<int:pk>/', EventRetrieveUpdateDestroyView.as_view(), name='events-detail'),

	# URLs for EventExpense model
	path('expenses/', EventExpenseListCreateView.as_view(), name='event-expenses-list-create'),
	path('expenses/<int:pk>/', EventExpenseRetrieveUpdateDestroyView.as_view(), name='event-expenses-detail'),
    path('expenses/summary/', EventTotalExpensesView.as_view(), name='event-expenses-summary'),
]
