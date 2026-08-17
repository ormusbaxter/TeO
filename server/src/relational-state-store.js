const COLLECTION_SPECS = Object.freeze([
  collection("employees", "teo_employees", [
    column("first_name", (item) => item.firstName),
    column("last_name", (item) => item.lastName),
    column("username", (item) => item.username || null),
    column("employment_status", (item) => item.employmentStatus),
    column("profession", (item) => item.profession),
    column("employment_percent", (item) => item.employmentPercent),
  ]),
  collection("trainings", "teo_trainings", [
    column("title", (item) => item.title),
    column("catalog_year", (item) => item.year),
    column("recurrence_months", (item) => item.recurrenceMonths),
    column("series_id", (item) => item.seriesId || null),
  ]),
  collection("completions", "teo_completions", [
    column("employee_id", (item) => item.employeeId),
    column("training_id", (item) => item.trainingId),
    column("completed_on", (item) => item.completedOn),
  ]),
  collection("meetings", "teo_meetings", [
    column("title", (item) => item.title),
    column("meeting_date", (item) => item.date),
  ]),
  collection("meetingAttendances", "teo_meeting_attendances", [
    column("meeting_id", (item) => item.meetingId),
    column("employee_id", (item) => item.employeeId),
    column("attendance_status", (item) => item.status),
  ]),
  collection("appointments", "teo_appointments", [
    column("title", (item) => item.title),
    column("appointment_date", (item) => item.date),
  ]),
  collection("memos", "teo_memos", [
    column("title", (item) => item.title),
    column("memo_date", (item) => item.date || null),
    column("memo_category", (item) => item.category || null),
    column("visibility", (item) => item.visibility),
    column("created_by_user_id", (item) => item.createdByUserId || null),
    column("is_pinned", (item) => Boolean(item.pinned)),
    column("is_completed", (item) => Boolean(item.completed)),
  ]),
  collection("devices", "teo_devices", [
    column("product_name", (item) => item.productName),
    column("manufacturer", (item) => item.manufacturer),
    column("device_category", (item) => item.category),
    column("annex_1", (item) => Boolean(item.annex1)),
    column("current_inventory", (item) => item.currentInventory !== false),
  ]),
  collection("deviceInstructions", "teo_device_instructions", [
    column("device_id", (item) => item.deviceId),
    column("instruction_date", (item) => item.date),
    column("instructor_type", (item) => item.instructorType),
    column(
      "instructor_employee_id",
      (item) => item.instructorEmployeeId || null,
    ),
  ]),
  collection(
    "vacationEntitlements",
    "teo_vacation_entitlements",
    [
      column("employee_id", (item) => item.employeeId),
      column("entitlement_year", (item) => item.year),
      column("additional_days", (item) => item.additionalDays),
    ],
    (item) => `${item.employeeId}:${item.year}`,
  ),
  collection("vacationDays", "teo_vacation_days", [
    column("employee_id", (item) => item.employeeId),
    column("absence_date", (item) => item.date),
    column("absence_type", (item) => item.type),
  ]),
  collection("users", "teo_users", [
    column("username", (item) => item.username),
    column("user_role", (item) => item.role),
    column("must_change_password", (item) => Boolean(item.mustChangePassword)),
  ]),
  collection("auditLog", "teo_client_audit_entries", [
    column("event_timestamp", (item) => timestampOrNull(item.timestamp)),
    column("actor_username", (item) => item.username),
    column("action_text", (item) => item.action),
  ]),
]);

export function createRelationalStateStore(pool) {
  return {
    read(options = {}) {
      return readRelationalState(pool, options);
    },
    initialize(state, { revision = 1, updatedBy = "system" } = {}) {
      return initializeRelationalState(pool, state, { revision, updatedBy });
    },
    replace(state, { revision, updatedBy }) {
      return replaceRelationalState(pool, state, { revision, updatedBy });
    },
  };
}

