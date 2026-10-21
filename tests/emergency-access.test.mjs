import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Der Notfallzugang: ein Administratorkonto, dessen Passwort TeO je
// Installation zufällig erzeugt und einmal auf dem Notfallblatt ausgibt. Er
// öffnet den verschlüsselten Datenbestand auch dann, wenn alle anderen
// Passwörter und der Wiederherstellungsschlüssel verloren sind.

function konto(id, role, extra = {}) {
  return {
    id,
    username: id.replace(/[^A-Za-z0-9]/g, ""),
    role,
    passwordSalt: "c2FsdA==",
    passwordHash: "aGFzaA==",
    mustChangePassword: false,
    passwordHint: "Hinweis",
    ...extra,
  };
}

test("Das Notfallpasswort ist zufällig, lang und ohne Verwechsler", async () => {
  const app = await loadAppFunctions(["createEmergencyPassword"]);
  const passwoerter = new Set();
  for (let index = 0; index < 50; index += 1) {
    const passwort = app.createEmergencyPassword();
    assert.match(passwort, /^([A-HJ-NP-Z2-9]{4}-){5}[A-HJ-NP-Z2-9]{4}$/);
    passwoerter.add(passwort);
  }
  assert.equal(passwoerter.size, 50, "Kein Passwort wiederholt sich");
});

test("Nur das Notfallkonto trägt die Felder des Notfallzugangs", async () => {
  const app = await loadAppFunctions(["normalizeUser"]);
  const notfall = app.normalizeUser(
    konto("user-notfall", "admin", {
      emergency: true,
      emergencyIssuedAt: "2026-10-21T10:00:00.000Z",
      emergencySheetConfirmed: true,
      emergencyLastUsedAt: "kein Datum",
    }),
  );
  assert.equal(notfall.emergency, true);
  assert.equal(notfall.emergencyIssuedAt, "2026-10-21T10:00:00.000Z");
  assert.equal(notfall.emergencySheetConfirmed, true);
  assert.equal(notfall.emergencyLastUsedAt, "");
  assert.equal(notfall.emergencyUseAcknowledged, true);

  const gewoehnlich = app.normalizeUser(konto("user-1", "admin"));
  assert.equal(Object.hasOwn(gewoehnlich, "emergency"), false);
  // Ein normales Konto wird durch das Kennzeichen kein Notfallzugang.
  const benutzer = app.normalizeUser(konto("user-2", "user", { emergency: true }));
  assert.equal(Object.hasOwn(benutzer, "emergency"), false);
});

test("Der Notfallzugang ist nicht löschbar und zählt nicht als Administrator", async () => {
  const app = await loadAppFunctions(["userDeletionBlocker"]);
  const admin = konto("user-admin", "admin");
  const zweiter = konto("user-zweiter", "admin");
  const notfall = konto("user-notfall", "admin", { emergency: true });
  app.setState(createMinimalState({ users: [admin, zweiter, notfall] }));
  app.setCurrentUser(admin);
  assert.match(app.userDeletionBlocker(notfall), /Notfallzugang/);
  assert.equal(app.userDeletionBlocker(zweiter), "");

  // Bleibt neben ihm nur ein echter Administrator, ist der nicht löschbar.
  app.setState(createMinimalState({ users: [admin, notfall] }));
  app.setCurrentUser(notfall);
  assert.match(app.userDeletionBlocker(admin), /letzte Administrator/);
});

test("Eine in der Datei erneuerte Hülle ersetzt die gehaltene", async () => {
  const app = await loadAppFunctions([
    "encryptBackup",
    "generateAutomaticBackupRecoveryKey",
    "automaticBackupKeyFingerprint",
    "adoptAutomaticBackupKeyDirectory",
    "unlockAutomaticBackupKeyWithPassword",
    "normalizeAutomaticBackupSettings",
  ]);
  app.setDataStore({
    async setItem() {},
    async getItem() {
      return null;
    },
    async removeItem() {},
  });
  const key = app.generateAutomaticBackupRecoveryKey();
  const keyFingerprint = await app.automaticBackupKeyFingerprint(key);
  const alt = await app.encryptBackup(key, "ALTE-NOTF-ALLB-LATT");
  const neu = await app.encryptBackup(key, "NEUE-NOTF-ALLB-LATT");
  app.setAutomaticBackupSettings(
    app.normalizeAutomaticBackupSettings({
      encrypted: true,
      keyFingerprint,
      keyEnvelopes: { "user-notfall": alt },
    }),
  );

  // An einem anderen Arbeitsplatz entstand ein neues Notfallblatt.
  await app.adoptAutomaticBackupKeyDirectory({
    keyFingerprint,
    keyEnvelopes: { "user-notfall": neu },
  });

  assert.equal(await app.unlockAutomaticBackupKeyWithPassword("NEUE-NOTF-ALLB-LATT"), key);
  assert.equal(
    await app.unlockAutomaticBackupKeyWithPassword("ALTE-NOTF-ALLB-LATT"),
    "",
    "Das alte Blatt öffnet hier nichts mehr",
  );
});

