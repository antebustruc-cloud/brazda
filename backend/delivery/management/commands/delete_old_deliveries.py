"""
Usage: python manage.py delete_old_deliveries [--days 120] [--dry-run]
Scheduled via cron in docker-compose (db_backup container pattern).
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from delivery.models import DeliveryEvent


class Command(BaseCommand):
    help = 'Delete delivery events older than N days (default 120).'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=120)
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=options['days'])
        qs = DeliveryEvent.objects.filter(created_at__lt=cutoff)
        count = qs.count()
        if options['dry_run']:
            self.stdout.write(f"[dry-run] Would delete {count} delivery event(s) older than {options['days']} days.")
            return
        qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} delivery event(s) older than {options['days']} days."))
