from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'buyer_username', 'parcel', 'product', 'product_name',
            'status', 'visit_date', 'estimated_kg', 'total_price', 'notes', 'created_at'
        ]
        read_only_fields = ['buyer', 'total_price', 'created_at']
