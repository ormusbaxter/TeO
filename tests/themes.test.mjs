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
  ["github", "GitHub"],
  ["github-dark", "GitHub Dark"],
  ["windows-95", "Windows 95"],
];

const DUNKLE_THEMEN = ["dark", "nord", "dracula", "gruvbox-dark", "tokyo-night", "github-dark"];

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
  assert.doesNotMatch(gemessen.github.farbschema, /^dark$/);
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

const SYMBOLSAETZE = [
  ["standard", "TeO (Standard)"],
  ["lucide", "Lucide"],
  ["tabler", "Tabler"],
  ["heroicons", "Heroicons"],
  ["phosphor", "Phosphor"],
];

function waehleSymbolsatz(teo, key) {
  return teo.evaluate((satz) => {
    const auswahl = document.querySelector("[data-icon-set-select]");
    auswahl.value = satz;
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  }, key);
}

// Ein Symbol in zehnfacher Größe auf weißem Grund, oben links über allem.
// Gemessen wird das Bild: Was in der Sprite steht, sagt nur, was dort steht -
// sichtbar ist die Kopie unter <use>.
function zeigeProbesymbol(teo, symbol) {
  return teo.evaluate((id) => {
    document.querySelector("#teoProbeSymbol")?.remove();
    const buehne = document.createElement("div");
    buehne.id = "teoProbeSymbol";
    Object.assign(buehne.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "200px",
      height: "200px",
      zIndex: "2147483647",
      background: "rgb(255, 255, 255)",
      color: "rgb(0, 0, 0)",
    });
    buehne.innerHTML = `<svg><use href="#icon-${id}"></use></svg>`;
    Object.assign(buehne.firstElementChild.style, { width: "200px", height: "200px" });
    document.body.append(buehne);
  }, symbol);
}

async function bildDesProbesymbols(teo) {
  const bild = await teo.page.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  return bild.toString("base64");
}

test("Jeder Symbolsatz zeigt eigene Zeichnungen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await zeigeProbesymbol(teo, "calendar");
  const leer = await teo.evaluate(() => {
    document.querySelector("#teoProbeSymbol svg").style.visibility = "hidden";
  }).then(() => bildDesProbesymbols(teo));
  await teo.evaluate(() => {
    document.querySelector("#teoProbeSymbol svg").style.visibility = "";
  });

  const kalender = {};
  const logo = {};
  for (const [key, label] of SYMBOLSAETZE) {
    const angeboten = await teo.evaluate(
      ([wert, text]) =>
        [...document.querySelector("[data-icon-set-select]").options].some(
          (option) => option.value === wert && option.textContent.trim() === text,
        ),
      [key, label],
    );
    assert.ok(angeboten, `„${label}“ steht nicht zur Auswahl`);
    await waehleSymbolsatz(teo, key);
    assert.equal(
      await teo.evaluate(() => document.documentElement.dataset.iconSet),
      key,
      `„${label}“ greift ohne Neuladen`,
    );
    await zeigeProbesymbol(teo, "calendar");
    kalender[key] = await bildDesProbesymbols(teo);
    await zeigeProbesymbol(teo, "logo");
    logo[key] = await bildDesProbesymbols(teo);
  }

  // Zurück auf Standard steht wieder die ursprüngliche Zeichnung da.
  await waehleSymbolsatz(teo, "standard");
  await zeigeProbesymbol(teo, "calendar");
  const zurueck = await bildDesProbesymbols(teo);
  await teo.evaluate(() => document.querySelector("#teoProbeSymbol").remove());

  for (const [key, label] of SYMBOLSAETZE) {
    assert.notEqual(kalender[key], leer, `„${label}“ zeichnet überhaupt etwas`);
    for (const [anderer, andererLabel] of SYMBOLSAETZE) {
      if (anderer <= key) continue;
      assert.notEqual(kalender[key], kalender[anderer], `„${label}“ gleicht „${andererLabel}“`);
    }
    // Das Logo ist die Marke und bleibt in jedem Satz dasselbe.
    assert.equal(logo[key], logo.standard, `„${label}“ verändert das Logo`);
  }
  assert.equal(zurueck, kalender.standard);
  assert.deepEqual(teo.problems, []);
});

test("Der Symbolsatz lässt das Farbthema unberührt und bleibt am Konto", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "admin" });
  if (!teo) return;

  await teo.evaluate(() => {
    const farbe = document.querySelector("[data-theme-select]");
    farbe.value = "nord";
    farbe.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await waehleSymbolsatz(teo, "tabler");
  const meldung = await teo.page.waitForFunction(
    () =>
      [...document.querySelectorAll(".toast")]
        .map((toast) => toast.textContent)
        .find((text) => text.includes("Symbolsatz")) || null,
    null,
    { timeout: 5000 },
  );
  assert.match(await meldung.jsonValue(), /„Tabler“ wurde für „DemoAdmin“ gespeichert/);

  // Ein späterer Wechsel des Farbthemas setzt den Symbolsatz nicht zurück.
  await teo.evaluate(() => {
    const farbe = document.querySelector("[data-theme-select]");
    farbe.value = "dracula";
    farbe.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await teo.page.waitForFunction(() => document.documentElement.dataset.theme === "dracula");
  const stand = await teo.evaluate(() => ({ ...document.documentElement.dataset }));
  assert.equal(stand.theme, "dracula");
  assert.equal(stand.iconSet, "tabler");
});

test("Bei der Anmeldung gilt der Symbolsatz des Kontos", async (t) => {
  const teo = await openTeO(t, {
    anmeldenAls: "admin",
    mitDemodaten(bestand) {
      bestand.users.find((user) => user.username === "DemoAdmin").iconSet = "phosphor";
    },
  });
  if (!teo) return;

  const stand = await teo.evaluate(() => ({
    attribut: document.documentElement.dataset.iconSet,
    auswahl: document.querySelector("[data-icon-set-select]").value,
    zeichenflaeche: document.querySelector("#icon-calendar").getAttribute("viewBox"),
  }));
  assert.equal(stand.attribut, "phosphor");
  assert.equal(stand.auswahl, "phosphor");
  assert.equal(stand.zeichenflaeche, "0 0 256 256");
});
