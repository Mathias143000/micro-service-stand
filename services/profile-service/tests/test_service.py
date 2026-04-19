from __future__ import annotations

import json
import sys
import threading
import time
import unittest
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app.server as profile_server


class ProfileServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.favorite_store: dict[str, set[str]] = {}
        profile_server.redis_ping = lambda: True
        profile_server.redis_sadd = lambda key, member: cls.favorite_store.setdefault(key, set()).add(member) or 1
        profile_server.redis_smembers = lambda key: sorted(cls.favorite_store.get(key, set()))
        cls.server = profile_server.create_server("127.0.0.1", 0)
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

    def test_store_favorite(self) -> None:
        status, body = self.post("/favorites", {"user_id": "demo-user", "listing_id": "42"})
        self.assertEqual(status, 201)
        self.assertEqual(body["status"], "stored")
        _, favorites = self.get("/favorites?user_id=demo-user")
        self.assertIn("42", favorites["favorites"])

    def test_metrics_endpoint(self) -> None:
        self.get("/health")
        status, body = self.get("/metrics")
        self.assertEqual(status, 200)
        self.assertIn("http_requests_total", body)
        self.assertIn("profile_favorites_total", body)
