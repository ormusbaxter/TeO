import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { createEmployee, loadAppFunctions } from "./helpers/load-app.mjs";

after(closeTeO);

test("Der Beschäftigungsring zeigt Status und Umfang", async () => {
  const app = await loadAppFunctions(["renderAvatar"], { withDom: true });

  const teilzeit = app.renderAvatar({
    ...createEmployee("e1"),
    employmentPercent: 60,
    employmentStatus: "onboarding",
  });
  assert.match(teilzeit, /avatar-status-onboarding/);
  // Der Füllstand kommt aus den Daten. Ausgegeben wird er über eine
  // Marke - style-Attribute im Markup verbietet die CSP des Servers.
  assert.match(teilzeit, /--avatar-fill:\s*60%/);
  assert.doesNotMatch(teilzeit, /\sstyle="/);
  assert.match(teilzeit, /60 % Beschäftigungsumfang/);

  const ausgetreten = app.renderAvatar({
    ...createEmployee("e2"),
    active: false,
    employmentStatus: "inactive",
  });
  assert.match(ausgetreten, /avatar-status-inactive/);

  // Unsinnige Werte werden auf den zulässigen Bereich gestutzt, statt einen
  // überlaufenden Ring zu erzeugen.
  const uebertrieben = app.renderAvatar({
    ...createEmployee("e3"),
    employmentPercent: 250,
  });
  assert.match(uebertrieben, /--avatar-fill:\s*100%/);
});

test("Der Ring wird als Kreisverlauf gezeichnet und trennt die Status", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const gemessen = await teo.evaluate(async () => {
    const buehne = document.createElement("div");
    // Genau das Markup, das renderAvatar erzeugt - samt der Marke, die den
    // Füllstand trägt.
    buehne.innerHTML = ["active", "onboarding", "inactive"]
      .map(
        (status) =>
          `<span class="avatar avatar-status-${status}" data-status="${status}" data-teo-style="--avatar-fill:60%"><span class="avatar-initials">TP</span></span>`,
      )
      .join("");
    document.querySelector(".main-content").append(buehne);
    // Die Marke wird von einem Beobachter des Dokuments übertragen und steht
    // deshalb erst nach dem Einfügen bereit.
    await new Promise((fertig) =>
      requestAnimationFrame(() => requestAnimationFrame(fertig)),
    );

    const lies = (status) => {
      const element = buehne.querySelector(`[data-status="${status}"]`);
      const stil = getComputedStyle(element);
      return {
        grund: stil.backgroundImage,
        rand: stil.borderColor,
        fuellstand: stil.getPropertyValue("--avatar-fill").trim(),
      };
    };
    const ergebnis = {
      active: lies("active"),
      onboarding: lies("onboarding"),
      inactive: lies("inactive"),
    };
    buehne.remove();
    return ergebnis;
  });

  // Der Umfang ist als Kreisverlauf gezeichnet - daran ist er ablesbar.
  assert.match(gemessen.active.grund, /conic-gradient/);
  // Und die Marke aus dem Markup kommt tatsächlich am Element an: Die
  // Anwendung überträgt data-teo-style beim Einfügen, weil style-Attribute
  // unter der CSP des Servers nicht erlaubt sind.
  assert.equal(gemessen.active.fuellstand, "60%");
  // Und die drei Status sind auseinanderzuhalten.
  assert.notEqual(gemessen.active.rand, gemessen.onboarding.rand);
  assert.notEqual(gemessen.active.rand, gemessen.inactive.rand);
});

test("Die Terminansicht bietet Suche und die vier Zeiträume", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("appointments");
  const bedienelemente = await teo.evaluate(() => ({
    suche: Boolean(document.querySelector("#appointmentSearch")),
    zeitraeume: [...document.querySelectorAll("[data-appointment-filter]")].map(
      (button) => button.dataset.appointmentFilter,
    ),
    aktiv: document
      .querySelector("[data-appointment-filter].is-active")
      ?.dataset.appointmentFilter,
  }));

  assert.equal(bedienelemente.suche, true);
  assert.equal(
    bedienelemente.zeitraeume.join(","),
    "all,upcoming,today,past",
    "Alle vier Zeiträume stehen bereit",
  );

  // Ein Klick schaltet um - und nur einer ist gewählt.
  const nachKlick = await teo.evaluate(() => {
    document.querySelector('[data-appointment-filter="today"]').click();
    return {
      aktiv: [...document.querySelectorAll("[data-appointment-filter].is-active")].map(
        (button) => button.dataset.appointmentFilter,
      ),
      gedrueckt: document
        .querySelector('[data-appointment-filter="today"]')
        .getAttribute("aria-pressed"),
    };
  });
  assert.equal(nachKlick.aktiv.join(","), "today");
  assert.equal(nachKlick.gedrueckt, "true");
});
