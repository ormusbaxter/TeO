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
      "redoLastMutation",
      "hasUndoableMutation",
      "hasRedoableMutation",
      "clearUndoHistory",
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

// Löscht nacheinander die Mitarbeiter e1 … eN, jeden als eigenen Schritt.
async function loescheNacheinander(app, anzahl) {
  for (let i = 1; i <= anzahl; i += 1) {
    await app.commitStateMutation(
      () => {
        app.getState().employees = app.getState().employees.filter(
          (employee) => employee.id !== `e${i}`,
        );
      },
      { undo: `e${i} gelöscht` },
    );
  }
}

const ids = (app) => app.getState().employees.map((employee) => employee.id).join(",");

test("Zehn Schritte lassen sich nacheinander zurücknehmen, der elfte nicht", async () => {
  const mitarbeiter = Array.from({ length: 11 }, (_, i) => createEmployee(`e${i + 1}`));
  const app = await loadUndoApp(createMinimalState({ employees: mitarbeiter }));

  await loescheNacheinander(app, 11);
  assert.equal(ids(app), "");

  for (let i = 0; i < 10; i += 1) {
    assert.equal(await app.undoLastMutation(), true, `Schritt ${i + 1}`);
  }
  // Der älteste Schritt ist aus dem Verlauf gefallen: e1 bleibt gelöscht.
  assert.equal(ids(app), "e2,e3,e4,e5,e6,e7,e8,e9,e10,e11");
  assert.equal(app.hasUndoableMutation(), false);
});

test("Zurückgenommenes lässt sich wiederholen, in derselben Reihenfolge", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1"), createEmployee("e2")] }),
  );
  await loescheNacheinander(app, 2);
  await app.undoLastMutation();
  await app.undoLastMutation();
  assert.equal(ids(app), "e1,e2");
  assert.equal(app.hasRedoableMutation(), true);

  assert.equal(await app.redoLastMutation(), true);
  assert.equal(ids(app), "e2", "Zuerst kehrt die ältere Löschung zurück");
  assert.equal(await app.redoLastMutation(), true);
  assert.equal(ids(app), "");
  assert.equal(app.hasRedoableMutation(), false);

  // Das Wiederholte lässt sich erneut zurücknehmen.
  assert.equal(await app.undoLastMutation(), true);
  assert.equal(ids(app), "e2");
  assert.equal(
    app.getState().auditLog.map((entry) => entry.action).slice(0, 3).join(" | "),
    "Rückgängig gemacht: e2 gelöscht | Wiederholt: e2 gelöscht | Wiederholt: e1 gelöscht",
  );
});

test("Eine neue Änderung macht das Wiederholen hinfällig", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1"), createEmployee("e2")] }),
  );
  await loescheNacheinander(app, 1);
  await app.undoLastMutation();
  assert.equal(app.hasRedoableMutation(), true);

  await loescheNacheinander(app, 2);
  assert.equal(app.hasRedoableMutation(), false);
  assert.equal(await app.redoLastMutation(), false);
  assert.equal(app.hasUndoableMutation(), true, "Die neue Änderung selbst ist gemerkt");
});

test("Ein von außen geladener Bestand räumt den Verlauf ab", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1"), createEmployee("e2")] }),
  );
  await loescheNacheinander(app, 2);
  await app.undoLastMutation();
  assert.equal(app.hasUndoableMutation(), true);
  assert.equal(app.hasRedoableMutation(), true);

  // So rufen es Tab-Abgleich, Serverabgleich und Import auf: Ein gemerkter
  // Stand überschriebe sonst, was andere inzwischen geändert haben.
  app.clearUndoHistory();
  assert.equal(app.hasUndoableMutation(), false);
  assert.equal(app.hasRedoableMutation(), false);
});

test("Der Verlauf trägt kein Änderungsprotokoll mit", async () => {
  const app = await loadUndoApp(
    createMinimalState({ employees: [createEmployee("e1")] }),
  );
  await loescheNacheinander(app, 1);
  // Das Protokoll ist der größte Posten im Bestand und wird beim Zurücknehmen
  // ohnehin durch das aktuelle ersetzt.
  const gemerkt = app.getUndoHistory()[0].state;
  assert.equal("auditLog" in gemerkt, false);
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
  // Der ganze Bestand, nicht eine Liste einzelner Dateien: Eine neue Datei
  // mit „Rückgängig“ fiele sonst stillschweigend aus der Prüfung.
  const combined = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Diese Prüfung bleibt bewusst am Quelltext: Sie fragt nicht, wie eine
  // einzelne Aktion sich verhält, sondern ob im ganzen Bestand an Aktionen
  // eine vergessen wurde. Das lässt sich nicht an einem Beispiel zeigen.
  // Ausgenommen ist das Wiederholen: Es legt den Schritt selbst wieder auf den
  // Verlauf, ohne eigene Bezeichnung.
  const angeboten = [
    ...combined.matchAll(/(?<!function )showUndoToast\((?!`\$\{entry\.label\})/g),
  ].length;
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
