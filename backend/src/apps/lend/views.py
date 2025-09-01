from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters import rest_framework as filters
from .models import Transaction, TransactionVerification
from .serializers import TransactionSerializer, TransactionVerificationSerializer
from .permissions import IsInitiatorOrParticipant
from .filters import TransactionFilter
from django.db import transaction as db_transaction

class TransactionListCreateView(generics.ListCreateAPIView):
    """
    API view to list all transactions for the authenticated user and create new ones.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TransactionFilter

    def get_queryset(self):
        """
        Filter transactions to only show those where the user is either the initiator or the participant.
        """
        user = self.request.user
        return Transaction.objects.filter(initiator=user) | Transaction.objects.filter(participant=user)

    def perform_create(self, serializer):
        """
        Set the initiator of the transaction to the authenticated user.
        """
        serializer.save(initiator=self.request.user)


class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update, or delete a single transaction.
    """
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsInitiatorOrParticipant]

    def get_queryset(self):
        """
        Filter transactions to only show those where the user is either the initiator or the participant.
        """
        user = self.request.user
        return Transaction.objects.filter(initiator=user) | Transaction.objects.filter(participant=user)


class TransactionVerificationDetailView(generics.RetrieveUpdateAPIView):
    """
    API view to retrieve and update the verification status of a transaction.
    """
    queryset = TransactionVerification.objects.all()
    serializer_class = TransactionVerificationSerializer
    permission_classes = [IsAuthenticated, IsInitiatorOrParticipant]
    
    def get_queryset(self):
        return TransactionVerification.objects.filter(
            transaction__initiator=self.request.user
        ) | TransactionVerification.objects.filter(
            transaction__participant=self.request.user
        )
    
    @db_transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        user = request.user
        if user == instance.transaction.initiator:
            instance.verified_by_initiator = True
        elif user == instance.transaction.participant:
            instance.verified_by_participant = True
        
        instance.save()
        
        # Check if both parties have verified and update the main transaction status
        if instance.verified_by_initiator and instance.verified_by_participant:
            instance.transaction.status = Transaction.ACCEPTED
            instance.transaction.save()
            
            # Update the reciprocal transaction as well
            reciprocal_transaction = Transaction.objects.get(
                initiator=instance.transaction.participant,
                participant=instance.transaction.initiator,
                amount=instance.transaction.amount,
                due_date=instance.transaction.due_date,
            )
            reciprocal_transaction.status = Transaction.ACCEPTED
            reciprocal_transaction.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
