#!/usr/bin/env node
/** Giọng Việt dựng sẵn — generate-audio.py (Google TTS, phụ âm đầu rõ). */
const { spawnSync } = require("child_process");

const result = spawnSync("py", ["generate-audio.py"], { stdio: "inherit", cwd: __dirname });
process.exit(result.status ?? 1);
