from django.db import models

from django.db import models
from users.models import User
from parcels.models import Parcel

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('fruit', 'Fruit'),
        ('vegetable', 'Vegetable'),
        ('herb', 'Herb'),
        ('other', 'Other'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    parcel = models.ForeignKey(Parcel, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    price_per_kg = models.DecimalField(max_digits=6, decimal_places=2)
    ready_from = models.DateField()
    ready_until = models.DateField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.seller.username}"

# Create your models here.
