from django.contrib.gis import admin
from .models import Parcel

@admin.register(Parcel)
class ParcelAdmin(admin.GISModelAdmin):
    list_display = ('name', 'owner', 'area_sq_m')
