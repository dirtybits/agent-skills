#!/usr/bin/env python3
"""Check deployed EVM runtime bytecode against configurable growth budgets."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys
from typing import Any


EIP170_RUNTIME_LIMIT = 24_576
BYTECODE_PATTERN = re.compile(r"[0-9a-fA-F_$]+")


class ArtifactError(ValueError):
    """Raised when deployed bytecode cannot be read from an artifact."""


def nonnegative_int(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be non-negative")
    return parsed


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be positive")
    return parsed


def get_nested(data: dict[str, Any], path: tuple[str, ...]) -> Any:
    current: Any = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def find_deployed_bytecode(data: dict[str, Any]) -> str:
    candidates = (
        ("deployedBytecode", "object"),
        ("evm", "deployedBytecode", "object"),
        ("deployedBytecode",),
    )
    for path in candidates:
        value = get_nested(data, path)
        if isinstance(value, str) and value.strip():
            return value.strip()
    raise ArtifactError(
        "artifact has no deployed bytecode at deployedBytecode.object, "
        "evm.deployedBytecode.object, or deployedBytecode"
    )


def count_runtime_bytes(bytecode: str) -> int:
    normalized = bytecode[2:] if bytecode.startswith("0x") else bytecode
    if not normalized:
        raise ArtifactError("deployed bytecode is empty")
    if len(normalized) % 2:
        raise ArtifactError("deployed bytecode has an odd number of characters")
    if BYTECODE_PATTERN.fullmatch(normalized) is None:
        raise ArtifactError("deployed bytecode contains whitespace or unsupported characters")
    return len(normalized) // 2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Read deployed runtime bytecode from an EVM artifact and enforce "
            "hard, soft, and feature-growth budgets."
        )
    )
    parser.add_argument("artifact", type=Path, help="Foundry, Hardhat, or standard-json artifact")
    parser.add_argument(
        "--hard-limit",
        type=positive_int,
        default=EIP170_RUNTIME_LIMIT,
        help=f"hard runtime limit in bytes (default: {EIP170_RUNTIME_LIMIT})",
    )
    parser.add_argument("--soft-limit", type=positive_int, help="project soft limit in bytes")
    parser.add_argument("--baseline", type=nonnegative_int, help="baseline runtime size in bytes")
    parser.add_argument(
        "--max-delta",
        type=nonnegative_int,
        help="maximum permitted growth from --baseline",
    )
    parser.add_argument("--label", help="human-readable contract label")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.soft_limit is not None and args.soft_limit > args.hard_limit:
        print("error: --soft-limit cannot exceed --hard-limit", file=sys.stderr)
        return 2
    if args.max_delta is not None and args.baseline is None:
        print("error: --max-delta requires --baseline", file=sys.stderr)
        return 2

    try:
        data = json.loads(args.artifact.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ArtifactError("artifact root must be a JSON object")
        runtime_bytes = count_runtime_bytes(find_deployed_bytecode(data))
    except (OSError, json.JSONDecodeError, ArtifactError) as error:
        print(f"error: {args.artifact}: {error}", file=sys.stderr)
        return 2

    baseline = args.baseline
    delta = runtime_bytes - baseline if baseline is not None else None
    hard_headroom = args.hard_limit - runtime_bytes
    soft_headroom = (
        args.soft_limit - runtime_bytes if args.soft_limit is not None else None
    )

    violations: list[str] = []
    if runtime_bytes > args.hard_limit:
        violations.append(
            f"runtime exceeds hard limit by {runtime_bytes - args.hard_limit} bytes"
        )
    if args.soft_limit is not None and runtime_bytes > args.soft_limit:
        violations.append(
            f"runtime exceeds soft limit by {runtime_bytes - args.soft_limit} bytes"
        )
    if args.max_delta is not None and delta is not None and delta > args.max_delta:
        violations.append(
            f"runtime delta exceeds maximum by {delta - args.max_delta} bytes"
        )

    label = args.label or args.artifact.stem
    payload = {
        "artifact": str(args.artifact),
        "label": label,
        "runtime_bytes": runtime_bytes,
        "baseline_bytes": baseline,
        "delta_bytes": delta,
        "hard_limit_bytes": args.hard_limit,
        "hard_headroom_bytes": hard_headroom,
        "soft_limit_bytes": args.soft_limit,
        "soft_headroom_bytes": soft_headroom,
        "max_delta_bytes": args.max_delta,
        "status": "fail" if violations else "pass",
        "violations": violations,
    }

    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print(f"{label}: {runtime_bytes} runtime bytes")
        if baseline is not None and delta is not None:
            print(f"baseline: {baseline} bytes")
            print(f"delta: {delta:+d} bytes")
        print(
            f"hard limit: {args.hard_limit} bytes "
            f"(headroom {hard_headroom:+d})"
        )
        if args.soft_limit is not None and soft_headroom is not None:
            print(
                f"soft limit: {args.soft_limit} bytes "
                f"(headroom {soft_headroom:+d})"
            )
        if args.max_delta is not None:
            print(f"maximum delta: {args.max_delta} bytes")
        print(f"status: {'FAIL' if violations else 'PASS'}")
        for violation in violations:
            print(f"- {violation}")

    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())
