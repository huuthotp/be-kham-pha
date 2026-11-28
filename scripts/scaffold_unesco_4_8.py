#!/usr/bin/env python3
"""Scaffold games 4–8 (2 đáp án) trên journey engine."""

from __future__ import annotations

import json
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / "games"

GEN_AUDIO_PY = textwrap.dedent(
    '''\
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
    CONTENT_KEY = "{content_key}"
    VOICE_MODEL = "Ngọc Huyền (mới)"
    VOICE_SPEED = 0.88
    NUM_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"]
    PRAISE = [
        "Giỏi quá bé ơi",
        "Hay quá, đúng rồi",
        "Giỏi lắm bé ơi",
        "Đúng rồi đó",
    ]


    def load_meta():
        script = f"""
    const fs = require("fs");
    const vm = require("vm");
    const sandbox = {{ window: {{}} }};
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync("content.js", "utf8"), sandbox);
    const data = sandbox.window.{content_key};
    process.stdout.write(JSON.stringify({{
      questions: data.questions,
      brand: data.brand,
      resultPerfect: data._ttsPerfect,
      resultGood: data._ttsGood,
      resultOk: data._ttsOk,
      resultLow: data._ttsLow
    }}));
    """
        raw = subprocess.check_output(["node", "-e", script], cwd=ROOT)
        return json.loads(raw)


    def spoken(item):
        return (item.get("say") or item["label"]).strip()


    def question_line(question):
        ask = (question.get("say") or question["question"]).strip()
        choices = " ".join(
            f"Đáp án {{option['key']}} là {{spoken(option)}}." for option in question["options"]
        )
        return f"{{ask}} {{choices}}"


    def feedback_line(index, is_correct, explain):
        body = explain.strip().rstrip(".") + "."
        if is_correct:
            praise = PRAISE[index % len(PRAISE)]
            return f"{{praise}}. {{body}} Tuyệt vời lắm!"
        return f"Chưa đúng đâu, không sao nhé. {{body}} Cố lên nào!"


    def result_line(meta, correct, total):
        ratio = correct / total
        if ratio == 1:
            msg = meta["resultPerfect"]
        elif ratio >= 0.7:
            msg = meta["resultGood"]
        elif ratio >= 0.4:
            msg = meta["resultOk"]
        else:
            msg = meta["resultLow"]
        score = f"Bé đúng {{NUM_WORDS[correct]}} câu trên {{NUM_WORDS[total]}} câu."
        return f"Xong rồi bé ơi! {{score}} {{msg}}"


    def jobs_for(meta):
        questions = meta["questions"]
        jobs = []
        for index, question in enumerate(questions):
            jobs.append((f"q{{index}}", question_line(question)))
            jobs.append((f"fb{{index}}_ok", feedback_line(index, True, question["explain"])))
            jobs.append((f"fb{{index}}_bad", feedback_line(index, False, question["explain"])))
        total = len(questions)
        for correct in range(total + 1):
            jobs.append((f"result_{{correct}}", result_line(meta, correct, total)))
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
            {{
                "model": VOICE_MODEL,
                "input": text,
                "speed": VOICE_SPEED,
                "response_format": "wav",
            }}
        ).encode("utf-8")
        request = urllib.request.Request(
            "https://hiiu-tts.netlify.app/v1/audio/speech",
            data=body,
            headers={{"Content-Type": "application/json", "Accept": "audio/wav"}},
            method="POST",
        )
        last_error = None
        for attempt in range(5):
            try:
                with urllib.request.urlopen(request, timeout=180) as response:
                    data = response.read()
                if len(data) < 500:
                    raise RuntimeError(f"short audio {{len(data)}}")
                return data
            except Exception as error:
                last_error = error
                time.sleep(1.2 * (attempt + 1))
        raise RuntimeError(f"TTS failed for {{text!r}}: {{last_error}}") from last_error


    def run_ffmpeg(args):
        result = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(result.stderr[-800:] or "ffmpeg failed")


    def fetch_tts(text):
        parts = chunk_text(text)
        if len(parts) == 1:
            return fetch_chunk(parts[0])
        tmp_dir = OUT / "_chunks"
        tmp_dir.mkdir(exist_ok=True)
        list_file = tmp_dir / "list.txt"
        paths = []
        for index, part in enumerate(parts):
            path = tmp_dir / f"part{{index}}.wav"
            path.write_bytes(fetch_chunk(part))
            paths.append(path)
            time.sleep(0.4)
        list_file.write_text(
            "".join(f"file '{{path.as_posix()}}'\\n" for path in paths),
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


    def polish(speech_bytes, out_path):
        raw = out_path.with_suffix(".raw.wav")
        raw.write_bytes(speech_bytes)
        run_ffmpeg(
            [
                "-f", "lavfi", "-t", "0.45", "-i", "anullsrc=r=24000:cl=mono",
                "-i", str(raw),
                "-filter_complex",
                (
                    "[1:a]highpass=f=100,"
                    "volume=volume='if(lt(t,0.22),2.8,1)':eval=frame,"
                    "apad=pad_dur=0.35[a1];"
                    "[0:a][a1]concat=n=2:v=0:a=1[a]"
                ),
                "-map", "[a]", "-ar", "24000", "-ac", "1", "-q:a", "3", str(out_path),
            ]
        )
        raw.unlink(missing_ok=True)


    def main():
        meta = load_meta()
        OUT.mkdir(exist_ok=True)
        jobs = jobs_for(meta)
        for key, text in jobs:
            out_path = OUT / f"{{key}}.mp3"
            print(f"Generating {{key}} ({{VOICE_MODEL}} {{VOICE_SPEED}}x)...", flush=True)
            polish(fetch_tts(text), out_path)
            print(f"  ok {{out_path.stat().st_size}}", flush=True)
            time.sleep(0.35)
        keys = [key for key, _ in jobs]
        for index in range(len(meta["questions"])):
            shutil.copyfile(OUT / f"q{{index}}.mp3", OUT / f"q{{index}}_replay.mp3")
            keys.append(f"q{{index}}_replay")
        manifest = {{key: f"audio/{{key}}.mp3" for key in keys}}
        (ROOT / "audio-manifest.js").write_text(
            "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\\n",
            encoding="utf-8",
        )
        print(f"Done. {{len(manifest)}} files · voice={{VOICE_MODEL}}")


    if __name__ == "__main__":
        main()
    '''
)

INDEX_HTML = """<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#6EC6E0" />
    <meta name="description" content="{description}" />
    <title>{title} | Bé Khám Phá</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../../shared/journey-engine/journey.css?v=2" />
    <link rel="stylesheet" href="styles.css?v=1" />
  </head>
  <body class="journey-page">
    <div class="page-sky" aria-hidden="true">
      <div class="sun"></div>
      <div class="cloud c1"></div>
      <div class="cloud c2"></div>
      <div class="hill back"></div>
      <div class="hill"></div>
    </div>
    <div id="journey-root" class="journey-root"></div>
    <script src="content.js?v=1"></script>
    <script src="audio-manifest.js?v=1"></script>
    <script src="../../shared/journey-engine/journey.js?v=2"></script>
    <script src="game.js?v=1"></script>
  </body>
</html>
"""

GAME_JS = """(() => {{
  "use strict";
  window.createJourneyGame({{
    data: window.{content_key},
    audioVersion: 1,
    hubHref: "../../",
    beSenSrc: "../../assets/be-sen.png?v=2",
    root: document.getElementById("journey-root")
  }});
}})();
"""

STYLES_CSS = """html, body {{ margin: 0; min-height: 100%; min-height: 100dvh; }}
body.journey-page {{
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  color: #1f3a2e;
  background: linear-gradient(180deg, #6ec6e0 0%, #c7ecf6 42%, #e7f6c4 72%, #b7e36a 100%);
  background-attachment: fixed;
  overflow-x: hidden;
}}
.page-sky {{ position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }}
.page-sky .sun {{
  position: absolute; top: 4%; right: 8%; width: 72px; height: 72px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff7c8, #ffd45a 62%, #f0a83a);
  box-shadow: 0 0 36px rgba(255, 212, 90, 0.55);
}}
.page-sky .cloud {{
  position: absolute; background: rgba(255,255,255,.88); border-radius: 999px;
  animation: drift 38s linear infinite;
}}
.page-sky .cloud::before, .page-sky .cloud::after {{
  content: ""; position: absolute; background: inherit; border-radius: 50%;
}}
.page-sky .c1 {{ width: 96px; height: 32px; top: 12%; left: -20%; }}
.page-sky .c1::before {{ width: 40px; height: 40px; top: -20px; left: 14px; }}
.page-sky .c1::after {{ width: 50px; height: 50px; top: -26px; left: 38px; }}
.page-sky .c2 {{ width: 72px; height: 26px; top: 22%; left: -30%; animation-duration: 48s; opacity: .8; }}
.page-sky .c2::before {{ width: 32px; height: 32px; top: -16px; left: 10px; }}
.page-sky .c2::after {{ width: 40px; height: 40px; top: -20px; left: 28px; }}
.page-sky .hill {{
  position: absolute; bottom: -40px; width: 120%; height: 160px; left: -10%;
  border-radius: 50% 50% 0 0; background: linear-gradient(180deg, #b7e36a, #7cbc3a);
}}
.page-sky .hill.back {{ bottom: 18px; height: 120px; opacity: .55; }}
@keyframes drift {{ to {{ transform: translateX(140vw); }} }}
.journey-root {{ position: relative; z-index: 1; }}
.journey-zone[data-zone="gate"] .journey-zone-art[data-fallback] {{
  background: {gate_bg} !important;
}}
.journey-zone[data-zone="dance"] .journey-zone-art[data-fallback] {{
  background: {dance_bg} !important;
}}
.journey-zone[data-zone="keep"] .journey-zone-art[data-fallback] {{
  background: {keep_bg} !important;
}}
"""

GEN_JS = """#!/usr/bin/env node
const { spawnSync } = require("child_process");
const result = spawnSync("py", ["generate-audio.py"], { stdio: "inherit", cwd: __dirname });
process.exit(result.status ?? 1);
"""


def q(stage, speaker, question, options, answer, explain, say=None, option_says=None):
    opts = []
    for i, (key, label) in enumerate(options):
        item = {"key": key, "label": label}
        if option_says and option_says.get(key):
            item["say"] = option_says[key]
        opts.append(item)
    row = {
        "stage": stage,
        "speaker": speaker,
        "question": question,
        "options": opts,
        "answer": answer,
        "explain": explain,
    }
    if say:
        row["say"] = say
    return row


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_content(path: Path, key: str, data: dict) -> None:
    # Strip helper TTS fields into content as _tts* for generator
    lines = [f"window.{key} = {{"]
    for field in [
        "brand",
        "title",
        "subtitle",
        "tagline",
        "intro",
        "closing",
        "badge",
    ]:
        lines.append(f"  {field}: {js_string(data[field])},")
    lines.append("  zoneArts: {},")
    lines.append("  stages: [")
    for stage in data["stages"]:
        lines.append("    {")
        lines.append(f"      id: {js_string(stage['id'])},")
        lines.append(f"      name: {js_string(stage['name'])},")
        lines.append(f"      line: {js_string(stage['line'])}")
        lines.append("    },")
    lines.append("  ],")
    lines.append(f"  _ttsPerfect: {js_string(data['_ttsPerfect'])},")
    lines.append(f"  _ttsGood: {js_string(data['_ttsGood'])},")
    lines.append(f"  _ttsOk: {js_string(data['_ttsOk'])},")
    lines.append(f"  _ttsLow: {js_string(data['_ttsLow'])},")
    lines.append("  resultMessages(correct, total) {")
    lines.append("    const ratio = correct / total;")
    lines.append(f"    if (ratio === 1) return {js_string(data['_ttsPerfect'])};")
    lines.append(f"    if (ratio >= 0.7) return {js_string(data['_ttsGood'])};")
    lines.append(f"    if (ratio >= 0.4) return {js_string(data['_ttsOk'])};")
    lines.append(f"    return {js_string(data['_ttsLow'])};")
    lines.append("  },")
    lines.append("  questions: [")
    for question in data["questions"]:
        lines.append("    {")
        lines.append(f"      stage: {js_string(question['stage'])},")
        lines.append(f"      speaker: {js_string(question['speaker'])},")
        lines.append(f"      question: {js_string(question['question'])},")
        if question.get("say"):
            lines.append(f"      say: {js_string(question['say'])},")
        lines.append("      options: [")
        for option in question["options"]:
            if option.get("say"):
                lines.append(
                    "        {{ key: {k}, label: {l}, say: {s} }},".format(
                        k=js_string(option["key"]),
                        l=js_string(option["label"]),
                        s=js_string(option["say"]),
                    )
                )
            else:
                lines.append(
                    "        {{ key: {k}, label: {l} }},".format(
                        k=js_string(option["key"]),
                        l=js_string(option["label"]),
                    )
                )
        lines.append("      ],")
        lines.append(f"      answer: {js_string(question['answer'])},")
        lines.append(f"      explain: {js_string(question['explain'])}")
        lines.append("    },")
    lines.append("  ]")
    lines.append("};")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


GAMES_SPEC = [
    {
        "slug": "bai-choi-trung-bo",
        "content_key": "BAI_CHOI_CONTENT",
        "title_page": "Bé vui hội Bài chòi",
        "description": "Hành trình Bài chòi Trung Bộ: đi qua từng khu, chọn đáp án cùng Bé Sen.",
        "gate_bg": "linear-gradient(180deg,#7ec8e3 0%,#ffe0b0 50%,#f0a060 100%)",
        "dance_bg": "linear-gradient(180deg,#8fd4ea 0%,#ffd0a8 48%,#e8b060 100%)",
        "keep_bg": "linear-gradient(180deg,#9ad0e8 0%,#fff0c8 50%,#d7ef9a 100%)",
        "data": {
            "brand": "Bài chòi Trung Bộ",
            "title": "Bé vui hội",
            "subtitle": "Bài chòi",
            "tagline": "Mình đưa bé vào hội Bài chòi miền Trung. Có anh Hiệu hô câu hát, có chòi xinh để ngồi chơi. Bé chọn giúp mình nhé!",
            "intro": "Chào bé! Mình là Bé Sen. Hôm nay mình đi hội Bài chòi, nghe anh Hiệu hô bài và chọn câu đúng nhé!",
            "closing": "Bé đã vui hội Bài chòi. Mình cùng yêu quý nghệ thuật dân gian miền Trung nhé!",
            "badge": "Chiếc chòi xinh",
            "stages": [
                {"id": "gate", "name": "Chặng 1 · Vào hội", "line": "Mở hội Bài chòi rồi!"},
                {"id": "dance", "name": "Chặng 2 · Nghe hô", "line": "Cậu Lồng chỉ anh Hiệu hô câu hát!"},
                {"id": "keep", "name": "Chặng 3 · Giữ gìn", "line": "Chị Cò nhắc mình nghe và yêu Bài chòi."},
            ],
            "_ttsPerfect": "Hoàn hảo! Bé là chuyên gia nhỏ về Bài chòi Trung Bộ!",
            "_ttsGood": "Xuất sắc! Bé đã hiểu rất nhiều về Bài chòi.",
            "_ttsOk": "Tốt lắm! Chơi lại để vui hội Bài chòi thêm nhé!",
            "_ttsLow": "Bé đã cố gắng rồi! Chơi lại để nghe anh Hiệu hô bài thêm nhé!",
            "questions": [
                q("gate", "sen", "Bài chòi là nghệ thuật dân gian của vùng nào?",
                  [("A", "Miền núi phía Bắc"), ("B", "Miền Trung")], "B",
                  "Bài chòi là nghệ thuật dân gian miền Trung."),
                q("gate", "sen", "Bài chòi thường có những hoạt động nào?",
                  [("A", "Hát, chơi bài và diễn xướng"), ("B", "Chỉ đọc sách")], "A",
                  "Bài chòi có hát, chơi bài và diễn xướng."),
                q("gate", "sen", "Người dẫn dắt trò chơi Bài chòi thường được gọi là gì?",
                  [("A", "Người bán hàng"), ("B", "Anh Hiệu hoặc chị Hiệu")], "B",
                  "Người dẫn dắt gọi là anh Hiệu hoặc chị Hiệu."),
                q("gate", "sen", "Anh Hiệu làm gì trong hội Bài chòi?",
                  [("A", "Hô câu hát gợi tên con bài"), ("B", "Ngủ trong chòi")], "A",
                  "Anh Hiệu hô câu hát gợi tên con bài."),
                q("dance", "long", "Người chơi Bài chòi thường ngồi ở đâu?",
                  [("A", "Trên thuyền"), ("B", "Trong những chiếc chòi")], "B",
                  "Người chơi ngồi trong những chiếc chòi."),
                q("dance", "long", "Bài chòi thường kết hợp với loại hình nghệ thuật nào?",
                  [("A", "Âm nhạc, thơ ca và diễn xuất"), ("B", "Chỉ có múa")], "A",
                  "Bài chòi kết hợp âm nhạc, thơ ca và diễn xuất."),
                q("dance", "long", "Hội Bài chòi thường được tổ chức vào dịp nào?",
                  [("A", "Chỉ vào ngày khai giảng"), ("B", "Dịp Tết và lễ hội")], "B",
                  "Hội Bài chòi thường vào dịp Tết và lễ hội."),
                q("dance", "long", "Bài chòi Trung Bộ được UNESCO ghi danh năm nào?",
                  [("A", "Năm 2017"), ("B", "Năm 2003")], "A",
                  "Năm hai nghìn mười bảy, Bài chòi được ghi danh.",
                  say="Bài chòi Trung Bộ được ghi danh năm nào?",
                  option_says={"A": "năm hai nghìn mười bảy", "B": "năm hai nghìn không trăm linh ba"}),
                q("keep", "co", "Khi xem biểu diễn Bài chòi, bé nên làm gì?",
                  [("A", "Nói chuyện thật to, làm ồn"), ("B", "Chú ý lắng nghe và cổ vũ")], "B",
                  "Mình chú ý lắng nghe và cổ vũ."),
                q("keep", "co", "Bé làm gì để góp phần giữ gìn nghệ thuật Bài chòi?",
                  [("A", "Cùng cô tìm hiểu, xem và yêu thích Bài chòi"), ("B", "Không quan tâm đến Bài chòi")], "A",
                  "Mình cùng tìm hiểu, xem và yêu thích Bài chòi."),
            ],
        },
    },
    {
        "slug": "vi-giam-nghe-tinh",
        "content_key": "VI_GIAM_CONTENT",
        "title_page": "Bé yêu làn điệu Ví, Giặm",
        "description": "Hành trình dân ca Ví, Giặm Nghệ Tĩnh: đi qua từng khu, chọn đáp án cùng Bé Sen.",
        "gate_bg": "linear-gradient(180deg,#7eb8d8 0%,#ffe8c0 50%,#c8e070 100%)",
        "dance_bg": "linear-gradient(180deg,#90c8e8 0%,#ffd8b0 48%,#e0c878 100%)",
        "keep_bg": "linear-gradient(180deg,#a0d0e8 0%,#fff4d0 50%,#b8e080 100%)",
        "data": {
            "brand": "Ví, Giặm Nghệ Tĩnh",
            "title": "Bé yêu làn điệu",
            "subtitle": "Ví, Giặm",
            "tagline": "Mình đưa bé về Nghệ An – Hà Tĩnh nghe Ví, Giặm ngọt ngào. Bé chọn giúp mình nhé!",
            "intro": "Chào bé! Mình là Bé Sen. Hôm nay mình nghe Ví, Giặm quê Nghệ Tĩnh, chọn câu đúng nhé!",
            "closing": "Bé đã khám phá Ví, Giặm ngọt ngào của quê hương Nghệ Tĩnh. Mình cùng yêu quý và giữ gìn nhé!",
            "badge": "Lời ru Ví Giặm",
            "stages": [
                {"id": "gate", "name": "Chặng 1 · Quê Nghệ Tĩnh", "line": "Về quê Nghệ Tĩnh nghe Ví, Giặm!"},
                {"id": "dance", "name": "Chặng 2 · Nghe làn điệu", "line": "Cậu Lồng chỉ giai điệu mộc mạc ngọt ngào!"},
                {"id": "keep", "name": "Chặng 3 · Giữ gìn", "line": "Chị Cò nhắc mình yêu quý dân ca."},
            ],
            "_ttsPerfect": "Hoàn hảo! Bé là chuyên gia nhỏ về dân ca Ví, Giặm!",
            "_ttsGood": "Xuất sắc! Bé đã hiểu rất nhiều về Ví, Giặm Nghệ Tĩnh.",
            "_ttsOk": "Tốt lắm! Chơi lại để nghe Ví, Giặm thêm nhé!",
            "_ttsLow": "Bé đã cố gắng rồi! Chơi lại để yêu quý Ví, Giặm thêm nhé!",
            "questions": [
                q("gate", "sen", "Dân ca Ví, Giặm là làn điệu dân ca của tỉnh nào?",
                  [("A", "Nghệ An và Hà Tĩnh"), ("B", "Đà Nẵng và Quảng Nam")], "A",
                  "Ví, Giặm là dân ca của Nghệ An và Hà Tĩnh."),
                q("gate", "sen", "Ví, Giặm là loại hình nghệ thuật gì?",
                  [("A", "Nghệ thuật múa"), ("B", "Dân ca truyền thống")], "B",
                  "Ví, Giặm là dân ca truyền thống."),
                q("gate", "sen", "Giai điệu dân ca Ví, Giặm thường như thế nào?",
                  [("A", "Ồn ào, mạnh mẽ như tiếng còi"), ("B", "Mộc mạc, ngọt ngào, tha thiết")], "B",
                  "Giai điệu Ví, Giặm mộc mạc, ngọt ngào, tha thiết."),
                q("gate", "sen", "Dân ca Ví, Giặm thể hiện tình cảm gì?",
                  [("A", "Tình yêu quê hương, gia đình và con người"), ("B", "Sự giận dữ, ghét bỏ")], "A",
                  "Ví, Giặm thể hiện tình yêu quê hương, gia đình và con người."),
                q("dance", "long", "Người dân thường hát Ví, Giặm trong những hoạt động nào?",
                  [("A", "Chỉ khi đi ngủ"), ("B", "Lao động, sinh hoạt và ru con")], "B",
                  "Người dân hát khi lao động, sinh hoạt và ru con."),
                q("dance", "long", "Khi nghe nghệ nhân hát Ví, Giặm, bé nên làm gì?",
                  [("A", "Lắng nghe và thưởng thức làn điệu dân ca"), ("B", "Nói chuyện thật to")], "A",
                  "Mình lắng nghe và thưởng thức làn điệu."),
                q("dance", "long", "Dân ca Ví, Giặm được UNESCO ghi danh vào năm nào?",
                  [("A", "Năm 2000"), ("B", "Năm 2014")], "B",
                  "Năm hai nghìn mười bốn, Ví, Giặm được ghi danh.",
                  say="Dân ca Ví, Giặm được ghi danh vào năm nào?",
                  option_says={"A": "năm hai nghìn", "B": "năm hai nghìn mười bốn"}),
                q("dance", "long", "Vì sao chúng mình nên yêu quý dân ca Ví, Giặm?",
                  [("A", "Vì đó là làn điệu dân ca truyền thống quý báu"), ("B", "Vì đó là bài hát mới xuất hiện")], "A",
                  "Vì đó là làn điệu dân ca truyền thống quý báu."),
                q("keep", "co", "Bé nên làm gì để góp phần giữ gìn dân ca Ví, Giặm?",
                  [("A", "Không nghe và không tìm hiểu"), ("B", "Nghe hát, học hát và giới thiệu cho người thân")], "B",
                  "Mình nghe hát, học hát và giới thiệu cho người thân."),
                q("keep", "co", "Khi nghe một làn điệu dân ca truyền thống của Việt Nam, bé cảm thấy như thế nào?",
                  [("A", "Yêu quý và tự hào về văn hóa dân tộc"), ("B", "Không cần quan tâm")], "A",
                  "Mình yêu quý và tự hào về văn hóa dân tộc."),
            ],
        },
    },
    {
        "slug": "cong-chieng-tay-nguyen",
        "content_key": "CONG_CHIENG_CONTENT",
        "title_page": "Bé khám phá Cồng chiêng Tây Nguyên",
        "description": "Hành trình Không gian văn hóa Cồng chiêng Tây Nguyên cùng Bé Sen.",
        "gate_bg": "linear-gradient(180deg,#5a9e6a 0%,#ffe08a 45%,#c47840 100%)",
        "dance_bg": "linear-gradient(180deg,#6eb88a 0%,#ffd070 48%,#d09050 100%)",
        "keep_bg": "linear-gradient(180deg,#88c8a0 0%,#fff0b0 50%,#b7e36a 100%)",
        "data": {
            "brand": "Cồng chiêng Tây Nguyên",
            "title": "Bé khám phá",
            "subtitle": "Cồng chiêng",
            "tagline": "Mình đưa bé lên Tây Nguyên nghe tiếng cồng chiêng vang ngân. Bé chọn giúp mình nhé!",
            "intro": "Chào bé! Mình là Bé Sen. Hôm nay mình lên Tây Nguyên nghe cồng chiêng và chọn câu đúng nhé!",
            "closing": "Bé đã khám phá Cồng chiêng Tây Nguyên. Mình cùng yêu quý và giữ gìn nhé!",
            "badge": "Chiếc chiêng vàng",
            "stages": [
                {"id": "gate", "name": "Chặng 1 · Tây Nguyên", "line": "Lên Tây Nguyên nghe cồng chiêng!"},
                {"id": "dance", "name": "Chặng 2 · Nghe chiêng", "line": "Cậu Lồng chỉ tiếng chiêng rộn ràng!"},
                {"id": "keep", "name": "Chặng 3 · Giữ gìn", "line": "Chị Cò nhắc mình trân trọng di sản."},
            ],
            "_ttsPerfect": "Hoàn hảo! Bé là chuyên gia nhỏ về Cồng chiêng Tây Nguyên!",
            "_ttsGood": "Xuất sắc! Bé đã hiểu rất nhiều về Cồng chiêng.",
            "_ttsOk": "Tốt lắm! Chơi lại để nghe tiếng chiêng thêm nhé!",
            "_ttsLow": "Bé đã cố gắng rồi! Chơi lại để yêu quý Cồng chiêng thêm nhé!",
            "questions": [
                q("gate", "sen", "Không gian văn hóa Cồng chiêng thuộc vùng nào của Việt Nam?",
                  [("A", "Đồng bằng Bắc Bộ"), ("B", "Tây Nguyên")], "B",
                  "Cồng chiêng thuộc vùng Tây Nguyên."),
                q("gate", "sen", "Cồng chiêng là loại nhạc cụ gì?",
                  [("A", "Nhạc cụ bằng đồng"), ("B", "Nhạc cụ dây")], "A",
                  "Cồng chiêng là nhạc cụ bằng đồng."),
                q("gate", "sen", "Cồng chiêng thường được sử dụng trong những dịp nào?",
                  [("A", "Chỉ dùng để trang trí"), ("B", "Lễ hội, sinh hoạt cộng đồng")], "B",
                  "Cồng chiêng dùng trong lễ hội và sinh hoạt cộng đồng."),
                q("gate", "sen", "Khi cồng chiêng vang lên, chúng ta thường nghe thấy âm thanh như thế nào?",
                  [("A", "Âm thanh vang ngân, rộn ràng"), ("B", "Âm thanh trong trẻo của tiếng chim")], "A",
                  "Tiếng cồng chiêng vang ngân, rộn ràng."),
                q("dance", "long", "Ai thường biểu diễn cồng chiêng trong các lễ hội Tây Nguyên?",
                  [("A", "Chỉ có khách du lịch"), ("B", "Người dân trong cộng đồng")], "B",
                  "Người dân trong cộng đồng biểu diễn cồng chiêng."),
                q("dance", "long", "Cồng chiêng có ý nghĩa gì đối với người dân Tây Nguyên?",
                  [("A", "Gắn bó với đời sống và văn hóa cộng đồng"), ("B", "Chỉ là đồ chơi")], "A",
                  "Cồng chiêng gắn bó với đời sống và văn hóa cộng đồng."),
                q("dance", "long", "Không gian văn hóa Cồng chiêng Tây Nguyên được UNESCO ghi danh năm nào?",
                  [("A", "Năm 2017"), ("B", "Năm 2005")], "B",
                  "Năm hai nghìn không trăm linh năm, Cồng chiêng được ghi danh.",
                  say="Không gian văn hóa Cồng chiêng Tây Nguyên được ghi danh năm nào?",
                  option_says={"A": "năm hai nghìn mười bảy", "B": "năm hai nghìn không trăm linh năm"}),
                q("dance", "long", "Khi xem biểu diễn cồng chiêng, bé nên làm gì?",
                  [("A", "Lắng nghe, quan sát và cổ vũ"), ("B", "Chạy nhảy làm ồn")], "A",
                  "Mình lắng nghe, quan sát và cổ vũ."),
                q("keep", "co", "Vì sao chúng mình cần yêu quý văn hóa Cồng chiêng Tây Nguyên?",
                  [("A", "Vì đây chỉ là trò chơi thông thường"), ("B", "Vì đây là di sản văn hóa quý báu của dân tộc")], "B",
                  "Vì đây là di sản văn hóa quý báu của dân tộc."),
                q("keep", "co", "Bé có thể làm gì để góp phần giữ gìn văn hóa Cồng chiêng?",
                  [("A", "Cùng cô tìm hiểu, nghe nhạc và trân trọng văn hóa Tây Nguyên"), ("B", "Không tìm hiểu về cồng chiêng")], "A",
                  "Mình cùng tìm hiểu, nghe nhạc và trân trọng văn hóa Tây Nguyên."),
            ],
        },
    },
    {
        "slug": "xoe-thai-tay-bac",
        "content_key": "XOE_THAI_CONTENT",
        "title_page": "Bé khám phá nghệ thuật Xòe Thái",
        "description": "Hành trình điệu Xòe Thái Tây Bắc: nắm tay vòng xòe, chọn đáp án cùng Bé Sen.",
        "gate_bg": "linear-gradient(180deg,#6eb8d8 0%,#ffb0c8 45%,#88d070 100%)",
        "dance_bg": "linear-gradient(180deg,#80c8e8 0%,#ffc0d8 48%,#a0e088 100%)",
        "keep_bg": "linear-gradient(180deg,#98d0e8 0%,#ffe0ec 50%,#c8ef9a 100%)",
        "data": {
            "brand": "Xòe Thái Tây Bắc",
            "title": "Bé khám phá",
            "subtitle": "Xòe Thái",
            "tagline": "Mình đưa bé lên Tây Bắc xem điệu Xòe Thái. Mọi người nắm tay thành vòng xòe vui lắm. Bé chọn giúp mình nhé!",
            "intro": "Chào bé! Mình là Bé Sen. Hôm nay mình xem Xòe Thái, nắm tay vòng xòe và chọn câu đúng nhé!",
            "closing": "Bé đã khám phá Xòe Thái. Mình cùng yêu quý và giữ gìn điệu múa này nhé!",
            "badge": "Vòng xòe vui",
            "stages": [
                {"id": "gate", "name": "Chặng 1 · Tây Bắc", "line": "Lên Tây Bắc xem Xòe Thái!"},
                {"id": "dance", "name": "Chặng 2 · Vòng xòe", "line": "Cậu Lồng chỉ mọi người nắm tay thành vòng!"},
                {"id": "keep", "name": "Chặng 3 · Giữ gìn", "line": "Chị Cò nhắc mình trân trọng điệu múa."},
            ],
            "_ttsPerfect": "Hoàn hảo! Bé là chuyên gia nhỏ về nghệ thuật Xòe Thái!",
            "_ttsGood": "Xuất sắc! Bé đã hiểu rất nhiều về Xòe Thái.",
            "_ttsOk": "Tốt lắm! Chơi lại để múa xòe trong lòng thêm nhé!",
            "_ttsLow": "Bé đã cố gắng rồi! Chơi lại để yêu quý Xòe Thái thêm nhé!",
            "questions": [
                q("gate", "sen", "Xòe Thái là điệu múa truyền thống của dân tộc nào?",
                  [("A", "Dân tộc Thái"), ("B", "Dân tộc Chăm")], "A",
                  "Xòe Thái là điệu múa của dân tộc Thái."),
                q("gate", "sen", "Nghệ thuật Xòe Thái nổi tiếng ở vùng nào?",
                  [("A", "Tây Nam Bộ"), ("B", "Vùng Tây Bắc Việt Nam")], "B",
                  "Xòe Thái nổi tiếng ở vùng Tây Bắc Việt Nam."),
                q("gate", "sen", "Khi múa Xòe Thái, mọi người thường làm gì?",
                  [("A", "Ngồi yên một chỗ"), ("B", "Nắm tay nhau tạo thành vòng xòe")], "B",
                  "Mọi người nắm tay nhau tạo thành vòng xòe."),
                q("gate", "sen", "Điệu Xòe Thái thường được biểu diễn trong dịp nào?",
                  [("A", "Lễ hội và sinh hoạt cộng đồng"), ("B", "Chỉ trong giờ học")], "A",
                  "Xòe Thái thường biểu diễn trong lễ hội và sinh hoạt cộng đồng."),
                q("dance", "long", "Điệu Xòe Thái thể hiện điều gì?",
                  [("A", "Sự xa cách, không muốn chơi cùng nhau"), ("B", "Niềm vui, tình đoàn kết và sự gắn bó")], "B",
                  "Xòe Thái thể hiện niềm vui, tình đoàn kết và sự gắn bó."),
                q("dance", "long", "Khi tham gia vòng xòe, bé nên làm gì?",
                  [("A", "Nắm tay bạn, cùng múa vui vẻ"), ("B", "Đẩy bạn ra khỏi vòng")], "A",
                  "Mình nắm tay bạn, cùng múa vui vẻ."),
                q("dance", "long", "Trang phục truyền thống của người phụ nữ Thái thường có gì?",
                  [("A", "Áo tắm và mũ bơi"), ("B", "Áo cóm và khăn piêu")], "B",
                  "Phụ nữ Thái thường có áo cóm và khăn piêu."),
                q("dance", "long", "Nghệ thuật Xòe Thái được UNESCO ghi danh vào năm nào?",
                  [("A", "Năm 2021"), ("B", "Năm 2005")], "A",
                  "Năm hai nghìn hai mươi mốt, Xòe Thái được ghi danh.",
                  say="Nghệ thuật Xòe Thái được ghi danh vào năm nào?",
                  option_says={"A": "năm hai nghìn hai mươi mốt", "B": "năm hai nghìn không trăm linh năm"}),
                q("keep", "co", "Vì sao chúng mình nên yêu quý điệu Xòe Thái?",
                  [("A", "Vì đây chỉ là một trò chơi bình thường"), ("B", "Vì đây là di sản văn hóa quý báu của dân tộc")], "B",
                  "Vì đây là di sản văn hóa quý báu của dân tộc."),
                q("keep", "co", "Bé làm gì để góp phần giữ gìn nghệ thuật Xòe Thái?",
                  [("A", "Tìm hiểu, xem biểu diễn và trân trọng văn hóa dân tộc"), ("B", "Không quan tâm đến điệu múa")], "A",
                  "Mình tìm hiểu, xem biểu diễn và trân trọng văn hóa dân tộc."),
            ],
        },
    },
    {
        "slug": "don-ca-tai-tu",
        "content_key": "DON_CA_CONTENT",
        "title_page": "Bé khám phá Đờn ca tài tử",
        "description": "Hành trình Đờn ca tài tử Nam Bộ: đi qua từng khu, chọn đáp án cùng Bé Sen.",
        "gate_bg": "linear-gradient(180deg,#6ec6e0 0%,#ffe0a0 50%,#90d070 100%)",
        "dance_bg": "linear-gradient(180deg,#80d0e8 0%,#ffd8b8 48%,#b0e080 100%)",
        "keep_bg": "linear-gradient(180deg,#98d8e8 0%,#fff3d0 50%,#c8ef9a 100%)",
        "data": {
            "brand": "Đờn ca tài tử Nam Bộ",
            "title": "Bé khám phá",
            "subtitle": "Đờn ca tài tử",
            "tagline": "Mình đưa bé về Nam Bộ nghe đờn ca tài tử. Tiếng đàn kìm và lời ca sâu lắng lắm. Bé chọn giúp mình nhé!",
            "intro": "Chào bé! Mình là Bé Sen. Hôm nay mình nghe đờn ca tài tử Nam Bộ và chọn câu đúng nhé!",
            "closing": "Bé đã khám phá Đờn ca tài tử. Mình cùng yêu quý và giữ gìn nhé!",
            "badge": "Đàn kìm nhỏ",
            "stages": [
                {"id": "gate", "name": "Chặng 1 · Nam Bộ", "line": "Về Nam Bộ nghe đờn ca tài tử!"},
                {"id": "dance", "name": "Chặng 2 · Nghe đàn ca", "line": "Cậu Lồng chỉ tiếng đàn kìm sâu lắng!"},
                {"id": "keep", "name": "Chặng 3 · Giữ gìn", "line": "Chị Cò nhắc mình trân trọng di sản."},
            ],
            "_ttsPerfect": "Hoàn hảo! Bé là chuyên gia nhỏ về Đờn ca tài tử Nam Bộ!",
            "_ttsGood": "Xuất sắc! Bé đã hiểu rất nhiều về Đờn ca tài tử.",
            "_ttsOk": "Tốt lắm! Chơi lại để nghe đàn ca thêm nhé!",
            "_ttsLow": "Bé đã cố gắng rồi! Chơi lại để yêu quý Đờn ca tài tử thêm nhé!",
            "questions": [
                q("gate", "sen", "Đờn ca tài tử là loại hình nghệ thuật truyền thống của vùng nào?",
                  [("A", "Tây Bắc"), ("B", "Nam Bộ")], "B",
                  "Đờn ca tài tử là nghệ thuật truyền thống Nam Bộ."),
                q("gate", "sen", "Đờn ca tài tử gồm những hoạt động nào?",
                  [("A", "Đàn nhạc và ca hát"), ("B", "Chỉ có múa")], "A",
                  "Đờn ca tài tử gồm đàn nhạc và ca hát."),
                q("gate", "sen", "Đờn ca tài tử thường được biểu diễn ở đâu?",
                  [("A", "Chỉ ở sân trường"), ("B", "Trong sinh hoạt, giao lưu và các dịp lễ hội")], "B",
                  "Thường biểu diễn trong sinh hoạt, giao lưu và lễ hội."),
                q("gate", "sen", "Đâu là nhạc cụ thường có trong Đờn ca tài tử?",
                  [("A", "Đàn kìm"), ("B", "Trống trường")], "A",
                  "Trong Đờn ca tài tử thường có đàn kìm."),
                q("dance", "long", "Đờn ca tài tử thường có giai điệu như thế nào?",
                  [("A", "Chỉ có tiếng động mạnh"), ("B", "Mềm mại, sâu lắng, giàu tình cảm")], "B",
                  "Giai điệu mềm mại, sâu lắng, giàu tình cảm."),
                q("dance", "long", "Đờn ca tài tử thể hiện tình cảm gì?",
                  [("A", "Tình yêu quê hương, cuộc sống và con người"), ("B", "Sự giận dữ và xa cách")], "A",
                  "Thể hiện tình yêu quê hương, cuộc sống và con người."),
                q("dance", "long", "Khi nghe Đờn ca tài tử, bé nên làm gì?",
                  [("A", "Nói chuyện thật to"), ("B", "Lắng nghe và cảm nhận giai điệu")], "B",
                  "Mình lắng nghe và cảm nhận giai điệu."),
                q("dance", "long", "Đờn ca tài tử Nam Bộ được UNESCO ghi danh năm nào?",
                  [("A", "Năm 2013"), ("B", "Năm 2005")], "A",
                  "Năm hai nghìn mười ba, Đờn ca tài tử được ghi danh.",
                  say="Đờn ca tài tử Nam Bộ được ghi danh năm nào?",
                  option_says={"A": "năm hai nghìn mười ba", "B": "năm hai nghìn không trăm linh năm"}),
                q("keep", "co", "Vì sao chúng mình nên yêu quý Đờn ca tài tử?",
                  [("A", "Vì đây là một trò chơi điện tử"), ("B", "Vì đây là di sản văn hóa quý báu của Việt Nam")], "B",
                  "Vì đây là di sản văn hóa quý báu của Việt Nam."),
                q("keep", "co", "Bé làm gì để góp phần giữ gìn Đờn ca tài tử?",
                  [("A", "Nghe hát, xem biểu diễn và trân trọng di sản"), ("B", "Không tìm hiểu về âm nhạc truyền thống")], "A",
                  "Mình nghe hát, xem biểu diễn và trân trọng di sản."),
            ],
        },
    },
]


def main() -> None:
    for game in GAMES_SPEC:
        folder = GAMES / game["slug"]
        (folder / "audio").mkdir(parents=True, exist_ok=True)
        (folder / "assets").mkdir(parents=True, exist_ok=True)
        write_content(folder / "content.js", game["content_key"], game["data"])
        (folder / "index.html").write_text(
            INDEX_HTML.format(
                description=game["description"],
                title=game["title_page"],
            ),
            encoding="utf-8",
        )
        (folder / "game.js").write_text(
            GAME_JS.format(content_key=game["content_key"]),
            encoding="utf-8",
        )
        (folder / "styles.css").write_text(
            STYLES_CSS.format(
                gate_bg=game["gate_bg"],
                dance_bg=game["dance_bg"],
                keep_bg=game["keep_bg"],
            ),
            encoding="utf-8",
        )
        (folder / "generate-audio.py").write_text(
            GEN_AUDIO_PY.format(content_key=game["content_key"]),
            encoding="utf-8",
        )
        (folder / "generate-audio.js").write_text(GEN_JS, encoding="utf-8")
        # placeholder manifest so page loads before TTS
        questions = game["data"]["questions"]
        keys = []
        for i in range(len(questions)):
            keys.extend([f"q{i}", f"fb{i}_ok", f"fb{i}_bad"])
        for i in range(len(questions) + 1):
            keys.append(f"result_{i}")
        for i in range(len(questions)):
            keys.append(f"q{i}_replay")
        manifest = {k: f"audio/{k}.mp3" for k in keys}
        (folder / "audio-manifest.js").write_text(
            "window.AUDIO_MANIFEST = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n",
            encoding="utf-8",
        )
        print("scaffolded", game["slug"])


if __name__ == "__main__":
    main()
