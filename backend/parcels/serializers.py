from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Parcel

class ParcelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Parcel
        geo_field = 'location'
        fields = ['id', 'name', 'owner', 'area_sq_m', 'location']