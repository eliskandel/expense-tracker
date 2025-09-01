from rest_framework import serializers
from .models import Transaction, User, TransactionVerification
from decimal import Decimal
from django.db import transaction

# A simple serializer for the User model to be used in nested representations.
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class TransactionVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionVerification
        fields = ['verified_by_initiator', 'verified_by_participant', 'created_at']
        read_only_fields = ['created_at']


class TransactionSerializer(serializers.ModelSerializer):
    initiator = UserSerializer(read_only=True)
    # participant = UserSerializer()
    interest_amount = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    verification = TransactionVerificationSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'initiator', 'participant', 'transaction_type', 'amount',
            'interest_rate', 'interest_amount', 'due_date', 'status', 'description',
            'created_at', 'updated_at', 'is_verified', 'verification'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    def get_interest_amount(self, obj):
        if obj.interest_rate and obj.due_date and obj.created_at:
            principal = obj.amount
            rate = obj.interest_rate
            
            # Calculate time in days between created_at and due_date
            delta = obj.due_date - obj.created_at.date()
            time_in_years = Decimal(delta.days) / Decimal(365.0)
            
            # Calculate interest, ensuring all operands are Decimal
            interest = (principal * rate * time_in_years) / Decimal(100)
            return round(interest, 2)
        return None

    def get_is_verified(self, obj):
        """
        Custom method to check if a transaction is verified by both parties.
        """
        try:
            return obj.verification.verified_by_initiator and obj.verification.verified_by_participant
        except TransactionVerification.DoesNotExist:
            return False

    def validate_participant(self, value):
        if self.context['request'].user == value:
            raise serializers.ValidationError("You cannot create a transaction with yourself.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            initiator_user = self.context['request'].user
            participant_user = validated_data.pop('participant')
        
            # Create the transaction for the initiator
            original_transaction = Transaction.objects.create(
                initiator=initiator_user,
                participant=participant_user,   
                **validated_data
            )
        
        # Determine the reciprocal type
            reciprocal_type = Transaction.BORROW if original_transaction.transaction_type == Transaction.LEND else Transaction.LEND
            
            # Create the reciprocal transaction for the participant
            Transaction.objects.create(
                initiator=participant_user,
                participant=initiator_user,
                transaction_type=reciprocal_type,
                status=original_transaction.status,
                amount=original_transaction.amount,
                interest_rate=original_transaction.interest_rate,
                due_date=original_transaction.due_date,
                description=original_transaction.description
            )
            
            # Create the initial verification object and set the initiator's flag to True
            TransactionVerification.objects.create(
                transaction=original_transaction,
                verified_by_initiator=True  # <-- Corrected logic here
            )
        
        return original_transaction
    def update(self, instance, validated_data):
        """
        Handles updates to the transaction status. If the status is 'PAID',
        the reciprocal transaction's status is also updated to 'PAID'.
        """
        with transaction.atomic():
            instance.status = validated_data.get('status', instance.status)
            instance.save()
            
            # Find the reciprocal transaction and update its status
            if instance.status == Transaction.PAID:
                reciprocal_transaction = Transaction.objects.get(
                    initiator=instance.participant,
                    participant=instance.initiator,
                    amount=instance.amount,
                    due_date=instance.due_date,
                    status__in=[Transaction.PENDING, Transaction.ACCEPTED]
                )
                reciprocal_transaction.status = Transaction.PAID
                reciprocal_transaction.save()
                
            return instance
