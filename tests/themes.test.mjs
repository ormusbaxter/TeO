import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const THEMEN = [
  ["standard", "Standard"],
  ["dark", "Dark Mode"],
  ["nord", "Nord"],
  ["dracula", "Dracula"],
  ["catppuccin-latte", "Catppuccin Latte"],
  ["windows-95", "Windows 95"],
];

const DUNKLE_THEMEN = ["dark", "nord", "dracula"];

function relativeHelligkeit([r, g, b]) {
  const kanal = (wert) => {
    const anteil = wert / 255;
    return anteil <= 0.03928 ? anteil / 12.92 : ((anteil + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

function kontrast(vordergrund, hintergrund) {
  const hell = relativeHelligkeit(vordergrund);
  const dunkel = relativeHelligkeit(hintergrund);
  const [oben, unten] = hell > dunkel ? [hell, dunkel] : [dunkel, hell];
  return (oben + 0.05) / (unten + 0.05);
}

function alsRgb(wert) {
  const zahlen = wert.match(/[\d.]+/g);
  assert.ok(zahlen && zahlen.length >= 3, `Farbe nicht lesbar: ${wert}`);
  return zahlen.slice(0, 3).map(Number);
}

test("Jedes angebotene Farbschema lässt sich auch auswählen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const angeboten = await teo.evaluate(() =>
    [...document.querySelectorAll("[data-theme-select] option")].map((option) => [
      option.value,
      option.textContent.trim(),
    ]),
  );

  for (const [key, label] of THEMEN) {
    assert.ok(
      angeboten.some(([wert, text]) => wert === key && text === label),
      `„${label}“ steht nicht zur Auswahl`,
    );
  }
  // Windows 3.11 wurde zurückgezogen und darf nicht wieder auftauchen.
  assert.ok(
    !angeboten.some(([wert]) => wert.includes("311")),
    "Windows 3.11 wird nicht mehr angeboten",
  );
});

test("Text und Flächen jedes Schemas sind lesbar", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Gemessen wird, was auf dem Bildschirm steht - nicht ein Farbpaar, das
  // jemand aus dem Stylesheet in den Test kopiert hat.
  const gemessen = await teo.evaluate((themen) => {
    const buehne = document.createElement("div");
    buehne.className = "panel";
    buehne.innerHTML =
      '<p data-probe="text">Fließtext</p><button class="button button-primary" data-probe="primary">Sichern</button>';
    document.querySelector(".main-content").append(buehne);

    // Gewechselt wird über das Auswahlfeld der Einstellungen - denselben Weg,
    // den eine Bedienung nimmt. Ein direkt gesetztes Attribut ließe aus, was
    // die Anwendung darüber hinaus tut, etwa das Farbschema für den Browser.
    const auswahl = document.querySelector("[data-theme-select]");
    const ergebnis = {};
    for (const thema of themen) {
      auswahl.value = thema;
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));

      const flaeche = getComputedStyle(buehne).backgroundColor;
      const text = getComputedStyle(buehne.querySelector('[data-probe="text"]')).color;
      const knopf = getComputedStyle(buehne.querySelector('[data-probe="primary"]'));
      ergebnis[thema] = {
        flaeche,
        text,
        knopfText: knopf.color,
        knopfFlaeche: knopf.backgroundColor,
        farbschema: getComputedStyle(document.documentElement).colorScheme,
      };
    }
    auswahl.value = "standard";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    buehne.remove();
    return ergebnis;
  }, THEMEN.map(([key]) => key));

  for (const [key, label] of THEMEN) {
    const werte = gemessen[key];
    const textKontrast = kontrast(alsRgb(werte.text), alsRgb(werte.flaeche));
    assert.ok(
      textKontrast >= 4.5,
      `„${label}“: Fließtext steht mit ${textKontrast.toFixed(2)}:1 auf der Karte`,
    );
    const knopfKontrast = kontrast(alsRgb(werte.knopfText), alsRgb(werte.knopfFlaeche));
    assert.ok(
      knopfKontrast >= 4.5,
      `„${label}“: Die Hauptaktion steht mit ${knopfKontrast.toFixed(2)}:1 da`,
    );
  }

  // Die dunklen Schemata sagen es dem Browser, damit auch Formularfelder,
  // Bildlaufleisten und der Datumswähler dunkel erscheinen.
  for (const key of DUNKLE_THEMEN) {
    assert.match(
      gemessen[key].farbschema,
      /dark/,
      `„${key}“ meldet dem Browser kein dunkles Farbschema`,
    );
  }
  assert.doesNotMatch(gemessen["catppuccin-latte"].farbschema, /^dark$/);
});

test("Ein gewähltes Schema gilt sofort und bleibt erhalten", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const vorher = await teo.stil("body", "background-color");
  await teo.evaluate(() => {
    const auswahl = document.querySelector("[data-theme-select]");
    auswahl.value = "dracula";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const gesetzt = await teo.evaluate(() => document.documentElement.dataset.theme);
  assert.equal(gesetzt, "dracula", "Das Schema greift ohne Neuladen");
  assert.notEqual(
    await teo.stil("body", "background-color"),
    vorher,
    "Und die Fläche ändert sich sichtbar",
  );

  await teo.evaluate(() => {
    const auswahl = document.querySelector("[data-theme-select]");
    auswahl.value = "standard";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
