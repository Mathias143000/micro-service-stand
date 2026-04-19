#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
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


def wait_for_notifications(base_url: str, expected_types: set[str], timeout_seconds: float) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
    last_payload: dict[str, Any] = {}
    while time.time() < deadline:
        _, payload = request_json(f"{base_url}/api/notifications/stats")
        last_payload = payload
        counts = payload.get("events_consumed", {})
        if all(int(counts.get(event_type, 0)) > 0 for event_type in expected_types):
            return payload
        time.sleep(2)
    raise TimeoutError(f"notification-service did not consume expected events: {expected_types}; last payload={last_payload}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run an end-to-end RomanEstate microservice flow through the edge.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8088", help="edge base URL")
    parser.add_argument("--auth-email", default="admin@example.com", help="demo auth email")
    parser.add_argument("--auth-password", default="Password123!", help="demo auth password")
    parser.add_argument("--favorite-user", default="demo-user", help="user id for profile favorites")
    parser.add_argument("--timeout-seconds", type=float, default=25.0, help="notification polling timeout")
    parser.add_argument("--json", action="store_true", help="print JSON output")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")

    try:
        login_status, login_payload = request_json(
            f"{base_url}/api/auth/login",
            method="POST",
            payload={"email": args.auth_email, "password": args.auth_password},
        )
        token = str(login_payload.get("token") or "")
        if login_status != 200 or not token:
            raise RuntimeError(f"login failed: status={login_status} payload={login_payload}")

        auth_headers = {"Authorization": f"Bearer {token}"}
        _, me_payload = request_json(f"{base_url}/api/auth/me", headers=auth_headers)

        _, listing_payload = request_json(
            f"{base_url}/api/listings/listings",
            method="POST",
            payload={"title": "DoD Demo Listing", "city": "Moscow", "price": 15000000},
        )
        listing = listing_payload["item"]

        _, favorite_payload = request_json(
            f"{base_url}/api/profile/favorites",
            method="POST",
            payload={"user_id": args.favorite_user, "listing_id": str(listing["id"])},
        )

        _, deal_payload = request_json(
            f"{base_url}/api/deals/viewing-requests",
            method="POST",
            payload={"listing_id": listing["id"], "visitor_email": args.auth_email},
        )

        notification_payload = wait_for_notifications(
            base_url,
            expected_types={"listing.created", "viewing-request.created"},
            timeout_seconds=args.timeout_seconds,
        )
        _, favorites_payload = request_json(
            f"{base_url}/api/profile/favorites?{urllib.parse.urlencode({'user_id': args.favorite_user})}"
        )

        result = {
            "auth_user": me_payload.get("email"),
            "listing_id": listing["id"],
            "favorite_status": favorite_payload.get("status"),
            "viewing_request_id": deal_payload["item"]["id"],
            "notification_counts": notification_payload.get("events_consumed", {}),
            "favorites": favorites_payload.get("favorites", []),
        }
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(json.dumps(result, ensure_ascii=False))
        return 0
    except (TimeoutError, urllib.error.HTTPError, urllib.error.URLError, RuntimeError, KeyError) as exc:
        print(f"e2e flow failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
