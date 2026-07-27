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
  const indexHtml = await fs.readFile(
    path.join(projectRoot, "index.html"),
    "utf8",
  );

assert.match(indexHtml, /data-view-panel="help"/);
assert.match(indexHtml, /id="helpSearch"/);
assert.match(indexHtml, /id="helpSearchStatus"/);
assert.match(indexHtml, /data-help-section/);
assert.match(indexHtml, /data-help-nav-target/);
assert.match(indexHtml, /Datensicherung und Wiederherstellung/);
assert.match(indexHtml, /Häufige Fragen und Problemlösung/);
assert.match(indexHtml, /Datenschutz und IT-Sicherheit/);
assert.match(indexHtml, /<strong>Telefonliste drucken<\/strong>/);
assert.doesNotMatch(indexHtml, /README_HELP_CONTENT/);
});
