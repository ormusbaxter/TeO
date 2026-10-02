import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// 2026-06-15 ist ein Montag.
const WERKTAG = "2026-06-15";

function eintrag(employeeId, type) {
  return {
    id: `v-${employeeId}`,
    employeeId,
    date: WERKTAG,
    type,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("Überschneidungen: Schule steht je Tag vorn und ist als solche gekennzeichnet", async () => {
  const app = await loadAppFunctions([
    "collectVacationConflicts",
    "renderVacationConflictRow",
    "normalizeState",
  ]);
  const state = createMinimalState({
    employees: [
      { ...createEmployee("a"), firstName: "Anna", lastName: "Adler" },
      { ...createEmployee("b"), firstName: "Ben", lastName: "Berg" },
      { ...createEmployee("z"), firstName: "Zoe", lastName: "Zander" },
    ],
    vacationDays: [eintrag("a", "vacation"), eintrag("b", "vacation"), eintrag("z", "school")],
  });
  state.settings = { ...state.settings, vacationWeekdayAbsenceLimit: 2 };
  app.setState(app.normalizeState(state));

  const [tag] = app.collectVacationConflicts(2026);
  assert.equal(tag.date, WERKTAG);
  // Alphabetisch stünde Zander zuletzt - als Schule steht sie vorn.
  assert.equal(tag.participants.map((item) => item.employee.id).join(","), "z,a,b");

  const html = app.renderVacationConflictRow(tag);
  const klassen = [...html.matchAll(/<li class="([^"]*)">/g)].map((treffer) => treffer[1].trim());
  assert.equal(klassen.join("|"), "is-school||");
  // Schule zählt weiterhin als Abwesenheit.
  assert.equal(tag.stats.absenceCount, 3);
});

test("Nach der automatischen Sicherung bleibt die offene Ansicht unangetastet", async () => {
  const app = await loadAppFunctions(["renderAfterAutomaticBackup", "renderAll", "normalizeState"], {
    withDom: true,
  });
  app.setState(app.normalizeState(createMinimalState({ employees: [createEmployee("a")] })));
  app.setActiveView("vacations");
  const planer = app.dom.document.querySelector("#vacationPlanner");
  // Ein Neuaufbau ersetzte diesen Inhalt - und mit ihm Bildlauf und Fokus.
  planer.innerHTML = "<p>unverändert</p>";
  app.renderAfterAutomaticBackup();
  assert.equal(planer.innerHTML, "<p>unverändert</p>");

  // Gegenprobe: Der frühere Weg baute die Planung neu auf.
  app.renderAll();
  assert.notEqual(planer.innerHTML, "<p>unverändert</p>");
});
