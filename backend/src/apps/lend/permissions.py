from rest_framework import permissions

class IsInitiatorOrParticipant(permissions.BasePermission):
    """
    Custom permission to only allow initiators and participants of a transaction
    to access the related object.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any user who is the initiator or participant.
        if request.user and (obj.initiator == request.user or obj.participant == request.user):
            return True
        return False
