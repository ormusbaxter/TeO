import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Die Obermenüs der Seitenleiste: ein Schalter in den Einstellungen fasst
// die Menüpunkte unter Personal, Termine, Fortbildungen und Geräte zusammen.
async function lese(teo) {
  return teo.evaluate(() => {
    const sichtbar = (element) =>
      Boolean(element) && element.getClientRects().length > 0;
    return {
      gruppen: [...document.querySelectorAll("#mainNav .nav-group")]
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
        .map((gruppe) =>
          [
            gruppe.dataset.navGroup,
            ...[...gruppe.querySelectorAll(".nav-item[data-view]")].map((item) => item.dataset.view),
          ].join(":"),
        )
        .join(" "),
      oben: [...document.querySelectorAll("#mainNav > .nav-item[data-view]")]
        .map((item) => item.dataset.view)
        .join(","),
      mitarbeiterSichtbar: sichtbar(document.querySelector('.nav-item[data-view="employees"]')),
      geraeteSichtbar: sichtbar(document.querySelector('.nav-item[data-view="devices"]')),
    };
  });
}

test("Obermenüs fassen die Menüpunkte zusammen und überleben den Neustart", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const ohne = await lese(teo);
  assert.equal(ohne.gruppen, "", "Ohne Einstellung bleibt die Seitenleiste flach");

  await teo.zeigeAnsicht("settings");
  await teo.page.check("#sidebarGroupingToggle");
  const mit = await lese(teo);
  assert.equal(
    mit.gruppen,
    "personnel:employees:weekends:vacations schedule:appointments:memos " +
      "training:trainings:meetings devices:devices:device-management",
  );
  assert.equal(mit.oben, "dashboard,settings,help", "Übersicht, Einstellungen und Hilfe bleiben für sich");

  // Zuklappen blendet die Einträge aus; der Zustand bleibt gemerkt.
  await teo.page.click('[data-nav-group-toggle="devices"]');
  assert.equal((await lese(teo)).geraeteSichtbar, false);
  assert.equal(
    await teo.evaluate(() =>
      document.querySelector('[data-nav-group-toggle="devices"]').getAttribute("aria-expanded"),
    ),
    "false",
  );

  // Ein Menüpunkt in einem Obermenü öffnet seine Ansicht wie bisher.
  await teo.page.click('.nav-item[data-view="meetings"]');
  assert.equal(
    await teo.evaluate(() => document.querySelector('[data-view-panel="meetings"]').classList.contains("is-active")),
    true,
  );

  const neu = await openTeO(t, { angemeldetAls: "admin", neustart: true });
  const danach = await lese(neu);
  assert.match(danach.gruppen, /^personnel:/, "Die Obermenüs gelten nach dem Neustart weiter");
  assert.equal(danach.geraeteSichtbar, false, "Zugeklappt bleibt zugeklappt");

  // Wer die Ansicht anderweitig aufruft, sieht ihren Menüpunkt.
  await neu.zeigeAnsicht("devices");
  assert.equal((await lese(neu)).geraeteSichtbar, true);

  // Abschalten stellt die flache Leiste in der alten Reihenfolge wieder her.
  await neu.zeigeAnsicht("settings");
  await neu.page.uncheck("#sidebarGroupingToggle");
  const flach = await lese(neu);
  assert.equal(flach.gruppen, "");
  assert.equal(
    flach.oben,
    "dashboard,employees,weekends,vacations,appointments,memos,trainings,meetings,devices,device-management,settings,help",
  );
  assert.deepEqual(neu.problems, []);
});

test("Mit Obermenüs lässt sich innerhalb einer Gruppe umsortieren", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;
  await teo.zeigeAnsicht("settings");
  await teo.page.check("#sidebarGroupingToggle");

  await teo.page.focus('.nav-item[data-view="vacations"]');
  await teo.page.keyboard.press("Alt+ArrowUp");
  const reihenfolge = await teo.evaluate(() =>
    [...document.querySelectorAll('[data-nav-group="personnel"] .nav-item[data-view]')]
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .map((item) => item.dataset.view)
      .join(","),
  );
  assert.equal(reihenfolge, "employees,vacations,weekends");

  // Am Rand der Gruppe ist Schluss - der Eintrag wandert nicht in die Nachbargruppe.
  await teo.page.focus('.nav-item[data-view="employees"]');
  await teo.page.keyboard.press("Alt+ArrowUp");
  assert.equal(
    await teo.evaluate(() =>
      document.querySelector('.nav-item[data-view="employees"]').closest(".nav-group").dataset.navGroup,
    ),
    "personnel",
  );
});

test("Teamsitzungen stehen mit der neuesten zuerst", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(bestand) {
      bestand.meetings = bestand.meetings.filter((meeting) => meeting.date.startsWith("2026"));
    },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("meetings");
  const daten = await teo.evaluate(() =>
    [...document.querySelectorAll("#meetingList .meeting-card .training-meta")].map((m) => m.textContent.trim()),
  );
  const iso = daten.map((text) => {
    const [tag, monat, jahr] = text.match(/(\d{2})\.(\d{2})\.(\d{4})/).slice(1);
    return `${jahr}-${monat}-${tag}`;
  });
  assert.ok(iso.length >= 2, "Die Demodaten bringen mehrere Sitzungen mit");
  assert.equal(iso.join(","), [...iso].sort().reverse().join(","));
});

test("Eingeklappt zeigt die Spur alle Einträge ohne Obermenüköpfe", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;
  await teo.zeigeAnsicht("settings");
  await teo.page.check("#sidebarGroupingToggle");
  await teo.page.click('[data-nav-group-toggle="devices"]');
  await teo.evaluate(() => document.querySelector("#sidebarToggle").click());
  const zustand = await teo.evaluate(() => ({
    koepfe: [...document.querySelectorAll(".nav-group-toggle")].filter(
      (kopf) => kopf.getClientRects().length > 0,
    ).length,
    geraete: document.querySelector('.nav-item[data-view="devices"]').getClientRects().length > 0,
  }));
  assert.equal(zustand.koepfe, 0, "Die Köpfe wiederholten nur die Symbole ihrer Einträge");
  assert.equal(zustand.geraete, true, "Auch die Einträge zugeklappter Gruppen bleiben erreichbar");
});
