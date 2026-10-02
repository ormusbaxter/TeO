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

  // Jede Gruppe beginnt mit einer Zwischenzeile, in der Reihenfolge der
  // Einstellungen; die Zahl darin stimmt mit den folgenden Zeilen überein.
  const gruppen = await teo.evaluate(() =>
    [...document.querySelectorAll(".vacation-group-row")].map((zeile) => {
      let anzahl = 0;
      for (let folgende = zeile.nextElementSibling; folgende && !folgende.matches(".vacation-group-row"); folgende = folgende.nextElementSibling) {
        anzahl += 1;
      }
      return {
        titel: zeile.querySelector("th").firstChild.textContent.trim(),
        genannt: Number(zeile.querySelector(".vacation-group-count").textContent),
        anzahl,
      };
    }),
  );
  assert.equal(gruppen[0].titel, "Stationsleitung");
  assert.ok(gruppen.length >= 5, gruppen.map((gruppe) => gruppe.titel).join(" | "));
  gruppen.forEach((gruppe) => assert.equal(gruppe.genannt, gruppe.anzahl, gruppe.titel));
  assert.deepEqual(teo.problems, []);
});

test("Alphabetisch sortiert kommt die Tabelle ohne Zwischenzeilen aus", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
    urlaubsansicht: { year: 2026, month: 7, sort: "name" },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");
  assert.equal(await teo.evaluate(() => document.querySelectorAll(".vacation-group-row").length), 0);
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

// Eine Überschreitung färbte Kopf und Felder rot ein und verdeckte damit, ob
// der Tag ein Wochenende oder ein Feiertag ist. Jetzt rahmt sie nur ein.
test("Überplante Tage behalten ihre Wochenend- und Feiertagskennzeichnung", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    urlaubsansicht: { year: 2026, month: 6, sort: "name" },
    mitDemodaten(bestand) {
      bestand.vacationDays = [];
      const pflege = bestand.employees.filter(
        (employee) => employee.active && employee.profession === "Pflegefachkraft",
      );
      // Fronleichnam (Do, 4.6.) und Samstag, 6.6.: je sieben Abwesende bei
      // einer Grenze von fünf an Wochenenden und Feiertagen.
      for (const date of ["2026-06-04", "2026-06-06"]) {
        pflege.slice(0, 7).forEach((employee) => {
          bestand.vacationDays.push({
            id: `test-${employee.id}-${date}`,
            employeeId: employee.id,
            date,
            type: "vacation",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          });
        });
      }
    },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");

  const kopf = await teo.evaluate(() => {
    const kopfzellen = [...document.querySelectorAll(".vacation-table thead .vacation-day-column")];
    const tag = (nummer) => {
      const zelle = kopfzellen[nummer - 1];
      const stil = getComputedStyle(zelle);
      return {
        ueberplant: zelle.classList.contains("is-over-limit"),
        hintergrund: stil.backgroundColor,
        bild: stil.backgroundImage,
        rahmen: stil.boxShadow,
      };
    };
    return { feiertag: tag(4), samstag: tag(6), vergleichsSamstag: tag(20), werktag: tag(3) };
  });

  assert.ok(kopf.feiertag.ueberplant && kopf.samstag.ueberplant);
  // Wochenende: dieselbe Färbung wie zwei Wochen später, am selben Dienstwochenende.
  assert.equal(kopf.samstag.hintergrund, kopf.vergleichsSamstag.hintergrund);
  assert.notEqual(kopf.samstag.hintergrund, kopf.werktag.hintergrund);
  // Feiertag: Die Schraffur in der Ecke bleibt.
  assert.match(kopf.feiertag.bild, /linear-gradient/);
  // Die Überschreitung zeigt sich als roter Rahmen.
  assert.match(kopf.samstag.rahmen, /inset/);
  assert.equal(kopf.vergleichsSamstag.rahmen, "none");

  // Auch die Tagesfelder behalten die Wochenendfärbung.
  const felder = await teo.evaluate(() => {
    const zeile = document.querySelector(".vacation-table tbody tr:not(.vacation-group-row)");
    const zellen = zeile.querySelectorAll(".vacation-day-cell");
    return [getComputedStyle(zellen[5]).backgroundColor, getComputedStyle(zellen[19]).backgroundColor];
  });
  assert.equal(felder[0], felder[1]);
  assert.deepEqual(teo.problems, []);
});

