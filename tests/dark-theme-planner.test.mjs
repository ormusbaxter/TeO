import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const DUNKLE_THEMEN = ["dark", "nord", "dracula", "gruvbox-dark", "tokyo-night", "github-dark"];

function helligkeit(wert) {
  const [r, g, b] = wert.match(/[\d.]+/g).slice(0, 3).map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Leere Tagesfelder und das Suchfeld der Urlaubsplanung trugen feste helle
// Flaechen und standen in den dunklen Schemata als graue Kacheln da.
test("Leere Tagesfelder und Suchfeld bleiben in dunklen Schemata dunkel", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await teo.evaluate((themen) => {
    // Ein leeres Tagesfeld so, wie renderVacationEmployeeRow es aufbaut -
    // ohne Datenbestand gibt es sonst keine Tabellenzeile.
    const planer = document.querySelector("#vacationPlanner");
    planer.innerHTML =
      '<table class="vacation-table"><tbody><tr><td class="vacation-day-cell"><button type="button" data-probe="tag"></button></td></tr></tbody></table>';
    const auswahl = document.querySelector("[data-theme-select]");
    const ergebnis = {};
    for (const thema of themen) {
      auswahl.value = thema;
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
      ergebnis[thema] = {
        tag: getComputedStyle(planer.querySelector('[data-probe="tag"]')).backgroundColor,
        suche: getComputedStyle(document.querySelector("#vacationEmployeeSearch")).backgroundColor,
        monat: getComputedStyle(document.querySelector("#vacationMonth")).backgroundColor,
      };
    }
    return ergebnis;
  }, DUNKLE_THEMEN);

  for (const thema of DUNKLE_THEMEN) {
    const werte = gemessen[thema];
    // Halbtransparent: Der Alphawert zaehlt nicht mit, entscheidend ist der
    // Farbton - er muss dunkel sein.
    assert.ok(helligkeit(werte.tag) < 0.35, `${thema}: Tagesfeld ist hell (${werte.tag})`);
    assert.equal(werte.suche, werte.monat, `${thema}: Suchfeld weicht vom Monatsfeld ab`);
  }
});
