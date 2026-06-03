from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'description',
            'price_per_kg', 'ready_from', 'ready_until',
            'is_available', 'parcel', 'created_at'
        ]
        read_only_fields = ['seller', 'created_at']
