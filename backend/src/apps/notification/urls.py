from django.urls import path
from .views import NotificationListView, NotificationCreateView, NotificationUpdateView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("create/", NotificationCreateView.as_view(), name="notification-create"),
    path("<int:pk>/read/", NotificationUpdateView.as_view(), name="notification-read"),
]
