import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("„Abschluss eintragen“ ist die primäre und letzte Aktion", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("trainings");
  const gemessen = await teo.evaluate(() => {
    // Beide Aufrufe gibt es mehrfach - im Kopf der Ansicht, in der
    // Schnellauswahl und in Dialogen. Gemeint ist der sichtbare im Kopf.
    const sichtbar = (selektor) =>
      [...document.querySelectorAll(selektor)].find(
        (element) =>
          element.getBoundingClientRect().width > 0 &&
          element.closest(".header-actions"),
      );
    const fortbildung = sichtbar("[data-open-training]");
    const abschluss = sichtbar("[data-open-completion]");
    const platz = (element) => {
      const rechteck = element.getBoundingClientRect();
      return { oben: Math.round(rechteck.top), links: Math.round(rechteck.left) };
    };
    const flaeche = (element) => getComputedStyle(element).backgroundColor;
    return {
      fortbildungPlatz: platz(fortbildung),
      abschlussPlatz: platz(abschluss),
      fortbildungFlaeche: flaeche(fortbildung),
      abschlussFlaeche: flaeche(abschluss),
      hauptaktion: flaeche(document.querySelector(".button-primary")),
      nebenaktion: flaeche(document.querySelector(".button-secondary")),
    };
  });

  // Die häufigere Handlung steht zuletzt und hebt sich ab: Ein Abschluss wird
  // oft eingetragen, eine Fortbildung selten angelegt. Verglichen wird in
  // Leserichtung - je nach Fensterbreite stehen die Aufrufe nebeneinander
  // oder untereinander.
  const nachher =
    gemessen.abschlussPlatz.oben > gemessen.fortbildungPlatz.oben ||
    (gemessen.abschlussPlatz.oben === gemessen.fortbildungPlatz.oben &&
      gemessen.abschlussPlatz.links > gemessen.fortbildungPlatz.links);
  assert.ok(nachher, "„Abschluss eintragen“ steht hinter „Fortbildung anlegen“");
  assert.equal(
    gemessen.abschlussFlaeche,
    gemessen.hauptaktion,
    "„Abschluss eintragen“ trägt die Farbe der Hauptaktion",
  );
  assert.equal(
    gemessen.fortbildungFlaeche,
    gemessen.nebenaktion,
    "„Fortbildung anlegen“ tritt zurück",
  );
  assert.notEqual(
    gemessen.abschlussFlaeche,
    gemessen.fortbildungFlaeche,
    "Beide Aktionen sähen sonst gleich wichtig aus",
  );
});
