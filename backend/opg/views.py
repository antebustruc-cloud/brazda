from rest_framework import generics, permissions
from .models import OPG
from .serializers import OPGSerializer


class MyOPGView(generics.RetrieveUpdateAPIView):
    serializer_class = OPGSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return OPG.objects.get(owner=self.request.user)

