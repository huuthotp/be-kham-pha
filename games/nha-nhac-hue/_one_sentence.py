import array
import asyncio
import math
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

import edge_tts

OUT = Path("audio/preview-cau.mp3")
TMP = Path("_variants")
VOICE = "vi-VN-HoaiMyNeural"


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-600:] or "ffmpeg failed")


def pcm(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-ss", str(start)]
    if dur is not None:
        cmd += ["-t", str(dur)]
    cmd += ["-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"]
    raw = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
    samples = array.array("h")
    samples.frombytes(raw)
    return samples


def print_onset(path, label, seconds=1.0):
    samples = pcm(path, 0.0, seconds)
    print(label, path)
    win = 800
    for i in range(0, min(len(samples) - win, int(seconds * 16000)), win):
        chunk = samples[i : i + win]
        rms = (sum(s * s for s in chunk) / len(chunk)) ** 0.5
        db = 20 * math.log10(rms / 32768 + 1e-9)
        print(f"  {i / 16000:4.2f}s {db:6.1f}")


def find_burst(samples, search_start, search_end, sr=16000):
    a = int(search_start * sr)
    b = int(search_end * sr)
    best_i = a
    best_e = -1
    win = int(0.012 * sr)
    for i in range(a, max(a + 1, b - win), max(1, win // 3)):
        chunk = samples[i : i + win]
        energy = sum(s * s for s in chunk) / len(chunk)
        if energy > best_e:
            best_e = energy
            best_i = i
    return best_i / sr


async def edge_clip():
    text = "Nào đáp án A là trò chơi dân gian."
    raw = TMP / "edge.raw.mp3"
    words = []
    last_error = None
    for attempt in range(6):
        words = []
        try:
            communicate = edge_tts.Communicate(
                text, VOICE, rate="-10%", pitch="+2Hz", boundary="WordBoundary"
            )
            with raw.open("wb") as audio:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        words.append(
                            {
                                "text": chunk["text"],
                                "start": chunk["offset"] / 10_000_000,
                            }
                        )
            if raw.stat().st_size > 1000 and words:
                last_error = None
                break
            raise RuntimeError("empty")
        except Exception as error:
            last_error = error
            await asyncio.sleep(1.3 * (attempt + 1))
    if last_error:
        raise RuntimeError(str(last_error)) from last_error

    dap = next(w for w in words if w["text"].casefold().startswith("đáp"))
    # Decode around Đáp, tìm đỉnh phụ âm, cắt ngay trước đỉnh.
    wav = TMP / "edge.wav"
    run_ffmpeg(["-i", str(raw), "-ar", "16000", "-ac", "1", str(wav)])
    samples = pcm(wav)
    burst = find_burst(samples, dap["start"] - 0.04, dap["start"] + 0.18)
    cut = max(0.0, burst - 0.018)
    print("edge dap", round(dap["start"], 3), "burst", round(burst, 3), "cut", round(cut, 3))
    out = TMP / "edge.mp3"
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-t",
            "0.45",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-i",
            str(raw),
            "-filter_complex",
            (
                f"[1:a]atrim=start={cut:.3f},asetpts=PTS-STARTPTS,"
                "highpass=f=120,volume=volume='if(lt(t,0.2),3.2,1)':eval=frame,"
                "apad=pad_dur=0.35[a1];[0:a][a1]concat=n=2:v=0:a=1[a]"
            ),
            "-map",
            "[a]",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-q:a",
            "3",
            str(out),
        ]
    )
    print_onset(out, "edge")
    return out


def google_clip():
    text = "Đáp án A là trò chơi dân gian."
    url = (
        "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q="
        + urllib.parse.quote(text)
    )
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
        },
    )
    raw = TMP / "google.raw.mp3"
    with urllib.request.urlopen(req, timeout=20) as response:
        raw.write_bytes(response.read())
    out = TMP / "google.mp3"
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-t",
            "0.45",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-i",
            str(raw),
            "-filter_complex",
            (
                "[1:a]highpass=f=100,volume=volume='if(lt(t,0.22),2.8,1)':eval=frame,"
                "apad=pad_dur=0.35[a1];[0:a][a1]concat=n=2:v=0:a=1[a]"
            ),
            "-map",
            "[a]",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-q:a",
            "3",
            str(out),
        ]
    )
    print_onset(out, "google")
    return out


async def main():
    TMP.mkdir(exist_ok=True)
    edge = await edge_clip()
    google = google_clip()
    # Ưu tiên Google cho phụ âm đầu; Edge giữ làm bản phụ.
    OUT.write_bytes(google.read_bytes())
    Path("audio/preview-cau-edge.mp3").write_bytes(edge.read_bytes())
    print("wrote", OUT, OUT.stat().st_size)
    print("wrote edge alt", Path("audio/preview-cau-edge.mp3").stat().st_size)


if __name__ == "__main__":
    asyncio.run(main())
