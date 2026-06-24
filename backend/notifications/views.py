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
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer

CHANNEL_MODELS = {
    'parcel': Parcel,
    'stand': Stand,
    'delivery_event': DeliveryEvent,
}


class SendNotificationView(APIView):
    """Farmer announces a stand/field/delivery is open, to buyers within radius_km."""
    permission_classes = [permissions.IsAuthenticated, IsSeller]

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
            return Response({'detail': "That's not your field/stand/delivery event."}, status=status.HTTP_403_FORBIDDEN)

        try:
            radius_km = float(request.data.get('radius_km', 3))
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid radius.'}, status=status.HTTP_400_BAD_REQUEST)
        if radius_km <= 0 or radius_km > 50:
            return Response({'detail': 'Radius must be between 0 and 50km.'}, status=status.HTTP_400_BAD_REQUEST)

        origin = channel.destination if channel_type == 'delivery_event' else channel.location

        notification = Notification.objects.create(
            farmer=request.user,
            radius_km=radius_km,
            message=(request.data.get('message') or '')[:200],
            origin=origin,
            expires_at=timezone.now() + timedelta(hours=24),
            **{channel_type: channel},
        )
        return Response(NotificationSerializer(notification).data, status=status.HTTP_201_CREATED)


class NearbyNotificationsView(APIView):
    """Buyer fetches active announcements within range of their current location."""
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

        # A notification is relevant if the buyer is within ITS radius of the origin.
        # We can't know that per-row in a single filter (radius varies per row), so
        # filter generously first (50km cap), then check the real per-row radius.
        candidates = Notification.objects.filter(
            expires_at__gt=timezone.now(),
            origin__distance_lte=(buyer_location, 50000),
        ).annotate(
            distance=Distance('origin', buyer_location)
        ).select_related('farmer__opg', 'stand', 'parcel', 'delivery_event').order_by('distance')

        nearby = [n for n in candidates if n.distance.km <= n.radius_km]

        read_ids = set(
            NotificationRead.objects.filter(buyer=request.user, notification__in=nearby)
            .values_list('notification_id', flat=True)
        )

        serializer = NotificationSerializer(
            nearby, many=True, context={'read_notification_ids': read_ids}
        )
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        NotificationRead.objects.get_or_create(notification=notification, buyer=request.user)
        return Response({'status': 'ok'})
