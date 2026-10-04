#!/usr/bin/env node
/**
 * Tạo giọng đọc tiếng Việt cho game chợ phiên,
 * cùng nguồn với file âm thanh của Đình làng Lỗ Giáng và Đua thuyền.
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
const content = sandbox.window.MARKET_CONTENT;

const phrases = [];
content.zones.forEach((zone) => {
  phrases.push(zone.kicker, zone.name, zone.blurb);
});
content.questions.forEach((q) => {
  phrases.push(q.question);
  phrases.push(`Một. ${q.options[0].label}`);
  phrases.push(`Hai. ${q.options[1].label}`);
  phrases.push(q.retry, q.success);
  if (q.prompt) phrases.push(q.prompt);
});
content.stalls.forEach((stall) => phrases.push(stall.line));
phrases.push(
  "Chúc mừng bé!",
  "Bé đã hoàn thành chuyến khám phá Chợ phiên Làng trong phố Hòa Xuân.",
  "Hòa Xuân, quê hương của những điều thân thương!"
);

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchChunkOnce(text) {
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

async function fetchChunk(text) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await fetchChunkOnce(text);
    } catch (error) {
      lastError = error;
      await sleep(700 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchTts(text) {
  const parts = chunkText(text, 160);
  const buffers = [];
  for (const part of parts) {
    buffers.push(await fetchChunk(part));
    await sleep(200);
  }
  return Buffer.concat(buffers);
}

function runFfmpeg(args) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "ffmpeg failed");
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
  const unique = [...new Set(phrases.map((text) => String(text).replace(/\s+/g, " ").trim()).filter(Boolean))];

  for (let i = 0; i < unique.length; i += 1) {
    const text = unique[i];
    const file = `c${i}.mp3`;
    process.stdout.write(`${i + 1}/${unique.length} ${text.slice(0, 48)}... `);
    const buf = await fetchTts(text);
    padWithSilence(buf, silencePath, path.join(OUT_DIR, file));
    manifest[text] = `audio/${file}`;
    console.log("ok");
    await sleep(250);
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
