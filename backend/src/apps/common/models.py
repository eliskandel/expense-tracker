from django.db import models
import uuid


class Status(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "InActive"


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(
        max_length=30,
        null=False,
        blank=False,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True