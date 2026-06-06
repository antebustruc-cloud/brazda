from rest_framework import generics, permissions
from decimal import Decimal
from .models import Order
from .serializers import OrderSerializer
from products.models import Product

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)

    def perform_create(self, serializer):
        product = serializer.validated_data.get('product')
        estimated_kg = serializer.validated_data.get('estimated_kg')
        total_price = None
        if product and estimated_kg:
            total_price = product.price_per_kg * Decimal(str(estimated_kg))
        serializer.save(buyer=self.request.user, total_price=total_price)

class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)
