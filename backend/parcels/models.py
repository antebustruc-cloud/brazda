from django.contrib.gis.db import models

class Parcel(models.Model):
    name = models.CharField(max_length=100)
    owner = models.CharField(max_length=100, blank=True)
    area_sq_m = models.FloatField(help_text="Area in square meters")
    location = models.PolygonField()

    def __str__(self):
        return self.name
