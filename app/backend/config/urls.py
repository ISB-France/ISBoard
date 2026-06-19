from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from mozilla_django_oidc.views import OIDCAuthenticationRequestView
from apps.users.views import OIDCCallbackView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/authenticate/", OIDCAuthenticationRequestView.as_view(), name="oidc_authentication_init"),
    path("api/auth/callback/", OIDCCallbackView.as_view(), name="oidc_callback"),
    path("api/auth/verify/", TokenVerifyView.as_view(), name="token_verify"),
]
