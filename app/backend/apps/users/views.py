import os
from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from mozilla_django_oidc.views import OIDCAuthenticationRequestView as BaseRequestView
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView as BaseCallback

from .models import User
from .serializers import UserMeSerializer, UserSerializer


from django.utils.crypto import get_random_string
from mozilla_django_oidc.utils import add_state_and_verifier_and_nonce_to_session

class OIDCAuthenticationRequestView(BaseRequestView):
    def get(self, request):
        redirect_uri = getattr(settings, "OIDC_REDIRECT_URI", None)
        if not redirect_uri:
            from django.urls import reverse
            redirect_uri = request.build_absolute_uri(reverse("oidc_authentication_callback"))

        state = get_random_string(32)
        nonce = get_random_string(32)
        params = {
            "response_type": "code",
            "scope": self.get_settings("OIDC_RP_SCOPES", "openid email"),
            "client_id": self.get_settings("OIDC_RP_CLIENT_ID"),
            "redirect_uri": redirect_uri,
            "state": state,
            "nonce": nonce,
        }
        params.update(self.get_extra_params(request))
        add_state_and_verifier_and_nonce_to_session(request, state, params, None)
        request.session["oidc_login_next"] = "/"

        query = urlencode(params)
        authorization_url = self.get_settings("OIDC_OP_AUTHORIZATION_ENDPOINT")
        return redirect(f"{authorization_url}?{query}")

    def get_extra_params(self, request):
        return self.get_settings("OIDC_AUTH_REQUEST_EXTRA_PARAMS", {})


class OIDCCallbackView(BaseCallback):
    def login_failure(self):
        frontend_url = settings.FRONTEND_URL
        return redirect(f"{frontend_url}/login?error=auth_failed")

    def login_success(self):
        frontend_url = settings.FRONTEND_URL
        refresh = RefreshToken.for_user(self.user)
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


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "rh":
            return User.objects.filter(is_active=True).select_related("manager")
        return User.objects.filter(id=self.request.user.id)


class DevLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        admin_email = os.environ.get("DEV_ADMIN_EMAIL")
        admin_password = os.environ.get("DEV_ADMIN_PASSWORD")

        if not admin_email or not admin_password:
            return Response({"error": "Login dev non configuré"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if email != admin_email or password != admin_password:
            return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "role": "rh",
            },
        )
        user.set_password(password)
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserMeSerializer(user).data,
        })


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
