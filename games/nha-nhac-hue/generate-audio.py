#!/usr/bin/env python3
"""Giọng Bé Sen: một câu trọn, đọc rõ đáp án A B C và lời khen."""

import asyncio
import json
import shutil
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
VOICE = "vi-VN-HoaiMyNeural"
RATE = "-6%"
PITCH = "+2Hz"
NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
PRAISE = [
    "Ồ! Giỏi quá bé ơi!",
    "Hay quá! Đúng rồi!",
    "Giỏi lắm bé ơi!",
    "Ôi, đúng rồi đó!",
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
    choices = ". ".join(f"Đáp án {option['key']}: {spoken(option)}" for option in question["options"])
    return f"{ask} {choices}."


def feedback_line(index, is_correct, explain):
    if is_correct:
        praise = PRAISE[index % len(PRAISE)]
        return f"{praise} {explain} Tuyệt vời lắm!"
    return f"Ôi, chưa đúng đâu. Không sao nhé! {explain} Cố lên nào!"


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
    score = f"Bé đúng {NUM_WORDS[correct]} câu, trên {NUM_WORDS[total]} câu."
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


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


async def synth(text, out_path, sem):
    raw = out_path.with_suffix(".raw.mp3")
    last_error = None
    for attempt in range(5):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
                await communicate.save(str(raw))
            last_error = None
            break
        except Exception as error:
            last_error = error
            await asyncio.sleep(1.5 * (attempt + 1))
    if last_error:
        raise RuntimeError(text) from last_error
    run_ffmpeg(
        [
            "-i",
            str(raw),
            "-af",
            "apad=pad_dur=0.45,loudnorm=I=-16:TP=-1.5:LRA=11",
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
    manifest = {}
    pending_keys = []

    async def one(key, text):
        out_path = OUT / f"{key}.mp3"
        print(f"Generating {key}...", flush=True)
        await synth(text, out_path, sem)
        print(f"  ok {out_path.stat().st_size}", flush=True)

    tasks = []
    for key, text in jobs_for(questions):
        pending_keys.append(key)
        tasks.append(one(key, text))
    await asyncio.gather(*tasks)

    for index in range(len(questions)):
        src = OUT / f"q{index}.mp3"
        dst = OUT / f"q{index}_replay.mp3"
        shutil.copyfile(src, dst)
        pending_keys.append(f"q{index}_replay")

    manifest = {key: f"audio/{key}.mp3" for key in sorted(pending_keys, key=lambda name: (name[0], name))}
    (ROOT / "audio-manifest.js").write_text(
        "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Done. {len(manifest)} files")


if __name__ == "__main__":
    asyncio.run(main())
