from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkAsReadView,
    NotificationMarkAllAsReadView,
    UnreadNotificationCountView,
)

urlpatterns = [
    # Get a list of all notifications for the authenticated user
    path('', NotificationListView.as_view(), name='notification-list'),

    # Get the count of unread notifications for the authenticated user
    path('unread/count/', UnreadNotificationCountView.as_view(), name='unread-notification-count'),

    # Mark all notifications for the authenticated user as read
    path('mark-all-as-read/', NotificationMarkAllAsReadView.as_view(), name='mark-all-as-read'),

    # Mark a specific notification as read by its ID
    path('<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='mark-as-read'),
]