test("Jahresabwesenheiten: Summen je Monat, keine Kopfzahlen, nur eigenes Dienstwochenende", async (t) => {
  let mitarbeiter;
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    urlaubsansicht: { year: 2026, month: 3, sort: "name" },
    mitDemodaten(bestand) {
      mitarbeiter = bestand.employees.find(
        (employee) => employee.active && employee.serviceWeekend === "weekend_a",
      );
      bestand.vacationDays = bestand.vacationDays.filter(
        (entry) => entry.employeeId !== mitarbeiter.id,
      );
      const neu = (date, type) =>
        bestand.vacationDays.push({
          id: `test-${date}`,
          employeeId: mitarbeiter.id,
          date,
          type,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        });
      ["2026-03-02", "2026-03-03", "2026-03-04"].forEach((date) => neu(date, "vacation"));
      ["2026-03-10", "2026-03-11"].forEach((date) => neu(date, "school"));
      neu("2026-05-05", "vacation");
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
    const kopf = [...inhalt.querySelectorAll(".vacation-year-matrix thead th")].map((th) => th.textContent.trim());
    const zeile = (monat) => {
      const zellen = inhalt.querySelectorAll(".vacation-year-matrix tbody tr")[monat - 1].querySelectorAll(".vacation-year-total-column");
      return [...zellen].map((zelle) => zelle.textContent.trim()).join("/");
    };
    return {
      kopfzahlen: Boolean(inhalt.querySelector(".dossier-summary-grid")),
      kopf: kopf.slice(-2).join("|"),
      maerz: zeile(3),
      mai: zeile(5),
      april: zeile(4),
      fremdeTönung: inhalt.querySelectorAll(".vacation-year-matrix td[class*='vacation-weekend-']").length,
      eigeneWochenenden: inhalt.querySelectorAll(".vacation-year-matrix td.is-own-weekend").length,
      legende: [...inhalt.querySelectorAll(".vacation-year-weekend-swatch")].map((swatch) => swatch.className),
    };
  });
  assert.equal(ansicht.kopfzahlen, false);
  assert.equal(ansicht.kopf, "Urlaub|Schule");
  assert.equal(ansicht.maerz, "3/2");
  assert.equal(ansicht.mai, "1/");
  assert.equal(ansicht.april, "/");
  assert.equal(ansicht.fremdeTönung, 0);
  assert.ok(ansicht.eigeneWochenenden > 40, `${ansicht.eigeneWochenenden} eigene Wochenendtage`);
  assert.equal(ansicht.legende.join(","), "vacation-year-weekend-swatch is-own-weekend");
  assert.deepEqual(teo.problems, []);
});

test("Das Fadenkreuz hebt Zeile und Spalte des Feldes unter Zeiger oder Fokus hervor", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
    urlaubsansicht: { year: 2026, month: 6, sort: "name" },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("vacations");

  const zustand = () =>
    teo.evaluate(() => ({
      zeilen: [...document.querySelectorAll("tr.is-crosshair-row")].map(
        (zeile) => zeile.querySelector("[data-vacation-employee]")?.dataset.vacationEmployee,
      ),
      kopf: [...document.querySelectorAll("thead .is-crosshair-column")].map(
        (zelle) => zelle.dataset.vacationColumnDate,
      ),
      spaltenfelder: document.querySelectorAll("tbody td.is-crosshair-column").length,
      zeilen_gesamt: document.querySelectorAll("tbody tr:not(.vacation-group-row)").length,
    }));

  const felder = await teo.page.$$('[data-vacation-date="2026-06-10"]');
  await felder[2].scrollIntoViewIfNeeded();
  await felder[2].hover();
  const gezeigt = await zustand();
  const zweiter = await felder[2].evaluate((feld) => feld.dataset.vacationEmployee);
  assert.equal(gezeigt.zeilen.join(","), zweiter);
  assert.equal(gezeigt.kopf.join(","), "2026-06-10");
  assert.equal(gezeigt.spaltenfelder, gezeigt.zeilen_gesamt);

  // Die Tönung liegt über der Zelle, ohne deren Färbung zu ersetzen.
  const schicht = await felder[2].evaluate((feld) => {
    const zelle = feld.closest("td");
    return getComputedStyle(zelle, "::after").backgroundColor;
  });
  assert.match(schicht, /color\(srgb|rgba/);

  // Die Summenspalten der markierten Zeile kleben weiter am rechten Rand -
  // und stehen damit genau unter ihren Spaltenköpfen.
  const summen = await felder[2].evaluate((feld) => {
    const zeile = feld.closest("tr");
    const scroll = document.querySelector(".vacation-table-scroll");
    scroll.scrollLeft = scroll.scrollWidth;
    const kopf = [...document.querySelectorAll("thead .vacation-total-column")];
    return [...zeile.querySelectorAll(".vacation-total-column")].map((zelle, index) => ({
      position: getComputedStyle(zelle).position,
      versatz: Math.round(zelle.getBoundingClientRect().left - kopf[index].getBoundingClientRect().left),
    }));
  });
  assert.ok(summen.length >= 6);
  summen.forEach((summe) => {
    assert.equal(summe.position, "sticky");
    assert.equal(summe.versatz, 0);
  });

  // Tastatur: Der Fokus nimmt das Kreuz mit.
  await felder[2].focus();
  await teo.page.keyboard.press("ArrowRight");
  const nachTaste = await zustand();
  assert.equal(nachTaste.kopf.join(","), "2026-06-11");

  // Verlässt der Zeiger die Tabelle, verschwindet das Kreuz.
  await teo.evaluate(() =>
    document.querySelector("#vacationPlanner").dispatchEvent(new Event("pointerleave")),
  );
  const danach = await zustand();
  assert.equal(danach.kopf.length + danach.zeilen.length + danach.spaltenfelder, 0);
  assert.deepEqual(teo.problems, []);
});
