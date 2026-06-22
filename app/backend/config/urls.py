from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView
from apps.users.views import OIDCAuthenticationRequestView, OIDCCallbackView, MeView, UserViewSet, SiteViewSet, DevLoginView, LogoutView
from apps.interviews.views import InterviewViewSet

router = DefaultRouter()
router.register("interviews", InterviewViewSet, basename="interview")
router.register("users", UserViewSet, basename="user")
router.register("sites", SiteViewSet, basename="site")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/authenticate/", OIDCAuthenticationRequestView.as_view(), name="oidc_authentication_init"),
    path("api/auth/callback", OIDCCallbackView.as_view(), name="oidc_authentication_callback"),
    path("api/auth/callback/", OIDCCallbackView.as_view(), name="oidc_authentication_callback_slash"),
    path("api/auth/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/auth/me/", MeView.as_view(), name="auth_me"),
    path("api/auth/dev-login/", DevLoginView.as_view(), name="auth_dev_login"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("api/", include(router.urls)),
]
