from rest_framework import serializers
from .models import Budget
from src.apps.expense.models import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class BudgetSerializer(serializers.ModelSerializer):
    total_income = serializers.FloatField(read_only=True)
    total_expense = serializers.FloatField(read_only=True)
    allowed_expense = serializers.FloatField(read_only=True)
    remaining_budget = serializers.FloatField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Budget
        fields = [
            'id', 'month', 'category', 'category_id', 'threshold_percentage',
            'total_income', 'total_expense', 'allowed_expense', 'remaining_budget'
        ]
