from django.contrib import admin
from django.urls import path
from vehicles import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/csrf/", views.csrf_token),
    path("api/auth/login/", views.auth_login),
    path("api/auth/logout/", views.auth_logout),
    path("api/auth/session/", views.auth_session),
    path("api/health/", views.health),
    path("api/detect/", views.detect),
    path("api/vehicles/", views.vehicle_list),
    path("api/events/", views.event_list),
]
