from django.db import models
from django.conf import settings


class Transaction(models.Model):
    """
    A proof-of-sale record. Created when a farmer generates a HUB-3A payment
    barcode, confirmed when the farmer presses "Payment confirmed" after the
    buyer actually pays (via the buyer's own m-banking app, scanning the
    barcode). Confirmation is intentionally one-sided: the farmer confirms
    his OWN incoming money, which he wants to do correctly since it's his
    income record. He has no incentive to confirm a sale that didn't happen.

    This is the gate for ratings (Phase 2): a rating may only be created
    against a confirmed Transaction.
    """
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions_as_farmer',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions_as_buyer',
    )

    # Exactly one of these should be set - which channel this sale happened on.
    parcel = models.ForeignKey('parcels.Parcel', null=True, blank=True, on_delete=models.SET_NULL, related_name='transactions')
    stand = models.ForeignKey('stands.Stand', null=True, blank=True, on_delete=models.SET_NULL, related_name='transactions')
    delivery_event = models.ForeignKey('delivery.DeliveryEvent', null=True, blank=True, on_delete=models.SET_NULL, related_name='transactions')

    amount = models.DecimalField(max_digits=8, decimal_places=2, default=1.00)
    reference = models.CharField(max_length=22, blank=True)
    buyer_email = models.EmailField(blank=True, help_text="Optional - if set, a receipt PDF is emailed here on confirmation")

    is_confirmed = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = 'confirmed' if self.is_confirmed else 'pending'
        return f"€{self.amount} - {self.farmer.email} ({status})"
