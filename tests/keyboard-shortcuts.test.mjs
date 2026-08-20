import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Ein Tastenereignis, wie der Browser es liefert - mit den Feldern, die
// handleGlobalShortcut tatsächlich liest.
function keyEvent(key, { timeStamp = 1000, target, ...rest } = {}) {
  return {
    key,
    timeStamp,
    target,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    defaultPrevented: false,
    isComposing: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {},
    ...rest,
  };
}

async function loadShortcutApp() {
  const app = await loadAppFunctions(
    ["handleGlobalShortcut", "hasUndoableMutation", "commitStateMutation"],
    { withDom: true },
  );
  app.setDataStore({
    async setItem(_key, value) {
      return value;
    },
    async getItem() {
      return null;
    },
  });
  app.setState(createMinimalState());
  // Kein offener Dialog: Der Ersatz erfände sonst für jede Abfrage ein
  // Element, und die Kürzel hielten sich für blockiert.
  app.dom.setQuery("dialog[open]", null);
  app.setActiveView("dashboard");
  return app;
}

test("„g“ und ein Buchstabe wechseln die Ansicht", async () => {
  const app = await loadShortcutApp();
  const body = new app.HTMLElement({ tagName: "BODY" });

  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 1000, target: body }));
  app.handleGlobalShortcut(keyEvent("m", { timeStamp: 1100, target: body }));
  assert.equal(app.getActiveView(), "employees");

  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 2000, target: body }));
  app.handleGlobalShortcut(keyEvent("p", { timeStamp: 2100, target: body }));
  assert.equal(app.getActiveView(), "vacations");

  // Wer sich nach „g“ vertippt, landet nirgends - und der nächste Anschlag
  // zählt wieder als gewöhnliche Taste.
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 3000, target: body }));
  app.handleGlobalShortcut(keyEvent("x", { timeStamp: 3100, target: body }));
  assert.equal(app.getActiveView(), "vacations");

  // Nach anderthalb Sekunden ist „g“ verfallen.
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 4000, target: body }));
  app.handleGlobalShortcut(keyEvent("t", { timeStamp: 6000, target: body }));
  assert.equal(app.getActiveView(), "vacations");
});

test("Die Kürzel ruhen, wo die Tastatur schon vergeben ist", async () => {
  const app = await loadShortcutApp();
  const body = new app.HTMLElement({ tagName: "BODY" });

  // Im Eingabefeld: „g m“ schreibt, es wechselt nicht.
  const eingabefeld = new app.HTMLElement({ tagName: "INPUT" });
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 1000, target: eingabefeld }));
  app.handleGlobalShortcut(keyEvent("m", { timeStamp: 1100, target: eingabefeld }));
  assert.equal(app.getActiveView(), "dashboard");

  // In einer Zelle des Urlaubsplaners stehen einzelne Buchstaben für
  // Eintragsarten. Ein eingeleitetes „g“ hat dort aber Vorrang - wer „g“
  // getippt hat, meint einen Ansichtswechsel.
  const zelle = new app.HTMLElement({
    dataset: { vacationEmployee: "e1", vacationDate: "2026-03-02" },
  });
  app.handleGlobalShortcut(keyEvent("n", { timeStamp: 2000, target: zelle }));
  assert.equal(app.getActiveView(), "dashboard");
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 3000, target: body }));
  app.handleGlobalShortcut(keyEvent("m", { timeStamp: 3100, target: zelle }));
  assert.equal(app.getActiveView(), "employees");

  // Solange die Anmeldung aussteht, ruhen die Kürzel ganz.
  app.dom.document.body.classList.add("is-auth-locked");
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 4000, target: body }));
  app.handleGlobalShortcut(keyEvent("t", { timeStamp: 4100, target: body }));
  assert.equal(app.getActiveView(), "employees");
  app.dom.document.body.classList.remove("is-auth-locked");

  // Und ebenso, solange ein Dialog offen steht.
  app.dom.setQuery("dialog[open]", new app.HTMLElement({ tagName: "DIALOG" }));
  app.handleGlobalShortcut(keyEvent("g", { timeStamp: 5000, target: body }));
  app.handleGlobalShortcut(keyEvent("t", { timeStamp: 5100, target: body }));
  assert.equal(app.getActiveView(), "employees");
});

test("Strg + Z nimmt zurück - außerhalb von Eingabefeldern", async () => {
  const app = await loadShortcutApp();
  app.setState(createMinimalState({ trainings: [] }));
  await app.commitStateMutation(
    () => {
      app.getState().trainings = [
        { id: "t1", title: "Reanimation", createdAt: "", updatedAt: "" },
      ];
    },
    { undo: "Fortbildung angelegt" },
  );
  assert.equal(app.hasUndoableMutation(), true);

  // Im Eingabefeld gehört Strg + Z dem Browser und seinem Eingabeverlauf.
  const eingabefeld = new app.HTMLElement({ tagName: "TEXTAREA" });
  app.handleGlobalShortcut(
    keyEvent("z", { ctrlKey: true, target: eingabefeld }),
  );
  assert.equal(app.hasUndoableMutation(), true, "Der gemerkte Schritt steht noch");
  assert.equal(app.getState().trainings.length, 1);

  const body = new app.HTMLElement({ tagName: "BODY" });
  app.handleGlobalShortcut(keyEvent("z", { ctrlKey: true, target: body }));
  // Die Rücknahme läuft asynchron an; ein Durchlauf der Ereignisschlange
  // genügt, damit sie abgeschlossen ist.
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(app.getState().trainings.length, 0, "Die Fortbildung ist wieder weg");
});

test("Die Übersicht im Dialog nennt dieselben Kürzel wie das Programm", async () => {
  // Diese Prüfung bleibt am Markup: Sie gleicht drei Orte gegeneinander ab -
  // Kürzeltabelle, Dialog und Seitenleiste. Ein Verhaltenstest sähe immer nur
  // einen davon.
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  const block = appSource.match(/const VIEW_SHORTCUTS = \{([\s\S]*?)\};/);
  assert.ok(block, "VIEW_SHORTCUTS steht in app.js");
  const shortcuts = new Map(
    [...block[1].matchAll(/(\w+): "([a-z-]+)"/g)].map(([, key, view]) => [key, view]),
  );

  const hashes = appSource.match(/const VIEW_HASHES = \{([\s\S]*?)\};/);
  const views = [...hashes[1].matchAll(/"?([a-z-]+)"?: "/g)].map(([, view]) => view);
  assert.equal(
    [...shortcuts.values()].sort().join(","),
    [...views].sort().join(","),
    "Zu jeder Ansicht gehört genau ein Kürzel - und zu jedem Kürzel eine Ansicht",
  );

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
  // Übersicht mit eigenen Bezeichnungen führt in die Irre.
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
