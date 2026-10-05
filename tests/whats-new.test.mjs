import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PROJECT_META, projectBuildNumber } from "../src/meta/project-meta.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Der Hinweis auf die neue Fassung erscheint einmal je Fassung", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  assert.match(appSource, /const LAST_SEEN_VERSION_KEY = "teo-last-seen-version-v1";/);
  // Gleiche Fassung: nichts zu melden.
  assert.match(appSource, /if \(lastSeen === version\) return false;/);
  // Erster Start überhaupt: nur merken, kein Hinweis auf Änderungen gegenüber
  // einer Fassung, die dieser Arbeitsplatz nie benutzt hat.
  assert.match(
    appSource,
    /rememberSeenVersion\(version\);\s*if \(!lastSeen\) return false;/,
  );

  // Die Sperre fällt an genau einer Stelle, am Ende der Anmeldung - seit der
  // Datenbestand vor ihr geladen wird, gibt es keinen zweiten Weg mehr.
  assert.equal(
    [...appSource.matchAll(/showWhatsNewIfUpdated\(\);/g)].length,
    1,
    "Der Hinweis hängt an der Stelle, an der die Sperre fällt",
  );
});

test("Der Hinweis zeigt den Abschnitt aus der eingebetteten Hilfe", async () => {
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  // Kein zweiter Text: Der Abschnitt wird aus dem Änderungsverzeichnis der
  // Hilfe übernommen.
  assert.match(
    appSource,
    /const headings = \[\.\.\.[\w.()]*\.querySelectorAll\("\.help-section h3"\)\];/,
  );
  assert.match(
    appSource,
    /const heading = headings\.find\(\(item\) => item\.textContent\.trim\(\)\.startsWith\(version\)\)/,
  );

  // Und die Hilfe trägt tatsächlich einen Abschnitt für die laufende Fassung -
  // sonst bliebe der Hinweis stumm.
  const version = projectBuildNumber(PROJECT_META);
  const abschnitt = new RegExp(
    `<h3 id="hilfe-[^"]*">${version.replaceAll(".", "\\.")} [^<]*</h3>\\s*<ul>`,
  );
  assert.match(indexHtml, abschnitt, `Die Hilfe kennt den Abschnitt ${version}`);

  // Der Weg zur ganzen Liste führt in die Hilfe.
  assert.match(appSource, /showView\("help"\);[\s\S]{0,160}#hilfe-anderungshistorie/);
});
