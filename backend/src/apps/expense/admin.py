from django.contrib import admin
from .models import Expense, Category
from .models import Group,  ExpenseShare, Settlement
# Register your models here.
admin.site.register(Expense) 
admin.site.register(Category)
admin.site.register(Group)
admin.site.register(ExpenseShare)
admin.site.register(Settlement) 