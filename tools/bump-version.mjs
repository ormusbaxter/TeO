import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_META, projectBuildNumber } from "../src/meta/project-meta.mjs";

// Erhoeht die Buildnummer an ihrer einzigen Quelle src/meta/project-meta.mjs
// und haelt package.json auf demselben Stand. Die erzeugten Dateien
// project-meta.js und app.js entstehen anschliessend beim Build.

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const metaPath = path.join(projectRoot, "src", "meta", "project-meta.mjs");
const packagePath = path.join(projectRoot, "package.json");

const ARTEN = {
  major: "Umbruch",
  feature: "neue Funktion",
  fix: "Fehlerbehebung",
};

function naechsteVersion(version, art) {
  const major = Number(version.major) || 0;
  const minor = Number(version.minor) || 0;
  const patch = Number(version.patch) || 0;
  if (art === "major") return { major: major + 1, minor: 0, patch: 0 };
  if (art === "feature") return { major, minor: minor + 1, patch: 0 };
  return { major, minor, patch: patch + 1 };
}

function ersetzeVersionsblock(quelle, version) {
  const muster =
    /(version: Object\.freeze\(\{\s*\n)(\s*)major: \d+,\s*\n\s*minor: \d+,\s*\n(?:\s*patch: \d+,\s*\n)?/;
  if (!muster.test(quelle)) {
    throw new Error(
      "Der Versionsblock in src/meta/project-meta.mjs wurde nicht gefunden.",
    );
  }
  return quelle.replace(
    muster,
    (_treffer, kopf, einzug) =>
      `${kopf}${einzug}major: ${version.major},\n` +
      `${einzug}minor: ${version.minor},\n` +
      `${einzug}patch: ${version.patch},\n`,
  );
}

const art = process.argv[2];
if (!Object.hasOwn(ARTEN, art)) {
  console.error(
    `Aufruf: node tools/bump-version.mjs <${Object.keys(ARTEN).join("|")}>`,
  );
  process.exit(1);
}

const vorher = projectBuildNumber(PROJECT_META);
const version = naechsteVersion(PROJECT_META.version, art);

const metaQuelle = await fs.readFile(metaPath, "utf8");
await fs.writeFile(metaPath, ersetzeVersionsblock(metaQuelle, version), "utf8");

const paket = JSON.parse(await fs.readFile(packagePath, "utf8"));
paket.version = `${version.major}.${version.minor}.${version.patch}`;
await fs.writeFile(packagePath, `${JSON.stringify(paket, null, 2)}\n`, "utf8");

const nachher = projectBuildNumber({ version });
console.log(`${ARTEN[art]}: ${vorher} -> ${nachher} (package.json ${paket.version})`);
console.log("Bitte anschliessend 'npm run build' ausfuehren.");
