import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Jede Ansicht bringt den Textblock ihres Kopfes mit", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Am eingeklappten Zustand hängt der Textblock. Fehlt er einer Ansicht,
  // bliebe ihr Kopf beim Blättern in voller Höhe stehen.
  const fehlend = await teo.evaluate(() =>
    [...document.querySelectorAll(".view")]
      .filter((view) => !view.querySelector(".page-header .page-header-text"))
      .map((view) => view.id),
  );
  assert.equal(fehlend.join(", "), "", "Diesen Ansichten fehlt der Kopftext");
});

test("Der Seitenkopf klebt und klappt beim Blättern ein", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Die Mitarbeiterliste ist lang genug zum Blättern; ohne Datenbestand wird
  // die Seite dafür künstlich verlängert.
  await teo.zeigeAnsicht("employees");
  const ruhend = await teo.evaluate(() => {
    const kopf = document.querySelector("#employeesView .page-header");
    const platzhalter = document.createElement("div");
    platzhalter.id = "teoBlaetterplatz";
    platzhalter.style.height = "2400px";
    document.querySelector("#employeesView").append(platzhalter);
    return {
      position: getComputedStyle(kopf).position,
      eingeklappt: kopf.classList.contains("is-stuck"),
      bereichszeile: getComputedStyle(kopf.querySelector(".eyebrow > span")).display,
      beschreibung: getComputedStyle(kopf.querySelector(".page-subtitle")).display,
      oben: Math.round(kopf.getBoundingClientRect().top),
    };
  });

  assert.equal(ruhend.position, "sticky", "Der Kopf klebt");
  assert.equal(ruhend.eingeklappt, false);
  assert.notEqual(ruhend.bereichszeile, "none");
  assert.notEqual(ruhend.beschreibung, "none");

  await teo.page.evaluate(() => window.scrollTo({ top: 900 }));
  await teo.page.waitForFunction(
    () => document.querySelector("#employeesView .page-header").classList.contains("is-stuck"),
    null,
    { timeout: 5000 },
  );

  const geblaettert = await teo.evaluate(() => {
    const kopf = document.querySelector("#employeesView .page-header");
    return {
      eingeklappt: kopf.classList.contains("is-stuck"),
      bereichszeile: getComputedStyle(kopf.querySelector(".eyebrow > span")).display,
      beschreibung: getComputedStyle(kopf.querySelector(".page-subtitle")).display,
      oben: Math.round(kopf.getBoundingClientRect().top),
      hoehe: Math.round(kopf.getBoundingClientRect().height),
    };
  });

  assert.equal(geblaettert.eingeklappt, true, "Beim Blättern klappt der Kopf ein");
  // Bereichszeile und Beschreibung treten dabei ab - das ist der Gewinn an
  // Höhe, um den es geht.
  assert.equal(geblaettert.bereichszeile, "none");
  assert.equal(geblaettert.beschreibung, "none");
  assert.ok(
    geblaettert.hoehe < 120,
    `Eingeklappt misst der Kopf noch ${geblaettert.hoehe}px`,
  );
  // Und er bleibt sichtbar, statt mit der Seite fortzulaufen.
  assert.ok(
    geblaettert.oben >= 0 && geblaettert.oben < 200,
    `Der klebende Kopf steht bei ${geblaettert.oben}px`,
  );

  // Zurück nach oben klappt er wieder auf.
  await teo.page.evaluate(() => window.scrollTo({ top: 0 }));
  await teo.page.waitForFunction(
    () => !document.querySelector("#employeesView .page-header").classList.contains("is-stuck"),
    null,
    { timeout: 5000 },
  );
  await teo.evaluate(() => document.querySelector("#teoBlaetterplatz")?.remove());
});
