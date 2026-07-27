import assert from "node:assert/strict";
import test from "node:test";
import { validateStateShape } from "../src/shared/state-schema.mjs";
import { createEmployee, createMinimalState } from "./helpers/load-app.mjs";

test("Der gemeinsame Datenvertrag erkennt ungültige Referenzen", () => {
  const state = createMinimalState({
    version: 24,
    employees: [createEmployee()],
    completions: [
      {
        id: "completion-orphan",
        employeeId: "employee-test",
        trainingId: "training-missing",
        completedOn: "2026-01-01",
      },
    ],
  });
  const validation = validateStateShape(state, { requireAdmin: false });
  assert.equal(validation.valid, false);
  assert.match(validation.issues.join("\n"), /ungültige Referenzen/);
});

test("Ein leerer neuer Datenbestand ist für die Ersteinrichtung zulässig", () => {
  const state = createMinimalState({ version: 24 });
  const validation = validateStateShape(state, { requireAdmin: false });
  assert.equal(validation.valid, true);
});

test("Dienstwochenenden benötigen eine Leitungsfunktion und deren Vornamen", () => {
  const employee = createEmployee();
  const state = createMinimalState({
    employees: [employee],
    settings: {
      theme: "standard",
      deadlineKinds: ["training"],
      serviceWeekends: {
        weekend_a: { name: "Team A", ownerId: employee.id },
        weekend_b: { name: "Wochenende B", ownerId: "" },
      },
    },
  });
  const validation = validateStateShape(state, { requireAdmin: false });

  assert.equal(validation.valid, false);
  assert.match(validation.issues.join("\n"), /Leitungsfunktion/);
  assert.match(validation.issues.join("\n"), /Vornamen/);
});
