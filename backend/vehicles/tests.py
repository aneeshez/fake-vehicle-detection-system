import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings

from .models import DetectionEvent, Vehicle
from .views import _client_ip, _result_for_scan


class VehicleVerificationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.vehicle = Vehicle.objects.create(
            number_plate="KL 21 X 5028",
            vehicle_type="car",
            color="gray",
            make_model="Sample model",
        )
        self.user = get_user_model().objects.create_user(username="operator", password="StrongPass123!")

    def scan(self, plate="KL21X5028", vehicle_type="car", color="silver", confidence=0.9):
        return {
            "status": "candidate",
            "number_plate": plate,
            "ocr_confidence": confidence,
            "detected_vehicle": {"vehicle_type": vehicle_type, "color": color},
        }

    def test_matching_vehicle_returns_genuine_and_logs_event(self):
        response = _result_for_scan(self.scan())
        self.assertEqual(response["status"], "genuine")
        self.assertEqual(response["number_plate"], "KL21X5028")
        self.assertEqual(DetectionEvent.objects.count(), 1)

    def test_mismatch_is_labeled_for_review_not_proof(self):
        response = _result_for_scan(self.scan(vehicle_type="truck", color="red"))
        self.assertEqual(response["status"], "fraud")
        self.assertIn("registered", response["message"])
        self.assertEqual(response["checks"], {"vehicle_type": False, "color": False})

    def test_missing_plate_is_not_found(self):
        response = _result_for_scan(self.scan(plate="KL99ZZ0001"))
        self.assertEqual(response["status"], "not_found")
        self.assertIsNone(response["registered_vehicle"])

    def test_low_confidence_plate_is_not_looked_up(self):
        response = _result_for_scan(self.scan(confidence=0.1))
        self.assertEqual(response["status"], "unreadable")
        self.assertEqual(DetectionEvent.objects.count(), 0)

    def test_vehicle_and_event_data_require_a_session(self):
        self.assertEqual(self.client.get("/api/vehicles/").status_code, 401)
        self.assertEqual(self.client.get("/api/events/").status_code, 401)
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/api/vehicles/").status_code, 200)
        self.assertEqual(self.client.get("/api/events/").status_code, 200)

    def test_forwarded_client_ip_is_used_only_when_proxy_trust_is_enabled(self):
        request = type("Request", (), {"META": {
            "REMOTE_ADDR": "172.20.0.4",
            "HTTP_X_FORWARDED_FOR": "203.0.113.10, 172.20.0.3",
        }})()
        self.assertEqual(_client_ip(request), "172.20.0.4")
        with override_settings(TRUST_PROXY_CLIENT_IP=True):
            self.assertEqual(_client_ip(request), "203.0.113.10")

    def test_login_requires_csrf_and_creates_a_session(self):
        client = Client(enforce_csrf_checks=True)
        csrf_response = client.get("/api/auth/csrf/")
        csrf = csrf_response.cookies["csrftoken"].value
        payload = json.dumps({"username": "operator", "password": "StrongPass123!"})
        self.assertEqual(client.post("/api/auth/login/", payload, content_type="application/json").status_code, 403)
        response = client.post(
            "/api/auth/login/",
            payload,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(client.get("/api/auth/session/").json()["username"], "operator")

    def test_model_failure_does_not_leak_exception_detail(self):
        self.client.force_login(self.user)
        with patch("vehicles.views.process_frame", side_effect=RuntimeError("private model path")):
            response = self.client.post(
                "/api/detect/",
                data=json.dumps({"image": "data:image/jpeg;base64,YQ=="}),
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private model path", response.content.decode())
