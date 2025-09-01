import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create a Celery instance and name it 'config'.
app = Celery('config')

# Load task settings from the Django settings file.
# The `namespace='CELERY'` argument means all celery-related settings
# should have a `CELERY_` prefix in the settings file (e.g., CELERY_BROKER_URL).
app.config_from_object('django.conf:settings', namespace='CELERY')

# Discover and register tasks from all installed Django apps.
# Celery will automatically find tasks decorated with `@shared_task` in a file named `tasks.py`
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