export async function readRelationalState(
  connection,
  { forUpdate = false } = {},
) {
  const metadataRows = await connection.query(
    `SELECT revision, state_version, settings, catalogs, updated_at, updated_by
       FROM teo_meta
      WHERE id = 1${forUpdate ? " FOR UPDATE" : ""}`,
  );
  const metadata = metadataRows[0];
  if (!metadata) return null;

  const state = {
    version: Number(metadata.state_version),
  };
  for (const spec of COLLECTION_SPECS) {
    const rows = await connection.query(
      `SELECT payload
         FROM ${spec.table}
        ORDER BY sort_order, id`,
    );
    state[spec.stateKey] = rows.map((row) => parseJson(row.payload));
  }
  state.settings = parseJson(metadata.settings);
  state.catalogs = parseJson(metadata.catalogs);
  if (await normalizedRelationshipsAvailable(connection)) {
    await hydrateNormalizedRelationships(connection, state);
  }

  return {
    revision: Number(metadata.revision),
    state,
    updatedAt: metadata.updated_at,
    updatedBy: metadata.updated_by,
  };
}

export async function initializeRelationalState(
  connection,
  state,
  { revision = 1, updatedBy = "system" } = {},
) {
  await connection.query(
    `INSERT INTO teo_meta
      (id, revision, state_version, settings, catalogs, updated_at, updated_by)
     VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?)`,
    [
      revision,
      Number(state.version),
      JSON.stringify(state.settings),
      JSON.stringify(state.catalogs),
      updatedBy,
    ],
  );
  for (const spec of COLLECTION_SPECS) {
    await insertCollection(connection, spec, state[spec.stateKey] || []);
  }
  if (await normalizedRelationshipsAvailable(connection)) {
    await synchronizeNormalizedRelationships(connection, state, revision);
  }
}

export async function replaceRelationalState(
  connection,
  state,
  { revision, updatedBy },
) {
  for (const spec of COLLECTION_SPECS) {
    await synchronizeCollection(
      connection,
      spec,
      state[spec.stateKey] || [],
    );
  }
  if (await normalizedRelationshipsAvailable(connection)) {
    await synchronizeNormalizedRelationships(connection, state, revision);
  }
  await connection.query(
    `UPDATE teo_meta
        SET revision = ?,
            state_version = ?,
            settings = ?,
            catalogs = ?,
            updated_at = CURRENT_TIMESTAMP(3),
            updated_by = ?
      WHERE id = 1`,
    [
      revision,
      Number(state.version),
      JSON.stringify(state.settings),
      JSON.stringify(state.catalogs),
      updatedBy,
    ],
  );
}

export async function migrateLegacyState(connection) {
  const metadataRows = await connection.query(
    "SELECT id FROM teo_meta WHERE id = 1",
  );
  if (metadataRows[0]) return { migrated: false, reason: "already_relational" };

  const legacyRows = await connection.query(
    `SELECT revision, payload, updated_by
       FROM teo_state
      WHERE id = 1`,
  );
  const legacy = legacyRows[0];
  if (!legacy) return { migrated: false, reason: "legacy_empty" };

  const state = parseJson(legacy.payload);
  await initializeRelationalState(connection, state, {
    revision: Number(legacy.revision) || 1,
    updatedBy: legacy.updated_by || "migration",
  });
  return {
    migrated: true,
    revision: Number(legacy.revision) || 1,
  };
}

export async function migrateNormalizedRelationships(connection) {
  await ensureColumn(
    connection,
    "teo_users",
    "employee_id",
    "ALTER TABLE teo_users ADD COLUMN employee_id VARCHAR(100) NULL AFTER id",
  );
  await ensureIndex(
    connection,
    "teo_users",
    "uq_teo_user_employee",
    "ALTER TABLE teo_users ADD UNIQUE KEY uq_teo_user_employee (employee_id)",
  );

  const row = await readPayloadState(connection);
  if (!row) return { migrated: false, reason: "relational_empty" };
  await synchronizeNormalizedRelationships(
    connection,
    row.state,
    Number(row.revision) || 1,
  );
  return { migrated: true, revision: Number(row.revision) || 1 };
}

