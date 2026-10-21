import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after } from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Im lokalen Betrieb lag der ganze Datenbestand im Klartext im Browserprofil;
// wer die Anmeldung mit Bordmitteln umging, konnte alles lesen. Seit 4.69.0
// ist er mit dem Datenschluessel der gemeinsamen Datei verschluesselt.

function demoSicherung() {
  const sicherung = JSON.parse(
    fs.readFileSync(
      new URL("../demo/teo-demo-datenbank-60-ma-2025-2026.json", import.meta.url),
      "utf8",
    ),
  );
  sicherung.data.users.forEach((user) => {
    user.mustChangePassword = false;
  });
  return sicherung;
}

async function offeneDialoge(teo) {
  return teo.evaluate(() =>
    [...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id).join(","),
  );
}

// Was TeO im Browserspeicher abgelegt hat, gelesen wie ein Dritter es täte.
async function browserspeicher(teo) {
  return teo.evaluate(async () => {
    const ablage = window.localforage.createInstance({
      name: "IntensivTeam",
      storeName: "personalverwaltung",
    });
    const [klartext, verschluesselt, konfiguration] = await Promise.all([
      ablage.getItem("intensivteam-personalverwaltung-v1"),
      ablage.getItem("intensivteam-personalverwaltung-verschluesselt-v1"),
      ablage.getItem("intensivteam-auto-backup-config-v1"),
    ]);
    return {
      klartext,
      verschluesselt: verschluesselt ? JSON.stringify(verschluesselt) : "",
      format: verschluesselt?.format || "",
      huellen: Object.fromEntries(
        Object.entries(konfiguration?.keyEnvelopes || {}).map(([id, huelle]) => [
          id,
          huelle.format,
        ]),
      ),
    };
  });
}

test("Der Browserspeicher ist nur mit dem Datenschlüssel lesbar", async () => {
  const app = await loadAppFunctions([
    "encryptLocalState",
    "decryptLocalState",
    "isEncryptedLocalState",
  ]);
  const bestand = { employees: [{ firstName: "Erika", lastName: "Mustermann" }] };
  const huelle = await app.encryptLocalState(bestand, "datenschluessel-1", "fingerabdruck");

  assert.equal(app.isEncryptedLocalState(huelle), true);
  assert.equal(huelle.keyFingerprint, "fingerabdruck");
  assert.doesNotMatch(JSON.stringify(huelle), /Mustermann/);
  const geoeffnet = await app.decryptLocalState(huelle, "datenschluessel-1");
  assert.equal(geoeffnet.employees[0].lastName, "Mustermann");
  await assert.rejects(
    app.decryptLocalState(huelle, "datenschluessel-2"),
    /nicht entschlüsselt/,
  );
  assert.equal(app.isEncryptedLocalState(bestand), false);
});

test("Ohne entsperrten Schlüssel wird nichts gespeichert, schon gar nicht im Klartext", async () => {
  const app = await loadAppFunctions(["writeLocalState"]);
  const geschrieben = [];
  app.setDataStore({
    async setItem(key, value) {
      geschrieben.push(key);
      return value;
    },
    async getItem() {
      return null;
    },
    async removeItem() {},
  });
  app.setAutomaticBackupSettings({ encrypted: true, keyFingerprint: "f", keyEnvelopes: {} });
  app.setAutomaticBackupPassword("");
  await assert.rejects(app.writeLocalState({ employees: [] }), /gesperrt/);
  assert.equal(geschrieben.length, 0);

  app.setAutomaticBackupPassword("datenschluessel");
  await app.writeLocalState({ employees: [] });
  assert.equal(geschrieben.join(","), "intensivteam-personalverwaltung-verschluesselt-v1");
});

test("Die vorläufige Hülle öffnet sich mit dem Passwort des Kontos", async () => {
  const app = await loadAppFunctions([
    "createPasswordCredentials",
    "wrapKeyWithPasswordHash",
    "unwrapKeyWithPasswordHash",
  ]);
  const konto = { id: "u1", ...(await app.createPasswordCredentials("Geheim123")) };
  const huelle = await app.wrapKeyWithPasswordHash("datenschluessel", konto);

  assert.equal(huelle.format, "teo-schluesselhuelle-vorlaeufig");
  assert.equal(await app.unwrapKeyWithPasswordHash(huelle, "Geheim123"), "datenschluessel");
  await assert.rejects(app.unwrapKeyWithPasswordHash(huelle, "Falsch123"));
});

