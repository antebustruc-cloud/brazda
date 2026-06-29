from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import User, SellerProfile
from .serializers import UserSerializer, RegisterSerializer, SellerProfileSerializer, EmailTokenObtainSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class EmailTokenView(TokenObtainPairView):
    serializer_class = EmailTokenObtainSerializer
    permission_classes = [permissions.AllowAny]

class GoogleLoginView(APIView):
    """
    One-click Google sign-in/sign-up. A brand new user created this way is
    always buyer-only (is_buyer=True, is_seller=False) - a one-tap flow can't
    also collect the OPG name/MIBPG/map pin a seller account needs, so anyone
    wanting to sell still goes through full registration on the web/app.
    If the email already has an account (however it was created), this just
    logs them into that existing account instead of making a new one.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'detail': 'id_token is required.'}, status=400)
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({'detail': 'Google sign-in is not configured yet.'}, status=503)

        try:
            idinfo = google_id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
            )
        except ValueError:
            return Response({'detail': 'Invalid Google token.'}, status=400)

        if not idinfo.get('email_verified'):
            return Response({'detail': 'Google email is not verified.'}, status=400)

        email = idinfo['email']
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'is_buyer': True, 'is_seller': False},
        )
        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class SellerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return SellerProfile.objects.get(user=self.request.user)