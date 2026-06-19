from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView as BaseCallback

from .models import User
from .serializers import UserMeSerializer


class OIDCCallbackView(BaseCallback):
    def login_failure(self):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        return redirect(f"{frontend_url}/login?error=auth_failed")

    def login_success(self):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        refresh = RefreshToken.for_user(self.request.user)
        query = urlencode({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })
        return redirect(f"{frontend_url}/auth/callback?{query}")


class MeView(generics.RetrieveAPIView):
    serializer_class = UserMeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)
