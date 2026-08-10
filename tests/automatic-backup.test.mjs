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
  assert.match(html, /id="automaticBackupRetention"/);
  assert.match(html, /id="automaticBackupEncryption"/);
  assert.match(html, /id="setAutomaticBackupPasswordButton"/);
  assert.match(html, /id="automaticBackupRecoveryDialog"/);
  assert.match(html, /id="automaticBackupRecoveryKey"/);
  assert.match(appSource, /window\.showDirectoryPicker/);
  assert.match(appSource, /AUTO_BACKUP_DIRECTORY_KEY/);
  assert.match(appSource, /AUTO_BACKUP_DELAY_MS\s*=\s*2000/);
  assert.match(
    appSource,
    /encryptBackup\(fileContent, automaticBackupPassword\)/,
  );
  assert.match(appSource, /scheduleAutomaticBackup\(\)/);
  assert.match(appSource, /unlockAutomaticBackupForLogin\(user, password\)/);
  assert.match(
    appSource,
    /registerAutomaticBackupUserKey\(currentUser\.id, password\)/,
  );
  assert.match(
    appSource,
    /registerAutomaticBackupUserKey\(newUser\.id, temporaryPassword\)/,
  );
  assert.match(
    appSource,
    /decryptBackup\(envelope, automaticBackupPassword\)/,
  );
  assert.match(styles, /\.automatic-backup-panel\s*\{/);
});

test("Die automatische Sicherung normalisiert Verschlüsselung und Aufbewahrung", async () => {
  const app = await loadAppFunctions(["normalizeAutomaticBackupSettings"]);

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.normalizeAutomaticBackupSettings({
          enabled: true,
          encrypted: true,
          keyFingerprint: "fingerprint",
          keyEnvelopes: {
            "user-1": {
              format: "intensivteam-datensicherung-verschluesselt",
              salt: "salt",
              iv: "iv",
              ciphertext: "ciphertext",
            },
          },
          retentionCount: 45,
          lastBackupAt: "2026-08-03T12:00:00.000Z",
          directoryName: " TeO-Sicherungen ",
        }),
      ),
    ),
    {
      enabled: true,
      encrypted: true,
      keyFingerprint: "fingerprint",
      keyEnvelopes: {
        "user-1": {
          format: "intensivteam-datensicherung-verschluesselt",
          salt: "salt",
          iv: "iv",
          ciphertext: "ciphertext",
        },
      },
      retentionCount: 45,
      lastBackupAt: "2026-08-03T12:00:00.000Z",
      directoryName: "TeO-Sicherungen",
    },
  );

  const fallback = app.normalizeAutomaticBackupSettings({
    retentionCount: 0,
    lastBackupAt: "ungültig",
  });
  assert.equal(fallback.encrypted, false);
  assert.equal(fallback.keyFingerprint, "");
  assert.deepEqual(JSON.parse(JSON.stringify(fallback.keyEnvelopes)), {});
  assert.equal(fallback.retentionCount, 1);
  assert.equal(fallback.lastBackupAt, "");
});

test("Automatische Sicherungen warten nach Änderungen zwei Sekunden", async () => {
  const app = await loadAppFunctions(["automaticBackupScheduleDelay"]);

  assert.equal(app.automaticBackupScheduleDelay(Date.now()), 2000);
});

test("Die Aufbewahrung löscht nur ältere TeO-Autosicherungen", async () => {
  const app = await loadAppFunctions(["automaticBackupFilesToRemove"]);
  const files = [
    "teo-autosicherung_2026-08-03_12-00-00.json",
    "teo-autosicherung_2026-08-03_11-00-00.json",
    "teo-autosicherung_2026-08-03_10-00-00.json",
    "teo-autosicherung_2026-08-03_09-00-00.verschluesselt.json",
    "teo-datensicherung_2026-08-01_10-00-00.json",
    "notizen.txt",
  ];

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(app.automaticBackupFilesToRemove(files, 2)),
    ),
    [
      "teo-autosicherung_2026-08-03_10-00-00.json",
      "teo-autosicherung_2026-08-03_09-00-00.verschluesselt.json",
    ],
  );
});

test("Automatische Sicherungsdateien kennzeichnen Verschlüsselung im Namen", async () => {
  const app = await loadAppFunctions(["automaticBackupFilename"]);
  const date = new Date("2026-08-03T12:00:00.000Z");

  assert.equal(
    app.automaticBackupFilename(date, false),
    "teo-autosicherung_2026-08-03_12-00-00.json",
  );
  assert.equal(
    app.automaticBackupFilename(date, true),
    "teo-autosicherung_2026-08-03_12-00-00.verschluesselt.json",
  );
});

test("Automatische Sicherungen verwenden das kompatible verschlüsselte Sicherungsformat", async () => {
  const app = await loadAppFunctions(["encryptBackup", "decryptBackup"]);
  const content = JSON.stringify({ format: "test", data: { employees: 3 } });
  const envelope = await app.encryptBackup(content, "Sicheres Passwort 2026");

  assert.equal(envelope.algorithm, "AES-GCM");
  assert.equal(envelope.keyDerivation, "PBKDF2-SHA-256");
  assert.notEqual(envelope.ciphertext, content);
  assert.equal(
    await app.decryptBackup(envelope, "Sicheres Passwort 2026"),
    content,
  );
  await assert.rejects(
    app.decryptBackup(envelope, "Falsches Passwort"),
    /nicht entschlüsselt/,
  );
});

test("Der Wiederherstellungsschlüssel ist zufällig und eindeutig prüfbar", async () => {
  const app = await loadAppFunctions([
    "generateAutomaticBackupRecoveryKey",
    "automaticBackupKeyFingerprint",
  ]);
  const firstKey = app.generateAutomaticBackupRecoveryKey();
  const secondKey = app.generateAutomaticBackupRecoveryKey();

  assert.notEqual(firstKey, secondKey);
  assert.ok(firstKey.length >= 43);
  assert.equal(
    await app.automaticBackupKeyFingerprint(firstKey),
    await app.automaticBackupKeyFingerprint(firstKey),
  );
  assert.notEqual(
    await app.automaticBackupKeyFingerprint(firstKey),
    await app.automaticBackupKeyFingerprint(secondKey),
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
