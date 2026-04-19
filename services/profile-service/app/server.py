from __future__ import annotations

import json
import os
import socket
import time
import urllib.parse
import uuid
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


SERVICE_NAME = "Profile Service"
SERVICE_SLUG = "profile-service"
START_TIME = time.time()
REQUEST_COUNTS: Counter[tuple[str, str, int]] = Counter()

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))


def log_json(payload: dict[str, object]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def metrics_payload(favorites_total: int) -> str:
    lines = [
        "# HELP service_info Static information about the service",
        "# TYPE service_info gauge",
        f'service_info{{service="{SERVICE_NAME}",slug="{SERVICE_SLUG}"}} 1',
        "# HELP process_start_time_seconds Process start time",
        "# TYPE process_start_time_seconds gauge",
        f"process_start_time_seconds {START_TIME}",
        "# HELP http_requests_total Total HTTP requests handled by the service",
        "# TYPE http_requests_total counter",
        "# HELP profile_favorites_total Number of favorite items for the default demo user",
        "# TYPE profile_favorites_total gauge",
        f"profile_favorites_total {favorites_total}",
    ]

    for (path, method, status), count in sorted(REQUEST_COUNTS.items()):
        lines.append(
            f'http_requests_total{{service="{SERVICE_SLUG}",path="{path}",method="{method}",status="{status}"}} {count}'
        )

    return "\n".join(lines) + "\n"


def encode_command(*parts: str) -> bytes:
    payload = [f"*{len(parts)}\r\n".encode("utf-8")]
    for part in parts:
        encoded = part.encode("utf-8")
        payload.append(f"${len(encoded)}\r\n".encode("utf-8"))
        payload.append(encoded + b"\r\n")
    return b"".join(payload)


def recv_line(sock: socket.socket) -> bytes:
    data = bytearray()
    while not data.endswith(b"\r\n"):
        chunk = sock.recv(1)
        if not chunk:
            raise ConnectionError("unexpected EOF from Redis")
        data.extend(chunk)
    return bytes(data[:-2])


def recv_exact(sock: socket.socket, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise ConnectionError("unexpected EOF from Redis")
        data.extend(chunk)
    return bytes(data)


def parse_resp(sock: socket.socket) -> object:
    prefix = recv_exact(sock, 1)
    if prefix == b"+":
        return recv_line(sock).decode("utf-8")
    if prefix == b":":
        return int(recv_line(sock))
    if prefix == b"$":
        size = int(recv_line(sock))
        if size == -1:
            return None
        value = recv_exact(sock, size)
        recv_exact(sock, 2)
        return value.decode("utf-8")
    if prefix == b"*":
        size = int(recv_line(sock))
        if size == -1:
            return []
        return [parse_resp(sock) for _ in range(size)]
    if prefix == b"-":
        raise RuntimeError(recv_line(sock).decode("utf-8"))
    raise RuntimeError(f"unsupported RESP prefix: {prefix!r}")


def redis_command(*parts: str) -> object:
    with socket.create_connection((REDIS_HOST, REDIS_PORT), timeout=2) as sock:
        sock.sendall(encode_command(*parts))
        return parse_resp(sock)


def redis_ping() -> bool:
    return redis_command("PING") == "PONG"


def redis_sadd(key: str, member: str) -> int:
    return int(redis_command("SADD", key, member))


def redis_smembers(key: str) -> list[str]:
    result = redis_command("SMEMBERS", key)
    if isinstance(result, list):
        return sorted(str(item) for item in result)
    return []


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
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        request_id = self.headers.get("X-Request-Id") or str(uuid.uuid4())

        status_code = 200
        default_favorites = redis_smembers("favorites:demo-user") if redis_ping() else []
        if path == "/":
            self._send_json(
                200,
                {
                    "service": SERVICE_NAME,
                    "slug": SERVICE_SLUG,
                    "status": "ok",
                    "endpoints": ["/health", "/ready", "/live", "/metrics", "/favorites", "/stats"],
                },
            )
        elif path == "/health":
            self._send_json(200, {"service": SERVICE_SLUG, "status": "ok"})
        elif path == "/ready":
            ready = redis_ping()
            status_code = 200 if ready else 503
            self._send_json(status_code, {"service": SERVICE_SLUG, "status": "ok" if ready else "degraded", "redis": ready})
        elif path == "/live":
            self._send_json(200, {"service": SERVICE_SLUG, "status": "ok"})
        elif path == "/metrics":
            self._send_text(200, metrics_payload(len(default_favorites)), "text/plain; version=0.0.4; charset=utf-8")
        elif path == "/favorites":
            user_id = str(query.get("user_id", ["demo-user"])[0])
            self._send_json(200, {"user_id": user_id, "favorites": redis_smembers(f"favorites:{user_id}")})
        elif path == "/stats":
            self._send_json(200, {"default_user_favorites": default_favorites, "favorites_total": len(default_favorites)})
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
        started = time.time()
        path = self.path.split("?", 1)[0]
        request_id = self.headers.get("X-Request-Id") or str(uuid.uuid4())
        status_code = 201

        if path != "/favorites":
            status_code = 404
            self._send_json(404, {"service": SERVICE_SLUG, "status": "not_found", "path": path})
        else:
            payload = self._read_json_body()
            user_id = str(payload.get("user_id") or "demo-user")
            listing_id = str(payload.get("listing_id") or "0")
            redis_sadd(f"favorites:{user_id}", listing_id)
            self._send_json(201, {"user_id": user_id, "listing_id": listing_id, "status": "stored"})

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
