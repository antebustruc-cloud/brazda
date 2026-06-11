from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Parcel

class ParcelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Parcel
        geo_field = 'location'
        fields = ['id', 'name', 'area_sq_m', 'location', 'is_active']
        read_only_fields = ['owner']
        extra_kwargs = {
            'area_sq_m': {'required': False}
        }