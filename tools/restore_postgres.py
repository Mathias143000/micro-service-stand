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


def run(command: list[str], *, input_bytes: bytes | None = None) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(command, cwd=str(REPO_ROOT), check=False, input=input_bytes, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore a PostgreSQL dump into a verification database.")
    parser.add_argument("--input", required=True, help="path to SQL dump file")
    parser.add_argument("--target-db", default="realestate_restore", help="database to recreate and restore into")
    parser.add_argument("--user", default="postgres", help="database user")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    dump_bytes = input_path.read_bytes()

    drop_command = compose_base() + [
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        args.user,
        "-d",
        "postgres",
        "-c",
        f"DROP DATABASE IF EXISTS {args.target_db} WITH (FORCE);",
    ]
    create_command = compose_base() + [
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        args.user,
        "-d",
        "postgres",
        "-c",
        f"CREATE DATABASE {args.target_db};",
    ]
    restore_command = compose_base() + [
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        args.user,
        "-d",
        args.target_db,
    ]
    verify_command = compose_base() + [
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        args.user,
        "-d",
        args.target_db,
        "-tAc",
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';",
    ]

    for command in (drop_command, create_command):
        completed = run(command)
        if completed.returncode != 0:
            sys.stderr.write(completed.stderr.decode("utf-8", errors="replace"))
            return completed.returncode

    completed = run(restore_command, input_bytes=dump_bytes)
    if completed.returncode != 0:
        sys.stderr.write(completed.stderr.decode("utf-8", errors="replace"))
        return completed.returncode

    verify = run(verify_command)
    if verify.returncode != 0:
        sys.stderr.write(verify.stderr.decode("utf-8", errors="replace"))
        return verify.returncode

    table_count = int(verify.stdout.decode("utf-8", errors="replace").strip() or "0")
    if table_count <= 0:
        print("restore completed but no public tables were found", file=sys.stderr)
        return 1

    print(f"restore verified in database {args.target_db} with {table_count} public tables")
    return 0


if __name__ == "__main__":
    sys.exit(main())
