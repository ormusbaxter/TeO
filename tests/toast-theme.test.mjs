import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

after(closeTeO);

// Die Zusage hinter den Farbmarken lautet nicht „im Stylesheet steht eine
// Marke“, sondern „die Meldung ist lesbar“. Gemessen wird deshalb der
// tatsächliche Kontrast zwischen Schrift und Fläche.
const KONTRAST_MINDESTENS = 4.5;

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

const THEMEN = [
  "standard",
  "dark",
  "solarized-light",
  "nord",
  "dracula",
  "gruvbox-dark",
  "tokyo-night",
  "catppuccin-latte",
  "cellitinnen",
  "cellitinnen-red",
  "windows-95",
];

test("Meldungen sind in jedem Farbschema lesbar", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await teo.evaluate((themen) => {
    // Aufgebaut wie showToast() es tut - dieselben Klassen, dieselbe
    // Verschachtelung.
    const region = document.querySelector("#toastRegion");
    const toast = document.createElement("div");
    toast.className = "toast is-error";
    toast.innerHTML =
      '<span class="toast-icon" aria-hidden="true"></span><span class="toast-text">Beispielmeldung</span>';
    region.append(toast);

    const ergebnis = {};
    for (const thema of themen) {
      if (thema === "standard") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = thema;

      const stil = getComputedStyle(toast);
      const text = getComputedStyle(toast.querySelector(".toast-text"));
      toast.className = "toast is-error";
      const fehlerSymbol = getComputedStyle(toast.querySelector(".toast-icon")).color;
      toast.className = "toast is-warning";
      const warnSymbol = getComputedStyle(toast.querySelector(".toast-icon")).color;
      toast.className = "toast is-success";
      const erfolgSymbol = getComputedStyle(toast.querySelector(".toast-icon")).color;
      toast.className = "toast is-error";

      ergebnis[thema] = {
        flaeche: stil.backgroundColor,
        schrift: text.color,
        fehlerSymbol,
        warnSymbol,
        erfolgSymbol,
      };
    }
    delete document.documentElement.dataset.theme;
    toast.remove();
    return ergebnis;
  }, THEMEN);

  for (const thema of THEMEN) {
    const { flaeche, schrift, fehlerSymbol, warnSymbol, erfolgSymbol } = gemessen[thema];

    // Eine durchsichtige Fläche hieße: Die Meldung erbt den Grund unter sich,
    // und über hellem Grund stünde weiße Schrift.
    assert.ok(
      !/rgba\(0, 0, 0, 0\)|transparent/.test(flaeche),
      `Dem Schema ${thema} fehlt eine eigene Meldungsfläche`,
    );

    const verhaeltnis = kontrast(alsRgb(schrift), alsRgb(flaeche));
    assert.ok(
      verhaeltnis >= KONTRAST_MINDESTENS,
      `Im Schema ${thema} steht die Meldung mit Kontrast ${verhaeltnis.toFixed(2)} da, nötig sind ${KONTRAST_MINDESTENS}`,
    );

    // Die Art der Meldung ist an der Farbe des Symbols zu erkennen - sonst
    // sähen Fehler, Warnung und Erfolg gleich aus.
    assert.notEqual(
      fehlerSymbol,
      erfolgSymbol,
      `Im Schema ${thema} sehen Fehler und Erfolg gleich aus`,
    );
    assert.notEqual(
      warnSymbol,
      erfolgSymbol,
      `Im Schema ${thema} sehen Warnung und Erfolg gleich aus`,
    );
  }
});

test("Die Art der Meldung steht als Klasse am Element, nicht als Farbe im Programm", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Diese Prüfung bleibt am Quelltext: Sie hält fest, dass die Farbe aus dem
  // Stylesheet kommt. Eine im Programm gesetzte Farbe wäre am Ergebnis nicht
  // von einer aus dem Stylesheet zu unterscheiden - der Unterschied zeigt
  // sich erst beim nächsten Farbschema.
  assert.match(appSource, /toast is-\$\{/);
  assert.doesNotMatch(appSource, /toast-icon"\)\.style\./);
});
