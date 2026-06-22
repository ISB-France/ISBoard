from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
import csv
import io

from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from mozilla_django_oidc.views import OIDCAuthenticationRequestView as BaseRequestView
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView as BaseCallback

from django.db import models as db_models

from .models import RH_ROLES, Position, Service, Site, User
from .serializers import (
    PositionSerializer,
    ServiceSerializer,
    SiteSerializer,
    UserMeSerializer,
    UserSerializer,
)


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

        if user.role in RH_ROLES:
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

    @action(detail=False, methods=["post"])
    def import_csv(self, request):
        if request.user.role not in RH_ROLES:
            return Response({"error": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Fichier CSV requis"}, status=status.HTTP_400_BAD_REQUEST)

        decoded = file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))

        created = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            email = row.get("email", "").strip().lower()
            if not email:
                errors.append(f"Ligne {row_num}: email manquant")
                continue

            site_name = row.get("site", "").strip()
            site = None
            if site_name:
                site, _ = Site.objects.get_or_create(name=site_name)

            service_name = row.get("service", "").strip()
            service = None
            if service_name:
                service, _ = Service.objects.get_or_create(name=service_name)

            position_name = row.get("position", "").strip()
            position = None
            if position_name:
                position, _ = Position.objects.get_or_create(name=position_name)

            manager_email = row.get("manager_email", "").strip().lower()
            manager = None
            if manager_email:
                manager = User.objects.filter(email=manager_email).first()

            role = row.get("role", "employee").strip().lower()
            if role not in ("admin", "rh", "manager", "employee", "stagiaire", "alternant"):
                role = "employee"

            try:
                user, created_flag = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "first_name": row.get("first_name", "").strip(),
                        "last_name": row.get("last_name", "").strip(),
                        "role": role,
                        "service": service,
                        "position": position,
                        "site": site,
                        "manager": manager,
                        "matricule": row.get("matricule", "").strip(),
                        "type_contrat": row.get("type_contrat", "").strip(),
                        "statut": row.get("statut", "actif").strip(),
                        "sexe": row.get("sexe", "").strip(),
                        "telephone": row.get("telephone", "").strip(),
                        "coefficient": row.get("coefficient", "").strip(),
                        "salaire_brut": row.get("salaire_brut", "").strip() or None,
                        "forfait_jour": row.get("forfait_jour", "false").strip().lower() == "true",
                        "tickets_restaurant": row.get("tickets_restaurant", "false").strip().lower() == "true",
                        "cadre": row.get("cadre", "false").strip().lower() == "true",
                        "agence_interim": row.get("agence_interim", "").strip(),
                    },
                )
                if created_flag:
                    user.set_unusable_password()
                    user.save()
                    created += 1
            except Exception as e:
                errors.append(f"Ligne {row_num} ({email}): {e}")

        return Response({"created": created, "errors": errors, "total": len(reader)})

    @action(detail=False, methods=["get"])
    def next_matricule(self, request):
        import re
        existing = User.objects.exclude(matricule="").values_list("matricule", flat=True)
        used = {m for m in existing if re.match(r"^\d+$", m)}
        next_num = 1
        if used:
            next_num = max(int(m) for m in used) + 1
        return Response({"matricule": f"{next_num:08d}"})

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "La suppression d'un utilisateur n'est pas autorisée"},
            status=status.HTTP_403_FORBIDDEN,
        )


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent créer un service")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent modifier un service")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent supprimer un service")
        instance.delete()


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent créer un poste")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent modifier un poste")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in RH_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les RH/Admin peuvent supprimer un poste")
        instance.delete()


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
