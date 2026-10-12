import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const BEREICHE = ["general", "planning", "training", "master-data", "data"];

test("Sidebar und Einstellungen führen zu denselben fünf Bereichen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gefunden = await teo.evaluate(() => {
    const ziele = (wurzel) =>
      [...wurzel.querySelectorAll("[data-settings-section-target]")].map(
        (button) => button.dataset.settingsSectionTarget,
      );
    return {
      sidebar: ziele(document.querySelector("#settingsSidebarSubnav")),
      navigation: ziele(document.querySelector(".settings-section-nav")),
      karten: [...document.querySelectorAll("[data-settings-section]")].map(
        (panel) => panel.dataset.settingsSection,
      ),
    };
  });

  for (const ort of ["sidebar", "navigation", "karten"]) {
    assert.equal(
      [...new Set(gefunden[ort])].sort().join(","),
      [...BEREICHE].sort().join(","),
      `Die Bereiche stimmen in „${ort}“ nicht überein`,
    );
  }
});

test("Ein Untermenüpunkt führt in die Einstellungen und zeigt seinen Bereich", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("dashboard");

  for (const bereich of BEREICHE) {
    const zustand = await teo.evaluate((name) => {
      document
        .querySelector(`#settingsSidebarSubnav [data-settings-section-target="${name}"]`)
        .click();
      // Ein Bereich kann aus mehreren Karten bestehen - „general“ etwa hat
      // eine zusätzliche, die Administratoren vorbehalten ist.
      const sichtbar = [
        ...new Set(
          [...document.querySelectorAll("[data-settings-section]")]
            .filter((panel) => !panel.hidden)
            .map((panel) => panel.dataset.settingsSection),
        ),
      ];
      return {
        ansicht: document.querySelector("#settingsView")?.classList.contains("is-active"),
        sichtbar,
      };
    }, bereich);

    // Der Aufruf wechselt in die Einstellungen, auch wenn man woanders stand.
    assert.equal(zustand.ansicht, true, `„${bereich}“ führt in die Einstellungen`);
    // Und zeigt genau seinen Bereich - nicht alle, nicht keinen.
    assert.equal(
      zustand.sichtbar.join(","),
      bereich,
      `„${bereich}“ zeigt stattdessen: ${zustand.sichtbar.join(", ") || "nichts"}`,
    );
  }
});

test("Das Untermenü steht bei seinem Menüpunkt", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Außerhalb der Einstellungen tritt das Untermenü ab - es gehört zu der
  // Ansicht, in der man gerade steht.
  await teo.zeigeAnsicht("dashboard");
  assert.equal(
    await teo.stil("#settingsSidebarSubnav", "display"),
    "none",
    "Anderswo bleibt das Untermenü verborgen",
  );

  // Die Menüpunkte lassen sich umsortieren. Das Untermenü der Einstellungen
  // trägt dieselbe Ordnungszahl wie sein Menüpunkt und steht dadurch
  // unmittelbar darunter - gemessen an der Lage, nicht an der Zahl.
  await teo.zeigeAnsicht("settings");
  const lage = await teo.evaluate(() => {
    const menuepunkt = document.querySelector('.nav-item[data-view="settings"]');
    const untermenue = document.querySelector("#settingsSidebarSubnav");
    const punkte = [...document.querySelectorAll(".nav-item")]
      .map((item) => ({
        view: item.dataset.view,
        oben: item.getBoundingClientRect().top,
      }))
      .sort((links, rechts) => links.oben - rechts.oben);
    const eigeneOben = menuepunkt.getBoundingClientRect().top;
    return {
      gleicheOrdnung:
        getComputedStyle(untermenue).order === getComputedStyle(menuepunkt).order,
      untermenueOben: untermenue.getBoundingClientRect().top,
      eigeneOben,
      naechsterPunktOben:
        punkte.find((punkt) => punkt.oben > eigeneOben)?.oben ?? Infinity,
    };
  });

  assert.equal(lage.gleicheOrdnung, true, "Es trägt die Ordnungszahl seines Menüpunkts");
  assert.ok(
    lage.untermenueOben > lage.eigeneOben,
    "Das Untermenü steht unter seinem Menüpunkt",
  );
  assert.ok(
    lage.untermenueOben < lage.naechsterPunktOben,
    "und vor dem nächsten Menüpunkt",
  );
});

