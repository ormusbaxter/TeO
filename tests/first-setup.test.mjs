import assert from "node:assert/strict";
import test, { after } from "node:test";
import fs from "node:fs";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Der allererste Start: Es gibt weder Konten noch eine gemeinsame Datei. Der
// Startabgleich verlangte nach der Ersteinrichtung trotzdem
// teo-autosicherung.json - eine Datei, die erst entstehen sollte. TeO blieb
// gesperrt, auch nach Neuladen und erneuter Anmeldung.

async function offeneDialoge(teo) {
  return teo.evaluate(() =>
    [...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id).join(","),
  );
}

async function richteEin(teo) {
  const { page } = teo;
  await page.waitForSelector("#dataOriginDialog[open]");
  await page.click("#createDataSetButton");
  await page.fill("#setupUsername", "leitung1");
  await page.fill("#setupPassword", "Geheim123");
  await page.fill("#setupPasswordConfirmation", "Geheim123");
  await page.evaluate(() => document.querySelector("#setupForm").requestSubmit());
  await page.waitForSelector("#firstSharedFolderDialog[open]");
}

// Ordner im privaten Dateisystem des Browsers: ein echter Verzeichnis-Handle,
// der sich wie ein freigegebener Ordner beschreiben und speichern lässt.
async function waehleOrdner(teo, name) {
  await teo.evaluate(async (ordner) => {
    const wurzel = await navigator.storage.getDirectory();
    const handle = await wurzel.getDirectoryHandle(ordner, { create: true });
    window.showDirectoryPicker = async () => handle;
  }, name);
  await teo.page.click("#selectFirstSharedFolderButton");
}

test("Nach der Ersteinrichtung legt TeO die gemeinsame Datei an, statt sie zu verlangen", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  await richteEin(teo);

  assert.equal(
    await offeneDialoge(teo),
    "firstSharedFolderDialog",
    "Statt des Startabgleichs wird der Sicherungsordner festgelegt",
  );
  assert.equal(
    await teo.evaluate(() => document.body.classList.contains("is-auth-locked")),
    true,
  );

  // Ein Ordner, in dem schon ein Datenbestand liegt, wird nicht überschrieben.
  await teo.evaluate(async () => {
    const wurzel = await navigator.storage.getDirectory();
    const belegt = await wurzel.getDirectoryHandle("belegt", { create: true });
    const datei = await belegt.getFileHandle("teo-autosicherung.json", { create: true });
    const schreiber = await datei.createWritable();
    await schreiber.write("{}");
    await schreiber.close();
  });
  await waehleOrdner(teo, "belegt");
  await teo.page.waitForFunction(() =>
    document.querySelector("#firstSharedFolderStatus").textContent.includes("bereits"),
  );
  assert.equal(
    await teo.evaluate(async () => {
      const wurzel = await navigator.storage.getDirectory();
      const belegt = await wurzel.getDirectoryHandle("belegt");
      return (await (await belegt.getFileHandle("teo-autosicherung.json")).getFile()).text();
    }),
    "{}",
    "Die vorhandene Datei bleibt unangetastet",
  );

  // Ein leerer Ordner bekommt die erste Sicherung, danach ist TeO offen.
  await waehleOrdner(teo, "gemeinsam");
  await teo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  assert.equal(await offeneDialoge(teo), "");
  const sicherung = await teo.evaluate(async () => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("gemeinsam");
    const datei = await (await ordner.getFileHandle("teo-autosicherung.json")).getFile();
    return JSON.parse(await datei.text());
  });
  assert.equal(sicherung.data.users.map((user) => user.username).join(","), "leitung1");

  // Der nächste Start gleicht sich mit genau dieser Datei ab - ohne Auswahl.
  const neu = await openTeO(t, { neustart: true });
  await neu.page.waitForSelector("#loginDialog[open]");
  assert.match(
    await neu.evaluate(() => document.querySelector("#loginDataSource").textContent),
    /im Ordner „gemeinsam“/,
    "Die Anmeldung nennt, woher der Datenbestand kommt",
  );
  await neu.page.fill("#loginUsername", "leitung1");
  await neu.page.fill("#loginPassword", "Geheim123");
  await neu.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await neu.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  assert.equal(await offeneDialoge(neu), "", "Kein Startdialog nach der Anmeldung");
  assert.deepEqual(neu.problems, []);
});

