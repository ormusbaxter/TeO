import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

function createDataStoreStub() {
  const written = new Map();
  return {
    async setItem(key, value) {
      written.set(key, value);
      return value;
    },
    async getItem(key) {
      return written.has(key) ? written.get(key) : null;
    },
  };
}

function urlaub(employeeId, date) {
  return {
    id: `v-${employeeId}-${date}`,
    employeeId,
    date,
    type: "vacation",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function ladeApp(rolle = "admin") {
  const app = await loadAppFunctions(
    [
      "commitStateMutation",
      "undoLastMutation",
      "openEmployeeDossier",
      "normalizeState",
    ],
    { withDom: true },
  );
  app.setDataStore(createDataStoreStub());
  app.setCurrentUser({ id: "u1", username: "leitung", role: rolle });
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [
          { ...createEmployee("e1"), firstName: "Anna", lastName: "Adler" },
          { ...createEmployee("e2"), firstName: "Ben", lastName: "Berg" },
        ],
      }),
    ),
  );
  return app;
}

function letzterEintrag(app) {
  return app.getState().auditLog[0];
}

test("Eine Stammdatenänderung nennt Mitarbeiter und geänderte Felder", async () => {
  const app = await ladeApp();
  await app.commitStateMutation(() => {
    const anna = app.getState().employees.find((employee) => employee.id === "e1");
    anna.profession = "Intensivtechnische/r Assistent/in";
    anna.employmentPercent = 80;
    anna.updatedAt = new Date().toISOString();
  });
  const eintrag = letzterEintrag(app);
  assert.equal(eintrag.username, "leitung");
  assert.equal(eintrag.subjects.length, 1);
  assert.equal(eintrag.subjects[0].employeeId, "e1");
  // Der Zeitstempel ändert sich immer mit und wird nicht genannt.
  assert.equal(eintrag.subjects[0].change, "Stammdaten: Beruf, Stellenumfang");
});

test("Abwesenheiten werden je Mitarbeiter gezählt", async () => {
  const app = await ladeApp();
  await app.commitStateMutation(() => {
    app.getState().vacationDays.push(
      urlaub("e1", "2026-07-01"),
      urlaub("e1", "2026-07-02"),
      urlaub("e2", "2026-07-01"),
    );
  });
  const betroffene = Object.fromEntries(
    letzterEintrag(app).subjects.map((subject) => [subject.employeeId, subject.change]),
  );
  assert.equal(betroffene.e1, "Abwesenheitsplanung: 2 Einträge");
  assert.equal(betroffene.e2, "Abwesenheitsplanung");
});

test("Auch das Zurücknehmen erscheint im Verlauf des Mitarbeiters", async () => {
  const app = await ladeApp();
  await app.commitStateMutation(
    () => {
      app.getState().employees = app.getState().employees.filter(
        (employee) => employee.id !== "e2",
      );
    },
    { undo: "Mitarbeiter gelöscht" },
  );
  assert.equal(letzterEintrag(app).subjects[0].change, "gelöscht");
  await app.undoLastMutation();
  const eintrag = letzterEintrag(app);
  assert.match(eintrag.action, /^Rückgängig gemacht/);
  assert.equal(eintrag.subjects[0].employeeId, "e2");
  assert.equal(eintrag.subjects[0].change, "angelegt");
});

test("Die Akte zeigt Administratoren den Änderungsverlauf", async () => {
  const app = await ladeApp();
  await app.commitStateMutation(() => {
    app.getState().employees[0].phone = "+49 221 000000";
  });
  app.openEmployeeDossier("e1");
  const html = app.dom.document.querySelector("#employeeDossierContent").innerHTML;
  assert.match(html, /<h3>Änderungsverlauf<\/h3>/);
  assert.match(html, /Stammdaten: Telefon/);
  assert.match(html, /leitung/);
});

test("Normalen Benutzern zeigt die Akte keinen Verlauf", async () => {
  const app = await ladeApp("user");
  await app.commitStateMutation(() => {
    app.getState().employees[0].phone = "+49 221 000000";
  });
  app.openEmployeeDossier("e1");
  const html = app.dom.document.querySelector("#employeeDossierContent").innerHTML;
  assert.doesNotMatch(html, /Änderungsverlauf/);
});

test("Betroffene überstehen Speichern und Laden, Ungültiges fällt heraus", async () => {
  const app = await ladeApp();
  const geladen = app.normalizeState(
    createMinimalState({
      employees: [createEmployee("e1")],
      auditLog: [
        {
          id: "a1",
          timestamp: "2026-09-01T10:00:00.000Z",
          username: "leitung",
          action: "Mitarbeiter geändert",
          subjects: [
            { employeeId: "e1", change: "Stammdaten: Telefon" },
            { employeeId: "kaputt id", change: "x" },
            { employeeId: "e2", change: "" },
          ],
        },
        { id: "a2", timestamp: "2026-09-01T09:00:00.000Z", username: "alt", action: "Ohne Betroffene" },
      ],
    }),
  );
  assert.equal(JSON.stringify(geladen.auditLog[0].subjects), '[{"employeeId":"e1","change":"Stammdaten: Telefon"}]');
  assert.equal(geladen.auditLog[1].subjects, undefined);
});
