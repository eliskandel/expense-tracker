from rest_framework.request import Request as Re
from src.apps.auth.models import User


class Request(Re):
    user: User
