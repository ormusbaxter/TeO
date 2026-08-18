import assert from "node:assert/strict";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

function completion(id, employeeId, trainingId, completedOn) {
  return {
    id,
    employeeId,
    trainingId,
    completedOn,
    createdAt: `${completedOn}T08:00:00.000Z`,
  };
}

test("Der Nachweisindex liefert dieselben Treffer wie die frühere Suche", async () => {
  const app = await loadAppFunctions([
    "latestCompletion",
    "latestCompletionForTraining",
  ]);

  const serie2024 = {
    id: "tr-2024",
    seriesId: "hygiene",
    title: "Hygiene",
    year: 2024,
    recurrenceMonths: 12,
    requiredFor: [],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const serie2025 = { ...serie2024, id: "tr-2025", year: 2025 };
  const einmalig = {
    id: "tr-einmalig",
    seriesId: "",
    title: "Einweisung Beatmung",
    year: 2025,
    recurrenceMonths: 0,
    requiredFor: [],
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  const state = createMinimalState();
  state.trainings = [serie2024, serie2025, einmalig];
  state.completions = [
    completion("c1", "emp-1", "tr-2024", "2024-03-01"),
    completion("c2", "emp-1", "tr-2025", "2025-03-01"),
    completion("c3", "emp-1", "tr-einmalig", "2025-06-01"),
    completion("c4", "emp-2", "tr-2024", "2024-05-01"),
  ];
  app.setState(state);

  // Eine wiederkehrende Fortbildung zaehlt jeden Nachweis ihrer Reihe.
  assert.equal(app.latestCompletionForTraining("emp-1", serie2024).id, "c2");
  assert.equal(app.latestCompletionForTraining("emp-2", serie2025).id, "c4");
  // Eine einmalige nur die eigenen.
  assert.equal(app.latestCompletionForTraining("emp-1", einmalig).id, "c3");
  assert.equal(app.latestCompletionForTraining("emp-2", einmalig), undefined);
  // Stichtag: der jüngste Nachweis bis zu diesem Datum.
  assert.equal(
    app.latestCompletionForTraining("emp-1", serie2025, "2024-12-31").id,
    "c1",
  );
  assert.equal(
    app.latestCompletionForTraining("emp-1", serie2025, "2023-12-31"),
    undefined,
  );
  assert.equal(app.latestCompletion("emp-1", "tr-einmalig").id, "c3");

  // Der Index darf nicht überleben, wenn die Sammlung wächst.
  state.completions = [
    ...state.completions,
    completion("c5", "emp-1", "tr-2025", "2026-02-01"),
  ];
  app.setState(state);
  assert.equal(app.latestCompletionForTraining("emp-1", serie2025).id, "c5");

  // Auch ein Austausch der Sammlung ohne Längenänderung wird erkannt.
  state.completions = state.completions.map((entry) =>
    entry.id === "c5" ? { ...entry, completedOn: "2020-01-01" } : entry,
  );
  app.setState(state);
  assert.equal(app.latestCompletionForTraining("emp-1", serie2025).id, "c2");
});
