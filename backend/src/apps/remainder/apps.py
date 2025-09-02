from django.apps import AppConfig


class RemainderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "src.apps.remainder"

    def ready(self):
        import src.apps.remainder.signals