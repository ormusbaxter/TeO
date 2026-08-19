import assert from "node:assert/strict";
import test from "node:test";
import { createEmployee, createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

test("Der Suchschlüssel sieht über Schreibweise, Umlaute und ß hinweg", async () => {
  const app = await loadAppFunctions(["searchKey"]);
  const gleich = (a, b) =>
    assert.equal(
      app.searchKey(a),
      app.searchKey(b),
      `„${a}“ und „${b}“ sollten sich finden`,
    );

  // Groß- und Kleinschreibung
  gleich("Teamsitzung", "TEAMSITZUNG");
  // Umlaut, umschriebener Umlaut und nackter Vokal
  gleich("Frühstück", "Fruhstuck");
  gleich("Geräte", "Geraete");
  gleich("Röntgen", "Roentgen");
  gleich("Röntgen", "Rontgen");
  // ß, ss und s
  gleich("Straße", "Strasse");
  gleich("Straße", "Strase");
  gleich("Grüße", "Gruesse");
  // Akzente aus anderen Sprachen
  gleich("Café", "Cafe");
  // Leerraum
  gleich("  Visite   Chefarzt ", "Visite Chefarzt");

  // Was verschieden bleibt
  assert.notEqual(app.searchKey("Wartung"), app.searchKey("Warnung"));
  assert.notEqual(app.searchKey("Meier"), app.searchKey("Maier"));
});

test("Die Mitarbeitersuche findet Umlautnamen ohne Umlaut", async () => {
  const app = await loadAppFunctions(["filteredEmployeesForTable"]);
  const state = createMinimalState();
  state.employees = [
    { ...createEmployee("e1"), firstName: "Jörg", lastName: "Müller" },
    { ...createEmployee("e2"), firstName: "Anna", lastName: "Weiß" },
    { ...createEmployee("e3"), firstName: "Tom", lastName: "Schneider" },
  ];
  app.setState(state);

  // Der Vergleich läuft über eine Zeichenkette: Die Liste stammt aus einem
  // eigenen Realm, ihre Arrays sind deshalb nicht referenzgleich.
  const namen = (search) => {
    app.setEmployeeFilters({ search });
    return app
      .filteredEmployeesForTable()
      .map((employee) => employee.lastName)
      .join(", ");
  };

  assert.equal(namen("müller"), "Müller");
  assert.equal(namen("muller"), "Müller");
  assert.equal(namen("mueller"), "Müller");
  assert.equal(namen("joerg"), "Müller");
  assert.equal(namen("weiss"), "Weiß");
  assert.equal(namen("weis"), "Weiß");
  assert.equal(namen("schneider"), "Schneider");
});
