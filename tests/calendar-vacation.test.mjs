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
