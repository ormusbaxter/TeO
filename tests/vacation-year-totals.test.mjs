import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

after(closeTeO);

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

test("Die Jahressumme zählt nur Urlaub des Jahres und trennt genommen von geplant", async () => {
  const app = await loadAppFunctions([
    "getVacationEmployeeYearSummary",
    "normalizeState",
  ]);
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [createEmployee("p1"), createEmployee("p2")],
        vacationDays: [
          eintrag("p1", "2025-12-30"),
          eintrag("p1", "2026-02-02"),
          eintrag("p1", "2026-02-03", "onboardingVacation"),
          eintrag("p1", "2026-03-10", "school"),
          eintrag("p1", "2026-08-03"),
          eintrag("p1", "2026-08-04"),
          eintrag("p2", "2026-08-05"),
        ],
        vacationEntitlements: [
          { employeeId: "p1", year: 2026, additionalDays: 2, carryOverDays: 0 },
        ],
        settings: { ...createMinimalState().settings, vacationBaseDays: 30 },
      }),
    ),
  );
  const employee = app.getState().employees.find((entry) => entry.id === "p1");
  const summe = app.getVacationEmployeeYearSummary(employee, 2026, "2026-06-01");
  assert.equal(summe.total, 4);
  assert.equal(summe.taken, 2);
  assert.equal(summe.upcoming, 2);
  assert.equal(summe.entitlement, 32);
  assert.equal(summe.remaining, 28);
});

test("Jahresabwesenheiten zeigen die Urlaubstage des Jahres und markieren den Geburtstag", async (t) => {
  let mitarbeiter;
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    urlaubsansicht: { year: 2026, month: 3, sort: "name" },
    mitDemodaten(bestand) {
      mitarbeiter = bestand.employees.find((employee) => employee.active);
      mitarbeiter.birthDate = "1988-04-14";
      bestand.vacationDays = bestand.vacationDays.filter(
        (entry) => entry.employeeId !== mitarbeiter.id,
      );
      [
        ["2026-03-02", "vacation"],
        ["2026-03-03", "vacation"],
        ["2026-04-14", "vacation"],
        ["2026-05-05", "onboardingVacation"],
        ["2026-05-06", "school"],
      ].forEach(([date, type]) => bestand.vacationDays.push(eintrag(mitarbeiter.id, date, type)));
    },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");
  await teo.evaluate((id) => {
    document.querySelector(`[data-vacation-employee-overview="${id}"]`).click();
  }, mitarbeiter.id);
  await teo.page.waitForSelector("#vacationEmployeeOverviewDialog[open]");

  const ansicht = await teo.evaluate(() => {
    const inhalt = document.querySelector("#vacationEmployeeOverviewContent");
    const wert = (key) =>
      inhalt.querySelector(`[data-vacation-year-summary="${key}"] strong`)?.textContent.trim();
    const geburtstag = inhalt.querySelector(".vacation-year-matrix td.is-birthday");
    const schraffur = geburtstag?.querySelector(".vacation-birthday-marker");
    return {
      gesamt: wert("total"),
      summeUrlaub: inhalt.querySelector('[data-vacation-year-total="vacation"]')?.textContent.trim(),
      summeSchule: inhalt.querySelector('[data-vacation-year-total="school"]')?.textContent.trim(),
      geburtstage: inhalt.querySelectorAll(".vacation-year-matrix td.is-birthday").length,
      geburtstagTitel: geburtstag?.title,
      eintragImGeburtstag: Boolean(geburtstag?.querySelector(".vacation-year-entry")),
      schraffur: schraffur ? getComputedStyle(schraffur).backgroundImage : "",
      legende: inhalt.querySelector(".vacation-year-legend").textContent,
    };
  });
  assert.equal(ansicht.gesamt, "4");
  assert.equal(ansicht.summeUrlaub, "4");
  assert.equal(ansicht.summeSchule, "1");
  assert.equal(ansicht.geburtstage, 1);
  assert.match(ansicht.geburtstagTitel, /14\.04\.2026/);
  assert.match(ansicht.geburtstagTitel, /38\. Geburtstag/);
  assert.equal(ansicht.eintragImGeburtstag, true);
  assert.match(ansicht.schraffur, /repeating-linear-gradient/);
  assert.match(ansicht.legende, /Geburtstag/);
  assert.deepEqual(teo.problems, []);
});
