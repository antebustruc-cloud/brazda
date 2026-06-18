from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Stand, StandSupplierRequest

class StandSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Stand
        fields = ['id', 'name', 'owner_username', 'address', 'is_active', 'created_at',
                  'lat', 'lng', 'latitude', 'longitude']
        read_only_fields = ['owner', 'created_at']

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['location'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)


class StandSupplierRequestSerializer(serializers.ModelSerializer):
    farmer_username = serializers.CharField(source='farmer.username', read_only=True)
    stand_name = serializers.CharField(source='stand.name', read_only=True)

    class Meta:
        model = StandSupplierRequest
        fields = ['id', 'stand', 'stand_name', 'farmer_username', 'status', 'created_at']
        read_only_fields = ['farmer', 'created_at']