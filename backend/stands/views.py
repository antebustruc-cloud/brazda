from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import Stand, StandSupplierRequest
from .serializers import StandSerializer, StandSupplierRequestSerializer

class StandListCreateView(generics.ListCreateAPIView):
    serializer_class = StandSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Stand.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class StandDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StandSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Stand.objects.filter(owner=self.request.user)

class NearbyStandsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 10))

        if not lat or not lng:
            return Response({'error': 'lat and lng are required'}, status=400)

        user_location = Point(float(lng), float(lat), srid=4326)
        radius_m = radius_km * 1000

        stands = Stand.objects.filter(
            location__distance_lte=(user_location, radius_m),
            is_active=True
        ).annotate(
            distance=Distance('location', user_location)
        ).order_by('distance')

        serializer = StandSerializer(stands, many=True)
        return Response(serializer.data)

class StandSupplierRequestView(generics.ListCreateAPIView):
    serializer_class = StandSupplierRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StandSupplierRequest.objects.filter(farmer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)
