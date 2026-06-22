from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from mozilla_django_oidc.views import OIDCAuthenticationRequestView as BaseRequestView
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView as BaseCallback

from django.db import models as db_models

from .models import Site, User
from .serializers import SiteSerializer, UserMeSerializer, UserSerializer


def get_subordinate_ids(user_id):
    ids = set()
    children = list(User.objects.filter(manager_id=user_id).values_list("id", flat=True))
    for child_id in children:
        ids.add(child_id)
        ids.update(get_subordinate_ids(child_id))
    return ids


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


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "email"]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("manager", "site")

        if user.role == "rh":
            qs = qs.all()
        else:
            ids = get_subordinate_ids(user.id)
            if ids:
                ids.add(user.id)
                qs = qs.filter(id__in=ids)
            else:
                qs = qs.filter(id=user.id)

        site = self.request.query_params.get("site")
        manager = self.request.query_params.get("manager")
        search = self.request.query_params.get("search")
        if site:
            qs = qs.filter(site_id=site)
        if manager:
            qs = qs.filter(manager_id=manager)
        if search:
            qs = qs.filter(
                db_models.Q(first_name__icontains=search)
                | db_models.Q(last_name__icontains=search)
                | db_models.Q(email__icontains=search)
            )
            qs = qs.filter(manager_id=manager)

        return qs

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "La suppression d'un utilisateur n'est pas autorisée"},
            status=status.HTTP_403_FORBIDDEN,
        )


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]


class DevLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate

        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)

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
