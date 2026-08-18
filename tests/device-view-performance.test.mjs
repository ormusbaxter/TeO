import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Geräteansicht baut nur auf, was sie zeigt", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Das Protokoll kommt seitenweise; alles auf einmal kostete bei einem
  // gewachsenen Bestand über eine Sekunde.
  assert.match(appSource, /const DEVICE_INSTRUCTION_LOG_PAGE = \d+;/);
  assert.match(
    appSource,
    /instructions\.slice\(0, deviceInstructionLogLimit\)/,
  );
  assert.match(appSource, /data-show-more-device-instructions/);
  assert.match(
    appSource,
    /deviceInstructionLogLimit \+= DEVICE_INSTRUCTION_LOG_PAGE;/,
  );

  // Jede Matrixzelle fragte zuvor den gesamten Bestand ab.
  assert.match(appSource, /function deviceInstructionIndex\(\)/);
  assert.match(
    appSource,
    /deviceInstructionIndex\(\)\.byPair\.get\(`\$\{device\.id\}\|\$\{employee\.id\}`\)/,
  );
  assert.doesNotMatch(
    appSource,
    /function renderDeviceMatrixCell\([^)]*\)\s*\{\s*const instructions = state\.deviceInstructions/s,
  );

  // Die Matrix wird erst ausgemessen, wenn sie ins Bild kommt.
  assert.match(
    styles,
    /#deviceInstructionMatrix\s*\{[^}]*content-visibility: auto;[^}]*contain-intrinsic-size:/s,
  );
});

test("Die Beschreibung einer Änderung vergleicht Werte statt Text", async () => {
  const appSource = await fs.readFile(
    path.join(projectRoot, "app.js"),
    "utf8",
  );

  assert.match(appSource, /function sameStoredValue\(before, after\)/);
  assert.doesNotMatch(
    appSource,
    /JSON\.stringify\(before\[key\]\) !== JSON\.stringify\(after\[key\]\)/,
  );
  // Der Vergleich legt keine Zwischenlisten an - bei Zehntausenden Objekten
  // kostete das mehr als der Vergleich selbst.
  assert.doesNotMatch(appSource, /function definedKeys\(/);
});
