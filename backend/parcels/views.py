from rest_framework import generics, permissions
from .models import Parcel
from .serializers import ParcelSerializer

class ParcelListCreateView(generics.ListCreateAPIView):
    serializer_class = ParcelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Parcel.objects.filter(owner=self.request.user.username)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user.username)

class ParcelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ParcelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Parcel.objects.filter(owner=self.request.user.username)
