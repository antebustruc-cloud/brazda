from django.contrib import admin
from .models import Notification, NotificationRead


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'farmer', 'channel_type', 'radius_km', 'created_at', 'expires_at']
    list_filter = ['created_at']
    search_fields = ['farmer__email', 'message']


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'buyer', 'read_at']
