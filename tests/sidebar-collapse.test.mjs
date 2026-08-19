import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Seitenleiste laesst sich auf die Symbole einklappen", async () => {
  const [appSource, indexHtml, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Die Schaltflaeche sitzt neben dem Namenszug und sagt Vorleseprogrammen,
  // welchen Bereich sie steuert und ob er offen steht.
  assert.match(
    indexHtml,
    /<button\s+class="sidebar-toggle"\s+id="sidebarToggle"[^>]*aria-controls="mainNav"[^>]*aria-expanded="true"/s,
    "Der Umschalter steuert die Hauptnavigation und meldet seinen Zustand",
  );

  // Eingeklappt bleibt eine schmale Spur; die Breite steht an einer Stelle,
  // damit Raster und Leiste nicht auseinanderlaufen.
  assert.match(
    styles,
    /body\.is-sidebar-collapsed\s*\{\s*--sidebar-width: 76px;\s*\}/,
    "Der eingeklappte Zustand setzt die Breite der Seitenleiste neu",
  );
  assert.match(
    styles,
    /body\.is-sidebar-collapsed :is\(\s*\.brand-text,\s*\.nav-item span,/s,
    "Alle Beschriftungen der Seitenleiste treten eingeklappt ab",
  );
  assert.match(
    styles,
    /body\.is-sidebar-collapsed :is\(\.nav-item, \.nav-order-reset\)\s*\{[^}]*grid-template-columns: 22px;/s,
    "Eingeklappt bleibt vom Menuepunkt die Spalte mit dem Symbol",
  );

  // Der Zustand ist eine persoenliche Vorliebe und liegt im Browserprofil.
  assert.match(appSource, /const SIDEBAR_COLLAPSE_KEY = "teo-sidebar-collapsed-v1";/);
  assert.match(
    appSource,
    /function toggleSidebarCollapsed\(\)[\s\S]*?localStorage\.setItem\(\s*SIDEBAR_COLLAPSE_KEY,/,
    "Ein Klick merkt sich den Zustand",
  );
  assert.match(
    appSource,
    /function bindSidebarCollapse\(\)[\s\S]*?applySidebarCollapsed\(readStoredSidebarCollapsed\(\)\)/,
    "Beim Start gilt der gespeicherte Zustand",
  );
  assert.match(appSource, /bindSidebarCollapse\(\);/);

  // Ohne Beschriftung traegt der Kurzhinweis den Namen samt Zaehler nach,
  // und der Zaehler aendert sich mit dem Datenbestand.
  assert.match(
    appSource,
    /item\.title = count \? `\$\{label\} \(\$\{count\}\)` : label;/,
  );
  assert.match(appSource, /updateSidebarCollapsedLabels\(\);/);
});
