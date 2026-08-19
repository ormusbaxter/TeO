import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Auswahlzeilen lassen sich anklicken, ohne ihren Text zu markieren", async () => {
  const [styles, appSource] = await Promise.all([
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
  ]);

  // Auswahlkarten (Teilnehmer, Geräte, Mitarbeiter im Nachweis), einfache
  // Auswahlkästchen und die Auswahlspalte der Tabelle sind zum Anklicken da.
  assert.match(
    styles,
    /\.selection-card,\s*\.checkbox-field,\s*\.data-table \.selection-column \{\s*user-select: none;\s*-webkit-user-select: none;/,
  );

  // Beim Umschalt-Klick markiert der Browser sonst alles zwischen den beiden
  // Kästchen - die Zeilenauswahl war gemeint, nicht der Text.
  assert.match(
    appSource,
    /if \(event\.shiftKey\) window\.getSelection\(\)\?\.removeAllRanges\(\);/,
  );
});

test("Der Fließtext der Anwendung bleibt markierbar", async () => {
  const styles = await fs.readFile(path.join(projectRoot, "styles.css"), "utf8");

  // Keine pauschale Sperre auf Seite, Inhalt oder Karten - sonst ließe sich
  // kein Name und keine Nummer mehr herauskopieren.
  for (const selektor of ["body", ".main-content", ".view", ".panel", ".data-table"]) {
    const regel = new RegExp(
      `^\\${selektor.startsWith(".") ? "" : ""}${selektor.replace(".", "\\.")} \\{[^}]*user-select: none`,
      "m",
    );
    assert.doesNotMatch(styles, regel, `${selektor} sperrt die Markierung nicht`);
  }
});
