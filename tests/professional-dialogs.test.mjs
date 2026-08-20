import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

after(closeTeO);

test("TeO fragt in eigenen Dialogen, nicht in denen des Browsers", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Eine Regel über den gesamten Programmcode: An keiner Stelle darf ein
  // Browserdialog aufgehen. Ein Verhaltenstest zeigte immer nur die eine
  // Stelle, die er gerade aufruft.
  assert.doesNotMatch(appSource, /window\.prompt|window\.open/);
});

test("Die benötigten Dialoge stehen bereit", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const fehlend = await teo.evaluate(() =>
    [
      "backupPasswordDialog",
      "backupPasswordConfirmation",
      "phoneListPreviewDialog",
      "phoneListPrintSurface",
      "notificationStack",
    ].filter((id) => !document.querySelector(`#${id}`)),
  );
  assert.equal(fehlend.join(", "), "", "Diese Dialoge fehlen");
});

test("Eine Meldung bleibt über einem offenen Dialog sichtbar", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Das ist der eigentliche Punkt: Ein modaler Dialog liegt samt Abdunklung
  // in der obersten Ebene. Eine Meldung dahinter wäre unsichtbar - und
  // ausgerechnet Meldungen erscheinen oft aus einem Dialog heraus.
  const erwartet = await teo.evaluate(async () => {
    const region = document.querySelector("#toastRegion");
    const toast = document.createElement("div");
    toast.className = "toast is-success";
    toast.id = "teoProbeToast";
    toast.innerHTML = '<span class="toast-text">Gespeichert</span>';
    region.append(toast);
    await new Promise((fertig) =>
      requestAnimationFrame(() => requestAnimationFrame(fertig)),
    );
    return getComputedStyle(toast)
      .backgroundColor.match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number);
  });

  const ohneDialog = await teo.farbeAn("#teoProbeToast");
  assert.ok(ohneDialog, "Die Meldung steht auf dem Bildschirm");
  // Zur Sicherheit: Was gemessen wird, ist wirklich die Fläche der Meldung.
  for (let kanal = 0; kanal < 3; kanal += 1) {
    assert.ok(
      Math.abs(ohneDialog[kanal] - erwartet[kanal]) <= 6,
      `Gemessen ${ohneDialog.join(",")}, erwartet ${erwartet.join(",")}`,
    );
  }

  // Jetzt derselbe Punkt mit offenem Dialog - samt der Auffrischung, die die
  // Anwendung nach jeder Meldung anstößt.
  await teo.evaluate(async () => {
    document.querySelector("#backupPasswordDialog").showModal();
    const stack = document.querySelector("#notificationStack");
    if (typeof stack.hidePopover === "function" && stack.matches(":popover-open")) {
      stack.hidePopover();
    }
    document.body.append(stack);
    if (typeof stack.showPopover === "function" && !stack.matches(":popover-open")) {
      stack.showPopover();
    }
    await new Promise((fertig) =>
      requestAnimationFrame(() => requestAnimationFrame(fertig)),
    );
  });

  const mitDialog = await teo.farbeAn("#teoProbeToast");
  const abstand = Math.max(
    ...[0, 1, 2].map((kanal) => Math.abs(mitDialog[kanal] - ohneDialog[kanal])),
  );
  assert.ok(
    abstand <= 6,
    `Die Abdunklung des Dialogs liegt über der Meldung: ${ohneDialog.join(",")} wurde zu ${mitDialog.join(",")}`,
  );

  await teo.evaluate(() => {
    document.querySelector("#backupPasswordDialog").close();
    document.querySelector("#teoProbeToast")?.remove();
  });
});

test("Die Meldungsschicht wird vor jeder Meldung neu obenauf gelegt", async () => {
  const app = await loadAppFunctions(["syncNotificationLayer"], { withDom: true });
  app.setState(createMinimalState());

  // Der Ablauf lässt sich ohne Browser nachvollziehen: Ein bereits offenes
  // Popover liegt in der obersten Ebene hinter einem später geöffneten
  // Dialog. Es muss deshalb geschlossen, ans Dokument gehängt und neu
  // geöffnet werden - in genau dieser Reihenfolge.
  const schritte = [];
  const stack = app.dom.document.querySelector("#notificationStack");
  let offen = true;
  stack.matches = (selector) => selector === ":popover-open" && offen;
  stack.hidePopover = () => {
    offen = false;
    schritte.push("schließen");
  };
  stack.showPopover = () => {
    offen = true;
    schritte.push("öffnen");
  };
  app.dom.document.body.append = () => schritte.push("ans Dokument hängen");
  // Eine sichtbare Meldung liegt vor.
  app.dom.document.querySelector("#toastRegion").childElementCount = 1;

  app.syncNotificationLayer();
  assert.equal(
    schritte.join(" → "),
    "schließen → ans Dokument hängen → öffnen",
    "Die Reihenfolge entscheidet über die Ebene",
  );

  // Ohne sichtbare Meldung wird nichts geöffnet.
  schritte.length = 0;
  app.dom.document.querySelector("#toastRegion").childElementCount = 0;
  app.dom.document.querySelector("#databaseSaveWarning").hidden = true;
  app.syncNotificationLayer();
  assert.ok(!schritte.includes("öffnen"), "Ohne Meldung bleibt die Schicht zu");
});

test("Der Druck von Telefonliste und Wochenendübersicht ist eingerichtet", async () => {
  const styles = await fs.readFile(path.join(projectRoot, "styles.css"), "utf8");

  // Druckregeln bleiben am Stylesheet: Sie wirken erst im Druckerzeugnis,
  // und weder Bildschirmmessung noch Programmaufruf machen sie sichtbar.
  assert.match(styles, /@page phone-list\s*\{[^}]*size: A4 portrait;[^}]*margin: 0;/s);
  assert.match(
    styles,
    /@page weekend-overview\s*\{[^}]*size: A4 landscape;[^}]*margin: 10mm;/s,
  );
  assert.match(
    styles,
    /body\.print-weekend-overview > #weekendOverviewDialog\s*\{[^}]*page: weekend-overview;/s,
  );
  assert.match(
    styles,
    /body\.print-phone-list > #phoneListPrintSurface\s*\{[^}]*min-height: 297mm;/s,
  );
});

test("Die Druckvorschau ist als Blatt mit Kopf und Fuß aufgebaut", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await teo.evaluate(() => {
    const dialog = document.querySelector("#phoneListPreviewDialog");
    dialog.showModal();
    const stil = getComputedStyle(dialog);
    const ergebnis = {
      zeilen: stil.gridTemplateRows.split(" ").filter(Boolean).length,
      anzeige: stil.display,
    };
    dialog.close();
    return ergebnis;
  });

  // Kopf, Blattfläche und Fußzeile: Die mittlere Zeile nimmt den Rest und
  // wird gerollt, damit ein langes Blatt den Dialog nicht sprengt.
  assert.equal(gemessen.anzeige, "grid");
  assert.equal(gemessen.zeilen, 3, "Kopf, Blatt und Fußzeile stehen untereinander");
});
