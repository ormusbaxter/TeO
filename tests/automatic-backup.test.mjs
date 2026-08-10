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
  assert.doesNotMatch(html, /id="automaticBackupRetention"/);
  assert.match(html, /id="automaticBackupEncryption"/);
  assert.match(html, /id="setAutomaticBackupPasswordButton"/);
  assert.match(html, /id="automaticBackupRecoveryDialog"/);
  assert.match(html, /id="automaticBackupRecoveryKey"/);
  assert.match(
    html,
    /id="startupBackupDialog"[^>]*[\s\S]*?data-persistent-dialog/,
  );
  assert.match(html, /id="startupBackupFile"/);
  assert.match(html, /teo-autosicherung\.json auswählen/);
  assert.match(appSource, /window\.showDirectoryPicker/);
  assert.match(appSource, /AUTO_BACKUP_DIRECTORY_KEY/);
  assert.match(appSource, /AUTO_BACKUP_DELAY_MS\s*=\s*2000/);
  assert.match(
    appSource,
    /AUTO_BACKUP_FILENAME\s*=\s*"teo-autosicherung\.json"/,
  );
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
  assert.match(appSource, /handleStartupBackupFileSelection/);
  assert.match(
    appSource,
    /!isMariaDbMode\(\) && !startupBackupSynchronized/,
  );
  assert.match(styles, /\.automatic-backup-panel\s*\{/);
});

test("Der Startabgleich weist ältere Sicherungsstände ab", async () => {
  const app = await loadAppFunctions(["startupBackupIsOlder"]);
  const stateAt = (lastBackupAt) => ({ settings: { lastBackupAt } });
  const backupSettingsAt = (lastBackupAt) => ({ lastBackupAt });

  assert.equal(
    app.startupBackupIsOlder(
      stateAt("2026-08-10T08:00:00.000Z"),
      backupSettingsAt("2026-08-10T09:00:00.000Z"),
    ),
    true,
  );
  assert.equal(
    app.startupBackupIsOlder(
      stateAt("2026-08-10T09:00:00.000Z"),
      backupSettingsAt("2026-08-10T09:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    app.startupBackupIsOlder(
      stateAt(""),
      backupSettingsAt("2026-08-10T09:00:00.000Z"),
    ),
    true,
  );
  assert.equal(app.startupBackupIsOlder(stateAt(""), backupSettingsAt("")), false);
});

test("Die automatische Sicherung normalisiert die Login-Verschlüsselung", async () => {
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
      lastBackupAt: "2026-08-03T12:00:00.000Z",
      directoryName: "TeO-Sicherungen",
    },
  );

  const fallback = app.normalizeAutomaticBackupSettings({
    lastBackupAt: "ungültig",
  });
  assert.equal(fallback.encrypted, false);
  assert.equal(fallback.keyFingerprint, "");
  assert.deepEqual(JSON.parse(JSON.stringify(fallback.keyEnvelopes)), {});
  assert.equal(fallback.lastBackupAt, "");
});

test("Automatische Sicherungen warten nach Änderungen zwei Sekunden", async () => {
  const app = await loadAppFunctions(["automaticBackupScheduleDelay"]);

  assert.equal(app.automaticBackupScheduleDelay(Date.now()), 2000);
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
    "teo-autosicherung.json",
    "{\"format\":\"test\"}",
  );
  assert.deepEqual(calls, [
    ["file", "teo-autosicherung.json", true],
    ["write", "{\"format\":\"test\"}"],
    ["close"],
  ]);
});
