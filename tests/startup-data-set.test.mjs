import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Im lokalen Modus kommt der Datenbestand vor der Anmeldung: Angemeldet wird
// gegen die Konten der gemeinsamen Datei, nicht gegen den Stand dieses
// Browsers. Ein an einem anderen Arbeitsplatz gelöschtes Konto oder
// geändertes Passwort gilt damit sofort.

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

async function meldeAn(teo, username, password) {
  await teo.page.fill("#loginUsername", username);
  await teo.page.fill("#loginPassword", password);
  await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
}

test("Ohne erreichbare Datei wird sie vor der Anmeldung gewählt", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  await teo.page.waitForSelector("dialog[open]");
  assert.equal(
    await offeneDialoge(teo),
    "startupBackupDialog",
    "Ohne verknüpften Ordner fragt TeO zuerst nach dem Datenbestand",
  );

  // In der gemeinsamen Datei ist DemoUser1 inzwischen gelöscht - in diesem
  // Browser steht das Konto noch.
  const sicherung = demoSicherung();
  sicherung.data.users = sicherung.data.users.filter((user) => user.username !== "DemoUser1");
  await teo.page.setInputFiles("#startupBackupFile", {
    name: "teo-autosicherung.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sicherung)),
  });
  await teo.page.waitForSelector("#loginDialog[open]");
  assert.match(
    await teo.evaluate(() => document.querySelector("#loginDataSource").textContent),
    /ausgewählte teo-autosicherung\.json/,
  );

  await meldeAn(teo, "DemoUser1", "DemoUser2026!");
  await teo.page.waitForFunction(() =>
    document.querySelector("#loginError").textContent.includes("nicht korrekt"),
  );
  assert.equal(await offeneDialoge(teo), "loginDialog", "Das gelöschte Konto kommt nicht herein");

  await meldeAn(teo, "DemoAdmin", "DemoStart2026!");
  await teo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  assert.equal(await offeneDialoge(teo), "");
  assert.equal(
    await teo.evaluate(() => document.body.dataset.userRole),
    "admin",
    "Angemeldet ist das Konto aus der Datei",
  );
});

test("Fehlt die Datei erst beim Anmelden, geht die Anmeldung nach der Auswahl weiter", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  // Ein verknüpfter Ordner, aus dem die Datei inzwischen verschwunden ist.
  await teo.page.waitForSelector("#startupBackupDialog[open]");
  await teo.evaluate(async () => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("gemeinsam", { create: true });
    window.showDirectoryPicker = async () => ordner;
  });
  const sicherung = demoSicherung();
  await teo.evaluate(async (text) => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("gemeinsam");
    const datei = await ordner.getFileHandle("teo-autosicherung.json", { create: true });
    const schreiber = await datei.createWritable();
    await schreiber.write(text);
    await schreiber.close();
  }, JSON.stringify(sicherung));
  await teo.page.click("#selectStartupBackupDirectoryButton");
  await teo.page.waitForSelector("#loginDialog[open]");
  assert.match(
    await teo.evaluate(() => document.querySelector("#loginDataSource").textContent),
    /im Ordner „gemeinsam“/,
  );

  await teo.evaluate(async () => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("gemeinsam");
    await ordner.removeEntry("teo-autosicherung.json");
  });
  await meldeAn(teo, "DemoAdmin", "DemoStart2026!");
  await teo.page.waitForSelector("#startupBackupDialog[open]");
  assert.equal(await offeneDialoge(teo), "startupBackupDialog");

  await teo.page.setInputFiles("#startupBackupFile", {
    name: "teo-autosicherung.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sicherung)),
  });
  await teo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  assert.equal(await offeneDialoge(teo), "", "Die gemerkte Anmeldung ging von selbst weiter");
  assert.deepEqual(teo.problems, []);
});
