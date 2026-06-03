from django.urls import path
from .views import ParcelListCreateView, ParcelDetailView, NearbyParcelsView

urlpatterns = [
    path('', ParcelListCreateView.as_view(), name='parcel-list'),
    path('<int:pk>/', ParcelDetailView.as_view(), name='parcel-detail'),
    path('nearby/', NearbyParcelsView.as_view(), name='nearby-parcels'),
]
