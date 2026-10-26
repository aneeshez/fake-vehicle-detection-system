from django.contrib import admin
from .models import DetectionEvent, Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("number_plate", "vehicle_type", "color", "make_model", "owner_name")
    search_fields = ("number_plate", "make_model", "owner_name")
    list_filter = ("vehicle_type", "color")


@admin.register(DetectionEvent)
class DetectionEventAdmin(admin.ModelAdmin):
    list_display = ("number_plate", "status", "detected_vehicle_type", "detected_color", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("number_plate",)
    readonly_fields = (
        "number_plate",
        "status",
        "detected_vehicle_type",
        "detected_color",
        "message",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
