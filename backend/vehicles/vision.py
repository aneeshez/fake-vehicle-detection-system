import base64
import binascii
import io
import os
import re
import threading
import warnings

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from django.conf import settings
from fast_alpr import ALPR
from ultralytics import YOLO


_model_lock = threading.Lock()
_inference_lock = threading.Lock()
_alpr = None
_vehicle_model = None
_model_state = {"alpr": "not_loaded", "vehicle": "not_loaded", "error": ""}
VEHICLE_CLASS_IDS = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


def model_state():
    with _model_lock:
        return {"alpr": _model_state["alpr"], "vehicle": _model_state["vehicle"], "error": _model_state["error"]}


def _get_models():
    global _alpr, _vehicle_model
    with _model_lock:
        if _alpr is None:
            _model_state["alpr"] = "loading"
            try:
                _alpr = ALPR(
                    detector_model=os.getenv("ALPR_DETECTOR_MODEL", "yolo-v9-t-384-license-plate-end2end"),
                    ocr_model=os.getenv("ALPR_OCR_MODEL", "cct-xs-v2-global-model"),
                )
                _model_state["alpr"] = "ready"
            except Exception as exc:
                _model_state["alpr"] = "error"
                _model_state["error"] = f"Could not load plate detector/OCR: {exc}"
                raise RuntimeError(_model_state["error"]) from exc

        if _vehicle_model is None:
            _model_state["vehicle"] = "loading"
            try:
                _vehicle_model = YOLO(os.getenv("VEHICLE_MODEL", "yolo26n.pt"))
                _model_state["vehicle"] = "ready"
            except Exception as exc:
                _model_state["vehicle"] = "error"
                _model_state["error"] = f"Could not load vehicle detector: {exc}"
                raise RuntimeError(_model_state["error"]) from exc
        _model_state["error"] = ""
    return _alpr, _vehicle_model


def _decode_image(data_url):
    if not isinstance(data_url, str):
        raise ValueError("Send a JPEG image in the 'image' field.")
    encoded = data_url.split(",", 1)[1] if "," in data_url else data_url
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("The image data is not valid base64.") from exc
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError("The image must be smaller than 8 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as source:
                if source.format not in {"JPEG", "PNG", "WEBP"}:
                    raise ValueError("Use a JPEG, PNG, or WebP image.")
                if source.width * source.height > 20_000_000:
                    raise ValueError("The image dimensions are too large. Use an image under 20 megapixels.")
                source.verify()
    except ValueError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning, OSError) as exc:
        raise ValueError("The image file is not valid or is too large to process.") from exc
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None or image.size == 0:
        raise ValueError("The image could not be decoded.")
    return image


def _encode_image(image):
    if image is None or image.size == 0:
        return None
    ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 78])
    if not ok:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("ascii")


def _mean_confidence(confidence):
    if confidence is None:
        return None
    values = confidence if isinstance(confidence, (list, tuple, np.ndarray)) else [confidence]
    values = [float(value) for value in values if value is not None]
    return round(sum(values) / len(values), 3) if values else None


def _dominant_color(crop):
    if crop is None or crop.size == 0:
        return ""
    # Sample central pixels to reduce background around the vehicle box.
    height, width = crop.shape[:2]
    inset_y, inset_x = int(height * 0.12), int(width * 0.12)
    sample = crop[inset_y:max(inset_y + 1, height - inset_y), inset_x:max(inset_x + 1, width - inset_x)]
    hsv = cv2.cvtColor(sample, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]
    colorful = (saturation > 55) & (value > 45)
    if int(colorful.sum()) > sample.shape[0] * sample.shape[1] * 0.03:
        hue = float(np.median(hsv[:, :, 0][colorful]))
        if hue < 8 or hue >= 170:
            return "red"
        if hue < 22:
            return "orange"
        if hue < 38:
            return "yellow"
        if hue < 86:
            return "green"
        if hue < 132:
            return "blue"
        return "purple"
    median_value = float(np.median(value))
    if median_value < 55:
        return "black"
    if median_value > 190:
        return "white"
    return "gray"


