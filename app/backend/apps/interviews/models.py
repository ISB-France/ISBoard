from django.conf import settings
from django.db import models
from .templates import TEMPLATES


class Interview(models.Model):
    class Type(models.TextChoices):
        ANNUAL = "annual", "Entretien annuel"
        PROFESSIONAL = "professional", "Entretien professionnel"

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        IN_PROGRESS = "in_progress", "En cours"
        COMPLETED = "completed", "Terminé"
        CANCELLED = "cancelled", "Annulé"

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="managed_interviews",
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    due_date = models.DateField()
    content = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-due_date"]

    def get_content_template(self):
        return TEMPLATES.get(self.type, {"sections": []})

    def initialize_content(self):
        if not self.content or not self.content.get("sections"):
            self.content = self.get_content_template()

    def save(self, *args, **kwargs):
        if not self.content or not self.content.get("sections"):
            self.content = self.get_content_template()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_type_display()} - {self.employee}"
