import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { PROJECT_META, projectBuildNumber } from "../src/meta/project-meta.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFile(path.join(projectRoot, relativePath), "utf8");

const [
  appSource,
  backendSource,
  htmlSource,
  cssSource,
  generatedMeta,
  generatedSchema,
] =
  await Promise.all([
    read("app.js"),
    read("backend-client.js"),
    read("index.html"),
    read("styles.css"),
    read("project-meta.js"),
    read("state-schema.js"),
  ]);

new vm.Script(appSource, { filename: "app.js" });
new vm.Script(backendSource, { filename: "backend-client.js" });
new vm.Script(generatedSchema, { filename: "state-schema.js" });
const metaContext = { window: {} };
vm.createContext(metaContext);
new vm.Script(generatedMeta, { filename: "project-meta.js" }).runInContext(
  metaContext,
);

const ids = [...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "index.html enthält doppelte IDs");
assert.match(
  htmlSource,
  /<script src="project-meta\.js"><\/script>[\s\S]*<script src="state-schema\.js"><\/script>[\s\S]*<script src="app\.js"><\/script>/,
  "Projektmetadaten und Datenvertrag müssen vor app.js geladen werden",
);
assert.equal(
  (cssSource.match(/{/g) || []).length,
  (cssSource.match(/}/g) || []).length,
  "styles.css enthält unausgeglichene geschweifte Klammern",
);
assert.doesNotMatch(
  appSource,
  /INITIAL_USERS|EMPLOYEE_EMAIL_ASSIGNMENTS/,
  "Produktivcode darf keine fest eingebauten Konten oder Personendaten enthalten",
);
assert.match(
  htmlSource,
  /<select id="profession" name="profession" required>/,
  "Das Berufsfeld muss als direkt auswählbares Dropdown umgesetzt sein",
);
assert.doesNotMatch(
  htmlSource,
  /professionOptions|<datalist[^>]*id="profession/,
  "Das Berufsfeld darf kein schwer bedienbares Datalist-Eingabefeld verwenden",
);
assert.match(
  htmlSource,
  /id="applyWeekendSimulationButton"[\s\S]*data-admin-only/,
  "Die Simulationsübernahme muss als administrative Aktion gekennzeichnet sein",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(metaContext.window.TeOProjectMeta)),
  JSON.parse(JSON.stringify(PROJECT_META)),
  "Die generierten Projektmetadaten sind nicht aktuell",
);

console.log(`TeO ${projectBuildNumber(PROJECT_META)}: Strukturprüfung erfolgreich.`);
