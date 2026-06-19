from rest_framework import serializers
from .models import Interview
from apps.users.serializers import UserSerializer


class InterviewSerializer(serializers.ModelSerializer):
    employee_detail = UserSerializer(source="employee", read_only=True)
    manager_detail = UserSerializer(source="manager", read_only=True)

    class Meta:
        model = Interview
        fields = [
            "id", "employee", "employee_detail", "manager", "manager_detail",
            "type", "status", "due_date", "content",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
