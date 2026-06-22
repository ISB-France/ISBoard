from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Campaign, Interview, InterviewTemplate
from .serializers import CampaignSerializer, InterviewSerializer, InterviewTemplateSerializer
from .templates import TEMPLATES
from apps.users.models import RH_ROLES, User


class InterviewPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "stats":
            return True
        basename = getattr(view, 'basename', '')
        if basename in ('interviewtemplate', 'campaign'):
            return request.user.role in ("admin", "rh", "manager")
        if view.action in ("create", "destroy"):
            return request.user.role in RH_ROLES
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.role in RH_ROLES:
            return True
        if view.action in ("retrieve",):
            return obj.employee == request.user or obj.manager == request.user
        if view.action in ("update", "partial_update"):
            if obj.manager == request.user:
                return True
            if obj.employee == request.user and not obj.employee.manager:
                return True
            return False
        return False


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated, InterviewPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["employee__first_name", "employee__last_name", "employee__email"]
    ordering_fields = ["due_date", "created_at", "updated_at", "status"]
    ordering = ["-due_date"]

    def get_queryset(self):
        user = self.request.user
        qs = Interview.objects.select_related("employee", "manager", "template", "campaign")
        if user.role in RH_ROLES:
            qs = qs.all()
        elif user.role == "manager":
            qs = qs.filter(manager=user)
        elif user.role == "employee" and not user.manager:
            qs = qs.filter(employee=user)
        else:
            qs = qs.filter(employee=user)

        type_filter = self.request.query_params.get("type")
        status_filter = self.request.query_params.get("status")
        if type_filter:
            qs = qs.filter(type=type_filter)
        if status_filter:
            status_list = status_filter.split(",")
            qs = qs.filter(status__in=status_list)

        scope = self.request.query_params.get("scope")
        if scope == "own" and user.role not in RH_ROLES:
            qs = qs.filter(manager=user)
        elif scope == "direct" and user.role not in RH_ROLES:
            subordinates = User.objects.filter(manager=user).values_list("id", flat=True)
            qs = qs.filter(employee_id__in=subordinates)
        elif scope == "team" and user.role not in RH_ROLES:
            from apps.users.views import get_subordinate_ids
            ids = get_subordinate_ids(user.id)
            if ids:
                ids.add(user.id)
                qs = qs.filter(employee_id__in=ids)
            else:
                qs = qs.none()

        return qs

    def perform_create(self, serializer):
        template = serializer.validated_data.get("template")
        if template and not serializer.validated_data.get("content"):
            serializer.validated_data["content"] = {"sections": list(template.sections)}
        serializer.save(manager=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        user = request.user
        qs = self.get_queryset()
        now = timezone.now().date()
        return Response({
            "total": qs.count(),
            "by_status": qs.values("status").annotate(count=Count("id")),
            "by_type": qs.values("type").annotate(count=Count("id")),
            "overdue": qs.filter(status__in=("draft", "in_progress"), due_date__lt=now).count(),
            "upcoming": qs.filter(status__in=("draft", "in_progress"), due_date__gte=now).count(),
        })

    @action(detail=False, methods=["get"])
    def employees(self, request):
        if request.user.role in RH_ROLES:
            users = User.objects.filter(is_active=True).values("id", "first_name", "last_name", "email")
            return Response(list(users))
        return Response([])

    @action(detail=True, methods=["get"])
    def print(self, request, pk=None):
        interview = self.get_object()
        sections = interview.content.get("sections", [])
        return render(request, "interviews/print.html", {
            "interview": interview,
            "sections": sections,
        })

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        from weasyprint import HTML
        interview = self.get_object()
        sections = interview.content.get("sections", [])
        html = render_to_string("interviews/print.html", {
            "interview": interview,
            "sections": sections,
        })
        pdf = HTML(string=html).write_pdf()
        emp = interview.employee
        filename = f"{interview.get_type_display()}_{emp.last_name}_{emp.first_name}.pdf"
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class InterviewTemplateViewSet(viewsets.ModelViewSet):
    queryset = InterviewTemplate.objects.all()
    serializer_class = InterviewTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, InterviewPermission]


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.prefetch_related("interviews")
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated, InterviewPermission]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        old = self.get_object()
        new = serializer.save()
        if old.due_date != new.due_date:
            new.interviews.all().update(due_date=new.due_date)

    @action(detail=True, methods=["post"])
    def generate(self, request, pk=None):
        campaign = self.get_object()
        if not campaign.template:
            return Response({"error": "La campagne n'a pas de modèle"}, status=status.HTTP_400_BAD_REQUEST)

        template = campaign.template
        qs = User.objects.filter(is_active=True)

        pf = campaign.population_filter or {}
        site = pf.get("site")
        service = pf.get("service")
        employee_ids = pf.get("employees")

        if employee_ids:
            qs = qs.filter(id__in=employee_ids)
        else:
            if site:
                qs = qs.filter(site_id=site)
            if service:
                qs = qs.filter(service_id=service)

        created = 0
        for user in qs:
            _, was_created = Interview.objects.get_or_create(
                campaign=campaign,
                employee=user,
                type=template.type,
                defaults={
                    "template": template,
                    "content": {"sections": list(template.sections)},
                    "due_date": campaign.due_date,
                    "manager": user.manager or request.user,
                },
            )
            if was_created:
                created += 1

        return Response({"created": created, "total": qs.count()})
