from django.urls import path
from .views import DeliveryListCreateView, DeliveryDetailView, NearbyDeliveryView

urlpatterns = [
    path('', DeliveryListCreateView.as_view(), name='delivery-list'),
    path('nearby/', NearbyDeliveryView.as_view(), name='delivery-nearby'),
    path('<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
]