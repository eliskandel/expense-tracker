import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone
from src.apps.common.utils import image_validate
from src.apps.common.models import BaseModel


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    ADMIN = "admin", "Admin"
    STAFF = "staff", "Staff"
    CLIENT = "client", "Client"


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, first_name, last_name, password=None):
        user = self.create_user(
            username,
            email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        
        )
        user.is_staff = True
        user.is_superuser = True
        user.role = Role.SUPER_ADMIN
        user.save(using=self._db)
        return user


class User(BaseModel, AbstractBaseUser, PermissionsMixin):

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    username = models.CharField(max_length=255, unique=True)
    image = models.ImageField(
        null=True, blank=True, validators=[image_validate], upload_to="profile"
    )
    phone_number = models.CharField(max_length=20, null=True, blank=True, unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN,
    )

    otp = models.CharField(max_length=10, null=True, blank=True)
    otp_tries = models.IntegerField(default=0)
    otp_created_at = models.DateTimeField(null=True, blank=True)

    email_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)
    

    objects: UserManager = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    def __str__(self):
        return self.username


class UserModelMixin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False)

    class Meta:
        abstract = True
