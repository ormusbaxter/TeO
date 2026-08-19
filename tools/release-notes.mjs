// Baut Titel und Text einer GitHub-Veroeffentlichung aus CHANGELOG.md.
//
// Changelog, Tag und package.json nennen die Fassung seit 4.41.0 gleich
// (4.41.0); die aelteren Abschnitte schreiben sie dreistellig (004.039.000).
// Beide Formen muessen auf dieselbe Fassung zeigen, sonst bricht der Lauf ab:
// Ein Release mit dem Text einer anderen Fassung waere schlimmer als gar
// keiner.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Die dreistellige Schreibweise der Abschnitte bis 004.040.000.
export function paddedBuildNumber(version) {
  return version
    .split(".")
    .map((part) => String(part).padStart(3, "0"))
    .join(".");
}

export function normalizeVersion(tag) {
  const version = String(tag || "").trim().replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(
      `„${tag}“ ist keine Fassungsbezeichnung der Form v4.39.0.`,
    );
  }
  return version;
}

// Liefert Titelzusatz und Aufzaehlung des passenden Changelog-Abschnitts.
// Ueberschriften tragen die Fassung ohne fuehrende Nullen; die Abschnitte bis
// einschliesslich 004.040.000 schreiben sie dreistellig, deshalb werden beide
// Schreibweisen gesucht.
export function changelogSection(changelog, version) {
  const schreibweisen = [version, paddedBuildNumber(version)].map((form) =>
    form.replaceAll(".", "\\."),
  );
  const heading = new RegExp(
    `^### (?:${schreibweisen.join("|")})(?:\\s+[–-]\\s+(.+))?$`,
    "m",
  );
  const match = heading.exec(changelog);
  if (!match) {
    throw new Error(
      `CHANGELOG.md enthält keinen Abschnitt für ${version}.`,
    );
  }
  const start = match.index + match[0].length;
  const end = changelog.indexOf("\n### ", start);
  return {
    title: (match[1] || "").trim(),
    body: changelog.slice(start, end === -1 ? undefined : end).trim(),
  };
}

export function buildRelease({ changelog, version, notes = "", title = "" }) {
  const section = changelogSection(changelog, version);
  const headline = title.trim() || `TeO ${version}${section.title ? ` – ${section.title}` : ""}`;
  return {
    title: headline,
    body: notes.trim() || section.body,
  };
}

// Der Anhang wird erst nach dem Paketbau ergaenzt; fehlt er, bleibt der Text
// ohne Downloadhinweis - das Release ist dann eben eines ohne Paket.
export function appendPackageNote(body, { fileName, sha256 }) {
  return [
    body,
    "",
    `Für den lokalen Betrieb **${fileName}** herunterladen, entpacken und **index.html** öffnen.`,
    "",
    "**SHA-256:**",
    `\`${sha256}\``,
  ].join("\n");
}

function main() {
  const [tagArgument, notesPath = "release-notes.md"] = process.argv.slice(2);
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const version = normalizeVersion(tagArgument);
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  if (packageJson.version !== version) {
    throw new Error(
      `Der Tag nennt ${version}, package.json steht auf ${packageJson.version}. ` +
        "Bitte den Tag auf den Stand setzen, der diese Fassung trägt.",
    );
  }

  const release = buildRelease({
    changelog: fs.readFileSync(path.join(projectRoot, "CHANGELOG.md"), "utf8"),
    version,
    notes: process.env.RELEASE_NOTES || "",
    title: process.env.RELEASE_TITLE || "",
  });

  const assetName = `TeO-${version}-lokaler-Betrieb.zip`;
  const assetPath = path.join(projectRoot, "dist", assetName);
  let body = release.body;
  if (fs.existsSync(assetPath)) {
    body = appendPackageNote(body, {
      fileName: assetName,
      sha256: crypto
        .createHash("sha256")
        .update(fs.readFileSync(assetPath))
        .digest("hex")
        .toUpperCase(),
    });
  }

  fs.writeFileSync(path.resolve(projectRoot, notesPath), `${body}\n`, "utf8");
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      [
        `title=${release.title}`,
        `version=${version}`,
        `tag=v${version}`,
        `asset=${fs.existsSync(assetPath) ? `dist/${assetName}` : ""}`,
        "",
      ].join("\n"),
      "utf8",
    );
  }
  console.log(release.title);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
