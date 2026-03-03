from django.urls import path
from django.http import HttpResponse
from .views import dashboard_view



urlpatterns = [
    path("/", dashboard_view, name = 'dashboard'),
]