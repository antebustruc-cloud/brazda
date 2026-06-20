from django.contrib.gis.db import models
from django.conf import settings


class DeliveryEvent(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delivery_events'
    )
    name = models.CharField(max_length=150)
    destination = models.PointField()  # where the delivery is headed (e.g. Split center)
    radius_km = models.FloatField(default=10)  # how far around destination
    delivery_date = models.DateField()
    time_from = models.TimeField(null=True, blank=True)
    time_until = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.delivery_date} ({self.owner.username})"