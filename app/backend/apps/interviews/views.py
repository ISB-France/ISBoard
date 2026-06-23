from django.db import models
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
        if view.action in ("retrieve", "print", "pdf"):
            if obj.employee == request.user or obj.manager == request.user:
                return True
            from apps.users.views import get_subordinate_ids
            ids = get_subordinate_ids(request.user.id)
            if obj.employee_id in ids:
                return True
            return False
        if view.action in ("update", "partial_update"):
            if request.user.role in RH_ROLES:
                return True
            if obj.manager == request.user:
                return True
            if obj.employee == request.user and not obj.employee.manager:
                return True
            from apps.users.views import get_subordinate_ids
            if obj.employee_id in get_subordinate_ids(request.user.id):
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

    def get_object(self):
        from django.shortcuts import get_object_or_404
        obj = get_object_or_404(Interview.objects.select_related("employee", "manager", "template", "campaign"), pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        user = self.request.user
        qs = Interview.objects.select_related("employee", "manager", "template", "campaign")

        scope = self.request.query_params.get("scope")

        if user.role in RH_ROLES:
            qs = qs.all()

        elif user.role == "manager":
            if scope == "own":
                qs = qs.filter(employee=user)
            elif scope == "team":
                from apps.users.views import get_subordinate_ids
                ids = get_subordinate_ids(user.id)
                if ids:
                    qs = qs.filter(employee_id__in=ids)
                else:
                    return qs.none()
            else:
                subordinates = User.objects.filter(manager=user).values_list("id", flat=True)
                if subordinates:
                    qs = qs.filter(employee_id__in=subordinates)
                else:
                    qs = qs.filter(employee=user)

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

        return qs

    def perform_create(self, serializer):
        template = serializer.validated_data.get("template")
        employee = serializer.validated_data.get("employee")
        content = serializer.validated_data.get("content")
        if not content:
            content = {}
        if template and not content.get("sections"):
            content["sections"] = list(template.sections)
        if employee:
            content["employee_snapshot"] = {
                "position": employee.position.name if employee.position else None,
                "service": employee.service.name if employee.service else None,
                "site": employee.site.name if employee.site else None,
                "coefficient": employee.coefficient,
            }
        serializer.validated_data["content"] = content
        serializer.save(manager=self.request.user)

    def perform_update(self, serializer):
        employee = serializer.instance.employee
        content = serializer.validated_data.get("content", serializer.instance.content or {})
        if isinstance(content, dict):
            content["employee_snapshot"] = {
                "position": employee.position.name if employee.position else None,
                "service": employee.service.name if employee.service else None,
                "site": employee.site.name if employee.site else None,
                "coefficient": employee.coefficient,
            }
        serializer.validated_data["content"] = content
        serializer.save()

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

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse
        qs = self.get_queryset().filter(status__in=("completed", "signed"))
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="entretiens_historique.csv"'
        writer = csv.writer(response)
        writer.writerow(["ID", "Employé", "Email", "Manager", "Type", "Statut", "Date limite", "Date création"])
        for iv in qs:
            writer.writerow([
                iv.id,
                iv.employee.get_full_name() or iv.employee.email,
                iv.employee.email,
                iv.manager.get_full_name() or iv.manager.email,
                iv.get_type_display(),
                iv.get_status_display(),
                iv.due_date,
                iv.created_at.date(),
            ])
        return response

    @action(detail=True, methods=["get"])
    def print(self, request, pk=None):
        interview = self.get_object()
        sections = interview.content.get("sections", [])
        history = Interview.objects.filter(employee=interview.employee, status__in=("completed", "signed")).exclude(pk=interview.pk).select_related("manager", "template").order_by("-created_at")[:6]
        career = Interview.objects.filter(
            employee=interview.employee,
            type="professional",
        ).order_by("created_at")
        return render(request, "interviews/print.html", {
            "interview": interview,
            "sections": sections,
            "history": history,
            "career": career,
        })

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        from weasyprint import HTML
        interview = self.get_object()
        sections = interview.content.get("sections", [])
        history = Interview.objects.filter(employee=interview.employee, status__in=("completed", "signed")).exclude(pk=interview.pk).select_related("manager", "template").order_by("-created_at")[:6]
        career = Interview.objects.filter(
            employee=interview.employee,
            type="professional",
        ).order_by("created_at")
        html = render_to_string("interviews/print.html", {
            "interview": interview,
            "sections": sections,
            "history": history,
            "career": career,
        })
        pdf = HTML(string=html).write_pdf()
        emp = interview.employee
        filename = f"{interview.get_type_display()}_{emp.last_name}_{emp.first_name}.pdf"
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["post"])
    def upload_document(self, request, pk=None):
        interview = self.get_object()
        file = request.FILES.get("document")
        if file:
            if interview.document:
                interview.document.delete()
            interview.document = file
            interview.save(update_fields=["document"])
        return Response(self.get_serializer(interview).data)

    @action(detail=True, methods=["post"])
    def remove_document(self, request, pk=None):
        interview = self.get_object()
        if interview.document:
            interview.document.delete()
            interview.document = None
            interview.save(update_fields=["document"])
        return Response({"status": "ok"})


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
                    "content": {
                        "sections": list(template.sections),
                        "employee_snapshot": {
                            "position": user.position.name if user.position else None,
                            "service": user.service.name if user.service else None,
                            "site": user.site.name if user.site else None,
                            "coefficient": user.coefficient,
                        },
                    },
                    "due_date": campaign.due_date,
                    "manager": user.manager or request.user,
                },
            )
            if was_created:
                created += 1

        return Response({"created": created, "total": qs.count()})
