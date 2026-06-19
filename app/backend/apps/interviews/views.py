from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Interview
from .serializers import InterviewSerializer
from apps.users.models import User


class IsManagerOrRH(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "stats":
            return request.user.role in ("rh", "manager")
        return request.user.role in ("rh", "manager")


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrRH]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["employee__first_name", "employee__last_name", "employee__email"]
    ordering_fields = ["due_date", "created_at", "status"]
    ordering = ["-due_date"]

    def get_queryset(self):
        user = self.request.user
        qs = Interview.objects.select_related("employee", "manager")
        if user.role == "rh":
            qs = qs.all()
        elif user.role == "manager":
            qs = qs.filter(manager=user)
        else:
            qs = qs.filter(employee=user)

        type_filter = self.request.query_params.get("type")
        status_filter = self.request.query_params.get("status")
        if type_filter:
            qs = qs.filter(type=type_filter)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
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
        if request.user.role == "rh":
            users = User.objects.filter(is_active=True).values("id", "first_name", "last_name", "email")
            return Response(list(users))
        return Response([])
