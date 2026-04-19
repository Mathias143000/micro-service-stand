#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import socket
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parent.parent
COMPOSE_FILE = REPO_ROOT / "infra" / "compose" / "docker-compose.devops-lab.yml"
COMPOSE_ENV = REPO_ROOT / "infra" / "compose" / ".env.example"


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def run_command(command: list[str], cwd: Path | None = None, timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        text=True,
        capture_output=True,
        timeout=timeout,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def check_binary(name: str) -> CheckResult:
    path = shutil.which(name)
    return CheckResult(
        name=f"binary:{name}",
        ok=path is not None,
        detail=path or "not found",
    )


def check_port(port: int, host: str = "127.0.0.1") -> CheckResult:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1.5)
    try:
      sock.connect((host, port))
      return CheckResult(name=f"port:{port}", ok=True, detail=f"{host}:{port} is reachable")
    except OSError as exc:
      return CheckResult(name=f"port:{port}", ok=False, detail=str(exc))
    finally:
      sock.close()


def check_compose_config() -> CheckResult:
    if not COMPOSE_FILE.exists():
        return CheckResult("compose:config", False, f"missing compose file: {COMPOSE_FILE}")
    if not COMPOSE_ENV.exists():
        return CheckResult("compose:config", False, f"missing env file: {COMPOSE_ENV}")

    result = run_command(
        ["docker", "compose", "--env-file", str(COMPOSE_ENV), "-f", str(COMPOSE_FILE), "config"],
        cwd=REPO_ROOT,
        timeout=60,
    )
    if result.returncode == 0:
        return CheckResult("compose:config", True, "docker compose config passed")
    detail = (result.stderr or result.stdout).strip() or f"exit code {result.returncode}"
    return CheckResult("compose:config", False, detail)


def check_auth_service_tests() -> CheckResult:
    service_dir = REPO_ROOT / "services" / "auth-service"
    if not service_dir.exists():
        return CheckResult("auth-service:test", False, "service directory does not exist")

    result = run_command(["mvn", "test"], cwd=service_dir, timeout=180)
    if result.returncode == 0:
        return CheckResult("auth-service:test", True, "mvn test passed")
    detail = (result.stderr or result.stdout).strip() or f"exit code {result.returncode}"
    return CheckResult("auth-service:test", False, detail)


def check_docker_buildx() -> CheckResult:
    docker = shutil.which("docker")
    if not docker:
        return CheckResult("docker:buildx", False, "docker not found")

    result = run_command(["docker", "buildx", "version"], cwd=REPO_ROOT, timeout=30)
    if result.returncode == 0:
        return CheckResult("docker:buildx", True, result.stdout.strip())
    detail = (result.stderr or result.stdout).strip() or f"exit code {result.returncode}"
    return CheckResult("docker:buildx", False, detail)


def collect_results(run_auth_tests: bool) -> list[CheckResult]:
    checks: list[CheckResult] = []

    for binary in ("docker", "java", "mvn", "node", "npm", "python"):
        checks.append(check_binary(binary))

    checks.append(check_docker_buildx())
    checks.append(check_compose_config())

    for port in (5432, 5433, 5672, 15672, 6379, 9000, 9001, 8080, 8081, 8088):
        checks.append(check_port(port))

    if run_auth_tests:
        checks.append(check_auth_service_tests())

    return checks


def print_human(results: Iterable[CheckResult]) -> int:
    failures = 0
    for result in results:
        status = "OK" if result.ok else "FAIL"
        print(f"[{status}] {result.name}: {result.detail}")
        if not result.ok:
            failures += 1

    print()
    print(f"Summary: {failures} failed checks")
    return 0 if failures == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnose the RomanEstate DevOps compose lab.")
    parser.add_argument("--json", action="store_true", help="print results as JSON")
    parser.add_argument(
        "--skip-auth-tests",
        action="store_true",
        help="skip 'mvn test' for services/auth-service",
    )
    args = parser.parse_args()

    results = collect_results(run_auth_tests=not args.skip_auth_tests)

    if args.json:
        print(json.dumps([asdict(result) for result in results], ensure_ascii=False, indent=2))
        return 0 if all(result.ok for result in results) else 1

    return print_human(results)


if __name__ == "__main__":
    sys.exit(main())
