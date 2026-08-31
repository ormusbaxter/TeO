import assert from "node:assert/strict";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

// TeO liegt auf einem Netzlaufwerk, mehrere Arbeitsplätze greifen darauf zu.
// Der Datenbestand reist als teo-autosicherung.json zwischen ihnen. Damit ein
// Konto und ein einmal vergebener Sicherungsschlüssel überall gelten, muss das
// Schlüsselverzeichnis in der äußeren, unverschlüsselten Hülle der Datei
// stehen: Alles innerhalb der Nutzlast ist erst nach dem Entsperren lesbar.

function createDataStoreStub() {
  const written = new Map();
  return {
    written,
    async setItem(key, value) {
      written.set(key, value);
      return value;
    },
    async getItem(key) {
      return written.has(key) ? written.get(key) : null;
    },
    async removeItem(key) {
      written.delete(key);
    },
  };
}

async function loadKeyDirectoryApp() {
  const app = await loadAppFunctions(
    [
      "encryptBackup",
      "decryptBackup",
      "generateAutomaticBackupRecoveryKey",
      "automaticBackupKeyFingerprint",
      "automaticBackupKeyDirectory",
      "readAutomaticBackupKeyDirectory",
      "adoptAutomaticBackupKeyDirectory",
      "unlockAutomaticBackupKeyWithPassword",
      "normalizeAutomaticBackupSettings",
      "sharedBackupFileChangedElsewhere",
      "rememberSharedBackupFileStamp",
    ],
    { withDom: true },
  );
  app.setDataStore(createDataStoreStub());
  return app;
}

// Legt einen Datenbestand an, wie ihn Arbeitsplatz A hinterlässt: ein
// gemeinsamer Zufallsschlüssel, für jedes Konto mit dessen Login-Passwort
// verpackt.
async function createSharedKeyDirectory(app, accounts) {
  const key = app.generateAutomaticBackupRecoveryKey();
  const keyEnvelopes = {};
  for (const [userId, password] of Object.entries(accounts)) {
    keyEnvelopes[userId] = await app.encryptBackup(key, password);
  }
  return {
    key,
    directory: {
      keyFingerprint: await app.automaticBackupKeyFingerprint(key),
      keyEnvelopes,
    },
  };
}

test("Das Schlüsselverzeichnis steht lesbar in der äußeren Hülle", async () => {
  const app = await loadKeyDirectoryApp();
  const { key, directory } = await createSharedKeyDirectory(app, {
    "user-1": "Passwort Eins 2026",
  });
  const content = JSON.stringify({ format: "test", data: { employees: 3 } });

  const envelope = await app.encryptBackup(content, key, directory);

  assert.equal(envelope.formatVersion, 2);
  assert.equal(envelope.keyFingerprint, directory.keyFingerprint);
  assert.ok(envelope.keyEnvelopes["user-1"]);
  // Ohne den Schlüssel bleibt die Nutzlast zu, das Verzeichnis aber lesbar.
  assert.equal(await app.decryptBackup(envelope, key), content);
});

test("Ohne Verzeichnis bleibt die Hülle in der bisherigen Fassung", async () => {
  const app = await loadKeyDirectoryApp();
  const envelope = await app.encryptBackup("{}", "Sicheres Passwort 2026");

  assert.equal(envelope.formatVersion, 1);
  assert.equal(Object.hasOwn(envelope, "keyFingerprint"), false);
  assert.equal(Object.hasOwn(envelope, "keyEnvelopes"), false);
});

test("Beschädigte Verzeichnisangaben werden nicht übernommen", async () => {
  const app = await loadKeyDirectoryApp();

  assert.equal(app.readAutomaticBackupKeyDirectory({}), null);
  assert.equal(
    app.readAutomaticBackupKeyDirectory({ keyEnvelopes: { "user-1": {} } }),
    null,
  );
  const partial = app.readAutomaticBackupKeyDirectory({
    keyFingerprint: "fingerabdruck",
    keyEnvelopes: { "user-1": { salt: "salt" } },
  });
  assert.equal(partial.keyFingerprint, "fingerabdruck");
  assert.deepEqual(Object.keys(partial.keyEnvelopes).join(","), "");
});