test("Wer sich vertan hat, öffnet aus der Ordnerwahl den vorhandenen Datenbestand", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  await richteEin(teo);

  // Im Ordner liegt die gemeinsame Datei eines bestehenden Datenbestands.
  const sicherung = JSON.parse(
    fs.readFileSync(
      new URL("../demo/teo-demo-datenbank-60-ma-2025-2026.json", import.meta.url),
      "utf8",
    ),
  );
  sicherung.data.users.forEach((user) => {
    user.mustChangePassword = false;
  });
  const inhalt = JSON.stringify(sicherung);
  await teo.evaluate(async (text) => {
    const wurzel = await navigator.storage.getDirectory();
    const ordner = await wurzel.getDirectoryHandle("bestand", { create: true });
    const datei = await ordner.getFileHandle("teo-autosicherung.json", { create: true });
    const schreiber = await datei.createWritable();
    await schreiber.write(text);
    await schreiber.close();
  }, inhalt);
  await waehleOrdner(teo, "bestand");
  await teo.page.waitForSelector("#openOccupiedSharedFolderButton:not([hidden])");

  // Erst nach Rückfrage wird der eben eingerichtete Bestand verworfen.
  await teo.page.click("#openOccupiedSharedFolderButton");
  await teo.page.waitForSelector("#confirmDialog[open]");
  await teo.page.click("#confirmAccept");
  await teo.page.waitForSelector("#loginDialog[open]");

  // Das eben angelegte Konto gilt nicht mehr, das aus der Datei schon.
  await teo.page.fill("#loginUsername", "leitung1");
  await teo.page.fill("#loginPassword", "Geheim123");
  await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await teo.page.waitForFunction(() =>
    document.querySelector("#loginError").textContent.includes("nicht korrekt"),
  );
  await teo.page.fill("#loginUsername", "DemoAdmin");
  await teo.page.fill("#loginPassword", "DemoStart2026!");
  await teo.evaluate(() => document.querySelector("#loginForm").requestSubmit());
  await teo.page.waitForFunction(
    () => !document.body.classList.contains("is-auth-locked"),
    null,
    { timeout: 15000 },
  );
  assert.equal(await offeneDialoge(teo), "");
  assert.ok(
    (await teo.evaluate(() => Number(document.querySelector("#navEmployeeCount").textContent))) > 0,
    "Die Mitarbeiter der Datei sind geladen",
  );
  // Die Datei im Ordner ist die alte geblieben, bis TeO selbst sichert.
  assert.equal(
    await teo.evaluate(async () => {
      const wurzel = await navigator.storage.getDirectory();
      const ordner = await wurzel.getDirectoryHandle("bestand");
      const datei = await (await ordner.getFileHandle("teo-autosicherung.json")).getFile();
      return JSON.parse(await datei.text()).data.users.some((user) => user.username === "leitung1");
    }),
    false,
  );
});

test("Wer vor der Ordnerwahl neu lädt, landet wieder bei der Ordnerwahl", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  await richteEin(teo);

  await teo.page.reload({ waitUntil: "load" });
  await teo.page.waitForSelector("dialog[open]");
  assert.equal(await offeneDialoge(teo), "firstSharedFolderDialog");
});

test("Die Schaltflächen der Anmeldedialoge bleiben im Dialog", async (t) => {
  const teo = await openTeO(t);
  if (!teo) return;
  await teo.page.waitForSelector("#dataOriginDialog[open]");
  // Die Fußleisten tragen bis zu drei Schaltflächen - früher ragte die erste
  // links aus dem Dialog.
  const lage = await teo.evaluate(() => {
    document.querySelector("#dataOriginDialog").close();
    const dialog = document.querySelector("#startupBackupDialog");
    dialog.showModal();
    const rahmen = dialog.getBoundingClientRect();
    return [...dialog.querySelectorAll(".modal-footer button")].map((button) => {
      const feld = button.getBoundingClientRect();
      return feld.left >= rahmen.left && feld.right <= rahmen.right;
    });
  });
  assert.equal(lage.join(","), "true,true");
});
