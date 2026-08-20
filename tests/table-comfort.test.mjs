import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Umschalt-Klick wählt den Bereich bis zur zuletzt angeklickten Zeile", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "applyEmployeeSelectionRange",
    "rememberEmployeeSelectionAnchor",
    "selectedEmployeeIds",
    "filteredEmployeesForTable",
  ]);
  const namen = ["Anders", "Berger", "Cordes", "Dreyer", "Engel", "Fischer"];
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: namen.map((name, index) => ({
          ...createEmployee(`employee-${index}`),
          firstName: "Test",
          lastName: name,
          username: `Demo10${index}`,
        })),
      }),
    ),
  );
  app.setEmployeeFilters({});

  const sichtbar = app.filteredEmployeesForTable().map((employee) => employee.lastName);
  assert.equal(sichtbar.join(","), namen.join(","), "Alle stehen in der Tabelle");

  // Ohne vorherigen Klick gibt es keinen Bereich - der erste Klick setzt nur
  // den Ausgangspunkt.
  assert.equal(app.applyEmployeeSelectionRange("employee-1", true), false);
  app.rememberEmployeeSelectionAnchor("employee-1");

  assert.equal(app.applyEmployeeSelectionRange("employee-4", true), true);
  assert.equal(
    [...app.selectedEmployeeIds].sort().join(","),
    ["employee-1", "employee-2", "employee-3", "employee-4"].sort().join(","),
    "Vom Ausgangspunkt bis zur angeklickten Zeile ist alles gewählt",
  );

  // Rückwärts gilt dasselbe, und Abwählen räumt denselben Bereich wieder ab.
  assert.equal(app.applyEmployeeSelectionRange("employee-2", false), true);
  assert.equal(
    [...app.selectedEmployeeIds].sort().join(","),
    ["employee-1"].join(","),
    "Der Bereich zurück zur vorherigen Zeile wird abgewählt",
  );
});

test("Die wählbaren Spalten passen zu Tabelle und Sortierung", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  const columns = [
    ...appSource
      .match(/const EMPLOYEE_COLUMNS = Object\.freeze\(\[([\s\S]*?)\]\);/)[1]
      .matchAll(/key: "(\w+)"/g),
  ].map(([, key]) => key);
  assert.deepEqual(
    columns.join(","),
    "profession,employment,qualifications,trainings,status",
    "Wählbar sind die fünf Spalten zwischen Name und Aktionen",
  );

  // Jede wählbare Spalte muss sich auch sortieren lassen - die Kopfzeile
  // entsteht aus derselben Liste.
  const sortKeys = appSource.match(/const values = \{([\s\S]*?)\n {4}\};/)[1];
  for (const key of columns) {
    assert.ok(sortKeys.includes(`${key}:`), `Die Sortierung kennt ${key}`);
  }

  // Wird die Spalte der aktuellen Sortierung abgewählt, fällt sie auf den
  // Namen zurück.
  assert.match(
    appSource,
    /if \(hiddenEmployeeColumns\.has\(employeeSortKey\)\) employeeSortKey = "name";/,
  );

  // Die Breiten hängen an der Spalte, nicht an ihrer Position.
  const styles = await fs.readFile(path.join(projectRoot, "styles.css"), "utf8");
  assert.match(styles, /\.employee-table th\[data-column="profession"\] \{ width: 16%; \}/);
  assert.doesNotMatch(styles, /\.employee-table th:nth-child\(/);
});

test("Kompakte Tabellen und die feste erste Spalte der Matrizen", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.match(appSource, /const TABLE_DENSITY_KEY = "teo-table-density-v1";/);
  assert.match(
    appSource,
    /document\.body\.classList\.toggle\("is-compact-tables", compact\)/,
  );
  assert.match(styles, /body\.is-compact-tables \.data-table td \{[^}]*padding: 7px 12px;/s);

  // Beide Matrizen halten die Namensspalte beim seitlichen Blättern fest.
  assert.match(
    styles,
    /\.device-matrix-table :is\(thead, tbody\) th:first-child,\s*\.training-matrix-table :is\(thead, tbody\) th:first-child \{[^}]*position: sticky;[^}]*left: 0;/s,
  );
  // Die Ecke oben links steht in beide Richtungen fest und muss deshalb über
  // der Kopfzeile liegen.
  assert.match(
    styles,
    /\.device-matrix-table thead th:first-child,\s*\.training-matrix-table thead th:first-child \{\s*z-index: 4;/s,
  );
});
