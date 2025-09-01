from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, Expense, ExpenseShare, Settlement, Category

User = get_user_model()


# ---------------------
# Basic Serializers
# ---------------------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


# ---------------------
# Expense Share Serializers
# ---------------------

class ExpenseShareCreateSerializer(serializers.ModelSerializer):
    """
    Used for manual and itemized splits.
    For itemized, include 'item_name'.
    """
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    item_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ExpenseShare
        fields = ['user', 'amount_owed', 'item_name']


class ExpenseShareSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying a user's share.
    """
    user = UserSerializer(read_only=True)
    expense_description = serializers.CharField(source='expense.description', read_only=True)

    class Meta:
        model = ExpenseShare
        fields = ['id', 'expense', 'expense_description', 'user', 'amount_owed', 'item_name', 'is_settled']


# ---------------------
# Main Expense Serializer
# ---------------------

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = serializers.CharField(source='paid_by.username', read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    shares = ExpenseShareCreateSerializer(many=True, required=False, write_only=True)
    split_details = ExpenseShareSerializer(many=True, source='shares', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'paid_by', 'amount', 'description', 'date', 'updated',
            'category', 'category_id', 'group', 'split_type', 'shares', 'split_details', 'created_by', 'is_settled'
        ]

    def create(self, validated_data):
        shares_data = validated_data.pop('shares', [])
        expense = Expense.objects.create(**validated_data)

        if expense.split_type == 'equal':
            members = expense.group.members.all() if expense.group else [expense.paid_by]
            per_user = expense.amount / len(members)
            for user in members:
                ExpenseShare.objects.create(expense=expense, user=user, amount_owed=per_user)
        elif expense.split_type in ['manual', 'itemized']:
            for share_data in shares_data:
                ExpenseShare.objects.create(expense=expense, **share_data)

        return expense

    def update(self, instance, validated_data):
        shares_data = validated_data.pop('shares', [])

        # Update Expense fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle shares
        for share_data in shares_data:
            user = share_data.get('user')
            # Update existing share if it exists
            share_instance = ExpenseShare.objects.filter(expense=instance, user=user).first()
            if share_instance:
                for key, value in share_data.items():
                    setattr(share_instance, key, value)
                share_instance.save()
            else:
                # Create new share if it doesn't exist
                ExpenseShare.objects.create(expense=instance, **share_data)

        return instance

# ---------------------
# Group Serializer
# ---------------------

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), write_only=True
    )
    expenses = ExpenseSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'member_ids', 'expenses']

    def create(self, validated_data):
        members = validated_data.pop('member_ids', [])
        group = Group.objects.create(**validated_data)
        request_user = self.context['request'].user
        group.members.set(list(members) + [request_user])
        return group


# ---------------------
# Settlement Serializer
# ---------------------

class SettlementSerializer(serializers.ModelSerializer):
    settled_by = serializers.CharField(source='settled_by.username', read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'expense_share', 'settled_by', 'amount_settled', 'date_settled']
