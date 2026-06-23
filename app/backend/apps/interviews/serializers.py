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
    employee_manager_name = serializers.SerializerMethodField()
    employee_manager_id = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()
    previous_content = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = [
            "id", "employee", "employee_detail",
            "manager", "manager_detail",
            "campaign", "template", "template_name",
            "employee_manager_name", "employee_manager_id",
            "type", "status", "due_date", "content",
            "document_url",
            "previous_content",
            "created_at", "updated_at",
        ]
        read_only_fields = ["manager", "created_at", "updated_at"]

    def get_employee_manager_name(self, obj):
        if obj.employee.manager:
            return obj.employee.manager.get_full_name() or obj.employee.manager.email
        return None

    def get_employee_manager_id(self, obj):
        if obj.employee.manager:
            return obj.employee.manager.id
        return None

    def get_document_url(self, obj):
        if obj.document:
            return f"/media/{obj.document.name}"
        return None

    def get_previous_content(self, obj):
        prev = (
            Interview.objects.filter(employee=obj.employee, type=obj.type, status__in=("completed", "signed"))
            .exclude(pk=obj.pk)
            .order_by("-updated_at")
            .first()
        )
        if prev:
            return prev.content.get("sections", [])
        return []
