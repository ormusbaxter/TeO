import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Die Berechtigungsprüfungen des Servers sind bewusst reine Funktionen ohne
// Abhängigkeiten und lassen sich deshalb einzeln aus der Quelle laden.
async function loadServerPermissionChecks() {
  const source = await fs.readFile(
    path.join(projectRoot, "server", "src", "server.js"),
    "utf8",
  );
  const names = [
    "isPermittedUserMutation",
    "isPermittedSettingsMutation",
    "isPermittedOwnUserMutation",
    "deepEqual",
  ];
  const extracted = names.map((name) => {
    const start = source.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `${name} wurde in server.js nicht gefunden`);
    const end = source.indexOf("\n}\n", start);
    assert.notEqual(end, -1, `Ende von ${name} wurde nicht gefunden`);
    return source.slice(start, end + 2);
  });
  const context = { structuredClone, JSON };
  context.globalThis = context;
  vm.createContext(context);
  new vm.Script(
    `${extracted.join("\n\n")}\nglobalThis.__checks = { ${names.join(", ")} };`,
    { filename: "server-permissions.js" },
  ).runInContext(context);
  return context.__checks;
}

const USER_ID = "user-normal";

function createServerState(overrides = {}) {
  return {
    employees: [{ id: "employee-1", firstName: "Test", lastName: "Person" }],
    trainings: [],
    completions: [],
    meetings: [],
    meetingAttendances: [],
    appointments: [],
    devices: [],
    deviceInstructions: [],
    vacationEntitlements: [],
    vacationDays: [],
    auditLog: [],
    settings: {
      theme: "standard",
      backupReminderDays: 14,
      deadlineKinds: ["training"],
      meetingAttendanceThreshold: 70,
    },
    users: [
      {
        id: USER_ID,
        username: "DemoUser1",
        role: "user",
        passwordSalt: "salt-a",
        passwordHash: "hash-a",
        mustChangePassword: false,
      },
      {
        id: "user-admin",
        username: "DemoAdmin",
        role: "admin",
        passwordSalt: "salt-b",
        passwordHash: "hash-b",
        mustChangePassword: false,
      },
    ],
    ...overrides,
  };
}

test("Normale Konten dürfen den gesamten fachlichen Datenbestand pflegen", async () => {
  const { isPermittedUserMutation } = await loadServerPermissionChecks();

  const changes = {
    Mitarbeiter: (next) => {
      next.employees.push({ id: "employee-2", firstName: "Neu", lastName: "Person" });
    },
    Fortbildungen: (next) => next.trainings.push({ id: "training-1" }),
    Nachweise: (next) => next.completions.push({ id: "completion-1" }),
    Teamsitzungen: (next) => next.meetings.push({ id: "meeting-1" }),
    Termine: (next) => next.appointments.push({ id: "appointment-1" }),
    Geräte: (next) => next.devices.push({ id: "device-1" }),
    Geräteeinweisungen: (next) =>
      next.deviceInstructions.push({ id: "device-instruction-1" }),
    Urlaubsplanung: (next) => next.vacationDays.push({ id: "vacation-day-1" }),
    Farbthema: (next) => {
      next.settings.theme = "kontrast";
    },
    Fristenfilter: (next) => {
      next.settings.deadlineKinds = ["training", "birthday"];
    },
    Anwesenheitsschwelle: (next) => {
      next.settings.meetingAttendanceThreshold = 80;
    },
  };

  for (const [label, mutate] of Object.entries(changes)) {
    const before = createServerState();
    const after = createServerState();
    mutate(after);
    assert.equal(
      isPermittedUserMutation(before, after, USER_ID),
      true,
      `${label} gehört zur normalen Bedienung und muss erlaubt sein`,
    );
  }
});

