import array
import asyncio
import math
import subprocess
from pathlib import Path

import edge_tts

VARIANTS = Path("_variants")


def windows(path, start=0.0, seconds=1.2):
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-ss",
            str(start),
            "-t",
            str(seconds),
            "-i",
            str(path),
            "-f",
            "s16le",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-",
        ],
        stderr=subprocess.DEVNULL,
    )
    samples = array.array("h")
    samples.frombytes(raw)
    print("---", path)
    win = 800
    for i in range(0, min(len(samples) - win, int(seconds * 16000)), win):
        chunk = samples[i : i + win]
        rms = (sum(s * s for s in chunk) / len(chunk)) ** 0.5
        db = 20 * math.log10(rms / 32768 + 1e-9)
        print(f"  {start + i / 16000:5.2f} {db:6.1f}")


async def dump(text, rate, name):
    words = []
    communicate = edge_tts.Communicate(
        text, "vi-VN-HoaiMyNeural", rate=rate, pitch="+2Hz", boundary="WordBoundary"
    )
    raw = VARIANTS / f"{name}.inspect.mp3"
    with raw.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append(chunk)
                print(f"{name} {chunk['offset']/1e7:6.3f} {chunk['text']!r}")
    return words


async def main():
    for path in [VARIANTS / "a.mp3", VARIANTS / "b.mp3", VARIANTS / "c.mp3", Path("audio/preview-cau.mp3")]:
        if path.exists():
            windows(path)


if __name__ == "__main__":
    asyncio.run(main())
