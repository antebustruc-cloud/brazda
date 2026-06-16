from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import User, SellerProfile
from opg.models import OPG

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_buyer', 'is_seller', 'phone']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    opg_name = serializers.CharField(write_only=True, required=False)
    mibpg = serializers.CharField(write_only=True, required=False)
    opg_lat = serializers.FloatField(write_only=True, required=False)
    opg_lng = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'is_buyer', 'is_seller', 'phone',
                  'opg_name', 'mibpg', 'opg_lat', 'opg_lng']

    def validate(self, data):
        if data.get('is_seller'):
            if not data.get('opg_name') or not data.get('mibpg') or data.get('opg_lat') is None or data.get('opg_lng') is None:
                raise serializers.ValidationError("Sellers must provide OPG name, MIBPG, and location.")
        return data

    def create(self, validated_data):
        opg_name = validated_data.pop('opg_name', None)
        mibpg = validated_data.pop('mibpg', None)
        opg_lat = validated_data.pop('opg_lat', None)
        opg_lng = validated_data.pop('opg_lng', None)

        user = User.objects.create_user(**validated_data)

        if user.is_seller:
            SellerProfile.objects.create(user=user)
            OPG.objects.create(
                owner=user,
                name=opg_name,
                mibpg=mibpg,
                location=Point(opg_lng, opg_lat, srid=4326)
            )
        return user

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = '__all__'