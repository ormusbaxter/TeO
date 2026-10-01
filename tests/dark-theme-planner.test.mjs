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
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
    urlaubsansicht: { year: 2026, month: 7, sort: "name" },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");

  const gemessen = await teo.evaluate((themen) => {
    const auswahl = document.querySelector("[data-theme-select]");
    const ergebnis = {};
    for (const thema of themen) {
      auswahl.value = thema;
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
      // Ein leeres Feld an einem Werktag - ohne Eintrag, ohne Wochenendtönung.
      const tag = [...document.querySelectorAll(".vacation-day-cell")].find(
        (zelle) =>
          !zelle.className.includes("vacation-weekend") &&
          !zelle.className.includes("vacation-holiday") &&
          !zelle.querySelector("button[class*='planner-entry-']"),
      );
      ergebnis[thema] = {
        tag: getComputedStyle(tag.querySelector("button")).backgroundColor,
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
