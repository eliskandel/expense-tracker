from rest_framework import serializers
from src.apps.auth.models import User
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    # Use a PrimaryKeyRelatedField to explicitly handle the user ID as the participant.
    participant = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True
    )
    # Add a read-only field to display the participant's username
    initiator_username = serializers.CharField(source='initiator.username', read_only=True)
    participant_username = serializers.CharField(source='participant.username', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 
            'initiator', 
            'initiator_username',
            'participant', 
            'participant_username',
            'amount', 
            'interest_rate', 
            'due_date', 
            'status', 
            'description', 
            'created_at', 
            'updated_at',
            'verified_by_initiator',
            'verified_by_participant',
            'is_verified'
        ]
        read_only_fields = ['initiator', 'transaction_type', 'participant_username']

    def validate(self, data):
        # Ensure the `verified_by_participant` field is not set on creation.
        if self.instance is None and 'verified_by_participant' in data:
            raise serializers.ValidationError(
                {"verified_by_participant": "Cannot set participant verification on creation."}
            )
        
        # Ensure the initiator and participant are not the same user.
        if self.context['request'].user == data.get('participant'):
             raise serializers.ValidationError(
                {"participant": "You cannot create a transaction with yourself as the participant."}
            )

        return data

    def create(self, validated_data):
        """
        Set the transaction initiator and type based on the current user from the request context.
        """
        validated_data['initiator'] = self.context['request'].user
        validated_data['transaction_type'] = 'L'
        return super().create(validated_data)


class TransactionVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['status', 'verified_by_initiator', 'verified_by_participant', 'is_verified']
        read_only_fields = ['verified_by_initiator', 'is_verified']
