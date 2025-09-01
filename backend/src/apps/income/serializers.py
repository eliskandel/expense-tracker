from rest_framework import serializers
from .models import Category, Income

class IncomeSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(),
                                                   source='category', write_only=True)

    class Meta:
        model = Income
        fields = ['id', 'amount', 'description', 'category_id', 'date', 'updated']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)