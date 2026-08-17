import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const admin = {
  id: "user-admin",
  username: "Admin999",
  role: "admin",
  passwordSalt: "c2FsdA==",
  passwordHash: "aGFzaA==",
};
const member = {
  id: "user-member",
  username: "Person001",
  role: "user",
  passwordSalt: "c2FsdA==",
  passwordHash: "aGFzaA==",
};

test("Ein beschädigtes Benutzerkonto reißt die übrigen nicht mit", async () => {
  const app = await loadAppFunctions(["normalizeState"]);

  const withBrokenAccount = app.normalizeState(
    createMinimalState({
      users: [admin, member, { id: "user-broken", username: "x", role: "user" }],
    }),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(withBrokenAccount.users.map((user) => user.id))),
    ["user-admin", "user-member"],
    "Nur das ungültige Konto darf verworfen werden",
  );

  const withDuplicate = app.normalizeState(
    createMinimalState({
      users: [admin, member, { ...member, id: "user-duplicate" }],
    }),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(withDuplicate.users.map((user) => user.id))),
    ["user-admin", "user-member"],
    "Von doppelt vergebenen Benutzernamen bleibt der erste erhalten",
  );

  // Ohne Administratorkonto ist der Bestand nicht bedienbar. Dann ist die
  // Ersteinrichtung tatsächlich der richtige Weg.
  const withoutAdmin = app.normalizeState(
    createMinimalState({ users: [member] }),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(withoutAdmin.users)),
    [],
    "Ohne Administratorkonto bleibt keine Anmeldung übrig",
  );
});

test("resetListFilters stellt jede Liste wieder vollständig her", async () => {
  const app = await loadAppFunctions(
    [
      "normalizeState",
      "resetListFilters",
      "filteredEmployeesForTable",
      "filteredMemos",
    ],
    { withDom: true },
  );

  const anna = {
    ...createEmployee("employee-anna"),
    firstName: "Anna",
    lastName: "Aktiv",
    username: "Anna001",
  };
  const bert = {
    ...createEmployee("employee-bert"),
    firstName: "Bert",
    lastName: "Bereit",
    username: "Bert001",
  };
  app.setState(
    app.normalizeState(
      createMinimalState({
        users: [admin],
        employees: [anna, bert],
        memos: [
          {
            id: "memo-1",
            title: "Dienstplan prüfen",
            category: "Aufgabe",
            visibility: "all",
            createdByUserId: "user-admin",
          },
          {
            id: "memo-2",
            title: "Material bestellen",
            category: "Allgemein",
            visibility: "all",
            createdByUserId: "user-admin",
          },
        ],
      }),
    ),
  );
  app.setCurrentUser({ id: "user-admin", username: "Admin999", role: "admin" });

  assert.equal(app.filteredEmployeesForTable().length, 2);
  assert.equal(app.filteredMemos().length, 2);

  // Filter setzen, wie sie vor einem Import stehen können
  app.setEmployeeFilters({ search: "anna" });
  assert.equal(
    app.filteredEmployeesForTable().length,
    1,
    "Vorbedingung: der Filter greift",
  );

  app.resetListFilters();
  assert.equal(
    app.filteredEmployeesForTable().length,
    2,
    "Nach dem Zurücksetzen muss die Mitarbeiterliste wieder vollständig sein",
  );
  assert.equal(
    app.filteredMemos().length,
    2,
    "Nach dem Zurücksetzen müssen alle offenen Memos wieder erscheinen",
  );
});

test("Die automatische Sicherung erkennt Änderungen, nicht Renderdurchläufe", async () => {
  // getStateMutationSequence stellt der Testeinsprung bereit, nicht app.js.
  const app = await loadAppFunctions(["renderAll", "normalizeState"], {
    withDom: true,
  });
  app.setState(app.normalizeState(createMinimalState({ users: [admin] })));
  app.setCurrentUser({ id: "user-admin", username: "Admin999", role: "admin" });

  const before = app.getStateMutationSequence();
  app.renderAll();
  app.renderAll();
  assert.equal(
    app.getStateMutationSequence(),
    before,
    "Ein Renderdurchlauf darf den Änderungszähler nicht bewegen – sonst bleibt " +
      "die Sicherungserinnerung nach einer erfolgreichen Sicherung stehen.",
  );
});
