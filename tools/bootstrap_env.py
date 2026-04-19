#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
CORE_COMPOSE = REPO_ROOT / "infra" / "compose" / "docker-compose.devops-lab.yml"
OBS_COMPOSE = REPO_ROOT / "infra" / "compose" / "docker-compose.observability.yml"
ENV_FILE = REPO_ROOT / "infra" / "compose" / ".env.example"
SMOKE_SCRIPT = REPO_ROOT / "tools" / "smoke_check.py"


def compose_args(with_observability: bool) -> list[str]:
    args = [
        "docker",
        "compose",
        "--env-file",
        str(ENV_FILE),
        "-f",
        str(CORE_COMPOSE),
    ]
    if with_observability:
        args.extend(["-f", str(OBS_COMPOSE)])
    return args


def run(command: list[str]) -> int:
    print("$ " + " ".join(command))
    completed = subprocess.run(
        command,
        cwd=str(REPO_ROOT),
        check=False,
        text=True,
    )
    return completed.returncode


def run_smoke(with_observability: bool) -> int:
    command = [
        sys.executable,
        str(SMOKE_SCRIPT),
        "--base-url",
        "http://127.0.0.1:8088",
        "--check-auth",
        "--check-services",
    ]
    if with_observability:
        command.extend(["--check-observability", "--check-tracing"])
    return run(command)


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap the RomanEstate DevOps lab compose environment.")
    parser.add_argument("command", choices=("up", "down", "ps", "smoke"), help="action to run")
    parser.add_argument("--with-observability", action="store_true", help="include Prometheus and Grafana")
    parser.add_argument("--build", action="store_true", help="build services during 'up'")
    parser.add_argument("--smoke-after-up", action="store_true", help="run smoke checks after a successful 'up'")
    args = parser.parse_args()

    if args.command == "smoke":
      return run_smoke(args.with_observability)

    command = compose_args(with_observability=args.with_observability)
    if args.command == "up":
      command.extend(["up", "-d"])
      if args.build:
        command.append("--build")
    elif args.command == "down":
      command.append("down")
    else:
      command.append("ps")

    exit_code = run(command)
    if exit_code != 0:
      return exit_code

    if args.command == "up" and args.smoke_after_up:
      return run_smoke(args.with_observability)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
