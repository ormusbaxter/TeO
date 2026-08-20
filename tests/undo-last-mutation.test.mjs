import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Speichern ohne Browser: Der Ersatz nimmt an, was die Anwendung ablegt, und
// verrät dem Test, wie oft geschrieben wurde.
function createDataStoreStub() {
  const written = new Map();
  return {
    written,
    async setItem(key, value) {
      written.set(key, value);
      return value;
    },
    async getItem(key) {
      return written.has(key) ? written.get(key) : null;
    },
  };
}

async function loadUndoApp(state) {
  const app = await loadAppFunctions(
    [
      "commitStateMutation",
      "undoLastMutation",
      "hasUndoableMutation",
      "describeMutation",
    ],
    { withDom: true },
  );
  app.setDataStore(createDataStoreStub());
  app.setState(state);
  return app;
}

test("Ein gemerkter Schritt stellt den Stand davor wieder her", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1"), createEmployee("e2")] }),
  );

  assert.equal(app.hasUndoableMutation(), false, "Am Anfang gibt es nichts zurückzunehmen");

  const committed = await app.commitStateMutation(
    () => {
      app.getState().employees = app.getState().employees.filter(
        (employee) => employee.id !== "e2",
      );
    },
    { undo: "Mitarbeiter gelöscht" },
  );

  assert.equal(committed, true);
  assert.equal(app.getState().employees.length, 1);
  assert.equal(app.hasUndoableMutation(), true);

  assert.equal(await app.undoLastMutation(), true);
  // Verglichen wird über eine Zeichenkette: Die Listen entstehen im
  // vm-Kontext der Anwendung und tragen dessen Array-Prototyp, an dem sich
  // ein strenger Tiefenvergleich stößt.
  assert.equal(
    app.getState().employees.map((employee) => employee.id).join(","),
    "e1,e2",
    "Der gelöschte Mitarbeiter ist wieder da",
  );

  // Ein zweites Zurücknehmen hat keinen Stand mehr - sonst ließe sich die
  // Rücknahme selbst zurücknehmen und der Bestand pendelte.
  assert.equal(app.hasUndoableMutation(), false);
  assert.equal(await app.undoLastMutation(), false);
});

test("Die Rücknahme löscht ihre eigene Geschichte nicht", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1")] }),
  );

  await app.commitStateMutation(
    () => {
      app.getState().employees = [];
    },
    { undo: "Mitarbeiter gelöscht" },
  );
  await app.undoLastMutation();

  // Beide Zeilen stehen im Protokoll, die jüngere zuerst: Was verschwand und
  // wiederkam, bleibt nachvollziehbar.
  assert.equal(
    app.getState().auditLog.map((entry) => entry.action).join(" | "),
    "Rückgängig gemacht: Mitarbeiter gelöscht | Mitarbeiter: 1 Eintrag/Einträge gelöscht",
  );
});

test("Ohne Bezeichnung verfällt der gemerkte Schritt", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1")] }),
  );

  await app.commitStateMutation(
    () => {
      app.getState().employees = [];
    },
    { undo: "Mitarbeiter gelöscht" },
  );
  assert.equal(app.hasUndoableMutation(), true);

  // Eine Änderung ohne Bezeichnung räumt den Schritt ab. Sonst spränge das
  // Zurücknehmen über sie hinweg und nähme etwas zurück, das der Bediener
  // längst nicht mehr im Sinn hat.
  await app.commitStateMutation(() => {
    app.getState().trainings = [
      { id: "t1", title: "Reanimation", createdAt: "", updatedAt: "" },
    ];
  });
  assert.equal(app.hasUndoableMutation(), false);
  assert.equal(await app.undoLastMutation(), false);
  assert.equal(app.getState().employees.length, 0, "Der Bestand bleibt, wie er ist");
});

test("Die Beschreibung benennt die geänderte Sammlung", async () => {
  const app = await loadUndoApp(createMinimalState());
  const vorher = createMinimalState({ employees: [createEmployee("e1")] });

  assert.equal(
    app.describeMutation(vorher, createMinimalState({ employees: [] })),
    "Mitarbeiter: 1 Eintrag/Einträge gelöscht",
  );
  assert.equal(
    app.describeMutation(createMinimalState(), vorher),
    "Mitarbeiter: 1 Eintrag/Einträge hinzugefügt",
  );

  const geaendert = createMinimalState({
    employees: [{ ...createEmployee("e1"), phone: "+49 000 1000 0000" }],
  });
  assert.equal(app.describeMutation(vorher, geaendert), "Mitarbeiter geändert");

  // Gleicher Inhalt in anderer Feldreihenfolge ist keine Änderung - der
  // Vergleich läuft über Werte, nicht über Text.
  const gedreht = createMinimalState({
    employees: [
      Object.fromEntries(Object.entries(createEmployee("e1")).reverse()),
    ],
  });
  assert.equal(app.describeMutation(vorher, gedreht), "Datenbestand aktualisiert");
});

test("Jede zurücknehmbare Änderung meldet sich auch als solche", async () => {
  const sources = await Promise.all(
    [
      "50-employees-trainings",
      "55-memos",
      "60-appointments-devices",
      "70-meetings-editor-actions",
      "20-ui-auth-admin",
      "41-drag-and-drop",
    ].map((name) =>
      fs.readFile(path.join(projectRoot, "src", "app", `${name}.js`), "utf8"),
    ),
  );
  const combined = sources.join("\n");

  // Diese Prüfung bleibt bewusst am Quelltext: Sie fragt nicht, wie eine
  // einzelne Aktion sich verhält, sondern ob im ganzen Bestand an Aktionen
  // eine vergessen wurde. Das lässt sich nicht an einem Beispiel zeigen.
  const angeboten = [...combined.matchAll(/showUndoToast\(/g)].length;
  const gemerkt = [...combined.matchAll(/\{ undo: /g)].length;
  assert.equal(
    angeboten,
    gemerkt,
    "Wo „Rückgängig“ angeboten wird, ist der Schritt auch gemerkt worden",
  );
  assert.ok(
    angeboten >= 11,
    `Erwartet werden mindestens elf Stellen, gefunden: ${angeboten}`,
  );
});
