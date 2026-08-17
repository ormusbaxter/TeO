import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shellHtml = fs.readFileSync(
  path.join(projectRoot, "src/html/00-shell-dashboard.html"),
  "utf8",
);
const settingsHtml = fs.readFileSync(
  path.join(projectRoot, "src/html/30-device-settings-views.html"),
  "utf8",
);
const uiSource = fs.readFileSync(
  path.join(projectRoot, "src/app/20-ui-auth-admin.js"),
  "utf8",
);

function createUser(overrides = {}) {
  return {
    id: "user-1",
    username: "Demo1234",
    role: "admin",
    passwordSalt: "c2FsdA==",
    passwordHash: "aGFzaA==",
    mustChangePassword: false,
    ...overrides,
  };
}

test("das Farbthema wird am Benutzerkonto gespeichert", async () => {
  const { normalizeState } = await loadAppFunctions(["normalizeState"]);
  const normalized = normalizeState(
    createMinimalState({
      users: [
        createUser({ id: "user-1", username: "Demo1234", theme: "nord" }),
        createUser({ id: "user-2", username: "Demo5678", role: "user" }),
      ],
    }),
  );

  assert.equal(normalized.users[0].theme, "nord");
  assert.equal(normalized.users[1].theme, "");
});

test("ein unbekanntes Farbthema eines Kontos wird verworfen, nicht auf Standard gesetzt", async () => {
  const { normalizeState } = await loadAppFunctions(["normalizeState"]);
  const normalized = normalizeState(
    createMinimalState({
      users: [createUser({ theme: "windows-311" })],
    }),
  );

  // Leer heisst "keine eigene Wahl" - das Konto folgt weiterhin der Vorgabe.
  assert.equal(normalized.users[0].theme, "");
});

test("das Farbthema des angemeldeten Kontos hat Vorrang vor der Vorgabe", async () => {
  const { activeThemeKey, setState, setCurrentUser } = await loadAppFunctions([
    "activeThemeKey",
    "normalizeState",
  ]);
  const state = createMinimalState({
    settings: { ...createMinimalState().settings, theme: "dracula" },
    users: [createUser({ theme: "nord" })],
  });
  setState(state);

  setCurrentUser(null);
  assert.equal(activeThemeKey(), "dracula");

  setCurrentUser(state.users[0]);
  assert.equal(activeThemeKey(), "nord");

  setCurrentUser({ ...state.users[0], theme: "" });
  assert.equal(activeThemeKey(), "dracula");
});

test("die Themenwahl schreibt in das eigene Konto und nicht in die Einstellungen", () => {
  const changeTheme = uiSource.slice(
    uiSource.indexOf("async function changeTheme("),
    uiSource.indexOf("function applyTheme("),
  );
  assert.notEqual(changeTheme, "");
  assert.match(changeTheme, /account\.theme = nextTheme/);
  assert.doesNotMatch(changeTheme, /state\.settings\.theme =/);
  // Eine Anzeigeeinstellung eines Kontos gehoert nicht in das Protokoll.
  assert.match(changeTheme, /auditAction: ""/);
});

test("die Einstellungsseite benennt das Farbthema als Kontoeinstellung", () => {
  assert.match(settingsHtml, /für das angemeldete\s+Benutzerkonto gespeichert/);
});

test("die Abmeldung in der Sidebar trägt ein eigenes Symbol", () => {
  assert.match(shellHtml, /<symbol id="icon-logout"/);
  assert.match(
    shellHtml,
    /data-logout aria-label="Abmelden" title="Abmelden">\s*<svg><use href="#icon-logout">/,
  );
});
