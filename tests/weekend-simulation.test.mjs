import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

test("Die Wochenendsimulation verbessert die Verteilung ohne den Datenbestand zu verändern", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "simulateWeekendDistribution",
    "weekendSimulationMatchesCurrentState",
  ]);
  const weekends = ["weekend_a", "weekend_a", "weekend_a", "weekend_a", "weekend_a", "weekend_b", "weekend_b", "none"];
  const employees = weekends.map((serviceWeekend, index) => ({
    ...createEmployee(`employee-weekend-${index}`),
    firstName: `Person${index}`,
    lastName: "Simulation",
    username: `Simu${String(index).padStart(3, "0")}`,
    employmentPercent: [100, 100, 80, 75, 50, 100, 75, 50][index],
    serviceWeekend,
    employmentStatus: index === 2 || index === 6 ? "onboarding" : "active",
    qualifications: {
      fachweiterbildungIA: [0, 1, 5, 6].includes(index),
      praxisanleiter: [2, 3, 6, 7].includes(index),
    },
  }));
  const state = app.normalizeState(
    createMinimalState({
      employees,
      catalogs: {
        professions: ["Pflegefachkraft"],
        qualifications: [
          { id: "fachweiterbildungIA", label: "Fachweiterbildung I/A" },
          { id: "praxisanleiter", label: "Praxisanleiter/in" },
        ],
      },
    }),
  );
  app.setState(state);
  const before = JSON.stringify(state);

  const simulation = app.simulateWeekendDistribution();

  assert.equal(simulation.employeeCount, 7);
  assert.equal(simulation.unassignedCount, 1);
  assert.equal(simulation.newAssignmentCount, 0);
  assert.equal(
    simulation.proposed.weekend_a.headcount + simulation.proposed.weekend_b.headcount,
    7,
  );
  assert.ok(
    Math.abs(
      simulation.proposed.weekend_a.headcount -
        simulation.proposed.weekend_b.headcount,
    ) <= 1,
  );
  assert.ok(
    simulation.proposedBalanceScore < simulation.currentBalanceScore,
  );
  assert.ok(simulation.switchedCount <= 2);
  assert.equal(
    simulation.assignments.some(
      (assignment) => assignment.employee.id === employees[7].id,
    ),
    false,
  );
  assert.equal(app.weekendSimulationMatchesCurrentState(simulation), true);
  const changedEmployee = state.employees[0];
  const originalWeekend = changedEmployee.serviceWeekend;
  changedEmployee.serviceWeekend =
    originalWeekend === "weekend_a" ? "weekend_b" : "weekend_a";
  assert.equal(app.weekendSimulationMatchesCurrentState(simulation), false);
  changedEmployee.serviceWeekend = originalWeekend;
  assert.equal(JSON.stringify(state), before);
});

test("Verantwortliche bleiben in der Simulation fest in ihrem Dienstwochenende", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "simulateWeekendDistribution",
  ]);
  const employees = Array.from({ length: 8 }, (_, index) => ({
    ...createEmployee(`employee-owner-${index}`),
    firstName: `OwnerTest${index}`,
    username: `Own${String(index).padStart(3, "0")}`,
    serviceWeekend: index < 6 ? "weekend_a" : "weekend_b",
    qualifications: {
      stationsleitung: index === 0,
      stellvertretendeStationsleitung: index === 6,
    },
  }));
  const state = app.normalizeState(
    createMinimalState({
      employees,
      settings: {
        theme: "standard",
        deadlineKinds: ["training"],
        serviceWeekends: {
          weekend_a: {
            name: "Team Nord",
            ownerId: employees[0].id,
          },
          weekend_b: {
            name: "Team Süd",
            ownerId: employees[6].id,
          },
        },
      },
    }),
  );
  app.setState(state);

  const simulation = app.simulateWeekendDistribution();
  const ownerA = simulation.assignments.find(
    (assignment) => assignment.employee.id === employees[0].id,
  );
  const ownerB = simulation.assignments.find(
    (assignment) => assignment.employee.id === employees[6].id,
  );

  assert.equal(ownerA.proposedWeekend, "weekend_a");
  assert.equal(ownerB.proposedWeekend, "weekend_b");
  assert.equal(ownerA.isWeekendOwner, true);
  assert.equal(ownerB.isWeekendOwner, true);
  assert.equal(state.settings.serviceWeekends.weekend_a.name, "OwnerTest0");
  assert.equal(state.settings.serviceWeekends.weekend_b.name, "OwnerTest6");
});

test("Alte Oli- und Claudio-Schlüssel werden auf neutrale Wochenendschlüssel migriert", async () => {
  const app = await loadAppFunctions(["normalizeState"]);
  const employees = [
    {
      ...createEmployee("employee-legacy-a"),
      firstName: "Anna",
      serviceWeekend: "oli",
    },
    {
      ...createEmployee("employee-legacy-b"),
      firstName: "Bernd",
      username: "Legacy002",
      serviceWeekend: "claudio",
    },
  ];
  const migrated = app.normalizeState(
    createMinimalState({
      version: 22,
      employees,
      settings: {
        theme: "standard",
        deadlineKinds: ["training"],
        vacationOliReferenceSaturday: "2026-01-03",
        serviceWeekendNames: {
          oli: "Team Alt A",
          claudio: "Team Alt B",
        },
        serviceWeekendOwnerIds: {
          oli: employees[0].id,
          claudio: employees[1].id,
        },
      },
    }),
  );

  assert.equal(migrated.employees[0].serviceWeekend, "weekend_a");
  assert.equal(migrated.employees[1].serviceWeekend, "weekend_b");
  assert.deepEqual(
    JSON.parse(JSON.stringify(migrated.settings.serviceWeekends)),
    {
      weekend_a: { name: "Anna", ownerId: employees[0].id },
      weekend_b: { name: "Bernd", ownerId: employees[1].id },
    },
  );
  assert.equal(
    migrated.settings.vacationWeekendAReferenceSaturday,
    "2026-01-03",
  );
  assert.equal(migrated.employees[0].qualifications.stationsleitung, true);
  assert.equal(
    migrated.employees[1].qualifications.stellvertretendeStationsleitung,
    true,
  );
});
