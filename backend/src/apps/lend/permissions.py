from rest_framework import permissions

class IsInitiatorOrParticipant(permissions.BasePermission):
    """
    Custom permission to only allow initiators and participants of a transaction
    to access the related object.
    """

    def has_object_permission(self, request, view, obj):
        # Read/write permissions are allowed only to the initiator or participant.
        if request.user and request.user.is_authenticated:
            # Check the transaction on the verification object
            if hasattr(obj, 'transaction'):
                return obj.transaction.initiator == request.user or obj.transaction.participant == request.user
            # For transaction objects directly
            return obj.initiator == request.user or obj.participant == request.user
        return False