export async function addRelationalForeignKeys(connection) {
  const definitions = [
    foreignKey(
      "teo_completions",
      "fk_teo_completion_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_completions",
      "fk_teo_completion_training",
      "training_id",
      "teo_trainings",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_meeting_attendances",
      "fk_teo_attendance_meeting",
      "meeting_id",
      "teo_meetings",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_meeting_attendances",
      "fk_teo_attendance_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_vacation_entitlements",
      "fk_teo_entitlement_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_vacation_days",
      "fk_teo_vacation_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_device_instructions",
      "fk_teo_instruction_device",
      "device_id",
      "teo_devices",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_device_instructions",
      "fk_teo_instruction_instructor",
      "instructor_employee_id",
      "teo_employees",
      "id",
      "SET NULL",
    ),
    foreignKey(
      "teo_employee_qualifications",
      "fk_teo_employee_qualification_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_employee_qualifications",
      "fk_teo_employee_qualification_catalog",
      "qualification_id",
      "teo_qualification_catalog",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_employee_qualification_history",
      "fk_teo_qualification_history_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_employee_qualification_history",
      "fk_teo_qualification_history_catalog",
      "qualification_id",
      "teo_qualification_catalog",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_device_instruction_participants",
      "fk_teo_instruction_participant_instruction",
      "instruction_id",
      "teo_device_instructions",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_device_instruction_participants",
      "fk_teo_instruction_participant_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_meeting_expected_employees",
      "fk_teo_meeting_expected_meeting",
      "meeting_id",
      "teo_meetings",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_meeting_expected_employees",
      "fk_teo_meeting_expected_employee",
      "employee_id",
      "teo_employees",
      "id",
      "CASCADE",
    ),
    foreignKey(
      "teo_users",
      "fk_teo_user_employee",
      "employee_id",
      "teo_employees",
      "id",
      "SET NULL",
    ),
  ];
  for (const definition of definitions) {
    await addForeignKeyIfMissing(connection, definition);
  }
  return { added: definitions.length };
}

export async function reconcileNewerLegacyState(pool) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const metadataRows = await connection.query(
      `SELECT revision, updated_at
         FROM teo_meta
        WHERE id = 1
        FOR UPDATE`,
    );
    const legacyRows = await connection.query(
      `SELECT revision, payload, updated_at, updated_by
         FROM teo_state
        WHERE id = 1
        FOR UPDATE`,
    );
    const metadata = metadataRows[0];
    const legacy = legacyRows[0];
    if (!legacy) {
      await connection.commit();
      return { reconciled: false, reason: "legacy_empty" };
    }

    const legacyRevision = Number(legacy.revision) || 1;
    if (!metadata) {
      await initializeRelationalState(
        connection,
        parseJson(legacy.payload),
        {
          revision: legacyRevision,
          updatedBy: legacy.updated_by || "legacy-recovery",
        },
      );
      await connection.commit();
      return { reconciled: true, revision: legacyRevision };
    }

    const metadataRevision = Number(metadata.revision);
    const legacyIsNewer =
      legacyRevision > metadataRevision ||
      (legacyRevision === metadataRevision &&
        new Date(legacy.updated_at).getTime() >
          new Date(metadata.updated_at).getTime());
    if (!legacyIsNewer) {
      await connection.commit();
      return { reconciled: false, reason: "relational_current" };
    }

    await replaceRelationalState(
      connection,
      parseJson(legacy.payload),
      {
        revision: legacyRevision,
        updatedBy: legacy.updated_by || "legacy-recovery",
      },
    );
    await connection.commit();
    return { reconciled: true, revision: legacyRevision };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    connection?.release();
  }
}

