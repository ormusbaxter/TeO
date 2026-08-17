import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Terminfilter und statusabhängige Beschäftigungsringe sind verdrahtet", async () => {
  const [appointmentHtml, appSource, coreCss] = await Promise.all([
    fs.readFile(
      path.join(projectRoot, "src/html/20-calendar-training-meeting-views.html"),
      "utf8",
    ),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/styles/00-core.css"), "utf8"),
  ]);

  assert.match(appointmentHtml, /id="appointmentSearch"/);
  for (const filter of ["all", "upcoming", "today", "past"]) {
    assert.match(appointmentHtml, new RegExp(`data-appointment-filter="${filter}"`));
  }
  assert.match(appSource, /function resetAppointmentFilters\(\)/);
  assert.match(appSource, /appointmentCategoryLabel\(appointment\)/);
  assert.match(appSource, /class="avatar avatar-status-\$\{status\}/);
  // Der Füllstand kommt aus den Daten und wird deshalb über dynamicStyle()
  // ausgegeben – style-Attribute blockiert die CSP des Servers.
  assert.match(
    appSource,
    /dynamicStyle\(\{ "--avatar-fill": `\$\{employmentPercent\}%` \}\)/,
  );
  assert.match(coreCss, /\.avatar-status-onboarding\s*{/);
  assert.match(coreCss, /\.avatar-status-inactive\s*{/);
  assert.match(coreCss, /background:\s*conic-gradient\(/);
});
