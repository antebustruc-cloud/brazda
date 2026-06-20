from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    catalog_name = serializers.CharField(source='catalog_item.name', read_only=True)
    variety_name = serializers.CharField(source='variety.name', read_only=True, default=None)
    category = serializers.CharField(source='catalog_item.category', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'catalog_item', 'catalog_name', 'variety', 'variety_name',
            'category', 'description', 'price_per_kg',
            'is_available', 'parcel', 'stand', 'created_at'
        ]
        read_only_fields = ['seller', 'created_at']