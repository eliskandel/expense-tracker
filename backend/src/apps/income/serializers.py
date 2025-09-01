from .models import Income, Category
from rest_framework import serializers
class IncomeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon']

class IncomeSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault()) 
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )

    class Meta:
        model = Income
        fields = ['id', 'user', 'amount', 'description', 'category_id', 'group', 'date', 'updated']

    # Optional: validate or override create method
    def create(self, validated_data):
        user=self.context['request'].user
        return Income.objects.create( **validated_data)


