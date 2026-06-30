from django.urls import path
from .views import (
    SendNotificationView, NearbyNotificationsView, MarkNotificationReadView,
    AlertZoneListCreateView, AlertZoneDeleteView,
    NotificationRequestView,
    WebPushSubscriptionView,
    DeliveryInterestView, DeliveryInterestListView,
)

urlpatterns = [
    # Legacy pull-based (still wired, just returns 403 while flag is off)
    path('send/', SendNotificationView.as_view(), name='notification-send'),
    path('nearby/', NearbyNotificationsView.as_view(), name='notification-nearby'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),

    # Alert zones (buyer CRUD)
    path('alert-zones/', AlertZoneListCreateView.as_view(), name='alert-zone-list'),
    path('alert-zones/<int:pk>/', AlertZoneDeleteView.as_view(), name='alert-zone-delete'),

    # Notification requests (farmer submits, admin approves)
    path('requests/', NotificationRequestView.as_view(), name='notification-request'),

    # Web push subscription storage
    path('push-subscribe/', WebPushSubscriptionView.as_view(), name='push-subscribe'),

    # Delivery interest
    path('delivery-interest/<int:delivery_event_id>/', DeliveryInterestView.as_view(), name='delivery-interest'),
    path('delivery-leads/<int:delivery_event_id>/', DeliveryInterestListView.as_view(), name='delivery-leads'),
]
