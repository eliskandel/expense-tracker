from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction as db_transaction

from .models import Transaction
from .serializers import TransactionSerializer, TransactionVerificationSerializer
from .permissions import IsParticipantOrReadOnly, IsInitiatorOrReadOnly


class TransactionListCreateView(generics.ListCreateAPIView):
    """
    API endpoint that allows listing all transactions or creating a new transaction.
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated, IsParticipantOrReadOnly]
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsInitiatorOrReadOnly()]
        

    


class TransactionVerificationView(APIView):
    """
    API endpoint for the participant to verify a transaction.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        try:
            transaction = Transaction.objects.get(id=id)
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only participant can verify
        if request.user != transaction.participant:
            return Response(
                {"detail": "You do not have permission to verify this transaction."},
                status=status.HTTP_403_FORBIDDEN
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
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        try:
            transaction = Transaction.objects.get(id=id)
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Ensure user is participant or initiator
        if request.user not in [transaction.initiator, transaction.participant]:
            return Response(
                {"detail": "You do not have permission to mark this transaction as paid."},
                status=status.HTTP_403_FORBIDDEN
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
