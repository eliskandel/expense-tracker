from django.urls import path    
from .views import IncomeListCreateView, IncomeRetrieveUpdateDestroyView,CategoryListCreateView

urlpatterns = [
    path("", IncomeListCreateView.as_view(), name="income-list-create"),
    path("<int:pk>/", IncomeRetrieveUpdateDestroyView.as_view(), name="income-retrieve-update-destroy"),
    path("categories/", CategoryListCreateView.as_view(), name="income-category-list-create"),
]