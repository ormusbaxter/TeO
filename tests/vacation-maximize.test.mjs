import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Die Zusage ist: Das Widget füllt wirklich das Fenster. Der Ansichtsbereich
// trägt eine Transformation, und ein Element mit position: fixed richtet sich
// darin nicht mehr am Fenster aus, sondern am transformierten Vorfahren -
// deshalb verlässt es beim Maximieren den Ansichtsbereich. Genau das lässt
// sich nur messen, nicht abschreiben.
async function vermesseWidget(teo) {
  return teo.evaluate(() => {
    const widget = document.querySelector("#vacationPlannerWidget");
    const rechteck = widget.getBoundingClientRect();
    return {
      maximiert: widget.classList.contains("is-maximized"),
      amBody: widget.parentElement === document.body,
      position: getComputedStyle(widget).position,
      breite: Math.round(rechteck.width),
      hoehe: Math.round(rechteck.height),
      fensterbreite: window.innerWidth,
      fensterhoehe: window.innerHeight,
      aria: document
        .querySelector("#toggleVacationPlannerMaximizeButton")
        .getAttribute("aria-controls"),
      klasseAmBody: document.body.classList.contains("is-vacation-planner-maximized"),
    };
  });
}

test("Die Urlaubsplanung füllt maximiert das Fenster", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("vacations");
  const vorher = await vermesseWidget(teo);
  assert.equal(vorher.maximiert, false);
  assert.equal(vorher.aria, "vacationPlanner", "Der Schalter benennt, was er steuert");

  await teo.evaluate(() => {
    document.querySelector("#toggleVacationPlannerMaximizeButton").click();
  });
  const maximiert = await vermesseWidget(teo);

  assert.equal(maximiert.maximiert, true);
  assert.equal(maximiert.position, "fixed");
  assert.equal(
    maximiert.amBody,
    true,
    "Im transformierten Ansichtsbereich ginge fixed am Fenster vorbei",
  );
  assert.equal(maximiert.klasseAmBody, true);
  // Fensterfüllend heißt: nur der schmale Rand bleibt.
  assert.ok(
    maximiert.breite > maximiert.fensterbreite - 60,
    `Breite ${maximiert.breite} von ${maximiert.fensterbreite}`,
  );
  assert.ok(
    maximiert.hoehe > maximiert.fensterhoehe - 60,
    `Höhe ${maximiert.hoehe} von ${maximiert.fensterhoehe}`,
  );
});

test("Esc und der Ansichtswechsel holen das Widget zurück", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("vacations");
  const platzVorher = await teo.evaluate(() => {
    const widget = document.querySelector("#vacationPlannerWidget");
    return widget.parentElement.id || widget.parentElement.className;
  });

  await teo.evaluate(() => {
    document.querySelector("#toggleVacationPlannerMaximizeButton").click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });

  const nachEsc = await teo.evaluate(() => {
    const widget = document.querySelector("#vacationPlannerWidget");
    return {
      maximiert: widget.classList.contains("is-maximized"),
      platz: widget.parentElement.id || widget.parentElement.className,
    };
  });
  assert.equal(nachEsc.maximiert, false, "Esc verlässt das Vollbild");
  assert.equal(
    nachEsc.platz,
    platzVorher,
    "Das Widget steht wieder an seiner Stelle in der Ansicht",
  );

  // Und ein Ansichtswechsel lässt es nicht als fixiertes Fenster stehen.
  await teo.evaluate(() => {
    document.querySelector("#toggleVacationPlannerMaximizeButton").click();
  });
  await teo.zeigeAnsicht("dashboard");
  const nachWechsel = await teo.evaluate(() => ({
    maximiert: document
      .querySelector("#vacationPlannerWidget")
      .classList.contains("is-maximized"),
    klasseAmBody: document.body.classList.contains("is-vacation-planner-maximized"),
  }));
  assert.equal(nachWechsel.maximiert, false);
  assert.equal(nachWechsel.klasseAmBody, false);
});
