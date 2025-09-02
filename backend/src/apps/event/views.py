from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Event, EventExpense
from .serializers import EventSerializer, EventExpenseSerializer
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError, PermissionDenied
from .services import EventExpenseService
from .permissions import IsOwnerOrReadOnly, IsExpenseOwner


# --- Views for Event model ---
class EventListCreateView(generics.ListCreateAPIView):
    """
    API view to list all events or create a new one.
    - GET: Returns a list of all Event objects.
    - POST: Creates a new Event object.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset to return only events created by the authenticated user.
        """
        return self.queryset.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update, or delete a single event.
    Only the event creator can update or delete the event.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return self.queryset.all()


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
        
        # Check if the event exists and the user has permission to view it.
        event = get_object_or_404(Event, id=event_id)
        if event.created_by != self.request.user:
            raise PermissionDenied("You do not have permission to view expenses for this event.")
            
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
    Only the user who paid for the expense can view, edit, or delete it.
    """
    queryset = EventExpense.objects.all()
    serializer_class = EventExpenseSerializer
    permission_classes = [IsExpenseOwner]

    def get_queryset(self):
        """
        Filters the expenses to only those paid for by the authenticated user.
        """
        return self.queryset.filter(paid_by=self.request.user)

class EventTotalExpensesView(generics.GenericAPIView):
    """
    API view to retrieve a summary of expenses for a specific event.
    Only the event creator can view the total expenses.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        event_id = self.request.query_params.get('event_id')
        if not event_id:
            return Response({"detail": "An 'event_id' query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        event = get_object_or_404(Event, id=event_id)
        if event.created_by != self.request.user:
            raise PermissionDenied("You do not have permission to view total expenses for this event.")
            
        total_expenses = EventExpenseService.calculate_total_expenses(event_id)
        return Response({"total_expenses": total_expenses}, status=status.HTTP_200_OK)
