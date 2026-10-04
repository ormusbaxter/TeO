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
    "stateForClient",
    "protectAuditLog",
    "appendOnlyAuditLog",
  ];
  // Konstanten, auf die diese Funktionen zugreifen
  const constants = [
    "ADMIN_ONLY_SETTINGS",
    "MAX_AUDIT_LOG_ENTRIES",
    "MAX_AUDIT_SUBJECTS",
    "MAX_NEW_AUDIT_ENTRIES_PER_SAVE",
  ];

  const extracted = [
    ...constants.map((name) => {
      const start = source.indexOf(`const ${name} =`);
      assert.notEqual(start, -1, `${name} wurde in server.js nicht gefunden`);
      const end = source.indexOf(";\n", start);
      assert.notEqual(end, -1, `Ende von ${name} wurde nicht gefunden`);
      return source.slice(start, end + 1);
    }),
    ...names.map((name) => {
      const start = source.indexOf(`function ${name}(`);
      assert.notEqual(start, -1, `${name} wurde in server.js nicht gefunden`);
      const end = source.indexOf("\n}\n", start);
      assert.notEqual(end, -1, `Ende von ${name} wurde nicht gefunden`);
      return source.slice(start, end + 2);
    }),
  ];
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
      maxBackupFileSizeMb: 20,
      closeDialogOnOutsideClick: false,
      schoolVacationPeriods: [
        { start: "2026-07-20", end: "2026-09-01", label: "Sommerferien" },
      ],
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
    Sicherungsvolumen: (next) => {
      next.settings.maxBackupFileSizeMb = 100;
    },
    "Schließverhalten der Dialoge": (next) => {
      next.settings.closeDialogOnOutsideClick = true;
    },
    Schulferien: (next) => {
      next.settings.schoolVacationPeriods = [
        { start: "2031-07-01", end: "2031-08-12", label: "Sommerferien" },
      ];
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
      // Sicherungserinnerung und Schliessverhalten der Dialoge
      "saveGeneralSettings",
      "saveCloseDialogOnOutsideClick",
      // Schulferien
      "addSchoolVacationPeriod",
      "deleteSchoolVacationPeriod",
      "restoreOfficialSchoolVacations",
      // Änderungsprotokoll als Kontrollinstrument
      "exportAuditLogCsv",
      "openAuditLogDialog",
    ].sort(),
    "Die clientseitigen Administratorsperren weichen vom vereinbarten Rollenmodell ab",
  );
});

// Das Änderungsprotokoll im MariaDB-Modus: Normale Konten bekommen es nicht
// zu sehen und können es nur um eigene Einträge ergänzen.

const NORMAL_USER = { id: USER_ID, username: "DemoUser1", role: "user" };
const ADMIN_USER = { id: "user-admin", username: "DemoAdmin", role: "admin" };
const SERVER_TIME = new Date("2026-10-04T12:00:00.000Z");

function auditEntry(id, overrides = {}) {
  return {
    id,
    timestamp: "2026-10-01T08:00:00.000Z",
    username: "DemoAdmin",
    action: `Eintrag ${id}`,
    ...overrides,
  };
}

test("Das Änderungsprotokoll geht nur an Administratoren", async () => {
  const { stateForClient } = await loadServerPermissionChecks();
  const state = createServerState({ auditLog: [auditEntry("audit-1")] });

  const fuerKonto = stateForClient(state, USER_ID);
  assert.equal(fuerKonto.auditLog.length, 0);
  assert.equal(fuerKonto.users.every((user) => !user.passwordHash), true);

  const fuerAdmin = stateForClient(state, ADMIN_USER.id);
  assert.equal(fuerAdmin.auditLog.map((entry) => entry.id).join(","), "audit-1");
  // Der gespeicherte Bestand selbst bleibt unberührt.
  assert.equal(state.auditLog.length, 1);
});

test("Ein normales Konto kann das Protokoll nur ergänzen", async () => {
  const { protectAuditLog } = await loadServerPermissionChecks();
  const current = createServerState({
    auditLog: [auditEntry("audit-2"), auditEntry("audit-1")],
  });
  // Der Browser schickt einen neuen Eintrag unter fremdem Namen und
  // rückdatiert, verändert einen bekannten und lässt einen anderen weg.
  const next = createServerState({
    auditLog: [
      auditEntry("audit-3", {
        username: "DemoAdmin",
        timestamp: "2020-01-01T00:00:00.000Z",
        action: "Mitarbeiter geändert",
        subjects: [{ employeeId: "employee-1", change: "Stammdaten" }],
      }),
      auditEntry("audit-2", { action: "umgeschrieben" }),
    ],
  });

  const result = protectAuditLog(current, next, NORMAL_USER, SERVER_TIME);

  assert.equal(result.auditLog.map((entry) => entry.id).join(","), "audit-3,audit-2,audit-1");
  const [neu, bekannt] = result.auditLog;
  assert.equal(neu.username, "DemoUser1", "Den Namen setzt der Server");
  assert.equal(neu.timestamp, SERVER_TIME.toISOString(), "Den Zeitpunkt setzt der Server");
  assert.equal(neu.action, "Mitarbeiter geändert");
  assert.equal(neu.subjects[0].change, "Stammdaten");
  assert.equal(bekannt.action, "Eintrag audit-2", "Bekannte Einträge bleiben, wie sie sind");
  // Der übrige Bestand kommt unverändert durch.
  assert.equal(result.employees, next.employees);
});

