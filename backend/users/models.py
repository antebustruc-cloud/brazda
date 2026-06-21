from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_buyer = models.BooleanField(default=True)
    is_seller = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    bio = models.TextField(blank=True)
    allows_self_pick = models.BooleanField(default=False)
    delivery_available = models.BooleanField(default=False)
    delivery_radius_km = models.FloatField(default=0)
    has_stand = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - Seller"