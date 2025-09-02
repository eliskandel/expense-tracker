from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer

# List all notifications for the logged-in user
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filters notifications to only show the authenticated user's notifications.
        """
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

# Update a single notification to mark it as read
class NotificationMarkAsReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Ensures a user can only update their own notifications.
        """
        return Notification.objects.filter(recipient=self.request.user)

    def perform_update(self, serializer):
        """
        Saves the notification and explicitly sets is_read to True.
        """
        serializer.save(is_read=True)

# Mark all notifications for the user as read
class NotificationMarkAllAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        """
        Marks all unread notifications for the authenticated user as read.
        """
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response(
            {"detail": "All notifications marked as read."},
            status=status.HTTP_200_OK
        )

# Get the count of unread notifications for the user
class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Returns the count of unread notifications for the authenticated user.
        """
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)
