import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Sicherungen und Telefonliste verwenden integrierte TeO-Dialoge", async () => {
  const [appSource, indexHtml, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.doesNotMatch(appSource, /window\.prompt|window\.open/);
  assert.match(indexHtml, /id="backupPasswordDialog"/);
  assert.match(indexHtml, /id="backupPasswordConfirmation"/);
  assert.match(indexHtml, /id="phoneListPreviewDialog"/);
  assert.match(indexHtml, /id="phoneListPrintSurface"/);
  assert.match(
    indexHtml,
    /class="notification-stack" id="notificationStack" popover="manual"/s,
  );
  assert.match(appSource, /stack\.showPopover\(\)/);
  assert.match(appSource, /stack\.hidePopover\(\)/);
  assert.match(appSource, /function syncNotificationLayer\(\)/);
  assert.match(appSource, /document\.body\.append\(stack\)/);
  assert.doesNotMatch(
    appSource,
    /activeDialog\.append\(elements\.(?:toastRegion|notificationStack)\)/,
  );
  assert.match(
    appSource,
    /if \(popoverOpen\) stack\.hidePopover\(\);[\s\S]*document\.body\.append\(stack\);[\s\S]*stack\.showPopover\(\)/,
  );
  assert.match(appSource, /setTimeout\(syncNotificationLayer, 0\)/);
  assert.match(
    styles,
    /\.notification-stack::backdrop\s*\{[^}]*background: transparent;[^}]*backdrop-filter: none;/s,
  );
  assert.doesNotMatch(styles, /\.modal > \.(?:toast-region|notification-stack)/);
  assert.match(
    styles,
    /@page phone-list\s*\{[^}]*size: A4 portrait;[^}]*margin: 0;/s,
  );
  assert.match(
    styles,
    /@page weekend-overview\s*\{[^}]*size: A4 landscape;[^}]*margin: 10mm;/s,
  );
  assert.match(
    styles,
    /body\.print-weekend-overview > #weekendOverviewDialog\s*\{[^}]*page: weekend-overview;[^}]*height: auto;/s,
  );
  assert.match(
    styles,
    /body\.print-weekend-overview \.weekend-comparison-table\s*\{[^}]*min-width: 0;[^}]*table-layout: fixed;/s,
  );
  assert.match(
    styles,
    /body\.print-weekend-overview \.weekend-distribution-list\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/s,
  );
  assert.match(
    styles,
    /\.phone-list-preview-canvas \.phone-list-document\s*\{[^}]*padding: 15mm;/s,
  );
  assert.match(
    styles,
    /\.phone-list-document-header\s*\{[^}]*border-bottom: 1\.5pt solid #111;/s,
  );
  assert.match(
    styles,
    /\.phone-list-document th\s*\{[^}]*color: #000;[^}]*background: #e8e8e8;/s,
  );
  assert.match(
    styles,
    /body\.print-phone-list > #phoneListPrintSurface\s*\{[^}]*min-height: 297mm;[^}]*padding: 15mm;/s,
  );
  assert.match(styles, /body\.print-phone-list/);
  assert.match(
    styles,
    /\.phone-list-preview-dialog\[open\][^{]*\{[^}]*grid-template-rows: auto minmax\(0, 1fr\) auto/s,
  );
  assert.match(
    styles,
    /body\.print-phone-list > #trainingMatrixDialog/,
  );
});
