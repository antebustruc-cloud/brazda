from django.urls import path
from .views import (
    StandListCreateView, StandDetailView, NearbyStandsView,
    StandSupplierRequestListCreateView,
    FarmerSupplierRequestView, FarmerSupplierRequestDetailView,
    StandInterestView,
)

urlpatterns = [
    path('', StandListCreateView.as_view(), name='stand-list'),
    path('<int:pk>/', StandDetailView.as_view(), name='stand-detail'),
    path('nearby/', NearbyStandsView.as_view(), name='nearby-stands'),

    # Stand owner sends supply requests
    path('supplier-requests/', StandSupplierRequestListCreateView.as_view(), name='supplier-request-list'),

    # Farmer sees and responds to incoming requests
    path('incoming-requests/', FarmerSupplierRequestView.as_view(), name='farmer-incoming-requests'),
    path('incoming-requests/<int:pk>/', FarmerSupplierRequestDetailView.as_view(), name='farmer-incoming-request-detail'),

    # Buyer expresses interest
    path('<int:stand_id>/interest/', StandInterestView.as_view(), name='stand-interest'),
]
