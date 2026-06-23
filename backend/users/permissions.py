from rest_framework.permissions import BasePermission


class IsSeller(BasePermission):
    """
    Restricts a view to users registered as sellers (farmers).
    Buyer-only accounts have no OPG and shouldn't be able to create or
    manage fields, stands, delivery events, or products on them.
    """
    message = "This is for sellers (farmers) only."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_seller)
