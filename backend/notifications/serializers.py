from rest_framework import serializers
from .models import Notification, AlertZone, NotificationRequest, DeliveryInterest


class NotificationSerializer(serializers.ModelSerializer):
    opg_name = serializers.CharField(source='farmer.opg.name', read_only=True, default='')
    channel_type = serializers.CharField(read_only=True)
    channel_name = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'opg_name', 'channel_type', 'channel_name', 'message',
            'radius_km', 'distance_km', 'created_at', 'expires_at', 'is_read',
        ]

    def get_channel_name(self, obj):
        channel = obj.channel
        return getattr(channel, 'name', None) if channel else None

    def get_distance_km(self, obj):
        distance = getattr(obj, 'distance', None)
        return round(distance.km, 2) if distance is not None else None

    def get_is_read(self, obj):
        read_ids = self.context.get('read_notification_ids', set())
        return obj.id in read_ids


class AlertZoneSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = AlertZone
        fields = ['id', 'label', 'lat', 'lng', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_lat(self, obj):
        return obj.location.y

    def get_lng(self, obj):
        return obj.location.x

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        lat = self.initial_data.get('lat')
        lng = self.initial_data.get('lng')
        validated_data['location'] = Point(float(lng), float(lat), srid=4326)
        return super().create(validated_data)


class NotificationRequestSerializer(serializers.ModelSerializer):
    channel_type = serializers.CharField(read_only=True)

    class Meta:
        model = NotificationRequest
        fields = [
            'id', 'channel_type', 'radius_km', 'message',
            'status', 'matched_count', 'delivered_count', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'matched_count', 'delivered_count', 'created_at']


class DeliveryInterestSerializer(serializers.ModelSerializer):
    buyer_name = serializers.SerializerMethodField()
    buyer_phone = serializers.CharField(source='buyer.phone', read_only=True)

    class Meta:
        model = DeliveryInterest
        fields = ['id', 'buyer_name', 'buyer_phone', 'delivery_event', 'created_at']
        read_only_fields = ['id', 'buyer_name', 'buyer_phone', 'created_at']

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.email
