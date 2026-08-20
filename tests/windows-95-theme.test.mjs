import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Das Schema lebt von Kanten und Ecken, nicht von einer Farbmarke. Gemessen
// wird deshalb, was am Element ankommt.
async function imThema(teo, rumpf) {
  await teo.evaluate(() => {
    const auswahl = document.querySelector("[data-theme-select]");
    auswahl.value = "windows-95";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const ergebnis = await teo.evaluate(rumpf);
  await teo.evaluate(() => {
    const auswahl = document.querySelector("[data-theme-select]");
    auswahl.value = "standard";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return ergebnis;
}

test("Schaltflächen tragen die erhabene Kante ihrer Zeit", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await imThema(teo, () => {
    const buehne = document.createElement("div");
    buehne.innerHTML =
      '<button class="button button-secondary" data-probe="normal">OK</button>' +
      '<button class="button button-primary" data-probe="primary">Sichern</button>';
    document.querySelector(".main-content").append(buehne);
    const lies = (name) => {
      const stil = getComputedStyle(buehne.querySelector(`[data-probe="${name}"]`));
      return {
        grund: stil.backgroundColor,
        schatten: stil.boxShadow,
        ecke: stil.borderRadius,
      };
    };
    const ergebnis = { normal: lies("normal"), primary: lies("primary") };
    buehne.remove();
    return ergebnis;
  });

  // Grau statt Blau, und die Kante aus vier Innenschatten.
  assert.equal(gemessen.normal.grund, "rgb(192, 192, 192)");
  assert.equal(
    (gemessen.normal.schatten.match(/inset/g) || []).length,
    4,
    `Erwartet sind vier Innenschatten, gemessen: ${gemessen.normal.schatten}`,
  );
  // Die Standardschaltfläche trägt zusätzlich den schwarzen Rahmen.
  assert.ok(
    gemessen.primary.schatten.includes("rgb(0, 0, 0)"),
    "Die Hauptaktion hebt sich mit schwarzem Rahmen ab",
  );
  // Und alles bleibt eckig.
  assert.equal(gemessen.normal.ecke, "0px");
  assert.equal(gemessen.primary.ecke, "0px");
});

test("Seitenleiste und Menü folgen dem Schema", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await imThema(teo, () => {
    const menuepunkt = document.querySelector(".nav-item");
    menuepunkt.classList.add("is-active");
    const aktiv = getComputedStyle(menuepunkt);
    const ergebnis = {
      sidebar: getComputedStyle(document.querySelector(".sidebar")).backgroundColor,
      aktiverPunkt: aktiv.backgroundColor,
      aktiveSchrift: aktiv.color,
      panelEcke: getComputedStyle(document.querySelector(".panel")).borderRadius,
    };
    menuepunkt.classList.remove("is-active");
    return ergebnis;
  });

  assert.equal(gemessen.sidebar, "rgb(212, 208, 200)", "Graue Menüfläche");
  // Navyblaue Hervorhebung mit weißer Schrift - das Kennzeichen der Zeit.
  assert.equal(gemessen.aktiverPunkt, "rgb(0, 0, 128)");
  assert.equal(gemessen.aktiveSchrift, "rgb(255, 255, 255)");
  assert.equal(gemessen.panelEcke, "0px", "Auch die Karten bleiben eckig");
});

test("Die Schnellansicht wird zum erhabenen Fenster", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await imThema(teo, () => {
    const inspector = document.querySelector(".record-inspector, #employeeInspector");
    if (!inspector) return null;
    const stil = getComputedStyle(inspector);
    return { schatten: stil.boxShadow, ecke: stil.borderRadius };
  });

  if (gemessen) {
    assert.equal(gemessen.ecke, "0px");
  }
});