async function synchronizeCollection(connection, spec, items) {
  const existingRows = await connection.query(
    `SELECT id, sort_order, payload FROM ${spec.table}`,
  );
  const existingById = new Map(
    existingRows.map((row) => [
      String(row.id),
      {
        sortOrder: Number(row.sort_order),
        payload: stringifyJson(row.payload),
      },
    ]),
  );
  const nextIds = new Set(items.map((item) => spec.id(item)));

  for (const existingId of existingById.keys()) {
    if (!nextIds.has(existingId)) {
      await connection.query(
        `DELETE FROM ${spec.table} WHERE id = ?`,
        [existingId],
      );
    }
  }

  for (const [sortOrder, item] of items.entries()) {
    const id = spec.id(item);
    const payload = JSON.stringify(item);
    const existing = existingById.get(id);
    if (
      existing &&
      existing.sortOrder === sortOrder &&
      existing.payload === payload
    ) {
      continue;
    }
    await upsertItem(connection, spec, item, sortOrder, payload);
  }
}

async function synchronizeNormalizedRelationships(
  connection,
  state,
  revision,
) {
  await synchronizeQualificationCatalog(
    connection,
    state.catalogs?.qualifications || [],
  );
  await synchronizeEmployeeQualifications(
    connection,
    state.employees || [],
    revision,
  );
  await synchronizeDeviceInstructionParticipants(
    connection,
    state.deviceInstructions || [],
  );
  await synchronizeMeetingExpectedEmployees(
    connection,
    state.meetings || [],
  );
  await synchronizeUserEmployeeLinks(
    connection,
    state.users || [],
    state.employees || [],
  );
}

async function hydrateNormalizedRelationships(connection, state) {
  const qualificationRows = await connection.query(
    `SELECT id, label
       FROM teo_qualification_catalog
      ORDER BY sort_order, id`,
  );
  state.catalogs = state.catalogs || {};
  state.catalogs.qualifications = qualificationRows.map((row) => ({
    id: String(row.id),
    label: String(row.label),
  }));

  const qualificationsByEmployee = new Map();
  const employeeQualificationRows = await connection.query(
    `SELECT employee_id, qualification_id, expires_on
       FROM teo_employee_qualifications
      ORDER BY employee_id, qualification_id`,
  );
  for (const row of employeeQualificationRows) {
    const employeeId = String(row.employee_id);
    if (!qualificationsByEmployee.has(employeeId)) {
      qualificationsByEmployee.set(employeeId, []);
    }
    qualificationsByEmployee.get(employeeId).push(row);
  }
  for (const employee of state.employees || []) {
    employee.qualifications = Object.fromEntries(
      qualificationRows.map((row) => [String(row.id), false]),
    );
    employee.qualificationExpiries = {};
    for (const row of qualificationsByEmployee.get(employee.id) || []) {
      const qualificationId = String(row.qualification_id);
      employee.qualifications[qualificationId] = true;
      const expiry = isoDate(row.expires_on);
      if (expiry) employee.qualificationExpiries[qualificationId] = expiry;
    }
  }

  const participantRows = await connection.query(
    `SELECT instruction_id, employee_id, was_medical_products_officer
       FROM teo_device_instruction_participants
      ORDER BY instruction_id, sort_order, employee_id`,
  );
  const participantsByInstruction = groupRows(participantRows, "instruction_id");
  for (const instruction of state.deviceInstructions || []) {
    instruction.participants = (
      participantsByInstruction.get(instruction.id) || []
    ).map((row) => ({
      employeeId: String(row.employee_id),
      wasMedicalProductsOfficer: Boolean(
        row.was_medical_products_officer,
      ),
    }));
  }

  const instructorRows = await connection.query(
    `SELECT id, instructor_employee_id
       FROM teo_device_instructions`,
  );
  const instructorsByInstruction = new Map(
    instructorRows.map((row) => [
      String(row.id),
      row.instructor_employee_id
        ? String(row.instructor_employee_id)
        : "",
    ]),
  );
  for (const instruction of state.deviceInstructions || []) {
    if (instruction.instructorType === "employee") {
      instruction.instructorEmployeeId =
        instructorsByInstruction.get(instruction.id) || "";
    }
  }

  const expectedRows = await connection.query(
    `SELECT meeting_id, employee_id
       FROM teo_meeting_expected_employees
      ORDER BY meeting_id, sort_order, employee_id`,
  );
  const expectedByMeeting = groupRows(expectedRows, "meeting_id");
  for (const meeting of state.meetings || []) {
    meeting.expectedEmployeeIds = (
      expectedByMeeting.get(meeting.id) || []
    ).map((row) => String(row.employee_id));
  }
}

