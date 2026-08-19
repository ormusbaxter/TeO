import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Strg wählt einzeln, Umschalt einen Bereich, ein Klick allein räumt ab", async () => {
  const app = await loadAppFunctions([
    "handleRecordSelectionClick",
    "selectedRecordIds",
    "clearRecordSelection",
  ]);
  const auswahl = () => app.selectedRecordIds("appointment").sort().join(",");

  // Ein gewöhnlicher Klick führt in die Schnellansicht - er beansprucht den
  // Klick nicht für die Auswahl.
  assert.equal(app.handleRecordSelectionClick("appointment", {}, "a1"), false);
  assert.equal(auswahl(), "");

  assert.equal(
    app.handleRecordSelectionClick("appointment", { ctrlKey: true }, "a1"),
    true,
    "Mit Strg gehört der Klick der Auswahl",
  );
  app.handleRecordSelectionClick("appointment", { ctrlKey: true }, "a2");
  assert.equal(auswahl(), "a1,a2");

  // Nochmals mit Strg nimmt wieder heraus.
  app.handleRecordSelectionClick("appointment", { ctrlKey: true }, "a1");
  assert.equal(auswahl(), "a2");

  // Ein gewöhnlicher Klick räumt eine bestehende Auswahl ab und führt
  // anschließend wie immer in die Schnellansicht.
  assert.equal(app.handleRecordSelectionClick("appointment", {}, "a3"), false);
  assert.equal(auswahl(), "");

  // Umschalt ohne Bezugspunkt in der gezeigten Liste wählt wenigstens den
  // angeklickten Eintrag.
  app.handleRecordSelectionClick("appointment", { shiftKey: true }, "a4");
  assert.equal(auswahl(), "a4");
  app.clearRecordSelection("appointment");
  assert.equal(auswahl(), "");
});

test("Jede Datenart bringt ihre Sammelaktionen mit", async () => {
  const app = await loadAppFunctions(["recordSelectionDefinitions"]);
  const definitionen = app.recordSelectionDefinitions();

  assert.deepEqual(
    Object.keys(definitionen).sort().join(","),
    "appointment,device,memo",
    "Termine, Memos und Geräte lassen sich mehrfach auswählen",
  );

  for (const [type, definition] of Object.entries(definitionen)) {
    const aktionen = definition.bulkActions(["x", "y"]).map((action) => action.label);
    assert.equal(aktionen.length, 3, `${type} bietet drei Sammelaktionen`);
    assert.ok(aktionen.includes("Löschen"), `${type} lässt sich sammelweise löschen`);
    assert.ok(
      definition.bulkActions(["x"]).at(-1).danger,
      "Löschen ist als gefährlich gekennzeichnet",
    );
  }
});

test("Sammelaktionen sind eine Änderung und lassen sich zurücknehmen", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Je Aktion genau ein commitStateMutation mit Bezeichnung fürs Zurücknehmen.
  for (const bezeichnung of [
    "Termine geändert",
    "Termine gelöscht",
    "Einträge geändert",
    "Einträge gelöscht",
    "Geräte geändert",
    "Geräte gelöscht",
    "Mitarbeiter gelöscht",
  ]) {
    assert.ok(
      appSource.includes(`{ undo: \`\${ids.length} ${bezeichnung}\` }`),
      `„${bezeichnung}“ lässt sich zurücknehmen`,
    );
  }
  // Gelöscht wird nie ohne Rückfrage.
  assert.match(appSource, /function deleteAppointments\(ids\) \{\s*requestConfirmation\(/);
  assert.match(appSource, /function deleteMemos\(ids\) \{\s*requestConfirmation\(/);
  assert.match(appSource, /function deleteEmployees\(ids\) \{[\s\S]*?requestConfirmation\(/);

  // Ein fremdes persönliches Memo bleibt auch bei einer Sammelaktion außen vor.
  assert.match(appSource, /if \(!ids\.includes\(memo\.id\) \|\| !memoVisibleToCurrentUser\(memo\)\) return;/);

  // Was die Liste nach ihrem Neuaufbau nicht mehr zeigt, gehört nicht mehr
  // zur Auswahl - abgeräumt wird aber nur dort, nicht beim Auswählen selbst.
  assert.match(
    appSource,
    /function refreshRecordSelection\(type\) \{[\s\S]*?if \(!visible\.has\(id\)\) selectedRecords\[type\]\.delete\(id\);/,
  );
});

test("Das Kontextmenü zeigt Einzel- oder Sammelaktionen", async () => {
  const [appSource, indexHtml, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.match(indexHtml, /<div\s+class="context-menu"\s+id="contextMenu"\s+role="menu"/);
  assert.match(styles, /\.context-menu \{[\s\S]*?position: fixed;/);

  // Mitarbeiterzeile und Karte führen in dieselbe Mechanik.
  assert.match(appSource, /function employeeContextMenuItems\(employeeId\)/);
  assert.match(appSource, /function recordContextMenuItems\(type, id\)/);
  // Mit mehreren Ausgewählten stehen die Sammelaktionen darin.
  assert.match(
    appSource,
    /if \(selection\.length > 1 && selection\.includes\(id\)\) \{\s*return \[\s*\.\.\.recordSelectionDefinitions\(\)\[type\]\.bulkActions/,
  );
  // Ein zweiter Rechtsklick baut das Menü neu auf, statt das alte stehen zu
  // lassen; Esc schließt es vor allem anderen.
  assert.match(appSource, /function handleContextMenuRequest\(event\) \{\s*closeContextMenu\(\);/);
  assert.match(appSource, /if \(event\.key !== "Escape" \|\| elements\.contextMenu\?\.hidden !== false\) return;/);
});
