import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("Die Online-Hilfe enthält die beim Build eingebettete README", async () => {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const [indexHtml, appHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.html"), "utf8"),
  ]);

// app.html ist nur noch eine Weiterleitung, damit vorhandene Verknüpfungen
// weiter funktionieren – nicht mehr eine zweite 240-KB-Kopie der Anwendung.
assert.notEqual(appHtml, indexHtml);
assert.match(appHtml, /http-equiv="refresh" content="0; url=index\.html"/);
assert.match(appHtml, /<a href="index\.html">/);
assert.ok(
  appHtml.length < 1024,
  `app.html soll eine Weiterleitung bleiben, ist aber ${appHtml.length} Bytes groß`,
);
assert.doesNotMatch(
  appHtml,
  /<script/,
  "Ohne Skript funktioniert die Weiterleitung auch per Doppelklick und unter der CSP",
);

assert.match(indexHtml, /data-view-panel="help"/);
assert.match(indexHtml, /id="helpSearch"/);
assert.match(indexHtml, /id="helpSearchStatus"/);
assert.match(indexHtml, /data-help-section/);
assert.match(indexHtml, /data-help-nav-target/);
assert.match(indexHtml, /Datensicherung und Wiederherstellung/);
assert.match(indexHtml, /Häufig gestellte Fragen/);
assert.match(indexHtml, /Können mehrere Personen gleichzeitig mit derselben JSON-Datei arbeiten\?/);
assert.match(indexHtml, /verpflichtenden Startabgleich/);
assert.match(indexHtml, /Für den parallelen Betrieb an mehreren Arbeitsplätzen muss MariaDB/);
assert.match(indexHtml, /Datenschutz und IT-Sicherheit/);
assert.match(indexHtml, /<strong>Telefonliste drucken<\/strong>/);
assert.match(indexHtml, /id="hilfe-anderungshistorie">Änderungshistorie/);
assert.match(
  indexHtml,
  /<section class="help-section" data-help-section data-help-heading="hilfe-anderungshistorie">[\s\S]*?<li>/,
);
assert.match(indexHtml, /004\.017\.000/);
assert.match(indexHtml, /Termindruck ohne Pflichtfortbildungs-Jahresauswertung/);
assert.doesNotMatch(indexHtml, /Merge branch|Merge pull request|<code>[0-9a-f]{7}<\/code>/);
assert.doesNotMatch(indexHtml, /README_HELP_CONTENT/);
});
