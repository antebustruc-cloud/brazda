from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Stand, StandSupplierRequest, StandInterest


@admin.register(Stand)
class StandAdmin(GISModelAdmin):
    list_display = ['id', 'name', 'owner', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'owner__email']


@admin.register(StandSupplierRequest)
class StandSupplierRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'stand', 'farmer_email', 'catalog_item', 'status', 'created_at', 'responded_at']
    list_filter = ['status', 'created_at']
    search_fields = ['stand__name', 'farmer__email', 'catalog_item__name']
    readonly_fields = ['created_at', 'responded_at']

    def farmer_email(self, obj):
        return obj.farmer.email
    farmer_email.short_description = 'Farmer'


@admin.register(StandInterest)
class StandInterestAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'stand', 'created_at', 'surveyed_at']
    list_filter = ['created_at']
    search_fields = ['buyer__email', 'stand__name']
