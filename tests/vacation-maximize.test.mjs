import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Urlaubsplanung besitzt ein fensterfüllendes Tabellen-Widget", async () => {
  const [indexHtml, appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.match(indexHtml, /id="vacationPlannerWidget"/);
  assert.match(indexHtml, /id="toggleVacationPlannerMaximizeButton"/);
  assert.match(indexHtml, /aria-controls="vacationPlanner"/);
  assert.match(appSource, /function setVacationPlannerMaximized\(maximized\)/);
  assert.match(
    appSource,
    /document\.body\.append\(widget\)/,
    "Das maximierte Widget muss den transformierten Ansichtsbereich verlassen",
  );
  assert.match(
    appSource,
    /vacationPlannerWidgetAnchor\.parentNode\?\.insertBefore/,
    "Beim Verkleinern muss das Widget an seine ursprüngliche Stelle zurückkehren",
  );
  assert.match(appSource, /event\.key !== "Escape"/);
  assert.match(
    styles,
    /\.vacation-planner-panel\.is-maximized\s*\{[^}]*position: fixed;[^}]*inset: clamp\(6px, 1\.2vw, 18px\);[^}]*display: flex;/s,
  );
  assert.match(
    styles,
    /\.vacation-planner-panel\.is-maximized \.vacation-table-scroll\s*\{[^}]*max-height: none;[^}]*flex: 1 1 auto;/s,
  );
});
