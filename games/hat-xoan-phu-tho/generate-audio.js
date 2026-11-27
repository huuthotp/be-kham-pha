#!/usr/bin/env node
/** Giọng Việt dựng sẵn — generate-audio.py (Ngọc Huyền mới / Hát Xoan, tốc độ 0.88). */
const { spawnSync } = require("child_process");

const result = spawnSync("py", ["generate-audio.py"], { stdio: "inherit", cwd: __dirname });
process.exit(result.status ?? 1);

