import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// TeO bleibt über Mitternacht geöffnet. Bisher baute es Ansichten nur bei
// Datenänderungen neu auf: Am Neujahrsmorgen nannte das Dashboard noch den
// 31. Dezember, zählte Ausgetretene mit, und Fortbildungen und Sitzungen
// zeigten das alte Jahr.
test("Über Mitternacht geöffnet, zieht TeO Datum, Kennzahlen und laufendes Jahr nach", async (t) => {
  let austritteSilvester = 0;
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    uhr: "2026-12-31T23:58:00+01:00",
    urlaubsansicht: { year: 2026, month: 12, sort: "name" },
    mitDemodaten(bestand) {
      austritteSilvester = bestand.employees.filter(
        (employee) => employee.active && employee.exitDate === "2026-12-31",
      ).length;
    },
  });
  if (!teo) return;
  assert.ok(austritteSilvester > 0, "Die Demodaten enthalten einen Austritt zum 31.12.2026");

  const stand = () =>
    teo.evaluate(() => ({
      datum: document.querySelector("#dashboardDate").textContent,
      beschaeftigt: Number(document.querySelector("#navEmployeeCount").textContent),
      fortbildungsjahr: document.querySelector("#trainingDisplayYear").value,
      sitzungsjahr: document.querySelector("#meetingDisplayYear").value,
      urlaub: `${document.querySelector("#vacationYear").value}-${document.querySelector("#vacationMonth").value}`,
    }));
  for (const ansicht of ["trainings", "meetings", "vacations", "dashboard"]) {
    await teo.zeigeAnsicht(ansicht);
  }
  const silvester = await stand();
  assert.match(silvester.datum, /31\. Dezember 2026/);
  assert.equal(silvester.fortbildungsjahr, "2026");

  await teo.page.clock.fastForward("03:00");
  const neujahr = await stand();
  assert.match(neujahr.datum, /1\. Januar 2027/);
  assert.equal(neujahr.beschaeftigt, silvester.beschaeftigt - austritteSilvester);

  for (const ansicht of ["trainings", "meetings", "vacations"]) {
    await teo.zeigeAnsicht(ansicht);
  }
  const ansichten = await stand();
  assert.equal(ansichten.fortbildungsjahr, "2027");
  assert.equal(ansichten.sitzungsjahr, "2027");
  // In der Urlaubsplanung wird gearbeitet - sie springt nicht von selbst.
  assert.equal(ansichten.urlaub, "2026-12");
  assert.deepEqual(teo.problems, []);
});

test("Ein bewusst gewähltes Jahr bleibt über den Jahreswechsel stehen", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
    uhr: "2026-12-31T23:58:00+01:00",
  });
  if (!teo) return;
  await teo.zeigeAnsicht("trainings");
  await teo.evaluate(() => {
    const auswahl = document.querySelector("#trainingDisplayYear");
    auswahl.value = "2025";
    auswahl.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await teo.page.clock.fastForward("03:00");
  await teo.zeigeAnsicht("meetings");
  await teo.zeigeAnsicht("trainings");
  const jahre = await teo.evaluate(() => ({
    fortbildung: document.querySelector("#trainingDisplayYear").value,
    sitzung: document.querySelector("#meetingDisplayYear").value,
    angeboten: [...document.querySelectorAll("#trainingDisplayYear option")].map((o) => o.value).join(","),
  }));
  assert.equal(jahre.fortbildung, "2025");
  assert.equal(jahre.sitzung, "2027");
  assert.match(jahre.angeboten, /^2027,/, "Das neue Jahr steht zur Auswahl");
});
