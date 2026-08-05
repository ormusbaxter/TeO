import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Soll-Zeiten werden normalisiert und als hh:mm formatiert", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "formatMinutesAsHoursAndMinutes",
    "formatSecondsAsMinutesAndSeconds",
    "formatSecondsAsRoundedMinutes",
  ]);
  const state = app.normalizeState(
    createMinimalState({
      trainings: [
        {
          id: "violence-prevention",
          title: "Gewaltprävention",
          description: "",
          year: 2026,
          recurrenceMonths: 60,
          targetMinutes: 75,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }),
  );

  assert.equal(state.trainings[0].targetMinutes, 75);
  assert.equal(app.formatMinutesAsHoursAndMinutes(75), "01:15");
  assert.equal(app.formatMinutesAsHoursAndMinutes(150), "02:30");
  assert.equal(app.formatSecondsAsMinutesAndSeconds(75), "01:15");
  assert.equal(app.formatSecondsAsMinutesAndSeconds(3670), "61:10");
  assert.equal(app.formatSecondsAsRoundedMinutes(75), "1 Minute");
  assert.equal(app.formatSecondsAsRoundedMinutes(90), "2 Minuten");
});

test("Der Pflichtfortbildungsrechner ist vollständig verdrahtet", async () => {
  const [viewHtml, settingsHtml, dialogHtml, appSource] = await Promise.all([
    fs.readFile(path.join(projectRoot, "src/html/20-calendar-training-meeting-views.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/html/30-device-settings-views.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/html/60-training-meeting-dialogs.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
  ]);

  assert.match(viewHtml, /id="openTrainingTimeCalculatorButton"[^>]*>[\s\S]*Zeiten berechnen/);
  assert.match(settingsHtml, /id="trainingDurationSettings"/);
  assert.match(settingsHtml, /id="saveTrainingDurationsButton"/);
  assert.match(dialogHtml, /id="trainingTimeCalculatorDialog"/);
  assert.match(dialogHtml, /id="creditedTrainingTimeList"/);
  assert.match(dialogHtml, /id="creditedTrainingTotalFormatted"/);
  assert.match(dialogHtml, /<small>mm:ss<\/small>/);
  assert.match(dialogHtml, /<small>hh:mm<\/small>/);
  assert.match(appSource, /Array\.from\(\{ length: 20 \}/);
  assert.match(appSource, /function updateTimeSpanTotal\(\)/);
  assert.match(appSource, /data-time-seconds/);
  assert.match(appSource, /function updateCreditedTrainingTimeTotal\(\)/);
});
