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
  assert.match(html, /id="settingsMaxBackupFileSizeMb"/);
  assert.match(html, /Ab 90(?:&nbsp;|\s)*%/);
  assert.match(html, /id="backupVolumeMeter"/);
  assert.match(html, /id="backupVolumeLabel">0 von 20 MB/);
  assert.match(html, /id="backupVolumeBar"/);
  assert.match(
    html,
    /id="startupBackupDialog"[^>]*[\s\S]*?data-persistent-dialog/,
  );
  assert.match(html, /id="startupBackupFile"/);
  assert.match(html, /teo-autosicherung\.json auswählen/);
  assert.match(html, /id="selectStartupBackupDirectoryButton"/);
  assert.match(html, /id="dataOriginDialog"/);
  assert.match(html, /id="openSharedDataSetButton"/);
  assert.match(html, /id="createDataSetButton"/);
  assert.match(appSource, /window\.showDirectoryPicker/);
  assert.match(appSource, /AUTO_BACKUP_DIRECTORY_KEY/);
  assert.match(appSource, /AUTO_BACKUP_DELAY_MS\s*=\s*2000/);
  assert.match(
    appSource,
    /AUTO_BACKUP_FILENAME\s*=\s*"teo-autosicherung\.json"/,
  );
  // Die automatische Sicherung schreibt das Schlüsselverzeichnis mit: Ohne es
  // erzeugt jeder weitere Arbeitsplatz einen eigenen Schlüssel.
  assert.match(
    appSource,
    /encryptBackup\(\s*fileContent,\s*automaticBackupPassword,\s*automaticBackupKeyDirectory\(\),\s*\)/,
  );
  assert.match(appSource, /scheduleAutomaticBackup\(\)/);
  assert.match(
    appSource,
    /unlockAutomaticBackupForLogin\(user, password, \{\s*promptRecovery: false,\s*\}\)/,
  );
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
    /synchronizeStartupBackupFromSavedDirectory\(\{[\s\S]*requestPermission:/,
  );
  assert.match(
    appSource,
    /getFileHandle\(\s*AUTO_BACKUP_FILENAME,\s*\{ create: false \}/,
  );
  assert.match(appSource, /renderBackupVolumeMeter/);
  assert.match(appSource, /lastBackupSizeBytes\s*=\s*volume\.sizeBytes/);
  assert.match(
    appSource,
    /!isMariaDbMode\(\) && !startupBackupSynchronized/,
  );
  assert.match(styles, /\.data-origin-choice\s*\{/);
  assert.match(styles, /\.automatic-backup-panel\s*\{/);
  assert.match(styles, /\.backup-reminder-settings-form\s*\{/);
  assert.match(styles, /\.backup-volume-meter\.is-warning\s*\{/);
  assert.match(styles, /\.backup-volume-meter\.is-exceeded\s*\{/);
});

test("Das Sicherungsvolumen warnt ab 90 Prozent der einstellbaren Grenze", async () => {
  const app = await loadAppFunctions([
    "configuredBackupMaxBytes",
    "backupVolumeAssessment",
  ]);
  const settings = { maxBackupFileSizeMb: 20 };

  assert.equal(app.configuredBackupMaxBytes(settings), 20 * 1024 * 1024);
  assert.equal(
    app.configuredBackupMaxBytes({ maxBackupFileSizeMb: 2048 }),
    20 * 1024 * 1024,
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(app.backupVolumeAssessment(18 * 1024 * 1024, settings)),
    ),
    {
      sizeBytes: 18 * 1024 * 1024,
      maxBytes: 20 * 1024 * 1024,
      usagePercent: 90,
      warning: true,
      exceeded: false,
    },
  );
  assert.equal(
    app.backupVolumeAssessment(17 * 1024 * 1024, settings).warning,
    false,
  );
  assert.equal(
    app.backupVolumeAssessment(21 * 1024 * 1024, settings).exceeded,
    true,
  );
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

test("Der Startabgleich sucht zuerst still im gespeicherten Sicherungsordner", async () => {
  const app = await loadAppFunctions(["findStartupBackupFileInSavedDirectory"]);
  const backupFile = { name: "teo-autosicherung.json", size: 1234 };
  const calls = [];
  const directory = {
    async queryPermission(descriptor) {
      calls.push(["permission", descriptor.mode]);
      return "granted";
    },
    async getFileHandle(filename, options) {
      calls.push(["file", filename, options.create]);
      return { async getFile() { return backupFile; } };
    },
  };

  const result = await app.findStartupBackupFileInSavedDirectory(directory);

  assert.equal(result.status, "found");
  assert.equal(result.file, backupFile);
  assert.deepEqual(calls, [
    ["permission", "read"],
    ["file", "teo-autosicherung.json", false],
  ]);
});

test("Die Dateiauswahl bleibt Rückfall bei fehlender Berechtigung oder Datei", async () => {
  const app = await loadAppFunctions(["findStartupBackupFileInSavedDirectory"]);
  const denied = await app.findStartupBackupFileInSavedDirectory({
    async queryPermission() { return "prompt"; },
    async getFileHandle() { throw new Error("darf nicht aufgerufen werden"); },
  });
  const missing = await app.findStartupBackupFileInSavedDirectory({
    async queryPermission() { return "granted"; },
    async getFileHandle() {
      const error = new Error("nicht gefunden");
      error.name = "NotFoundError";
      throw error;
    },
  });

  assert.equal(denied.status, "permission-required");
  assert.equal(missing.status, "file-missing");
});

test("Der Anmeldeklick kann einen gespeicherten Ordnerzugriff erneut bestätigen", async () => {
  const app = await loadAppFunctions(["findStartupBackupFileInSavedDirectory"]);
  const permissions = [];
  const directory = {
    async queryPermission() { return "prompt"; },
    async requestPermission(descriptor) {
      permissions.push(descriptor.mode);
      return "granted";
    },
    async getFileHandle() {
      return {
        async getFile() {
          return { name: "teo-autosicherung.json", size: 42 };
        },
      };
    },
  };

  const result = await app.findStartupBackupFileInSavedDirectory(directory, true);

  assert.equal(result.status, "found");
  assert.deepEqual(permissions, ["read"]);
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
          lastBackupSizeBytes: 123456,
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
      lastBackupSizeBytes: 123456,
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
