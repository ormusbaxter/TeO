import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Wie beim Urlaubsraster: Ein Element mit position: fixed richtet sich im
// transformierten Ansichtsbereich am Vorfahren aus statt am Fenster. Beim
// Maximieren verlässt das Widget die Ansicht deshalb - und muss beim
// Verkleinern genau dorthin zurück.
async function vermesseWidget(teo) {
  return teo.evaluate(() => {
    const widget = document.querySelector("#deviceMatrixWidget");
    const rechteck = widget.getBoundingClientRect();
    return {
      maximiert: widget.classList.contains("is-maximized"),
      amBody: widget.parentElement === document.body,
      position: getComputedStyle(widget).position,
      breite: Math.round(rechteck.width),
      hoehe: Math.round(rechteck.height),
      fensterbreite: window.innerWidth,
      fensterhoehe: window.innerHeight,
      gedrueckt: document
        .querySelector("#toggleDeviceMatrixMaximizeButton")
        .getAttribute("aria-pressed"),
      klasseAmBody: document.body.classList.contains("is-device-matrix-maximized"),
    };
  });
}

test("Die Einweisungsmatrix füllt maximiert das Fenster", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("devices");
  const vorher = await vermesseWidget(teo);
  assert.equal(vorher.maximiert, false);

  await teo.evaluate(() => {
    document.querySelector("#toggleDeviceMatrixMaximizeButton").click();
  });
  const maximiert = await vermesseWidget(teo);

  assert.equal(maximiert.maximiert, true);
  assert.equal(maximiert.position, "fixed");
  assert.equal(maximiert.amBody, true);
  assert.equal(maximiert.gedrueckt, "true", "Der Schalter meldet seinen Zustand");
  assert.equal(maximiert.klasseAmBody, true);
  assert.ok(
    maximiert.breite > maximiert.fensterbreite - 60,
    `Breite ${maximiert.breite} von ${maximiert.fensterbreite}`,
  );
  assert.ok(
    maximiert.hoehe > maximiert.fensterhoehe - 60,
    `Höhe ${maximiert.hoehe} von ${maximiert.fensterhoehe}`,
  );

  // Die Matrix selbst darf dabei nicht in ihrer alten Höhe stecken bleiben -
  // sonst wäre das Vollbild leer unterhalb.
  const scrollhoehe = await teo.evaluate(() => {
    const scroll = document.querySelector("#deviceMatrixWidget .device-matrix-scroll")
      || document.querySelector("#deviceMatrixWidget [class*='scroll']");
    return scroll ? Math.round(scroll.getBoundingClientRect().height) : null;
  });
  if (scrollhoehe !== null) {
    assert.ok(scrollhoehe > 200, `Der Rollbereich misst nur ${scrollhoehe}px`);
  }
});

test("Esc und der Ansichtswechsel holen die Matrix zurück", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("devices");
  const platzVorher = await teo.evaluate(() => {
    const widget = document.querySelector("#deviceMatrixWidget");
    return widget.parentElement.id || widget.parentElement.className;
  });

  await teo.evaluate(() => {
    document.querySelector("#toggleDeviceMatrixMaximizeButton").click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  const nachEsc = await teo.evaluate(() => {
    const widget = document.querySelector("#deviceMatrixWidget");
    return {
      maximiert: widget.classList.contains("is-maximized"),
      platz: widget.parentElement.id || widget.parentElement.className,
    };
  });
  assert.equal(nachEsc.maximiert, false);
  assert.equal(nachEsc.platz, platzVorher);

  await teo.evaluate(() => {
    document.querySelector("#toggleDeviceMatrixMaximizeButton").click();
  });
  await teo.zeigeAnsicht("dashboard");
  const nachWechsel = await teo.evaluate(() => ({
    maximiert: document
      .querySelector("#deviceMatrixWidget")
      .classList.contains("is-maximized"),
    klasseAmBody: document.body.classList.contains("is-device-matrix-maximized"),
  }));
  assert.equal(nachWechsel.maximiert, false);
  assert.equal(nachWechsel.klasseAmBody, false);
});
