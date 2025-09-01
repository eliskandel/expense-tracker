from rest_framework import permissions

class IsExpenseAccessible(permissions.BasePermission):
    """
    - If expense is simple (no group), only the creator can access.
    - If expense is group-based, only members of that group can access.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Case 1: Simple expense (no group linked)
        if obj.group is None:
            return obj.created_by == request.user

        # Case 2: Group expense
        return obj.group.members.filter(id=request.user.id).exists()