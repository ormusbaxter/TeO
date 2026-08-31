import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

after(closeTeO);

// Absichtlich unsortiert und mit einem Ausgetretenen dazwischen: Beides muss
// das Blatt von sich aus richtigstellen.
const TEAM = [
  ["Zimmer", "Anna", "active", "weekend_a"],
  ["Öztürk", "Fatma", "active", "weekend_b"],
  ["Adler", "Berta", "active", "weekend_b"],
  ["Krause", "Rita", "onboarding", "none"],
  ["Alt", "Clara", "inactive", "weekend_a"],
];

async function loadMonthPrintApp(year = 2026) {
  const app = await loadAppFunctions(
    [
      "normalizeState",
      "renderBlankVacationMonthPrintDocument",
      "vacationEmployeesForBlankYearPrint",
      "blankVacationMonthSheets",
      "getNrwHolidays",
      "getNrwSchoolVacations",
    ],
    { withDom: true },
  );
  const employees = TEAM.map(([lastName, firstName, employmentStatus, serviceWeekend], index) => ({
    ...createEmployee(`e${index}`),
    lastName,
    firstName,
    employmentStatus,
    active: employmentStatus !== "inactive",
    serviceWeekend,
    employmentPercent: 75,
  }));
  app.setState(app.normalizeState(createMinimalState({ employees })));
  app.setVacationPeriod(year);
  return app;
}

function renderMonth(app, month) {
  const employees = app.vacationEmployeesForBlankYearPrint();
  return app.renderBlankVacationMonthPrintDocument(
    month,
    employees,
    app.getNrwHolidays(2026),
    app.getNrwSchoolVacations(2026),
  );
}

test("Das Monatsblatt führt alle aktiven Mitarbeiter alphabetisch untereinander", async () => {
  const app = await loadMonthPrintApp();
  const markup = renderMonth(app, 1);

  // Nur die Namensspalte, nicht die Kopfangabe mit der Anzahl.
  const namen = [
    ...markup.matchAll(
      /scope="row">\s*<strong>([^<]+)<\/strong>/g,
    ),
  ].map(([, name]) => name);
  assert.equal(
    namen.join(" | "),
    "Adler, Berta | Krause, Rita | Öztürk, Fatma | Zimmer, Anna",
    "Nach Nachnamen sortiert - Öztürk gehört nach deutscher Ordnung hinter Krause",
  );
  // Ausgetretene stehen nicht darauf; einzuarbeitende schon.
  assert.doesNotMatch(markup, /Alt, Clara/);

  // Je Mitarbeiter eine Zeile, dazu die Kopfzeile.
  assert.equal((markup.match(/<tr>/g) || []).length, 5);
  // Und Umfang sowie Dienstwochenende stehen unter dem Namen.
  assert.match(markup, /75 % · Wochenende B/);
});

test("Die Spalten decken genau die Tage des Monats ab", async () => {
  const app = await loadMonthPrintApp();
  const tage = (month) =>
    (renderMonth(app, month).match(/vacation-blank-month-day/g) || []).length;

  assert.equal(tage(1), 31, "Januar");
  assert.equal(tage(2), 28, "Februar 2026 ist kein Schaltjahr");
  assert.equal(tage(4), 30, "April");

  const schaltjahr = await loadMonthPrintApp(2028);
  assert.equal(
    (
      schaltjahr
        .renderBlankVacationMonthPrintDocument(
          2,
          schaltjahr.vacationEmployeesForBlankYearPrint(),
          schaltjahr.getNrwHolidays(2028),
          schaltjahr.getNrwSchoolVacations(2028),
        )
        .match(/vacation-blank-month-day/g) || []
    ).length,
    29,
    "Februar 2028 hat einen Tag mehr",
  );
});

test("Das Blatt bleibt leer, auch wenn schon geplant wurde", async () => {
  const app = await loadMonthPrintApp();
  app.getState().vacationDays = [
    { employeeId: "e0", date: "2026-01-05", type: "vacation" },
    { employeeId: "e2", date: "2026-01-06", type: "nightDuty" },
  ];

  const markup = renderMonth(app, 1);
  // Zum Ausfüllen von Hand: keine Einträge, keine Kürzel.
  assert.doesNotMatch(markup, /planner-entry-/);
  assert.doesNotMatch(markup, /has-entry/);
  assert.match(markup, /<td class="[^"]*"><\/td>/, "Die Zellen sind leer");
});

