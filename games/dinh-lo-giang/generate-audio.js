#!/usr/bin/env node
/**
 * Tạo sẵn file âm thanh tiếng Việt cho mini game Đình Lỗ Giáng.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "audio");

const QUESTIONS = [
  {
    question: "Các bé ơi, đình làng Lỗ Giáng nằm ở phường Hòa Xuân đấy! Đúng hay sai?",
    explain: "Đúng rồi! Đình làng Lỗ Giáng nằm ở phường Hòa Xuân đó."
  },
  {
    question: "Bạn nhỏ nói: “Đình làng chỉ là nơi để vui chơi thôi!” Bạn ấy nói đúng hay sai nhỉ?",
    explain: "Sai rồi nhé! Đình không chỉ để vui chơi, còn là nơi thờ cúng và giữ gìn văn hóa làng."
  },
  {
    question: "Nếu đến đình làng, chúng mình có thể lấy bút vẽ lên tường đình. Đúng hay sai?",
    explain: "Sai rồi! Không được vẽ lên tường đình đâu, phải yêu quý và bảo vệ đình nhé."
  },
  {
    question: "Đình làng là nơi lưu giữ những nét đẹp văn hóa truyền thống của quê hương. Đúng hay sai?",
    explain: "Đúng rồi! Đình làng lưu giữ những nét đẹp văn hóa truyền thống của quê hương."
  },
  {
    question: "Khi đến thăm đình, chúng mình cùng giữ cho đình luôn sạch đẹp nhé! Đúng hay sai?",
    explain: "Đúng rồi! Chúng mình cùng giữ cho đình luôn sạch đẹp nhé!"
  }
];

function feedbackSpeech(isCorrect, explain) {
  if (isCorrect) return `Wow! Giỏi quá bé ơi! ${explain} Tuyệt vời!`;
  return `Ôi, chưa đúng đâu. Không sao nhé! ${explain} Cố lên nào!`;
}

function resultSpeech(correct, total) {
  const ratio = correct / total;
  let msg = "Bé đã cố gắng rồi! Chơi lại để học thêm về Đình Lỗ Giáng nhé!";
  if (ratio === 1) msg = "Hoàn hảo! Bé là chuyên gia nhỏ về Đình làng Lỗ Giáng!";
  else if (ratio >= 0.7) msg = "Xuất sắc! Bé đã hiểu rất nhiều về ngôi đình quê hương.";
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

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = {};
  const jobs = [];

  QUESTIONS.forEach((q, i) => {
    jobs.push({ key: `q${i}`, text: q.question });
    jobs.push({ key: `q${i}_replay`, text: q.question });
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
    fs.writeFileSync(path.join(OUT_DIR, file), buf);
    manifest[job.key] = `audio/${file}`;
    console.log(`ok (${buf.length} bytes)`);
  }

  fs.writeFileSync(
    path.join(__dirname, "audio-manifest.js"),
    `window.AUDIO_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`
  );
  console.log(`Done. ${jobs.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
