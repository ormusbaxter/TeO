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
