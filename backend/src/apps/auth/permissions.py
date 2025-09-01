from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsSuperAdminOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['superadmin','admin']
    
class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['superadmin', 'admin']:
            return True
        return obj == request.user