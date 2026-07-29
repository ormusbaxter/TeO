import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// 2026-06-15 ist ein Montag, 2026-06-20 ein Samstag.
const WERKTAG = "2026-06-15";

function mitMitarbeitern(app, mitarbeiter, urlaubstage) {
  const zustand = app.normalizeState(
    createMinimalState({
      employees: mitarbeiter,
      vacationDays: urlaubstage,
      settings: {
        ...createMinimalState().settings,
        vacationWeekdayAbsenceLimit: 2,
        vacationWeekendAbsenceLimit: 1,
      },
      catalogs: {
        professions: [
          "Pflegefachkraft",
          "Pflegefachassistenz",
          "Medizinische/r Fachangestellte/r",
          "Stationsassistenz",
        ],
        qualifications: [],
      },
    }),
  );
  app.setState(zustand);
  return zustand;
}

function urlaub(employeeId, date, type = "vacation") {
  return {
    id: `entry-${employeeId}-${date}-${type}`,
    employeeId,
    date,
    type,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function mitarbeiter(id, profession, overrides = {}) {
  return { ...createEmployee(id), profession, ...overrides };
}

test("Assistenzberufe belegen keinen der gleichzeitig moeglichen Urlaube", async () => {
  const app = await loadAppFunctions([
    "getPlannerDayStats",
    "countsTowardsAbsenceLimit",
    "normalizeState",
  ]);

  mitMitarbeitern(
    app,
    [
      mitarbeiter("pflege-1", "Pflegefachkraft"),
      mitarbeiter("mfa-1", "Medizinische/r Fachangestellte/r"),
      mitarbeiter("pfa-1", "Pflegefachassistenz"),
      mitarbeiter("sta-1", "Stationsassistenz"),
    ],
    [
      urlaub("pflege-1", WERKTAG),
      urlaub("mfa-1", WERKTAG),
      urlaub("pfa-1", WERKTAG),
      urlaub("sta-1", WERKTAG),
    ],
  );

  const stats = app.getPlannerDayStats(WERKTAG);
  assert.equal(stats.limit, 2);
  assert.equal(stats.absenceCount, 1, "Nur die Pflegefachkraft zaehlt mit");
  assert.equal(stats.exemptAbsenceCount, 3);
  assert.equal(stats.effectiveAbsenceCount, 1);
  assert.equal(stats.isOverLimit, false);
  assert.equal(stats.isAtLimit, false);
});

test("Schreibvarianten der Assistenzberufe werden ebenfalls erkannt", async () => {
  const app = await loadAppFunctions([
    "countsTowardsAbsenceLimit",
    "normalizeState",
  ]);
  mitMitarbeitern(app, [], []);

  for (const beruf of [
    "Medizinische/r Fachangestellte/r",
    "Medizinische Fachangestellte",
    "MFA",
    "Pflegefachassistenz",
    "Stationsassistenz",
    "Stationsassistent",
  ]) {
    assert.equal(
      app.countsTowardsAbsenceLimit({ profession: beruf }),
      false,
      `${beruf} darf die Tagesgrenze nicht belasten`,
    );
  }

  for (const beruf of ["Pflegefachkraft", "Arzt/Ärztin", ""]) {
    assert.equal(
      app.countsTowardsAbsenceLimit({ profession: beruf }),
      true,
      `${beruf || "Ohne Beruf"} muss die Tagesgrenze belasten`,
    );
  }
});

test("Die Pfeilnavigation bleibt innerhalb der Matrix", async () => {
  const app = await loadAppFunctions(["nextPlannerPosition", "normalizeState"]);
  const bounds = { rowCount: 3, columnCount: 30 };
  const mitte = { row: 1, column: 10 };

  assert.deepEqual(
    { ...app.nextPlannerPosition(mitte, "ArrowRight", bounds) },
    { row: 1, column: 11 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition(mitte, "ArrowUp", bounds) },
    { row: 0, column: 10 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition(mitte, "Home", bounds) },
    { row: 1, column: 0 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition(mitte, "End", bounds) },
    { row: 1, column: 29 },
  );

  // An den Raendern bleibt die Auswahl stehen, statt umzubrechen.
  assert.deepEqual(
    { ...app.nextPlannerPosition({ row: 0, column: 0 }, "ArrowLeft", bounds) },
    { row: 0, column: 0 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition({ row: 0, column: 0 }, "ArrowUp", bounds) },
    { row: 0, column: 0 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition({ row: 2, column: 29 }, "ArrowDown", bounds) },
    { row: 2, column: 29 },
  );
  assert.deepEqual(
    { ...app.nextPlannerPosition({ row: 2, column: 29 }, "ArrowRight", bounds) },
    { row: 2, column: 29 },
  );

  // Ein zu kurzer Monat darf keine Spalte jenseits der Matrix liefern.
  assert.deepEqual(
    {
      ...app.nextPlannerPosition({ row: 0, column: 30 }, "ArrowRight", {
        rowCount: 3,
        columnCount: 28,
      }),
    },
    { row: 0, column: 27 },
  );
});

test("Umschalt+Pfeil spannt ein Rechteck in jede Richtung auf", async () => {
  const app = await loadAppFunctions([
    "plannerSelectionBounds",
    "plannerSelectionPositions",
    "normalizeState",
  ]);

  const vonUntenRechts = app.plannerSelectionBounds(
    { row: 4, column: 9 },
    { row: 2, column: 5 },
  );
  assert.deepEqual({ ...vonUntenRechts }, {
    rowStart: 2,
    rowEnd: 4,
    columnStart: 5,
    columnEnd: 9,
  });

  const einzeln = app.plannerSelectionPositions(
    { row: 1, column: 1 },
    { row: 1, column: 1 },
  );
  assert.equal(einzeln.length, 1);

  const bereich = app.plannerSelectionPositions(
    { row: 0, column: 0 },
    { row: 1, column: 3 },
  );
  assert.equal(bereich.length, 8, "2 Zeilen x 4 Spalten");
  assert.equal(
    bereich.map(({ row, column }) => `${row}/${column}`).join(" "),
    "0/0 0/1 0/2 0/3 1/0 1/1 1/2 1/3",
  );
});

test("Die Tastenbelegung ist eindeutig und deckt alle Eintragsarten ab", async () => {
  const app = await loadAppFunctions([
    "PLANNER_ENTRY_KEYS",
    "PLANNER_ENTRY_TYPES",
    "normalizeState",
  ]);

  const tasten = Object.keys(app.PLANNER_ENTRY_KEYS);
  const arten = Object.values(app.PLANNER_ENTRY_KEYS);
  assert.equal(new Set(arten).size, arten.length, "Keine doppelte Eintragsart");
  assert.deepEqual(
    [...tasten].sort().join(""),
    "adefnsu",
    "Belegung: U, A, S, N, E, F, D",
  );
  for (const art of arten) {
    assert.ok(
      Object.hasOwn(app.PLANNER_ENTRY_TYPES, art),
      `${art} muss eine bekannte Eintragsart sein`,
    );
  }
  assert.equal(
    arten.length,
    Object.keys(app.PLANNER_ENTRY_TYPES).length,
    "Jede Eintragsart braucht ein Tastenkuerzel",
  );
});

test("Ueberschreitungen der Tagesgrenze werden mit Beteiligten aufgelistet", async () => {
  const app = await loadAppFunctions([
    "collectVacationConflicts",
    "getPlannerDayStats",
    "countsTowardsAbsenceLimit",
    "normalizeState",
  ]);

  mitMitarbeitern(
    app,
    [
      mitarbeiter("pflege-1", "Pflegefachkraft"),
      mitarbeiter("pflege-2", "Pflegefachkraft"),
      mitarbeiter("pflege-3", "Pflegefachkraft"),
      mitarbeiter("mfa-1", "Medizinische/r Fachangestellte/r"),
      mitarbeiter("inaktiv-1", "Pflegefachkraft", {
        active: false,
        employmentStatus: "inactive",
      }),
    ],
    [
      urlaub("pflege-1", WERKTAG),
      urlaub("pflege-2", WERKTAG),
      urlaub("pflege-3", WERKTAG),
      urlaub("mfa-1", WERKTAG),
      urlaub("inaktiv-1", WERKTAG),
      // Ein zweiter Tag bleibt innerhalb der Grenze und darf nicht erscheinen.
      urlaub("pflege-1", "2026-06-16"),
      urlaub("mfa-1", "2026-06-16"),
      // Ein Tag aus einem anderen Jahr gehoert nicht in die Jahresliste.
      urlaub("pflege-1", "2025-06-16"),
      urlaub("pflege-2", "2025-06-16"),
      urlaub("pflege-3", "2025-06-16"),
    ],
  );

  const konflikte = app.collectVacationConflicts(2026);
  assert.equal(konflikte.length, 1);
  assert.equal(konflikte[0].date, WERKTAG);
  assert.equal(konflikte[0].stats.effectiveAbsenceCount, 3);
  assert.equal(konflikte[0].stats.limit, 2);
  assert.equal(
    konflikte[0].participants
      .map(({ employee }) => employee.id)
      .sort()
      .join(","),
    "mfa-1,pflege-1,pflege-2,pflege-3",
    "Inaktive Mitarbeiter bleiben aussen vor, Assistenzberufe werden nachrichtlich genannt",
  );

  assert.equal(app.collectVacationConflicts(2025).length, 1);
});
