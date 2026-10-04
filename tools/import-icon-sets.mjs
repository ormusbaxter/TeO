// Übernimmt die Symbole der fremden Symbolsätze in src/app/00c-icon-sets.js.
//
// Die Sätze sind keine Abhängigkeit des Projekts: Das Ergebnis liegt im
// Repository, Build und Tests brauchen sie nicht. Nur wer einen Satz
// aktualisiert oder ein Symbol neu zuordnet, holt sie einmalig in ein
// beliebiges Verzeichnis und übergibt es:
//
//   npm install --prefix <dir> lucide-static @tabler/icons heroicons @phosphor-icons/core
//   node tools/import-icon-sets.mjs <dir>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quelle = process.argv[2];
if (!quelle) {
  console.error("Aufruf: node tools/import-icon-sets.mjs <Verzeichnis mit node_modules>");
  process.exit(1);
}
const modules = path.join(path.resolve(quelle), "node_modules");

const SAETZE = {
  lucide: { paket: "lucide-static", datei: (name) => `icons/${name}.svg` },
  tabler: { paket: "@tabler/icons", datei: (name) => `icons/outline/${name}.svg` },
  heroicons: { paket: "heroicons", datei: (name) => `24/outline/${name}.svg` },
  phosphor: { paket: "@phosphor-icons/core", datei: (name) => `assets/regular/${name}.svg` },
};

// Welches Symbol eines Satzes für welches TeO-Symbol steht. Fehlt ein
// Eintrag, bleibt in diesem Satz die TeO-Zeichnung stehen - so auch beim
// Logo, das in jedem Satz die Marke bleibt.
const ZUORDNUNG = {
  dashboard: ["layout-grid", "layout-grid", "squares-2x2", "squares-four"],
  users: ["users", "users", "users", "users"],
  training: ["graduation-cap", "school", "academic-cap", "graduation-cap"],
  meeting: ["messages-square", "messages", "chat-bubble-left-right", "chats-circle"],
  chart: ["chart-pie", "chart-pie", "chart-pie", "chart-pie-slice"],
  plus: ["plus", "plus", "plus", "plus"],
  search: ["search", "search", "magnifying-glass", "magnifying-glass"],
  edit: ["pencil", "pencil", "pencil", "pencil-simple"],
  trash: ["trash-2", "trash", "trash", "trash"],
  check: ["check", "check", "check", "check"],
  copy: ["copy", "copy", "document-duplicate", "copy"],
  memo: ["sticky-note", "note", "document-text", "note"],
  download: ["download", "download", "arrow-down-tray", "download-simple"],
  spreadsheet: ["sheet", "table", "table-cells", "table"],
  upload: ["upload", "upload", "arrow-up-tray", "upload-simple"],
  print: ["printer", "printer", "printer", "printer"],
  palette: ["palette", "palette", "swatch", "palette"],
  close: ["x", "x", "x-mark", "x"],
  maximize: ["maximize", "maximize", "arrows-pointing-out", "corners-out"],
  minimize: ["minimize", "minimize", "arrows-pointing-in", "corners-in"],
  more: ["ellipsis", "dots", "ellipsis-horizontal", "dots-three"],
  settings: ["sliders-horizontal", "adjustments-horizontal", "adjustments-horizontal", "sliders-horizontal"],
  calendar: ["calendar", "calendar", "calendar", "calendar-blank"],
  "weekend-rotation": ["refresh-cw", "refresh", "arrow-path", "arrows-clockwise"],
  vacation: ["tree-palm", "beach", "sun", "island"],
  chevron: ["chevron-right", "chevron-right", "chevron-right", "caret-right"],
  alert: ["triangle-alert", "alert-triangle", "exclamation-triangle", "warning"],
  lock: ["lock", "lock", "lock-closed", "lock"],
  logout: ["log-out", "logout", "arrow-right-start-on-rectangle", "sign-out"],
  empty: ["book-open", "book", "book-open", "book-open"],
  help: ["circle-question-mark", "help-circle", "question-mark-circle", "question"],
  columns: ["columns-3", "columns-3", "view-columns", "columns"],
  keyboard: ["keyboard", "keyboard", null, "keyboard"],
  device: ["monitor", "device-desktop", "computer-desktop", "desktop"],
  star: ["star", "star", "star", "star"],
  eye: ["eye", "eye", "eye", "eye"],
  "clipboard-check": ["clipboard-check", "clipboard-check", "clipboard-document-check", "clipboard-text"],
  construction: ["hard-hat", "helmet", "wrench-screwdriver", "hard-hat"],
};

