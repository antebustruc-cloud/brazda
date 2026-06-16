from django.contrib.gis.db import models
from django.conf import settings

class OPG(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opg'
    )
    name = models.CharField(max_length=150)
    mibpg = models.CharField(max_length=20, unique=True)
    location = models.PointField()  # private origin pin
    rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (MIBPG {self.mibpg})"