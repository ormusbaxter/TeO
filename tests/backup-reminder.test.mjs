import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

test("Die Schließen-Erinnerung reagiert auf Änderungen seit der letzten Sicherung", async () => {
  const app = await loadAppFunctions(["shouldRemindBeforeUnload"]);
  const emptyState = createMinimalState();
  assert.equal(app.shouldRemindBeforeUnload(emptyState), false);

  const employee = createEmployee();
  const unsavedState = createMinimalState({
    employees: [employee],
    settings: {
      lastBackupAt: "",
    },
  });
  assert.equal(app.shouldRemindBeforeUnload(unsavedState), true);

  const backedUpState = createMinimalState({
    employees: [employee],
    settings: {
      lastBackupAt: "2026-02-01T00:00:00.000Z",
    },
    auditLog: [
      {
        id: "audit-backup",
        timestamp: "2026-02-01T00:00:00.000Z",
        username: "Admin999",
        action: "Datensicherung exportiert",
      },
    ],
  });
  assert.equal(app.shouldRemindBeforeUnload(backedUpState), false);

  backedUpState.auditLog.push({
    id: "audit-change",
    timestamp: "2026-02-02T00:00:00.000Z",
    username: "Admin999",
    action: "Mitarbeiterdaten geändert",
  });
  assert.equal(app.shouldRemindBeforeUnload(backedUpState), true);
});

test("Die Sicherungswarnung liegt als Einblendung in der Meldungsebene", async () => {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const [indexHtml, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Die Warnung steht in der Meldungsebene unten rechts und nicht mehr im
  // Seitenfluss ueber der Kopfzeile der jeweiligen Ansicht.
  const stack = indexHtml.match(
    /<div class="notification-stack"[\s\S]*?\n    <\/div>/,
  );
  assert.ok(stack, "Die Meldungsebene fehlt in index.html.");
  assert.match(stack[0], /id="toastRegion"/);
  assert.match(stack[0], /id="databaseSaveWarning"/);
  assert.doesNotMatch(
    indexHtml.slice(0, indexHtml.indexOf('<div class="notification-stack"')),
    /id="databaseSaveWarning"/,
  );
  assert.match(
    styles,
    /\.notification-stack\s*\{[^}]*position: fixed;[^}]*inset: auto 24px 24px auto;/s,
  );
  // Die Schaltflaeche der Warnung bleibt bedienbar, obwohl die Ebene selbst
  // keine Zeigereignisse annimmt.
  assert.match(
    styles,
    /\.database-save-warning\s*\{[^}]*pointer-events: auto;/s,
  );
});
