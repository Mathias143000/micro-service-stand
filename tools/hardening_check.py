#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON_SERVICE_DOCKERFILES = (
    ROOT / "services" / "listing-service" / "Dockerfile",
    ROOT / "services" / "deal-service" / "Dockerfile",
    ROOT / "services" / "profile-service" / "Dockerfile",
    ROOT / "services" / "notification-service" / "Dockerfile",
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def require_markers(errors: list[str], path: Path, markers: list[str]) -> None:
    text = read(path)
    for marker in markers:
        if marker not in text:
            fail(errors, f"{path.relative_to(ROOT)} is missing marker: {marker}")


def main() -> int:
    errors: list[str] = []

    require_markers(
        errors,
        ROOT / "infra" / "nginx" / "default.conf.template",
        [
            "limit_req_zone",
            "limit_req zone=edge_per_ip",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "Referrer-Policy",
            "Permissions-Policy",
            "Content-Security-Policy",
            "proxy_connect_timeout",
            "client_body_timeout",
            "server_tokens off",
        ],
    )

    require_markers(
        errors,
        ROOT / "services" / "auth-service" / "Dockerfile",
        [
            "useradd --create-home",
            "USER appuser",
        ],
    )

    for dockerfile in PYTHON_SERVICE_DOCKERFILES:
        require_markers(errors, dockerfile, ["useradd --create-home appuser", "USER appuser"])

    require_markers(
        errors,
        ROOT / ".github" / "workflows" / "devops-lab-ci.yml",
        [
            "tools/hardening_check.py",
            "Run hardening policy check",
            "compose manifests",
            "Start full lab and run smoke",
            "Run end-to-end flow",
            "Verify PostgreSQL backup and restore",
        ],
    )

    require_markers(
        errors,
        ROOT / "README.md",
        [
            "edge security headers, request timeout, and rate-limit guardrails",
            "repo-local hardening policy check",
            "docs/hardening.md",
        ],
    )

    for required in [
        ROOT / "docs" / "hardening.md",
        ROOT / "tools" / "bootstrap_env.py",
        ROOT / "tools" / "smoke_check.py",
        ROOT / "tools" / "e2e_flow.py",
        ROOT / "tools" / "traffic_generator.py",
        ROOT / "tools" / "backup_postgres.py",
        ROOT / "tools" / "restore_postgres.py",
        ROOT / "infra" / "compose" / "docker-compose.devops-lab.yml",
        ROOT / "infra" / "compose" / "docker-compose.observability.yml",
        ROOT / "infra" / "observability" / "prometheus" / "prometheus.yml",
        ROOT / "infra" / "observability" / "prometheus" / "rules" / "romanestate-alerts.yml",
        ROOT / "infra" / "observability" / "grafana" / "dashboards" / "romanestate-platform-overview.json",
    ]:
        if not required.exists():
            fail(errors, f"missing required hardening asset: {required.relative_to(ROOT)}")

    report = {
        "status": "failed" if errors else "passed",
        "checks": [
            "edge proxy has local security and rate-limit guardrails",
            "application service images drop root privileges",
            "CI includes hardening policy before full stack smoke",
            "operator validation, e2e, traffic, backup, and restore tools are present",
        ],
        "errors": errors,
    }

    output_dir = ROOT / "artifacts" / "hardening"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "hardening-report.json").write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Microservice platform hardening checks passed.")
    print(f"Report: {output_dir / 'hardening-report.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
