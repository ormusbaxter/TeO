import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function appointment(id, date, title = "Visite") {
  return {
    id,
    title,
    date,
    time: "",
    location: "",
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function loadCalendarApp() {
  const app = await loadAppFunctions(
    [
      "beginAppointmentDrag",
      "moveAppointmentDrag",
      "finishAppointmentDrag",
      "moveAppointmentToDate",
      "hasUndoableMutation",
    ],
    { withDom: true },
  );
  app.setDataStore({
    async setItem(_key, value) {
      return value;
    },
    async getItem() {
      return null;
    },
  });
  app.setState(
    createMinimalState({ appointments: [appointment("a1", "2026-03-02")] }),
  );

  // Das Monatsraster, so weit das Ziehen es anfasst: die Karte des Termins
  // und zwei Tage, über denen der Zeiger landen kann.
  const karte = new app.HTMLElement({ dataset: { appointmentCard: "a1" } });
  const tage = new Map(
    ["2026-03-02", "2026-03-09"].map((date) => [
      date,
      new app.HTMLElement({ dataset: { calendarDay: date } }),
    ]),
  );
  // Der Zeiger liegt über dem Tag, dessen x-Wert genannt wird.
  app.dom.setElementFromPoint((x) => (x >= 200 ? tage.get("2026-03-09") : tage.get("2026-03-02")));
  return { app, karte, tage };
}

const zeiger = (x, y) => ({ button: 0, clientX: x, clientY: y });

test("Ein Termin lässt sich im Monatsraster auf einen anderen Tag ziehen", async () => {
  const { app, karte, tage } = await loadCalendarApp();

  app.beginAppointmentDrag({ ...zeiger(100, 100), target: karte });
  app.moveAppointmentDrag(zeiger(220, 100));
  assert.equal(
    tage.get("2026-03-09").classList.contains("is-drop-target"),
    true,
    "Der Zieltag hebt sich während des Ziehens ab",
  );
  await app.finishAppointmentDrag();

  assert.equal(app.getState().appointments[0].date, "2026-03-09");
  assert.equal(
    app.hasUndoableMutation(),
    true,
    "Das Verschieben ist ein Schritt, der sich zurücknehmen lässt",
  );

  // Die Markierung muss auch sichtbar sein - die Klasse allein hilft nicht.
  const styles = await fs.readFile(path.join(projectRoot, "styles.css"), "utf8");
  assert.match(
    styles,
    /\.appointment-calendar-day\.is-drop-target \{[\s\S]*?outline: 2px dashed/,
  );
});

test("Unterhalb der Schwelle bleibt es ein Klick", async () => {
  const { app, karte } = await loadCalendarApp();

  app.beginAppointmentDrag({ ...zeiger(100, 100), target: karte });
  // Fünf Bildpunkte - darunter gilt der Druck weiter als Klick, und ein Klick
  // führt in die Schnellansicht, statt den Termin zu verschieben.
  app.moveAppointmentDrag(zeiger(105, 103));
  await app.finishAppointmentDrag();

  assert.equal(app.getState().appointments[0].date, "2026-03-02");
  assert.equal(app.hasUndoableMutation(), false);
});

test("Auf denselben Tag gezogen geschieht nichts", async () => {
  const { app, karte, tage } = await loadCalendarApp();

  app.beginAppointmentDrag({ ...zeiger(100, 100), target: karte });
  app.moveAppointmentDrag(zeiger(140, 100));
  assert.equal(
    tage.get("2026-03-02").classList.contains("is-drop-target"),
    false,
    "Der Ausgangstag ist kein Ziel",
  );
  await app.finishAppointmentDrag();

  assert.equal(app.getState().appointments[0].date, "2026-03-02");
  assert.equal(app.hasUndoableMutation(), false);
});

test("Ein Druck neben eine Terminkarte beginnt kein Ziehen", async () => {
  const { app } = await loadCalendarApp();
  const leerflaeche = new app.HTMLElement({});

  app.beginAppointmentDrag({ ...zeiger(100, 100), target: leerflaeche });
  app.moveAppointmentDrag(zeiger(220, 100));
  await app.finishAppointmentDrag();

  assert.equal(app.getState().appointments[0].date, "2026-03-02");
});

test("Das Verschieben trägt Datum und Zeitstempel nach", async () => {
  const { app } = await loadCalendarApp();
  const vorher = app.getState().appointments[0].updatedAt;

  await app.moveAppointmentToDate("a1", "2026-04-01");
  assert.equal(app.getState().appointments[0].date, "2026-04-01");
  assert.notEqual(app.getState().appointments[0].updatedAt, vorher);

  // Ein unbekannter Termin lässt den Bestand unberührt.
  await app.moveAppointmentToDate("gibtesnicht", "2026-05-01");
  assert.equal(app.getState().appointments.length, 1);
});

test("Beide Raster warten dieselbe Schwelle ab", async () => {
  // Für das Urlaubsraster bleibt die Prüfung am Quelltext: Es zieht über
  // Zellen, die erst beim Aufbau der Ansicht entstehen, und dieser Aufbau
  // gehört zur Urlaubsplanung, nicht zum Ziehen.
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  assert.match(appSource, /const DRAG_THRESHOLD = 6;/);
  assert.match(
    appSource,
    /function movePlannerDrag\(event\) \{[\s\S]*?Math\.abs\(event\.clientX - \w+\.x\) < DRAG_THRESHOLD/,
  );
  // Ausgangspunkt und aktuelles Feld sind dieselben Größen, die auch
  // Umschalt + Pfeiltaste verwendet - und angewendet wird über denselben Weg.
  assert.match(
    appSource,
    /vacationSelectionAnchor = plannerDrag\.start;\s*vacationFocus = position;\s*applyVacationSelectionHighlight\(\);/,
  );
  assert.match(
    appSource,
    /await applyVacationEntryToSelection\(vacationEntryType \|\| "vacation"\);/,
  );

  // Nach dem Ziehen darf der abschließende Klick nicht auch noch wirken.
  assert.match(
    appSource,
    /function suppressNextClick\(element\) \{[\s\S]*?capture: true, once: true/,
  );
  assert.match(appSource, /suppressNextClick\(elements\.vacationPlanner\);/);
});
