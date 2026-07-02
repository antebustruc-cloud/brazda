from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import Stand, StandSupplierRequest, StandInterest
from .serializers import StandSerializer, StandSupplierRequestSerializer, StandInterestSerializer
from users.permissions import IsSeller


class StandListCreateView(generics.ListCreateAPIView):
    serializer_class = StandSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        return Stand.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class StandDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StandSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

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

        stands = Stand.objects.filter(
            location__distance_lte=(user_location, radius_km * 1000),
            is_active=True,
        ).annotate(distance=Distance('location', user_location)).order_by('distance')

        serializer = StandSerializer(stands, many=True)
        return Response(serializer.data)


# ─── Supply requests: stand owner side ───────────────────────────────────────

class StandSupplierRequestListCreateView(APIView):
    """
    Stand owner sends a per-product request to a farmer.
    GET: list all requests sent from my stands.
    POST: send a new request (stand_id + farmer_id + catalog_item_id).
    """
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        my_stand_ids = Stand.objects.filter(owner=request.user).values_list('id', flat=True)
        requests_qs = StandSupplierRequest.objects.filter(
            stand_id__in=my_stand_ids
        ).select_related('farmer__opg', 'stand', 'catalog_item').order_by('-created_at')
        return Response(StandSupplierRequestSerializer(requests_qs, many=True).data)

    def post(self, request):
        stand_id = request.data.get('stand')
        farmer_id = request.data.get('farmer')
        catalog_item_id = request.data.get('catalog_item')

        if not stand_id or not farmer_id or not catalog_item_id:
            return Response(
                {'detail': 'stand, farmer and catalog_item are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            stand = Stand.objects.get(pk=stand_id, owner=request.user)
        except Stand.DoesNotExist:
            return Response({'detail': "That's not your stand."}, status=status.HTTP_403_FORBIDDEN)

        req, created = StandSupplierRequest.objects.get_or_create(
            stand=stand,
            farmer_id=farmer_id,
            catalog_item_id=catalog_item_id,
            defaults={'status': 'pending'},
        )
        if not created and req.status == 'rejected':
            # Allow re-sending a previously rejected request
            req.status = 'pending'
            req.responded_at = None
            req.save()
        return Response(
            StandSupplierRequestSerializer(req).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ─── Supply requests: farmer side (incoming requests to approve/reject) ───────

class FarmerSupplierRequestView(APIView):
    """
    Farmer sees requests coming IN to them from stands.
    GET: all incoming requests with their status.
    PATCH /id/: approve or reject.
    """
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        incoming = StandSupplierRequest.objects.filter(
            farmer=request.user
        ).select_related('stand__owner', 'catalog_item').order_by('-created_at')
        return Response(StandSupplierRequestSerializer(incoming, many=True).data)


class FarmerSupplierRequestDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def patch(self, request, pk):
        try:
            req = StandSupplierRequest.objects.get(pk=pk, farmer=request.user)
        except StandSupplierRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('accepted', 'rejected'):
            return Response(
                {'detail': "status must be 'accepted' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.status = new_status
        req.responded_at = timezone.now()
        req.save()
        return Response(StandSupplierRequestSerializer(req).data)


# ─── Stand interest (buyer taps "I'm interested") ────────────────────────────

class StandInterestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, stand_id):
        try:
            stand = Stand.objects.get(pk=stand_id)
        except Stand.DoesNotExist:
            return Response({'detail': 'Stand not found.'}, status=status.HTTP_404_NOT_FOUND)
        interest, created = StandInterest.objects.get_or_create(
            buyer=request.user, stand=stand
        )
        return Response({'id': interest.id, 'created': created}, status=status.HTTP_201_CREATED)
