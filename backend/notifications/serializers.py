from rest_framework import serializers
from .models import Notification


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