test("Normale Konten dürfen Sicherungserinnerung und fremde Konten nicht ändern", async () => {
  const { isPermittedUserMutation } = await loadServerPermissionChecks();

  const forbidden = {
    Sicherungserinnerung: (next) => {
      next.settings.backupReminderDays = 30;
    },
    "fremdes Konto": (next) => {
      next.users[1].passwordHash = "hash-fremd";
    },
    "eigene Rolle": (next) => {
      next.users[0].role = "admin";
    },
    "eigener Benutzername": (next) => {
      next.users[0].username = "NeuerName";
    },
    "Konto anlegen": (next) => {
      next.users.push({
        id: "user-neu",
        username: "DemoUser3",
        role: "user",
        passwordSalt: "salt-c",
        passwordHash: "hash-c",
        mustChangePassword: true,
      });
    },
    "Konto entfernen": (next) => {
      next.users = next.users.slice(0, 1);
    },
    "Konten per Import ersetzen": (next) => {
      next.users = [
        {
          id: "user-import",
          username: "ImportAdmin",
          role: "admin",
          passwordSalt: "salt-x",
          passwordHash: "hash-x",
          mustChangePassword: false,
        },
      ];
    },
  };

  for (const [label, mutate] of Object.entries(forbidden)) {
    const before = createServerState();
    const after = createServerState();
    mutate(after);
    assert.equal(
      isPermittedUserMutation(before, after, USER_ID),
      false,
      `${label} muss Administratoren vorbehalten bleiben`,
    );
  }
});

test("Normale Konten dürfen ihr eigenes Passwort ändern", async () => {
  const { isPermittedUserMutation } = await loadServerPermissionChecks();
  const before = createServerState();
  const after = createServerState();
  after.users[0].passwordSalt = "salt-neu";
  after.users[0].passwordHash = "hash-neu";
  after.users[0].mustChangePassword = false;
  assert.equal(isPermittedUserMutation(before, after, USER_ID), true);
});

test("Das eigene Konto und der letzte Administrator bleiben geschützt", async () => {
  const app = await loadAppFunctions(["userDeletionBlocker"]);
  const admin = { id: "user-admin", username: "Admin", role: "admin" };
  const zweiterAdmin = { id: "user-admin-2", username: "AdminZwei", role: "admin" };
  const benutzer = { id: "user-normal", username: "Benutzer", role: "user" };

  app.setState(createMinimalState({ users: [admin, benutzer] }));
  app.setCurrentUser(admin);
  assert.match(
    app.userDeletionBlocker(admin),
    /eigene Konto/,
    "Das eigene Konto darf nicht löschbar sein",
  );
  assert.equal(
    app.userDeletionBlocker(benutzer),
    "",
    "Ein fremdes normales Konto muss löschbar sein",
  );

  // Aus Sicht eines zweiten Administrators wäre der erste sonst löschbar –
  // er ist hier aber der letzte verbliebene Administrator.
  app.setState(createMinimalState({ users: [admin, benutzer] }));
  app.setCurrentUser(benutzer);
  assert.match(
    app.userDeletionBlocker(admin),
    /letzte Administrator/,
    "Der letzte Administrator darf nicht löschbar sein",
  );

  app.setState(createMinimalState({ users: [admin, zweiterAdmin, benutzer] }));
  app.setCurrentUser(zweiterAdmin);
  assert.equal(
    app.userDeletionBlocker(admin),
    "",
    "Bei zwei Administratoren muss einer davon löschbar sein",
  );
});

test("Der Client sperrt genau dieselben drei Bereiche wie der Server", async () => {
  const source = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");
  const guarded = new Set();
  let currentFunction = "";
  for (const line of source.split("\n")) {
    const declaration = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (declaration) currentFunction = declaration[1];
    if (
      /requireAdmin\(\)/.test(line) &&
      !/function requireAdmin/.test(line) &&
      !/if \(isAdmin\(\)\) return true/.test(line)
    ) {
      guarded.add(currentFunction);
    }
  }

  assert.deepEqual(
    [...guarded].sort(),
    [
      // Benutzerverwaltung
      "openUserManagementDialog",
      "handleCreateUserSubmit",
      "requestDeleteUser",
      "deleteUser",
      "requestPasswordReset",
      "resetUserPassword",
      "saveUsername",
      // Speicherort
      "applyStorageBackend",
      "testBackendConnection",
      // Sicherungserinnerung
      "saveGeneralSettings",
      // Änderungsprotokoll als Kontrollinstrument
      "exportAuditLogCsv",
      "openAuditLogDialog",
    ].sort(),
    "Die clientseitigen Administratorsperren weichen vom vereinbarten Rollenmodell ab",
  );
});
