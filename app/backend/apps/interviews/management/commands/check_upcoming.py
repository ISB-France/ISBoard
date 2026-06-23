from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.interviews.models import Interview
from apps.users.models import Notification


class Command(BaseCommand):
    help = "Crée des notifications pour les entretiens à échéance dans la semaine"

    def handle(self, *args, **options):
        today = date.today()
        week_end = today + timedelta(days=7)
        qs = Interview.objects.filter(
            status__in=("draft", "in_progress"),
            due_date__gte=today,
            due_date__lte=week_end,
        )
        created = 0
        for iv in qs:
            notif, was = Notification.objects.get_or_create(
                user=iv.manager,
                message=f"Échéance dans {(iv.due_date - today).days} jour(s) : {iv.get_type_display()} pour {iv.employee.get_full_name() or iv.employee.email}",
                link=f"/interviews/{iv.id}",
                is_read=False,
            )
            if was:
                created += 1
        self.stdout.write(f"{created} notifications créées")
