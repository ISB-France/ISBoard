from rest_framework import serializers
from .models import Site, User


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source="site.name", read_only=True, default="")

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "role", "department", "site", "site_name",
            "hire_date", "manager", "onboarding_status",
        ]


class UserMeSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    site_name = serializers.CharField(source="site.name", read_only=True, default="")

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "role", "department", "site", "site_name",
            "hire_date", "manager", "manager_name",
            "onboarding_status",
        ]

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.email
        return None
