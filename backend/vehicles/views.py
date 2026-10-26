import hashlib
import json
import logging
import re
from datetime import timedelta
from functools import wraps

from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import DetectionEvent, Vehicle
from .vision import model_state, process_frame

logger = logging.getLogger(__name__)


def _json_body(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Request body must be valid JSON.")
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")
    return data


def _api_login_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Sign in to use vehicle verification."}, status=401)
        return view(request, *args, **kwargs)
    return wrapped


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
    normalized_registered = registered.lower().strip()
    return aliases.get(detected, detected) == aliases.get(normalized_registered, normalized_registered)


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


def _client_ip(request):
    # Only trust X-Forwarded-For when deployment config says requests pass
    # through a trusted edge proxy that overwrites that header.
    if getattr(settings, "TRUST_PROXY_CLIENT_IP", False):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


@require_GET
@never_cache
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrf": "ready"})


@require_POST
@never_cache
def auth_login(request):
    try:
        data = _json_body(request)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    username = str(data.get("username", "")).strip()[:150]
    password = str(data.get("password", ""))
    if not username or not password or len(password) > 1024:
        return JsonResponse({"error": "Enter your username and password."}, status=400)

    key = "login-attempt:" + hashlib.sha256(f"{_client_ip(request)}:{username.casefold()}".encode()).hexdigest()
    if not cache.add(key, 1, timeout=900):
        try:
            attempts = cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=900)
            attempts = 1
        if attempts > 10:
            return JsonResponse({"error": "Too many sign-in attempts. Try again in 15 minutes."}, status=429)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Username or password is incorrect."}, status=401)
    cache.delete(key)
    login(request, user)
    return JsonResponse({"authenticated": True, "username": user.get_username()})


@require_POST
@never_cache
@_api_login_required
def auth_logout(request):
    logout(request)
    return JsonResponse({"authenticated": False})


@require_GET
@never_cache
def auth_session(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})
    return JsonResponse({"authenticated": True, "username": request.user.get_username()})


@require_GET
@never_cache
def health(request):
    states = model_state()
    ready = states["alpr"] == "ready" and states["vehicle"] == "ready"
    return JsonResponse({"status": "ok", "models_ready": ready, "models": {key: states[key] for key in ("alpr", "vehicle")}})


@require_POST
@never_cache
@_api_login_required
def detect(request):
    throttle_key = f"detect-throttle:{request.user.pk}"
    if not cache.add(throttle_key, True, timeout=2):
        return JsonResponse({"error": "A frame was checked recently. Wait a moment before scanning again."}, status=429)
    try:
        data = _json_body(request)
        scan = process_frame(data.get("image"))
        if not isinstance(scan, dict) or not scan.get("status"):
            raise RuntimeError("The vision pipeline returned an invalid result.")
        if scan["status"] == "no_vehicle":
            return JsonResponse(scan)
        return JsonResponse(_result_for_scan(scan))
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except RuntimeError:
        logger.exception("Vehicle detection pipeline failed.")
        return JsonResponse({"error": "Vehicle analysis is unavailable. Check model setup and try again."}, status=503)
    except Exception:
        logger.exception("Unexpected vehicle detection error.")
        return JsonResponse({"error": "Vehicle analysis failed. Try again or contact the system administrator."}, status=500)


@require_GET
@never_cache
@_api_login_required
def vehicle_list(request):
    return JsonResponse({"vehicles": [_vehicle_json(vehicle) for vehicle in Vehicle.objects.all()]})


@require_GET
@never_cache
@_api_login_required
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
