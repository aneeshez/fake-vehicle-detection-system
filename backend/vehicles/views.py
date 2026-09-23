import json
import re
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import DetectionEvent, Vehicle
from .vision import model_state, process_frame


def _json_body(request):
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Request body must be valid JSON.")


def _vehicle_json(vehicle):
    return {
        "id": vehicle.id,
        "number_plate": vehicle.number_plate,
        "vehicle_type": vehicle.vehicle_type,
        "color": vehicle.color,
        "make_model": vehicle.make_model,
    }


def _normalize_plate(value):
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def _color_matches(detected, registered):
    aliases = {"silver": "gray", "grey": "gray", "maroon": "red", "navy": "blue"}
    return aliases.get(detected, detected) == aliases.get(registered.lower().strip(), registered.lower().strip())


def _result_for_scan(scan):
    plate = _normalize_plate(scan.get("number_plate"))
    vehicle_data = scan.get("detected_vehicle") or {}
    detected_type = str(vehicle_data.get("vehicle_type", "")).lower()
    detected_color = str(vehicle_data.get("color", "")).lower()
    response = {
        **scan,
        "number_plate": plate,
        "detected_vehicle": vehicle_data or None,
        "registered_vehicle": None,
        "checks": {"vehicle_type": None, "color": None},
    }

    if not plate:
        response["status"] = "unreadable"
        response["message"] = "A plate region was found, but its text could not be read. Try a closer, sharper frame."
        return response
    if len(plate) < 6 or (scan.get("ocr_confidence") is not None and scan["ocr_confidence"] < 0.35):
        response["status"] = "unreadable"
        response["message"] = "The plate text is too uncertain to check safely. Try a closer, sharper frame."
        return response

    vehicle = Vehicle.objects.filter(number_plate=plate).first()
    if vehicle is None:
        response["status"] = "not_found"
        response["message"] = "This number plate is not in the registered vehicle database."
        _save_event(plate, "not_found", detected_type, detected_color, response["message"])
        return response

    response["registered_vehicle"] = _vehicle_json(vehicle)
    if not detected_type or not detected_color:
        response["status"] = "needs_review"
        response["message"] = "The plate is registered, but the vehicle could not be compared clearly. Review this capture."
        _save_event(plate, "needs_review", detected_type, detected_color, response["message"])
        return response

    type_match = detected_type == vehicle.vehicle_type
    color_match = _color_matches(detected_color, vehicle.color)
    response["checks"] = {"vehicle_type": type_match, "color": color_match}
    mismatches = []
    if not type_match:
        mismatches.append(f"vehicle type is {detected_type}; registered as {vehicle.vehicle_type}")
    if not color_match:
        mismatches.append(f"color is {detected_color}; registered as {vehicle.color}")
    if mismatches:
        response["status"] = "fraud"
        response["message"] = "Registered plate found, but " + " and ".join(mismatches) + "."
    else:
        response["status"] = "genuine"
        response["message"] = "The plate is registered and the detected vehicle type and color match."
    _save_event(plate, response["status"], detected_type, detected_color, response["message"])
    return response


def _save_event(plate, status, vehicle_type, color, message):
    recent_cutoff = timezone.now() - timedelta(seconds=30)
    if not DetectionEvent.objects.filter(number_plate=plate, status=status, created_at__gte=recent_cutoff).exists():
        DetectionEvent.objects.create(
            number_plate=plate,
            status=status,
            detected_vehicle_type=vehicle_type,
            detected_color=color,
            message=message,
        )


@require_GET
def health(request):
    return JsonResponse({"status": "ok", "models": model_state()})


@csrf_exempt
@require_POST
def detect(request):
    try:
        data = _json_body(request)
        scan = process_frame(data.get("image"))
        if scan["status"] == "no_vehicle":
            return JsonResponse(scan)
        return JsonResponse(_result_for_scan(scan))
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc), "models": model_state()}, status=503)
    except Exception as exc:
        return JsonResponse({"error": f"Frame analysis failed: {exc}"}, status=500)


@require_GET
def vehicle_list(request):
    return JsonResponse({"vehicles": [_vehicle_json(vehicle) for vehicle in Vehicle.objects.all()]})


@require_GET
def event_list(request):
    events = DetectionEvent.objects.all()[:30]
    return JsonResponse({"events": [{
        "number_plate": event.number_plate,
        "status": event.status,
        "detected_vehicle_type": event.detected_vehicle_type,
        "detected_color": event.detected_color,
        "message": event.message,
        "created_at": event.created_at.isoformat(),
    } for event in events]})