test("Das Login-Passwort öffnet den Schlüssel auch ohne eigene Hülle", async () => {
  const app = await loadKeyDirectoryApp();
  const { key, directory } = await createSharedKeyDirectory(app, {
    "user-1": "Passwort Eins 2026",
    "user-2": "Passwort Zwei 2026",
  });
  app.setAutomaticBackupSettings(
    app.normalizeAutomaticBackupSettings({ encrypted: true, ...directory }),
  );

  // Der neue Arbeitsplatz kennt die eigene Konto-ID noch nicht: Sie steht im
  // verschlüsselten Teil der Datei. Gesucht wird deshalb über alle Hüllen.
  assert.equal(await app.unlockAutomaticBackupKeyWithPassword("Passwort Zwei 2026"), key);
  assert.equal(
    await app.unlockAutomaticBackupKeyWithPassword("Passwort Eins 2026", "user-2"),
    key,
  );
  assert.equal(
    await app.unlockAutomaticBackupKeyWithPassword("Falsches Passwort 2026"),
    "",
  );
});

test("Die gemeinsame Datei bestimmt den geltenden Schlüssel", async () => {
  const app = await loadKeyDirectoryApp();
  const eigen = await createSharedKeyDirectory(app, { "user-1": "Passwort Eins 2026" });
  const fremd = await createSharedKeyDirectory(app, { "user-9": "Passwort Neun 2026" });
  app.setAutomaticBackupSettings(
    app.normalizeAutomaticBackupSettings({ encrypted: true, ...eigen.directory }),
  );
  app.setAutomaticBackupPassword(eigen.key);

  await app.adoptAutomaticBackupKeyDirectory(fremd.directory);

  const settings = app.getAutomaticBackupSettings();
  assert.equal(settings.keyFingerprint, fremd.directory.keyFingerprint);
  assert.equal(Object.keys(settings.keyEnvelopes).join(","), "user-9");
  // Der bisher gehaltene Schlüssel passt nicht mehr zu dieser Datei.
  assert.equal(app.getAutomaticBackupPassword(), "");
});

test("Bei gleichem Schlüssel werden die Hüllen vereinigt", async () => {
  const app = await loadKeyDirectoryApp();
  const { key, directory } = await createSharedKeyDirectory(app, {
    "user-1": "Passwort Eins 2026",
  });
  const weitere = await app.encryptBackup(key, "Passwort Zwei 2026");
  app.setAutomaticBackupSettings(
    app.normalizeAutomaticBackupSettings({
      encrypted: true,
      keyFingerprint: directory.keyFingerprint,
      keyEnvelopes: { "user-2": weitere },
    }),
  );
  app.setAutomaticBackupPassword(key);

  await app.adoptAutomaticBackupKeyDirectory(directory);

  const settings = app.getAutomaticBackupSettings();
  assert.equal(
    Object.keys(settings.keyEnvelopes).sort().join(","),
    "user-1,user-2",
  );
  assert.equal(app.getAutomaticBackupPassword(), key);
});

test("Ein fremder Schreibvorgang wird an Größe und Änderungszeit erkannt", async () => {
  const app = await loadKeyDirectoryApp();
  let file = { name: "teo-autosicherung.json", size: 120, lastModified: 1000 };
  app.setAutomaticBackupDirectoryHandle({
    async getFileHandle() {
      return { async getFile() { return file; } };
    },
  });

  await app.rememberSharedBackupFileStamp(file);
  assert.equal(await app.sharedBackupFileChangedElsewhere(), false);

  file = { ...file, size: 140, lastModified: 2000 };
  assert.equal(await app.sharedBackupFileChangedElsewhere(), true);

  // Ohne eigenen Stand gibt es nichts zu vergleichen: Der erste Schreibvorgang
  // dieser Sitzung darf nicht als Fremdschreibung gelten.
  app.setSharedBackupFileStamp(null);
  assert.equal(await app.sharedBackupFileChangedElsewhere(), false);
});

test("Der Startabgleich übernimmt die Konten, der Import von Hand nicht", async () => {
  const app = await loadAppFunctions(["importDatabase"], { withDom: true });
  app.setDataStore(createDataStoreStub());
  const örtlich = { id: "lokal-1", username: "lokal", role: "admin" };
  const geteilt = { id: "geteilt-1", username: "geteilt", role: "admin" };

  app.setState(createMinimalState({ users: [örtlich] }));
  app.setCurrentUser(örtlich);
  await app.importDatabase(createMinimalState({ users: [geteilt] }));
  assert.equal(
    app.getState().users.map((user) => user.id).join(","),
    "lokal-1",
  );

  app.setState(createMinimalState({ users: [örtlich] }));
  app.setCurrentUser(örtlich);
  await app.importDatabase(createMinimalState({ users: [geteilt] }), {
    adoptUsers: true,
    resumeSession: false,
  });
  assert.equal(
    app.getState().users.map((user) => user.id).join(","),
    "geteilt-1",
  );
});
