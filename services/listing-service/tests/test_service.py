from __future__ import annotations

import json
import sys
import threading
import time
import unittest
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app.server as listing_server


class ListingServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        listing_server.publish_event = lambda *_args, **_kwargs: (True, "published")
        listing_server.rabbitmq_ready = lambda: True
        cls.server = listing_server.create_server("127.0.0.1", 0)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def get(self, path: str) -> tuple[int, dict[str, object] | str]:
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}{path}", timeout=5) as response:
            body = response.read().decode("utf-8")
            if path == "/metrics":
                return response.status, body
            return response.status, json.loads(body)

    def post(self, path: str, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_health_endpoints(self) -> None:
        for path in ("/health", "/ready", "/live"):
            status, body = self.get(path)
            self.assertEqual(status, 200)
            self.assertEqual(body["status"], "ok")

    def test_create_listing(self) -> None:
        status, body = self.post("/listings", {"title": "River View", "city": "Kazan", "price": 9900000})
        self.assertEqual(status, 201)
        self.assertTrue(body["event_published"])
        self.assertEqual(body["item"]["title"], "River View")

    def test_metrics_endpoint(self) -> None:
        self.get("/health")
        status, body = self.get("/metrics")
        self.assertEqual(status, 200)
        self.assertIn("http_requests_total", body)
        self.assertIn("listings_total", body)