def _vehicle_detections(frame, model):
    result = model.predict(frame, imgsz=640, conf=0.28, verbose=False)[0]
    found = []
    if result.boxes is None:
        return found
    for box in result.boxes:
        class_id = int(box.cls.item())
        if class_id not in VEHICLE_CLASS_IDS:
            continue
        x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
        x1, y1 = max(x1, 0), max(y1, 0)
        x2, y2 = min(x2, frame.shape[1]), min(y2, frame.shape[0])
        if x2 <= x1 or y2 <= y1:
            continue
        crop = frame[y1:y2, x1:x2]
        found.append({
            "box": [x1, y1, x2, y2],
            "type": VEHICLE_CLASS_IDS[class_id],
            "confidence": round(float(box.conf.item()), 3),
            "color": _dominant_color(crop),
            "crop": crop,
        })
    return found


def _box_values(detection):
    box = detection.bounding_box
    return [
        max(0, int(box.x1)), max(0, int(box.y1)),
        int(box.x2), int(box.y2),
    ]


def process_frame(data_url):
    frame = _decode_image(data_url)
    with _inference_lock:
        alpr, vehicle_model = _get_models()
        vehicles = _vehicle_detections(frame, vehicle_model)
        plates = alpr.predict(frame)

    candidates = []
    for item in plates:
        text = "" if item.ocr is None else re.sub(r"[^A-Z0-9]", "", item.ocr.text.upper())
        box = _box_values(item.detection)
        box[0] = min(max(box[0], 0), frame.shape[1])
        box[1] = min(max(box[1], 0), frame.shape[0])
        box[2] = min(max(box[2], 0), frame.shape[1])
        box[3] = min(max(box[3], 0), frame.shape[0])
        x1, y1, x2, y2 = box
        if x2 <= x1 or y2 <= y1:
            continue
        center_x, center_y = (x1 + x2) / 2, (y1 + y2) / 2
        associated = [vehicle for vehicle in vehicles if (
            vehicle["box"][0] <= center_x <= vehicle["box"][2]
            and vehicle["box"][1] <= center_y <= vehicle["box"][3]
        )]
        vehicle = max(associated, key=lambda candidate: candidate["confidence"], default=None)
        crop = frame[y1:min(y2, frame.shape[0]), x1:min(x2, frame.shape[1])]
        candidates.append({
            "text": text,
            "ocr_confidence": _mean_confidence(None if item.ocr is None else item.ocr.confidence),
            "plate_confidence": round(float(item.detection.confidence), 3),
            "plate_box": box,
            "plate_crop": crop,
            "vehicle": vehicle,
        })

    if not candidates:
        return {
            "status": "no_vehicle",
            "message": "No number plate was detected in this frame.",
            "annotated_image": _encode_image(frame),
            "plate_crop": None,
            "vehicle_crop": None,
            "number_plate": "",
            "detected_vehicle": None,
            "vehicle_detected": bool(vehicles),
        }

    selected = max(candidates, key=lambda candidate: (
        bool(candidate["text"]), candidate["plate_confidence"],
        (candidate["plate_box"][2] - candidate["plate_box"][0]) * (candidate["plate_box"][3] - candidate["plate_box"][1]),
    ))
    annotated = frame.copy()
    x1, y1, x2, y2 = selected["plate_box"]
    cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 157), 3)
    if selected["text"]:
        cv2.putText(annotated, selected["text"], (x1, max(24, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 157), 2)

    vehicle = selected["vehicle"]
    if vehicle:
        vx1, vy1, vx2, vy2 = vehicle["box"]
        cv2.rectangle(annotated, (vx1, vy1), (vx2, vy2), (255, 210, 70), 2)

    return {
        "status": "candidate",
        "message": "Plate captured. Checking the registered record.",
        "annotated_image": _encode_image(annotated),
        "plate_crop": _encode_image(selected["plate_crop"]),
        "vehicle_crop": None if vehicle is None else _encode_image(vehicle["crop"]),
        "number_plate": selected["text"],
        "ocr_confidence": selected["ocr_confidence"],
        "plate_confidence": selected["plate_confidence"],
        "plate_box": selected["plate_box"],
        "vehicle_detected": vehicle is not None,
        "detected_vehicle": None if vehicle is None else {
            "vehicle_type": vehicle["type"],
            "color": vehicle["color"],
            "confidence": vehicle["confidence"],
            "box": vehicle["box"],
        },
    }
