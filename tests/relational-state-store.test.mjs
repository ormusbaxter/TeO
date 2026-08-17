import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  addRelationalForeignKeys,
  COLLECTION_SPECS,
  initializeRelationalState,
  migrateLegacyState,
  readRelationalState,
  reconcileNewerLegacyState,
  replaceRelationalState,
} from "../server/src/relational-state-store.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function emptyRelationalState() {
  return {
    version: 25,
    employees: [],
    trainings: [],
    completions: [],
    meetings: [],
    meetingAttendances: [],
    appointments: [],
    memos: [],
    devices: [],
    deviceInstructions: [],
    vacationEntitlements: [],
    vacationDays: [],
    users: [],
    auditLog: [],
    settings: { theme: "standard" },
    catalogs: { professions: [], qualifications: [], memoCategories: [] },
  };
}

function sampleEmployee() {
  return {
    id: "employee-1",
    firstName: "Anna",
    lastName: "Beispiel",
    username: "Anna001",
    employmentStatus: "active",
    profession: "Pflegefachkraft",
    employmentPercent: 100,
  };
}

test("Jede fachliche Sammlung besitzt eine eigene relationale Tabelle", async () => {
  assert.equal(COLLECTION_SPECS.length, 13);
  assert.equal(
    new Set(COLLECTION_SPECS.map((spec) => spec.table)).size,
    COLLECTION_SPECS.length,
  );

  const schema = await fs.readFile(
    path.join(projectRoot, "server", "schema.sql"),
    "utf8",
  );
  for (const spec of COLLECTION_SPECS) {
    assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${spec.table}`));
  }

  const serverSource = await fs.readFile(
    path.join(projectRoot, "server", "src", "server.js"),
    "utf8",
  );
  assert.doesNotMatch(serverSource, /UPDATE teo_state|INSERT INTO teo_state/);
  assert.match(serverSource, /replaceRelationalState/);
});

test("Normalisierte Beziehungen werden aus dem Anwendungszustand geschrieben", async () => {
  const state = emptyRelationalState();
  state.catalogs.qualifications = [
    { id: "praxisanleiter", label: "Praxisanleiter" },
  ];
  state.employees = [
    {
      ...sampleEmployee(),
      username: "Anna001",
      qualifications: { praxisanleiter: true },
      qualificationExpiries: { praxisanleiter: "2028-12-31" },
    },
  ];
  state.users = [
    {
      id: "user-1",
      username: "Anna001",
      role: "user",
      mustChangePassword: false,
    },
  ];
  state.meetings = [
    {
      id: "meeting-1",
      title: "Teamsitzung",
      date: "2026-07-01",
      expectedEmployeeIds: ["employee-1"],
    },
  ];
  state.devices = [
    {
      id: "device-1",
      productName: "Gerät",
      manufacturer: "Hersteller",
      category: "Kategorie",
      annex1: false,
      currentInventory: true,
    },
  ];
  state.deviceInstructions = [
    {
      id: "instruction-1",
      deviceId: "device-1",
      date: "2026-07-02",
      instructorType: "manufacturer",
      instructorEmployeeId: "",
      participants: [
        {
          employeeId: "employee-1",
          wasMedicalProductsOfficer: true,
        },
      ],
    },
  ];
  const calls = [];
  const connection = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (/COUNT\(\*\) AS table_count/.test(sql)) {
        return [{ table_count: 4 }];
      }
      return [];
    },
  };

  await initializeRelationalState(connection, state, {
    revision: 18,
    updatedBy: "Admin001",
  });

  assert.ok(
    calls.some((call) =>
      /INSERT INTO teo_qualification_catalog/.test(call.sql),
    ),
  );
  assert.ok(
    calls.some((call) =>
      /INSERT INTO teo_employee_qualifications/.test(call.sql),
    ),
  );
  assert.ok(
    calls.some((call) =>
      /INSERT INTO teo_employee_qualification_history/.test(call.sql),
    ),
  );
  assert.ok(
    calls.some((call) =>
      /INSERT INTO teo_device_instruction_participants/.test(call.sql),
    ),
  );
  assert.ok(
    calls.some((call) =>
      /INSERT INTO teo_meeting_expected_employees/.test(call.sql),
    ),
  );
  const userLink = calls.find((call) =>
    /UPDATE teo_users\s+SET employee_id/.test(call.sql),
  );
  assert.deepEqual(userLink.values, [
    "employee-1",
    "user-1",
    "employee-1",
  ]);
});

test("Fremdschlüssel schützen alle fachlichen Mitarbeiterbeziehungen", async () => {
  const calls = [];
  const connection = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      return [];
    },
  };

  await addRelationalForeignKeys(connection);

  const alterations = calls.filter((call) =>
    /^\s*ALTER TABLE/.test(call.sql),
  );
  assert.equal(alterations.length, 17);
  assert.ok(
    alterations.some((call) =>
      /fk_teo_completion_employee/.test(call.sql),
    ),
  );
  assert.ok(
    alterations.some((call) =>
      /fk_teo_instruction_participant_employee/.test(call.sql),
    ),
  );
  assert.ok(
    alterations.some((call) =>
      /fk_teo_user_employee[\s\S]+ON DELETE SET NULL/.test(call.sql),
    ),
  );
});

test("Initialisierung verteilt den Zustand auf Metadaten und Fachtabellen", async () => {
  const calls = [];
  const connection = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      return [];
    },
  };
  const state = emptyRelationalState();
  state.employees = [sampleEmployee()];

  await initializeRelationalState(connection, state, {
    revision: 7,
    updatedBy: "Admin001",
  });

  assert.match(calls[0].sql, /INSERT INTO teo_meta/);
  assert.equal(calls[0].values[0], 7);
  const employeeInsert = calls.find((call) =>
    /INSERT INTO teo_employees/.test(call.sql),
  );
  assert.ok(employeeInsert);
  assert.equal(employeeInsert.values[0], "employee-1");
  assert.equal(employeeInsert.values[3], "Anna");
  assert.equal(employeeInsert.values[4], "Beispiel");
});

test("Ein vorhandener JSON-Gesamtbestand wird verlustfrei als Migration übernommen", async () => {
  const state = emptyRelationalState();
  state.employees = [sampleEmployee()];
  const calls = [];
  const connection = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (/SELECT id FROM teo_meta/.test(sql)) return [];
      if (/FROM teo_state/.test(sql)) {
        return [
          {
            revision: 12,
            payload: JSON.stringify(state),
            updated_by: "AltAdmin",
          },
        ];
      }
      return [];
    },
  };

  const result = await migrateLegacyState(connection);

  assert.deepEqual(result, { migrated: true, revision: 12 });
  const metadataInsert = calls.find((call) =>
    /INSERT INTO teo_meta/.test(call.sql),
  );
  assert.equal(metadataInsert.values[0], 12);
  assert.equal(metadataInsert.values[4], "AltAdmin");
  assert.ok(calls.some((call) => /INSERT INTO teo_employees/.test(call.sql)));
});

test("Eine zwischenzeitlich neuere Legacy-Revision wird beim Start nachgezogen", async () => {
  const state = emptyRelationalState();
  const calls = [];
  const connection = {
    async beginTransaction() {
      calls.push({ sql: "BEGIN" });
    },
    async commit() {
      calls.push({ sql: "COMMIT" });
    },
    async rollback() {
      calls.push({ sql: "ROLLBACK" });
    },
    release() {
      calls.push({ sql: "RELEASE" });
    },
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (/SELECT revision, updated_at\s+FROM teo_meta/.test(sql)) {
        return [
          {
            revision: 12,
            updated_at: new Date("2026-07-27T08:00:00.000Z"),
          },
        ];
      }
      if (/SELECT revision, payload, updated_at, updated_by\s+FROM teo_state/.test(sql)) {
        return [
          {
            revision: 13,
            payload: JSON.stringify(state),
            updated_at: new Date("2026-07-27T08:01:00.000Z"),
            updated_by: "AltAdmin",
          },
        ];
      }
      if (/SELECT id, sort_order, payload FROM teo_/.test(sql)) return [];
      return [];
    },
  };
  const pool = {
    async getConnection() {
      return connection;
    },
  };

  const result = await reconcileNewerLegacyState(pool);

  assert.deepEqual(result, { reconciled: true, revision: 13 });
  const metadataUpdate = calls.find((call) => /UPDATE teo_meta/.test(call.sql));
  assert.equal(metadataUpdate.values[0], 13);
  assert.equal(metadataUpdate.values[4], "AltAdmin");
  assert.ok(calls.some((call) => call.sql === "COMMIT"));
  assert.ok(calls.some((call) => call.sql === "RELEASE"));
});

test("Lesen setzt den vollständigen Zustand aus getrennten Tabellen zusammen", async () => {
  const state = emptyRelationalState();
  state.employees = [sampleEmployee()];
  const rowsByTable = new Map(
    COLLECTION_SPECS.map((spec) => [
      spec.table,
      (state[spec.stateKey] || []).map((item) => ({
        payload: JSON.stringify(item),
      })),
    ]),
  );
  const connection = {
    async query(sql) {
      if (/FROM teo_meta/.test(sql)) {
        return [
          {
            revision: 9,
            state_version: state.version,
            settings: JSON.stringify(state.settings),
            catalogs: JSON.stringify(state.catalogs),
            updated_at: new Date("2026-07-27T08:00:00.000Z"),
            updated_by: "Admin001",
          },
        ];
      }
      const table = [...rowsByTable.keys()].find((name) =>
        sql.includes(`FROM ${name}`),
      );
      return rowsByTable.get(table) || [];
    },
  };

  const result = await readRelationalState(connection);

  assert.equal(result.revision, 9);
  assert.deepEqual(result.state, state);
});

test("Unveränderte Datensätze werden nicht erneut geschrieben", async () => {
  const state = emptyRelationalState();
  const storedEmployee = sampleEmployee();
  state.employees = [{ ...storedEmployee }];
  const calls = [];
  const connection = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (/SELECT id, sort_order, payload FROM teo_employees/.test(sql)) {
        return [
          {
            id: "employee-1",
            sort_order: 0,
            payload: JSON.stringify(storedEmployee),
          },
        ];
      }
      if (/SELECT id, sort_order, payload FROM teo_/.test(sql)) return [];
      return [];
    },
  };

  await replaceRelationalState(connection, state, {
    revision: 10,
    updatedBy: "Admin001",
  });

  assert.equal(
    calls.filter((call) => /INSERT INTO teo_employees/.test(call.sql)).length,
    0,
  );
  assert.equal(
    calls.filter((call) => /UPDATE teo_meta/.test(call.sql)).length,
    1,
  );

  state.employees[0] = { ...state.employees[0], phone: "0221 123456" };
  calls.length = 0;
  await replaceRelationalState(connection, state, {
    revision: 11,
    updatedBy: "Admin001",
  });
  assert.equal(
    calls.filter((call) => /INSERT INTO teo_employees/.test(call.sql)).length,
    1,
  );
});

test("Eine geänderte Feldreihenfolge schreibt keine Zeile neu", async () => {
  const gespeichert = {
    id: "employee-1",
    firstName: "Anna",
    lastName: "Aktiv",
    qualifications: { praxisanleiter: true, hygiene: false },
  };
  // Derselbe Inhalt, aber in anderer Schlüsselreihenfolge aufgebaut – so, wie
  // es nach einer Umsortierung in normalizeEmployee entstünde.
  const umsortiert = {
    lastName: "Aktiv",
    qualifications: { hygiene: false, praxisanleiter: true },
    id: "employee-1",
    firstName: "Anna",
  };

  const schreibzugriffe = [];
  const connection = {
    async query(sql, values = []) {
      if (/SELECT id, sort_order, payload FROM teo_employees/.test(sql)) {
        return [
          {
            id: "employee-1",
            sort_order: 0,
            payload: JSON.stringify(gespeichert),
          },
        ];
      }
      if (/^\s*INSERT INTO teo_employees/.test(sql)) {
        schreibzugriffe.push({ sql, values });
      }
      if (/COUNT\(\*\) AS table_count/.test(sql)) return [{ table_count: 0 }];
      return [];
    },
  };

  const state = emptyRelationalState();
  state.employees = [umsortiert];
  await replaceRelationalState(connection, state, {
    revision: 2,
    updatedBy: "Admin001",
  });

  assert.deepEqual(
    schreibzugriffe,
    [],
    "Gleicher Inhalt in anderer Feldreihenfolge darf keinen Schreibzugriff auslösen",
  );

  // Gegenprobe: eine echte Änderung muss weiterhin geschrieben werden
  const geaendert = { ...umsortiert, firstName: "Anne" };
  const stateGeaendert = emptyRelationalState();
  stateGeaendert.employees = [geaendert];
  await replaceRelationalState(connection, stateGeaendert, {
    revision: 3,
    updatedBy: "Admin001",
  });
  assert.equal(
    schreibzugriffe.length,
    1,
    "Eine inhaltliche Änderung muss geschrieben werden",
  );
});
