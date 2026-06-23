from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import Parcel
from .serializers import ParcelSerializer
from users.permissions import IsSeller

class ParcelListCreateView(generics.ListCreateAPIView):
    serializer_class = ParcelSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        return Parcel.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ParcelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ParcelSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        return Parcel.objects.filter(owner=self.request.user)

class NearbyParcelsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 10))
        min_rating = float(request.query_params.get('min_rating', 0))

        if not lat or not lng:
            return Response({'error': 'lat and lng are required'}, status=400)

        user_location = Point(float(lng), float(lat), srid=4326)
        radius_m = radius_km * 1000

        parcels = Parcel.objects.filter(
            location__distance_lte=(user_location, radius_m),
            products__is_available=True,
        ).annotate(
            distance=Distance('location', user_location)
        ).filter(
            owner__seller_profile__rating__gte=min_rating
        ).order_by('distance').distinct()

        serializer = ParcelSerializer(parcels, many=True)
        return Response(serializer.data)
