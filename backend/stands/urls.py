from django.urls import path
from .views import StandListCreateView, StandDetailView, NearbyStandsView, StandSupplierRequestView

urlpatterns = [
    path('', StandListCreateView.as_view(), name='stand-list'),
    path('<int:pk>/', StandDetailView.as_view(), name='stand-detail'),
    path('nearby/', NearbyStandsView.as_view(), name='nearby-stands'),
    path('requests/', StandSupplierRequestView.as_view(), name='supplier-requests'),
]
