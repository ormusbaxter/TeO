import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const trainingSource = fs.readFileSync(
  path.join(root, "src", "app", "50-employees-trainings.js"),
  "utf8",
);
const dialogSource = fs.readFileSync(
  path.join(root, "src", "html", "60-training-meeting-dialogs.html"),
  "utf8",
);

test("Fortbildungs-Jahresauswertung bietet Aktenlinks und den Quotenverlauf", () => {
  assert.match(dialogSource, /Verlauf der Pflichtfortbildungsquote nach Jahren/);
  assert.match(dialogSource, /id="trainingRateHistoryChart"/);
  assert.match(trainingSource, /getAnnualTrainingMatrix\(year\)\.completionRate/);
  assert.match(trainingSource, /data-training-matrix-employee=/);
  assert.match(
    trainingSource,
    /openEmployeeDossier\(button\.dataset\.trainingMatrixEmployee\)/,
  );
});
