import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// ACLS-Provider deckt das ACLS-Training ab: Solange die Qualifikation in einem
// Kalenderjahr an mindestens einem Tag gilt, zaehlt die Pflichtfortbildung fuer
// dieses Jahr als absolviert - ohne eigenen Nachweis.

const FUNCTIONS = [
  "normalizeState",
  "todayIso",
  "isEmployeeCurrentForTraining",
  "getEmployeeCompletionStatus",
  "getTrainingStats",
  "getAnnualTrainingMatrix",
  "getDeadlineItems",
  "suggestedTrainingCoverageQualificationId",
];

function aclsState({ version, expiry = "", qualified = true, coveredBy } = {}) {
  const provider = createEmployee("provider");
  provider.qualifications = { aclsProvider: qualified };
  if (expiry) provider.qualificationExpiries = { aclsProvider: expiry };
  const ohne = createEmployee("ohne");
  ohne.username = "Demo998";
  const state = createMinimalState({
    employees: [provider, ohne],
    trainings: [
      {
        id: "acls",
        title: "ACLS-Training",
        description: "",
        year: 2024,
        recurrenceMonths: 12,
        ...(coveredBy === undefined ? {} : { coveredByQualificationId: coveredBy }),
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  });
  state.catalogs.qualifications = [
    { id: "praxisanleiter", label: "Praxisanleiter/in" },
    { id: "aclsProvider", label: "ACLS-Provider" },
  ];
  if (version) state.version = version;
  return state;
}

async function appWith(state) {
  const app = await loadAppFunctions(FUNCTIONS);
  const normalized = app.normalizeState(state);
  app.setState(normalized);
  return { app, state: normalized, training: normalized.trainings[0] };
}

test("Bestand vor Datenformat 28 verbindet das ACLS-Training mit ACLS-Provider", async () => {
  const { state } = await appWith(aclsState({ version: 27 }));
  assert.equal(state.trainings[0].coveredByQualificationId, "aclsProvider");
});

test("Eine bewusst gelöste Verbindung bleibt gelöst", async () => {
  const { state } = await appWith(aclsState({ coveredBy: "" }));
  assert.equal(state.trainings[0].coveredByQualificationId, "");
});

test("Eine Verbindung auf eine gelöschte Qualifikation verfällt", async () => {
  const { state } = await appWith(aclsState({ coveredBy: "gibtsNicht" }));
  assert.equal(state.trainings[0].coveredByQualificationId, "");
});

test("Gültige Qualifikation gilt als absolviert, ohne sie bleibt die Pflicht offen", async () => {
  const { app, training } = await appWith(aclsState({ coveredBy: "aclsProvider" }));
  assert.equal(app.isEmployeeCurrentForTraining("provider", training), true);
  assert.equal(app.isEmployeeCurrentForTraining("ohne", training), false);
  assert.equal(
    app.getEmployeeCompletionStatus("provider", training).label,
    "durch ACLS-Provider abgedeckt",
  );
  assert.equal(app.getEmployeeCompletionStatus("ohne", training).label, "Offen");
  assert.equal(app.getTrainingStats(training).current, 1);

  const fristen = app
    .getDeadlineItems()
    .filter((item) => item.kind === "training")
    .map((item) => item.employeeId);
  assert.equal(fristen.join(","), "ohne");
});

test("Läuft die Qualifikation im Jahr ab, gilt das ganze Jahr als absolviert", async () => {
  const year = Number(new Date().getFullYear());
  const { app, training } = await appWith(
    aclsState({ coveredBy: "aclsProvider", expiry: `${year}-01-01` }),
  );
  assert.equal(app.isEmployeeCurrentForTraining("provider", training), true);

  const statusIn = (y) =>
    app.getAnnualTrainingMatrix(y).rows.find((row) => row.employee.id === "provider")
      .statuses[0];
  assert.equal(statusIn(year).completed, true);
  assert.equal(statusIn(year).coveredBy, "ACLS-Provider");
  assert.equal(statusIn(year + 1).completed, false);
});

test("Abgelaufen im Vorjahr deckt nichts mehr ab", async () => {
  const year = Number(new Date().getFullYear());
  const { app, training } = await appWith(
    aclsState({ coveredBy: "aclsProvider", expiry: `${year - 1}-12-31` }),
  );
  assert.equal(app.isEmployeeCurrentForTraining("provider", training), false);
});

test("Vorschlag erkennt ACLS-Trainings, nicht aber die Qualifikation selbst", async () => {
  const app = await loadAppFunctions(["suggestedTrainingCoverageQualificationId"]);
  const katalog = [
    { id: "acls", label: "ACLS" },
    { id: "aclsProvider", label: "ACLS-Provider" },
  ];
  assert.equal(app.suggestedTrainingCoverageQualificationId("ACLS-Training", katalog), "aclsProvider");
  assert.equal(app.suggestedTrainingCoverageQualificationId("acls training 2026", katalog), "aclsProvider");
  assert.equal(app.suggestedTrainingCoverageQualificationId("ACLS-Provider-Kurs", katalog), "");
  assert.equal(app.suggestedTrainingCoverageQualificationId("Reanimation", katalog), "");
  assert.equal(app.suggestedTrainingCoverageQualificationId("ACLS-Training", []), "");
});
