from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view, edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Only the owner of the object is allowed to view, edit, or delete it.
        return obj.created_by == request.user


class IsExpenseOwner(permissions.BasePermission):
    """
    Custom permission to only allow the user who paid for the expense to view, edit, or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user making the request is the same as the user who paid for the expense.
        return obj.paid_by == request.user
