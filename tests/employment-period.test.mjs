import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

async function mitMitarbeiter(overrides, functions = [], options = {}) {
  const app = await loadAppFunctions(
    ["getVacationEntitlement", "normalizeState", ...functions],
    options,
  );
  const employee = { ...createEmployee("e1"), ...overrides };
  app.setState(app.normalizeState(createMinimalState({ employees: [employee] })));
  return { app, employee: app.getState().employees[0] };
}

const grundanspruch = async (overrides, year = 2026) => {
  const { app, employee } = await mitMitarbeiter(overrides);
  return app.getVacationEntitlement(employee, year).base;
};

test("Ohne Ein-, Austritt und Änderung bleibt der Jahresanspruch wie bisher", async () => {
  assert.equal(await grundanspruch({ employmentPercent: 100 }), 30);
  assert.equal(await grundanspruch({ employmentPercent: 75 }), 22.5);
  assert.equal(await grundanspruch({ employmentPercent: 60 }), 18);
});

test("Ein- und Austritt im Jahr zwölfteln den Anspruch nach vollen Monaten", async () => {
  // Eintritt zum Monatsersten: April bis Dezember, neun volle Monate.
  assert.equal(await grundanspruch({ entryDate: "2026-04-01" }), 22.5);
  // Eintritt zur Monatsmitte: Der April ist kein voller Monat mehr.
  assert.equal(await grundanspruch({ entryDate: "2026-04-15" }), 20);
  // Austritt zum Monatsende: Januar bis Juni.
  assert.equal(await grundanspruch({ exitDate: "2026-06-30" }), 15);
  assert.equal(await grundanspruch({ exitDate: "2026-06-29" }), 12.5);
  // In Jahren vor dem Eintritt oder nach dem Austritt gibt es keinen Anspruch.
  assert.equal(await grundanspruch({ entryDate: "2027-01-01" }), 0);
  assert.equal(await grundanspruch({ exitDate: "2025-12-31" }), 0);
});

test("Eine Änderung des Stellenumfangs wirkt ab ihrem Monat", async () => {
  const halbJahr = {
    employmentPercent: 100,
    employmentChanges: [{ from: "2026-07-01", percent: 50 }],
  };
  // Sechs Monate zu 100 %, sechs zu 50 %: 15 + 7,5 Tage.
  assert.equal(await grundanspruch(halbJahr), 22.5);
  assert.equal(await grundanspruch(halbJahr, 2025), 30);
  assert.equal(await grundanspruch(halbJahr, 2027), 15);
});

test("Der Stellenumfang zu einem Tag folgt der letzten Änderung davor", async () => {
  const { app, employee } = await mitMitarbeiter(
    {
      employmentPercent: 100,
      employmentChanges: [
        { from: "2020-01-01", percent: 80 },
        { from: "2099-01-01", percent: 50 },
      ],
    },
    ["employmentPercentOn", "currentEmploymentPercent", "upcomingEmploymentChange"],
  );
  assert.equal(app.employmentPercentOn(employee, "2019-12-31"), 100);
  assert.equal(app.employmentPercentOn(employee, "2020-01-01"), 80);
  assert.equal(app.currentEmploymentPercent(employee), 80);
  assert.equal(app.upcomingEmploymentChange(employee).from, "2099-01-01");
});

test("Ungültige Angaben werden beim Laden bereinigt", async () => {
  const { employee } = await mitMitarbeiter({
    entryDate: "2026-05-01",
    exitDate: "2026-04-30",
    employmentChanges: [
      { from: "2026-09-01", percent: 50 },
      { from: "kaputt", percent: 50 },
      { from: "2026-03-01", percent: 250 },
      { from: "2026-09-01", percent: 60 },
    ],
  });
  assert.equal(employee.entryDate, "2026-05-01");
  // Austritt vor Eintritt: nur der Eintritt bleibt.
  assert.equal(employee.exitDate, "");
  assert.equal(
    employee.employmentChanges.map((change) => `${change.from}:${change.percent}`).join(","),
    "2026-03-01:100,2026-09-01:60",
  );
});

test("Die Planungstabelle zeigt Mitarbeiter nur in Monaten ihrer Beschäftigung", async () => {
  const { app } = await mitMitarbeiter(
    { entryDate: "2026-06-15", exitDate: "2026-08-10" },
    ["renderVacationPlanner"],
    { withDom: true },
  );
  const planer = () => app.dom.document.querySelector("#vacationPlanner").innerHTML;

  app.setVacationPeriod(2026, 5);
  app.renderVacationPlanner();
  assert.doesNotMatch(planer(), /data-vacation-employee="e1"/);

  app.setVacationPeriod(2026, 6);
  app.renderVacationPlanner();
  const juni = planer();
  // Vor dem 15. gesperrt, ab dem 15. planbar.
  assert.match(juni, /<button\s+type="button"\s+disabled\s+data-vacation-employee="e1"\s+data-vacation-date="2026-06-14"/);
  assert.doesNotMatch(juni, /disabled\s+data-vacation-employee="e1"\s+data-vacation-date="2026-06-15"/);
  assert.match(juni, /Vor dem Eintritt am 15\.06\.2026/);

  app.setVacationPeriod(2026, 8);
  app.renderVacationPlanner();
  assert.match(planer(), /Nach dem Austritt am 10\.08\.2026/);

  app.setVacationPeriod(2026, 9);
  app.renderVacationPlanner();
  assert.doesNotMatch(planer(), /data-vacation-employee="e1"/);
});

test("Ein überschrittenes Austrittsdatum bei aktivem Status fällt in der Datenqualität auf", async () => {
  const { app } = await mitMitarbeiter({ exitDate: "2020-06-30" }, ["getDataQualityIssues"]);
  const issues = app.getDataQualityIssues();
  assert.ok(issues.some((issue) => issue.title.includes("ausgetreten, aber noch aktiv")));
});
