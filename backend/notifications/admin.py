from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.utils import timezone
from django.contrib import messages
from .models import (
    Notification, NotificationRead,
    AlertZone, NotificationRequest, WebPushSubscription, DeliveryInterest,
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'farmer', 'channel_type', 'radius_km', 'created_at', 'expires_at']
    list_filter = ['created_at']
    search_fields = ['farmer__email', 'message']


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'buyer', 'read_at']


@admin.register(AlertZone)
class AlertZoneAdmin(GISModelAdmin):
    list_display = ['id', 'buyer', 'label', 'created_at']
    search_fields = ['buyer__email', 'label']
    list_filter = ['created_at']


@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'user_agent', 'created_at', 'updated_at']
    search_fields = ['user__email']


def _approve_and_send(modeladmin, request, queryset):
    """
    Approve selected notification requests and send to matched alert zones.
    Calculates matched_count on approval.
    delivered_count is set equal to matched_count as a placeholder until
    real Firebase push is wired up - at that point update this action to
    call Firebase per-subscription and count actual successful handoffs.
    """
    approved = 0
    skipped = 0
    for nr in queryset:
        if nr.status != NotificationRequest.STATUS_PENDING:
            skipped += 1
            continue
        count = nr.compute_matched_count()
        nr.matched_count = count
        nr.delivered_count = count
        nr.status = NotificationRequest.STATUS_SENT
        nr.approved_at = timezone.now()
        nr.sent_at = timezone.now()
        nr.save()
        # TODO: Firebase push once VAPID keys are configured:
        # from django.contrib.gis.measure import D
        # zones = AlertZone.objects.filter(location__distance_lte=(nr.origin, D(km=nr.radius_km)))
        # buyer_ids = zones.values_list('buyer_id', flat=True).distinct()
        # subs = WebPushSubscription.objects.filter(user_id__in=buyer_ids)
        # for sub in subs: fire_push(sub, nr.message)
        approved += 1

    if approved:
        messages.success(request, f"{approved} request(s) approved and sent.")
    if skipped:
        messages.warning(request, f"{skipped} request(s) skipped (not pending).")


_approve_and_send.short_description = "Approve and send to matched buyers"


def _reject(modeladmin, request, queryset):
    updated = queryset.filter(status=NotificationRequest.STATUS_PENDING).update(
        status=NotificationRequest.STATUS_REJECTED
    )
    messages.success(request, f"{updated} request(s) rejected.")


_reject.short_description = "Reject selected requests"


@admin.register(NotificationRequest)
class NotificationRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'farmer_email', 'opg_name', 'channel_type', 'radius_km',
        'message_preview', 'status', 'matched_count', 'delivered_count', 'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['farmer__email', 'farmer__opg__name', 'message']
    readonly_fields = [
        'farmer', 'parcel', 'stand', 'delivery_event',
        'origin', 'radius_km', 'message', 'status',
        'matched_count', 'delivered_count',
        'created_at', 'approved_at', 'sent_at',
    ]
    actions = [_approve_and_send, _reject]

    def farmer_email(self, obj):
        return obj.farmer.email
    farmer_email.short_description = 'Farmer'

    def opg_name(self, obj):
        try:
            return obj.farmer.opg.name
        except Exception:
            return '-'
    opg_name.short_description = 'OPG'

    def message_preview(self, obj):
        return (obj.message[:60] + '...') if len(obj.message) > 60 else obj.message
    message_preview.short_description = 'Message'

    def has_add_permission(self, request):
        return False


@admin.register(DeliveryInterest)
class DeliveryInterestAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'delivery_event', 'created_at']
    list_filter = ['created_at']
    search_fields = ['buyer__email', 'delivery_event__name']
