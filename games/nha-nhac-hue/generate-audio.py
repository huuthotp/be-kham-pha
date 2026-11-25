#!/usr/bin/env python3
"""Mỗi câu sau câu hỏi bắt đầu bằng 'Nào', để âm đầu không bị nuốt."""

import asyncio
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
VOICE = "vi-VN-HoaiMyNeural"
RATE = "-6%"
PITCH = "+2Hz"
NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
PRAISE = [
    "giỏi quá bé ơi",
    "hay quá, đúng rồi",
    "giỏi lắm bé ơi",
    "đúng rồi đó",
]


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
        f"Nào đáp án {option['key']} là {spoken(option)}." for option in question["options"]
    )
    return f"{ask} {choices}"


def feedback_line(index, is_correct, explain):
    if is_correct:
        praise = PRAISE[index % len(PRAISE)]
        return f"Nào {praise}. Nào {explain}, tuyệt vời lắm."
    return f"Nào chưa đúng đâu, không sao nhé. Nào {explain}, cố lên nào."


def result_line(correct, total):
    ratio = correct / total
    if ratio == 1:
        msg = "hoàn hảo, bé là chuyên gia nhỏ về Nhã nhạc cung đình Huế"
    elif ratio >= 0.7:
        msg = "xuất sắc, bé đã hiểu rất nhiều về Nhã nhạc cung đình Huế"
    elif ratio >= 0.4:
        msg = "tốt lắm, chơi lại để khám phá thêm nhiều điều thú vị nhé"
    else:
        msg = "bé đã cố gắng rồi, chơi lại để nghe Nhã nhạc thêm nhé"
    score = f"bé đúng {NUM_WORDS[correct]} câu trên {NUM_WORDS[total]} câu"
    return f"Nào xong rồi bé ơi, {score}, {msg}."


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


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


async def synth(text, out_path, sem):
    raw = out_path.with_suffix(".raw.mp3")
    last_error = None
    for attempt in range(6):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
                await communicate.save(str(raw))
            last_error = None
            break
        except Exception as error:
            last_error = error
            await asyncio.sleep(1.4 * (attempt + 1))
    if last_error or not raw.exists() or raw.stat().st_size < 1000:
        raise RuntimeError(text) from last_error
    # Khoảng lặng trước và sau để máy phát không cắt âm đầu, âm cuối.
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-t",
            "0.28",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-i",
            str(raw),
            "-filter_complex",
            "[1:a]apad=pad_dur=0.4[a1];[0:a][a1]concat=n=2:v=0:a=1[a]",
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


async def main():
    questions = load_questions()
    OUT.mkdir(exist_ok=True)
    sem = asyncio.Semaphore(2)

    fresh_after = datetime(2026, 11, 25, 22, 0, 0)

    async def one(key, text):
        out_path = OUT / f"{key}.mp3"
        if out_path.exists() and out_path.stat().st_size > 20000:
            modified = datetime.fromtimestamp(out_path.stat().st_mtime)
            if modified >= fresh_after:
                print(f"Skip {key}", flush=True)
                return
        print(f"Generating {key}...", flush=True)
        await synth(text, out_path, sem)
        print(f"  ok {out_path.stat().st_size}", flush=True)

    jobs = jobs_for(questions)
    await asyncio.gather(*(one(key, text) for key, text in jobs))

    keys = [key for key, _ in jobs]
    for index in range(len(questions)):
        shutil.copyfile(OUT / f"q{index}.mp3", OUT / f"q{index}_replay.mp3")
        keys.append(f"q{index}_replay")

    manifest = {key: f"audio/{key}.mp3" for key in keys}
    (ROOT / "audio-manifest.js").write_text(
        "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Done. {len(manifest)} files")


if __name__ == "__main__":
    asyncio.run(main())
