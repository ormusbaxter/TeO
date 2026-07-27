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
      await connection.query(
        `INSERT INTO teo_schema_migrations (version, name)
         VALUES (?, ?)`,
        [migration.version, migration.name],
      );
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

export { MIGRATIONS };
