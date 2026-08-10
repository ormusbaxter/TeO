import {
  addRelationalForeignKeys,
  migrateLegacyState,
  migrateNormalizedRelationships,
} from "./relational-state-store.js";

const MIGRATIONS = Object.freeze([
  {
    version: 1,
    name: "central_state",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_state (
        id TINYINT UNSIGNED NOT NULL,
        revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
        payload JSON NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_by VARCHAR(40) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT chk_teo_singleton CHECK (id = 1)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
  },
  {
    version: 2,
    name: "persistent_sessions",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_sessions (
        token_hash CHAR(64) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        expires_at DATETIME(3) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (token_hash),
        INDEX idx_teo_sessions_expires (expires_at),
        INDEX idx_teo_sessions_user (user_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
  },
  {
    version: 3,
    name: "server_audit_log",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        event_type VARCHAR(80) NOT NULL,
        actor_user_id VARCHAR(100) NULL,
        actor_username VARCHAR(40) NOT NULL,
        revision BIGINT UNSIGNED NULL,
        ip_address VARCHAR(45) NULL,
        details JSON NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_audit_created (created_at),
        INDEX idx_teo_audit_actor (actor_user_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
  },
  {
    version: 4,
    name: "relational_domain_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_meta (
        id TINYINT UNSIGNED NOT NULL,
        revision BIGINT UNSIGNED NOT NULL,
        state_version INT UNSIGNED NOT NULL,
        settings JSON NOT NULL,
        catalogs JSON NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_by VARCHAR(40) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT chk_teo_meta_singleton CHECK (id = 1)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_employees (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        username VARCHAR(40) NULL,
        employment_status VARCHAR(20) NOT NULL,
        profession VARCHAR(120) NOT NULL,
        employment_percent DECIMAL(5,2) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_employee_username (username),
        INDEX idx_teo_employee_name (last_name, first_name),
        INDEX idx_teo_employee_status (employment_status),
        INDEX idx_teo_employee_profession (profession)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_trainings (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        title VARCHAR(200) NOT NULL,
        catalog_year SMALLINT UNSIGNED NOT NULL,
        recurrence_months SMALLINT UNSIGNED NULL,
        series_id VARCHAR(100) NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_training_title (title),
        INDEX idx_teo_training_year (catalog_year),
        INDEX idx_teo_training_series (series_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_completions (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        training_id VARCHAR(100) NOT NULL,
        completed_on DATE NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_completion_employee (employee_id),
        INDEX idx_teo_completion_training (training_id),
        INDEX idx_teo_completion_date (completed_on)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_meetings (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        title VARCHAR(200) NOT NULL,
        meeting_date DATE NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_meeting_date (meeting_date)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_meeting_attendances (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        meeting_id VARCHAR(100) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        attendance_status VARCHAR(30) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_meeting_employee (meeting_id, employee_id),
        INDEX idx_teo_attendance_employee (employee_id),
        INDEX idx_teo_attendance_status (attendance_status)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_appointments (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        title VARCHAR(200) NOT NULL,
        appointment_date DATE NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_appointment_date (appointment_date)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_devices (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        product_name VARCHAR(160) NOT NULL,
        manufacturer VARCHAR(160) NOT NULL,
        device_category VARCHAR(120) NOT NULL,
        annex_1 BOOLEAN NOT NULL,
        current_inventory BOOLEAN NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_device_name (product_name),
        INDEX idx_teo_device_manufacturer (manufacturer),
        INDEX idx_teo_device_category (device_category),
        INDEX idx_teo_device_inventory (current_inventory, annex_1)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_device_instructions (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        device_id VARCHAR(100) NOT NULL,
        instruction_date DATE NOT NULL,
        instructor_type VARCHAR(20) NOT NULL,
        instructor_employee_id VARCHAR(100) NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_instruction_device (device_id),
        INDEX idx_teo_instruction_date (instruction_date),
        INDEX idx_teo_instruction_employee (instructor_employee_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_vacation_entitlements (
        id VARCHAR(220) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        entitlement_year SMALLINT UNSIGNED NOT NULL,
        additional_days DECIMAL(5,2) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_entitlement_employee_year (employee_id, entitlement_year),
        INDEX idx_teo_entitlement_year (entitlement_year)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_vacation_days (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        absence_date DATE NOT NULL,
        absence_type VARCHAR(40) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_absence_employee_date (employee_id, absence_date),
        INDEX idx_teo_absence_date (absence_date),
        INDEX idx_teo_absence_type (absence_type)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_users (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        username VARCHAR(40) NOT NULL,
        user_role VARCHAR(20) NOT NULL,
        must_change_password BOOLEAN NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_user_username (username),
        INDEX idx_teo_user_role (user_role)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_client_audit_entries (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        payload JSON NOT NULL,
        event_timestamp DATETIME(3) NULL,
        actor_username VARCHAR(40) NOT NULL,
        action_text TEXT NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_teo_client_audit_timestamp (event_timestamp),
        INDEX idx_teo_client_audit_actor (actor_username)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
    run: migrateLegacyState,
  },
  {
    version: 5,
    name: "normalized_relationships",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_qualification_catalog (
        id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        label VARCHAR(160) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_teo_qualification_label (label)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_employee_qualifications (
        employee_id VARCHAR(100) NOT NULL,
        qualification_id VARCHAR(100) NOT NULL,
        expires_on DATE NULL,
        assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (employee_id, qualification_id),
        INDEX idx_teo_employee_qualification (qualification_id),
        INDEX idx_teo_employee_qualification_expiry (expires_on)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_employee_qualification_history (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        employee_id VARCHAR(100) NOT NULL,
        qualification_id VARCHAR(100) NOT NULL,
        assigned_from DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        assigned_until DATETIME(3) NULL,
        source_revision BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_teo_qualification_history_employee
          (employee_id, qualification_id, assigned_from),
        INDEX idx_teo_qualification_history_open
          (employee_id, qualification_id, assigned_until)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_device_instruction_participants (
        instruction_id VARCHAR(100) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        was_medical_products_officer BOOLEAN NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (instruction_id, employee_id),
        INDEX idx_teo_instruction_participant_employee (employee_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS teo_meeting_expected_employees (
        meeting_id VARCHAR(100) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        sort_order INT UNSIGNED NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (meeting_id, employee_id),
        INDEX idx_teo_meeting_expected_employee (employee_id)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
    run: migrateNormalizedRelationships,
  },
  {
    version: 6,
    name: "relational_foreign_keys",
    statements: [],
    run: addRelationalForeignKeys,
  },
  {
    version: 7,
    name: "persistent_login_throttling",
    statements: [
      `CREATE TABLE IF NOT EXISTS teo_login_attempts (
        client_key_hash CHAR(64) NOT NULL,
        attempt_count INT UNSIGNED NOT NULL,
        reset_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (client_key_hash),
        INDEX idx_teo_login_attempts_reset (reset_at)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci`,
    ],
  },
]);

export async function runMigrations(pool) {
  let connection;
  try {
    connection = await pool.getConnection();
    const lockRows = await connection.query(
      "SELECT GET_LOCK('teo_schema_migrations', 10) AS acquired",
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error("Die Datenbankmigration konnte nicht exklusiv gestartet werden.");
    }
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teo_schema_migrations (
        version INT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (version)
      ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
    `);
    const appliedRows = await connection.query(
      "SELECT version FROM teo_schema_migrations ORDER BY version",
    );
    const applied = new Set(appliedRows.map((row) => Number(row.version)));
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.version)) continue;
      for (const statement of migration.statements) {
        await connection.query(statement);
      }
      if (migration.run) {
        await connection.beginTransaction();
        try {
          await migration.run(connection);
          await recordMigration(connection, migration);
          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      } else {
        await recordMigration(connection, migration);
      }
    }
  } finally {
    if (connection) {
      try {
        await connection.query("SELECT RELEASE_LOCK('teo_schema_migrations')");
      } finally {
        connection.release();
      }
    }
  }
}

async function recordMigration(connection, migration) {
  await connection.query(
    `INSERT INTO teo_schema_migrations (version, name)
     VALUES (?, ?)`,
    [migration.version, migration.name],
  );
}

export { MIGRATIONS };