async function synchronizeQualificationCatalog(connection, qualifications) {
  const existingRows = await connection.query(
    "SELECT id, sort_order, label FROM teo_qualification_catalog",
  );
  const existing = new Map(
    existingRows.map((row) => [String(row.id), row]),
  );
  const nextIds = new Set(qualifications.map((item) => String(item.id)));
  for (const id of existing.keys()) {
    if (!nextIds.has(id)) {
      await connection.query(
        "DELETE FROM teo_qualification_catalog WHERE id = ?",
        [id],
      );
    }
  }
  for (const [sortOrder, qualification] of qualifications.entries()) {
    const id = String(qualification.id);
    const label = String(qualification.label);
    const current = existing.get(id);
    if (
      current &&
      Number(current.sort_order) === sortOrder &&
      String(current.label) === label
    ) {
      continue;
    }
    await connection.query(
      `INSERT INTO teo_qualification_catalog
        (id, sort_order, label, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE
         sort_order = VALUES(sort_order),
         label = VALUES(label),
         updated_at = CURRENT_TIMESTAMP(3)`,
      [id, sortOrder, label],
    );
  }
}

async function synchronizeEmployeeQualifications(
  connection,
  employees,
  revision,
) {
  const existingRows = await connection.query(
    `SELECT employee_id, qualification_id, expires_on
       FROM teo_employee_qualifications`,
  );
  const existing = new Map(
    existingRows.map((row) => [
      relationKey(row.employee_id, row.qualification_id),
      row,
    ]),
  );
  const desired = new Map();
  for (const employee of employees) {
    for (const [qualificationId, selected] of Object.entries(
      employee.qualifications || {},
    )) {
      if (!selected) continue;
      desired.set(relationKey(employee.id, qualificationId), {
        employeeId: employee.id,
        qualificationId,
        expiresOn: employee.qualificationExpiries?.[qualificationId] || null,
      });
    }
  }

  for (const [key, row] of existing) {
    if (desired.has(key)) continue;
    await connection.query(
      `UPDATE teo_employee_qualification_history
          SET assigned_until = CURRENT_TIMESTAMP(3)
        WHERE employee_id = ?
          AND qualification_id = ?
          AND assigned_until IS NULL`,
      [row.employee_id, row.qualification_id],
    );
    await connection.query(
      `DELETE FROM teo_employee_qualifications
        WHERE employee_id = ? AND qualification_id = ?`,
      [row.employee_id, row.qualification_id],
    );
  }

  for (const [key, item] of desired) {
    const current = existing.get(key);
    if (!current) {
      await connection.query(
        `INSERT INTO teo_employee_qualification_history
          (employee_id, qualification_id, assigned_from, assigned_until,
           source_revision)
         VALUES (?, ?, CURRENT_TIMESTAMP(3), NULL, ?)`,
        [item.employeeId, item.qualificationId, revision],
      );
    }
    if (current && isoDate(current.expires_on) === (item.expiresOn || "")) {
      continue;
    }
    await connection.query(
      `INSERT INTO teo_employee_qualifications
        (employee_id, qualification_id, expires_on, assigned_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE
         expires_on = VALUES(expires_on),
         updated_at = CURRENT_TIMESTAMP(3)`,
      [item.employeeId, item.qualificationId, item.expiresOn],
    );
  }
}

