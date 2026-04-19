from __future__ import annotations

import base64
import json
import os
import threading
import time
import urllib.request
import uuid
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


SERVICE_NAME = "Deal Service"
SERVICE_SLUG = "deal-service"
START_TIME = time.time()
REQUEST_COUNTS: Counter[tuple[str, str, int]] = Counter()
EVENT_COUNTS: Counter[str] = Counter()
DATA_LOCK = threading.Lock()

RABBITMQ_MANAGEMENT_URL = os.environ.get("RABBITMQ_MANAGEMENT_URL", "http://rabbitmq:15672/api")
RABBITMQ_USER = os.environ.get("RABBITMQ_USER", "romanestate")
RABBITMQ_PASSWORD = os.environ.get("RABBITMQ_PASSWORD", "romanestate")
EVENT_QUEUE = os.environ.get("EVENT_QUEUE", "romanestate.events")

VIEWING_REQUESTS: list[dict[str, object]] = []
NEXT_ID = 1


def log_json(payload: dict[str, object]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def metrics_payload() -> str:
    lines = [
        "# HELP service_info Static information about the service",
        "# TYPE service_info gauge",
        f'service_info{{service="{SERVICE_NAME}",slug="{SERVICE_SLUG}"}} 1',
        "# HELP process_start_time_seconds Process start time",
        "# TYPE process_start_time_seconds gauge",
        f"process_start_time_seconds {START_TIME}",
        "# HELP http_requests_total Total HTTP requests handled by the service",
        "# TYPE http_requests_total counter",
        "# HELP viewing_requests_total Current number of viewing requests",
        "# TYPE viewing_requests_total gauge",
        f"viewing_requests_total {len(VIEWING_REQUESTS)}",
        "# HELP deal_events_published_total RabbitMQ events published by type",
        "# TYPE deal_events_published_total counter",
    ]

    for (path, method, status), count in sorted(REQUEST_COUNTS.items()):
        lines.append(
            f'http_requests_total{{service="{SERVICE_SLUG}",path="{path}",method="{method}",status="{status}"}} {count}'
        )

    for event_type, count in sorted(EVENT_COUNTS.items()):
        lines.append(f'deal_events_published_total{{event_type="{event_type}"}} {count}')

    return "\n".join(lines) + "\n"


def rabbitmq_headers() -> dict[str, str]:
    token = base64.b64encode(f"{RABBITMQ_USER}:{RABBITMQ_PASSWORD}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    }


def rabbitmq_request(path: str, method: str = "GET", payload: dict[str, object] | None = None) -> tuple[int, str]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url=f"{RABBITMQ_MANAGEMENT_URL.rstrip('/')}/{path.lstrip('/')}",
        method=method,
        headers=rabbitmq_headers(),
        data=body,
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def ensure_queue() -> bool:
    try:
        rabbitmq_request(
            f"queues/%2F/{EVENT_QUEUE}",
            method="PUT",
            payload={"auto_delete": False, "durable": False, "arguments": {}},
        )
        return True
    except Exception:  # noqa: BLE001
        return False


def rabbitmq_ready() -> bool:
    try:
        status, _ = rabbitmq_request("overview")
        return status == 200 and ensure_queue()
    except Exception:  # noqa: BLE001
        return False


def publish_event(event_type: str, payload: dict[str, object]) -> tuple[bool, str]:
    if not ensure_queue():
        return False, "queue not ready"

    event = {
        "event_type": event_type,
        "service": SERVICE_SLUG,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "payload": payload,
    }
    try:
        status, body = rabbitmq_request(
            "exchanges/%2F/amq.default/publish",
            method="POST",
            payload={
                "properties": {},
                "routing_key": EVENT_QUEUE,
                "payload": json.dumps(event),
                "payload_encoding": "string",
            },
        )
        if status == 200 and json.loads(body or "{}").get("routed"):
            EVENT_COUNTS[event_type] += 1
            return True, "published"
        return False, body[:160]
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


class ServiceHandler(BaseHTTPRequestHandler):
    server_version = f"{SERVICE_SLUG}/0.1"

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        return

    def _send_json(self, status_code: int, payload: dict[str, object]) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _send_text(self, status_code: int, payload: str, content_type: str) -> None:
        encoded = payload.encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _read_json_body(self) -> dict[str, object]:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(content_length) if content_length else b"{}"
        return json.loads(raw.decode("utf-8") or "{}")

    def do_GET(self) -> None:  # noqa: N802
        started = time.time()
        path = self.path.split("?", 1)[0]
        request_id = self.headers.get("X-Request-Id") or str(uuid.uuid4())

        status_code = 200
        if path == "/":
            self._send_json(
                200,
                {
                    "service": SERVICE_NAME,
                    "slug": SERVICE_SLUG,
                    "status": "ok",
                    "endpoints": ["/health", "/ready", "/live", "/metrics", "/viewing-requests", "/stats"],
                },
            )
        elif path == "/health":
            self._send_json(200, {"service": SERVICE_SLUG, "status": "ok"})
        elif path == "/ready":
            ready = rabbitmq_ready()
            status_code = 200 if ready else 503
            self._send_json(status_code, {"service": SERVICE_SLUG, "status": "ok" if ready else "degraded", "rabbitmq": ready})
        elif path == "/live":
            self._send_json(200, {"service": SERVICE_SLUG, "status": "ok"})
        elif path == "/metrics":
            self._send_text(200, metrics_payload(), "text/plain; version=0.0.4; charset=utf-8")
        elif path == "/viewing-requests":
            self._send_json(200, {"items": VIEWING_REQUESTS, "count": len(VIEWING_REQUESTS)})
        elif path == "/stats":
            self._send_json(200, {"viewing_requests_total": len(VIEWING_REQUESTS), "events_published": dict(EVENT_COUNTS)})
        else:
            status_code = 404
            self._send_json(404, {"service": SERVICE_SLUG, "status": "not_found", "path": path})

        REQUEST_COUNTS[(path, self.command, status_code)] += 1
        duration_ms = round((time.time() - started) * 1000, 2)
        log_json(
            {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "level": "INFO",
                "service": SERVICE_SLUG,
                "request_id": request_id,
                "method": self.command,
                "path": path,
                "status": status_code,
                "duration_ms": duration_ms,
            }
        )

    def do_POST(self) -> None:  # noqa: N802
        global NEXT_ID

        started = time.time()
        path = self.path.split("?", 1)[0]
        request_id = self.headers.get("X-Request-Id") or str(uuid.uuid4())
        status_code = 201

        if path != "/viewing-requests":
            status_code = 404
            self._send_json(404, {"service": SERVICE_SLUG, "status": "not_found", "path": path})
        else:
            payload = self._read_json_body()
            with DATA_LOCK:
                item = {
                    "id": NEXT_ID,
                    "listing_id": int(payload.get("listing_id") or 0),
                    "visitor_email": str(payload.get("visitor_email") or "buyer@example.com"),
                    "status": "scheduled",
                }
                NEXT_ID += 1
                VIEWING_REQUESTS.append(item)

            published, detail = publish_event("viewing-request.created", item)
            self._send_json(
                201,
                {
                    "item": item,
                    "event_published": published,
                    "event_detail": detail,
                },
            )

        REQUEST_COUNTS[(path, self.command, status_code)] += 1
        duration_ms = round((time.time() - started) * 1000, 2)
        log_json(
            {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "level": "INFO",
                "service": SERVICE_SLUG,
                "request_id": request_id,
                "method": self.command,
                "path": path,
                "status": status_code,
                "duration_ms": duration_ms,
            }
        )


def create_server(host: str, port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), ServiceHandler)


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8080"))
    server = create_server(host, port)
    log_json(
        {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": "INFO",
            "service": SERVICE_SLUG,
            "message": f"Starting {SERVICE_NAME} on {host}:{port}",
        }
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
