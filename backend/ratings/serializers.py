from rest_framework import serializers
from .models import Rating

class RatingSerializer(serializers.ModelSerializer):
    rater_username = serializers.CharField(source='rater.username', read_only=True)
    rated_username = serializers.CharField(source='rated_user.username', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'rater_username', 'rated_username', 'score', 'comment', 'created_at']
        read_only_fields = ['rater', 'created_at']
