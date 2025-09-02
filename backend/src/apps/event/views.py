from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Event, EventExpense
from .serializers import EventSerializer, EventExpenseSerializer
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from .services import EventExpenseService


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


class EventExpenseListCreateView(generics.ListCreateAPIView):
    """
    Handles listing and creating expenses for a specific event.
    The event ID is provided via a query parameter.
    """
    serializer_class = EventExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters expenses by the event ID provided in the URL query parameters.
        Example: /api/expenses/?event_id=1
        """
        event_id = self.request.query_params.get('event_id')
        if not event_id:
            return EventExpense.objects.none()  # Return an empty queryset if no event_id is provided
        return EventExpense.objects.filter(event__id=event_id)

    def perform_create(self, serializer):
        """
        Automatically adds the event and the user who paid to the expense.
        """
        event_id = self.request.query_params.get('event_id')
        if not event_id:
            raise ValidationError({"detail": "An 'event_id' query parameter is required to create an expense."})

        # Get the Event object from the ID in the query parameters
        event = get_object_or_404(Event, id=event_id)

        # Save the serializer, adding the 'event' and 'paid_by' fields
        serializer.save(event=event, paid_by=self.request.user)

class EventExpenseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update, or delete an event expense.
    """
    queryset = EventExpense.objects.all()
    serializer_class = EventExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the expenses to only those created by the authenticated user.
        """
        return self.queryset.filter(paid_by=self.request.user)

class EventTotalExpensesView(generics.GenericAPIView):
    """
    API view to retrieve a summary of expenses for a specific event.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        event_id = self.request.query_params.get('event_id')
        if not event_id:
            return Response({"detail": "An 'event_id' query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        total_expenses = EventExpenseService.calculate_total_expenses(event_id)
        return Response({"total_expenses": total_expenses}, status=status.HTTP_200_OK)
