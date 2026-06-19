from rest_framework import viewsets, permissions
from .models import Interview
from .serializers import InterviewSerializer


class IsManagerOrRH(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ("rh", "manager")


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrRH]

    def get_queryset(self):
        user = self.request.user
        if user.role == "rh":
            return Interview.objects.all()
        if user.role == "manager":
            return Interview.objects.filter(manager=user)
        return Interview.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user)
