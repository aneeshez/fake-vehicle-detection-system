from django.contrib import admin
from django.urls import path
from vehicles import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", views.health),
    path("api/detect/", views.detect),
    path("api/vehicles/", views.vehicle_list),
    path("api/events/", views.event_list),
]
