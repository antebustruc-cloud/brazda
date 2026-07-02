from django.contrib.gis.db import models
from django.conf import settings

class Stand(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stands'
    )
    name = models.CharField(max_length=100)
    location = models.PointField()
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.owner.username}"


class StandSupplierRequest(models.Model):
    """
    Stand owner asks a farmer "can I sell your X on my stand?".
    Per-product: one request per stand + farmer + catalog_item triple.
    Once approved, that farmer's OPG rating shows on this stand's listing
    for that product, and any buyer rating for that item at this stand is
    attributed to the supplying OPG (not the stand owner).
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    stand = models.ForeignKey(Stand, on_delete=models.CASCADE, related_name='supplier_requests')
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='supplier_requests'
    )
    catalog_item = models.ForeignKey(
        'catalog.ProductCatalog',
        on_delete=models.CASCADE,
        related_name='supplier_requests',
        help_text="The specific product the stand wants to sell from this farmer",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('stand', 'farmer', 'catalog_item')

    def __str__(self):
        return f"{self.stand.name} ← {self.farmer.username} [{self.catalog_item.name}] ({self.status})"


class StandInterest(models.Model):
    """
    Buyer taps "I'm interested" on a stand listing.
    48h later, next time they open the app, the rating survey fires.
    The survey asks what they bought and routes ratings to the supplying OPG
    for each product (via the approved StandSupplierRequest chain).
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stand_interests',
    )
    stand = models.ForeignKey(Stand, on_delete=models.CASCADE, related_name='interests')
    created_at = models.DateTimeField(auto_now_add=True)
    surveyed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('buyer', 'stand')

    def __str__(self):
        return f"{self.buyer.email} → {self.stand.name}"
