import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  appendPackageNote,
  buildRelease,
  changelogSection,
  normalizeVersion,
  paddedBuildNumber,
} from "../tools/release-notes.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const changelog = fs.readFileSync(path.join(projectRoot, "CHANGELOG.md"), "utf8");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);

test("Tagname und dreistellige Buildnummer beschreiben dieselbe Fassung", () => {
  assert.equal(normalizeVersion("v4.39.0"), "4.39.0");
  assert.equal(normalizeVersion("4.39.0"), "4.39.0");
  assert.equal(paddedBuildNumber("4.39.0"), "004.039.000");
  assert.throws(() => normalizeVersion("v4.39"), /Fassungsbezeichnung/);
  assert.throws(() => normalizeVersion(""), /Fassungsbezeichnung/);
});

test("der Text einer Veröffentlichung stammt aus dem passenden Changelog-Abschnitt", () => {
  const section = changelogSection(changelog, packageJson.version);

  assert.ok(section.title.length > 0);
  assert.match(section.body, /^- /);
  // Der Abschnitt endet vor der nächsten Fassung.
  assert.doesNotMatch(section.body, /^### /m);
});

test("fehlt der Abschnitt, entsteht keine Veröffentlichung mit falschem Text", () => {
  assert.throws(
    () => changelogSection(changelog, "9.99.99"),
    /CHANGELOG\.md enthält keinen Abschnitt/,
  );
});

test("der Titel folgt der Schreibweise der bisherigen Veröffentlichungen", () => {
  const release = buildRelease({ changelog, version: packageJson.version });

  assert.match(release.title, new RegExp(`^TeO ${packageJson.version} – .+`));
});

test("ein übergebener Text ersetzt den Changelog-Abschnitt", () => {
  const release = buildRelease({
    changelog,
    version: packageJson.version,
    notes: "## Eigener Abschnitt\n\n- eine Zeile",
    title: "Eigener Titel",
  });

  assert.equal(release.title, "Eigener Titel");
  assert.equal(release.body, "## Eigener Abschnitt\n\n- eine Zeile");
});

test("der Downloadhinweis nennt Paketnamen und Prüfsumme", () => {
  const body = appendPackageNote("- eine Zeile", {
    fileName: "TeO-4.39.0-lokaler-Betrieb.zip",
    sha256: "ABC123",
  });

  assert.match(body, /\*\*TeO-4\.39\.0-lokaler-Betrieb\.zip\*\*/);
  assert.match(body, /\*\*SHA-256:\*\*\n`ABC123`/);
});
