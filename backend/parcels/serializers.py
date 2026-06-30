from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Parcel
from products.models import Product

class ParcelParcelsSerializer(serializers.ModelSerializer):
    catalog_name = serializers.CharField(source='catalog_item.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True, default=None)
    category = serializers.CharField(source='catalog_item.category', read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'catalog_name', 'variety_name', 'category', 'price_per_kg', 'is_available']

class ParcelSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)
    opg_name = serializers.CharField(source='owner.opg.name', read_only=True, default='')
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    opg_rating = serializers.FloatField(source='owner.opg.rating', read_only=True, default=0.0)
    opg_rating_count = serializers.IntegerField(source='owner.opg.rating_count', read_only=True, default=0)
    products = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Parcel
        fields = ['id', 'name', 'area_sq_m', 'is_active', 'opg_name', 'owner_phone',
                  'opg_rating', 'opg_rating_count', 'products',
                  'lat', 'lng', 'latitude', 'longitude']
        read_only_fields = ['owner']

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_products(self, obj):
        active = obj.products.filter(is_available=True)
        return ParcelParcelsSerializer(active, many=True).data

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['location'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)