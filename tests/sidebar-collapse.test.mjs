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

test("Der Fuß der Seitenleiste hat eine eigene Minimalansicht", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Beschriftungen treten ab - die Schaltflächen des Kontos aber nicht, sonst
  // wären Benutzerverwaltung und Abmelden eingeklappt nicht mehr erreichbar.
  assert.match(styles, /\.user-session > div:not\(\.user-session-actions\),/);
  assert.match(styles, /\.sidebar-note > div\s*\n\s*\) \{\s*display: none;/);

  // Konto, Systemstatus und Namenszug stehen als gleich breite Kacheln
  // untereinander.
  assert.match(
    styles,
    /body\.is-sidebar-collapsed :is\(\.user-session, \.sidebar-system-status, \.sidebar-note\) \{\s*width: 100%;/,
  );
  assert.match(
    styles,
    /body\.is-sidebar-collapsed :is\(\.sidebar-system-status, \.sidebar-note\) \{\s*min-height: 44px;/,
  );

  // Was wegfällt, steht als Kurzhinweis am Block - eine Zeile je Angabe.
  assert.match(appSource, /function updateSidebarFooterSummaries\(/);
  assert.match(appSource, /`Angemeldet: \$\{name\}`/);
  assert.match(appSource, /\[\.\.\.status\.querySelectorAll\("dl > div"\)\]/);
  // Aufgeklappt verschwindet der Hinweis wieder.
  assert.match(
    appSource,
    /function setSidebarSummary\(element, collapsed, summary\) \{[\s\S]*?if \(!collapsed\) \{\s*element\.removeAttribute\("title"\);/,
  );

  // Der Systemstatus ändert sich auch ohne neuen Aufbau der Ansichten, das
  // Konto beim An- und Abmelden - beide ziehen den Hinweis nach.
  // Aufgerufen aus dem Umschalten, aus dem Systemstatus und aus der
  // Zugriffssteuerung; die Erklärung dahinter ist die Definition selbst.
  assert.ok(
    [...appSource.matchAll(/updateSidebarFooterSummaries\(/g)].length >= 4,
    "Der Hinweis wird an allen Stellen nachgezogen, an denen sich sein Inhalt ändert",
  );
});
