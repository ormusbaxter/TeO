import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const VIEWS = ["employees", "appointments", "memos", "devices", "device-management"];

test("Jede gefilterte Ansicht hat eine Leiste für ihre aktiven Filter", async () => {
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  for (const view of VIEWS) {
    assert.ok(
      indexHtml.includes(`data-filter-chips="${view}"`),
      `Die Ansicht ${view} trägt eine Chip-Leiste`,
    );
    assert.ok(
      appSource.includes(`renderViewFilterChips("${view}")`),
      `Die Ansicht ${view} baut ihre Chips beim Aufbau mit auf`,
    );
  }

  // Die Beschreibung der Bedienelemente deckt genau diese Ansichten ab.
  const beschrieben = [
    ...appSource
      .match(/function viewFilterControls\(\) \{\s*return \{([\s\S]*?)\n {4}\};\n {2}\}/)[1]
      .matchAll(/^ {6}"?([a-z-]+)"?: \[/gm),
  ].map(([, view]) => view);
  assert.deepEqual(beschrieben.sort().join(","), [...VIEWS].sort().join(","));
});

test("Ein Chip entfernt seinen Filter über das vorhandene Bedienelement", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Kein zweiter Ort für Filterzustände: Zum Entfernen wird dasselbe Ereignis
  // ausgelöst, das auch eine Bedienung von Hand erzeugt.
  assert.match(
    appSource,
    /function clearViewFilter\(control\) \{[\s\S]*?\.click\(\);[\s\S]*?dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\);[\s\S]*?dispatchEvent\(new Event\("change", \{ bubbles: true \}\)\);/,
  );

  // Die Beschriftung kommt aus dem Bedienelement selbst - gewählte Zeile,
  // gedrückte Schaltfläche oder Eingetipptes.
  assert.match(appSource, /select\.selectedOptions\[0\]\?\.textContent\.trim\(\)/);
  assert.match(appSource, /if \(control\.kind === "search"\) return control\.element\?\.value\.trim\(\)/);
});

test("Eine gemerkte Ansicht überlebt den Neustart", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  assert.match(appSource, /const VIEW_FILTER_KEY = "teo-view-filters-v1";/);
  assert.match(
    appSource,
    /stored\[view\] = controls\.map\(\(control\) => viewFilterValue\(control\)\);/,
  );
  // Wiederhergestellt wird erst nach dem ersten Aufbau: Vorher stehen in den
  // Auswahlfeldern weder Berufe noch Kategorien.
  assert.match(
    appSource,
    /renderAll\(\);[\s\S]{0,220}restoreRememberedViewFilters\(\);/,
  );
  // Ein entfallener Beruf darf die Wiederherstellung nicht sprengen.
  assert.match(
    appSource,
    /if \(control\.kind === "select" && !control\.element\.querySelector\(`option\[value="\$\{value\}"\]`\)\) \{\s*\/\/[^\n]*\n\s*return;/,
  );
});
