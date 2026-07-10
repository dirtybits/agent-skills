#!/usr/bin/env python3
"""Lightweight validator for the ethereum-development skill package.

This script intentionally uses only the Python standard library so it can run in
minimal agent environments. It checks that the skill package has the expected
support files and that SKILL.md contains the high-signal sections needed for
Ethereum work.
"""
from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    "SKILL.md",
    "LICENSE.txt",
    "assets/config.yaml",
    "assets/schema.json",
    "references/GUIDE.md",
    "references/PATTERNS.md",
    "references/CONTRACT_SIZE.md",
    "scripts/check_runtime_size.py",
]
REQUIRED_PHRASES = [
    "Deployment Runbook",
    "Runtime Size And Architecture",
    "Security Review Checklist",
    "Gas Optimization Checklist",
    "Testing Strategy",
    "explicit user approval before broadcasting",
]


def main() -> int:
    missing = [rel for rel in REQUIRED_FILES if not (ROOT / rel).is_file()]
    if missing:
        print(f"missing files: {missing}", file=sys.stderr)
        return 1

    text = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    absent = [phrase for phrase in REQUIRED_PHRASES if phrase not in text]
    if absent:
        print(f"SKILL.md missing required phrases: {absent}", file=sys.stderr)
        return 1

    schema = json.loads((ROOT / "assets/schema.json").read_text(encoding="utf-8"))
    if schema.get("title") != "ethereum-development invocation schema":
        print("schema title mismatch", file=sys.stderr)
        return 1

    print("ethereum-development skill package ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
