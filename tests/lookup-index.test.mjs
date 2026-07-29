import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Hinter getEmployee und der Urlaubsplanung liegen Zuordnungstabellen, die nur
// so lange gelten, wie Feld und Laenge der Sammlung unveraendert sind. Diese
// Tests gehen die Aenderungsarten durch, die die Anwendung tatsaechlich
// verwendet: ergaenzen mit push, ersetzen mit map, entfernen mit filter.
async function anwendung() {
  const app = await loadAppFunctions([
    "normalizeState",
    "getEmployee",
    "findVacationDay",
    "getPlannedVacationDays",
    "getPlannerDayStats",
  ]);
  const zustand = app.normalizeState(
    createMinimalState({
      employees: [
        { ...createEmployee("employee-1"), lastName: "Erste", username: "Demo101" },
        { ...createEmployee("employee-2"), lastName: "Zweite", username: "Demo102" },
      ],
      vacationDays: [
        {
          id: "vacation-1",
          employeeId: "employee-1",
          date: "2026-07-15",
          type: "vacation",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }),
  );
  app.setState(zustand);
  return app;
}

test("Ein ergaenzter Mitarbeiter ist sofort auffindbar", async () => {
  const app = await anwendung();
  assert.equal(app.getEmployee("employee-3"), undefined);

  const zustand = app.getState();
  zustand.employees.push({
    ...createEmployee("employee-3"),
    lastName: "Dritte",
    username: "Demo103",
  });

  assert.equal(app.getEmployee("employee-3")?.lastName, "Dritte");
});

test("Ein ersetzter Mitarbeiter wird mit neuem Inhalt gefunden", async () => {
  const app = await anwendung();
  assert.equal(app.getEmployee("employee-2").lastName, "Zweite");

  const zustand = app.getState();
  zustand.employees = zustand.employees.map((employee) =>
    employee.id === "employee-2"
      ? { ...employee, lastName: "Umbenannt" }
      : employee,
  );

  assert.equal(app.getEmployee("employee-2").lastName, "Umbenannt");
});

test("Ein entfernter Mitarbeiter wird nicht mehr gefunden", async () => {
  const app = await anwendung();
  assert.ok(app.getEmployee("employee-1"));

  const zustand = app.getState();
  zustand.employees = zustand.employees.filter(
    (employee) => employee.id !== "employee-1",
  );

  assert.equal(app.getEmployee("employee-1"), undefined);
});

test("Eine Aenderung am Datensatz selbst braucht keine Erneuerung", async () => {
  const app = await anwendung();
  const mitarbeiter = app.getEmployee("employee-1");
  mitarbeiter.lastName = "Direkt";

  assert.equal(
    app.getEmployee("employee-1").lastName,
    "Direkt",
    "Die Tabelle muss auf denselben Datensatz zeigen, nicht auf eine Kopie",
  );
});

test("Die Urlaubsplanung folgt Ergaenzungen und Loeschungen", async () => {
  const app = await anwendung();
  assert.ok(app.findVacationDay("employee-1", "2026-07-15"));
  assert.equal(app.findVacationDay("employee-2", "2026-07-15"), undefined);
  assert.equal(app.getPlannedVacationDays("employee-1", 2026), 1);
  assert.equal(app.getPlannerDayStats("2026-07-15").absenceCount, 1);

  const zustand = app.getState();
  zustand.vacationDays.push({
    id: "vacation-2",
    employeeId: "employee-2",
    date: "2026-07-15",
    type: "vacation",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  assert.ok(app.findVacationDay("employee-2", "2026-07-15"));
  assert.equal(app.getPlannedVacationDays("employee-2", 2026), 1);
  assert.equal(app.getPlannerDayStats("2026-07-15").absenceCount, 2);

  zustand.vacationDays = zustand.vacationDays.filter(
    (eintrag) => eintrag.employeeId !== "employee-1",
  );

  assert.equal(app.findVacationDay("employee-1", "2026-07-15"), undefined);
  assert.equal(app.getPlannedVacationDays("employee-1", 2026), 0);
  assert.equal(app.getPlannerDayStats("2026-07-15").absenceCount, 1);
});

test("Ein Wechsel des gesamten Datenbestands wird bemerkt", async () => {
  const app = await anwendung();
  assert.ok(app.getEmployee("employee-1"));

  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [
          { ...createEmployee("employee-9"), lastName: "Neunte", username: "Demo109" },
        ],
      }),
    ),
  );

  assert.equal(app.getEmployee("employee-1"), undefined);
  assert.equal(app.getEmployee("employee-9")?.lastName, "Neunte");
});
