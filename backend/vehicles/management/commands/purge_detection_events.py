from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from vehicles.models import DetectionEvent


class Command(BaseCommand):
    help = "Delete detection events older than the configured retention period."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=settings.DETECTION_EVENT_RETENTION_DAYS)

    def handle(self, *args, **options):
        days = options["days"]
        if days < 1:
            self.stderr.write("Retention must be at least one day.")
            return
        cutoff = timezone.now() - timedelta(days=days)
        deleted, _ = DetectionEvent.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} old detection event(s)."))
