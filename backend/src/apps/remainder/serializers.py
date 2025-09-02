from rest_framework import serializers
from .models import Reminder

class ReminderSerializer(serializers.ModelSerializer):
    """
    Serializer for the Reminder model.
    """
    class Meta:
        model = Reminder
        fields = ['id', 'message', 'due_date', 'recipient', 'is_active', 'category']
        read_only_fields = ['recipient', 'is_active']
