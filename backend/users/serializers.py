from rest_framework import serializers
from .models import User, SellerProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_buyer', 'is_seller', 'phone']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'is_buyer', 'is_seller', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.is_seller:
            SellerProfile.objects.create(user=user)
        return user

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = '__all__'
