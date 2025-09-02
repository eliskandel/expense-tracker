from rest_framework import generics, permissions
from .models import Reminder
from .serializers import ReminderSerializer
from django.db.models import Q

class ReminderListCreateView(generics.ListCreateAPIView):
    """
    Generic view to list all active reminders and create new ones for the authenticated user.
    """
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset to only show reminders for the authenticated user.
        """
        return Reminder.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        """
        Automatically sets the recipient to the authenticated user upon creation.
        """
        serializer.save(recipient=self.request.user)

class ReminderRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Generic view to retrieve, update, or delete a specific reminder.
    """
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Ensures a user can only view their own reminders.
        """
        return Reminder.objects.filter(recipient=self.request.user)
