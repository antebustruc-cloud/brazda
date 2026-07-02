from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Stand, StandSupplierRequest, StandInterest
from products.models import Product


class StandProductSerializer(serializers.ModelSerializer):
    catalog_name = serializers.CharField(source='catalog_item.name', read_only=True)
    catalog_item_id = serializers.IntegerField(source='catalog_item.id', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True, default=None)
    category = serializers.CharField(source='catalog_item.category', read_only=True)
    # Supplying OPG rating for this product on this stand
    supplier_opg_name = serializers.SerializerMethodField()
    supplier_opg_rating = serializers.SerializerMethodField()
    supplier_opg_id = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'catalog_name', 'catalog_item_id', 'variety_name', 'category',
            'price_per_kg', 'is_available',
            'supplier_opg_name', 'supplier_opg_rating', 'supplier_opg_id',
        ]

    def _approved_supplier(self, obj):
        """Find the approved supplier for this product on this stand."""
        stand = obj.stand if hasattr(obj, 'stand') else None
        if not stand:
            return None
        return StandSupplierRequest.objects.filter(
            stand=stand,
            catalog_item=obj.catalog_item,
            status='accepted',
        ).select_related('farmer__opg').first()

    def get_supplier_opg_name(self, obj):
        req = self._approved_supplier(obj)
        if req:
            try:
                return req.farmer.opg.name
            except Exception:
                pass
        return None

    def get_supplier_opg_rating(self, obj):
        req = self._approved_supplier(obj)
        if req:
            try:
                return req.farmer.opg.rating
            except Exception:
                pass
        return None

    def get_supplier_opg_id(self, obj):
        req = self._approved_supplier(obj)
        if req:
            try:
                return req.farmer.opg.id
            except Exception:
                pass
        return None


class StandSerializer(serializers.ModelSerializer):
    opg_name = serializers.CharField(source='owner.opg.name', read_only=True, default='')
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    latitude = serializers.SerializerMethodField(read_only=True)
    longitude = serializers.SerializerMethodField(read_only=True)
    products = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Stand
        fields = ['id', 'name', 'opg_name', 'address', 'is_active', 'created_at',
                  'lat', 'lng', 'latitude', 'longitude', 'products']
        read_only_fields = ['owner', 'created_at']

    def get_products(self, obj):
        active = obj.products.filter(is_available=True)
        return StandProductSerializer(active, many=True).data

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
    farmer_email = serializers.EmailField(source='farmer.email', read_only=True)
    farmer_opg_name = serializers.CharField(source='farmer.opg.name', read_only=True, default='')
    farmer_opg_rating = serializers.FloatField(source='farmer.opg.rating', read_only=True, default=0.0)
    stand_name = serializers.CharField(source='stand.name', read_only=True)
    catalog_item_name = serializers.CharField(source='catalog_item.name', read_only=True)

    class Meta:
        model = StandSupplierRequest
        fields = [
            'id', 'stand', 'stand_name', 'farmer', 'farmer_email',
            'farmer_opg_name', 'farmer_opg_rating',
            'catalog_item', 'catalog_item_name',
            'status', 'created_at', 'responded_at',
        ]
        read_only_fields = ['stand', 'farmer', 'created_at', 'responded_at']


class StandInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandInterest
        fields = ['id', 'stand', 'created_at']
        read_only_fields = ['id', 'created_at']
