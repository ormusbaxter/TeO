import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Meldungen holen ihre Farben aus Farbmarken statt aus festen Werten", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Die Art der Meldung steht als Klasse am Element, die Farbe kommt aus dem
  // Stylesheet - vorher wurden Symbolfarben im Programmcode gesetzt.
  assert.match(appSource, /toast is-\$\{/);
  assert.doesNotMatch(appSource, /toast-icon"\)\.style\./);

  assert.match(
    styles,
    /\.toast\s*\{[^}]*color: var\(--toast-text\);[^}]*background: var\(--toast-surface\);/s,
  );
  assert.match(
    styles,
    /\.toast\.is-error \.toast-icon\s*\{[^}]*color: var\(--toast-error-icon\);/s,
  );
  assert.match(
    styles,
    /\.toast\.is-warning \.toast-icon\s*\{[^}]*color: var\(--toast-warning-icon\);/s,
  );

  // Diese Schemata kehren --navy-900 zu einer hellen Marke um. Ohne eigene
  // Flaeche stuende weisse Schrift auf hellem Grund.
  for (const theme of [
    "dark",
    "nord",
    "dracula",
    "gruvbox-dark",
    "tokyo-night",
    "catppuccin-latte",
    "solarized-light",
  ]) {
    assert.match(
      styles,
      new RegExp(`html\\[data-theme="${theme}"\\][^{]*\\{[^}]*--toast-surface:`, "s"),
      `Dem Schema ${theme} fehlt eine eigene Meldungsfläche.`,
    );
  }
});
