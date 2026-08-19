import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Palette wertet Treffer am Wortanfang am höchsten", async () => {
  const app = await loadAppFunctions(["commandPaletteRank", "searchKey"]);
  // Die Palette reicht den Suchbegriff bereits aufbereitet weiter - genau so
  // treffen sich Eingabe und Beschriftung ungeachtet ihrer Schreibweise.
  const rank = (entry, query) => app.commandPaletteRank({ ...entry }, app.searchKey(query));

  const eintrag = { label: "Sicherung exportieren", hint: "", keywords: "Backup speichern" };

  assert.equal(rank(eintrag, ""), 0, "Ohne Eingabe zählt jeder Eintrag gleich");
  assert.equal(rank(eintrag, "sicherung"), 0, "Der Anfang des Namens steht vorn");
  assert.equal(rank(eintrag, "exportieren"), 1, "Weiter hinten im Namen folgt danach");
  assert.equal(rank(eintrag, "backup"), 2, "Zusatzwörter zählen zuletzt");
  assert.equal(rank(eintrag, "urlaub"), -1, "Was nicht passt, fällt heraus");

  // Die Palette sucht wie der Rest der Anwendung: nachsichtig gegenüber
  // Umlauten, „ß“ und Akzenten.
  const person = { label: "Jonas Weiß", hint: "Pflegefachkraft", keywords: "" };
  assert.equal(rank(person, "weiß"), 1, "Der Name findet sich in seiner eigenen Schreibweise");
  assert.equal(rank(person, "weiss"), 1, "… und mit doppeltem s");
  assert.equal(rank(person, "weis"), 1, "„ß“ findet sich auch mit einfachem s");
  const geraet = { label: "Gerätewagen", hint: "", keywords: "" };
  assert.equal(rank(geraet, "geratewagen"), 0, "Umlaute lassen sich weglassen");
  assert.equal(rank(geraet, "geraetewagen"), 0, "… oder ausschreiben");
});

test("Die Palette findet Ansichten, Aktionen und Datensätze", async () => {
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  assert.match(
    indexHtml,
    /<dialog class="command-palette" id="commandPalette"[\s\S]*?role="combobox"[\s\S]*?role="listbox"/,
    "Das Feld meldet sich als Auswahlfeld, die Trefferliste als Liste",
  );
  // Der Einstieg steht sichtbar in der Seitenleiste - ein Kürzel allein bliebe
  // unentdeckt.
  assert.match(indexHtml, /class="sidebar-search"\s+id="openCommandPaletteButton"/);

  assert.match(
    appSource,
    /if \(\(event\.ctrlKey \|\| event\.metaKey\) && event\.key\.toLowerCase\(\) === "k"\) \{\s*event\.preventDefault\(\);\s*openCommandPalette\(\);/,
  );

  // Ohne Eingabe stehen nur Ansichten und Aktionen bereit.
  assert.match(appSource, /if \(query\) groups\.push\(commandPaletteRecords\(\)\);/);

  // Die Datensätze entstehen je Änderung einmal, nicht bei jedem Tastendruck.
  assert.match(
    appSource,
    /commandPaletteRecordCache\.sequence === stateMutationSequence &&\s*commandPaletteRecordCache\.userId === \(currentUser\?\.id \|\| ""\)/,
  );

  for (const collection of [
    "state.employees",
    "state.appointments",
    "state.memos",
    "state.trainings",
    "state.meetings",
    "state.devices",
  ]) {
    assert.ok(
      appSource.includes(`...${collection}`),
      `Die Palette durchsucht ${collection}`,
    );
  }
});

test("Die Palette zeigt nur, was das angemeldete Konto sehen darf", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Ein fremdes persoenliches Memo darf auch ueber die Palette nicht auftauchen.
  assert.match(
    appSource,
    /\.\.\.state\.memos\s*\.filter\(\(memo\) => memoVisibleToCurrentUser\(memo\)\)/,
  );

  // Protokoll und Benutzerverwaltung bleiben den Administratoren vorbehalten.
  assert.match(
    appSource,
    /if \(isAdmin\(\)\) \{\s*entries\.push\([\s\S]*?Änderungsprotokoll[\s\S]*?Benutzerverwaltung[\s\S]*?\);\s*\}/,
  );
});
