from rest_framework import serializers
from .models import Stand, StandSupplierRequest

class StandSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Stand
        fields = ['id', 'name', 'owner_username', 'location', 'address', 'is_active', 'created_at']
        read_only_fields = ['owner', 'created_at']

class StandSupplierRequestSerializer(serializers.ModelSerializer):
    farmer_username = serializers.CharField(source='farmer.username', read_only=True)
    stand_name = serializers.CharField(source='stand.name', read_only=True)

    class Meta:
        model = StandSupplierRequest
        fields = ['id', 'stand', 'stand_name', 'farmer_username', 'status', 'created_at']
        read_only_fields = ['farmer', 'created_at']
