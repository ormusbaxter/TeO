import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

function training(overrides = {}) {
  return {
    id: "t1",
    title: "Reanimation",
    description: "",
    year: 2026,
    recurrenceMonths: null,
    targetMinutes: null,
    seriesId: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function meeting(overrides = {}) {
  return {
    id: "m1",
    title: "Teamsitzung",
    date: "2026-01-15",
    time: "14:00",
    location: "",
    notes: "",
    expectedEmployeeIds: ["a", "b"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function mitBestand(functions, bestand, options = {}) {
  const app = await loadAppFunctions(["normalizeState", "todayIso", ...functions], options);
  app.setState(app.normalizeState(createMinimalState(bestand)));
  return app;
}

function verschoben(isoDate, tage) {
  const datum = new Date(`${isoDate}T12:00:00`);
  datum.setDate(datum.getDate() + tage);
  return [
    datum.getFullYear(),
    String(datum.getMonth() + 1).padStart(2, "0"),
    String(datum.getDate()).padStart(2, "0"),
  ].join("-");
}

test("Fortbildungsquoten zählen nur, wer heute beschäftigt ist", async () => {
  const app = await mitBestand(["getTrainingStats"], {
    employees: [
      createEmployee("a"),
      { ...createEmployee("b"), entryDate: "2099-01-01" },
      { ...createEmployee("c"), exitDate: "2000-12-31" },
    ],
    trainings: [training()],
  });
  assert.equal(app.getTrainingStats(app.getState().trainings[0]).total, 1);
});

test("Die Jahresmatrix erwartet, wer zum Stichtag des Jahres beschäftigt ist", async () => {
  const app = await mitBestand(["getAnnualTrainingMatrix"], {
    employees: [
      createEmployee("a"),
      // Im Herbst eingetreten: für dieses Jahr schon verpflichtet.
      { ...createEmployee("b"), entryDate: "2024-09-01" },
      // Im Frühjahr ausgetreten: für dieses Jahr nicht mehr.
      { ...createEmployee("c"), exitDate: "2024-03-31" },
      // Erst im Folgejahr eingetreten.
      { ...createEmployee("d"), entryDate: "2025-02-01" },
    ],
    trainings: [training({ year: 2024 })],
  });
  const matrix = app.getAnnualTrainingMatrix(2024);
  assert.equal(matrix.employees.map((employee) => employee.id).join(","), "a,b");
});

test("Sitzungen erwarten nur, wer am Sitzungstag beschäftigt war", async () => {
  const bestand = {
    employees: [createEmployee("a"), { ...createEmployee("b"), entryDate: "2026-03-01" }],
    meetings: [meeting()],
  };
  const app = await mitBestand(["getMeetingStats", "getAnnualMeetingStatistics"], bestand);
  const sitzung = app.getState().meetings[0];
  assert.equal(app.getMeetingStats(sitzung).total, 1);
  const jahr = app.getAnnualMeetingStatistics(2026);
  assert.equal(jahr.employeeRows.map((row) => row.employeeId).join(","), "a");

  // Ist für b trotzdem etwas dokumentiert, zählt es.
  const mitEintrag = await mitBestand(["getMeetingStats"], {
    ...bestand,
    meetingAttendances: [
      {
        id: "x",
        meetingId: "m1",
        employeeId: "b",
        status: "teilgenommen",
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    ],
  });
  assert.equal(mitEintrag.getMeetingStats(mitEintrag.getState().meetings[0]).total, 2);
});

test("Der Fristenmonitor nennt Probezeit, Jubiläum, Austritt und Änderung", async () => {
  const app = await mitBestand(["getDeadlineItems"], { employees: [] });
  const heute = app.todayIso();
  const jahr = Number(heute.slice(0, 4));
  const inZehnTagen = verschoben(heute, 10);
  const jubilar = {
    ...createEmployee("j"),
    entryDate: `${jahr - 25}${inZehnTagen.slice(4)}`,
  };
  const neu = { ...createEmployee("n"), entryDate: verschoben(heute, -30) };
  const geht = {
    ...createEmployee("g"),
    exitDate: verschoben(heute, 40),
    employmentChanges: [{ from: verschoben(heute, 20), percent: 50 }],
  };
  const mitFristen = await mitBestand(["getDeadlineItems"], { employees: [jubilar, neu, geht] });
  const personal = mitFristen
    .getDeadlineItems()
    .filter((item) => item.kind === "employment")
    .map((item) => `${item.employeeId}:${item.title}`);
  assert.ok(personal.includes("j:25-jähriges Dienstjubiläum"), personal.join(" | "));
  assert.ok(personal.includes("n:Ende der Probezeit"));
  assert.ok(personal.includes("g:Austritt"));
  assert.ok(personal.includes("g:Stellenumfang 50 %"));
  // Eine längst abgelaufene Probezeit ist erledigt und taucht nicht auf.
  assert.ok(!personal.includes("j:Ende der Probezeit"));
});

test("Eine neue Fristart erscheint auch bei gespeicherter Auswahl", async () => {
  const app = await mitBestand([], { employees: [] });
  const alt = app.normalizeState(
    createMinimalState({
      settings: { ...createMinimalState().settings, deadlineKinds: ["training"] },
    }),
  );
  // Vor „Personal“ gespeichert: Die neue Art ist eingeschaltet.
  assert.equal(alt.settings.deadlineKinds.join(","), "training,employment");
  // Danach bewusst abgewählt: Sie bleibt aus.
  const abgewaehlt = app.normalizeState({
    ...alt,
    settings: { ...alt.settings, deadlineKinds: ["training"] },
  });
  assert.equal(abgewaehlt.settings.deadlineKinds.join(","), "training");
});

test("Eine Änderung mitten im Monat zählt tagegenau", async () => {
  const app = await mitBestand(["getVacationEntitlement"], {
    employees: [
      {
        ...createEmployee("a"),
        employmentPercent: 100,
        employmentChanges: [{ from: "2026-07-16", percent: 50 }],
      },
    ],
  });
  // Januar bis Juni zu 100 %, im Juli 15 Tage zu 100 % und 16 zu 50 %,
  // August bis Dezember zu 50 %: 30 × 924,2 / 1200 = 23,1, gerundet 23 Tage.
  // Ab dem Monatsersten gerechnet wären es 22,5.
  const basis = app.getVacationEntitlement(app.getState().employees[0], 2026).base;
  assert.equal(basis, 23);
});

test("Ausgetretene lassen sich aus der Datenqualität heraus inaktiv setzen", async () => {
  const app = await mitBestand(
    ["deactivateExitedEmployee", "getDataQualityIssues", "undoLastMutation"],
    { employees: [{ ...createEmployee("a"), exitDate: "2020-06-30" }] },
    { withDom: true },
  );
  app.setDataStore({
    async setItem(_key, value) {
      return value;
    },
    async getItem() {
      return null;
    },
  });
  const [hinweis] = app.getDataQualityIssues().filter((issue) => issue.action);
  assert.equal(hinweis.action.kind, "deactivate");
  await app.deactivateExitedEmployee("a");
  assert.equal(app.getState().employees[0].employmentStatus, "inactive");
  assert.equal(app.getDataQualityIssues().filter((issue) => issue.action).length, 0);
  await app.undoLastMutation();
  assert.equal(app.getState().employees[0].employmentStatus, "active");
});
