from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.db.models import Q
from django.db import transaction as db_transaction
from .models import Transaction, TransactionVerification
from .serializers import TransactionSerializer, TransactionVerificationSerializer
from .permissions import IsInitiatorOrParticipant
from .filters import TransactionFilter

class TransactionListCreateView(generics.ListCreateAPIView):
    """
    API view to list all transactions for the authenticated user and create new ones.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TransactionFilter

    def get_queryset(self):
        # This check prevents errors during schema generation for anonymous users
        if getattr(self, "swagger_fake_view", False):
            return Transaction.objects.none()

        user = self.request.user
        return Transaction.objects.filter(
            Q(initiator=user) | Q(participant=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(initiator=self.request.user)


class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update, or delete a single transaction.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsInitiatorOrParticipant]

    def get_queryset(self):
        # This check prevents errors during schema generation for anonymous users
        if getattr(self, "swagger_fake_view", False):
            return Transaction.objects.none()
            
        user = self.request.user
        return Transaction.objects.filter(
            Q(initiator=user) | Q(participant=user)
        ).order_by('-created_at')



class TransactionVerificationDetailView(generics.RetrieveUpdateAPIView):

    serializer_class = TransactionVerificationSerializer
    permission_classes = [IsAuthenticated, IsInitiatorOrParticipant]
    lookup_field = 'pk' # Allows lookup by the transaction's primary key

    def get_queryset(self):
        # This check prevents errors during schema generation for anonymous users
        if getattr(self, "swagger_fake_view", False):
            return TransactionVerification.objects.none()

        user = self.request.user
        return TransactionVerification.objects.filter(
            Q(transaction__initiator=user) | Q(transaction__participant=user)
        )

    @db_transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        # Mark verification based on the user's role
        if user == instance.transaction.initiator:
            instance.verified_by_initiator = True
        elif user == instance.transaction.participant:
            instance.verified_by_participant = True
        else:
            return Response({"detail": "You are not allowed to verify this transaction."}, status=403)

        instance.save()

        # Update main transaction status if both verified
        transaction = instance.transaction
        if instance.verified_by_initiator and instance.verified_by_participant:
            transaction.status = Transaction.ACCEPTED
            transaction.is_verified = True
            transaction.save()

            # Optional: update reciprocal transaction if linked
            if hasattr(transaction, "reciprocal_transaction") and transaction.reciprocal_transaction:
                reciprocal = transaction.reciprocal_transaction
                reciprocal.status = Transaction.ACCEPTED
                reciprocal.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
