from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import DeliveryEvent

class DeliveryEventSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliveryEvent
        fields = ['id', 'name', 'owner_username', 'radius_km', 'delivery_date',
                  'time_from', 'time_until', 'is_active', 'created_at',
                  'lat', 'lng', 'latitude', 'longitude']
        read_only_fields = ['owner', 'created_at']

    def get_latitude(self, obj):
        return obj.destination.y if obj.destination else None

    def get_longitude(self, obj):
        return obj.destination.x if obj.destination else None

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['destination'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)