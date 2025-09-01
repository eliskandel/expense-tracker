from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Sum
from decimal import Decimal
from src.apps.expense.models import Expense, Category
from src.apps.income.models import Income

User = get_user_model()

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    threshold_percentage = models.FloatField(default=80.0)  # Percentage of income for this category

    @property
    def total_income(self):
        """Total income of user for the month"""
        total = Income.objects.filter(
            user=self.user,
            date__month=self.month.month,
            date__year=self.month.year
        ).aggregate(total=Sum('amount'))['total']
        return total or Decimal('0.0')

    @property
    def total_expense(self):
        """Total expense for this category in the month"""
        total = Expense.objects.filter(
            paid_by=self.user,
            category=self.category,
            date__month=self.month.month,
            date__year=self.month.year
        ).aggregate(total=Sum('amount'))['total']
        return total or Decimal('0.0')

    @property
    def allowed_expense(self):
        """Allowed expense based on threshold % of total income"""
        return self.total_income * (Decimal(str(self.threshold_percentage)) / Decimal('100'))

    @property
    def remaining_budget(self):
        """Remaining budget for this category"""
        return self.allowed_expense - self.total_expense

    def __str__(self):
        return f"{self.user.username} - {self.category.name} - {self.month.strftime('%B %Y')}"
