import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Ein Abschnitt der Hilfe, so weit nachgebildet, wie filterHelpTopics ihn
// anfasst: Text, Kennung der Überschrift und das hidden-Merkmal.
function createHelpSection(heading, text) {
  return {
    dataset: { helpHeading: heading },
    textContent: text,
    hidden: false,
    toggleAttribute() {},
  };
}

test("Das Handbuch liegt in einer Vorlage und nicht im Dokumentbaum", async () => {
  const indexHtml = await fs.readFile(
    path.join(projectRoot, "index.html"),
    "utf8",
  );

  const template = indexHtml.match(
    /<template id="helpContentTemplate">([\s\S]*?)<\/template>/,
  );
  assert.ok(template, "Die Hilfe muss in einer Vorlage stehen");
  assert.match(template[1], /class="help-layout"/);
  assert.match(template[1], /data-help-section/);
  // Das Inhaltsverzeichnis entsteht mit dem Handbuch. Wäre es beim Start
  // schon im Dokument, käme man in Versuchung, es direkt zu binden - und der
  // Aufruf ginge nach dem Umbau ins Leere.
  assert.match(template[1], /data-help-target/);

  const documentTree = indexHtml.replace(template[0], "");
  assert.doesNotMatch(documentTree, /data-help-section/);
  assert.match(documentTree, /<div id="helpContentHost"><\/div>/);

  // Wer die Vorlage übersieht, verliert die Suche: Suchfeld und Behälter
  // müssen beide in der Hilfeansicht bleiben.
  const helpView = indexHtml.match(
    /<section class="view" id="helpView"[\s\S]*?<\/template>/,
  );
  assert.ok(helpView, "Vorlage und Behälter gehören in die Hilfeansicht");
  assert.match(helpView[0], /id="helpSearch"/);
});

test("Die Hilfesuche liest den Text jedes Abschnitts nur einmal", async () => {
  const { filterHelpTopics, elements, dom } = await loadAppFunctions(
    ["filterHelpTopics", "elements"],
    { withDom: true },
  );

  const sections = [
    createHelpSection("hilfe-urlaub", "Urlaub planen und Vertretung regeln"),
    createHelpSection("hilfe-sicherung", "Datensicherung und Wiederherstellung"),
  ];
  dom.setQueryAll("[data-help-section]", sections);

  elements.helpSearch.value = "";
  filterHelpTopics();
  assert.deepEqual(
    sections.map((section) => section.hidden),
    [false, false],
  );
  assert.equal(elements.helpSearchStatus.textContent, "2 Hilfethemen");

  elements.helpSearch.value = "Urlaub";
  filterHelpTopics();
  assert.deepEqual(
    sections.map((section) => section.hidden),
    [false, true],
  );
  assert.equal(
    elements.helpSearchStatus.textContent,
    "1 von 2 Themen gefunden",
  );

  // Der Suchschlüssel entsteht einmal je Abschnitt. Ein nachträglich
  // geänderter Text darf das Ergebnis deshalb nicht mehr bewegen - genau
  // daran zeigt sich, dass nicht bei jedem Tastendruck neu normalisiert wird.
  sections[0].textContent = "Etwas ganz anderes";
  sections[1].textContent = "Urlaub";
  filterHelpTopics();
  assert.deepEqual(
    sections.map((section) => section.hidden),
    [false, true],
  );
});

test("Die Zugriffssperre hängt an der Rolle am body", async () => {
  const styles = await fs.readFile(
    path.join(projectRoot, "styles.css"),
    "utf8",
  );

  // Ausgeblendet wird im Stylesheet. Eine Schleife in app.js lief zuvor bei
  // jedem Aufbau einer Ansicht über das gesamte Dokument.
  assert.match(
    styles,
    /body:not\(\[data-user-role="admin"\]\) \[data-admin-only\] \{\s*display: none !important;/,
  );

  const appSource = await fs.readFile(
    path.join(projectRoot, "app.js"),
    "utf8",
  );
  assert.doesNotMatch(appSource, /\[data-admin-only\]/);
});
