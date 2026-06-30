from datetime import timedelta
from django.contrib.gis.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """
    Legacy pull-based model (Phase 2, feature-flagged off).
    The real push notification flow now goes through NotificationRequest.
    """
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications',
    )
    parcel = models.ForeignKey('parcels.Parcel', null=True, blank=True, on_delete=models.CASCADE, related_name='notifications')
    stand = models.ForeignKey('stands.Stand', null=True, blank=True, on_delete=models.CASCADE, related_name='notifications')
    delivery_event = models.ForeignKey('delivery.DeliveryEvent', null=True, blank=True, on_delete=models.CASCADE, related_name='notifications')

    origin = models.PointField(help_text="Snapshot of the channel's location at send time")
    radius_km = models.FloatField(default=3)
    message = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def channel(self):
        return self.stand or self.parcel or self.delivery_event

    @property
    def channel_type(self):
        if self.stand_id:
            return 'stand'
        if self.parcel_id:
            return 'parcel'
        if self.delivery_event_id:
            return 'delivery_event'
        return None

    def __str__(self):
        return f"{self.farmer.email} -> {self.radius_km}km ({self.created_at:%Y-%m-%d %H:%M})"


class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='reads')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_reads')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('notification', 'buyer')


# ─── New push-ready architecture ──────────────────────────────────────────────

class AlertZone(models.Model):
    """
    A buyer's saved "tell me about stuff near here" location.
    One buyer can have multiple (home, work, holiday house, etc.).
    When a NotificationRequest is approved, we match against every buyer's
    AlertZones that fall within the notification's radius.
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alert_zones',
    )
    label = models.CharField(max_length=60, help_text="e.g. Home, Work, Grandma's village")
    location = models.PointField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.buyer.email} – {self.label}"


class WebPushSubscription(models.Model):
    """
    Stores the browser's Web Push subscription object per user per device.
    The `subscription_json` field holds the raw JSON from navigator.serviceWorker
    (endpoint + keys). Populated from the frontend after Firebase setup.
    One user can have multiple active subscriptions (phone + laptop, etc.).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
    )
    subscription_json = models.TextField(help_text="Raw PushSubscription JSON from the browser")
    user_agent = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} ({self.created_at:%Y-%m-%d})"


class NotificationRequest(models.Model):
    """
    Farmer requests to push a "we're open" announcement to buyers in their area.
    Sits as pending until approved via Django admin (manual now, payment-triggered later).
    On approval: matched_count is calculated from AlertZones, then push is delivered
    (once Firebase VAPID keys are configured), and delivered_count is recorded.
    """
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_SENT = 'sent'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SENT, 'Sent'),
    ]

    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_requests',
    )
    parcel = models.ForeignKey('parcels.Parcel', null=True, blank=True, on_delete=models.SET_NULL, related_name='notification_requests')
    stand = models.ForeignKey('stands.Stand', null=True, blank=True, on_delete=models.SET_NULL, related_name='notification_requests')
    delivery_event = models.ForeignKey('delivery.DeliveryEvent', null=True, blank=True, on_delete=models.SET_NULL, related_name='notification_requests')

    origin = models.PointField(help_text="Snapshot of the channel's location at submit time")
    radius_km = models.FloatField(default=3)
    message = models.CharField(max_length=200, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)

    # Calculated when approved - how many buyers' alert zones fall within the radius
    matched_count = models.IntegerField(default=0)
    # Recorded after sending - successful push handoffs
    delivered_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=200, blank=True)

    @property
    def channel_type(self):
        if self.stand_id:
            return 'stand'
        if self.parcel_id:
            return 'parcel'
        if self.delivery_event_id:
            return 'delivery_event'
        return None

    def compute_matched_count(self):
        """How many buyers' alert zones fall within this notification's radius."""
        from django.contrib.gis.geos import Point
        from django.contrib.gis.measure import D
        count = AlertZone.objects.filter(
            location__distance_lte=(self.origin, D(km=self.radius_km))
        ).values('buyer').distinct().count()
        return count

    def __str__(self):
        return f"{self.farmer.email} [{self.status}] ({self.created_at:%Y-%m-%d %H:%M})"


class DeliveryInterest(models.Model):
    """
    Recorded when a buyer taps "I'm interested" on a delivery event listing.
    Gives the farmer a lead list: who to expect, contact info, when they expressed interest.
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delivery_interests',
    )
    delivery_event = models.ForeignKey(
        'delivery.DeliveryEvent',
        on_delete=models.CASCADE,
        related_name='interests',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'delivery_event')

    def __str__(self):
        return f"{self.buyer.email} → {self.delivery_event.name}"
