#!/usr/bin/env node
/** Giọng có ngữ điệu nằm ở generate-audio.py (Hoài My). */
const { spawnSync } = require("child_process");

const result = spawnSync("py", ["generate-audio.py"], { stdio: "inherit", cwd: __dirname });
process.exit(result.status ?? 1);
