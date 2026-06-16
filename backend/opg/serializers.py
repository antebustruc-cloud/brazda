from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import OPG

class OPGSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OPG
        fields = ['id', 'name', 'mibpg', 'rating', 'rating_count', 'lat', 'lng', 'latitude', 'longitude']
        read_only_fields = ['owner', 'rating', 'rating_count']

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None