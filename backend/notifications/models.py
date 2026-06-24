from datetime import timedelta
from django.contrib.gis.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """
    A farmer's "we're open / come buy" announcement for a stand or delivery
    event, shown to buyers within a chosen radius.

    Phase 2 note: this is pull-based, not push. Buyers see it when they open
    the Notifications page (or a Buy page) and share their location - we
    have no durable buyer location or device token to push to outside an
    active session. Real push notifications (reaching a buyer's phone even
    with the app closed) are Phase 3, and will deliver against these same
    records once a Firebase/device-token layer exists - this model doesn't
    need to change for that, just how it's delivered.
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
