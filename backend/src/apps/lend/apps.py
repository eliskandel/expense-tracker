from django.apps import AppConfig


class LendConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "src.apps.lend"

    def ready(self):
        import src.apps.lend.signals  # noqa
