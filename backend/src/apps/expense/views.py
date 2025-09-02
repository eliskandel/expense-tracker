from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework import serializers
from django.db.models import Q
from .models import Expense, Category, Group, ExpenseShare, Settlement
from .serializers import ExpenseSerializer, CategorySerializer, GroupSerializer, ExpenseShareSerializer, SettlementSerializer
from .filters import ExpenseFilter
from .pagination import StandardResultsSetPagination
from .services import FinancialSummaryService, TransactionService
from .permissions import IsExpenseAccessible

# Import Income model
from src.apps.income.models import Income

User = get_user_model()


# -------------------------------
# Expense Views
# -------------------------------

class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    Handles listing and creating personal or group expenses.
    Supports equal, manual, and itemized splits.
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filterset_class = ExpenseFilter
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated, IsExpenseAccessible]

    def get_queryset(self):
        user = self.request.user
        group_id = self.request.query_params.get('group_id')

        if group_id:
            return Expense.objects.filter(group_id=group_id).order_by('-date')
        return Expense.objects.filter(paid_by=user, group__isnull=True).order_by('-date')

    @transaction.atomic
    def perform_create(self, serializer):
        paid_by_user = self.request.user
        shares_data = self.request.data.get('shares', [])

        # Save expense first
        expense = serializer.save(paid_by=paid_by_user)

        # Handle splits
        if expense.split_type == 'equal' and expense.group:
            members = expense.group.members.all()
            number_of_shares = members.count()
            if number_of_shares > 0:
                amount_per_person = expense.amount / number_of_shares
                for member in members:
                    ExpenseShare.objects.create(
                        expense=expense,
                        user=member,
                        amount_owed=Decimal('0.00') if member == paid_by_user else amount_per_person,
                        is_settled=(member == paid_by_user)
                    )

        elif expense.split_type == 'manual':
            if not shares_data:
                raise serializers.ValidationError({"shares": "Shares data is required for manual split."})

            total_shared = sum(Decimal(share['amount_owed']) for share in shares_data)
            if total_shared != expense.amount:
                raise serializers.ValidationError({"shares": "Total of manual shares must equal the expense amount."})

            for share in shares_data:
                ExpenseShare.objects.create(
                    expense=expense,
                    user_id=share['user'],
                    amount_owed=share['amount_owed']
                )

        elif expense.split_type == 'itemized':
            if not shares_data:
                raise serializers.ValidationError({"shares": "Shares data is required for itemized split."})

            total_shared = sum(Decimal(share['amount_owed']) for share in shares_data)
            if total_shared != expense.amount:
                raise serializers.ValidationError({"shares": "Total of itemized shares must equal the expense amount."})

            for share in shares_data:
                user_id = share['user']
                item_name = share.get('item_name', '')

                # Check for existing share with the same combination
                if ExpenseShare.objects.filter(expense=expense, user_id=user_id, item_name=item_name).exists():
                     raise serializers.ValidationError(
                         {"shares": f"Duplicate item '{item_name}' for user '{user_id}' already exists for this expense."}
                     )

                ExpenseShare.objects.create(
                    expense=expense,
                    user_id=user_id,
                    amount_owed=share['amount_owed'],
                    item_name=item_name
                )


# Rest of the code remains the same...

class ExpenseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsExpenseAccessible]



# -------------------------------
# Category Views
# -------------------------------

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []


# -------------------------------
# Group Views
# -------------------------------

class GroupListCreate(generics.ListCreateAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        group_id = self.request.query_params.get('group_id')
        
        if group_id:
            # Filter for a specific group, ensuring the user is a member of it.
            return queryset.filter(id=group_id, members=user)
        else:
            # If no group_id is provided, list all groups the user is a member of.
            return queryset.filter(members=user)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class GroupDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, IsExpenseAccessible]


# -------------------------------
# Expense Share & Settlement Views
# -------------------------------





class ExpenseShareList(generics.ListAPIView):
    serializer_class = ExpenseShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ExpenseShare.objects.all() # Start with all shares

        expense_id = self.request.query_params.get('expense_id')

        if expense_id:
            # 1. Security Check: Ensure the user has access to the requested expense.
            # This prevents a user from viewing shares of an expense they are not involved in.
            try:
                expense = Expense.objects.get(id=expense_id)
            except Expense.DoesNotExist:
                return ExpenseShare.objects.none()  # Return empty queryset if expense doesn't exist

            # Check if the user is the one who paid, or is a member of the expense's group,
            # or is listed as a share receiver.
            if not (expense.paid_by == user or
                    (expense.group and user in expense.group.members.all()) or
                    expense.shares.filter(user=user).exists()):
                return ExpenseShare.objects.none() # Return empty queryset if user has no access

            # 2. Filter the queryset based on the expense_id.
            # This returns all shares for that specific expense.
            queryset = queryset.filter(expense_id=expense_id)

        else:
            # If no expense_id is provided, default to showing the user's personal shares.
            # This is your original logic.
            queryset = queryset.filter(user=user)

        return queryset

class ExpenseShareDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExpenseShare.objects.all()
    serializer_class = ExpenseShareSerializer
    permission_classes = [IsAuthenticated, IsExpenseAccessible]


class SettlementCreate(generics.CreateAPIView):
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        expense_share_id = request.data.get('expense_share')
        try:
            expense_share = ExpenseShare.objects.get(id=expense_share_id)
        except ExpenseShare.DoesNotExist:
            return Response({"detail": "ExpenseShare not found."}, status=status.HTTP_404_NOT_FOUND)

        if not expense_share.is_settled:
            expense_share.is_settled = True
            expense_share.save()

        # ✅ Check if all shares of this expense are settled
        expense = expense_share.expense
        all_settled = not expense.shares.filter(is_settled=False).exists()
        if all_settled:
            expense.is_settled = True   # make sure you have this field in Expense model
            expense.save()

        # Create settlement record
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(settled_by=self.request.user)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# -------------------------------
# Reporting Views
# -------------------------------

class FinancialSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        period_days = request.query_params.get('period_days', 30)
        try:
            period_days = int(period_days)
        except ValueError:
            return Response({"error": "period_days must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        service = FinancialSummaryService(user=request.user, income_model=Income, expense_model=Expense)
        summary = service.get_financial_summary(period_days=period_days)
        return Response(summary, status=status.HTTP_200_OK)


class RecentTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        service = TransactionService(user=request.user, income_model=Income, expense_model=Expense)
        transactions = service.get_user_transactions()
        return Response(transactions, status=status.HTTP_200_OK)
