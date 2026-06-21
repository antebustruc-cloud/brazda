from django.urls import path
from .views import RegisterView, ProfileView, SellerProfileView, EmailTokenView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', EmailTokenView.as_view(), name='email-login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('seller-profile/', SellerProfileView.as_view(), name='seller-profile'),
]