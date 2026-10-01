import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Diese Tests laufen gegen die Demodatenbank, also gegen echte Ansichten mit
// 60 Mitarbeitern statt gegen nachgebaute Ausschnitte.

test("Die Urlaubsplanung sortiert echte Daten nach Qualifikation", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
    urlaubsansicht: { year: 2026, month: 7, sort: "qualification" },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");

  const zeilen = await teo.evaluate(() =>
    [...document.querySelectorAll(".vacation-employee-link")].map((knopf) => knopf.textContent),
  );
  assert.ok(zeilen.length > 40, `nur ${zeilen.length} Zeilen`);
  // Jede Zeile heißt „Nachname, Vorname“.
  assert.ok(zeilen.every((name) => /^[^,]+, [^,]+$/.test(name)), zeilen.join(" | "));
  assert.deepEqual(teo.problems, []);
});

test("Resturlaub wird übernommen, angezeigt und lässt sich zurücknehmen", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    urlaubsansicht: { year: 2099, month: 1, sort: "name" },
    // Zehn Urlaubstage im Vorjahr für den ersten Mitarbeiter: Bei einem
    // Anspruch von mindestens zehn Tagen bleibt ein Rest übrig.
    mitDemodaten(bestand) {
      const mitarbeiter = bestand.employees.find((employee) => employee.active);
      for (let tag = 1; tag <= 10; tag += 1) {
        bestand.vacationDays.push({
          id: `test-${tag}`,
          employeeId: mitarbeiter.id,
          date: `2098-07-${String(tag).padStart(2, "0")}`,
          type: "vacation",
          createdAt: "2098-01-01T00:00:00.000Z",
          updatedAt: "2098-01-01T00:00:00.000Z",
        });
      }
    },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");

  await teo.evaluate(() => document.querySelector("#carryOverVacationButton").click());
  const frage = await teo.evaluate(() => document.querySelector("#confirmMessage").textContent);
  assert.match(frage, /^1 Mitarbeiter erhalten ihren Rest aus 2098/);
  await teo.evaluate(() => document.querySelector("#confirmAccept").click());
  await teo.page.waitForFunction(() =>
    [...document.querySelectorAll("[data-vacation-carry-over-employee]")].some(
      (feld) => Number(feld.value) > 0,
    ),
  );

  const nachher = await teo.evaluate(() => ({
    uebertraege: [...document.querySelectorAll("[data-vacation-carry-over-employee]")].filter(
      (feld) => Number(feld.value) > 0,
    ).length,
    // 2099: Der Stichtag liegt in der Zukunft, der Rest droht zu verfallen.
    warnung: [...document.querySelectorAll(".vacation-note-detail.is-warning")].some((hinweis) =>
      hinweis.textContent.startsWith("Resturlaub:"),
    ),
    hervorgehoben: document.querySelectorAll(".vacation-carry-over-expiring").length,
  }));
  assert.equal(nachher.uebertraege, 1);
  assert.ok(nachher.warnung, "Hinweis auf verfallenden Resturlaub fehlt");
  assert.equal(nachher.hervorgehoben, 1);

  // „Rückgängig“ in der Meldung nimmt die Übernahme als Ganzes zurück.
  await teo.evaluate(() =>
    [...document.querySelectorAll(".toast-action")]
      .find((knopf) => knopf.textContent === "Rückgängig")
      .click(),
  );
  await teo.page.waitForFunction(() =>
    [...document.querySelectorAll("[data-vacation-carry-over-employee]")].every(
      (feld) => Number(feld.value) === 0,
    ),
  );
  assert.deepEqual(teo.problems, []);
});

test("Ein Test ohne Demodaten sieht keinen Bestand eines früheren Tests", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;
  const anzahl = await teo.evaluate(() =>
    Number(document.querySelector("#navEmployeeCount").textContent),
  );
  assert.equal(anzahl, 0);
});
