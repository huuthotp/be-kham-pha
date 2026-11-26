#!/usr/bin/env python3
"""Giọng Google TTS (cùng nguồn các game trước) — phụ âm đầu rõ."""

import json
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
PRAISE = [
    "Giỏi quá bé ơi",
    "Hay quá, đúng rồi",
    "Giỏi lắm bé ơi",
    "Đúng rồi đó",
]
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def load_questions():
    script = r"""
const fs = require("fs");
const vm = require("vm");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("content.js", "utf8"), sandbox);
process.stdout.write(JSON.stringify(sandbox.window.HUE_CONTENT.questions));
"""
    raw = subprocess.check_output(["node", "-e", script], cwd=ROOT)
    return json.loads(raw)


def spoken(item):
    return (item.get("say") or item["label"]).strip()


def question_line(question):
    ask = (question.get("say") or question["question"]).strip()
    choices = " ".join(
        f"Đáp án {option['key']} là {spoken(option)}." for option in question["options"]
    )
    return f"{ask} {choices}"


def feedback_line(index, is_correct, explain):
    body = explain.strip().rstrip(".") + "."
    if is_correct:
        praise = PRAISE[index % len(PRAISE)]
        return f"{praise}. {body} Tuyệt vời lắm!"
    return f"Chưa đúng đâu, không sao nhé. {body} Cố lên nào!"


def result_line(correct, total):
    ratio = correct / total
    if ratio == 1:
        msg = "Hoàn hảo! Bé là chuyên gia nhỏ về Nhã nhạc cung đình Huế!"
    elif ratio >= 0.7:
        msg = "Xuất sắc! Bé đã hiểu rất nhiều về Nhã nhạc cung đình Huế."
    elif ratio >= 0.4:
        msg = "Tốt lắm! Chơi lại để khám phá thêm nhiều điều thú vị nhé!"
    else:
        msg = "Bé đã cố gắng rồi! Chơi lại để nghe Nhã nhạc thêm nhé!"
    score = f"Bé đúng {NUM_WORDS[correct]} câu trên {NUM_WORDS[total]} câu."
    return f"Xong rồi bé ơi! {score} {msg}"


def jobs_for(questions):
    jobs = []
    for index, question in enumerate(questions):
        jobs.append((f"q{index}", question_line(question)))
        jobs.append((f"fb{index}_ok", feedback_line(index, True, question["explain"])))
        jobs.append((f"fb{index}_bad", feedback_line(index, False, question["explain"])))
    total = len(questions)
    for correct in range(total + 1):
        jobs.append((f"result_{correct}", result_line(correct, total)))
    return jobs


def chunk_text(text, limit=160):
    text = " ".join(text.split())
    if len(text) <= limit:
        return [text]
    parts = []
    rest = text
    while rest:
        if len(rest) <= limit:
            parts.append(rest)
            break
        cut = rest.rfind(" ", 0, limit)
        if cut < 40:
            cut = limit
        parts.append(rest[:cut].strip())
        rest = rest[cut:].strip()
    return [part for part in parts if part]


def fetch_chunk(text):
    url = (
        "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q="
        + urllib.parse.quote(text[:180])
    )
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    last_error = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = response.read()
            if len(data) < 200:
                raise RuntimeError(f"short audio {len(data)}")
            return data
        except Exception as error:
            last_error = error
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {text!r}: {last_error}") from last_error


def fetch_tts(text):
    buffers = []
    for part in chunk_text(text):
        buffers.append(fetch_chunk(part))
        time.sleep(0.25)
    return b"".join(buffers)


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


def polish(speech_bytes, out_path):
    raw = out_path.with_suffix(".raw.mp3")
    raw.write_bytes(speech_bytes)
    # Giống bản nghe thử đạt: nghỉ đầu câu + tăng nhẹ âm đầu để phụ âm rõ.
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
                "[1:a]highpass=f=100,"
                "volume=volume='if(lt(t,0.22),2.8,1)':eval=frame,"
                "apad=pad_dur=0.35[a1];"
                "[0:a][a1]concat=n=2:v=0:a=1[a]"
            ),
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
    questions = load_questions()
    OUT.mkdir(exist_ok=True)
    for leftover in OUT.glob("*.raw.mp3"):
        leftover.unlink()

    jobs = jobs_for(questions)
    for key, text in jobs:
        out_path = OUT / f"{key}.mp3"
        print(f"Generating {key}...", flush=True)
        polish(fetch_tts(text), out_path)
        print(f"  ok {out_path.stat().st_size}", flush=True)

    keys = [key for key, _ in jobs]
    for index in range(len(questions)):
        shutil.copyfile(OUT / f"q{index}.mp3", OUT / f"q{index}_replay.mp3")
        keys.append(f"q{index}_replay")

    for preview in OUT.glob("preview-*.mp3"):
        preview.unlink()

    manifest = {key: f"audio/{key}.mp3" for key in keys}
    (ROOT / "audio-manifest.js").write_text(
        "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Done. {len(manifest)} files")


if __name__ == "__main__":
    main()
