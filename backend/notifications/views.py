from django.conf import settings
from datetime import timedelta

from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from parcels.models import Parcel
from stands.models import Stand
from delivery.models import DeliveryEvent
from users.permissions import IsSeller
from .models import (
    Notification, NotificationRead,
    AlertZone, NotificationRequest, WebPushSubscription, DeliveryInterest,
)
from .serializers import (
    NotificationSerializer, AlertZoneSerializer,
    NotificationRequestSerializer, DeliveryInterestSerializer,
)

CHANNEL_MODELS = {
    'parcel': Parcel,
    'stand': Stand,
    'delivery_event': DeliveryEvent,
}


# ─── Legacy pull-based (feature-flagged off, kept for compatibility) ─────────

class SendNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def post(self, request):
        if not settings.NOTIFICATIONS_ENABLED:
            return Response(
                {'detail': "Notifications are not live yet."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({'detail': 'Use NotificationRequestView instead.'}, status=status.HTTP_400_BAD_REQUEST)


class NearbyNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if not lat or not lng:
            return Response({'detail': 'lat and lng are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            buyer_location = Point(float(lng), float(lat), srid=4326)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid lat/lng.'}, status=status.HTTP_400_BAD_REQUEST)
        candidates = Notification.objects.filter(
            expires_at__gt=timezone.now(),
            origin__distance_lte=(buyer_location, 50000),
        ).annotate(distance=Distance('origin', buyer_location)).select_related(
            'farmer__opg', 'stand', 'parcel', 'delivery_event'
        ).order_by('distance')
        nearby = [n for n in candidates if n.distance.km <= n.radius_km]
        read_ids = set(NotificationRead.objects.filter(
            buyer=request.user, notification__in=nearby
        ).values_list('notification_id', flat=True))
        return Response(NotificationSerializer(nearby, many=True, context={'read_notification_ids': read_ids}).data)


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        NotificationRead.objects.get_or_create(notification=notification, buyer=request.user)
        return Response({'status': 'ok'})


# ─── Alert Zones (buyer's saved locations) ───────────────────────────────────

class AlertZoneListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        zones = AlertZone.objects.filter(buyer=request.user).order_by('created_at')
        return Response(AlertZoneSerializer(zones, many=True).data)

    def post(self, request):
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        label = (request.data.get('label') or '').strip()
        if not lat or not lng or not label:
            return Response({'detail': 'label, lat and lng are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            location = Point(float(lng), float(lat), srid=4326)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid lat/lng.'}, status=status.HTTP_400_BAD_REQUEST)
        zone = AlertZone.objects.create(buyer=request.user, label=label, location=location)
        return Response(AlertZoneSerializer(zone).data, status=status.HTTP_201_CREATED)


class AlertZoneDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            zone = AlertZone.objects.get(pk=pk, buyer=request.user)
        except AlertZone.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        zone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Notification Requests (farmer submits, admin approves) ──────────────────

class NotificationRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        """Farmer sees their own past requests and their status/counts."""
        requests_qs = NotificationRequest.objects.filter(farmer=request.user).order_by('-created_at')
        return Response(NotificationRequestSerializer(requests_qs, many=True).data)

    def post(self, request):
        channel_type = request.data.get('channel_type')
        channel_id = request.data.get('channel_id')
        model = CHANNEL_MODELS.get(channel_type)
        if not model or not channel_id:
            return Response({'detail': 'channel_type and channel_id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            channel = model.objects.get(pk=channel_id)
        except model.DoesNotExist:
            return Response({'detail': 'Channel not found.'}, status=status.HTTP_404_NOT_FOUND)
        if channel.owner != request.user:
            return Response({'detail': "That's not your channel."}, status=status.HTTP_403_FORBIDDEN)
        try:
            radius_km = float(request.data.get('radius_km', 3))
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid radius.'}, status=status.HTTP_400_BAD_REQUEST)
        if radius_km <= 0 or radius_km > 50:
            return Response({'detail': 'Radius must be 1–50 km.'}, status=status.HTTP_400_BAD_REQUEST)

        origin = channel.destination if channel_type == 'delivery_event' else channel.location

        nr = NotificationRequest.objects.create(
            farmer=request.user,
            radius_km=radius_km,
            message=(request.data.get('message') or '')[:200],
            origin=origin,
            status=NotificationRequest.STATUS_PENDING,
            **{channel_type: channel},
        )
        return Response(NotificationRequestSerializer(nr).data, status=status.HTTP_201_CREATED)


# ─── Web Push subscription storage ───────────────────────────────────────────

class WebPushSubscriptionView(APIView):
    """
    Browser posts its PushSubscription JSON here after calling
    navigator.serviceWorker.ready.then(sw => sw.pushManager.subscribe(...)).
    Called once per device; updates on re-subscribe.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        sub_json = request.data.get('subscription')
        if not sub_json:
            return Response({'detail': 'subscription is required.'}, status=status.HTTP_400_BAD_REQUEST)
        import json
        sub_str = json.dumps(sub_json) if isinstance(sub_json, dict) else sub_json
        ua = request.META.get('HTTP_USER_AGENT', '')[:300]
        # Upsert by endpoint so a re-subscribe updates rather than duplicates
        endpoint = sub_json.get('endpoint', '') if isinstance(sub_json, dict) else ''
        existing = WebPushSubscription.objects.filter(
            user=request.user,
            subscription_json__contains=endpoint[:100],
        ).first() if endpoint else None
        if existing:
            existing.subscription_json = sub_str
            existing.user_agent = ua
            existing.save()
            obj = existing
        else:
            obj = WebPushSubscription.objects.create(
                user=request.user, subscription_json=sub_str, user_agent=ua
            )
        return Response({'id': obj.id, 'status': 'ok'}, status=status.HTTP_201_CREATED)


# ─── Delivery Interest ("I'm interested" button) ─────────────────────────────

class DeliveryInterestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, delivery_event_id):
        try:
            event = DeliveryEvent.objects.get(pk=delivery_event_id)
        except DeliveryEvent.DoesNotExist:
            return Response({'detail': 'Delivery event not found.'}, status=status.HTTP_404_NOT_FOUND)
        interest, created = DeliveryInterest.objects.get_or_create(
            buyer=request.user, delivery_event=event
        )
        return Response({'id': interest.id, 'created': created}, status=status.HTTP_201_CREATED)


class DeliveryInterestListView(APIView):
    """Farmer sees who expressed interest in their delivery events."""
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request, delivery_event_id):
        try:
            event = DeliveryEvent.objects.get(pk=delivery_event_id, owner=request.user)
        except DeliveryEvent.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        interests = DeliveryInterest.objects.filter(
            delivery_event=event
        ).select_related('buyer').order_by('-created_at')
        return Response(DeliveryInterestSerializer(interests, many=True).data)
