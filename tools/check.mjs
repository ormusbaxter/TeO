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
  serviceWorkerSource,
] =
  await Promise.all([
    read("app.js"),
    read("backend-client.js"),
    read("index.html"),
    read("styles.css"),
    read("project-meta.js"),
    read("state-schema.js"),
    read("service-worker.js"),
  ]);
const packageJson = JSON.parse(await read("package.json"));

new vm.Script(appSource, { filename: "app.js" });
new vm.Script(backendSource, { filename: "backend-client.js" });
new vm.Script(generatedSchema, { filename: "state-schema.js" });
new vm.Script(serviceWorkerSource, { filename: "service-worker.js" });
const metaContext = { window: {} };
vm.createContext(metaContext);
new vm.Script(generatedMeta, { filename: "project-meta.js" }).runInContext(
  metaContext,
);

const ids = [...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "index.html enthält doppelte IDs");
// defer behaelt die Reihenfolge bei, deshalb genuegt weiterhin die
// Reihenfolge im Dokument. Ohne defer wuerde das Laden der Skripte das
// Parsen der 240 KB grossen Seite blockieren.
assert.match(
  htmlSource,
  /<script src="project-meta\.js" defer><\/script>[\s\S]*<script src="state-schema\.js" defer><\/script>[\s\S]*<script src="app\.js" defer><\/script>/,
  "Projektmetadaten und Datenvertrag müssen mit defer und vor app.js geladen werden",
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
// Rollenmodell: Administratoren unterscheiden sich ausschließlich durch
// Speicherort, Benutzerverwaltung, Sicherungserinnerung und das
// Schließverhalten der Dialoge (dazu das Änderungsprotokoll als
// Kontrollinstrument). Alles Übrige gehört zur normalen Bedienung und steht
// jedem angemeldeten Konto offen.
const settingsCardFor = (elementId) => {
  const cards = htmlSource.split("<section");
  const card = cards.find((chunk) => chunk.includes(`id="${elementId}"`));
  assert.ok(card, `Einstellungskarte zu ${elementId} nicht gefunden`);
  return card.slice(0, card.indexOf(">") + 1);
};

for (const [elementId, label] of [
  ["settingsStorageBackend", "Speicherort"],
  ["settingsBackupReminderDays", "Sicherungserinnerung"],
  ["settingsCloseDialogOnOutsideClick", "Dialoge schließen"],
  ["schoolVacationForm", "Schulferien"],
]) {
  assert.match(
    settingsCardFor(elementId),
    /data-admin-only/,
    `Die Einstellungskarte „${label}“ muss Administratoren vorbehalten bleiben`,
  );
}
assert.equal(
  (htmlSource.match(/data-open-user-management[^>]*data-admin-only/g) || [])
    .length,
  (htmlSource.match(/data-open-user-management/g) || []).length,
  "Jeder Zugang zur Benutzerverwaltung muss Administratoren vorbehalten bleiben",
);
assert.match(
  htmlSource,
  /id="openAuditLogButton"[^>]*data-admin-only/,
  "Das Änderungsprotokoll muss Administratoren vorbehalten bleiben",
);
for (const [pattern, label] of [
  [/id="applyWeekendSimulationButton"[^>]*data-admin-only/, "Simulationsübernahme"],
  [/data-open-employee[^>]*data-admin-only/, "Mitarbeiteranlage"],
  [/id="importDataButton"[^>]*data-admin-only/, "Sicherungsimport"],
  [/id="saveVacationSettingsButton"[^>]*data-admin-only/, "Urlaubseinstellungen"],
]) {
  assert.doesNotMatch(
    htmlSource,
    pattern,
    `${label} gehört zur normalen Bedienung und darf nicht auf Administratoren beschränkt sein`,
  );
}
assert.doesNotMatch(
  appSource,
  /function handleEmployeeSubmit[\s\S]{0,400}requireAdmin\(\)/,
  "Die Mitarbeiterpflege darf keine Administratorprüfung mehr enthalten",
);
// Die Sperren gehören ausschließlich in die statische Oberfläche. Würde app.js
// weitere data-admin-only-Markierungen erzeugen, blieben Schaltflächen für
// normale Konten unsichtbar, ohne dass es in index.html auffällt.
assert.equal(
  (appSource.match(/data-admin-only/g) || []).length,
  1,
  "app.js darf data-admin-only nur zum Anwenden der Sperre verwenden, nicht in gerenderten Vorlagen",
);
assert.match(
  appSource,
  /querySelectorAll\("\[data-admin-only\]"\)/,
  "Die Sperre muss beim Anwenden der Zugriffsrechte weiterhin ausgewertet werden",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(metaContext.window.TeOProjectMeta)),
  JSON.parse(JSON.stringify(PROJECT_META)),
  "Die generierten Projektmetadaten sind nicht aktuell",
);
// Die Buildnummer wird an zwei Stellen gebildet: in src/meta fuer Werkzeuge
// und in der Anwendung selbst. Beide muessen dasselbe Format liefern.
for (const teil of ["major", "minor", "patch"]) {
  assert.ok(
    Number.isInteger(PROJECT_META.version[teil]) &&
      PROJECT_META.version[teil] >= 0,
    `Der Versionsteil ${teil} muss eine nicht negative ganze Zahl sein`,
  );
}
assert.match(
  projectBuildNumber(PROJECT_META),
  /^\d{3}\.\d{3}\.\d{3}$/,
  "Die Buildnummer muss dem Format major.minor.patch mit je drei Stellen folgen",
);
assert.match(
  appSource,
  /PROJECT_VERSION\.major,\s*PROJECT_VERSION\.minor,\s*PROJECT_VERSION\.patch/,
  "Die Anwendung muss alle drei Versionsteile anzeigen",
);
assert.equal(
  packageJson.version,
  `${PROJECT_META.version.major}.${PROJECT_META.version.minor}.${PROJECT_META.version.patch}`,
  "package.json und src/meta/project-meta.mjs nennen unterschiedliche Versionen",
);

