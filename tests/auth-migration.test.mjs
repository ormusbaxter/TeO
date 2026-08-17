import assert from "node:assert/strict";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const admin = {
  id: "user-admin-test",
  username: "Admin999",
  role: "admin",
  passwordSalt: "AA==",
  passwordHash: "AA==",
  mustChangePassword: false,
};

test("Administratoren aus Datenformat 21 müssen ihr Passwort einmalig ändern", async () => {
  const app = await loadAppFunctions(["normalizeState"]);
  const migrated = app.normalizeState(
    createMinimalState({ version: 21, users: [admin] }),
  );

  assert.equal(migrated.version, 25);
  assert.equal(migrated.users[0].mustChangePassword, true);
});

test("Die Passwortmigration wird in Datenformat 24 nicht erneut ausgelöst", async () => {
  const app = await loadAppFunctions(["normalizeState"]);
  const current = app.normalizeState(
    createMinimalState({ version: 24, users: [admin] }),
  );

  assert.equal(current.users[0].mustChangePassword, false);
});