test("Feiertage, Schulferien und das eigene Dienstwochenende sind vermerkt", async () => {
  const app = await loadMonthPrintApp();
  const markup = renderMonth(app, 1);

  // Neujahr und die Weihnachtsferien fallen in den Januar.
  assert.match(markup, /vacation-holiday/);
  assert.match(markup, /vacation-school-vacation/);
  assert.match(markup, /Feiertag NRW/);
  assert.match(markup, /Schulferien NRW/);
  // Das eigene Dienstwochenende hebt sich hervor - je Mitarbeiter ein anderes.
  assert.match(markup, /is-own-weekend/);
  // Der Kopf nennt Tag und Wochentag.
  assert.match(markup, /<span class="vacation-blank-month-day">1<\/span>/);
  assert.match(markup, /<span class="vacation-blank-month-weekday">Do<\/span>/);
  // Und das Blatt nennt Monat und Jahr.
  assert.match(markup, /<h1>Januar 2026<\/h1>/);
});

test("Ein grosses Team wird auf mehrere Blätter je Monat verteilt", async () => {
  const app = await loadMonthPrintApp();
  const blatt = (anzahl) =>
    app
      .blankVacationMonthSheets(Array.from({ length: anzahl }, (_, i) => ({ id: `e${i}` })))
      .map((sheet) => sheet.length);

  assert.equal(blatt(20).join("+"), "20", "Zwanzig füllen genau ein Blatt");
  assert.equal(blatt(21).join("+"), "20+1", "Einer mehr beginnt ein zweites");
  assert.equal(blatt(45).join("+"), "20+20+5");
  // Ohne Mitarbeiter bleibt ein leeres Blatt statt gar keinem - gedruckt wird
  // dieser Fall ohnehin nicht, die Aktion bricht vorher mit einer Meldung ab.
  assert.equal(blatt(0).join("+"), "0");
});

test("Jedes Blatt eines Monats nennt Monat und Seite", async () => {
  const app = await loadMonthPrintApp();
  const employees = Array.from({ length: 45 }, (_, index) => ({
    ...createEmployee(`e${index}`),
    lastName: `Nachname${String(index).padStart(2, "0")}`,
    firstName: "Vorname",
  }));
  const holidays = app.getNrwHolidays(2026);
  const schoolVacations = app.getNrwSchoolVacations(2026);
  const sheets = app.blankVacationMonthSheets(employees);
  const blaetter = sheets.map((sheetEmployees, index) =>
    app.renderBlankVacationMonthPrintDocument(7, sheetEmployees, holidays, schoolVacations, {
      sheet: index + 1,
      sheetCount: sheets.length,
      totalEmployees: employees.length,
    }),
  );

  assert.equal(blaetter.length, 3);
  blaetter.forEach((markup, index) => {
    // Der Monat steht auf jedem Blatt - sonst wüsste das zweite nicht, wohin
    // es gehört.
    assert.match(markup, /<h1>Juli 2026<\/h1>/, `Blatt ${index + 1} nennt den Monat`);
    assert.match(
      markup,
      new RegExp(`Seite ${index + 1} von 3`),
      `Blatt ${index + 1} nennt seine Seite`,
    );
    // Gezählt wird das ganze Team, nicht der Ausschnitt auf diesem Blatt.
    assert.match(markup, /<strong>45<\/strong>/);
  });
});

test("Ein einzelnes Blatt trägt keine Seitenangabe", async () => {
  const app = await loadMonthPrintApp();
  const markup = renderMonth(app, 1);

  assert.match(markup, /<h1>Januar 2026<\/h1>/);
  assert.doesNotMatch(
    markup,
    /Seite \d+ von/,
    "Bei einem Blatt je Monat wäre „Seite 1 von 1“ nur Beiwerk",
  );
});

test("Ein volles Blatt passt auf die Seite - auch mit langen Namen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const app = await loadMonthPrintApp();
  const holidays = app.getNrwHolidays(2026);
  const schoolVacations = app.getNrwSchoolVacations(2026);
  const bauen = (anzahl, lang) =>
    app.renderBlankVacationMonthPrintDocument(
      1,
      Array.from({ length: anzahl }, (_, index) => ({
        ...createEmployee(`e${index}`),
        lastName: lang ? `Schmidt-Wagenknecht-Lüdenscheidt${index}` : `Name${index}`,
        firstName: lang ? "Maximiliane-Charlotte" : "Vorname",
        serviceWeekend: "weekend_a",
      })),
      holidays,
      schoolVacations,
      { sheet: 1, sheetCount: 2, totalEmployees: 40 },
    );

  await teo.page.setViewportSize({ width: 1062, height: 900 });
  await teo.page.emulateMedia({ media: "print" });
  const gemessen = await teo.evaluate(
    ([voll, vollLang, einsZuViel]) => {
      const flaeche = document.querySelector("#vacationBlankMonthPrintSurface");
      document.body.classList.add("print-vacation-blank-month");
      const messe = (markup) => {
        flaeche.innerHTML = markup;
        const blatt = document.querySelector(".vacation-blank-month-document");
        const rand = blatt.getBoundingClientRect();
        return {
          hoehe: Math.round((rand.height / 96) * 25.4 * 10) / 10,
          ueberstehend: [...blatt.querySelectorAll("*")].filter(
            (element) => element.getBoundingClientRect().right > rand.right + 0.5,
          ).length,
        };
      };
      const ergebnis = {
        voll: messe(voll),
        vollLang: messe(vollLang),
        einsZuViel: messe(einsZuViel),
      };
      flaeche.innerHTML = "";
      document.body.classList.remove("print-vacation-blank-month");
      return ergebnis;
    },
    [bauen(20, false), bauen(20, true), bauen(22, false)],
  );

  // Nutzbare Höhe einer A4-Querseite mit 8 mm Rand: 194 mm.
  assert.ok(
    gemessen.voll.hoehe <= 194,
    `Ein volles Blatt misst ${gemessen.voll.hoehe} mm`,
  );
  assert.equal(gemessen.voll.ueberstehend, 0, "Nichts steht über den Rand hinaus");

  // Der entscheidende Punkt: Lange Namen dürfen die Zeile nicht wachsen
  // lassen, sonst stimmt die versprochene Seitenzahl nicht mehr.
  assert.equal(
    gemessen.vollLang.hoehe,
    gemessen.voll.hoehe,
    "Die Blatthöhe hängt nicht an der Länge der Namen",
  );

  // Und die Aufteilung ist nicht zu großzügig gewählt: Zwei Zeilen mehr
  // passten nicht mehr auf die Seite.
  assert.ok(
    gemessen.einsZuViel.hoehe > 194,
    `Zwei Zeilen mehr messen ${gemessen.einsZuViel.hoehe} mm und passten noch`,
  );
});