// --- Im Browser ---------------------------------------------------------

async function offeneDialoge(teo) {
  return teo.evaluate(() =>
    [...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id).join(","),
  );
}

// Während TeO schreibt, ist die Datei kurz nicht lesbar - dann erneut.
async function leseGemeinsameDatei(teo) {
  for (let versuch = 0; ; versuch += 1) {
    try {
      return await teo.evaluate(async () => {
        const wurzel = await navigator.storage.getDirectory();
        const ordner = await wurzel.getDirectoryHandle("gemeinsam");
        const handle = await ordner.getFileHandle("teo-autosicherung.json");
        return (await handle.getFile()).text();
      });
    } catch (error) {
      if (versuch >= 10 || !/NotReadable/.test(error.message)) throw error;
      await teo.page.waitForTimeout(100);
    }
  }
}

// Ersteinrichtung mit Ordner im privaten Dateisystem des Browsers. Rückgabe:
// Wiederherstellungsschlüssel, Notfallpasswort und die gemeinsame Datei.
async function richteEinMitNotfallblatt(teo) {
  const { page } = teo;
  await page.waitForSelector("#dataOriginDialog[open]");
  await page.click("#createDataSetButton");
  await page.fill("#setupUsername", "leitung1");
  await page.fill("#setupPassword", "Geheim123");
  await page.fill("#setupPasswordConfirmation", "Geheim123");
  await page.fill("#setupPasswordHint", "Wie immer");
  await page.evaluate(() => document.querySelector("#setupForm").requestSubmit());
  await page.waitForSelector("#firstSharedFolderDialog[open]");
  await teo.evaluate(async () => {
    const wurzel = await navigator.storage.getDirectory();
    const handle = await wurzel.getDirectoryHandle("gemeinsam", { create: true });
    window.showDirectoryPicker = async () => handle;
  });
  await page.click("#selectFirstSharedFolderButton");
  await page.waitForSelector("#automaticBackupRecoveryDialog[open]", { timeout: 15000 });
  const wiederherstellungsschluessel = await teo.evaluate(
    () => document.querySelector("#automaticBackupRecoveryKey").value,
  );
  await page.click("#automaticBackupRecoveryDialog .modal-footer [data-close-dialog]");

  await page.waitForSelector("#emergencySheetDialog[open]", { timeout: 15000 });
  const benutzername = await teo.evaluate(
    () => document.querySelector("#emergencySheetUsername").textContent,
  );
  const passwort = await teo.evaluate(
    () => document.querySelector("#emergencySheetPassword").textContent,
  );
  assert.equal(benutzername, "Notfall");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#closeEmergencySheet").disabled),
    true,
    "Schließen erst nach der Bestätigung",
  );
  assert.match(
    await teo.evaluate(() => document.querySelector("#emergencySheetPrintSurface").textContent),
    new RegExp(passwort),
    "Das Druckblatt trägt das Passwort",
  );
  await page.check("#emergencySheetConfirmed");
  await page.click("#closeEmergencySheet");
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));

  // Die Hülle des Notfallzugangs reist mit der nächsten Sicherung in die Datei.
  // Gewartet wird, bis sie dort steht und die Datei sich nicht mehr ändert -
  // auch die Bestätigung des Blatts gehört hinein.
  let datei = "";
  let unveraendert = 0;
  for (let versuch = 0; versuch < 60 && unveraendert < 8; versuch += 1) {
    await teo.page.waitForTimeout(500);
    const text = await leseGemeinsameDatei(teo);
    const huellen = Object.keys(JSON.parse(text).keyEnvelopes || {}).length;
    unveraendert = huellen === 2 && text === datei ? unveraendert + 1 : 0;
    datei = text;
  }
  assert.equal(unveraendert, 8, "Die Datei trägt beide Hüllen");
  return { wiederherstellungsschluessel, passwort, datei };
}

// Ein anderer Arbeitsplatz: leerer Browser, nur die gemeinsame Datei.
async function oeffneAnderswo(t, datei) {
  const teo = await openTeO(t);
  await teo.evaluate(async (text) => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("gemeinsam", { create: true });
    const handle = await ordner.getFileHandle("teo-autosicherung.json", { create: true });
    const schreiber = await handle.createWritable();
    await schreiber.write(text);
    await schreiber.close();
    window.showDirectoryPicker = async () => ordner;
  }, datei);
  await teo.page.waitForSelector("#dataOriginDialog[open]");
  await teo.page.click("#openSharedDataSetButton");
  await teo.page.waitForSelector("#loginDialog[open]");
  return teo;
}

