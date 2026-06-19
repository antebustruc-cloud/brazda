from django.contrib import admin
from .models import ProductCatalog, ProductVariety

class VarietyInline(admin.TabularInline):
    model = ProductVariety
    extra = 1

class ProductCatalogAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    inlines = [VarietyInline]

admin.site.register(ProductCatalog, ProductCatalogAdmin)