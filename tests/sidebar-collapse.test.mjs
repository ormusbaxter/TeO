import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Was beim Einklappen sichtbar bleiben muss und was abtreten soll - gemessen
// am errechneten Stil, nicht an der Regel, die ihn erzeugt.
async function leseZustand(teo) {
  return teo.evaluate(() => {
    const sichtbar = (element) =>
      Boolean(element) && getComputedStyle(element).display !== "none";
    const menuepunkt = document.querySelector(".nav-item");
    return {
      breite: getComputedStyle(document.body).getPropertyValue("--sidebar-width").trim(),
      eingeklappt: document.body.classList.contains("is-sidebar-collapsed"),
      aria: document.querySelector("#sidebarToggle").getAttribute("aria-expanded"),
      namenszug: sichtbar(document.querySelector(".brand-text")),
      menuebeschriftung: sichtbar(menuepunkt?.querySelector("span")),
      menuesymbol: sichtbar(menuepunkt?.querySelector("svg")),
      kontoaktionen: sichtbar(document.querySelector(".user-session-actions")),
      kurzhinweis: menuepunkt?.getAttribute("title") || "",
      spalten: getComputedStyle(menuepunkt).gridTemplateColumns,
    };
  });
}

test("Die Seitenleiste klappt auf die Symbole ein und wieder auf", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const offen = await leseZustand(teo);
  assert.equal(offen.eingeklappt, false);
  assert.equal(offen.aria, "true", "Der Umschalter meldet seinen Zustand");
  assert.equal(offen.namenszug, true);
  assert.equal(offen.menuebeschriftung, true);

  await teo.evaluate(() => document.querySelector("#sidebarToggle").click());
  const zu = await leseZustand(teo);

  assert.equal(zu.eingeklappt, true);
  assert.equal(zu.aria, "false");
  assert.equal(zu.breite, "76px", "Eingeklappt bleibt eine schmale Spur");
  assert.equal(zu.namenszug, false, "Der Namenszug tritt ab");
  assert.equal(zu.menuebeschriftung, false, "Die Beschriftung tritt ab");
  assert.equal(zu.menuesymbol, true, "Das Symbol bleibt - daran wird bedient");
  assert.equal(
    zu.kontoaktionen,
    true,
    "Benutzerverwaltung und Abmelden bleiben erreichbar",
  );
  // Ohne Beschriftung trägt der Kurzhinweis den Namen nach; ein unbenannter
  // Menüpunkt wäre eingeklappt nicht mehr zu deuten.
  assert.ok(zu.kurzhinweis.length > 0, "Der Menüpunkt nennt sich im Kurzhinweis");
  assert.match(zu.spalten, /^\d+(\.\d+)?px$/, "Es bleibt die Spalte mit dem Symbol");

  await teo.evaluate(() => document.querySelector("#sidebarToggle").click());
  const wiederOffen = await leseZustand(teo);
  assert.equal(wiederOffen.eingeklappt, false);
  assert.equal(wiederOffen.menuebeschriftung, true);
});

test("Der eingeklappte Zustand überlebt den nächsten Start", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.evaluate(() => document.querySelector("#sidebarToggle").click());
  const gemerkt = await teo.evaluate(() =>
    localStorage.getItem("teo-sidebar-collapsed-v1"),
  );
  assert.ok(gemerkt, "Die Vorliebe liegt im Browserprofil");

  // Neu geladen gilt sie weiter - der Zustand ist eine persönliche
  // Einstellung des Arbeitsplatzes, keine des Datenbestands.
  const nachNeustart = await openTeO(t, { angemeldetAls: "admin" });
  const zustand = await leseZustand(nachNeustart);
  assert.equal(zustand.eingeklappt, true);
  assert.equal(zustand.breite, "76px");

  await nachNeustart.evaluate(() => {
    localStorage.removeItem("teo-sidebar-collapsed-v1");
  });
});
