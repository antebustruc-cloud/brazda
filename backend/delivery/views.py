from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
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

class NearbyDeliveryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if not lat or not lng:
            return Response({'error': 'lat and lng are required'}, status=400)

        buyer_location = Point(float(lng), float(lat), srid=4326)

        # All active events, annotated with distance from buyer to destination
        events = DeliveryEvent.objects.filter(is_active=True).annotate(
            distance=Distance('destination', buyer_location)
        )

        results = []
        for ev in events:
            # distance in meters; event radius in km
            distance_m = ev.distance.m
            if distance_m <= ev.radius_km * 1000:
                results.append(ev)

        serializer = DeliveryEventSerializer(results, many=True)
        return Response(serializer.data)