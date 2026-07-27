import crypto from "node:crypto";

export function createSessionStore(pool, sessionTtlMs) {
  async function create(user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query(
      `INSERT INTO teo_sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND))`,
      [hashToken(token), user.id, Math.ceil(sessionTtlMs / 1000)],
    );
    await prune();
    return token;
  }

  async function read(token, { refresh = true } = {}) {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const rows = await pool.query(
      `SELECT user_id, expires_at
         FROM teo_sessions
        WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP(3)`,
      [tokenHash],
    );
    if (!rows[0]) return null;
    if (refresh) {
      await pool.query(
        `UPDATE teo_sessions
            SET expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND)
          WHERE token_hash = ?`,
        [Math.ceil(sessionTtlMs / 1000), tokenHash],
      );
    }
    return {
      tokenHash,
      userId: rows[0].user_id,
      expiresAt: new Date(rows[0].expires_at).getTime(),
    };
  }

  async function removeByHash(tokenHash) {
    if (!tokenHash) return;
    await pool.query("DELETE FROM teo_sessions WHERE token_hash = ?", [
      tokenHash,
    ]);
  }

  async function prune() {
    await pool.query(
      "DELETE FROM teo_sessions WHERE expires_at <= CURRENT_TIMESTAMP(3)",
    );
  }

  return { create, read, removeByHash, prune };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}
