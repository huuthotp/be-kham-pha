#!/usr/bin/env python3
"""Giọng Ngọc Huyền (mới) / HiiuTTS — tốc độ ~0.88."""

import json
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
VOICE_MODEL = "Ngọc Huyền (mới)"
VOICE_SPEED = 0.88
NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
PRAISE = [
    "Giỏi quá bé ơi",
    "Hay quá, đúng rồi",
    "Giỏi lắm bé ơi",
    "Đúng rồi đó",
]


def load_questions():
    script = r"""
const fs = require("fs");
const vm = require("vm");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("content.js", "utf8"), sandbox);
process.stdout.write(JSON.stringify(sandbox.window.XOAN_CONTENT.questions));
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
        msg = "Hoàn hảo! Bé là chuyên gia nhỏ về Hát Xoan Phú Thọ!"
    elif ratio >= 0.7:
        msg = "Xuất sắc! Bé đã hiểu rất nhiều về Hát Xoan."
    elif ratio >= 0.4:
        msg = "Tốt lắm! Chơi lại để khám phá thêm miền đất Tổ nhé!"
    else:
        msg = "Bé đã cố gắng rồi! Chơi lại để nghe Hát Xoan thêm nhé!"
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


def chunk_text(text, limit=450):
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
    body = json.dumps(
        {
            "model": VOICE_MODEL,
            "input": text,
            "speed": VOICE_SPEED,
            "response_format": "wav",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://hiiu-tts.netlify.app/v1/audio/speech",
        data=body,
        headers={"Content-Type": "application/json", "Accept": "audio/wav"},
        method="POST",
    )
    last_error = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = response.read()
            if len(data) < 500:
                raise RuntimeError(f"short audio {len(data)}")
            return data
        except Exception as error:
            last_error = error
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {text!r}: {last_error}") from last_error


def fetch_tts(text):
    parts = chunk_text(text)
    if len(parts) == 1:
        return fetch_chunk(parts[0])

    # Ghép nhiều đoạn wav bằng ffmpeg concat.
    tmp_dir = OUT / "_chunks"
    tmp_dir.mkdir(exist_ok=True)
    list_file = tmp_dir / "list.txt"
    paths = []
    for index, part in enumerate(parts):
        path = tmp_dir / f"part{index}.wav"
        path.write_bytes(fetch_chunk(part))
        paths.append(path)
        time.sleep(0.4)
    list_file.write_text(
        "".join(f"file '{path.as_posix()}'\n" for path in paths),
        encoding="utf-8",
    )
    merged = tmp_dir / "merged.wav"
    run_ffmpeg(["-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(merged)])
    data = merged.read_bytes()
    for path in paths:
        path.unlink(missing_ok=True)
    list_file.unlink(missing_ok=True)
    merged.unlink(missing_ok=True)
    return data


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


def polish(speech_bytes, out_path):
    raw = out_path.with_suffix(".raw.wav")
    raw.write_bytes(speech_bytes)
    # Nghỉ đầu + tăng nhẹ âm đầu (cùng tinh thần polish đã duyệt).
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
    for leftover in OUT.glob("*.raw.wav"):
        leftover.unlink()
    for leftover in OUT.glob("*.raw.mp3"):
        leftover.unlink()

    jobs = jobs_for(questions)
    for key, text in jobs:
        out_path = OUT / f"{key}.mp3"
        print(f"Generating {key} ({VOICE_MODEL} {VOICE_SPEED}x)...", flush=True)
        polish(fetch_tts(text), out_path)
        print(f"  ok {out_path.stat().st_size}", flush=True)
        time.sleep(0.35)

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
    print(f"Done. {len(manifest)} files · voice={VOICE_MODEL} speed={VOICE_SPEED}")


if __name__ == "__main__":
    main()

