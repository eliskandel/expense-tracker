from django.shortcuts import render
from .models import Income,Category
from .serializers import IncomeSerializer,IncomeCategorySerializer
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .filters import IncomeFilter
from rest_framework.permissions import IsAuthenticated
# Create your views here.
class IncomeListCreateView(ListCreateAPIView):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    filterset_class = IncomeFilter
    permission_classes = [IsAuthenticated]
class IncomeRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

class CategoryListCreateView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = IncomeCategorySerializer
    permission_classes = [IsAuthenticated]