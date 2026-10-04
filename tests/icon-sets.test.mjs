import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Diese Prüfungen gehen über den Bestand im Ganzen: Jeder Satz muss zu
// jedem Symbol der Sprite passen, und kein übernommenes Markup darf etwas
// mitbringen, das die CSP des Servers abweist. Ob ein Satz auch sichtbar
// wird, prüft tests/themes.test.mjs im Browser.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lies = (datei) => fs.readFileSync(path.join(projectRoot, datei), "utf8");

const ICON_SET_SYMBOLS = new Function(
  `${lies("src/app/00c-icon-sets.js")}; return ICON_SET_SYMBOLS;`,
)();
const ICON_SETS = new Function(
  `${lies("src/app/00-shell.js").match(/const ICON_SETS = \{[\s\S]*?\};/)[0]} return ICON_SETS;`,
)();
const sprite = lies("src/html/00-shell-dashboard.html");
const spriteSymbole = [...sprite.matchAll(/<symbol id="icon-([^"]+)"/g)].map((treffer) => treffer[1]);
const einstellungen = lies("src/html/30-device-settings-views.html");

test("jeder fremde Symbolsatz ist auswählbar und hat Zeichnungen", () => {
  const fremde = Object.keys(ICON_SETS).filter((key) => key !== "standard");
  assert.equal(Object.keys(ICON_SET_SYMBOLS).sort().join(","), fremde.sort().join(","));

  const auswahl = einstellungen.match(/<select data-icon-set-select[\s\S]*?<\/select>/)[0];
  const angeboten = [...auswahl.matchAll(/<option value="([^"]+)">([^<]+)</g)].map(
    ([, wert, text]) => `${wert}=${text}`,
  );
  assert.equal(
    angeboten.join(","),
    Object.entries(ICON_SETS).map(([wert, text]) => `${wert}=${text}`).join(","),
  );
});

test("jeder Symbolsatz zeichnet nur Symbole, die es in der Sprite gibt", () => {
  for (const [satz, symbole] of Object.entries(ICON_SET_SYMBOLS)) {
    for (const symbol of Object.keys(symbole)) {
      assert.ok(spriteSymbole.includes(symbol), `${satz}: icon-${symbol} fehlt in der Sprite`);
    }
    // Bis auf das Logo, das die Marke bleibt, und einzelne Lücken eines
    // Satzes ist jedes Symbol neu gezeichnet.
    assert.ok(Object.keys(symbole).length >= spriteSymbole.length - 2, `${satz} ist lückenhaft`);
    assert.ok(!Object.hasOwn(symbole, "logo"), `${satz} ersetzt das Logo`);
  }
});

test("übernommenes Markup bringt weder Stilangaben noch Skripte mit", () => {
  for (const [satz, symbole] of Object.entries(ICON_SET_SYMBOLS)) {
    for (const [symbol, wert] of Object.entries(symbole)) {
      const markup = Array.isArray(wert) ? wert[1] : wert;
      assert.doesNotMatch(markup, /style=|<script|\son\w+=|href=/i, `${satz}: ${symbol}`);
      assert.match(markup, /^<(path|circle|rect|line|polyline|polygon|ellipse)\b/, `${satz}: ${symbol}`);
    }
  }
});
