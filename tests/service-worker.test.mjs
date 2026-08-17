import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PROJECT_META, projectBuildNumber } from "../src/meta/project-meta.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (relativePath) =>
  fs.readFile(path.join(projectRoot, relativePath), "utf8");

async function shellFiles() {
  const source = await read("service-worker.js");
  const list = source.match(/const SHELL_FILES = \[([\s\S]*?)\];/);
  assert.ok(list, "SHELL_FILES wurde in service-worker.js nicht gefunden");
  return [...list[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

test("Der Zwischenspeicher trägt die aktuelle Buildnummer", async () => {
  const source = await read("service-worker.js");
  assert.match(
    source,
    new RegExp(
      `const CACHE_NAME = "teo-shell-${projectBuildNumber(PROJECT_META).replaceAll(".", "\\.")}"`,
    ),
    "Ohne aktuelle Buildnummer liefert der Browser dauerhaft den Stand der ersten Installation aus",
  );
});

test("Alle Dateien der Startseite liegen im Zwischenspeicher", async () => {
  const html = await read("index.html");
  const cached = new Set(
    (await shellFiles()).map((entry) => entry.replace(/^\.\//, "")),
  );

  const referenced = [
    ...[...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]),
    ...[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((match) => match[1]),
  ].filter((href) => !/^(?:https?:)?\/\//.test(href));

  const missing = referenced.filter((href) => !cached.has(href));
  assert.deepEqual(
    missing,
    [],
    `Diese von index.html geladenen Dateien fehlen in SHELL_FILES: ${missing.join(", ")}. ` +
      "Ohne sie startet TeO ohne Netzverbindung nicht.",
  );
});

test("Jede vom Server ausgelieferte Datei ist zwischengespeichert", async () => {
  const serverSource = await read("server/src/server.js");
  const block = serverSource.match(/for \(const fileName of \[([\s\S]*?)\]\) \{/);
  assert.ok(block, "Die Liste der ausgelieferten Dateien wurde nicht gefunden");
  const served = [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const cached = new Set(
    (await shellFiles()).map((entry) => entry.replace(/^\.\//, "")),
  );

  // Der Zwischenspeicher darf sich nicht selbst enthalten.
  const missing = served.filter(
    (fileName) => fileName !== "service-worker.js" && !cached.has(fileName),
  );
  assert.deepEqual(
    missing,
    [],
    `Der TeO-Server liefert diese Dateien aus, der Zwischenspeicher kennt sie nicht: ${missing.join(", ")}.`,
  );
});

test("Der Datenbestand wird nie aus dem Zwischenspeicher beantwortet", async () => {
  const source = await read("service-worker.js");
  assert.match(
    source,
    /url\.pathname\.startsWith\("\/api\/"\)\)\s*return;/,
    "Antworten unter /api/ müssen immer aus dem Netz kommen – eine veraltete " +
      "Antwort führte beim Speichern zu einem Revisionskonflikt.",
  );
  assert.match(
    source,
    /request\.method !== "GET"/,
    "Schreibende Anfragen dürfen nicht abgefangen werden",
  );
});

test("Die Anwendung meldet den Zwischenspeicher nur in sicheren Kontexten an", async () => {
  const appSource = await read("app.js");
  assert.match(
    appSource,
    /"serviceWorker" in navigator[\s\S]{0,60}window\.isSecureContext/,
    "Beim Öffnen per Doppelklick (file://) steht die Schnittstelle nicht bereit",
  );
  assert.match(
    appSource,
    /navigator\.serviceWorker\s*\.register\("service-worker\.js"\)/,
    "Der relative Pfad hält TeO auch in einem Unterverzeichnis lauffähig",
  );
});
