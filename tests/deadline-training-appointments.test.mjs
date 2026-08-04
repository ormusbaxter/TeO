import assert from "node:assert/strict";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

test("Schulungen und Geräteeinweisungen gehören im Fristenmonitor zu Fortbildungen", async () => {
  const app = await loadAppFunctions(["deadlineFilterKind"]);

  assert.equal(
    app.deadlineFilterKind({
      kind: "appointment",
      appointment: { category: "schulung" },
    }),
    "training",
  );
  assert.equal(
    app.deadlineFilterKind({
      kind: "appointment",
      appointment: { category: "geraeteeinweisung" },
    }),
    "training",
  );
});

test("Andere Termine behalten im Fristenmonitor den Terminfilter", async () => {
  const app = await loadAppFunctions(["deadlineFilterKind"]);

  for (const category of ["meeting", "pruefung", "", undefined]) {
    assert.equal(
      app.deadlineFilterKind({
        kind: "appointment",
        appointment: { category },
      }),
      "appointment",
    );
  }
  assert.equal(app.deadlineFilterKind({ kind: "training" }), "training");
});

test("Überfällige Einträge lassen sich unabhängig von der Kategorie ausblenden", async () => {
  const app = await loadAppFunctions(["filterDeadlineItems"]);
  const deadlines = [
    { kind: "training", daysUntil: -2, title: "Überfällig" },
    { kind: "training", daysUntil: 5, title: "Anstehend" },
    { kind: "qualification", daysUntil: 3, title: "Andere Kategorie" },
  ];
  const activeKinds = new Set(["training"]);

  assert.deepEqual(
    JSON.parse(JSON.stringify(app.filterDeadlineItems(deadlines, activeKinds, 30, true))),
    [deadlines[1]],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.filterDeadlineItems(deadlines, activeKinds, 30, false))),
    deadlines.slice(0, 2),
  );
});
