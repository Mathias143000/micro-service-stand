#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class SmokeResult:
    name: str
    ok: bool
    status: int | None
    detail: str


def http_request(url: str, method: str = "GET", headers: dict[str, str] | None = None, body: bytes | None = None) -> tuple[int, str]:
    request = urllib.request.Request(url=url, method=method, headers=headers or {}, data=body)
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = response.read().decode("utf-8", errors="replace")
        return response.status, payload


def check_endpoint(name: str, url: str) -> SmokeResult:
    try:
        status, payload = http_request(url)
        detail = payload[:160].replace("\n", " ").strip()
        return SmokeResult(name=name, ok=200 <= status < 400, status=status, detail=detail)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:160].replace("\n", " ").strip()
        return SmokeResult(name=name, ok=False, status=exc.code, detail=detail or str(exc))
    except Exception as exc:  # noqa: BLE001
        return SmokeResult(name=name, ok=False, status=None, detail=str(exc))


def check_endpoint_with_retry(name: str, url: str, retries: int = 5, delay_seconds: float = 2.0) -> SmokeResult:
    last_result = SmokeResult(name=name, ok=False, status=None, detail="no attempts made")

    for attempt in range(retries):
        last_result = check_endpoint(name, url)
        if last_result.ok:
            return last_result

        if attempt < retries - 1:
            time.sleep(delay_seconds)

    return last_result


def query_loki_count(loki_url: str, service_label: str) -> tuple[int, float]:
    query = f'sum(count_over_time({{service="{service_label}"}}[15m]))'
    query_string = urllib.parse.urlencode({"query": query})
    status, body = http_request(f"{loki_url.rstrip('/')}/loki/api/v1/query?{query_string}")
    payload: dict[str, Any] = json.loads(body or "{}")
    results = payload.get("data", {}).get("result", [])
    if not results:
        return status, 0.0

    value = results[0].get("value", [0, "0"])
    return status, float(value[1])


def check_loki_logs(loki_url: str, service_label: str) -> SmokeResult:
    last_detail = "no log lines indexed yet"
    last_status: int | None = None

    for _ in range(5):
        try:
            status, count = query_loki_count(loki_url, service_label)
            last_status = status
            if count > 0:
                detail = f"{int(count)} log lines indexed for service={service_label}"
                return SmokeResult("loki:logs", ok=True, status=status, detail=detail)
            last_detail = f"0 log lines indexed for service={service_label}"
        except urllib.error.HTTPError as exc:
            last_status = exc.code
            last_detail = exc.read().decode("utf-8", errors="replace")[:160].replace("\n", " ").strip() or str(exc)
        except Exception as exc:  # noqa: BLE001
            last_detail = str(exc)

        time.sleep(2)

    return SmokeResult("loki:logs", ok=False, status=last_status, detail=last_detail)


def check_service_endpoints(base_url: str) -> list[SmokeResult]:
    routes = {
        "listing:ready": "/api/listings/ready",
        "deal:ready": "/api/deals/ready",
        "profile:ready": "/api/profile/ready",
        "notification:ready": "/api/notifications/ready",
    }
    return [
        check_endpoint_with_retry(name, f"{base_url.rstrip('/')}{path}", retries=8, delay_seconds=2.0)
        for name, path in routes.items()
    ]


def query_tempo_search(tempo_url: str, service_name: str) -> tuple[int, dict[str, Any]]:
    query_string = urllib.parse.urlencode({"tags": f"service.name={service_name}", "limit": 10})
    status, body = http_request(f"{tempo_url.rstrip('/')}/api/search?{query_string}")
    return status, json.loads(body or "{}")


def extract_trace_count(payload: dict[str, Any]) -> int:
    if isinstance(payload.get("traces"), list):
        return len(payload["traces"])
    data = payload.get("data")
    if isinstance(data, dict) and isinstance(data.get("traces"), list):
        return len(data["traces"])
    if isinstance(data, list):
        return len(data)
    results = payload.get("results")
    if isinstance(results, list):
        return len(results)
    return 0


def check_tempo_traces(tempo_url: str, service_name: str) -> SmokeResult:
    last_payload: dict[str, Any] = {}
    last_status: int | None = None

    for _ in range(6):
        try:
            status, payload = query_tempo_search(tempo_url, service_name)
            last_status = status
            trace_count = extract_trace_count(payload)
            if trace_count > 0:
                return SmokeResult("tempo:traces", ok=True, status=status, detail=f"{trace_count} traces indexed for service.name={service_name}")
            last_payload = payload
        except urllib.error.HTTPError as exc:
            last_status = exc.code
            last_payload = {"error": exc.read().decode("utf-8", errors="replace")[:160]}
        except Exception as exc:  # noqa: BLE001
            last_payload = {"error": str(exc)}

        time.sleep(2)

    detail = json.dumps(last_payload, ensure_ascii=False)[:160]
    return SmokeResult("tempo:traces", ok=False, status=last_status, detail=detail or "no traces indexed")


