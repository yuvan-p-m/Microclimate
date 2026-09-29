"""API Integration and CORS Verification Tests."""
import unittest
from starlette.testclient import TestClient
from backend.app.main import app

class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_and_health_endpoints(self):
        """Verify root and health check endpoints."""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

        resp_health = self.client.get("/health")
        self.assertEqual(resp_health.status_code, 200)
        self.assertEqual(resp_health.json()["status"], "healthy")

        resp_v1_health = self.client.get("/api/v1/health")
        self.assertEqual(resp_v1_health.status_code, 200)
        self.assertEqual(resp_v1_health.json()["status"], "healthy")

    def test_forecast_endpoint_valid(self):
        """Verify GET /api/v1/forecast/{panchayat_id}?date=YYYY-MM-DD returns 200 and schema."""
        resp = self.client.get("/api/v1/forecast/TN_NIL_OOTY_01?date=2024-07-15")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["panchayat"]["id"], "TN_NIL_OOTY_01")
        self.assertEqual(data["input_weather"]["date"], "2024-07-15")
        self.assertIn("final_prediction", data)
        self.assertIn("confidence", data)
        self.assertIn("donor", data)
        self.assertIn("metadata", data)

    def test_forecast_endpoint_invalid_date_format(self):
        """Verify invalid date format returns 400."""
        resp = self.client.get("/api/v1/forecast/TN_NIL_OOTY_01?date=invalid-date")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Invalid date format", resp.json()["detail"])

    def test_forecast_endpoint_missing_panchayat(self):
        """Verify unknown panchayat ID returns 404."""
        resp = self.client.get("/api/v1/forecast/NON_EXISTENT_PANCHAYAT?date=2024-07-15")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("does not exist", resp.json()["detail"])

    def test_cors_vercel_production_origin(self):
        """Verify CORS allows production Vercel deployment."""
        origin = "https://microclimate.vercel.app"
        resp = self.client.get(
            "/api/v1/forecast/TN_NIL_OOTY_01?date=2024-07-15",
            headers={"Origin": origin}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("access-control-allow-origin"), origin)
        self.assertEqual(resp.headers.get("access-control-allow-credentials"), "true")

    def test_cors_vercel_preview_origin(self):
        """Verify CORS allows Vercel preview/branch deployments."""
        origin = "https://microclimate-git-main-user.vercel.app"
        resp = self.client.get(
            "/api/v1/forecast/TN_NIL_OOTY_01?date=2024-07-15",
            headers={"Origin": origin}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("access-control-allow-origin"), origin)
        self.assertEqual(resp.headers.get("access-control-allow-credentials"), "true")

    def test_cors_preflight_options_request(self):
        """Verify CORS preflight OPTIONS request returns 200 and required CORS headers."""
        origin = "https://microclimate.vercel.app"
        resp = self.client.options(
            "/api/v1/forecast/TN_NIL_OOTY_01",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type",
            }
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("access-control-allow-origin"), origin)
        self.assertEqual(resp.headers.get("access-control-allow-credentials"), "true")

if __name__ == "__main__":
    unittest.main()
