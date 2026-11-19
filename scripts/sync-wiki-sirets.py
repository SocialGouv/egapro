#!/usr/bin/env python3
"""Set checkboxes from declaration SIRENs, including clearing manual reservations."""

import re
import sys
from pathlib import Path


def update(page: str, sirens: set[str]) -> str:
    pattern = re.compile(r"(?m)^- \[[ xX]\] `(\d{14})`")
    if not pattern.search(page):
        raise ValueError("No SIRET checkboxes found in the wiki page")
    return pattern.sub(
        lambda match: f"- [{'x' if match[1][:9] in sirens else ' '}] `{match[1]}`",
        page,
    )


def main() -> None:
    page_path, sirens_path = map(Path, sys.argv[1:])
    sirens = set(sirens_path.read_text().splitlines())
    if any(not re.fullmatch(r"[0-9]{9}", siren) for siren in sirens):
        raise ValueError("Invalid SIREN in database result")
    page = page_path.read_text()
    page_path.write_text(update(page, sirens))


if __name__ == "__main__":
    main()
