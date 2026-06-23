from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'farmer', 'buyer', 'amount', 'reference', 'is_confirmed', 'created_at']
    list_filter = ['is_confirmed']
    search_fields = ['reference', 'farmer__email', 'buyer__email']