def check_observability(
    prometheus_url: str,
    grafana_url: str,
    alertmanager_url: str,
    loki_url: str,
    loki_service_label: str,
    tempo_url: str,
    trace_service_name: str,
    check_logs: bool,
    check_tracing: bool,
) -> list[SmokeResult]:
    results = [
        check_endpoint_with_retry("prometheus:ready", f"{prometheus_url.rstrip('/')}/-/ready", retries=8, delay_seconds=2.0),
        check_endpoint_with_retry("grafana:health", f"{grafana_url.rstrip('/')}/api/health", retries=8, delay_seconds=2.0),
        check_endpoint_with_retry("alertmanager:ready", f"{alertmanager_url.rstrip('/')}/-/ready", retries=8, delay_seconds=2.0),
        check_endpoint_with_retry("loki:ready", f"{loki_url.rstrip('/')}/ready", retries=12, delay_seconds=3.0),
        check_endpoint_with_retry("tempo:ready", f"{tempo_url.rstrip('/')}/ready", retries=12, delay_seconds=3.0),
    ]

    if check_logs and results[3].ok:
        results.append(check_loki_logs(loki_url, loki_service_label))
    if check_tracing and results[4].ok:
        results.append(check_tempo_traces(tempo_url, trace_service_name))

    return results


def check_auth_flow(base_url: str, email: str, password: str) -> list[SmokeResult]:
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    last_login_result = SmokeResult("auth:login", ok=False, status=None, detail="no attempts made")

    for attempt in range(8):
        try:
            status, body = http_request(f"{base_url}/api/auth/login", method="POST", headers=headers, body=payload)
            data: dict[str, Any] = json.loads(body or "{}")
            token = str(data.get("token") or "")
            last_login_result = SmokeResult("auth:login", ok=bool(token), status=status, detail="token received" if token else body[:160])

            if token:
                me_status, me_body = http_request(
                    f"{base_url}/api/auth/me",
                    headers={"Authorization": f"Bearer {token}"},
                )
                me_result = SmokeResult("auth:me", ok=200 <= me_status < 400, status=me_status, detail=me_body[:160].replace("\n", " ").strip())
                return [last_login_result, me_result]
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:160].replace("\n", " ").strip()
            last_login_result = SmokeResult("auth:login", ok=False, status=exc.code, detail=detail or str(exc))
        except Exception as exc:  # noqa: BLE001
            last_login_result = SmokeResult("auth:login", ok=False, status=None, detail=str(exc))

        if attempt < 7:
            time.sleep(5)

    return [last_login_result]


def main() -> int:
    parser = argparse.ArgumentParser(description="Run lightweight HTTP smoke checks for the RomanEstate DevOps lab.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8088", help="base URL of the edge or service")
    parser.add_argument("--json", action="store_true", help="print JSON output")
    parser.add_argument("--check-auth", action="store_true", help="also run auth login/me checks")
    parser.add_argument("--check-services", action="store_true", help="check extracted domain services through the edge")
    parser.add_argument("--check-observability", action="store_true", help="also run Prometheus/Grafana/Alertmanager checks")
    parser.add_argument("--check-logs", action="store_true", help="query Loki for indexed logs after smoke traffic")
    parser.add_argument("--check-tracing", action="store_true", help="query Tempo for traces after auth traffic")
    parser.add_argument("--skip-public-root", action="store_true", help="skip the / check when the public frontend is not running")
    parser.add_argument("--auth-email", default="admin@example.com", help="email for auth smoke")
    parser.add_argument("--auth-password", default="Password123!", help="password for auth smoke")
    parser.add_argument("--prometheus-url", default="http://127.0.0.1:9090", help="Prometheus base URL")
    parser.add_argument("--grafana-url", default="http://127.0.0.1:3000", help="Grafana base URL")
    parser.add_argument("--alertmanager-url", default="http://127.0.0.1:9093", help="Alertmanager base URL")
    parser.add_argument("--loki-url", default="http://127.0.0.1:3100", help="Loki base URL")
    parser.add_argument("--loki-service-label", default="auth-service", help="service label to query in Loki")
    parser.add_argument("--tempo-url", default="http://127.0.0.1:3200", help="Tempo base URL")
    parser.add_argument("--trace-service-name", default="auth-service", help="service.name label to query in Tempo")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    results = [check_endpoint("health", f"{base_url}/healthz")]

    if not args.skip_public_root:
        results.append(check_endpoint("public-root", f"{base_url}/"))

    if args.check_auth:
        results.extend(check_auth_flow(base_url, args.auth_email, args.auth_password))

    if args.check_services:
        results.extend(check_service_endpoints(base_url))

    if args.check_observability:
        results.extend(
            check_observability(
                args.prometheus_url,
                args.grafana_url,
                args.alertmanager_url,
                args.loki_url,
                args.loki_service_label,
                args.tempo_url,
                args.trace_service_name,
                args.check_logs,
                args.check_tracing,
            )
        )

    if args.json:
        print(json.dumps([asdict(result) for result in results], ensure_ascii=False, indent=2))
    else:
        for result in results:
            status = result.status if result.status is not None else "-"
            prefix = "OK" if result.ok else "FAIL"
            print(f"[{prefix}] {result.name} ({status}): {result.detail}")

    return 0 if all(result.ok for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
