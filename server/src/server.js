import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import mariadb from "mariadb";

const APP_STATE_ID = 1;
const PASSWORD_ITERATIONS = 210000;
const MAX_STATE_BYTES = 20 * 1024 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS_PER_WINDOW = 8;

const host = process.env.TEO_HOST || "0.0.0.0";
const port = integerEnv("TEO_PORT", 3000, 1, 65535);
const sessionTtlMs =
  integerEnv("TEO_SESSION_HOURS", 12, 1, 168) * 60 * 60 * 1000;
const allowedOrigins = String(process.env.TEO_CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const requiredDatabaseSettings = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingDatabaseSettings = requiredDatabaseSettings.filter(
  (name) => !process.env[name],
);
if (missingDatabaseSettings.length) {
  throw new Error(
    `Fehlende Datenbankkonfiguration: ${missingDatabaseSettings.join(", ")}`,
  );
}

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: integerEnv("DB_PORT", 3306, 1, 65535),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: integerEnv("DB_CONNECTION_LIMIT", 5, 1, 50),
  charset: "utf8mb4",
  ssl: booleanEnv("DB_SSL", false) ? { rejectUnauthorized: true } : undefined,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
});

const sessions = new Map();
const loginAttempts = new Map();
const app = express();
const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "../..");

app.disable("x-powered-by");
app.use((request, response, next) => {
  response.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http: https:; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    "Cache-Control": request.path.startsWith("/api/")
      ? "no-store"
      : "no-cache",
  });
  next();
});
app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (!origin) return next();
  if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  }
  return response.status(403).json({
    code: "origin_not_allowed",
    message: "Dieser Aufrufursprung ist für den TeO-Server nicht freigegeben.",
  });
});
app.use(express.json({ limit: MAX_STATE_BYTES }));

app.get("/api/health", asyncHandler(async (_request, response) => {
  await pool.query("SELECT 1");
  const row = await readStateRow();
  response.json({
    ok: true,
    service: "TeO MariaDB API",
    initialized: Boolean(row),
    revision: row ? Number(row.revision) : 0,
    serverTime: new Date().toISOString(),
  });
}));

