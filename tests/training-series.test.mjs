import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

test("Fortbildungsreihen migrieren und verwenden den neuesten Nachweis", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "latestCompletion",
    "getDeadlineItems",
    "getAnnualTrainingMatrix",
    "getEmployeeTrainingStats",
    "trainingObligations",
  ]);
  const employee = createEmployee();
  const state = app.normalizeState(
    createMinimalState({
      employees: [employee],
      trainings: [
        {
          id: "hygiene-2025",
          title: "Hygiene",
          description: "",
          year: 2025,
          recurrenceMonths: 12,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "hygiene-2026",
          title: "Hygiene",
          description: "",
          year: 2026,
          recurrenceMonths: 12,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      completions: [
        {
          id: "completion-2025",
          employeeId: employee.id,
          trainingId: "hygiene-2025",
          completedOn: "2025-06-10",
          note: "",
          createdAt: "2025-06-10T12:00:00.000Z",
        },
        {
          id: "completion-2026",
          employeeId: employee.id,
          trainingId: "hygiene-2026",
          completedOn: "2026-06-15",
          note: "",
          createdAt: "2026-06-15T12:00:00.000Z",
        },
      ],
    }),
  );
  app.setState(state);

  assert.equal(state.version, 25);
  assert.equal(state.trainings[0].seriesId, state.trainings[1].seriesId);
  assert.equal(app.trainingObligations().length, 1);
  assert.equal(
    app.latestCompletion(employee.id, "hygiene-2025").completedOn,
    "2026-06-15",
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.getEmployeeTrainingStats(employee.id))),
    { current: 1, total: 1, percent: 100 },
  );
});

test("Einführungsjahr und fünfjährige Gültigkeit wirken in Jahresmatrizen", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getAnnualTrainingMatrix",
  ]);
  const employee = createEmployee();
  const state = app.normalizeState(
    createMinimalState({
      employees: [employee],
      trainings: [
        {
          id: "violence-2025",
          title: "Gewaltprävention",
          description: "",
          year: 2025,
          recurrenceMonths: 60,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "zvk-2026",
          title: "ZVK-Schulung",
          description: "",
          year: 2026,
          recurrenceMonths: 12,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      completions: [
        {
          id: "violence-completion",
          employeeId: employee.id,
          trainingId: "violence-2025",
          completedOn: "2025-05-10",
          note: "",
          createdAt: "2025-05-10T12:00:00.000Z",
        },
      ],
    }),
  );
  app.setState(state);

  const matrix2025 = app.getAnnualTrainingMatrix(2025);
  const matrix2026 = app.getAnnualTrainingMatrix(2026);
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(matrix2025.trainings.map((training) => training.title)),
    ),
    ["Gewaltprävention"],
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(matrix2026.trainings.map((training) => training.title)),
    ),
    ["Gewaltprävention", "ZVK-Schulung"],
  );
  assert.equal(matrix2026.rows[0].statuses[0].completed, true);
  assert.equal(matrix2026.rows[0].statuses[1].completed, false);
});
