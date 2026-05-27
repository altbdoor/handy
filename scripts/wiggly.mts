#!/usr/bin/env node

import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// process.chdir(projectRoot)
const wigglySourceFile = path.join(
  projectRoot,
  "pages/personal-wiggly/WigglyPaint.html",
);
const wigglyEditedFile = path.join(
  projectRoot,
  "pages/personal-wiggly/paint.html",
);

const rl = createInterface({ input: createReadStream(wigglySourceFile) });
const ws = createWriteStream(wigglyEditedFile);

let foundSounds = false;
let foundNextBlockAfterSounds = false;

let foundShake = false;
let foundNextBlockAfterShake = false;

for await (const line of rl) {
  const lineTrim = line.trimEnd();

  // remove sound files
  if (lineTrim === "{sounds}") {
    foundSounds = true;
    continue;
  }

  if (foundSounds && lineTrim.startsWith("{")) {
    foundNextBlockAfterSounds = true;
  }

  if (foundSounds && !foundNextBlockAfterSounds) {
    continue;
  }

  // skip playing audio
  if (lineTrim.startsWith("n_play=")) {
    ws.write(line + "return NIL;\n");
    continue;
  }

  // nuke history
  if (lineTrim.startsWith("history:")) {
    ws.write(line.replace(/\"\%\%.+?\]/, "]") + "\n");
    continue;
  }

  ws.write(line + "\n");
}

ws.end();
