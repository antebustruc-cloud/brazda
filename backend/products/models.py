from django.db import models
from users.models import User
from parcels.models import Parcel
from stands.models import Stand
from catalog.models import ProductCatalog, ProductVariety

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('fruit', 'Fruit'),
        ('vegetable', 'Vegetable'),
        ('herb', 'Herb'),
        ('other', 'Other'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    parcel = models.ForeignKey(Parcel, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    stand = models.ForeignKey(Stand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    catalog_item = models.ForeignKey(ProductCatalog, on_delete=models.PROTECT, null=True, blank=True, related_name='listings')
    variety = models.ForeignKey(ProductVariety, on_delete=models.SET_NULL, null=True, blank=True, related_name='listings')
    name = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, blank=True)
    description = models.TextField(blank=True)
    price_per_kg = models.DecimalField(max_digits=6, decimal_places=2)
    ready_from = models.DateField(null=True, blank=True)
    ready_until = models.DateField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        label = self.catalog_item.name if self.catalog_item else self.name
        return f"{label} by {self.seller.username}"

# Create your models here.
