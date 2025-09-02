from rest_framework import permissions

class IsParticipantOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow participants of a transaction to verify it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the participant of the transaction.
        return request.user == obj.participant

class IsInitiatorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow initiators of an object to delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        
        
        # Only the initiator can perform the DELETE action
        if request.method == 'DELETE':
            return obj.initiator == request.user
            
        return False # Deny all other methods for this permission class
