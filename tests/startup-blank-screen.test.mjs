import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// In Chrome blieb TeO nach dem Öffnen leer: Die Anmeldesperre verdeckte die
// Anwendung, aber kein Dialog erschien - nur der Hinweis auf die fehlende
// Datensicherung, den der erste Aufbau bei noch gesperrtem Bestand zeigt.
// Ohne Entwicklerwerkzeuge (in Kliniken oft gesperrt) war nicht zu sehen,
// woran es hing. Eine gesperrte Seite ohne Dialog darf es nicht geben.

async function offeneDialoge(teo) {
  return teo.evaluate(() =>
    [...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id).join(","),
  );
}

// Ein eingerichteter Bestand mit verknüpftem Ordner, wie nach dem ersten
// Arbeitstag: Der nächste Start fragt den Ordner vor der Anmeldung ab.
async function bestandMitOrdner(t) {
  const teo = await openTeO(t);
  if (!teo) return null;
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
  return teo;
}

test("Antwortet der Sicherungsordner beim Start nicht, wird die Datei gewählt", async (t) => {
  const teo = await bestandMitOrdner(t);
  if (!teo) return;
  // Die Abfrage der Ordnerfreigabe kehrt nie zurück.
  await teo.page.context().addInitScript(() => {
    window.FileSystemHandle.prototype.queryPermission = () => new Promise(() => {});
  });
  const neu = await openTeO(t, { neustart: true });
  await neu.page.waitForSelector("#startupBackupDialog[open]", { timeout: 15000 });
  assert.match(
    await neu.evaluate(() => document.querySelector("#startupBackupStatus").textContent),
    /antwortet nicht/,
  );
});

test("Ein Fehler bei gesperrter Seite zeigt sich und öffnet einen Ausweg", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true });
  if (!teo) return;
  await teo.page.waitForSelector("#startupBackupDialog[open]");
  // Nachgestellt: Der Startdialog ist zu, die Sperre steht, und ein Fehler
  // geht ins Leere.
  await teo.evaluate(() => {
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    window.setTimeout(() => {
      throw new Error("Probefehler beim Start");
    }, 0);
  });
  await teo.page.waitForSelector("#startupBackupDialog[open]", { timeout: 5000 });
  assert.match(
    await teo.evaluate(() => document.querySelector("#startupBackupStatus").textContent),
    /Probefehler beim Start/,
    "Die Fehlermeldung steht im Dialog, auch ohne Entwicklerwerkzeuge",
  );
  assert.equal(
    await teo.evaluate(() => document.body.classList.contains("is-auth-locked")),
    true,
  );
});

test("Ein Fehler bei offener Anwendung lässt sie, wie sie ist", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin", mitDemodaten: true });
  if (!teo) return;
  await teo.evaluate(() => {
    window.setTimeout(() => {
      throw new Error("Probefehler im Betrieb");
    }, 0);
  });
  await teo.page.waitForTimeout(300);
  assert.equal(await offeneDialoge(teo), "");
});
