import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

async function planungMitEinemMitarbeiter() {
  const app = await loadAppFunctions(
    ["renderVacationPlanner", "handleVacationPlannerClick", "normalizeState"],
    { withDom: true },
  );
  app.setState(
    app.normalizeState(createMinimalState({ employees: [createEmployee("e1")] })),
  );
  app.setVacationPeriod(2026, 12);
  return app;
}

function pfeil(app, richtung) {
  const button = new app.HTMLElement({
    tagName: "button",
    dataset: { vacationMonthShift: String(richtung) },
  });
  return { target: button };
}

// Den gewaehlten Zeitraum merkt sich die Planung im Browserspeicher; dort
// laesst er sich ohne Bedienelemente ablesen.
function gemerkterZeitraum(app) {
  const { year, month } = JSON.parse(
    app.dom.window.localStorage.getItem("intensivteam-vacation-view-v1"),
  );
  return `${year}-${month}`;
}

test("Die erste Tabellenzelle trägt Monat, Jahr und zwei Blätterpfeile", async () => {
  const app = await planungMitEinemMitarbeiter();
  app.renderVacationPlanner();
  const html = app.dom.document.querySelector("#vacationPlanner").innerHTML;
  const kopfzelle = html.match(
    /<th class="vacation-employee-column" scope="col">([\s\S]*?)<\/th>/,
  )[1];
  assert.match(kopfzelle, /Dezember 2026/);
  assert.match(kopfzelle, /data-vacation-month-shift="-1"/);
  assert.match(kopfzelle, /data-vacation-month-shift="1"/);
});

test("Die Pfeile blättern über den Jahreswechsel", async () => {
  const app = await planungMitEinemMitarbeiter();
  await app.handleVacationPlannerClick(pfeil(app, 1));
  assert.equal(gemerkterZeitraum(app), '2027-1');
  await app.handleVacationPlannerClick(pfeil(app, -1));
  await app.handleVacationPlannerClick(pfeil(app, -1));
  assert.equal(gemerkterZeitraum(app), '2026-11');
});
