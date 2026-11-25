#!/usr/bin/env python3
"""Giọng Bé Sen: vi-VN-HoaiMyNeural, tách câu và đổi cao độ để có ngữ điệu."""

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
NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
PRAISE = [
    ("Ồ! Giỏi quá bé ơi!", "+12%", "+18Hz"),
    ("Hay quá! Đúng rồi đó!", "+8%", "+14Hz"),
    ("Giỏi lắm bé ơi!", "+10%", "+16Hz"),
    ("Ôi, đúng luôn!", "+14%", "+18Hz"),
]
COMFORT = [
    ("Ôi, chưa đúng đâu.", "Không sao nhé!", "-12%", "-2Hz", "+2%", "+8Hz"),
    ("Chưa phải rồi.", "Không sao, mình nghe lại nhé!", "-10%", "-4Hz", "+0%", "+10Hz"),
    ("Ơ, chưa đúng.", "Không sao đâu bé!", "-8%", "+0Hz", "+4%", "+8Hz"),
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


def question_parts(question):
    ask = (question.get("say") or question["question"]).strip()
    parts = [("ask", ask, "-8%", "+6Hz")]
    options = question["options"]
    for index, option in enumerate(options):
        last = index == len(options) - 1
        line = f"{option['key']}, {spoken(option)}"
        line = f"{line}?" if last else f"{line}."
        pitch = "+10Hz" if last else f"+{2 + index * 2}Hz"
        parts.append((f"opt{index}", line, "-4%" if last else "-2%", pitch))
    return parts


def feedback_parts(index, is_correct, explain):
    if is_correct:
        praise, rate, pitch = PRAISE[index % len(PRAISE)]
        return [
            ("lead", praise, rate, pitch),
            ("fact", explain, "-6%", "+4Hz"),
            ("end", "Tuyệt vời!", "+8%", "+12Hz"),
        ]
    soft, lift, soft_rate, soft_pitch, lift_rate, lift_pitch = COMFORT[index % len(COMFORT)]
    return [
        ("soft", soft, soft_rate, soft_pitch),
        ("lift", lift, lift_rate, lift_pitch),
        ("fact", explain, "-6%", "+3Hz"),
        ("end", "Cố lên nào!", "+6%", "+10Hz"),
    ]


def result_parts(correct, total):
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
    return [
        ("hi", "Xong rồi bé ơi!", "+10%", "+14Hz"),
        ("score", score, "-4%", "+4Hz"),
        ("msg", msg, "-6%", "+8Hz"),
    ]


def jobs_for(questions):
    jobs = []
    for index, question in enumerate(questions):
        q_parts = question_parts(question)
        jobs.append((f"q{index}", q_parts, "question"))
        jobs.append((f"q{index}_replay", q_parts, "question"))
        jobs.append((f"fb{index}_ok", feedback_parts(index, True, question["explain"]), "praise"))
        jobs.append((f"fb{index}_bad", feedback_parts(index, False, question["explain"]), "comfort"))
    total = len(questions)
    for correct in range(total + 1):
        jobs.append((f"result_{correct}", result_parts(correct, total), "result"))
    return jobs


def run_ffmpeg(args):
    result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


def make_silence(work, name, seconds):
    path = work / name
    if not path.exists():
        run_ffmpeg(
            [
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=24000:cl=mono",
                "-t",
                str(seconds),
                "-ar",
                "24000",
                "-ac",
                "1",
                str(path),
            ]
        )
    return path


async def synth_wav(text, rate, pitch, wav_path, sem):
    mp3_path = wav_path.with_suffix(".mp3")
    last_error = None
    for attempt in range(6):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch)
                await communicate.save(str(mp3_path))
            last_error = None
            break
        except Exception as error:
            last_error = error
            await asyncio.sleep(1.2 * (attempt + 1))
    if last_error:
        raise RuntimeError(f"{text!r} ({rate} {pitch})") from last_error
    run_ffmpeg(["-i", str(mp3_path), "-ar", "24000", "-ac", "1", str(wav_path)])
    mp3_path.unlink(missing_ok=True)


def mix(pieces, gaps, out_path, lead):
    inputs = []
    for index, piece in enumerate(pieces):
        if index == 0:
            inputs.append(lead)
        else:
            inputs.append(gaps[index - 1])
        inputs.append(piece)
    args = []
    for item in inputs:
        args.extend(["-i", str(item)])
    chain = "".join(f"[{i}:a]" for i in range(len(inputs)))
    run_ffmpeg(
        [
            *args,
            "-filter_complex",
            f"{chain}concat=n={len(inputs)}:v=0:a=1,afade=t=in:st=0:d=0.06[a]",
            "-map",
            "[a]",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-q:a",
            "4",
            str(out_path),
        ]
    )


async def main():
    questions = load_questions()
    OUT.mkdir(exist_ok=True)
    work = OUT / "_parts"
    work.mkdir(exist_ok=True)
    lead = make_silence(work, "lead.wav", 0.12)
    gap_q = make_silence(work, "gap_q.wav", 0.34)
    gap_s = make_silence(work, "gap_s.wav", 0.22)
    sem = asyncio.Semaphore(2)
    manifest = {}
    fresh_after = datetime(2026, 11, 25, 21, 1)

    for key, parts, kind in jobs_for(questions):
        out_path = OUT / f"{key}.mp3"
        if key.endswith("_replay"):
            shutil.copyfile(OUT / f"{key[:-7]}.mp3", out_path)
            manifest[key] = f"audio/{key}.mp3"
            print(f"Copy {key}", flush=True)
            continue
        if out_path.exists() and datetime.fromtimestamp(out_path.stat().st_mtime) >= fresh_after:
            manifest[key] = f"audio/{key}.mp3"
            print(f"Skip {key}", flush=True)
            continue
        print(f"Generating {key}...", flush=True)
        wavs = []
        pending = []
        for name, text, rate, pitch in parts:
            wav = work / f"{key}_{name}.wav"
            wavs.append(wav)
            pending.append(synth_wav(text, rate, pitch, wav, sem))
        await asyncio.gather(*pending)
        gap = gap_q if kind == "question" else gap_s
        gaps = [gap] * (len(wavs) - 1)
        mix(wavs, gaps, out_path, lead)
        for wav in wavs:
            wav.unlink(missing_ok=True)
        manifest[key] = f"audio/{key}.mp3"
        print(f"  ok {out_path.stat().st_size} bytes", flush=True)

    shutil.rmtree(work, ignore_errors=True)
    (ROOT / "audio-manifest.js").write_text(
        "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Done. {len(manifest)} files")


if __name__ == "__main__":
    asyncio.run(main())
