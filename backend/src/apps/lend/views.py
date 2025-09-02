from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.views import APIView
from django.db import transaction as db_transaction
from django.db.models import Q

from .models import Transaction
from .serializers import TransactionSerializer, TransactionVerificationSerializer
from .permissions import IsParticipantOrReadOnly, IsInitiatorOrReadOnly, IsInitiator, IsParticipant


class TransactionListCreateView(generics.ListCreateAPIView):
    """
    API endpoint that allows listing all transactions or creating a new transaction.
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset to only return transactions where the user is either the initiator or the participant.
        """
        return self.queryset.filter(
            Q(initiator=self.request.user) | Q(participant=self.request.user)
        )

    def perform_create(self, serializer):
        """
        Automatically set the initiator of the transaction to the current user.
        Also mark initiator as verified on creation.
        """
        with db_transaction.atomic():
            instance = serializer.save(
                initiator=self.request.user,
                verified_by_initiator=True
            )
            # If participant == initiator, mark participant verified too
            if instance.participant == instance.initiator:
                instance.verified_by_participant = True
                instance.save(update_fields=["verified_by_participant"])


class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows retrieving, updating, or deleting a specific transaction.
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    lookup_field = "id"

    def get_permissions(self):
        # The schema generator does not provide a request object, so we must handle this.
        if not self.request:
            return [IsAuthenticated()]

        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsInitiatorOrReadOnly()]
        return [IsAuthenticated(), IsParticipantOrReadOnly()]


class TransactionVerificationView(APIView):
    """
    API endpoint for the participant to verify a transaction.
    """
    permission_classes = [IsAuthenticated, IsParticipant]

    def patch(self, request, id):
        try:
            transaction = Transaction.objects.get(id=id)
            self.check_object_permissions(request, transaction)
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Already verified
        if transaction.is_verified:
            return Response(
                {"detail": "This transaction is already verified."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark participant verification
        transaction.verified_by_participant = True

        # If both verified → mark as accepted
        if transaction.verified_by_initiator and transaction.verified_by_participant:
            transaction.is_verified = True
            transaction.status = Transaction.ACCEPTED

        transaction.save()

        serializer = TransactionVerificationSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TransactionMarkPaidView(APIView):
    """
    API endpoint to mark a transaction as 'PAID'.
    Only initiator or participant should be allowed.
    """
    permission_classes = [IsAuthenticated, IsInitiator]

    def patch(self, request, id):
        try:
            transaction = Transaction.objects.get(id=id)
            self.check_object_permissions(request, transaction)
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Transaction must be verified first
        if not transaction.is_verified:
            return Response(
                {"detail": "Transaction must be verified before marking as paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark as paid
        transaction.status = Transaction.PAID
        transaction.save(update_fields=["status"])

        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)
