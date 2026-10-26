import re

from django.core.exceptions import ValidationError
from django.db import models


class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ("car", "Car"),
        ("motorcycle", "Motorcycle"),
        ("bus", "Bus"),
        ("truck", "Truck"),
    ]

    number_plate = models.CharField(max_length=16, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    color = models.CharField(max_length=24)
    make_model = models.CharField(max_length=80, blank=True)
    owner_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number_plate"]

    def save(self, *args, **kwargs):
        self.number_plate = re.sub(r"[^A-Z0-9]", "", self.number_plate.upper())
        if not self.number_plate:
            raise ValidationError({"number_plate": "Enter a valid vehicle plate."})
        self.color = self.color.strip().lower()
        self.vehicle_type = self.vehicle_type.strip().lower()
        if self.vehicle_type not in dict(self.VEHICLE_TYPES):
            raise ValidationError({"vehicle_type": "Choose a supported vehicle type."})
        if not self.color:
            raise ValidationError({"color": "Enter a vehicle color."})
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.number_plate} — {self.make_model or self.get_vehicle_type_display()}"


class DetectionEvent(models.Model):
    STATUS_CHOICES = [
        ("genuine", "Genuine"),
        ("fraud", "Possible mismatch"),
        ("not_found", "Not found"),
        ("needs_review", "Needs review"),
    ]

    number_plate = models.CharField(max_length=16, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    detected_vehicle_type = models.CharField(max_length=30, blank=True)
    detected_color = models.CharField(max_length=24, blank=True)
    message = models.CharField(max_length=240)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
