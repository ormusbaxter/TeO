import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Datumsfelder tragen eine eigene Anzeige im deutschen Format", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await teo.evaluate(async () => {
    const input = document.querySelector("#birthDate");
    const shell = input.closest(".formatted-date-shell");
    const display = shell?.querySelector(".formatted-date-display");

    const leer = display?.textContent;
    input.value = "1990-03-07";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const gefuellt = display?.textContent;

    return {
      umhuellt: Boolean(shell),
      leer,
      gefuellt,
      platzhalterklasse: display?.classList.contains("is-placeholder"),
    };
  });

  assert.equal(gemessen.umhuellt, true, "Das Feld steht in seiner Hülle");
  // Ein unvollständiges Datum hat einen leeren Wert - dann steht dort der
  // Platzhalter, nicht nichts.
  assert.equal(gemessen.leer, "TT.MM.JJJJ");
  assert.equal(gemessen.gefuellt, "07.03.1990");
});

test("Beim Tippen tritt die eigene Anzeige zurück", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Die Zusage lautet: Während der Eingabe zeigt das Feld seine eigenen
  // Segmente, nicht die nachgebildete Anzeige darüber. Ob die Regel im
  // Stylesheet steht, sagt darüber nichts - gemessen wird, was ankommt.
  const gemessen = await teo.evaluate(async () => {
    const input = document.querySelector("#birthDate");
    // Das Feld steht in einem Dialog. Ein geschlossener Dialog nimmt keinen
    // Eingabefokus an - also wird er geöffnet, wie beim Anlegen auch.
    input.closest("dialog").showModal();
    const display = input
      .closest(".formatted-date-shell")
      .querySelector(".formatted-date-display");

    const ruhend = getComputedStyle(display).display;
    input.focus();
    const beimTippen = {
      anzeige: getComputedStyle(display).display,
      feldfarbe: getComputedStyle(input).color,
    };
    input.blur();
    const ruhendeFeldfarbe = getComputedStyle(input).color;
    input.closest("dialog").close();
    return { ruhend, beimTippen, ruhendeFeldfarbe };
  });

  assert.notEqual(gemessen.ruhend, "none", "Ohne Eingabe ist die Anzeige sichtbar");
  assert.equal(gemessen.beimTippen.anzeige, "none", "Beim Tippen tritt sie ab");
  // Und das Feld selbst wird dabei sichtbar - ruhend ist es durchsichtig
  // gestellt, damit nicht beides übereinander steht.
  assert.notEqual(
    gemessen.beimTippen.feldfarbe,
    gemessen.ruhendeFeldfarbe,
    "Das Feld zeigt beim Tippen seine eigenen Segmente",
  );
});