test("Die Bereichsleiste ist eine Registerleiste mit je einem Registerblatt", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("settings");
  const befund = await teo.evaluate(() => {
    const leiste = document.querySelector(".settings-section-nav");
    const reiter = [...leiste.querySelectorAll('[role="tab"]')];
    return {
      rolle: leiste.getAttribute("role"),
      reiter: reiter.map((tab) => {
        const blatt = document.getElementById(tab.getAttribute("aria-controls"));
        return {
          ziel: tab.dataset.settingsSectionTarget,
          gewaehlt: tab.getAttribute("aria-selected"),
          tabIndex: tab.tabIndex,
          blattRolle: blatt?.getAttribute("role"),
          blattBereich: blatt?.dataset.settingsSection,
          blattBeschriftung: blatt?.getAttribute("aria-labelledby") === tab.id,
          blattVerborgen: blatt?.hidden,
        };
      }),
    };
  });

  assert.equal(befund.rolle, "tablist");
  assert.equal(befund.reiter.length, BEREICHE.length);
  for (const reiter of befund.reiter) {
    const aktiv = reiter.ziel === "general";
    assert.equal(reiter.gewaehlt, String(aktiv), `aria-selected an „${reiter.ziel}“`);
    // Nur der gewählte Reiter liegt in der Tab-Reihenfolge.
    assert.equal(reiter.tabIndex, aktiv ? 0 : -1, `tabIndex an „${reiter.ziel}“`);
    assert.equal(reiter.blattRolle, "tabpanel", `Registerblatt zu „${reiter.ziel}“`);
    assert.equal(reiter.blattBereich, reiter.ziel);
    assert.equal(reiter.blattBeschriftung, true, `Blatt „${reiter.ziel}“ trägt den Namen seines Reiters`);
    assert.equal(reiter.blattVerborgen, !aktiv, `Blatt „${reiter.ziel}“ sichtbar nur, wenn gewählt`);
  }
});

test("Pfeiltasten, Pos1 und Ende wechseln den Bereich", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("settings");
  await teo.page.focus("#settingsTab-general");

  const zustand = () =>
    teo.evaluate(() => ({
      fokus: document.activeElement?.dataset.settingsSectionTarget,
      gewaehlt: document
        .querySelector('.settings-section-nav [aria-selected="true"]')
        ?.dataset.settingsSectionTarget,
      sichtbar: [...document.querySelectorAll(".settings-section-panel")]
        .filter((blatt) => !blatt.hidden)
        .map((blatt) => blatt.dataset.settingsSection)
        .join(","),
    }));

  for (const [taste, erwartet] of [
    ["ArrowRight", "planning"],
    ["ArrowRight", "training"],
    ["End", "data"],
    ["ArrowRight", "general"],
    ["ArrowLeft", "data"],
    ["Home", "general"],
  ]) {
    await teo.page.keyboard.press(taste);
    const jetzt = await zustand();
    assert.equal(jetzt.fokus, erwartet, `${taste}: Fokus`);
    assert.equal(jetzt.gewaehlt, erwartet, `${taste}: gewählter Reiter`);
    assert.equal(jetzt.sichtbar, erwartet, `${taste}: sichtbares Blatt`);
  }
});

test("Das Untermenü der Seitenleiste markiert den Bereich mit aria-current", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("settings");
  const markiert = await teo.evaluate(() => {
    document.querySelector('#settingsSidebarSubnav [data-settings-section-target="training"]').click();
    return [...document.querySelectorAll("#settingsSidebarSubnav button")].map((button) => ({
      ziel: button.dataset.settingsSectionTarget,
      current: button.getAttribute("aria-current"),
      pressed: button.getAttribute("aria-pressed"),
    }));
  });

  for (const punkt of markiert) {
    assert.equal(punkt.current, punkt.ziel === "training" ? "true" : null, punkt.ziel);
    // Navigation ist kein Umschalter.
    assert.equal(punkt.pressed, null, punkt.ziel);
  }
});

test("Jedes Feld der Einstellungen hat einen Namen, jeder Verweis ein Ziel", async (t) => {
  const teo = await openTeO(t, { mitDemodaten: true, angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("settings");
  const befund = await teo.evaluate(() => {
    const ansicht = document.querySelector("#settingsView");
    const ohneNamen = [...ansicht.querySelectorAll("input, select, textarea")]
      .filter((feld) => feld.type !== "hidden")
      .filter(
        (feld) =>
          !feld.labels?.length &&
          !feld.getAttribute("aria-label") &&
          !feld.getAttribute("aria-labelledby"),
      )
      .map((feld) => feld.id || feld.outerHTML.slice(0, 80));
    const verwaiste = [];
    for (const attribut of ["aria-describedby", "aria-labelledby", "aria-controls"]) {
      ansicht.querySelectorAll(`[${attribut}]`).forEach((element) => {
        for (const id of element.getAttribute(attribut).split(/\s+/)) {
          if (!document.getElementById(id)) verwaiste.push(`${attribut}=${id}`);
        }
      });
    }
    const sprechendeSymbole = [...ansicht.querySelectorAll(".settings-card-icon")]
      .filter((symbol) => symbol.getAttribute("aria-hidden") !== "true")
      .length;
    return { ohneNamen, verwaiste, sprechendeSymbole };
  });

  assert.equal(befund.ohneNamen.join(" | "), "", "Felder ohne Namen");
  assert.equal(befund.verwaiste.join(" | "), "", "Verweise ins Leere");
  assert.equal(befund.sprechendeSymbole, 0, "Kartensymbole sind Zierde und bleiben stumm");
});
