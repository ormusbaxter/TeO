import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Der Systemstatus steht zwischen Benutzer- und App-Info", async () => {
  const html = await fs.readFile(
    path.join(projectRoot, "src", "html", "00-shell-dashboard.html"),
    "utf8",
  );
  const userPosition = html.indexOf('id="currentUsername"');
  const statusPosition = html.indexOf('id="sidebarSystemStatus"');
  const appPosition = html.indexOf('id="projectBuildLabel"');

  assert.ok(userPosition >= 0);
  assert.ok(statusPosition > userPosition);
  assert.ok(appPosition > statusPosition);
  for (const id of [
    "sidebarConnectionLabel",
    "sidebarBackendLabel",
    "sidebarServerLabel",
    "sidebarRevisionLabel",
    "sidebarSchemaLabel",
    "sidebarSyncLabel",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("MariaDB-Kontakte aktualisieren den Sidebarstatus", async () => {
  const storageSource = await fs.readFile(
    path.join(projectRoot, "src", "app", "10-state-storage.js"),
    "utf8",
  );
  const authSource = await fs.readFile(
    path.join(projectRoot, "src", "app", "20-ui-auth-admin.js"),
    "utf8",
  );

  assert.match(storageSource, /markBackendConnected\(\{ health, synchronized: true \}\)/);
  assert.match(storageSource, /markBackendConnectionError\(error\)/);
  assert.match(authSource, /databaseSchemaVersion/);
  assert.match(authSource, /Letzter Abgleich/);
  assert.match(authSource, /Server nicht erreichbar/);
});

test("Der lokale Status verdichtet die Technik und zeigt die letzte Speicherung", async () => {
  const storageSource = await fs.readFile(
    path.join(projectRoot, "src", "app", "10-state-storage.js"),
    "utf8",
  );
  const authSource = await fs.readFile(
    path.join(projectRoot, "src", "app", "20-ui-auth-admin.js"),
    "utf8",
  );
  const sidebarSource = await fs.readFile(
    path.join(projectRoot, "src", "app", "25-sidebar-order.js"),
    "utf8",
  );

  assert.match(storageSource, /LOCAL_SAVE_TIMESTAMP_KEY/);
  assert.match(storageSource, /localLastSaveAt = new Date\(\)\.toISOString\(\)/);
  assert.match(authSource, /terms\[0\]\.textContent = "Speicherort"/);
  assert.match(authSource, /terms\[1\]\.textContent = "Zuletzt gespeichert"/);
  assert.match(authSource, /rows\.slice\(2\)/);
  assert.match(authSource, /formatSidebarStatusDateTime\(localLastSaveAt\)/);
  assert.match(sidebarSource, /filter\(\(row\) => !row\.hidden\)/);
});
