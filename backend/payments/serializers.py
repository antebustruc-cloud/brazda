from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'farmer', 'buyer', 'parcel', 'stand', 'delivery_event',
            'amount', 'reference', 'buyer_email', 'is_confirmed', 'confirmed_at', 'created_at',
        ]
        read_only_fields = ['farmer', 'buyer', 'reference', 'is_confirmed', 'confirmed_at', 'created_at']
