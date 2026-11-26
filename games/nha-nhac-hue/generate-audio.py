#!/usr/bin/env python3
"""Đọc từng câu, rồi cắt tiếng đệm 'Nào' để âm đầu vẫn rõ mà không bị nghe thấy."""

import asyncio
import json
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio"
STAMP = OUT / ".build-stamp"
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
    body = explain.strip().rstrip(".")
    if is_correct:
        praise = PRAISE[index % len(PRAISE)]
        return f"Nào {praise}. Nào {body}. Nào tuyệt vời lắm."
    return f"Nào chưa đúng đâu, không sao nhé. Nào {body}. Nào cố lên nào."


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


def media_duration(path):
    raw = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return float(raw.strip())


def word_token(text):
    return text.strip(".,!?;:\"'“”").casefold()


def lead_indexes(words):
    found = []
    for index, word in enumerate(words):
        if word_token(word["text"]) != "nào":
            continue
        if index == 0:
            found.append(index)
            continue
        gap = word["start"] - words[index - 1]["end"]
        if gap > 0.4:
            found.append(index)
    return found


def keep_spans(words, total):
    spans = []
    cursor = 0.0
    for index in lead_indexes(words):
        nxt = words[index + 1]["start"] if index + 1 < len(words) else total
        if index == 0:
            begin = 0.0
        else:
            begin = min(words[index]["start"], words[index - 1]["end"] + 0.08)
        if begin - cursor > 0.04:
            spans.append((cursor, begin))
        cursor = max(cursor, nxt)
    tail = min(total, words[-1]["end"] + 0.32)
    if tail - cursor > 0.04:
        spans.append((cursor, tail))
    if not spans:
        raise RuntimeError("no speech left after cutting the lead-in")
    return spans


def assemble(raw_path, spans, out_path):
    filters = ["[0:a]aformat=sample_rates=24000:channel_layouts=mono[h]"]
    labels = ["[h]"]
    for index, (start, end) in enumerate(spans):
        pad = 0.42 if index == len(spans) - 1 else 0.16
        filters.append(
            f"[1:a]atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS,apad=pad_dur={pad}[s{index}]"
        )
        labels.append(f"[s{index}]")
    filters.append("".join(labels) + f"concat=n={len(labels)}:v=0:a=1[a]")
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-t",
            "0.24",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-i",
            str(raw_path),
            "-filter_complex",
            ";".join(filters),
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


async def synth(text, out_path, sem):
    raw = out_path.with_suffix(".raw.mp3")
    expected = text.count("Nào ")
    last_error = None
    for attempt in range(6):
        words = []
        try:
            async with sem:
                communicate = edge_tts.Communicate(
                    text, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary"
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
                                    "end": (chunk["offset"] + chunk["duration"]) / 10_000_000,
                                }
                            )
            if not words or raw.stat().st_size < 1000:
                raise RuntimeError("empty audio")
            if len(lead_indexes(words)) < expected:
                raise RuntimeError("lead-in was not a separate word")
            assemble(raw, keep_spans(words, media_duration(raw)), out_path)
            last_error = None
            break
        except Exception as error:
            last_error = error
            await asyncio.sleep(1.4 * (attempt + 1))
    raw.unlink(missing_ok=True)
    if last_error or not out_path.exists() or out_path.stat().st_size < 1000:
        raise RuntimeError(text) from last_error


async def main():
    questions = load_questions()
    OUT.mkdir(exist_ok=True)
    if not STAMP.exists():
        STAMP.write_text("cut-nao\n", encoding="utf-8")
    fresh_after = datetime.fromtimestamp(STAMP.stat().st_mtime) - timedelta(seconds=2)
    sem = asyncio.Semaphore(2)

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
