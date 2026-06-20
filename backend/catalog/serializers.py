from rest_framework import serializers
from .models import ProductCatalog, ProductVariety

class VarietySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariety
        fields = ['id', 'name']

class CatalogSerializer(serializers.ModelSerializer):
    varieties = VarietySerializer(many=True, read_only=True)

    class Meta:
        model = ProductCatalog
        fields = ['id', 'name', 'category', 'image', 'varieties']