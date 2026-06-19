from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        RH = "rh", "RH"
        MANAGER = "manager", "Manager"
        EMPLOYEE = "employee", "Employé"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    department = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="subordinates"
    )
    onboarding_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "En attente"),
            ("in_progress", "En cours"),
            ("completed", "Terminé"),
        ],
        default="pending",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.get_full_name() or self.email
