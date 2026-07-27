import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

test("Die synthetische Demo-Sicherung bleibt importierbar", async () => {
  const app = await loadAppFunctions(["parseBackup"]);
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const content = await fs.readFile(
    path.join(projectRoot, "demo", "teo-demo-datenbank-60-ma-2025-2026.json"),
    "utf8",
  );
  const state = app.parseBackup(content);
  assert.equal(state.version, 24);
  assert.equal(state.employees.length, 60);
  assert.equal(state.devices.length, 60);
  assert.equal(
    state.trainings.filter(
      (training) => training.recurrenceMonths && !training.seriesId,
    ).length,
    0,
  );
});
