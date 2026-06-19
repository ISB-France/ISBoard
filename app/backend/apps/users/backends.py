from mozilla_django_oidc.auth import OIDCAuthenticationBackend as BaseOIDCBackend


class OIDCAuthenticationBackend(BaseOIDCBackend):
    def create_user(self, claims):
        email = claims.get("email") or claims.get("preferred_username")
        user = self.UserModel.objects.create_user(
            username=email,
            email=email,
        )
        self.update_user(user, claims)
        return user

    def update_user(self, user, claims):
        user.first_name = claims.get("given_name", "")
        user.last_name = claims.get("family_name", "")
        email = claims.get("email") or claims.get("preferred_username")
        if email:
            user.email = email

        roles = claims.get("roles", [])
        if "rh" in roles or "admin" in roles:
            user.role = self.UserModel.Role.RH
        elif "manager" in roles:
            user.role = self.UserModel.Role.MANAGER
        else:
            user.role = self.UserModel.Role.EMPLOYEE

        user.save()
        return user

    def filter_users_by_claims(self, claims):
        email = claims.get("email") or claims.get("preferred_username")
        if not email:
            return self.UserModel.objects.none()
        return self.UserModel.objects.filter(email__iexact=email)
