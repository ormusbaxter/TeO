import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Einstellungen enthalten die vollständige Bedienoberfläche für Autosicherungen", async () => {
  const [html, appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.match(html, /id="automaticBackupStatus"/);
  assert.match(html, /id="selectAutomaticBackupDirectoryButton"/);
  assert.match(html, /id="automaticBackupInterval"/);
  assert.match(html, /id="automaticBackupRetention"/);
  assert.match(appSource, /window\.showDirectoryPicker/);
  assert.match(appSource, /AUTO_BACKUP_DIRECTORY_KEY/);
  assert.match(appSource, /scheduleAutomaticBackup\(\)/);
  assert.match(styles, /\.automatic-backup-panel\s*\{/);
});

test("Die automatische Sicherung normalisiert Intervall und Aufbewahrung", async () => {
  const app = await loadAppFunctions(["normalizeAutomaticBackupSettings"]);

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.normalizeAutomaticBackupSettings({
          enabled: true,
          intervalHours: 6,
          retentionCount: 45,
          lastBackupAt: "2026-08-03T12:00:00.000Z",
          directoryName: " TeO-Sicherungen ",
        }),
      ),
    ),
    {
      enabled: true,
      intervalHours: 6,
      retentionCount: 45,
      lastBackupAt: "2026-08-03T12:00:00.000Z",
      directoryName: "TeO-Sicherungen",
    },
  );

  const fallback = app.normalizeAutomaticBackupSettings({
    intervalHours: 5,
    retentionCount: 0,
    lastBackupAt: "ungültig",
  });
  assert.equal(fallback.intervalHours, 24);
  assert.equal(fallback.retentionCount, 1);
  assert.equal(fallback.lastBackupAt, "");
});

test("Die Aufbewahrung löscht nur ältere TeO-Autosicherungen", async () => {
  const app = await loadAppFunctions(["automaticBackupFilesToRemove"]);
  const files = [
    "teo-autosicherung_2026-08-03_12-00-00.json",
    "teo-autosicherung_2026-08-03_11-00-00.json",
    "teo-autosicherung_2026-08-03_10-00-00.json",
    "teo-datensicherung_2026-08-01_10-00-00.json",
    "notizen.txt",
  ];

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(app.automaticBackupFilesToRemove(files, 2)),
    ),
    ["teo-autosicherung_2026-08-03_10-00-00.json"],
  );
});

test("Eine automatische Sicherung wird vollständig in das Verzeichnis geschrieben", async () => {
  const app = await loadAppFunctions(["writeAutomaticBackupFile"]);
  const calls = [];
  const directory = {
    async getFileHandle(filename, options) {
      calls.push(["file", filename, options.create]);
      return {
        async createWritable() {
          return {
            async write(content) {
              calls.push(["write", content]);
            },
            async close() {
              calls.push(["close"]);
            },
          };
        },
      };
    },
  };

  await app.writeAutomaticBackupFile(
    directory,
    "teo-autosicherung_2026-08-03_12-00-00.json",
    "{\"format\":\"test\"}",
  );
  assert.deepEqual(calls, [
    ["file", "teo-autosicherung_2026-08-03_12-00-00.json", true],
    ["write", "{\"format\":\"test\"}"],
    ["close"],
  ]);
});
