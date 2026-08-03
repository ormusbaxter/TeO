import assert from "node:assert/strict";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

test("NRW-Feiertage und Osterdatum werden stabil berechnet", async () => {
  const app = await loadAppFunctions([
    "getEasterSunday",
    "getNrwHolidays",
    "formatDateInputValue",
    "normalizeState",
  ]);
  app.setState(app.normalizeState(createMinimalState()));

  assert.equal(app.getEasterSunday(2026).toISOString().slice(0, 10), "2026-04-05");
  const holidays = app.getNrwHolidays(2026);
  assert.equal(app.formatDateInputValue("2026-01-03"), "03.01.2026");
  assert.equal(app.formatDateInputValue(""), "");
  assert.equal(holidays.get("2026-04-03"), "Karfreitag");
  assert.equal(holidays.get("2026-06-04"), "Fronleichnam");
  assert.equal(holidays.get("2026-12-25"), "1. Weihnachtstag");
});

test("Schulferien stammen aus den Einstellungen und gelten auch nach 2030", async () => {
  const app = await loadAppFunctions([
    "getNrwSchoolVacations",
    "normalizeState",
  ]);

  // Fehlt der Schluessel, wird die amtliche NRW-Liste eingesetzt
  const migriert = app.normalizeState(createMinimalState());
  app.setState(migriert);
  assert.ok(
    migriert.settings.schoolVacationPeriods.length > 20,
    "Alte Datenbestaende muessen die amtliche Liste erhalten",
  );
  assert.equal(app.getNrwSchoolVacations(2026).get("2026-07-20"), "Sommerferien");

  // Eine bewusst geleerte Liste bleibt leer
  const geleert = app.normalizeState(
    createMinimalState({
      settings: {
        ...createMinimalState().settings,
        schoolVacationPeriods: [],
      },
    }),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(geleert.settings.schoolVacationPeriods)),
    [],
  );

  // Eigene Zeitraeume weit jenseits von 2035
  const eigene = app.normalizeState(
    createMinimalState({
      settings: {
        ...createMinimalState().settings,
        schoolVacationPeriods: [
          { start: "2041-12-23", end: "2042-01-06", label: "Weihnachtsferien" },
          { start: "2041-07-08", end: "2041-08-19", label: "Sommerferien" },
          { start: "2041-05-05", end: "2041-05-04", label: "Ende vor Beginn" },
          { start: "kein-datum", end: "2041-01-02", label: "Ungueltig" },
          { start: "2041-07-08", end: "2041-08-19", label: "" },
        ],
      },
    }),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(eigene.settings.schoolVacationPeriods)),
    [
      { start: "2041-07-08", end: "2041-08-19", label: "Sommerferien" },
      { start: "2041-12-23", end: "2042-01-06", label: "Weihnachtsferien" },
    ],
    "Ungueltige Zeitraeume werden verworfen und der Rest nach Beginn sortiert",
  );

  app.setState(eigene);
  const jahr2041 = app.getNrwSchoolVacations(2041);
  assert.equal(jahr2041.get("2041-07-08"), "Sommerferien");
  assert.equal(jahr2041.get("2041-12-31"), "Weihnachtsferien");
  assert.equal(jahr2041.get("2041-09-01"), undefined);

  // Jahresuebergreifende Ferien erscheinen in beiden Jahren
  const jahr2042 = app.getNrwSchoolVacations(2042);
  assert.equal(jahr2042.get("2042-01-06"), "Weihnachtsferien");
  assert.equal(jahr2042.get("2042-01-07"), undefined);
});
