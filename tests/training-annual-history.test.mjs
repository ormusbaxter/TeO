import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Zwei Mitarbeiter, eine Pflichtfortbildung je Jahr, ein Nachweis: Daraus
// ergibt sich eine Quote, die sich nachrechnen lässt.
function createTrainingState() {
  return createMinimalState({
    employees: [createEmployee("e1"), createEmployee("e2")],
    trainings: [
      {
        id: "t2025",
        title: "Reanimation",
        year: 2025,
        recurrenceMonths: 12,
        mandatory: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "t2026",
        title: "Brandschutz",
        year: 2026,
        recurrenceMonths: 12,
        mandatory: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    completions: [
      {
        id: "c1",
        employeeId: "e1",
        trainingId: "t2026",
        completedOn: "2026-03-01",
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
    ],
  });
}

test("Die Jahresauswertung rechnet die Quote aus den Nachweisen", async () => {
  const app = await loadAppFunctions(["getAnnualTrainingMatrix"], { withDom: true });
  app.setState(createTrainingState());

  // 2026 gelten beide Fortbildungen, zwei Mitarbeiter: vier Zuweisungen, eine
  // davon nachgewiesen.
  const matrix = app.getAnnualTrainingMatrix(2026);
  assert.equal(matrix.rows.length, 2, "Je Mitarbeiter eine Zeile");
  assert.equal(matrix.rows[0].statuses.length, 2, "Je geltender Fortbildung eine Spalte");
  assert.equal(matrix.completionRate, 25, "Eine von vier Zuweisungen ist erfüllt");

  // 2025 galt nur die eine, für die kein Nachweis vorliegt.
  const vorjahr = app.getAnnualTrainingMatrix(2025);
  assert.equal(vorjahr.rows[0].statuses.length, 1);
  assert.equal(vorjahr.completionRate, 0);
});

test("Ein abgelaufener Nachweis zählt nicht mehr", async () => {
  const app = await loadAppFunctions(["getAnnualTrainingMatrix"], { withDom: true });
  const state = createTrainingState();
  // Der Nachweis ist von 2026 und gilt zwölf Monate - zum Stichtag Ende 2027
  // ist er abgelaufen.
  app.setState(state);

  assert.equal(app.getAnnualTrainingMatrix(2026).completionRate, 25);
  assert.equal(
    app.getAnnualTrainingMatrix(2027).completionRate,
    0,
    "Ein abgelaufener Nachweis erfüllt die Pflicht nicht mehr",
  );
});

test("Der Quotenverlauf zeigt je Jahr einen Balken mit seinem Wert", async () => {
  const app = await loadAppFunctions(["renderTrainingRateHistory"], { withDom: true });
  app.setState(createTrainingState());

  app.renderTrainingRateHistory([2025, 2026]);
  const markup = app.dom.markupText("#trainingRateHistoryChart");

  assert.match(markup, /training-rate-chart/);
  // Die Jahre stehen aufsteigend, unabhängig von der Reihenfolge der Eingabe.
  assert.ok(
    markup.indexOf("2025") < markup.indexOf("2026"),
    "Die Jahre stehen aufsteigend",
  );
  // Der Balken trägt seinen Wert als Marke - style-Attribute verbietet die CSP.
  assert.match(markup, /--training-rate:25%/);
  assert.doesNotMatch(markup, /\sstyle="/);
  // Und das Diagramm ist für Vorleseprogramme beschriftet.
  assert.match(markup, /aria-label="2025: 0 Prozent, 2026: 25 Prozent"/);

  app.renderTrainingRateHistory([2026, 2025]);
  assert.ok(
    app.dom.markupText("#trainingRateHistoryChart").indexOf("2025") <
      app.dom.markupText("#trainingRateHistoryChart").indexOf("2026"),
  );
});

test("Aus der Jahresmatrix führt ein Weg in die Gesamtakte", async () => {
  const app = await loadAppFunctions(["renderTrainingMatrix"], { withDom: true });
  app.setState(createTrainingState());
  // Das Jahr kommt aus dem Auswahlfeld des Dialogs.
  app.dom.document.querySelector("#trainingMatrixYear").value = "2026";
  app.renderTrainingMatrix();

  const markup = app.dom.markupText("#trainingMatrixContent");
  assert.match(
    markup,
    /data-training-matrix-employee="e1"/,
    "Jeder Name in der Matrix führt zu seinem Mitarbeiter",
  );
  // Die Zusammenfassung nennt dieselbe Quote wie die Auswertung.
  assert.match(
    app.dom.markupText("#trainingMatrixSummary"),
    /<strong>1 von 4<\/strong>/,
  );
});