// Die Anwendung ist eine einzige IIFE ohne Modulgrenzen, deshalb meldet kein
// Werkzeug von sich aus, wenn eine Funktion oder ein Oberflaechenverweis nicht
// mehr gebraucht wird. Beides bleibt sonst als toter Code liegen und
// suggeriert Abdeckung, die es nicht gibt - etwa wenn ein Test die letzte
// verbliebene Verwendung ist.
const declaredFunctions = [
  ...appSource.matchAll(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/gm),
].map((match) => match[1]);
const unusedFunctions = declaredFunctions.filter(
  (name) =>
    (appSource.match(new RegExp(`\\b${name}\\b`, "g")) || []).length <= 1,
);
assert.deepEqual(
  unusedFunctions,
  [],
  `In app.js werden diese Funktionen nirgends aufgerufen: ${unusedFunctions.join(", ")}. ` +
    "Bitte entfernen - wird eine davon nur noch von einem Test gebraucht, " +
    "prueft der Test den Produktivpfad nicht mehr.",
);

const elementsBlockStart = appSource.indexOf("const elements = {");
assert.notEqual(
  elementsBlockStart,
  -1,
  "Die Oberflaechenverweise (const elements) wurden in app.js nicht gefunden",
);
const elementsBlock = appSource.slice(
  elementsBlockStart,
  matchingBraceIndex(appSource, appSource.indexOf("{", elementsBlockStart)),
);
const declaredElements = [
  ...elementsBlock.matchAll(/^\s{4}([A-Za-z0-9_]+):/gm),
].map((match) => match[1]);
const usedElements = new Set(
  [...appSource.matchAll(/\belements\.([A-Za-z0-9_]+)/g)].map(
    (match) => match[1],
  ),
);
const unusedElements = declaredElements.filter((name) => !usedElements.has(name));
assert.deepEqual(
  unusedElements,
  [],
  `Diese Oberflaechenverweise werden nie gelesen: ${unusedElements.join(", ")}. ` +
    "Bitte aus const elements entfernen; das HTML-Element selbst kann bleiben.",
);

// Die CSP des Servers verbietet style-Attribute (style-src-attr 'none').
// Dynamische CSS-Werte gehen deshalb ueber dynamicStyle() und werden nach dem
// Einfuegen per setProperty gesetzt; feste Werte gehoeren ins Stylesheet.
const inlineStyleAttributes = [
  ...appSource.matchAll(/^.*\sstyle="(?!\$\{)[^"]*".*$/gm),
]
  .map((match) => match[0].trim())
  .filter((line) => !line.includes("data-teo-style"));
assert.deepEqual(
  inlineStyleAttributes,
  [],
  `Diese Stellen erzeugen style-Attribute, die die CSP blockiert:\n${inlineStyleAttributes.join("\n")}\n` +
    "Dynamische Werte über dynamicStyle() ausgeben, feste Werte ins Stylesheet.",
);
assert.doesNotMatch(
  htmlSource,
  /\sstyle="/,
  "Die statische Oberfläche darf keine style-Attribute enthalten",
);

// Ein Import ersetzt den gesamten fachlichen Datenbestand. Bleibt dabei ein
// Filter stehen, wirken Listen leer, obwohl die Daten vollstaendig vorliegen.
// resetListFilters muss deshalb jede Filter- und Suchvariable abdecken.
const resetFiltersStart = appSource.indexOf("function resetListFilters()");
assert.notEqual(
  resetFiltersStart,
  -1,
  "resetListFilters wurde in app.js nicht gefunden",
);
const resetFiltersBody = appSource.slice(
  resetFiltersStart,
  matchingBraceIndex(appSource, appSource.indexOf("{", resetFiltersStart)),
);
const filterVariables = [
  ...appSource.matchAll(/^\s*let ([A-Za-z0-9_]*(?:SearchTerm|Filter)) = /gm),
].map((match) => match[1]);
const unresetFilters = filterVariables.filter(
  (name) => !new RegExp(`\\b${name} = `).test(resetFiltersBody),
);
assert.deepEqual(
  unresetFilters,
  [],
  `Diese Filter setzt resetListFilters nicht zurueck: ${unresetFilters.join(", ")}. ` +
    "Nach einem Import wuerden sie den neuen Datenbestand weiter einschraenken.",
);

function matchingBraceIndex(source, openingBraceIndex) {
  let depth = 0;
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Zu der oeffnenden Klammer fehlt die schliessende.");
}

console.log(`TeO ${projectBuildNumber(PROJECT_META)}: Strukturprüfung erfolgreich.`);
