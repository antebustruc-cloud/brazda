from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point, LineString
from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.functions import Distance
from django.db.models import Value
from .models import DeliveryEvent
from .serializers import DeliveryEventSerializer
from users.permissions import IsSeller

class DeliveryListCreateView(generics.ListCreateAPIView):
    serializer_class = DeliveryEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    def get_queryset(self):
        return DeliveryEvent.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DeliveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeliveryEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    def get_queryset(self):
        return DeliveryEvent.objects.filter(owner=self.request.user)

class NearbyDeliveryView(APIView):
    """
    A buyer matches a delivery event if they're within radius_km of the
    destination pin, OR within route_corridor_km of the straight-line route
    from the farmer's OPG to that destination (BlaBlaCar-style "stops along
    the way"). The route is a straight line, not real road routing - that
    would need an external routing API (Google Directions/OSRM), which is a
    bigger lift for later if the approximation ever proves too rough.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if not lat or not lng:
            return Response({'error': 'lat and lng are required'}, status=400)

        buyer_location = Point(float(lng), float(lat), srid=4326)

        events = DeliveryEvent.objects.filter(is_active=True).select_related('owner__opg').annotate(
            distance=Distance('destination', buyer_location)
        )

        results = []
        for ev in events:
            if ev.distance.m <= ev.radius_km * 1000:
                ev.matched_via = 'destination'
                results.append(ev)
                continue

            if ev.route_corridor_km > 0:
                try:
                    origin = ev.owner.opg.location
                except Exception:
                    origin = None
                if origin:
                    route = LineString(origin, ev.destination, srid=4326)
                    route_distance = DeliveryEvent.objects.filter(pk=ev.pk).annotate(
                        route_distance=Distance(
                            Value(route, output_field=GeometryField(srid=4326)),
                            buyer_location,
                        )
                    ).first().route_distance
                    if route_distance.m <= ev.route_corridor_km * 1000:
                        ev.matched_via = 'corridor'
                        results.append(ev)

        serializer = DeliveryEventSerializer(results, many=True)
        return Response(serializer.data)