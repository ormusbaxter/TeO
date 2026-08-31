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
    namen.join(", "),
    "Berta Adler, Rita Krause, Fatma Öztürk, Anna Zimmer",
    "Nach Nachnamen sortiert - Öztürk gehört nach deutscher Ordnung hinter Krause",
  );
  // Ausgetretene stehen nicht darauf; einzuarbeitende schon.
  assert.doesNotMatch(markup, /Clara Alt/);

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

test("Ein Monatsblatt füllt eine DIN-A4-Querseite und bricht sauber um", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const app = await loadMonthPrintApp();
  const employees = app.vacationEmployeesForBlankYearPrint();
  const viele = Array.from({ length: 40 }, (_, index) => ({
    ...employees[index % employees.length],
    id: `viele-${index}`,
    lastName: `Nachname${String(index).padStart(2, "0")}`,
  }));
  const holidays = app.getNrwHolidays(2026);
  const schoolVacations = app.getNrwSchoolVacations(2026);
  const kleinesTeam = app.renderBlankVacationMonthPrintDocument(1, employees, holidays, schoolVacations);
  const grossesTeam = app.renderBlankVacationMonthPrintDocument(1, viele, holidays, schoolVacations);

  // Inhaltsbreite einer A4-Querseite mit 8 mm Rand.
  await teo.page.setViewportSize({ width: 1062, height: 800 });
  await teo.page.emulateMedia({ media: "print" });

  const gemessen = await teo.evaluate(
    ([klein, gross]) => {
      const flaeche = document.querySelector("#vacationBlankMonthPrintSurface");
      document.body.classList.add("print-vacation-blank-month");
      const mm = (px) => (px / 96) * 25.4;
      const messe = (markup) => {
        flaeche.innerHTML = markup;
        const blatt = document.querySelector(".vacation-blank-month-document");
        const rand = blatt.getBoundingClientRect();
        const ueberstehend = [...blatt.querySelectorAll("*")].filter(
          (element) => element.getBoundingClientRect().right > rand.right + 0.5,
        ).length;
        return { hoehe: Math.round(mm(rand.height)), ueberstehend };
      };
      const ergebnis = { klein: messe(klein), gross: messe(gross) };
      flaeche.innerHTML = "";
      document.body.classList.remove("print-vacation-blank-month");
      return ergebnis;
    },
    [kleinesTeam, grossesTeam],
  );

  // Nutzbare Höhe einer A4-Querseite mit 8 mm Rand: 194 mm.
  assert.ok(
    gemessen.klein.hoehe <= 194,
    `Ein Blatt mit vier Mitarbeitern misst ${gemessen.klein.hoehe} mm`,
  );
  assert.equal(gemessen.klein.ueberstehend, 0, "Nichts steht über den Rand hinaus");
  assert.equal(gemessen.gross.ueberstehend, 0);

  // Ein grosses Team passt nicht auf ein Blatt. Dass der Tabellenkopf auf der
  // Folgeseite wiederkehrt, besorgt der Browser von sich aus.
  assert.ok(
    gemessen.gross.hoehe > 194,
    "Vierzig Mitarbeiter füllen mehr als eine Seite",
  );
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
