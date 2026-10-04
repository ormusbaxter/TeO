import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const THEMEN = [
  ["standard", "Standard"],
  ["dark", "Dark Mode"],
  ["solarized-light", "Solarized Light"],
  ["nord", "Nord"],
  ["dracula", "Dracula"],
  ["gruvbox-dark", "Gruvbox Dark"],
  ["tokyo-night", "Tokyo Night"],
  ["catppuccin-latte", "Catppuccin Latte"],
  ["windows-95", "Windows 95"],
];

const DUNKLE_THEMEN = ["dark", "nord", "dracula", "gruvbox-dark", "tokyo-night"];

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

const SYMBOLSTILE = [
  ["standard", "Standard"],
  ["fine", "Fein"],
  ["bold", "Kräftig"],
  ["sharp", "Kantig"],
  ["duotone", "Zweifarbig"],
];

test("Jeder Symbolstil zeichnet die Symbole sichtbar anders", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Ein Kalendersymbol in zehnfacher Größe auf weißem Grund, darüber ein
  // Messpunkt an einer freien Stelle im Inneren. Gemessen wird das Bild. Der errechnete Stil der Vorlage in
  // der Sprite sagt nichts - sichtbar ist die Kopie unter <use>, und eine
  // Regel kann die Vorlage treffen, ohne dort anzukommen.
  await teo.evaluate(() => {
    const buehne = document.createElement("div");
    buehne.id = "teoProbeSymbol";
    Object.assign(buehne.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "240px",
      height: "240px",
      zIndex: "2147483647",
      background: "rgb(255, 255, 255)",
      color: "rgb(0, 0, 0)",
    });
    buehne.innerHTML = '<svg><use href="#icon-calendar"></use></svg>';
    Object.assign(buehne.firstElementChild.style, { width: "240px", height: "240px" });
    const punkt = document.createElement("div");
    punkt.id = "teoProbeFlaeche";
    Object.assign(punkt.style, {
      position: "absolute",
      left: "119px",
      top: "159px",
      width: "2px",
      height: "2px",
    });
    buehne.append(punkt);
    document.body.append(buehne);
  });

  const gemessen = {};
  for (const [key, label] of SYMBOLSTILE) {
    const stand = await teo.evaluate((stil) => {
      const auswahl = document.querySelector("[data-icon-theme-select]");
      const angeboten = [...auswahl.options].some(
        (option) => option.value === stil[0] && option.textContent.trim() === stil[1],
      );
      auswahl.value = stil[0];
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
      const strich = getComputedStyle(document.querySelector("#teoProbeSymbol svg"));
      return {
        angeboten,
        attribut: document.documentElement.dataset.iconTheme,
        breite: parseFloat(strich.strokeWidth),
        knopfBreite: parseFloat(
          getComputedStyle(document.querySelector(".button svg")).strokeWidth,
        ),
        ende: strich.strokeLinecap,
        ecke: strich.strokeLinejoin,
      };
    }, [key, label]);
    assert.ok(stand.angeboten, `„${label}“ steht nicht zur Auswahl`);
    assert.equal(stand.attribut, key, `„${label}“ greift ohne Neuladen`);
    gemessen[key] = {
      ...stand,
      flaeche: await teo.farbeAn("#teoProbeFlaeche"),
    };
  }

  await teo.evaluate(() => {
    const auswahl = document.querySelector("[data-icon-theme-select]");
    auswahl.value = "standard";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#teoProbeSymbol").remove();
  });

  const { standard, fine, bold, sharp, duotone } = gemessen;
  const WEISS = "255,255,255";

  assert.equal(standard.breite, 1.8);
  assert.equal(standard.ende, "round");
  assert.ok(fine.breite < standard.breite, "Fein zeichnet dünner");
  assert.ok(bold.breite > standard.breite, "Kräftig zeichnet dicker");
  // Schaltflächen zeichnen ihre Symbole von Haus aus kräftiger; der Abstand
  // zum übrigen Bestand bleibt in jedem Stil erhalten.
  for (const stil of [standard, fine, bold]) {
    assert.ok(stil.knopfBreite > stil.breite);
  }

  assert.equal(sharp.ende, "square");
  assert.equal(sharp.ecke, "miter");

  assert.equal(standard.flaeche.join(","), WEISS, "Standard lässt das Innere frei");
  assert.equal(sharp.flaeche.join(","), WEISS);
  assert.notEqual(duotone.flaeche.join(","), WEISS, "Zweifarbig tönt geschlossene Formen");
  assert.ok(
    duotone.flaeche[0] > 150,
    "Die Tönung bleibt deutlich heller als der Strich",
  );
});

test("Der Symbolstil lässt das Farbthema unberührt", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const stand = await teo.evaluate(() => {
    const farbe = document.querySelector("[data-theme-select]");
    farbe.value = "nord";
    farbe.dispatchEvent(new Event("change", { bubbles: true }));
    const symbole = document.querySelector("[data-icon-theme-select]");
    symbole.value = "bold";
    symbole.dispatchEvent(new Event("change", { bubbles: true }));
    return { ...document.documentElement.dataset };
  });

  assert.equal(stand.theme, "nord");
  assert.equal(stand.iconTheme, "bold");
});
