#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
CORE_COMPOSE = REPO_ROOT / "infra" / "compose" / "docker-compose.devops-lab.yml"
ENV_FILE = REPO_ROOT / "infra" / "compose" / ".env.example"


def compose_base() -> list[str]:
    return [
        "docker",
        "compose",
        "--env-file",
        str(ENV_FILE),
        "-f",
        str(CORE_COMPOSE),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a PostgreSQL backup from the RomanEstate DevOps lab.")
    parser.add_argument("--output", required=True, help="path to the SQL dump file")
    parser.add_argument("--database", default="realestate", help="database name")
    parser.add_argument("--user", default="postgres", help="database user")
    args = parser.parse_args()

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    command = compose_base() + [
        "exec",
        "-T",
        "postgres",
        "pg_dump",
        "-U",
        args.user,
        "-d",
        args.database,
    ]
    completed = subprocess.run(command, cwd=str(REPO_ROOT), check=False, capture_output=True)
    if completed.returncode != 0:
        sys.stderr.write(completed.stderr.decode("utf-8", errors="replace"))
        return completed.returncode

    output_path.write_bytes(completed.stdout)
    print(f"backup written to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