test("Fremde Einträge lassen sich nicht als neue einschleusen", async () => {
  const { protectAuditLog } = await loadServerPermissionChecks();
  const current = createServerState({ auditLog: [auditEntry("audit-1")] });
  const viele = Array.from({ length: 21 }, (_, index) => auditEntry(`fremd-${index}`));

  assert.equal(
    protectAuditLog(current, createServerState({ auditLog: viele }), NORMAL_USER, SERVER_TIME),
    null,
  );

  // Dieselbe Kennung zweimal zählt einmal, ein Eintrag ohne Text gar nicht.
  const doppelt = createServerState({
    auditLog: [auditEntry("neu"), auditEntry("neu"), auditEntry("leer", { action: " " })],
  });
  const result = protectAuditLog(current, doppelt, NORMAL_USER, SERVER_TIME);
  assert.equal(result.auditLog.map((entry) => entry.id).join(","), "neu,audit-1");
});

test("Das Protokoll behält auch beim Ergänzen höchstens 1000 Einträge", async () => {
  const { protectAuditLog } = await loadServerPermissionChecks();
  const voll = Array.from({ length: 1000 }, (_, index) => auditEntry(`alt-${index}`));
  const current = createServerState({ auditLog: voll });
  const result = protectAuditLog(
    current,
    createServerState({ auditLog: [auditEntry("neu")] }),
    NORMAL_USER,
    SERVER_TIME,
  );
  assert.equal(result.auditLog.length, 1000);
  assert.equal(result.auditLog[0].id, "neu");
  assert.equal(result.auditLog.at(-1).id, "alt-998");
});

test("Administratoren können das Protokoll weiterhin ersetzen", async () => {
  const { protectAuditLog } = await loadServerPermissionChecks();
  const current = createServerState({ auditLog: [auditEntry("audit-1")] });
  const next = createServerState({ auditLog: [auditEntry("aus-sicherung")] });
  assert.equal(protectAuditLog(current, next, ADMIN_USER, SERVER_TIME), next);
});

function backendStub() {
  const gesendet = [];
  return {
    gesendet,
    readToken: () => "token",
    writeToken() {},
    async save(_apiUrl, _token, state) {
      gesendet.push(JSON.parse(JSON.stringify(state)));
      return { revision: gesendet.length + 1 };
    },
  };
}

async function loadMariaDbClient(user) {
  const app = await loadAppFunctions(
    ["commitStateMutation", "importDatabase", "normalizeState"],
    { withDom: true },
  );
  const backend = backendStub();
  app.dom.window.TeOBackend = backend;
  app.setBackendMode("mariadb");
  const state = createMinimalState({
    users: [{ ...createServerState().users.find((entry) => entry.id === user.id) }],
  });
  app.setState(state);
  app.setCurrentUser(state.users[0]);
  return { app, backend };
}

test("Ein normales Konto schickt jeden eigenen Eintrag genau einmal", async () => {
  const { app, backend } = await loadMariaDbClient(NORMAL_USER);

  await app.commitStateMutation(
    () => {
      app.getState().settings.meetingAttendanceThreshold = 80;
    },
    { auditAction: "Anwesenheitsschwelle geändert" },
  );
  await app.commitStateMutation(
    () => {
      app.getState().settings.meetingAttendanceThreshold = 90;
    },
    { auditAction: "Anwesenheitsschwelle geändert" },
  );

  assert.equal(backend.gesendet.length, 2);
  assert.equal(backend.gesendet[0].auditLog.length, 1);
  assert.equal(backend.gesendet[1].auditLog.length, 1, "Der erste Eintrag kommt nicht erneut");
  assert.notEqual(backend.gesendet[0].auditLog[0].id, backend.gesendet[1].auditLog[0].id);
  assert.equal(app.getState().auditLog.length, 0);
});

test("Ein Administrator behält das Protokoll im Browser", async () => {
  const { app, backend } = await loadMariaDbClient(ADMIN_USER);

  await app.commitStateMutation(
    () => {
      app.getState().settings.meetingAttendanceThreshold = 80;
    },
    { auditAction: "Anwesenheitsschwelle geändert" },
  );
  await app.commitStateMutation(
    () => {
      app.getState().settings.meetingAttendanceThreshold = 90;
    },
    { auditAction: "Anwesenheitsschwelle geändert" },
  );

  assert.equal(backend.gesendet[1].auditLog.length, 2);
  assert.equal(app.getState().auditLog.length, 2);
});

test("Beim Import eines normalen Kontos bleibt das Protokoll der Sicherung draußen", async () => {
  const { app, backend } = await loadMariaDbClient(NORMAL_USER);
  const sicherung = createMinimalState({
    employees: [{ id: "employee-9", firstName: "Aus", lastName: "Sicherung" }],
    auditLog: Array.from({ length: 30 }, (_, index) => auditEntry(`sicherung-${index}`)),
  });

  assert.equal(await app.importDatabase(sicherung, { resumeSession: false }), true);
  assert.equal(backend.gesendet.length, 1);
  assert.equal(backend.gesendet[0].auditLog.length, 0);
  assert.equal(backend.gesendet[0].employees[0].id, "employee-9");
});
