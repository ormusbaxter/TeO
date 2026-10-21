import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Freiwillige Fortbildungen funktionieren wie Pflichtfortbildungen, zaehlen
// aber nicht zu ihnen: nicht zur Pflichtquote, zu Fristen oder zum
// Fortbildungsstand eines Mitarbeiters.

const FUNCTIONS = [
  "normalizeState",
  "todayIso",
  "trainingObligations",
  "voluntaryTrainingCatalog",
  "getEmployeeTrainingStats",
  "getAnnualTrainingMatrix",
  "getTrainingEvaluationYears",
  "getDeadlineItems",
  "isEmployeeCurrentForTraining",
];

function training(id, title, { mandatory, recurrenceMonths = 12, year = 2024 } = {}) {
  return {
    id,
    title,
    description: "",
    year,
    recurrenceMonths,
    ...(mandatory === undefined ? {} : { mandatory }),
    createdAt: `${year}-01-01T00:00:00.000Z`,
    updatedAt: `${year}-01-01T00:00:00.000Z`,
  };
}

async function appWith({ trainings, completions = [] }) {
  const app = await loadAppFunctions(FUNCTIONS);
  const state = app.normalizeState(
    createMinimalState({ employees: [createEmployee("anna")], trainings, completions }),
  );
  app.setState(state);
  return { app, state };
}

test("Bestände ohne Art kennen nur Pflichtfortbildungen", async () => {
  const { state } = await appWith({
    trainings: [training("alt", "Brandschutz"), training("frei", "Kinästhetik", { mandatory: false })],
  });
  assert.equal(state.trainings[0].mandatory, true);
  assert.equal(state.trainings[1].mandatory, false);
});

test("Freiwillige Fortbildungen zählen weder zur Pflichtquote noch zu Fristen", async () => {
  const year = Number(new Date().toISOString().slice(0, 4));
  const { app } = await appWith({
    trainings: [
      training("pflicht", "Brandschutz", { year }),
      training("frei", "Kinästhetik", { mandatory: false, year }),
    ],
    completions: [
      {
        id: "nachweis",
        employeeId: "anna",
        trainingId: "frei",
        completedOn: `${year}-01-02`,
        createdAt: `${year}-01-02T00:00:00.000Z`,
      },
    ],
  });

  assert.equal(app.trainingObligations().map(({ id }) => id).join(","), "pflicht");
  assert.equal(app.voluntaryTrainingCatalog().map(({ id }) => id).join(","), "frei");

  const stand = app.getEmployeeTrainingStats("anna");
  assert.equal(`${stand.current}/${stand.total}`, "0/1", "Nur die Pflicht zählt zum Stand");

  const pflichten = app.getAnnualTrainingMatrix(year);
  assert.equal(pflichten.trainings.map(({ id }) => id).join(","), "pflicht");
  assert.equal(pflichten.completionRate, 0, "Der freiwillige Nachweis hebt die Quote nicht");

  const freiwillig = app.getAnnualTrainingMatrix(year, false);
  assert.equal(freiwillig.trainings.map(({ id }) => id).join(","), "frei");
  assert.equal(freiwillig.completionRate, 100);

  const fristen = app.getDeadlineItems().filter((item) => item.kind === "training");
  assert.equal(fristen.map(({ trainingId }) => trainingId).join(","), "pflicht");
});

test("Gleichnamige Pflicht- und freiwillige Fortbildungen bilden getrennte Reihen", async () => {
  const { app, state } = await appWith({
    trainings: [
      training("pflicht", "Reanimation"),
      training("frei", "Reanimation", { mandatory: false }),
    ],
    completions: [
      {
        id: "nachweis",
        employeeId: "anna",
        trainingId: "frei",
        completedOn: heute(),
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ],
  });
  const [pflicht, frei] = state.trainings;
  assert.notEqual(pflicht.seriesId, frei.seriesId);
  assert.equal(app.isEmployeeCurrentForTraining("anna", frei), true);
  assert.equal(
    app.isEmployeeCurrentForTraining("anna", pflicht),
    false,
    "Der freiwillige Nachweis gilt nicht für die gleichnamige Pflicht",
  );
});

test("Die Jahresauswertung jeder Art kennt nur ihre eigenen Jahre", async () => {
  const { app } = await appWith({
    trainings: [training("pflicht", "Brandschutz", { year: 2022 })],
  });
  assert.equal(app.getTrainingEvaluationYears(false).length, 0);
  assert.ok(app.getTrainingEvaluationYears(true).includes(2022));
});

function heute() {
  return new Date().toISOString().slice(0, 10);
}
