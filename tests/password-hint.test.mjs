import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { loadAppFunctions } from "./helpers/load-app.mjs";

after(closeTeO);

// Zu jedem Konto gehört ein Passworthinweis. Er wird mit dem Passwort
// festgelegt, bei Konten aus der Zeit davor nach der Anmeldung abgefragt und
// steht an der Anmeldung hinter „Passwort vergessen?“.

function demoSicherung(anpassen = () => {}) {
  const sicherung = JSON.parse(
    fs.readFileSync(
      new URL("../demo/teo-demo-datenbank-60-ma-2025-2026.json", import.meta.url),
      "utf8",
    ),
  );
  sicherung.data.users.forEach((user) => {
    user.mustChangePassword = false;
  });
  anpassen(sicherung.data);
  return sicherung;
}

async function offeneDialoge(teo) {
  return teo.evaluate(() =>
    [...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id).join(","),
  );
}

async function waehleDatei(teo, sicherung) {
  await teo.page.waitForSelector("#startupBackupDialog[open]");
  await teo.page.setInputFiles("#startupBackupFile", {
    name: "teo-autosicherung.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sicherung)),
  });
  await teo.page.waitForSelector("#loginDialog[open]");
}

async function meldeAn(teo, username, password) {
  await teo.page.fill("#loginUsername", username);
  await teo.page.fill("#loginPassword", password);
  await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
}

async function zeigeHinweis(teo, username) {
  await teo.page.fill("#loginUsername", username);
  await teo.page.click("#showPasswordHintButton");
  await teo.page.waitForSelector("#loginPasswordHint:not([hidden])");
  return teo.evaluate(() => document.querySelector("#loginPasswordHint").textContent);
}

test("Der Hinweis ist Pflicht und darf das Passwort nicht enthalten", async () => {
  const app = await loadAppFunctions(["validatePasswordHint"]);
  assert.match(app.validatePasswordHint("   ", "Geheim123"), /Passworthinweis angeben/);
  assert.match(
    app.validatePasswordHint("Es ist geheim123!", "Geheim123"),
    /nicht enthalten/,
    "auch in anderer Schreibweise",
  );
  assert.match(app.validatePasswordHint("x".repeat(121), "Geheim123"), /höchstens 120/);
  assert.equal(app.validatePasswordHint("Name der ersten Katze", "Geheim123"), "");
});

test("Konten aus älteren Fassungen bleiben gültig, nur ohne Hinweis", async () => {
  const app = await loadAppFunctions(["normalizeUser"]);
  const konto = {
    id: "user-1",
    username: "Leitung1",
    role: "admin",
    passwordSalt: "IsuQeqq+lG55f5qseebb0w==",
    passwordHash: "+T4fSji3T70wJDJi7CfoM+8kRrah2J2TelxOq3XT0z0=",
    mustChangePassword: false,
  };
  assert.equal(app.normalizeUser(konto).passwordHint, "");
  assert.equal(
    app.normalizeUser({ ...konto, passwordHint: "  Urlaubsort 2019  " }).passwordHint,
    "Urlaubsort 2019",
  );
});

test("Die Ersteinrichtung verlangt einen Hinweis ohne das Passwort", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  const { page } = teo;
  await page.waitForSelector("#dataOriginDialog[open]");
  await page.click("#createDataSetButton");
  await page.fill("#setupUsername", "leitung1");
  await page.fill("#setupPassword", "Geheim123");
  await page.fill("#setupPasswordConfirmation", "Geheim123");
  await page.fill("#setupPasswordHint", "Geheim123");
  await teo.evaluate(() => document.querySelector("#setupForm").requestSubmit());
  await page.waitForFunction(() =>
    document.querySelector("#setupError").textContent.includes("nicht enthalten"),
  );
  assert.equal(await offeneDialoge(teo), "setupDialog");

  await page.fill("#setupPasswordHint", "Wie immer");
  await teo.evaluate(() => document.querySelector("#setupForm").requestSubmit());
  await page.waitForSelector("#firstSharedFolderDialog[open]");
  assert.deepEqual(teo.problems, []);
});

test("Ein Konto ohne Hinweis legt ihn nach der Anmeldung fest", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  const sicherung = demoSicherung((bestand) => {
    bestand.users.forEach((user) => {
      delete user.passwordHint;
    });
  });
  await waehleDatei(teo, sicherung);
  await meldeAn(teo, "DemoAdmin", "DemoStart2026!");
  await teo.page.waitForSelector("#passwordHintDialog[open]", { timeout: 15000 });
  assert.equal(
    await teo.evaluate(() => document.body.classList.contains("is-auth-locked")),
    true,
    "Bis der Hinweis steht, bleibt TeO gesperrt",
  );
  assert.equal(
    await teo.evaluate(() => document.querySelector("#passwordHintCancelButton").hidden),
    true,
    "Abbrechen gibt es nicht, nur Abmelden",
  );

  await teo.page.fill("#passwordHintValue", "DemoStart2026!");
  await teo.evaluate(() => document.querySelector("#passwordHintForm").requestSubmit());
  await teo.page.waitForFunction(() =>
    document.querySelector("#passwordHintError").textContent.includes("nicht enthalten"),
  );

  await teo.page.fill("#passwordHintValue", "Startpasswort der Demo");
  await teo.evaluate(() => document.querySelector("#passwordHintForm").requestSubmit());
  await teo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  // Erst danach verschlüsselt der Administrator den Bestand und bekommt den
  // Wiederherstellungsschlüssel zu sehen.
  assert.equal(await offeneDialoge(teo), "automaticBackupRecoveryDialog");
  await teo.page.click("#automaticBackupRecoveryDialog .modal-footer [data-close-dialog]");

  // Der Hinweis steht im verschlüsselten Bestand und ist vor der nächsten
  // Anmeldung nicht lesbar.
  await teo.evaluate(() => document.querySelector("[data-logout]").click());
  await teo.page.waitForSelector("#loginDialog[open]");
  assert.match(await zeigeHinweis(teo, "demoadmin"), /erst nach der Anmeldung lesbar/);
  assert.deepEqual(teo.problems, []);
});

test("„Passwort vergessen?“ zeigt den Hinweis, ohne Konten zu verraten", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  await waehleDatei(teo, demoSicherung());

  assert.equal(await zeigeHinweis(teo, "DemoAdmin"), "Passworthinweis: Siehe demo/README.md");
  const unbekannt = await zeigeHinweis(teo, "NiemandHier");
  assert.match(unbekannt, /kein Passworthinweis bekannt/);
  assert.match(unbekannt, /Administrator kann das Passwort zurücksetzen/);

  // Ein anderer Name blendet den alten Hinweis aus.
  await teo.page.fill("#loginUsername", "DemoUser1");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#loginPasswordHint").hidden),
    true,
  );
  assert.deepEqual(teo.problems, []);
});
