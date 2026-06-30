from django.contrib import admin
from .models import Rating, FieldInterest, OPGRating, ProductRating, BuyerRating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'rater', 'rated_user', 'score', 'created_at']


@admin.register(FieldInterest)
class FieldInterestAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'parcel', 'created_at', 'surveyed_at']
    list_filter = ['created_at']
    search_fields = ['buyer__email', 'parcel__name']


@admin.register(OPGRating)
class OPGRatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'opg', 'score', 'created_at', 'updated_at']
    list_filter = ['score', 'created_at']
    search_fields = ['buyer__email', 'opg__name']


@admin.register(ProductRating)
class ProductRatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'opg', 'catalog_item', 'score', 'updated_at']
    list_filter = ['score']
    search_fields = ['buyer__email', 'opg__name', 'catalog_item__name']


@admin.register(BuyerRating)
class BuyerRatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'farmer', 'buyer', 'score', 'created_at']
    list_filter = ['score', 'created_at']
    search_fields = ['farmer__email', 'buyer__email']
