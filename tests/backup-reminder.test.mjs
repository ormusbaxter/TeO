import assert from "node:assert/strict";
import test from "node:test";
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