test("Die erste Anmeldung eines Administrators verschlüsselt den Bestand", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  const { page } = teo;
  const sicherung = demoSicherung();
  const waehleDatei = async () => {
    await page.waitForSelector("#startupBackupDialog[open]");
    await page.setInputFiles("#startupBackupFile", {
      name: "teo-autosicherung.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(sicherung)),
    });
    await page.waitForSelector("#loginDialog[open]");
  };
  const meldeAn = async (username, password) => {
    await page.fill("#loginUsername", username);
    await page.fill("#loginPassword", password);
    await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
    await page.waitForFunction(
      () => !document.body.classList.contains("is-auth-locked"),
      null,
      { timeout: 20000 },
    );
  };

  const vorher = await browserspeicher(teo);
  assert.ok(vorher.klartext, "Die Demodaten liegen zunächst im Klartext vor");

  await waehleDatei();
  await meldeAn("DemoAdmin", "DemoStart2026!");
  assert.equal(await offeneDialoge(teo), "automaticBackupRecoveryDialog");
  assert.equal(
    await teo.evaluate(
      () => document.querySelector("#automaticBackupRecoveryIntroduction").hidden,
    ),
    false,
    "Der Dialog erklärt die Umstellung",
  );
  await page.click("#automaticBackupRecoveryDialog .modal-footer [data-close-dialog]");
  // Danach folgt das Blatt des Notfallzugangs.
  await page.waitForSelector("#emergencySheetDialog[open]");
  await page.check("#emergencySheetConfirmed");
  await page.click("#closeEmergencySheet");
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));

  const nachher = await browserspeicher(teo);
  assert.equal(nachher.klartext, null, "Der Klartext ist gelöscht");
  assert.equal(nachher.format, "teo-browserspeicher-verschluesselt");
  const name = sicherung.data.employees[0].lastName;
  assert.equal(nachher.verschluesselt.includes(name), false, "Kein Mitarbeitername lesbar");
  const admin = sicherung.data.users.find((user) => user.username === "DemoAdmin");
  const user = sicherung.data.users.find((konto) => konto.username === "DemoUser1");
  assert.equal(nachher.huellen[admin.id], "intensivteam-datensicherung-verschluesselt");
  assert.equal(
    nachher.huellen[user.id],
    "teo-schluesselhuelle-vorlaeufig",
    "Konten, die nicht angemeldet waren, bekommen eine vorläufige Hülle",
  );

  // Abmelden räumt den Bestand aus dem Arbeitsspeicher.
  await teo.evaluate(() => document.querySelector("[data-logout]").click());
  await page.waitForSelector("#loginDialog[open]");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#navEmployeeCount").textContent.trim()),
    "0",
  );

  // Ein normales Konto kommt mit seinem Passwort herein, ohne
  // Wiederherstellungsschlüssel, und bekommt seine reguläre Hülle.
  // Ohne verknüpften Ordner verlangt die Anmeldung die Datei erneut und geht
  // nach der Auswahl von selbst weiter.
  await page.fill("#loginUsername", "DemoUser1");
  await page.fill("#loginPassword", "DemoUser2026!");
  await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await page.waitForSelector("#startupBackupDialog[open]");
  await page.setInputFiles("#startupBackupFile", {
    name: "teo-autosicherung.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sicherung)),
  });
  await page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 20000 },
  );
  assert.equal(await offeneDialoge(teo), "");
  assert.equal(await teo.evaluate(() => document.body.dataset.userRole), "user");
  assert.equal((await browserspeicher(teo)).huellen[user.id], "intensivteam-datensicherung-verschluesselt");
  assert.deepEqual(teo.problems, []);
});

test("Nach dem Neustart steht der verschlüsselte Bestand nicht offen", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "admin" });
  if (!teo) return;
  const neu = await openTeO(t, { neustart: true });
  await neu.page.waitForSelector("dialog[open]");
  // Konten gibt es - nur lesbar sind sie erst nach der Anmeldung. Die
  // Ersteinrichtung bietet TeO deshalb nicht an.
  assert.notEqual(await offeneDialoge(neu), "dataOriginDialog");
  assert.equal(
    await neu.evaluate(() => document.querySelector("#navEmployeeCount").textContent.trim()),
    "0",
  );
  assert.deepEqual(neu.problems, []);
});
