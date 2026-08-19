import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Der Desktop-Arbeitsplatz verbindet Schnellansicht und Datengrid", async () => {
  const [html, app, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Die Bauform teilt sich die Mitarbeitertabelle seit 4.44.0 mit den
  // Schnellansichten der uebrigen Datenarten.
  assert.match(
    html,
    /class="employee-workspace record-workspace"[\s\S]*?id="employeeInspector"/,
  );
  assert.match(app, /function selectEmployeeInspector\(employeeId\)/);
  assert.match(app, /data-resize-employee-column/);
  assert.match(app, /EMPLOYEE_COLUMN_ORDER_KEY/);
  assert.match(app, /EMPLOYEE_PINNED_COLUMN_KEY/);
  assert.match(styles, /\.column-resize-handle/);
  assert.match(styles, /\.employee-table \.is-pinned-column/);
});

test("Arbeitsliste, Verlauf und Dashboard-Anpassung sind lokal verdrahtet", async () => {
  const [html, app] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
  ]);

  assert.match(html, /id="dashboardWorkQueue"/);
  assert.match(html, /id="dashboardLayoutDialog"/);
  assert.match(app, /const WORKSPACE_HISTORY_KEY = "teo-workspace-history-v1"/);
  assert.match(app, /const WORKSPACE_FAVORITES_KEY = "teo-workspace-favorites-v1"/);
  assert.match(app, /const WORKSPACE_COMMANDS_KEY = "teo-workspace-commands-v1"/);
  assert.match(app, /function workspaceCommandPaletteEntries\(\)/);
  assert.match(app, /function renderDashboardWorkQueue\(\)/);
  assert.match(app, /function applyDashboardLayout\(\)/);
  assert.match(app, /workspaceCommandPaletteEntries\(\), commandPaletteViews\(\)/);
  assert.match(html, /id="commandPalettePreview"/);
});

test("Seltene Mitarbeiteraktionen stehen in einem Mehr-Menü", async () => {
  const html = await fs.readFile(path.join(projectRoot, "index.html"), "utf8");
  assert.match(html, /<details class="action-menu" id="employeeMoreActions">/);
  assert.match(html, /id="openCatalogManagementButton"[\s\S]*?id="exportEmployeePhoneListButton"/);
});

test("Änderungshistorie und feststehende Namensspalte bleiben lesbar", async () => {
  const [changelog, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "CHANGELOG.md"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Die neueste Fassung steht oben, jede aeltere darunter - geprueft wird die
  // Reihenfolge selbst, nicht eine feste Liste von Fassungen.
  const fassungen = [...changelog.matchAll(/^### (\d+)\.(\d+)\.(\d+)/gm)].map(
    ([, major, minor, patch]) => [Number(major), Number(minor), Number(patch)],
  );
  assert.ok(fassungen.length >= 5, "Das Verzeichnis nennt mehrere Fassungen");
  for (let index = 1; index < fassungen.length; index += 1) {
    const vorher = fassungen[index - 1];
    const jetzt = fassungen[index];
    assert.ok(
      vorher.join(".") !== jetzt.join("."),
      `Die Fassung ${jetzt.join(".")} steht doppelt im Verzeichnis`,
    );
    assert.ok(
      vorher[0] > jetzt[0] ||
        (vorher[0] === jetzt[0] && vorher[1] > jetzt[1]) ||
        (vorher[0] === jetzt[0] && vorher[1] === jetzt[1] && vorher[2] > jetzt[2]),
      `Die Fassung ${jetzt.join(".")} steht vor der aelteren ${vorher.join(".")}`,
    );
  }
  assert.match(
    styles,
    /\.employee-table :is\(th, td\)\[data-column="name"\] \{[\s\S]*?width: var\(--employee-column-width, 250px\);/,
  );
  assert.match(
    styles,
    /\.employee-table :is\(th, td\)\[data-column\] \{\s*width: var\(--employee-column-width\);/,
  );
});
