#!/usr/bin/env node
/**
 * Tạo giọng đọc tiếng Việt cho game đua thuyền,
 * cùng nguồn với file âm thanh của Đình làng Lỗ Giáng.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "audio");
const gameSrc = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
const htmlSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function grab(re) {
  return [...gameSrc.matchAll(re)].map((m) => m[1]);
}

const questions = grab(/question:\s*"([^"]+)"/g);
const explains = grab(/explain:\s*"([^"]+)"/g);
const optionA = grab(/optionA:\s*"([^"]+)"/g);
const optionB = grab(/optionB:\s*"([^"]+)"/g);
const options = optionA.flatMap((text, i) => [`A. ${text}`, `B. ${optionB[i]}`]);
const introMatch = htmlSrc.match(/id="intro-text">\s*([^<]+)/);
const intro = introMatch ? introMatch[1].replace(/\s+/g, " ").trim() : "";

const phrases = [
  intro,
  "Đội Xanh ơi!",
  "Đội Đỏ ơi!",
  ...questions,
  ...options,
  ...explains,
  "Thuyền rồng tiến lên!",
  "Chèo tiếp nào!",
  "Giỏi quá!",
  "Chưa đúng!",
  "Thuyền chưa tiến, cố lên nhé!",
  "Đội Xanh tới đích!",
  "Đội Đỏ tới đích!",
  "Đội Xanh vẫn được trả lời tiếp nhé!",
  "Đội Đỏ vẫn được trả lời tiếp nhé!",
  "Cả hai đội đã về đích!",
  "Giỏi quá các thủy thủ nhí!",
  "Chúng ta cùng đến câu tiếp theo nhé!",
  "Tuyệt vời! Hai đội cùng về đích!",
  "Tuyệt vời! Đội Xanh về đích nhanh hơn, và Đội Đỏ cũng đã về đích!",
  "Tuyệt vời! Đội Đỏ về đích nhanh hơn, và Đội Xanh cũng đã về đích!"
].map((s) => String(s).replace(/\s+/g, " ").trim()).filter(Boolean);

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
    await new Promise((r) => setTimeout(r, 200));
  }
  return Buffer.concat(buffers);
}

function runFfmpeg(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "ffmpeg failed");
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
    "0.28",
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
    "[0:a][1:a]concat=n=2:v=0:a=1[out]",
    "-map",
    "[out]",
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
  const unique = [...new Set(phrases)];
  for (let i = 0; i < unique.length; i += 1) {
    const text = unique[i];
    const file = `c${i}.mp3`;
    process.stdout.write(`${i + 1}/${unique.length} ${text.slice(0, 42)}... `);
    const buf = await fetchTts(text);
    padWithSilence(buf, silencePath, path.join(OUT_DIR, file));
    manifest[text] = `audio/${file}`;
    console.log("ok");
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
  console.log(`Done. ${unique.length} clips`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
