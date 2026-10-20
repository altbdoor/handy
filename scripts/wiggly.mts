#!/usr/bin/env node

import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import { newBrushSet, newColorPalette } from "./wiggly-data.mts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// process.chdir(projectRoot)
const wigglySourceFile = path.join(projectRoot, "pages/personal-wiggly/WigglyPaint.html");
const wigglyEditedFile = path.join(projectRoot, "pages/personal-wiggly/paint.html");

const rl = createInterface({ input: createReadStream(wigglySourceFile) });
const ws = createWriteStream(wigglyEditedFile);

let foundSounds = false;
let foundNextBlockAfterSounds = false;

let foundShake = false;
let foundEndShake = false;

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

  // skip playing audio with early return
  if (lineTrim.startsWith("n_play=(")) {
    ws.write(line + "return NIL;\n");
    continue;
  }

  // remove obliterate shake
  if (lineTrim.startsWith("on shake ")) {
    foundShake = true;
    ws.write(line + "\n");
    continue;
  }

  if (foundShake && lineTrim === "end") {
    foundEndShake = true;
  }

  if (foundShake && !foundEndShake) {
    continue;
  }

  // remove homepage img
  if (lineTrim.startsWith("target:")) {
    const val = JSON.parse(lineTrim.replace("target:", ""));
    if (val.type === "contraption" && val.locked === 1) {
      continue;
    }
  }

  // nuke history
  if (lineTrim.startsWith("history:")) {
    const val = JSON.parse(lineTrim.replace("history:", ""));
    val.value.arg = [];
    ws.write(`history:${JSON.stringify(val)}\n`);
    continue;
  }

  // nuke old three brush
  if (
    lineTrim.startsWith("hi36:") ||
    lineTrim.startsWith("hi39:") ||
    lineTrim.startsWith("hi33:")
  ) {
    continue;
  }

  // nuke vert and horiz
  if (lineTrim.startsWith("mhoriz:") || lineTrim.startsWith("mvert:")) {
    continue;
  }

  // https://toyhou.se/~forums/11.general-off-topic/750652.how-to-wigglypaint-ethical-edition-feat-colors?page=3
  // https://ahmwwmaaa.neocities.org/decker/decks/workshop#home
  // https://wigglypaintworkshop.nekoweb.org/

  // inject new brushes
  if (lineTrim === "{script:main.0}") {
    ws.write(newBrushSet + "\n");
  }

  // inject new palette
  if (lineTrim === "{script:options.0}") {
    ws.write(newColorPalette + "\n");
  }

  ws.write(line + "\n");
}

ws.end();
