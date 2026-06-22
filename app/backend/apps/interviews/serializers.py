from rest_framework import serializers
from .models import Campaign, Interview, InterviewTemplate
from apps.users.serializers import UserSerializer


class InterviewTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewTemplate
        fields = ["id", "name", "type", "description", "sections", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class CampaignSerializer(serializers.ModelSerializer):
    interview_count = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id", "name", "template", "description",
            "start_date", "due_date", "population_filter",
            "interview_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_interview_count(self, obj):
        return obj.interviews.count()


class InterviewSerializer(serializers.ModelSerializer):
    employee_detail = UserSerializer(source="employee", read_only=True)
    manager_detail = UserSerializer(source="manager", read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True, default="")

    class Meta:
        model = Interview
        fields = [
            "id", "employee", "employee_detail",
            "manager", "manager_detail",
            "campaign", "template", "template_name",
            "type", "status", "due_date", "content",
            "created_at", "updated_at",
        ]
        read_only_fields = ["manager", "created_at", "updated_at"]
