from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.views import APIView
from django.db import transaction as db_transaction

from .models import Transaction
from .serializers import TransactionSerializer, TransactionVerificationSerializer
# from .permissions import IsParticipantOrReadOnly (Assuming this exists)

# Placeholder for IsParticipantOrReadOnly for a self-contained example
class IsParticipantOrReadOnly(BasePermission):
    """
    Custom permission to only allow participants of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Write permissions are only allowed to the participant.
        return obj.participant == request.user


class IsInitiatorOrReadOnly(BasePermission):
    """
    Custom permission to only allow initiators of an object to delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Only the initiator can perform the DELETE action
        if request.method == 'DELETE':
            return obj.initiator == request.user
            
        return False # Deny all other methods for this permission class


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

        # Ensure user is initiator
        if request.user != transaction.initiator:
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
