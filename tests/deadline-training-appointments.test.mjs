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
