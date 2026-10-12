import assert from "node:assert/strict";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

async function warningApp() {
  const app = await loadAppFunctions(
    ["renderDatabaseSaveWarning", "normalizeAutomaticBackupSettings"],
    { withDom: true },
  );
  const element = (id) => app.dom.document.querySelector(`#${id}`);
  app.setCurrentUser({ id: "admin", role: "admin" });
  app.setDatabaseSaveReminderArmed(true);
  return {
    app,
    warning: element("databaseSaveWarning"),
    title: element("databaseSaveWarningTitle"),
    text: element("databaseSaveWarningText"),
    action: element("databaseSaveWarningActionLabel"),
    useAutomaticBackup(extra = {}) {
      app.setAutomaticBackupSettings(
        app.normalizeAutomaticBackupSettings({
          enabled: true,
          directoryName: "Sicherung",
          ...extra,
        }),
      );
      app.setAutomaticBackupDirectoryHandle({ name: "Sicherung" });
    },
  };
}

test("Ohne automatische Sicherung mahnt der Hinweis zum Export", async () => {
  const { app, warning, title, action } = await warningApp();
  app.setAutomaticBackupSettings(app.normalizeAutomaticBackupSettings());
  app.renderDatabaseSaveWarning();
  assert.equal(warning.hidden, false);
  assert.equal(title.textContent, "Datensicherung erforderlich:");
  assert.equal(action.textContent, "Jetzt exportieren");
});

test("Läuft die automatische Sicherung, bleibt der Hinweis verborgen", async () => {
  const { app, warning, useAutomaticBackup } = await warningApp();
  useAutomaticBackup();
  app.renderDatabaseSaveWarning();
  assert.equal(warning.hidden, true);
});

test("Stockt die automatische Sicherung, nennt der Hinweis den Grund", async () => {
  const { app, warning, title, text, action, useAutomaticBackup } =
    await warningApp();
  useAutomaticBackup();
  app.setAutomaticBackupNotice(
    "Ordnerzugriff muss erneut bestätigt werden – „Jetzt automatisch sichern“ wählen.",
  );
  app.renderDatabaseSaveWarning();
  assert.equal(warning.hidden, false);
  assert.equal(title.textContent, "Automatische Sicherung gestoppt:");
  assert.match(text.textContent, /Ordnerzugriff/);
  assert.equal(action.textContent, "Jetzt sichern");

  // Nach der nächsten erfolgreichen Sicherung ist die Meldung leer.
  app.setAutomaticBackupNotice("");
  app.renderDatabaseSaveWarning();
  assert.equal(warning.hidden, true);
});

test("Eine gesperrte verschlüsselte Sicherung zählt nicht als laufend", async () => {
  const { app, warning, text, useAutomaticBackup } = await warningApp();
  useAutomaticBackup({ encrypted: true, keyFingerprint: "abc" });
  app.setAutomaticBackupPassword("");
  app.renderDatabaseSaveWarning();
  assert.equal(warning.hidden, false);
  assert.match(text.textContent, /Verschlüsselung aktiv/);
});
