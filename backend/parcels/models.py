from django.contrib.gis.db import models
from django.conf import settings

class Parcel(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parcels'
    )
    area_sq_m = models.FloatField(help_text="Area in square meters")
    location = models.PolygonField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.owner.username}"
