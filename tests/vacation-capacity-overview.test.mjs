import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

after(closeTeO);

// 2026-06-15 ist ein Montag, 2026-06-20 ein Samstag.
function eintrag(employeeId, date, type = "vacation") {
  return {
    id: `entry-${employeeId}-${date}-${type}`,
    employeeId,
    date,
    type,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function mitPlanung(vacationDays) {
  const app = await loadAppFunctions([
    "collectVacationCapacityYear",
    "getPlannerDayStats",
    "normalizeState",
  ]);
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: ["p1", "p2", "p3"].map((id) => ({
          ...createEmployee(id),
          profession: "Pflegefachkraft",
        })),
        vacationDays,
        settings: {
          ...createMinimalState().settings,
          vacationWeekdayAbsenceLimit: 2,
          vacationWeekendAbsenceLimit: 1,
        },
      }),
    ),
  );
  return app;
}

test("Die Jahresbelegung zählt freie Plätze und Überbelegung je Tag", async () => {
  const app = await mitPlanung([
    eintrag("p1", "2026-06-15"),
    eintrag("p2", "2026-06-15"),
    eintrag("p3", "2026-06-15"),
    eintrag("p1", "2026-06-16"),
    eintrag("p1", "2026-06-17"),
    eintrag("p2", "2026-06-17"),
  ]);
  const jahr = app.collectVacationCapacityYear(2026, "2026-06-16");
  const juni = jahr.months[5];
  const tag = (nummer) => juni.days[nummer - 1];

  assert.equal(jahr.months.length, 12);
  assert.equal(jahr.months[1].days.length, 28, "Februar 2026 hat 28 Tage");
  assert.equal(tag(15).status, "over");
  assert.equal(tag(15).over, 1, "drei Abwesenheiten bei Grenze zwei");
  assert.equal(tag(16).status, "free");
  assert.equal(tag(16).free, 1);
  assert.equal(tag(17).status, "full");
  assert.equal(tag(18).free, 2, "leerer Werktag");
  assert.equal(tag(20).free, 1, "leerer Samstag, Wochenendgrenze eins");

  // Vergangene Tage zählen nicht als frei, Überbelegungen schon.
  assert.equal(tag(15).isPast, true);
  assert.equal(jahr.overDays, 1);
  assert.equal(jahr.overSlots, 1);
  assert.equal(jahr.months[0].freeSlots, 0, "Januar liegt zurück");
  const erwartetFrei = jahr.months
    .flatMap((monat) => monat.days)
    .filter((day) => !day.isPast)
    .reduce((summe, day) => summe + day.free, 0);
  assert.equal(jahr.freeSlots, erwartetFrei);
  assert.equal(juni.fullDays, 1);
});

test("Die Jahresbelegung rechnet wie die Kopfzeile der Planung", async () => {
  const app = await mitPlanung([
    eintrag("p1", "2026-06-20"),
    eintrag("p2", "2026-06-20"),
  ]);
  const jahr = app.collectVacationCapacityYear(2026, "2026-01-01");
  for (const day of jahr.months.flatMap((monat) => monat.days)) {
    const stats = app.getPlannerDayStats(day.date);
    assert.equal(
      day.free - day.over,
      stats.limit - stats.effectiveAbsenceCount,
      day.date,
    );
  }
});

test("Jahresbelegung öffnet sich aus der Urlaubsplanung und springt in den Monat", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    uhr: "2026-03-10T09:00:00+01:00",
    urlaubsansicht: { year: 2026, month: 3 },
    mitDemodaten: true,
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");
  await teo.evaluate(() => document.querySelector("#openVacationCapacityButton").click());
  await teo.page.waitForSelector("#vacationCapacityDialog[open]");

  const befund = await teo.evaluate(() => {
    const dialog = document.querySelector("#vacationCapacityDialog");
    const zellen = [...dialog.querySelectorAll("[data-vacation-capacity-date]")];
    return {
      tage: zellen.length,
      titel: document.querySelector("#vacationCapacityTitle").textContent,
      kennzahlen: dialog.querySelectorAll(".vacation-capacity-kpi").length,
      ueber: zellen.filter((zelle) => zelle.classList.contains("is-over")).length,
      ueberSpalte: [...dialog.querySelectorAll("tbody tr")]
        .map((zeile) => Number(zeile.lastElementChild.textContent.trim() || 0))
        .reduce((a, b) => a + b, 0),
      rotGrund: (() => {
        const zelle = zellen.find((element) => element.classList.contains("is-over"));
        return zelle ? getComputedStyle(zelle).backgroundColor : "";
      })(),
      gruenGrund: (() => {
        const zelle = zellen.find((element) => element.classList.contains("is-free-many"));
        return zelle ? getComputedStyle(zelle).backgroundColor : "";
      })(),
    };
  });
  assert.equal(befund.tage, 365);
  assert.match(befund.titel, /2026/);
  assert.equal(befund.kennzahlen, 3);
  assert.equal(befund.ueber, befund.ueberSpalte, "Spalte Über zählt die roten Tage");
  assert.ok(befund.gruenGrund && befund.gruenGrund !== "rgba(0, 0, 0, 0)");
  if (befund.ueber) assert.notEqual(befund.rotGrund, befund.gruenGrund);

  await teo.evaluate(() =>
    document.querySelector('[data-vacation-capacity-date="2026-08-12"]').click(),
  );
  const nachher = await teo.evaluate(() => ({
    offen: document.querySelector("#vacationCapacityDialog").open,
    monat: document.querySelector("#vacationMonth").value,
  }));
  assert.equal(nachher.offen, false);
  assert.equal(nachher.monat, "8");
});
