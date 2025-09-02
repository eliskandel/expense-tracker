from django.urls import path
from .views import ReminderListCreateView, ReminderRetrieveUpdateDestroyView

urlpatterns = [
    path('', ReminderListCreateView.as_view(), name='reminders-list-create'),
    path('<int:pk>/', ReminderRetrieveUpdateDestroyView.as_view(), name='reminders-detail'),
]
