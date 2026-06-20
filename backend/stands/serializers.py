from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Stand, StandSupplierRequest
from products.models import Product

class ParcelStandsSerializer(serializers.ModelSerializer):
    catalog_name = serializers.CharField(source='catalog_item.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True, default=None)
    category = serializers.CharField(source='catalog_item.category', read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'catalog_name', 'variety_name', 'category', 'price_per_kg', 'is_available']

class StandSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)
    products = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Stand
        fields = ['id', 'name', 'owner_username', 'address', 'is_active', 'created_at',
                  'lat', 'lng', 'latitude', 'longitude', 'products']
        read_only_fields = ['owner', 'created_at']

    def get_products(self, obj):
        active = obj.products.filter(is_available=True)
        return ParcelStandsSerializer(active, many=True).data

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