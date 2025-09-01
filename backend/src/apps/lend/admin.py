from django.contrib import admin

# Register your models here.
from .models import Transaction,TransactionVerification

admin.site.register(Transaction)
admin.site.register(TransactionVerification)