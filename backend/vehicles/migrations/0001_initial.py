from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="DetectionEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number_plate", models.CharField(blank=True, max_length=16)),
                ("status", models.CharField(choices=[("genuine", "Genuine"), ("fraud", "Possible mismatch"), ("not_found", "Not found"), ("needs_review", "Needs review")], max_length=20)),
                ("detected_vehicle_type", models.CharField(blank=True, max_length=30)),
                ("detected_color", models.CharField(blank=True, max_length=24)),
                ("message", models.CharField(max_length=240)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Vehicle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number_plate", models.CharField(max_length=16, unique=True)),
                ("vehicle_type", models.CharField(choices=[("car", "Car"), ("motorcycle", "Motorcycle"), ("bus", "Bus"), ("truck", "Truck")], max_length=20)),
                ("color", models.CharField(max_length=24)),
                ("make_model", models.CharField(blank=True, max_length=80)),
                ("owner_name", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["number_plate"]},
        ),
    ]
