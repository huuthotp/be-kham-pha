#!/usr/bin/env node
const { spawnSync } = require("child_process");
const result = spawnSync("py", ["generate-audio.py"], { stdio: "inherit", cwd: __dirname });
process.exit(result.status ?? 1);