async function synchronizeDeviceInstructionParticipants(
  connection,
  instructions,
) {
  const desired = [];
  for (const instruction of instructions) {
    for (const [sortOrder, participant] of (
      instruction.participants || []
    ).entries()) {
      desired.push({
        leftId: instruction.id,
        rightId: participant.employeeId,
        sortOrder,
        officer: Boolean(participant.wasMedicalProductsOfficer),
      });
    }
  }
  await synchronizeOrderedRelations(
    connection,
    "teo_device_instruction_participants",
    "instruction_id",
    "employee_id",
    desired,
    {
      extraColumn: "was_medical_products_officer",
      extraValue: (item) => item.officer,
    },
  );
}

async function synchronizeMeetingExpectedEmployees(connection, meetings) {
  const desired = [];
  for (const meeting of meetings) {
    for (const [sortOrder, employeeId] of (
      meeting.expectedEmployeeIds || []
    ).entries()) {
      desired.push({
        leftId: meeting.id,
        rightId: employeeId,
        sortOrder,
      });
    }
  }
  await synchronizeOrderedRelations(
    connection,
    "teo_meeting_expected_employees",
    "meeting_id",
    "employee_id",
    desired,
  );
}

async function synchronizeOrderedRelations(
  connection,
  table,
  leftColumn,
  rightColumn,
  desiredItems,
  { extraColumn = "", extraValue = () => null } = {},
) {
  const extraSelect = extraColumn ? `, ${extraColumn}` : "";
  const existingRows = await connection.query(
    `SELECT ${leftColumn}, ${rightColumn}, sort_order${extraSelect}
       FROM ${table}`,
  );
  const existing = new Map(
    existingRows.map((row) => [
      relationKey(row[leftColumn], row[rightColumn]),
      row,
    ]),
  );
  const desired = new Map(
    desiredItems.map((item) => [
      relationKey(item.leftId, item.rightId),
      item,
    ]),
  );
  for (const [key, row] of existing) {
    if (desired.has(key)) continue;
    await connection.query(
      `DELETE FROM ${table}
        WHERE ${leftColumn} = ? AND ${rightColumn} = ?`,
      [row[leftColumn], row[rightColumn]],
    );
  }
  for (const [key, item] of desired) {
    const current = existing.get(key);
    const nextExtra = extraColumn ? extraValue(item) : null;
    if (
      current &&
      Number(current.sort_order) === item.sortOrder &&
      (!extraColumn || Boolean(current[extraColumn]) === Boolean(nextExtra))
    ) {
      continue;
    }
    const columns = [leftColumn, rightColumn, "sort_order"];
    const values = [item.leftId, item.rightId, item.sortOrder];
    const updates = ["sort_order = VALUES(sort_order)"];
    if (extraColumn) {
      columns.push(extraColumn);
      values.push(nextExtra);
      updates.push(`${extraColumn} = VALUES(${extraColumn})`);
    }
    await connection.query(
      `INSERT INTO ${table}
        (${columns.join(", ")}, updated_at)
       VALUES (${columns.map(() => "?").join(", ")}, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE
         ${updates.join(", ")},
         updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

async function synchronizeUserEmployeeLinks(
  connection,
  users,
  employees,
) {
  const employeeByUsername = new Map(
    employees
      .filter((employee) => employee.username)
      .map((employee) => [
        String(employee.username).toLocaleLowerCase("de-DE"),
        employee.id,
      ]),
  );
  for (const user of users) {
    const employeeId =
      employeeByUsername.get(
        String(user.username).toLocaleLowerCase("de-DE"),
      ) || null;
    await connection.query(
      `UPDATE teo_users
          SET employee_id = ?
        WHERE id = ?
          AND NOT (employee_id <=> ?)`,
      [employeeId, user.id, employeeId],
    );
  }
}

async function readPayloadState(connection) {
  const metadataRows = await connection.query(
    `SELECT revision, state_version, settings, catalogs, updated_at, updated_by
       FROM teo_meta
      WHERE id = 1`,
  );
  const metadata = metadataRows[0];
  if (!metadata) return null;
  const state = { version: Number(metadata.state_version) };
  for (const spec of COLLECTION_SPECS) {
    const rows = await connection.query(
      `SELECT payload FROM ${spec.table} ORDER BY sort_order, id`,
    );
    state[spec.stateKey] = rows.map((row) => parseJson(row.payload));
  }
  state.settings = parseJson(metadata.settings);
  state.catalogs = parseJson(metadata.catalogs);
  return {
    revision: Number(metadata.revision),
    state,
    updatedAt: metadata.updated_at,
    updatedBy: metadata.updated_by,
  };
}

async function normalizedRelationshipsAvailable(connection) {
  const rows = await connection.query(
    `SELECT COUNT(*) AS table_count
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (
          'teo_qualification_catalog',
          'teo_employee_qualifications',
          'teo_device_instruction_participants',
          'teo_meeting_expected_employees'
        )`,
  );
  return Number(rows[0]?.table_count) === 4;
}

async function ensureColumn(connection, table, columnName, statement) {
  const rows = await connection.query(
    `SELECT 1 AS present
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1`,
    [table, columnName],
  );
  if (!rows[0]) await connection.query(statement);
}

async function ensureIndex(connection, table, indexName, statement) {
  const rows = await connection.query(
    `SELECT 1 AS present
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1`,
    [table, indexName],
  );
  if (!rows[0]) await connection.query(statement);
}

function foreignKey(
  table,
  name,
  columnName,
  referencedTable,
  referencedColumn,
  onDelete,
) {
  return {
    table,
    name,
    columnName,
    referencedTable,
    referencedColumn,
    onDelete,
  };
}

async function addForeignKeyIfMissing(connection, definition) {
  const rows = await connection.query(
    `SELECT 1 AS present
       FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
      LIMIT 1`,
    [definition.table, definition.name],
  );
  if (rows[0]) return;
  await connection.query(
    `ALTER TABLE ${definition.table}
       ADD CONSTRAINT ${definition.name}
       FOREIGN KEY (${definition.columnName})
       REFERENCES ${definition.referencedTable}
         (${definition.referencedColumn})
       ON UPDATE CASCADE
       ON DELETE ${definition.onDelete}`,
  );
}

function relationKey(left, right) {
  return `${String(left)}\u0000${String(right)}`;
}

function groupRows(rows, keyName) {
  const grouped = new Map();
  for (const row of rows) {
    const key = String(row[keyName]);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function isoDate(value) {
  if (!value) return "";
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

async function insertCollection(connection, spec, items) {
  for (const [sortOrder, item] of items.entries()) {
    await upsertItem(
      connection,
      spec,
      item,
      sortOrder,
      JSON.stringify(item),
    );
  }
}

async function upsertItem(
  connection,
  spec,
  item,
  sortOrder,
  payload,
) {
  const domainColumnNames = spec.columns.map((entry) => entry.name);
  const allColumnNames = [
    "id",
    "sort_order",
    "payload",
    ...domainColumnNames,
  ];
  const values = [
    spec.id(item),
    sortOrder,
    payload,
    ...spec.columns.map((entry) => entry.value(item)),
  ];
  const updates = [
    "sort_order = VALUES(sort_order)",
    "payload = VALUES(payload)",
    ...domainColumnNames.map((name) => `${name} = VALUES(${name})`),
    "updated_at = CURRENT_TIMESTAMP(3)",
  ];
  await connection.query(
    `INSERT INTO ${spec.table}
      (${allColumnNames.join(", ")}, updated_at)
     VALUES (${allColumnNames.map(() => "?").join(", ")}, CURRENT_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE ${updates.join(", ")}`,
    values,
  );
}

function collection(stateKey, table, columns, id = (item) => item.id) {
  return Object.freeze({ stateKey, table, columns, id });
}

function column(name, value) {
  return Object.freeze({ name, value });
}

function timestampOrNull(value) {
  const timestamp = new Date(value || "");
  return Number.isFinite(timestamp.getTime()) ? timestamp : null;
}

function parseJson(value) {
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return value;
  }
  return JSON.parse(String(value));
}

function stringifyJson(value) {
  return JSON.stringify(parseJson(value));
}

export { COLLECTION_SPECS };
