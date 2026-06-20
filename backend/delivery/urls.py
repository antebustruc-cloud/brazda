from django.urls import path
from .views import DeliveryListCreateView, DeliveryDetailView

urlpatterns = [
    path('', DeliveryListCreateView.as_view(), name='delivery-list'),
    path('<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
]