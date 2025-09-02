from rest_framework import serializers
from .models import Transaction, TransactionVerification

class TransactionSerializer(serializers.ModelSerializer):
    initiator_username = serializers.CharField(
        source='initiator.username',
        read_only=True
    )
    participant_username = serializers.CharField(
        source='participant.username',
        read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            'id', 'initiator', 'initiator_username', 'participant', 'participant_username',
            'transaction_type', 'amount', 'interest_rate', 'due_date',
            'status', 'description', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'initiator', 'status', 'is_verified', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Ensure the initiator is the currently authenticated user
        validated_data['initiator'] = self.context['request'].user
        return super().create(validated_data)


class TransactionVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionVerification
        fields = '__all__'
        read_only_fields = ['transaction', 'verified_by_initiator', 'verified_by_participant', 'created_at', 'updated_at']
