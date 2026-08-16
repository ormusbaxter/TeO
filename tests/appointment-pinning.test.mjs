import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Angepinnte Termine umgehen Kategorie und Horizont, aber nicht den Überfälligkeitsfilter", async () => {
  const app = await loadAppFunctions(["filterDeadlineItems"]);
  const deadlines = [
    { kind: "training", daysUntil: 2, title: "Reguläre Frist" },
    {
      kind: "appointment",
      daysUntil: 900,
      title: "Wichtiger Termin",
      appointment: { pinned: true, category: "pruefung" },
    },
    {
      kind: "appointment",
      daysUntil: -10,
      title: "Wichtiger vergangener Termin",
      appointment: { pinned: true, category: "meeting" },
    },
  ];

  const result = app.filterDeadlineItems(deadlines, new Set(["training"]), 30, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result)),
    [deadlines[1], deadlines[0]],
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.filterDeadlineItems(deadlines, new Set(["training"]), 30, false),
      ),
    ),
    [deadlines[1], deadlines[2], deadlines[0]],
  );
});

test("Pin-Status, Bedienung und Wichtig-Markierung sind verdrahtet", async () => {
  const [dialogHtml, appSource, coreCss] = await Promise.all([
    fs.readFile(path.join(projectRoot, "src/html/60-training-meeting-dialogs.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/styles/00-core.css"), "utf8"),
  ]);

  assert.match(dialogHtml, /id="appointmentPinned"/);
  assert.match(appSource, /pinned:\s*Boolean\(appointment\.pinned\)/);
  assert.match(appSource, /data-action="toggle-appointment-pin"/);
  assert.match(appSource, /appointment-group-pinned/);
  assert.match(
    appSource,
    /const upcoming = \[\.\.\.matchingAppointments\]/,
    "Angepinnte Termine dürfen nicht zusätzlich in einer Zeitraumgruppe erscheinen.",
  );
  assert.match(appSource, /deadline-row \$\{item\.appointment\?\.pinned \? "is-pinned"/);
  assert.match(
    appSource,
    /class="deadline-description"[\s\S]*item\.appointment\.description/,
  );
  assert.match(coreCss, /\.appointment-card\.is-pinned\s*{/);
  assert.match(coreCss, /\.deadline-row\.is-pinned\s*{/);
  assert.match(
    coreCss,
    /\.deadline-row \.deadline-description\s*\{[^}]*-webkit-line-clamp:\s*2;/s,
  );
});
