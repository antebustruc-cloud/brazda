from rest_framework import generics, permissions
from .models import ProductCatalog
from .serializers import CatalogSerializer

class CatalogListView(generics.ListAPIView):
    queryset = ProductCatalog.objects.all()
    serializer_class = CatalogSerializer
    permission_classes = [permissions.IsAuthenticated]