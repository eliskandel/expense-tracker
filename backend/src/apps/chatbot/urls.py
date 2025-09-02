from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_with_ai, name='chat_with_ai'),
    path('history/', views.chat_history, name='chat_history'),
    path('financial-summary/', views.user_financial_summary, name='user_financial_summary'),
]