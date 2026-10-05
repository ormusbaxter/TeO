import assert from "node:assert/strict";
import test, { after } from "node:test";
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
  // Der Startabgleich trägt drei Schaltflächen - früher ragte die erste links
  // aus dem Dialog.
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
  assert.equal(lage.join(","), "true,true,true");
});
