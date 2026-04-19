from __future__ import annotations

import json
import sys
import threading
import time
import unittest
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app.server as notification_server


class NotificationServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        notification_server.rabbitmq_ready = lambda: True
        notification_server.EVENT_COUNTS.clear()
        notification_server.EVENT_COUNTS["listing.created"] = 2
        notification_server.RECENT_EVENTS.clear()
        notification_server.RECENT_EVENTS.appendleft({"event_type": "listing.created", "payload": {"id": 1}})
        notification_server.LAST_POLLER_SUCCESS = time.time()
        cls.server = notification_server.create_server("127.0.0.1", 0)
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

    def test_health_endpoints(self) -> None:
        for path in ("/health", "/ready", "/live"):
            status, body = self.get(path)
            self.assertEqual(status, 200)
            self.assertEqual(body["status"], "ok")

    def test_stats_endpoint(self) -> None:
        status, body = self.get("/stats")
        self.assertEqual(status, 200)
        self.assertEqual(body["events_consumed"]["listing.created"], 2)

    def test_metrics_endpoint(self) -> None:
        self.get("/health")
        status, body = self.get("/metrics")
        self.assertEqual(status, 200)
        self.assertIn("http_requests_total", body)
        self.assertIn("notification_events_consumed_total", body)
