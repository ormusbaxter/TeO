// Führt ESLint aus und rechnet Fundstellen in den erzeugten Dateien auf ihre
// Quelle zurück.
//
// Der Browserteil wird am zusammengesetzten app.js geprüft - nur dort stimmt
// der Gültigkeitsbereich, und nur dort fällt eine ungenutzte Funktion auf.
// Eine Meldung „app.js:11235“ hilft aber niemandem: Geändert wird in src/app/.
// Weil der Build die Dateien unverändert aneinanderhängt, lässt sich die Zeile
// eindeutig zurückrechnen.
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// So baut tools/build.mjs: ein Banner, dann die Dateien in Namensfolge, mit
// "\n" verbunden. Daraus entsteht die Zuordnung Zeile -> Quelldatei.
async function buildLineMap(sourceDirectory, bannerLines) {
  const directory = path.join(projectRoot, sourceDirectory);
  const files = (await fs.readdir(directory))
    .filter((name) => /\.(?:js|css)$/.test(name))
    .sort();
  const map = [];
  let offset = bannerLines;
  for (const name of files) {
    const lines = (await fs.readFile(path.join(directory, name), "utf8")).split("\n");
    map.push({ file: path.join(sourceDirectory, name), from: offset + 1, lines: lines.length });
    // Die Dateien enden mit einem Zeilenumbruch; das verbindende "\n" fügt
    // dazwischen genau eine Zeile ein.
    offset += lines.length;
  }
  return map;
}

function translate(map, line) {
  for (const entry of map) {
    if (line >= entry.from && line < entry.from + entry.lines) {
      return { file: entry.file, line: line - entry.from + 1 };
    }
  }
  return null;
}

const generatedMaps = {
  "app.js": await buildLineMap("src/app", 1),
};

const eslint = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["eslint", ".", "--format", "json", ...process.argv.slice(2)],
  { cwd: projectRoot },
);

let output = "";
let errorOutput = "";
eslint.stdout.on("data", (chunk) => {
  output += chunk;
});
eslint.stderr.on("data", (chunk) => {
  errorOutput += chunk;
});

eslint.on("close", (code) => {
  if (!output.trim()) {
    process.stderr.write(errorOutput || "ESLint hat nichts zurückgemeldet.\n");
    process.exit(code === 0 ? 0 : 1);
  }

  const results = JSON.parse(output);
  let problems = 0;
  for (const result of results) {
    if (!result.messages.length) continue;
    const relative = path.relative(projectRoot, result.filePath);
    const map = generatedMaps[relative];
    for (const message of result.messages) {
      problems += 1;
      const source = map ? translate(map, message.line) : null;
      const where = source
        ? `${source.file}:${source.line}:${message.column}`
        : `${relative}:${message.line}:${message.column}`;
      const origin = source ? ` (in ${relative}:${message.line})` : "";
      process.stdout.write(
        `${where}  ${message.message}  ${message.ruleId || "Parserfehler"}${origin}\n`,
      );
    }
  }

  if (problems) {
    process.stdout.write(`\n${problems} Befund(e).\n`);
    process.exit(1);
  }
  process.stdout.write("ESLint: keine Befunde.\n");
  process.exit(0);
});
