from django.contrib import admin

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerProfile

admin.site.register(User, UserAdmin)
admin.site.register(SellerProfile)

# Register your models here.