test("Die versprochene Seitenzahl entspricht dem, was der Drucker ausgibt", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const app = await loadMonthPrintApp();
  const employees = Array.from({ length: 21 }, (_, index) => ({
    ...createEmployee(`e${index}`),
    // Gemischt: kurze und sehr lange Namen im selben Blatt.
    lastName:
      index % 3 === 0
        ? `Schmidt-Wagenknecht-Lüdenscheidt${index}`
        : `Name${String(index).padStart(2, "0")}`,
    firstName: index % 3 === 0 ? "Maximiliane-Charlotte" : "Vorname",
    serviceWeekend: ["weekend_a", "weekend_b", "none"][index % 3],
  }));
  const holidays = app.getNrwHolidays(2026);
  const schoolVacations = app.getNrwSchoolVacations(2026);
  const sheets = app.blankVacationMonthSheets(employees);
  assert.equal(sheets.length, 2, "Einundzwanzig Mitarbeiter brauchen zwei Blätter");

  const markup = sheets
    .map((sheetEmployees, index) =>
      app.renderBlankVacationMonthPrintDocument(7, sheetEmployees, holidays, schoolVacations, {
        sheet: index + 1,
        sheetCount: sheets.length,
        totalEmployees: employees.length,
      }),
    )
    .join("");

  await teo.page.emulateMedia({ media: "print" });
  await teo.evaluate((inhalt) => {
    document.querySelector("#vacationBlankMonthPrintSurface").innerHTML = inhalt;
    document.body.classList.add("print-vacation-blank-month");
  }, markup);
  const pdf = await teo.page.pdf({
    landscape: true,
    format: "A4",
    printBackground: true,
    margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" },
  });
  await teo.evaluate(() => {
    document.querySelector("#vacationBlankMonthPrintSurface").innerHTML = "";
    document.body.classList.remove("print-vacation-blank-month");
  });

  // „Seite 1 von 2“ ist eine Zusage an den Leser. Sie stimmt nur, wenn der
  // Drucker auch wirklich zwei Seiten ausgibt - gemessen am erzeugten PDF.
  const seiten = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.equal(seiten, 2, `Versprochen sind zwei Seiten, gedruckt werden ${seiten}`);
});

test("Der Druck ist als eigene Seitenart eingerichtet", async () => {
  const [html, printCss] = await Promise.all([
    fs.readFile(path.join(projectRoot, "src/html/10-team-planning-views.html"), "utf8"),
    fs.readFile(path.join(projectRoot, "src/styles/90-print.css"), "utf8"),
  ]);

  // Druckregeln bleiben am Stylesheet: Sie wirken erst im Druckerzeugnis.
  assert.match(html, /id="printBlankVacationMonthPlansButton"/);
  assert.match(
    printCss,
    /@page vacation-blank-month\s*{[^}]*size: A4 landscape;[^}]*margin: 8mm;/s,
  );
  assert.match(
    printCss,
    /\.vacation-blank-month-document \+ \.vacation-blank-month-document\s*{[^}]*break-before: page;/s,
  );
  // Die Zeilen einer Person duerfen nicht ueber den Seitenrand zerrissen werden.
  assert.match(
    printCss,
    /\.vacation-blank-month-table tr\s*{[^}]*break-inside: avoid;/s,
  );
  assert.match(
    printCss,
    /body\.print-vacation-blank-month > #trainingMatrixDialog\s*{[^}]*display: none !important;/s,
  );
});
