from rest_framework import generics, permissions
from .models import DeliveryEvent
from .serializers import DeliveryEventSerializer

class DeliveryListCreateView(generics.ListCreateAPIView):
    serializer_class = DeliveryEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return DeliveryEvent.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DeliveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeliveryEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return DeliveryEvent.objects.filter(owner=self.request.user)