import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Einweisungsmatrix besitzt dieselbe Maximieren-Funktion wie die Urlaubsplanung", async () => {
  const [indexHtml, appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  assert.match(indexHtml, /id="deviceMatrixWidget"/);
  assert.match(indexHtml, /id="toggleDeviceMatrixMaximizeButton"/);
  assert.match(indexHtml, /aria-controls="deviceInstructionMatrix"/);
  assert.match(appSource, /function setDeviceMatrixMaximized\(maximized\)/);
  assert.match(appSource, /document\.body\.append\(widget\)/);
  assert.match(
    appSource,
    /deviceMatrixWidgetAnchor\.parentNode\?\.insertBefore/,
  );
  assert.match(appSource, /handleDeviceMatrixMaximizeKeydown/);
  assert.match(
    styles,
    /\.device-matrix-panel\.is-maximized\s*\{[^}]*position: fixed;[^}]*inset: clamp\(6px, 1\.2vw, 18px\);[^}]*display: flex;/s,
  );
  assert.match(
    styles,
    /\.device-matrix-panel\.is-maximized \.device-matrix-scroll\s*\{[^}]*max-height: none;[^}]*flex: 1 1 auto;/s,
  );
});