test("Der Notfallzugang öffnet den Bestand an einem fremden Arbeitsplatz", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  const { passwort, datei } = await richteEinMitNotfallblatt(teo);
  assert.doesNotMatch(datei, /leitung1|Notfall/, "Die Datei verrät keine Konten");

  // Weder das Passwort von leitung1 noch der Wiederherstellungsschlüssel ist
  // bekannt - nur das Notfallblatt.
  const anderswo = await oeffneAnderswo(t, datei);
  await anderswo.page.fill("#loginUsername", "Notfall");
  await anderswo.page.fill("#loginPassword", passwort);
  await anderswo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await anderswo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 20000 },
  );
  assert.equal(await offeneDialoge(anderswo), "", "Kein Wiederherstellungsschlüssel verlangt");
  await anderswo.page.waitForFunction(
    () => !document.querySelector("#emergencyAccessNotice").hidden,
  );
  assert.match(
    await anderswo.evaluate(() => document.querySelector("#emergencyAccessNoticeTitle").textContent),
    /Angemeldet mit dem Notfallzugang/,
  );

  // Der Zugang verwaltet die Konten: leitung1 bekommt ein neues Passwort.
  await anderswo.evaluate(() => document.querySelector("#emergencyAccessUsersButton").click());
  await anderswo.page.waitForSelector("#userManagementDialog[open]");
  const knoepfe = await anderswo.evaluate(() =>
    [...document.querySelectorAll("#userManagementList [data-reset-user-password]")].length,
  );
  assert.equal(knoepfe, 1, "Zurücksetzen gibt es für leitung1, nicht für den Notfallzugang");

  // Ein neues Blatt ersetzt das alte.
  await anderswo.evaluate(() =>
    document.querySelector("#userManagementList [data-issue-emergency-sheet]").click(),
  );
  await anderswo.page.waitForSelector("#confirmDialog[open]");
  await anderswo.page.click("#confirmAccept");
  await anderswo.page.waitForSelector("#emergencySheetDialog[open]", { timeout: 15000 });
  const neuesPasswort = await anderswo.evaluate(
    () => document.querySelector("#emergencySheetPassword").textContent,
  );
  assert.notEqual(neuesPasswort, passwort);
  assert.match(
    await anderswo.evaluate(() => document.querySelector("#emergencySheetIntroduction").textContent),
    /gilt nicht mehr/,
  );
  assert.deepEqual(anderswo.problems, []);
});

test("Mit dem Wiederherstellungsschlüssel legt ein Konto ein neues Passwort fest", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  const { wiederherstellungsschluessel, datei } = await richteEinMitNotfallblatt(teo);

  const anderswo = await oeffneAnderswo(t, datei);
  await anderswo.page.fill("#loginUsername", "leitung1");
  await anderswo.page.click("#showPasswordHintButton");
  await anderswo.page.waitForSelector("#loginWithRecoveryKeyButton:not([hidden])");
  await anderswo.page.click("#loginWithRecoveryKeyButton");
  await anderswo.page.waitForSelector("#backupPasswordDialog[open]");
  await anderswo.page.fill("#backupPassword", wiederherstellungsschluessel);
  await anderswo.evaluate(() => document.querySelector("#backupPasswordForm").requestSubmit());

  // Danach verlangt TeO ein neues Passwort, wie nach einem Zurücksetzen.
  await anderswo.page.waitForSelector("#changePasswordDialog[open]", { timeout: 20000 });
  await anderswo.page.fill("#newPassword", "Neu12345");
  await anderswo.page.fill("#confirmNewPassword", "Neu12345");
  await anderswo.page.fill("#newPasswordHint", "Nach dem Notfall");
  await anderswo.evaluate(() => document.querySelector("#changePasswordForm").requestSubmit());
  await anderswo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );

  // Das neue Passwort steht mit der nächsten Sicherung in der Datei, und
  // danach entsperrt es den Bestand von selbst.
  for (let versuch = 0; versuch < 60; versuch += 1) {
    if ((await leseGemeinsameDatei(anderswo)) !== datei) break;
    await anderswo.page.waitForTimeout(250);
  }
  await anderswo.evaluate(() => document.querySelector("[data-logout]").click());
  await anderswo.page.waitForSelector("#loginDialog[open]");
  await anderswo.page.fill("#loginUsername", "leitung1");
  await anderswo.page.fill("#loginPassword", "Neu12345");
  await anderswo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await anderswo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 20000 },
  );
  assert.equal(await offeneDialoge(anderswo), "");
  assert.deepEqual(anderswo.problems, []);
});
