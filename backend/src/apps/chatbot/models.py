# models.py
import json
from decimal import Decimal
from django.db import models
from src.apps.auth.models import User


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Optional: Store context data that was sent to AI
    context_data = models.JSONField(null=True, blank=True, encoder=DecimalEncoder)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.message_type} - {self.timestamp}"