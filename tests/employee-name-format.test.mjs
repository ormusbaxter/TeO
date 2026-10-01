import assert from "node:assert/strict";
import test from "node:test";
import { createEmployee, loadAppFunctions } from "./helpers/load-app.mjs";

test("Namen erscheinen überall als Nachname, Vorname", async () => {
  const app = await loadAppFunctions(["fullName"]);
  const anna = { ...createEmployee("a"), firstName: "Anna", lastName: "Müller" };
  assert.equal(app.fullName(anna), "Müller, Anna");
  // Fehlt ein Teil, bleibt kein verwaistes Komma stehen.
  assert.equal(app.fullName({ ...anna, firstName: "" }), "Müller");
  assert.equal(app.fullName({ ...anna, lastName: "  " }), "Anna");
});

test("Die Suche findet beide Reihenfolgen", async () => {
  const app = await loadAppFunctions(["employeeSearchText", "searchKey"]);
  const text = app.searchKey(
    app.employeeSearchText({ ...createEmployee("a"), firstName: "Anna", lastName: "Müller" }),
  );
  for (const eingabe of ["Anna Müller", "Müller, Anna", "muller"]) {
    assert.ok(text.includes(app.searchKey(eingabe)), `„${eingabe}“ wird nicht gefunden`);
  }
});
