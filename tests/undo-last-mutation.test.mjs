import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Der zuletzt gemeldete Schritt lässt sich zurücknehmen", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Gemerkt wird erst, wenn gespeichert ist - und nur, wenn die Aenderung
  // eine Bezeichnung mitbringt. Jede andere Aenderung raeumt den Schritt ab.
  assert.match(
    appSource,
    /undoableMutation = undo \? \{ label: undo, state: previousState \} : null;/,
  );
  // Ein fremder Stand vom Server macht den Schnappschuss ungueltig.
  assert.match(
    appSource,
    /if \(pendingRemoteConflictState\) undoableMutation = null;/,
  );

  // Das Protokoll ueberlebt die Ruecknahme: Sonst verschwaende der
  // zurueckgenommene Schritt aus der Nachvollziehbarkeit.
  assert.match(
    appSource,
    /const auditLog = state\.auditLog;\s*state = snapshot;\s*state\.auditLog = auditLog;/,
  );
  assert.match(appSource, /auditAction: `Rückgängig gemacht: \$\{label\}`/);

  // Die Meldung mit Knopf steht laenger und nimmt Klicks an - die
  // Meldungsschicht selbst laesst sie durch.
  assert.match(appSource, /\}, action \? 9000 : 3400\);/);
  const styles = await fs.readFile(path.join(projectRoot, "styles.css"), "utf8");
  assert.match(styles, /\.toast:has\(\.toast-action\)\s*\{\s*pointer-events: auto;/);
});

test("Jede zurücknehmbare Änderung meldet sich auch als solche", async () => {
  const sources = await Promise.all(
    ["50-employees-trainings", "55-memos", "60-appointments-devices", "70-meetings-editor-actions", "20-ui-auth-admin"].map(
      (name) => fs.readFile(path.join(projectRoot, "src", "app", `${name}.js`), "utf8"),
    ),
  );
  const combined = sources.join("\n");

  const angeboten = [...combined.matchAll(/showUndoToast\(/g)].length;
  const gemerkt = [...combined.matchAll(/\{ undo: /g)].length;
  assert.equal(
    angeboten,
    gemerkt,
    "Wo „Rückgängig“ angeboten wird, ist der Schritt auch gemerkt worden",
  );
  assert.ok(angeboten >= 11, `Erwartet werden mindestens elf Stellen, gefunden: ${angeboten}`);

  // Das Löschen eines Mitarbeiters zieht Nachweise, Urlaube und Teilnahmen mit
  // - genau dafür ist der Schnappschuss da.
  assert.match(
    combined,
    /state\.employees = state\.employees\.filter[\s\S]*?\}, \{ undo: "Mitarbeiter gelöscht" \}\);/,
  );
  assert.match(
    combined,
    /\}, \{ undo: `Massenänderung an \$\{selectedEmployeeIds\.size\} Mitarbeitern` \}\);/,
  );
});