// Was die Sprite selbst festlegt - Strich, Strichenden, Füllung -, wird
// geerbt; nur ausdrücklich gefüllte Formen behalten ihre Angabe.
const GEERBT = /\s(?:stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/g;

function inhalt(name, svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  let innen = svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  // Tabler legt ein unsichtbares Quadrat über die volle Fläche, Phosphor
  // ebenso - als Rahmen für Zeichenprogramme, für die Anzeige ohne Belang.
  innen = innen
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/g, "")
    .replace(/<rect width="256" height="256" fill="none"\s*\/>/g, "");
  innen = innen.replace(GEERBT, "").replace(/\s*\n\s*/g, "").replace(/\s+\/>/g, "/>");
  if (/fill="currentColor"/.test(svg.match(/<svg[^>]*>/)[0])) {
    // Phosphor zeichnet Flächen: Die Füllung steht am Wurzelelement und
    // muss auf die Formen, weil die Sprite sonst ihr fill: none vererbt.
    innen = innen.replace(/<(path|circle|rect|ellipse|polygon)(?![^>]*\sfill=)/g, '<$1 fill="currentColor" stroke="none"');
  }
  if (/style=|<script|on\w+=/.test(innen)) throw new Error(`${name}: unzulässiges Markup`);
  return { viewBox, innen };
}

const ergebnis = {};
const lizenzen = [];
const fehlt = [];
for (const [index, [satz, { paket, datei }]] of Object.entries(SAETZE).entries()) {
  const wurzel = path.join(modules, paket);
  const meta = JSON.parse(fs.readFileSync(path.join(wurzel, "package.json"), "utf8"));
  lizenzen.push(
    `${paket} ${meta.version} (${meta.license})\n\n${fs.readFileSync(path.join(wurzel, "LICENSE"), "utf8").replace(/\r\n?/g, "\n").trim()}`,
  );
  ergebnis[satz] = {};
  for (const [symbol, namen] of Object.entries(ZUORDNUNG)) {
    const name = namen[index];
    if (!name) continue;
    const pfad = path.join(wurzel, datei(name));
    if (!fs.existsSync(pfad)) {
      fehlt.push(`${satz}: ${name} (für ${symbol})`);
      continue;
    }
    const { viewBox, innen } = inhalt(name, fs.readFileSync(pfad, "utf8"));
    ergebnis[satz][symbol] = viewBox === "0 0 24 24" ? innen : [viewBox, innen];
  }
}
if (fehlt.length) {
  console.error(`Nicht gefunden:\n  ${fehlt.join("\n  ")}`);
  process.exit(1);
}

const kommentar = lizenzen
  .map((text) => text.split("\n").map((zeile) => `  //${zeile ? ` ${zeile}` : ""}`).join("\n"))
  .join("\n  //\n  // ---\n  //\n");
const zeilen = Object.entries(ergebnis).map(([satz, symbole]) => {
  const eintraege = Object.entries(symbole)
    .map(([symbol, wert]) => `      ${JSON.stringify(symbol)}: ${JSON.stringify(wert)},`)
    .join("\n");
  return `    ${satz}: {\n${eintraege}\n    },`;
});

const datei = `  // Erzeugt von tools/import-icon-sets.mjs - nicht von Hand bearbeiten.
  //
  // Die Zeichnungen der fremden Symbolsätze, je TeO-Symbol der Inhalt des
  // <symbol>. Abweichende Zeichenflächen stehen als [viewBox, Inhalt] da.
  // Die Sätze stehen unter freien Lizenzen, deren Hinweise hier mitgehen:
  //
${kommentar}
  const ICON_SET_SYMBOLS = {
${zeilen.join("\n")}
  };
`;
fs.writeFileSync(path.join(projectRoot, "src/app/00c-icon-sets.js"), datei);
console.log(`src/app/00c-icon-sets.js: ${Object.keys(ergebnis).length} Sätze`);
