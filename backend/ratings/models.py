from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    """Legacy generic rater->rated_user model - kept for compatibility."""
    RATING_CHOICES = [(i, i) for i in range(1, 6)]
    rater = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings_given')
    rated_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings_received')
    score = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('rater', 'rated_user')

    def __str__(self):
        return f"{self.rater.username} rated {self.rated_user.username}: {self.score}⭐"


# ─── Interest tracking (triggers the 48h survey) ──────────────────────────────

class FieldInterest(models.Model):
    """
    Buyer taps "I'm interested" on a field/parcel listing.
    48h later, next time they open the app, they get the rating survey.
    unique_together prevents duplicate presses.
    surveyed_at = when the survey was shown (regardless of their answer).
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='field_interests',
    )
    parcel = models.ForeignKey('parcels.Parcel', on_delete=models.CASCADE, related_name='interests')
    created_at = models.DateTimeField(auto_now_add=True)
    surveyed_at = models.DateTimeField(null=True, blank=True, help_text="Set when the survey prompt is dismissed (any answer)")

    class Meta:
        unique_together = ('buyer', 'parcel')

    def __str__(self):
        return f"{self.buyer.email} → {self.parcel.name}"


# ─── OPG-level rating ─────────────────────────────────────────────────────────

class OPGRating(models.Model):
    """
    One rating per buyer+OPG pair, updatable.
    The OPG.rating and OPG.rating_count denormalised fields are recalculated
    every time a rating is saved or deleted (via post_save/post_delete signals
    at the bottom of this file).
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opg_ratings_given',
    )
    opg = models.ForeignKey('opg.OPG', on_delete=models.CASCADE, related_name='ratings')
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('buyer', 'opg')

    def __str__(self):
        return f"{self.buyer.email} → {self.opg.name}: {self.score}⭐"


# ─── Product rating ───────────────────────────────────────────────────────────

class ProductRating(models.Model):
    """
    One rating per buyer+OPG+catalog_item triple, updatable.
    Tied to the OPG (not the stand or channel) because the same product from
    the same farm is the same thing regardless of where you bought it.
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='product_ratings_given',
    )
    opg = models.ForeignKey('opg.OPG', on_delete=models.CASCADE, related_name='product_ratings')
    catalog_item = models.ForeignKey('catalog.ProductCatalog', on_delete=models.CASCADE, related_name='ratings')
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('buyer', 'opg', 'catalog_item')

    def __str__(self):
        return f"{self.buyer.email} → {self.opg.name}/{self.catalog_item.name}: {self.score}⭐"


# ─── Farmer rates buyer ───────────────────────────────────────────────────────

class BuyerRating(models.Model):
    """
    Farmer rates a buyer after a transaction/visit.
    One rating per farmer+buyer pair, updatable.
    Shown in the farmer's seller dashboard as a queue of pending ratings
    (any buyer who expressed interest and is >48h old, not yet rated).
    """
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_ratings_given',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_ratings_received',
    )
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('farmer', 'buyer')

    def __str__(self):
        return f"{self.farmer.email} rated buyer {self.buyer.email}: {self.score}⭐"


# ─── Signals: keep OPG.rating + OPG.rating_count in sync ─────────────────────

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg


def _recalculate_opg_rating(opg):
    result = OPGRating.objects.filter(opg=opg).aggregate(avg=Avg('score'), count=models.Count('id'))
    opg.rating = round(result['avg'] or 0.0, 2)
    opg.rating_count = result['count'] or 0
    opg.save(update_fields=['rating', 'rating_count'])


@receiver(post_save, sender=OPGRating)
def opg_rating_saved(sender, instance, **kwargs):
    _recalculate_opg_rating(instance.opg)


@receiver(post_delete, sender=OPGRating)
def opg_rating_deleted(sender, instance, **kwargs):
    _recalculate_opg_rating(instance.opg)
