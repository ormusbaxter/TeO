import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { REQUIRED_COLLECTIONS } from "../src/shared/state-schema.mjs";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Das Aenderungsprotokoll wird in shouldRemindBeforeUnload gesondert
// ausgewertet und gehoert deshalb nicht in die Liste der nachverfolgten
// Sammlungen.
const COLLECTIONS_WITHOUT_TRACKING = ["auditLog"];

test("Jede Sammlung des Datenvertrags wird nachverfolgt", async () => {
  const app = await loadAppFunctions([
    "TRACKED_COLLECTIONS",
    "TRACKED_COLLECTION_KEYS",
  ]);
  // Die Anwendung laeuft in einem eigenen vm-Realm. Arrays von dort tragen
  // einen anderen Array-Prototypen, deshalb hier in den Testrealm uebernehmen.
  const trackedKeys = [...app.TRACKED_COLLECTION_KEYS];
  const tracked = new Set(trackedKeys);
  const expected = REQUIRED_COLLECTIONS.filter(
    (collection) => !COLLECTIONS_WITHOUT_TRACKING.includes(collection),
  );

  const untracked = expected.filter((collection) => !tracked.has(collection));
  assert.deepEqual(
    untracked,
    [],
    `Diese Sammlungen fehlen in TRACKED_COLLECTIONS: ${untracked.join(", ")}. ` +
      "Ohne Eintrag bleiben ihre Aenderungen im Protokoll namenlos und loesen " +
      "keine Sicherungserinnerung aus.",
  );

  const unknown = trackedKeys.filter(
    (collection) => !REQUIRED_COLLECTIONS.includes(collection),
  );
  assert.deepEqual(
    unknown,
    [],
    `Diese Eintraege gehoeren nicht zum Datenvertrag: ${unknown.join(", ")}.`,
  );

  for (const [collection, label] of app.TRACKED_COLLECTIONS) {
    assert.ok(
      String(label || "").trim(),
      `Die Sammlung „${collection}“ braucht eine Bezeichnung fuer das Protokoll.`,
    );
  }
});

test("Das Aenderungsprotokoll benennt jede Sammlung einzeln", async () => {
  const app = await loadAppFunctions([
    "TRACKED_COLLECTIONS",
    "describeMutation",
  ]);

  for (const [collection, label] of app.TRACKED_COLLECTIONS) {
    const before = createMinimalState();
    const after = createMinimalState();
    after[collection] = [{ id: `${collection}-1` }];

    assert.equal(
      app.describeMutation(before, after),
      `${label}: 1 Eintrag/Einträge hinzugefügt`,
      `Ein neuer Eintrag in „${collection}“ wird im Protokoll nicht benannt.`,
    );
    assert.equal(
      app.describeMutation(after, before),
      `${label}: 1 Eintrag/Einträge gelöscht`,
      `Ein geloeschter Eintrag in „${collection}“ wird im Protokoll nicht benannt.`,
    );

    const changed = createMinimalState();
    changed[collection] = [{ id: `${collection}-1`, title: "geändert" }];
    assert.equal(
      app.describeMutation(after, changed),
      `${label} geändert`,
      `Eine Aenderung in „${collection}“ wird im Protokoll nicht benannt.`,
    );
  }
});

test("Jede nachverfolgte Sammlung loest die Sicherungserinnerung aus", async () => {
  const app = await loadAppFunctions([
    "TRACKED_COLLECTION_KEYS",
    "COLLECTIONS_WITHOUT_TIMESTAMPS",
    "shouldRemindBeforeUnload",
  ]);
  const lastBackupAt = "2026-02-01T00:00:00.000Z";
  const afterBackup = "2026-02-02T00:00:00.000Z";
  const withoutTimestamps = [...app.COLLECTIONS_WITHOUT_TIMESTAMPS];
  const backedUpState = () =>
    createMinimalState({
      settings: { lastBackupAt },
      auditLog: [
        {
          id: "audit-backup",
          timestamp: lastBackupAt,
          username: "Admin999",
          action: "Datensicherung exportiert",
        },
      ],
    });

  for (const collection of app.TRACKED_COLLECTION_KEYS) {
    if (withoutTimestamps.includes(collection)) continue;
    const state = backedUpState();
    state[collection] = [
      {
        id: `${collection}-1`,
        createdAt: afterBackup,
        updatedAt: afterBackup,
      },
    ];

    assert.equal(
      app.shouldRemindBeforeUnload(state),
      true,
      `Eine Aenderung in „${collection}“ nach der letzten Sicherung wird nicht erkannt. ` +
        "Die Anwendung meldet den Datenbestand faelschlich als gesichert.",
    );
  }

  // Sammlungen ohne Zeitstempel koennen nur ueber das Aenderungsprotokoll
  // erkannt werden. Dieser Weg muss fuer sie zuverlaessig greifen.
  for (const collection of withoutTimestamps) {
    const state = backedUpState();
    state[collection] = [{ id: `${collection}-1` }];
    assert.equal(
      app.shouldRemindBeforeUnload(state),
      false,
      `„${collection}“ fuehrt keine Zeitstempel und darf allein daraus keine ` +
        "Erinnerung ableiten.",
    );

    state.auditLog.push({
      id: "audit-change",
      timestamp: afterBackup,
      username: "Admin999",
      action: "Benutzerkonten geändert",
    });
    assert.equal(
      app.shouldRemindBeforeUnload(state),
      true,
      `Eine protokollierte Aenderung an „${collection}“ wird nicht erkannt.`,
    );
  }
});

// Memos und ToDos waren die Sammlung, die diese Luecke aufgedeckt hat. Der
// Fall bleibt einzeln stehen, damit die Regression auch dann sichtbar ist,
// wenn jemand die Ableitung aus dem Datenvertrag umbaut.
test("Memos und ToDos werden protokolliert und erinnern an die Sicherung", async () => {
  const app = await loadAppFunctions([
    "describeMutation",
    "shouldRemindBeforeUnload",
  ]);
  const before = createMinimalState();
  const after = createMinimalState({
    memos: [
      {
        id: "memo-1",
        title: "Dienstplan pruefen",
        visibility: "all",
        createdByUserId: "user-1",
        createdAt: "2026-02-02T00:00:00.000Z",
        updatedAt: "2026-02-02T00:00:00.000Z",
      },
    ],
  });

  assert.equal(
    app.describeMutation(before, after),
    "Memos und ToDos: 1 Eintrag/Einträge hinzugefügt",
  );

  after.settings.lastBackupAt = "2026-02-01T00:00:00.000Z";
  assert.equal(app.shouldRemindBeforeUnload(after), true);
});

// Der Browser rechnet toISOString() in UTC. In Deutschland liefert das
// zwischen Mitternacht und 01:00 beziehungsweise 02:00 Ortszeit den Vortag.
// Fuer Datumsangaben gibt es deshalb todayIso().
test("Datumsangaben werden nicht aus UTC abgeleitet", async () => {
  const appSource = await fs.readFile(
    path.join(projectRoot, "app.js"),
    "utf8",
  );
  const utcDates = appSource
    .split("\n")
    .map((line, index) => [index + 1, line])
    .filter(([, line]) => /toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(line));

  assert.deepEqual(
    utcDates.map(([lineNumber]) => lineNumber),
    [],
    "Diese Zeilen leiten ein Datum aus UTC ab und liefern nachts den Vortag: " +
      `${utcDates.map(([lineNumber, line]) => `${lineNumber}: ${line.trim()}`).join(" | ")}. ` +
      "Bitte todayIso() verwenden.",
  );
});
