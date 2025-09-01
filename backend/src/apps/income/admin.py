from django.contrib import admin

from .models import Income,Category # Register your models here.

admin.site.register(Income)
admin.site.register(Category)