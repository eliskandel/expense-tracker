from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Event, EventTransaction, EventExpense
from .serializers import EventSerializer, EventTransactionSerializer, EventExpenseSerializer


# --- Views for Event model ---
class EventListCreateView(generics.ListCreateAPIView):
	"""
	API view to list all events or create a new one.
	- GET: Returns a list of all Event objects.
	- POST: Creates a new Event object.
	"""
	queryset = Event.objects.all()
	serializer_class = EventSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]

	def perform_create(self, serializer):

		serializer.save(created_by=self.request.user)


class EventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):

	queryset = Event.objects.all()
	serializer_class = EventSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]

	def get_queryset(self):

		return self.queryset.filter(created_by=self.request.user)


# --- Views for EventTransaction model ---
class EventTransactionListCreateView(generics.ListCreateAPIView):

	queryset = EventTransaction.objects.all()
	serializer_class = EventTransactionSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class EventTransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):

	queryset = EventTransaction.objects.all()
	serializer_class = EventTransactionSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


# --- Views for EventExpense model ---
class EventExpenseListCreateView(generics.ListCreateAPIView):

	queryset = EventExpense.objects.all()
	serializer_class = EventExpenseSerializer
	permission_classes = [IsAuthenticated]

	def perform_create(self, serializer):

		serializer.save(paid_by=self.request.user)


class EventExpenseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):

	queryset = EventExpense.objects.all()
	serializer_class = EventExpenseSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		"""
		Ensures that a user can only update or delete their own expenses.
		"""
		return self.queryset.filter(paid_by=self.request.user)
