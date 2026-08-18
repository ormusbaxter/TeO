import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Der Seitenkopf ist eine klebende Karte und klappt beim Blättern ein", async () => {
  const [appSource, indexHtml, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Jede Ansicht bringt den Textblock mit, an dem der eingeklappte Zustand
  // haengt - sonst bliebe ihr Kopf beim Blaettern in voller Hoehe stehen.
  const views = indexHtml.match(/<section[^>]*class="view[^"]*"/g) ?? [];
  const headerTexts = indexHtml.match(/<div class="page-header-text">/g) ?? [];
  assert.equal(headerTexts.length, views.length);

  assert.match(
    styles,
    /\.page-header\s*\{[^}]*position: sticky;[^}]*border-radius: var\(--radius-lg\);/s,
  );
  assert.match(
    styles,
    /\.page-header\.is-stuck\s*\{[^}]*backdrop-filter: blur\(14px\);/s,
  );
  // Bereichszeile und Beschreibung treten im eingeklappten Zustand ab.
  assert.match(
    styles,
    /\.page-header\.is-stuck \.eyebrow > span,\s*\.page-header\.is-stuck \.page-subtitle\s*\{\s*display: none;/s,
  );

  assert.match(appSource, /function updateStickyHeader\(\)/);
  assert.match(appSource, /classList\.toggle\(\s*"is-stuck"/s);
  assert.match(
    appSource,
    /addEventListener\("scroll", requestStickyHeaderUpdate, \{ passive: true \}\)/,
  );
});
