from django.db import models
from users.models import User

class Rating(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]  # 1 to 5 stars

    rater = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings_given')
    rated_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings_received')
    score = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('rater', 'rated_user')  # one rating per pair

    def __str__(self):
        return f"{self.rater.username} rated {self.rated_user.username}: {self.score}⭐"
# Create your models here.
