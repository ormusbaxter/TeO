import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PROJECT_META, projectBuildNumber } from "../src/meta/project-meta.mjs";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Die Anmeldemaske zeigt aktuelle Version und Copyright", async () => {
  const { renderProjectMetadata, dom } = await loadAppFunctions(
    ["renderProjectMetadata"],
    { withDom: true },
  );

  renderProjectMetadata();

  assert.equal(
    dom.document.querySelector("#loginProjectVersion").textContent,
    `Version ${projectBuildNumber(PROJECT_META)}`,
  );

  const authHtml = await fs.readFile(
    path.join(projectRoot, "src/html/40-auth-admin-dialogs.html"),
    "utf8",
  );
  assert.match(
    authHtml,
    /id="loginCopyright">&copy; 2026 Oliver Becker<\/span>/,
  );
});
