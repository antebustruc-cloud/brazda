from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Parcel
from products.models import Product

class ParcelProductSerializer(serializers.ModelSerializer):
    catalog_name = serializers.CharField(source='catalog_item.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True, default=None)
    class Meta:
        model = Product
        fields = ['id', 'catalog_name', 'variety_name', 'price_per_kg', 'is_available']

class ParcelSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    products = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Parcel
        fields = ['id', 'name', 'area_sq_m', 'is_active', 'owner_username', 'products',
                  'lat', 'lng', 'latitude', 'longitude']
        read_only_fields = ['owner']

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_products(self, obj):
        active = obj.products.filter(is_available=True)
        return ParcelProductSerializer(active, many=True).data

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['location'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['location'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)