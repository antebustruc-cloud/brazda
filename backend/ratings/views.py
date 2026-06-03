from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from .models import Rating
from .serializers import RatingSerializer
from users.models import User

class RatingListCreateView(generics.ListCreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Rating.objects.filter(rated_user=self.request.user)

    def perform_create(self, serializer):
        rated_user_id = self.request.data.get('rated_user')
        if str(rated_user_id) == str(self.request.user.id):
            raise ValidationError("You cannot rate yourself.")
        rated_user = User.objects.get(id=rated_user_id)
        serializer.save(rater=self.request.user, rated_user=rated_user)
