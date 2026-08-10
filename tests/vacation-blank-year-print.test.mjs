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

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Leere Jahresübersichten enthalten nur Beschäftigte und Kalendermerkmale", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "renderBlankVacationYearPrintDocument",
    "vacationEmployeesForBlankYearPrint",
  ]);
  const active = {
    ...createEmployee("active"),
    firstName: "Berta",
    lastName: "Adler",
    serviceWeekend: "weekend_a",
  };
  const onboarding = {
    ...createEmployee("onboarding"),
    firstName: "Anna",
    lastName: "Zimmer",
    employmentStatus: "onboarding",
  };
  const inactive = {
    ...createEmployee("inactive"),
    firstName: "Clara",
    lastName: "Alt",
    active: false,
    employmentStatus: "inactive",
  };
  app.setState(
    app.normalizeState(
      createMinimalState({ employees: [inactive, onboarding, active] }),
    ),
  );

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.vacationEmployeesForBlankYearPrint().map((employee) => employee.id),
      ),
    ),
    ["active", "onboarding"],
  );

  const markup = app.renderBlankVacationYearPrintDocument(active);
  assert.match(markup, /Leere Jahresübersicht/);
  assert.match(markup, /vacation-holiday/);
  assert.match(markup, /is-own-weekend/);
  assert.doesNotMatch(markup, /vacation-year-entry planner-entry-/);
});

test("Jede leere Jahresübersicht ist als eigene DIN-A4-Seite definiert", async () => {
  const [html, printCss] = await Promise.all([
    fs.readFile(path.join(projectRoot, "src/html/10-team-planning-views.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/styles/90-print.css"), "utf8"),
  ]);

  assert.match(html, /id="printBlankVacationYearOverviewsButton"/);
  assert.match(
    printCss,
    /@page vacation-blank-year\s*{[^}]*size: A4 landscape;[^}]*margin: 8mm;/s,
  );
  assert.match(
    printCss,
    /\.vacation-blank-year-document\s*{[^}]*height: 194mm;/s,
  );
  assert.match(
    printCss,
    /\.vacation-blank-year-document \+ \.vacation-blank-year-document\s*{[^}]*break-before: page;[^}]*page-break-before: always;/s,
  );
  assert.doesNotMatch(
    printCss,
    /\.vacation-blank-year-document\s*{[^}]*break-after:/s,
  );
  assert.match(
    printCss,
    /body\.print-vacation-blank-year > #trainingMatrixDialog\s*{[^}]*display: none !important;/s,
  );
});
