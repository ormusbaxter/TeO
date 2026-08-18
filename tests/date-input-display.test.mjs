import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Datumsfelder zeigen während der Eingabe die eigene Segmentanzeige", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Ein unvollstaendiges Datum hat einen leeren Wert - die eigene Anzeige
  // stuende deshalb waehrend des Tippens auf dem Platzhalter.
  assert.match(appSource, /const displayValue = formattedValue \|\| "TT\.MM\.JJJJ";/);

  assert.match(
    styles,
    /\.formatted-date-shell \.formatted-date-input:focus\s*\{[^}]*color: var\(--slate-800\) !important;/s,
  );
  assert.match(
    styles,
    /\.formatted-date-input:focus::-webkit-datetime-edit\s*\{[^}]*color: inherit;/s,
  );
  assert.match(
    styles,
    /\.formatted-date-shell:focus-within \.formatted-date-display\s*\{\s*display: none;\s*\}/s,
  );
});
