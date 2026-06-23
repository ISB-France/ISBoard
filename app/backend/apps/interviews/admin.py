from django.contrib import admin
from .models import Interview


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ["employee", "type", "status", "due_date", "manager"]
    list_filter = ["type", "status", "due_date"]
    search_fields = ["employee__email", "employee__first_name", "employee__last_name"]
