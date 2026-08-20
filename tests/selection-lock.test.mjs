import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

after(closeTeO);

test("Auswahlflächen markieren beim Klicken keinen Text", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Gefragt ist nicht, ob die Regel im Stylesheet steht, sondern ob sie am
  // Element ankommt. Die Flächen werden dafür im Dokument angelegt - im
  // Aufbau, in dem die Anwendung sie verwendet.
  const gemessen = await teo.evaluate(() => {
    const buehne = document.createElement("div");
    buehne.innerHTML = `
      <label class="selection-card"><input type="checkbox" /><span>Karte</span></label>
      <label class="checkbox-field"><input type="checkbox" /><span>Kästchen</span></label>
      <table class="data-table"><tbody><tr><td class="selection-column">x</td></tr></tbody></table>
      <div class="panel"><p>Fließtext</p></div>`;
    document.querySelector(".main-content").append(buehne);
    const lies = (selector) =>
      getComputedStyle(buehne.querySelector(selector)).userSelect;
    const ergebnis = {
      selectionCard: lies(".selection-card"),
      checkboxField: lies(".checkbox-field"),
      selectionColumn: lies(".data-table .selection-column"),
      panel: lies(".panel"),
      tabelle: getComputedStyle(buehne.querySelector(".data-table")).userSelect,
      body: getComputedStyle(document.body).userSelect,
      view: getComputedStyle(document.querySelector(".view")).userSelect,
      mainContent: getComputedStyle(document.querySelector(".main-content")).userSelect,
    };
    buehne.remove();
    return ergebnis;
  });

  for (const feld of ["selectionCard", "checkboxField", "selectionColumn"]) {
    assert.equal(gemessen[feld], "none", `${feld} ist zum Anklicken da, nicht zum Markieren`);
  }

  // Und der Fließtext bleibt markierbar - sonst ließe sich keine Nummer und
  // kein Name mehr herauskopieren.
  for (const feld of ["body", "view", "mainContent", "panel", "tabelle"]) {
    assert.notEqual(gemessen[feld], "none", `${feld} muss markierbar bleiben`);
  }
});

test("Der Umschalt-Klick räumt die Textmarkierung des Browsers ab", async () => {
  const app = await loadAppFunctions(["bindTableComfort"], { withDom: true });
  app.setState(createMinimalState());

  let abgeraeumt = 0;
  app.dom.window.getSelection = () => ({
    removeAllRanges() {
      abgeraeumt += 1;
    },
  });
  app.bindTableComfort();

  const kaestchen = new app.HTMLElement({
    tagName: "INPUT",
    dataset: { selectEmployee: "e1" },
  });

  // Ohne Umschalt bleibt die Markierung unberührt.
  app.dom.dispatch("#employeeTable", "click", { target: kaestchen, shiftKey: false });
  assert.equal(abgeraeumt, 0);

  // Mit Umschalt markierte der Browser sonst alles zwischen den beiden
  // Kästchen - gemeint war die Zeilenauswahl, nicht der Text.
  app.dom.dispatch("#employeeTable", "click", { target: kaestchen, shiftKey: true });
  assert.equal(abgeraeumt, 1);

  // Ein Klick neben ein Auswahlkästchen geht die Auswahl nichts an.
  const zelle = new app.HTMLElement({ tagName: "TD" });
  app.dom.dispatch("#employeeTable", "click", { target: zelle, shiftKey: true });
  assert.equal(abgeraeumt, 1);
});
