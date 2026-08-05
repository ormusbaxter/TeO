import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const shellHtml = fs.readFileSync(
  path.join(root, "src", "html", "00-shell-dashboard.html"),
  "utf8",
);
const settingsHtml = fs.readFileSync(
  path.join(root, "src", "html", "30-device-settings-views.html"),
  "utf8",
);
const navigationSource = fs.readFileSync(
  path.join(root, "src", "app", "20-ui-auth-admin.js"),
  "utf8",
);
const sidebarSource = fs.readFileSync(
  path.join(root, "src", "app", "25-sidebar-order.js"),
  "utf8",
);

const sections = ["general", "planning", "training", "master-data", "data"];

test("Sidebar und Einstellungen bieten dieselben fünf Einstellungsbereiche", () => {
  assert.match(shellHtml, /id="settingsSidebarSubnav"/);
  assert.match(settingsHtml, /class="settings-section-nav"/);
  sections.forEach((section) => {
    const target = `data-settings-section-target="${section}"`;
    assert.equal(shellHtml.includes(target), true, `${section} fehlt in der Sidebar`);
    assert.equal(
      settingsHtml.includes(target),
      true,
      `${section} fehlt in der Einstellungsnavigation`,
    );
    assert.equal(
      settingsHtml.includes(`data-settings-section="${section}"`),
      true,
      `${section} besitzt keine zugeordnete Einstellungskarte`,
    );
  });
});

test("Untermenüs schalten die Einstellungen um und folgen der Sidebar-Sortierung", () => {
  assert.match(navigationSource, /function showSettingsSection\(/);
  assert.match(navigationSource, /panel\.hidden =/);
  assert.match(navigationSource, /showView\("settings"\)/);
  assert.match(sidebarSource, /settingsSidebarSubnav\.style\.order/);
});
