from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

api_prefix: str = "api"


urlpatterns = [
    path("admin/", admin.site.urls),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
                        path("auth/", include("src.apps.auth.urls")),
                        path("income/", include("src.apps.income.urls")),
                        path("expense/", include("src.apps.expense.urls")),
                        path("budget/", include("src.apps.budget.urls")),
                        path("lend/", include("src.apps.lend.urls")),
                        path("notification/", include("src.apps.notification.urls")),
                        path("chatbot/", include("src.apps.chatbot.urls")),
                        path("event/", include("src.apps.event.urls")),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
