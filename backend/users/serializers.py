from rest_framework import serializers
from django.contrib.gis.geos import Point
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User, SellerProfile
from opg.models import OPG

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_buyer', 'is_seller', 'phone']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    opg_name = serializers.CharField(write_only=True, required=False)
    mibpg = serializers.CharField(write_only=True, required=False)
    opg_lat = serializers.FloatField(write_only=True, required=False)
    opg_lng = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'password', 'is_buyer', 'is_seller', 'phone',
                  'opg_name', 'mibpg', 'opg_lat', 'opg_lng']

    def validate(self, data):
        if data.get('is_seller'):
            if not data.get('opg_name') or not data.get('mibpg') or data.get('opg_lat') is None or data.get('opg_lng') is None:
                raise serializers.ValidationError("Sellers must provide OPG name, MIBPG, and location.")
            if not data.get('phone'):
                raise serializers.ValidationError("Sellers must provide a phone number.")
        return data

    def create(self, validated_data):
        opg_name = validated_data.pop('opg_name', None)
        mibpg = validated_data.pop('mibpg', None)
        opg_lat = validated_data.pop('opg_lat', None)
        opg_lng = validated_data.pop('opg_lng', None)

        # username silently mirrors email
        validated_data['username'] = validated_data['email']

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

class EmailTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('No account with this email.')
        user = authenticate(username=user.username, password=password)
        if not user:
            raise serializers.ValidationError('Wrong email or password.')
        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }