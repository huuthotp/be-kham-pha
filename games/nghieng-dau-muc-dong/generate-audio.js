#!/usr/bin/env node
/**
 * Tạo giọng đọc tiếng Việt cho game Nghiêng Đầu – Lễ hội Mục Đồng,
 * cùng nguồn TTS với các game Đình Lỗ Giáng / Đua thuyền / Chợ phiên.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "audio");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "content.js"), "utf8"), sandbox);
const QUESTIONS = sandbox.window.TILT_CONTENT.questions;

function questionSpeech(q) {
  return `${q.question} A. ${q.options[0].label}. Hay B. ${q.options[1].label}?`;
}

function feedbackSpeech(isCorrect, explain) {
  if (isCorrect) return `Wow! Giỏi quá bé ơi! ${explain} Tuyệt vời!`;
  return `Ôi, chưa đúng đâu. Không sao nhé! ${explain} Cố lên nào!`;
}

function resultSpeech(correct, total) {
  const ratio = correct / total;
  let msg = "Bé đã cố gắng rồi! Chơi lại để học thêm về Lễ hội Mục Đồng nhé!";
  if (ratio === 1) msg = "Hoàn hảo! Bé là chuyên gia nhỏ về Lễ hội Mục Đồng!";
  else if (ratio >= 0.7) msg = "Xuất sắc! Bé đã hiểu rất nhiều về Lễ hội Mục Đồng.";
  else if (ratio >= 0.4) msg = "Tốt lắm! Chơi lại để khám phá thêm nhiều điều thú vị nhé!";
  return `Xong rồi bé ơi! Yay! Bé đúng ${correct} trên ${total} câu. ${msg}`;
}

function chunkText(text, maxLen = 160) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return [clean];
  const parts = [];
  let rest = clean;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(" ", maxLen);
    if (cut < 40) cut = maxLen;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function fetchChunk(text) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(text.slice(0, 180));
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=${q}`;
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "*/*"
        },
        timeout: 15000
      },
      (r) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (r.statusCode !== 200 || buf.length < 200) {
            reject(new Error(`TTS ${r.statusCode} bytes=${buf.length}`));
            return;
          }
          resolve(buf);
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function fetchTts(text) {
  const parts = chunkText(text, 160);
  const buffers = [];
  for (const part of parts) {
    buffers.push(await fetchChunk(part));
    await new Promise((r) => setTimeout(r, 250));
  }
  return Buffer.concat(buffers);
}

function runFfmpeg(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "ffmpeg failed");
  }
}

function ensureSilencePad() {
  const silencePath = path.join(OUT_DIR, "_silence.mp3");
  runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=24000:cl=mono",
    "-t",
    "0.35",
    "-q:a",
    "9",
    silencePath
  ]);
  return silencePath;
}

function padWithSilence(speechBuf, silencePath, outPath) {
  const tmpSpeech = path.join(OUT_DIR, "_speech_tmp.mp3");
  fs.writeFileSync(tmpSpeech, speechBuf);
  runFfmpeg([
    "-y",
    "-i",
    silencePath,
    "-i",
    tmpSpeech,
    "-filter_complex",
    "[0:a][1:a]concat=n=2:v=0:a=1,afade=t=in:st=0:d=0.08[a]",
    "-map",
    "[a]",
    "-ar",
    "24000",
    "-ac",
    "1",
    "-q:a",
    "4",
    outPath
  ]);
  fs.unlinkSync(tmpSpeech);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const silencePath = ensureSilencePad();
  const manifest = {};
  const jobs = [];

  QUESTIONS.forEach((q, i) => {
    const speech = questionSpeech(q);
    jobs.push({ key: `q${i}`, text: speech });
    jobs.push({ key: `q${i}_replay`, text: speech });
    jobs.push({ key: `fb${i}_ok`, text: feedbackSpeech(true, q.explain) });
    jobs.push({ key: `fb${i}_bad`, text: feedbackSpeech(false, q.explain) });
  });

  for (let c = 0; c <= QUESTIONS.length; c += 1) {
    jobs.push({ key: `result_${c}`, text: resultSpeech(c, QUESTIONS.length) });
  }

  for (const job of jobs) {
    process.stdout.write(`Generating ${job.key}... `);
    const buf = await fetchTts(job.text);
    const file = `${job.key}.mp3`;
    const outPath = path.join(OUT_DIR, file);
    padWithSilence(buf, silencePath, outPath);
    manifest[job.key] = `audio/${file}`;
    console.log(`ok (${fs.statSync(outPath).size} bytes)`);
  }

  try {
    fs.unlinkSync(silencePath);
  } catch (_) {
    /* ignore */
  }

  fs.writeFileSync(
    path.join(ROOT, "audio-manifest.js"),
    `window.AUDIO_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`
  );
  console.log(`Done. ${jobs.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
