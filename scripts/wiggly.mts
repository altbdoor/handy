#!/usr/bin/env node

import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import {
  backupScript,
  newBrushSet,
  newColorPalette,
  undoRedoControls,
  undoRedoScript,
} from "./wiggly-data.mts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// process.chdir(projectRoot)
const wigglySourceFile = path.join(projectRoot, "pages/personal-wiggly/WigglyPaint.html");
const wigglyEditedFile = path.join(projectRoot, "pages/personal-wiggly/paint.html");

const rl = createInterface({ input: createReadStream(wigglySourceFile) });
const ws = createWriteStream(wigglyEditedFile);
const writeLn = (line: string) => ws.write(line + "\n");

let foundSounds = false;
let foundNextBlockAfterSounds = false;

let foundShake = false;
let foundEndShake = false;

let foundUndoScript = false;
let foundEndUndoScript = false;

let foundBackupScript = false;
let foundEndBackupScript = false;

for await (const line of rl) {
  const lineTrim = line.trimEnd();

  // remove sound files
  if (lineTrim === "{sounds}") {
    foundSounds = true;
    continue;
  }

  if (foundSounds && !foundNextBlockAfterSounds) {
    if (lineTrim.startsWith("{")) {
      foundNextBlockAfterSounds = true;
      writeLn(line);
      continue;
    }

    continue;
  }

  // skip playing audio with early return
  if (lineTrim.startsWith("n_play=(")) {
    writeLn(line + "return NIL;");
    continue;
  }

  // remove obliterate shake
  if (lineTrim.startsWith("on shake ")) {
    foundShake = true;
    writeLn(line);
    continue;
  }

  if (foundShake && !foundEndShake) {
    if (lineTrim === "end") {
      foundEndShake = true;
      writeLn(line);
    }

    continue;
  }

  // replace undo script
  if (lineTrim === "{script:main.6}") {
    foundUndoScript = true;
    continue;
  }

  if (foundUndoScript && !foundEndUndoScript) {
    if (lineTrim === "{end}") {
      foundEndUndoScript = true;
      writeLn(undoRedoScript);
      continue;
    }

    continue;
  }

  // replace on backup
  if (lineTrim === "on backup do") {
    foundBackupScript = true;
    continue;
  }

  if (foundBackupScript && !foundEndBackupScript) {
    if (lineTrim === "end") {
      foundEndBackupScript = true;
      writeLn(backupScript);
      continue;
    }

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
    writeLn(`history:${JSON.stringify(val)}`);
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

  // replace undo button with undo memory, undo, and redo buttons
  if (lineTrim.startsWith("button3:") && lineTrim.includes("main.6")) {
    writeLn("");
    writeLn(undoRedoControls);
    writeLn("");
    continue;
  }

  // https://toyhou.se/~forums/11.general-off-topic/750652.how-to-wigglypaint-ethical-edition-feat-colors?page=3
  // https://ahmwwmaaa.neocities.org/decker/decks/workshop#home
  // https://wigglypaintworkshop.nekoweb.org/

  // inject new brushes
  if (lineTrim === "{script:main.0}") {
    writeLn(newBrushSet);
    writeLn("");
  }

  // inject new palette
  if (lineTrim === "{script:options.0}") {
    writeLn(newColorPalette);
  }

  writeLn(line);
}

ws.end();
