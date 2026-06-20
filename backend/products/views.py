from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import Product
from .serializers import ProductSerializer

class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = Product.objects.filter(seller=self.request.user)
        stand_id = self.request.query_params.get('stand')
        parcel_id = self.request.query_params.get('parcel')
        delivery_id = self.request.query_params.get('delivery_event')
        if stand_id:
            qs = qs.filter(stand=stand_id)
        if parcel_id:
            qs = qs.filter(parcel=parcel_id)
        if delivery_id:
            qs = qs.filter(delivery_event=delivery_id)
        return qs
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)

class DeliveryProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        product_name = request.query_params.get('product', '')
        min_rating = float(request.query_params.get('min_rating', 0))

        if not lat or not lng:
            return Response({'error': 'lat and lng are required'}, status=400)

        buyer_location = Point(float(lng), float(lat), srid=4326)

        products = Product.objects.filter(
            is_available=True,
            seller__seller_profile__delivery_available=True,
            name__icontains=product_name,
            seller__seller_profile__rating__gte=min_rating,
        ).select_related('seller__seller_profile')

        results = []
        for product in products:
            try:
                seller_profile = product.seller.seller_profile
                radius_m = seller_profile.delivery_radius_km * 1000
                seller_parcel = product.seller.parcels.first()
                if seller_parcel:
                    distance = buyer_location.distance(seller_parcel.location.centroid)
                    distance_m = distance * 111320
                    if distance_m <= radius_m:
                        results.append(product)
            except Exception:
                continue

        serializer = ProductSerializer(results, many=True)
        return Response(serializer.data)
