#!/usr/bin/env python3
"""Google TTS + polish — công thức Bé Khám Phá."""

import json
import shutil
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def load_content():
    script = r"""
const fs = require("fs");
const vm = require("vm");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("content.js", "utf8"), sandbox);
process.stdout.write(JSON.stringify(sandbox.window.EYES_CONTENT));
"""
    return json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT))


def spoken(item):
    return (item.get("say") or item["label"]).strip()


def question_line(q):
    choices = " ".join(f"Đáp án {o['key']} là {spoken(o)}." for o in q["options"])
    return f"{q['question']} {choices}"


def jobs_for(data):
    jobs = [
        ("intro", data["intro"]),
        ("fb_ok", data["feedbackOk"]),
        ("fb_bad", data["feedbackBad"]),
        ("closing", data["closing"]),
    ]
    for i, q in enumerate(data["questions"]):
        jobs.append((f"q{i}", question_line(q)))
    return jobs


def chunk_text(text, limit=160):
    text = " ".join(text.split())
    if len(text) <= limit:
        return [text]
    parts, rest = [], text
    while rest:
        if len(rest) <= limit:
            parts.append(rest)
            break
        cut = rest.rfind(" ", 0, limit)
        if cut < 40:
            cut = limit
        parts.append(rest[:cut].strip())
        rest = rest[cut:].strip()
    return [p for p in parts if p]


def fetch_chunk(text):
    url = (
        "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q="
        + urllib.parse.quote(text[:180])
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    last = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                data = res.read()
            if len(data) < 200:
                raise RuntimeError("short")
            return data
        except Exception as e:
            last = e
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(last)


def fetch_tts(text):
    buf = []
    for part in chunk_text(text):
        buf.append(fetch_chunk(part))
        time.sleep(0.25)
    return b"".join(buf)


def run_ffmpeg(args):
    r = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-800:])


def polish(speech_bytes, out_path):
    raw = out_path.with_suffix(".raw.mp3")
    raw.write_bytes(speech_bytes)
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
            "[1:a]highpass=f=100,volume=volume='if(lt(t,0.22),2.8,1)':eval=frame,apad=pad_dur=0.35[a1];[0:a][a1]concat=n=2:v=0:a=1[a]",
            "-map",
            "[a]",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-q:a",
            "3",
            str(out_path),
        ]
    )
    raw.unlink(missing_ok=True)


def main():
    data = load_content()
    OUT.mkdir(exist_ok=True)
    jobs = jobs_for(data)
    for key, text in jobs:
        print(f"Generating {key}...", flush=True)
        polish(fetch_tts(text), OUT / f"{key}.mp3")
    keys = [k for k, _ in jobs]
    for i in range(len(data["questions"])):
        shutil.copyfile(OUT / f"q{i}.mp3", OUT / f"q{i}_replay.mp3")
        keys.append(f"q{i}_replay")
    keep = {f"{k}.mp3" for k in keys}
    for p in OUT.glob("*.mp3"):
        if p.name not in keep:
            p.unlink()
    (ROOT / "audio-manifest.js").write_text(
        "window.AUDIO_MANIFEST = " + json.dumps({k: f"audio/{k}.mp3" for k in keys}, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Done. {len(keys)} files")


if __name__ == "__main__":
    main()
