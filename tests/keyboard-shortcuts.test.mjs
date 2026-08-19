import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function shortcutMap(appSource) {
  const block = appSource.match(/const VIEW_SHORTCUTS = \{([\s\S]*?)\};/);
  assert.ok(block, "VIEW_SHORTCUTS steht in app.js");
  return new Map(
    [...block[1].matchAll(/(\w+): "([a-z-]+)"/g)].map(([, key, view]) => [key, view]),
  );
}

test("Jede Ansicht hat ein eigenes Kürzel", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");
  const shortcuts = shortcutMap(appSource);

  const hashes = appSource.match(/const VIEW_HASHES = \{([\s\S]*?)\};/);
  const views = [...hashes[1].matchAll(/"?([a-z-]+)"?: "/g)].map(([, view]) => view);

  assert.deepEqual(
    [...shortcuts.values()].sort().join(","),
    [...views].sort().join(","),
    "Zu jeder Ansicht gehört genau ein Kürzel - und zu jedem Kürzel eine Ansicht",
  );
  assert.equal(
    new Set(shortcuts.keys()).size,
    shortcuts.size,
    "Kein Buchstabe führt zu zwei Ansichten",
  );
});

test("Die Übersicht im Dialog nennt dieselben Kürzel wie das Programm", async () => {
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);
  const shortcuts = shortcutMap(appSource);

  const listed = new Map(
    [
      ...indexHtml.matchAll(
        /<dt><kbd>g<\/kbd>\s*<kbd>([a-zä-ü])<\/kbd><\/dt>\s*<dd>([^<]+)<\/dd>/g,
      ),
    ].map(([, key, label]) => [key, label.trim()]),
  );

  assert.equal(
    listed.size,
    shortcuts.size,
    "Der Dialog listet genau die Kürzel, die es gibt",
  );

  // Und er nennt sie so, wie die Seitenleiste die Ansicht nennt: Eine
  // Uebersicht mit eigenen Bezeichnungen fuehrt in die Irre.
  for (const [key, view] of shortcuts) {
    const label = listed.get(key);
    assert.ok(label, `Der Dialog nennt „g ${key}“`);
    const navIndex = indexHtml.indexOf(`data-view="${view}"`);
    assert.ok(navIndex > 0, `Die Seitenleiste kennt die Ansicht ${view}`);
    assert.ok(
      indexHtml.slice(navIndex, navIndex + 260).includes(`<span>${label}</span>`),
      `„g ${key}“ heißt im Dialog „${label}“ - genau wie in der Seitenleiste`,
    );
  }
});

test("Die Kürzel treten zurück, wo Tasten schon vergeben sind", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // In der Erfassungsphase, damit der zweite Anschlag nach „g“ vor den
  // Eintragsbuchstaben des Urlaubsplaners liegt.
  assert.match(
    appSource,
    /document\.addEventListener\("keydown", handleGlobalShortcut, true\)/,
  );
  assert.match(
    appSource,
    /function keysBelongToTarget\(target\) \{\s*return isTextEntry\(target\) \|\| isVacationCell\(target\);/,
  );
  assert.match(
    appSource,
    /target\.closest\("\[data-vacation-employee\]\[data-vacation-date\]"\)/,
  );
  // Kein Kuerzel, solange die Anmeldung offen ist oder ein Dialog laeuft.
  assert.match(
    appSource,
    /function shortcutsAvailable\(event\)[\s\S]*?is-auth-locked[\s\S]*?dialog\[open\]/,
  );

  // Strg+Z gehoert in Eingabefeldern dem Browser.
  assert.match(
    appSource,
    /if \(isTextEntry\(event\.target\) \|\| !hasUndoableMutation\(\)\) return;/,
  );
});
