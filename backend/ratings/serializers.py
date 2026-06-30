from rest_framework import serializers
from .models import OPGRating, ProductRating, BuyerRating, FieldInterest


class OPGRatingSerializer(serializers.ModelSerializer):
    opg_name = serializers.CharField(source='opg.name', read_only=True)
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)

    class Meta:
        model = OPGRating
        fields = ['id', 'opg', 'opg_name', 'buyer_email', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'buyer_email', 'created_at', 'updated_at']


class ProductRatingSerializer(serializers.ModelSerializer):
    catalog_item_name = serializers.CharField(source='catalog_item.name', read_only=True)

    class Meta:
        model = ProductRating
        fields = ['id', 'opg', 'catalog_item', 'catalog_item_name', 'score', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BuyerRatingSerializer(serializers.ModelSerializer):
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)
    buyer_name = serializers.SerializerMethodField()

    class Meta:
        model = BuyerRating
        fields = ['id', 'buyer', 'buyer_email', 'buyer_name', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'buyer_email', 'buyer_name', 'created_at', 'updated_at']

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.email


class PendingSurveySerializer(serializers.Serializer):
    """
    Describes a pending rating survey (to be shown lazily in the frontend
    48h after the buyer expressed interest).
    """
    type = serializers.CharField()          # "field" or "delivery"
    interest_id = serializers.IntegerField()
    opg_id = serializers.IntegerField()
    opg_name = serializers.CharField()
    channel_name = serializers.CharField()  # parcel.name or delivery_event.name
    products = serializers.ListField(child=serializers.DictField())


class PendingBuyerRatingSerializer(serializers.Serializer):
    """
    A buyer that a farmer hasn't rated yet but should (expressed interest >48h ago).
    """
    interest_type = serializers.CharField()   # "field" or "delivery"
    interest_id = serializers.IntegerField()
    buyer_id = serializers.IntegerField()
    buyer_name = serializers.CharField()
    buyer_email = serializers.CharField()
    buyer_phone = serializers.CharField()
    channel_name = serializers.CharField()
    interested_at = serializers.DateTimeField()
