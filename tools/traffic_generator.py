#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import json
import sys
import time
import urllib.request
from typing import Any


def request_json(
    url: str,
    method: str = "GET",
    payload: dict[str, object] | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, Any]]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    merged_headers = {"Content-Type": "application/json"}
    if headers:
        merged_headers.update(headers)
    request = urllib.request.Request(url=url, method=method, headers=merged_headers, data=body)
    with urllib.request.urlopen(request, timeout=10) as response:
        return response.status, json.loads(response.read().decode("utf-8") or "{}")


def login(base_url: str, email: str, password: str) -> str:
    status, payload = request_json(
        f"{base_url}/api/auth/login",
        method="POST",
        payload={"email": email, "password": password},
    )
    token = str(payload.get("token") or "")
    if status != 200 or not token:
        raise RuntimeError("unable to obtain auth token")
    return token


def run_iteration(base_url: str, email: str, iteration: int) -> None:
    _, listing_payload = request_json(
        f"{base_url}/api/listings/listings",
        method="POST",
        payload={"title": f"Load Listing {iteration}", "city": "Moscow", "price": 10000000 + iteration},
    )
    listing_id = int(listing_payload["item"]["id"])
    request_json(
        f"{base_url}/api/deals/viewing-requests",
        method="POST",
        payload={"listing_id": listing_id, "visitor_email": email},
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate lightweight traffic against the RomanEstate DevOps lab.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8088", help="edge base URL")
    parser.add_argument("--auth-email", default="admin@example.com", help="demo auth email")
    parser.add_argument("--auth-password", default="Password123!", help="demo auth password")
    parser.add_argument("--iterations", type=int, default=10, help="number of listing/viewing cycles")
    parser.add_argument("--concurrency", type=int, default=3, help="parallel workers")
    parser.add_argument("--json", action="store_true", help="print JSON output")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    started = time.time()
    try:
        login(base_url, args.auth_email, args.auth_password)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            futures = [executor.submit(run_iteration, base_url, args.auth_email, index) for index in range(args.iterations)]
            for future in concurrent.futures.as_completed(futures):
                future.result()

        elapsed = round(time.time() - started, 2)
        result = {
            "iterations": args.iterations,
            "concurrency": args.concurrency,
            "duration_seconds": elapsed,
            "requests_per_second": round((args.iterations * 2) / elapsed, 2) if elapsed else None,
        }
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"traffic generation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