app.post("/api/bootstrap", loginRateLimit, asyncHandler(async (request, response) => {
  const { state, username, password } = request.body || {};
  validateStateShape(state);
  const user = findUser(state, username);
  if (
    !user ||
    user.role !== "admin" ||
    !verifyPassword(password, user)
  ) {
    registerFailedLogin(request.ip);
    return response.status(401).json({
      code: "invalid_credentials",
      message: "Administratorname oder Passwort ist nicht korrekt.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const existing = await readStateRow(connection, true);
    if (existing) {
      await connection.rollback();
      return response.status(409).json({
        code: "already_initialized",
        message: "Die MariaDB enthält bereits einen TeO-Datenbestand.",
      });
    }

    await connection.query(
      `INSERT INTO teo_state
        (id, revision, payload, updated_at, updated_by)
       VALUES (?, 1, ?, CURRENT_TIMESTAMP(3), ?)`,
      [APP_STATE_ID, JSON.stringify(state), user.username],
    );
    await connection.commit();
  } catch (error) {
    if (connection) await safeRollback(connection);
    throw error;
  } finally {
    connection?.release();
  }

  clearFailedLogins(request.ip);
  const token = createSession(user);
  response.status(201).json({
    token,
    user: publicUser(user),
    state: stateForClient(state, user.id),
    revision: 1,
    initialized: true,
  });
}));

app.post("/api/auth/login", loginRateLimit, asyncHandler(async (request, response) => {
  const row = await readStateRow();
  if (!row) {
    return response.status(409).json({
      code: "not_initialized",
      message:
        "Die MariaDB ist noch nicht eingerichtet. Bitte zuerst als Administrator verbinden.",
    });
  }

  const state = parseStatePayload(row.payload);
  const user = findUser(state, request.body?.username);
  if (!user || !verifyPassword(request.body?.password, user)) {
    registerFailedLogin(request.ip);
    return response.status(401).json({
      code: "invalid_credentials",
      message: "Benutzername oder Passwort ist nicht korrekt.",
    });
  }

  clearFailedLogins(request.ip);
  const token = createSession(user);
  response.json({
    token,
    user: publicUser(user),
    state: stateForClient(state, user.id),
    revision: Number(row.revision),
  });
}));

app.delete("/api/auth/session", requireSession, (request, response) => {
  sessions.delete(request.session.token);
  response.sendStatus(204);
});

app.get("/api/state", requireSession, asyncHandler(async (request, response) => {
  const row = await readStateRow();
  if (!row) {
    return response.status(409).json({
      code: "not_initialized",
      message: "In MariaDB ist noch kein TeO-Datenbestand vorhanden.",
    });
  }
  const state = parseStatePayload(row.payload);
  const currentUser = state.users?.find(
    (user) => user.id === request.session.userId,
  );
  if (!currentUser) {
    sessions.delete(request.session.token);
    return response.status(401).json({
      code: "session_user_missing",
      message: "Das Benutzerkonto dieser Sitzung existiert nicht mehr.",
    });
  }
  response.json({
    state: stateForClient(state, currentUser.id),
    revision: Number(row.revision),
    user: publicUser(currentUser),
  });
}));

app.put("/api/state", requireSession, asyncHandler(async (request, response) => {
  const nextState = request.body?.state;
  const expectedRevision = Number(request.body?.expectedRevision);
  validateStateShape(nextState);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    return response.status(400).json({
      code: "invalid_revision",
      message: "Die erwartete Datenrevision ist ungültig.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const row = await readStateRow(connection, true);
    if (!row) {
      await connection.rollback();
      return response.status(409).json({
        code: "not_initialized",
        message: "In MariaDB ist noch kein TeO-Datenbestand vorhanden.",
      });
    }

    const currentRevision = Number(row.revision);
    const currentState = parseStatePayload(row.payload);
    const currentUser = currentState.users?.find(
      (user) => user.id === request.session.userId,
    );
    if (!currentUser) {
      await connection.rollback();
      sessions.delete(request.session.token);
      return response.status(401).json({
        code: "session_user_missing",
        message: "Das Benutzerkonto dieser Sitzung existiert nicht mehr.",
      });
    }

    if (currentRevision !== expectedRevision) {
      await connection.rollback();
      return response.status(409).json({
        code: "revision_conflict",
        message:
          "Der Datenbestand wurde zwischenzeitlich an einem anderen Arbeitsplatz geändert.",
        state: stateForClient(currentState, currentUser.id),
        revision: currentRevision,
      });
    }

    const hydratedNextState = mergeProtectedCredentials(
      currentState,
      nextState,
    );
    if (
      currentUser.role !== "admin" &&
      !isPermittedUserMutation(
        currentState,
        hydratedNextState,
        currentUser.id,
      )
    ) {
      await connection.rollback();
      return response.status(403).json({
        code: "forbidden_mutation",
        message:
          "Diese Änderung ist für ein normales Benutzerkonto nicht freigegeben.",
      });
    }

    const nextRevision = currentRevision + 1;
    await connection.query(
      `UPDATE teo_state
          SET revision = ?,
              payload = ?,
              updated_at = CURRENT_TIMESTAMP(3),
              updated_by = ?
        WHERE id = ?`,
      [
        nextRevision,
        JSON.stringify(hydratedNextState),
        currentUser.username,
        APP_STATE_ID,
      ],
    );
    await connection.commit();
    response.json({
      state: stateForClient(hydratedNextState, currentUser.id),
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (connection) await safeRollback(connection);
    throw error;
  } finally {
    connection?.release();
  }
}));

app.use("/vendor", express.static(path.join(projectRoot, "vendor"), {
  etag: true,
  maxAge: 0,
}));
for (const fileName of [
  "index.html",
  "styles.css",
  "backend-client.js",
  "app.js",
]) {
  app.get(`/${fileName}`, (_request, response) => {
    response.sendFile(path.join(projectRoot, fileName));
  });
}
app.get("/", (_request, response) => {
  response.sendFile(path.join(projectRoot, "index.html"));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error?.type === "entity.too.large") {
    return response.status(413).json({
      code: "state_too_large",
      message: "Der TeO-Datenbestand überschreitet die zulässige Größe von 20 MB.",
    });
  }
  const status = Number(error?.status) || 500;
  return response.status(status).json({
    code: error?.code || "server_error",
    message:
      error?.message ||
      "Der TeO-Server konnte die Anfrage nicht verarbeiten.",
  });
});

await ensureSchema();
const httpServer = app.listen(port, host, () => {
  console.log(`TeO MariaDB API läuft auf http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    httpServer.close();
    await pool.end();
    process.exit(0);
  });
}

function integerEnv(name, fallback, min, max) {
  const parsed = Number(process.env[name]);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function booleanEnv(name, fallback) {
  const value = String(process.env[name] || "").trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "ja"].includes(value);
}

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

async function ensureSchema(connection = pool) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS teo_state (
      id TINYINT UNSIGNED NOT NULL,
      revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
      payload JSON NOT NULL,
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_by VARCHAR(40) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT chk_teo_singleton CHECK (id = 1)
    ) ENGINE=InnoDB
      DEFAULT CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
  `);
}

async function readStateRow(connection = pool, forUpdate = false) {
  const rows = await connection.query(
    `SELECT revision, payload, updated_at, updated_by
       FROM teo_state
      WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [APP_STATE_ID],
  );
  return rows[0] || null;
}

function parseStatePayload(payload) {
  if (payload && typeof payload === "object") return payload;
  return JSON.parse(String(payload));
}

function validateStateShape(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw httpError(400, "invalid_state", "Der TeO-Datenbestand ist ungültig.");
  }
  const requiredArrays = [
    "employees",
    "trainings",
    "completions",
    "meetings",
    "meetingAttendances",
    "appointments",
    "devices",
    "deviceInstructions",
    "vacationEntitlements",
    "vacationDays",
    "users",
    "auditLog",
  ];
  if (
    !Number.isFinite(Number(state.version)) ||
    requiredArrays.some((key) => !Array.isArray(state[key])) ||
    !state.settings ||
    typeof state.settings !== "object" ||
    !state.catalogs ||
    typeof state.catalogs !== "object"
  ) {
    throw httpError(
      400,
      "invalid_state",
      "Der TeO-Datenbestand ist unvollständig oder ungültig.",
    );
  }
  const byteLength = Buffer.byteLength(JSON.stringify(state), "utf8");
  if (byteLength > MAX_STATE_BYTES) {
    throw httpError(
      413,
      "state_too_large",
      "Der TeO-Datenbestand überschreitet die zulässige Größe von 20 MB.",
    );
  }
}

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function findUser(state, username) {
  const normalizedUsername = String(username || "").trim().toLocaleLowerCase("de-DE");
  return state.users?.find(
    (user) =>
      String(user.username || "").toLocaleLowerCase("de-DE") === normalizedUsername,
  );
}

function verifyPassword(password, user) {
  if (
    typeof password !== "string" ||
    !user?.passwordSalt ||
    !user?.passwordHash
  ) {
    return false;
  }
  try {
    const expected = Buffer.from(user.passwordHash, "base64");
    const actual = crypto.pbkdf2Sync(
      password,
      Buffer.from(user.passwordSalt, "base64"),
      PASSWORD_ITERATIONS,
      expected.length,
      "sha256",
    );
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

function stateForClient(state, currentUserId) {
  const clientState = structuredClone(state);
  const currentUser = clientState.users.find(
    (user) => user.id === currentUserId,
  );
  if (currentUser?.role === "admin") return clientState;
  clientState.users = clientState.users.map((user) =>
    user.id === currentUserId
      ? user
      : { ...user, passwordSalt: "", passwordHash: "" },
  );
  return clientState;
}

function mergeProtectedCredentials(currentState, nextState) {
  const currentUsers = new Map(
    currentState.users.map((user) => [user.id, user]),
  );
  const hydratedState = structuredClone(nextState);
  hydratedState.users = hydratedState.users.map((user) => {
    const currentUser = currentUsers.get(user.id);
    if (!currentUser || (user.passwordSalt && user.passwordHash)) return user;
    return {
      ...user,
      passwordSalt: currentUser.passwordSalt,
      passwordHash: currentUser.passwordHash,
    };
  });
  return hydratedState;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, {
    token,
    userId: user.id,
    expiresAt: Date.now() + sessionTtlMs,
  });
  pruneSessions();
  return token;
}

function requireSession(request, response, next) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return response.status(401).json({
      code: "session_expired",
      message: "Die Serversitzung ist abgelaufen. Bitte erneut anmelden.",
    });
  }
  session.expiresAt = Date.now() + sessionTtlMs;
  request.session = session;
  next();
}

function pruneSessions() {
  const now = Date.now();
  sessions.forEach((session, token) => {
    if (session.expiresAt <= now) sessions.delete(token);
  });
}

function loginRateLimit(request, response, next) {
  const entry = loginAttempts.get(request.ip);
  if (
    entry &&
    entry.resetAt > Date.now() &&
    entry.count >= LOGIN_ATTEMPTS_PER_WINDOW
  ) {
    return response.status(429).json({
      code: "too_many_login_attempts",
      message: "Zu viele Anmeldeversuche. Bitte später erneut versuchen.",
    });
  }
  next();
}

function registerFailedLogin(ip) {
  const now = Date.now();
  const existing = loginAttempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  existing.count += 1;
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

function isPermittedUserMutation(before, after, userId) {
  const permittedTopLevelKeys = new Set([
    "completions",
    "meetingAttendances",
    "users",
    "settings",
    "auditLog",
  ]);
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (
      !permittedTopLevelKeys.has(key) &&
      !deepEqual(before[key], after[key])
    ) {
      return false;
    }
  }

  if (!isPermittedSettingsMutation(before.settings, after.settings)) return false;
  if (!isPermittedOwnUserMutation(before.users, after.users, userId)) return false;
  return true;
}

function isPermittedSettingsMutation(before, after) {
  const beforeCopy = structuredClone(before || {});
  const afterCopy = structuredClone(after || {});
  delete beforeCopy.theme;
  delete afterCopy.theme;
  return deepEqual(beforeCopy, afterCopy);
}

function isPermittedOwnUserMutation(beforeUsers, afterUsers, userId) {
  if (
    !Array.isArray(beforeUsers) ||
    !Array.isArray(afterUsers) ||
    beforeUsers.length !== afterUsers.length
  ) {
    return false;
  }
  const beforeById = new Map(beforeUsers.map((user) => [user.id, user]));
  for (const nextUser of afterUsers) {
    const previousUser = beforeById.get(nextUser.id);
    if (!previousUser) return false;
    if (nextUser.id !== userId) {
      if (!deepEqual(previousUser, nextUser)) return false;
      continue;
    }
    const immutableBefore = {
      id: previousUser.id,
      username: previousUser.username,
      role: previousUser.role,
    };
    const immutableAfter = {
      id: nextUser.id,
      username: nextUser.username,
      role: nextUser.role,
    };
    if (!deepEqual(immutableBefore, immutableAfter)) return false;
  }
  return true;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function safeRollback(connection) {
  try {
    await connection.rollback();
  } catch {
    // Der ursprüngliche Datenbankfehler bleibt maßgeblich.
  }
}
