from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    recipient_username = serializers.CharField(
        source="recipient.username", read_only=True
    )

    class Meta:
        model = Notification
        fields = ["id", "recipient", "recipient_username", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "recipient": {"write_only": True},
            "message": {"required": True, "allow_blank": False},
            "is_read": {"read_only": True},
        }
    