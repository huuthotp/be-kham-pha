#!/usr/bin/env python3
"""Gen TTS lần lượt cho games 4–8."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUGS = [
    "bai-choi-trung-bo",
    "vi-giam-nghe-tinh",
    "cong-chieng-tay-nguyen",
    "xoe-thai-tay-bac",
    "don-ca-tai-tu",
]


def main() -> None:
    for slug in SLUGS:
        folder = ROOT / "games" / slug
        print("=" * 60, flush=True)
        print(f"AUDIO {slug}", flush=True)
        result = subprocess.run([sys.executable, "generate-audio.py"], cwd=folder)
        if result.returncode != 0:
            raise SystemExit(f"Failed audio for {slug}")
    print("ALL AUDIO DONE")


if __name__ == "__main__":
    main()
