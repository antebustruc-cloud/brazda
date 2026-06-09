from django.urls import path
from .views import ProductListCreateView, ProductDetailView, DeliveryProductsView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('delivery/', DeliveryProductsView.as_view(), name='delivery-products'),
]
