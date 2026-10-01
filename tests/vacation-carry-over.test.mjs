import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

function urlaub(employeeId, date, type = "vacation") {
  return {
    id: `entry-${employeeId}-${date}`,
    employeeId,
    date,
    type,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function mitBestand({ entitlements = [], days = [], expiry } = {}) {
  const app = await loadAppFunctions([
    "getVacationEntitlement",
    "proposedCarryOvers",
    "parseCarryOverExpiry",
    "normalizeState",
  ]);
  const state = createMinimalState({
    employees: [createEmployee("e1"), createEmployee("e2")],
    vacationEntitlements: entitlements,
    vacationDays: days,
  });
  if (expiry !== undefined) {
    state.settings = { ...state.settings, vacationCarryOverExpiry: expiry };
  }
  app.setState(app.normalizeState(state));
  return app;
}

// Ein Jahr weit in der Zukunft: Der Stichtag liegt noch vor uns.
const ZUKUNFT = 2099;
// Ein Jahr in der Vergangenheit: Der Stichtag ist verstrichen.
const VERGANGEN = 2020;

test("Übertrag erhöht den Anspruch und warnt vor dem Verfall", async () => {
  const app = await mitBestand({
    entitlements: [{ employeeId: "e1", year: ZUKUNFT, additionalDays: 2, carryOverDays: 5 }],
    days: [urlaub("e1", `${ZUKUNFT}-02-10`), urlaub("e1", `${ZUKUNFT}-02-11`)],
  });
  const anspruch = app.getVacationEntitlement(app.getState().employees[0], ZUKUNFT);
  assert.equal(anspruch.carryOver, 5);
  // Zwei Tage bis zum 31.03. geplant: drei Tage drohen zu verfallen.
  assert.equal(anspruch.expiring, 3);
  assert.equal(anspruch.expired, 0);
  assert.equal(anspruch.total, 30 + 2 + 5);
});

test("Nach dem Stichtag verfällt der ungenutzte Rest", async () => {
  const app = await mitBestand({
    entitlements: [{ employeeId: "e1", year: VERGANGEN, additionalDays: 0, carryOverDays: 4 }],
    // Ein Tag vor, einer nach dem Stichtag: Nur der erste zehrt den Übertrag auf.
    days: [urlaub("e1", `${VERGANGEN}-03-31`), urlaub("e1", `${VERGANGEN}-04-01`)],
  });
  const anspruch = app.getVacationEntitlement(app.getState().employees[0], VERGANGEN);
  assert.equal(anspruch.expired, 3);
  assert.equal(anspruch.expiring, 0);
  assert.equal(anspruch.total, 30 + 4 - 3);
});

test("Der Stichtag ist einstellbar", async () => {
  const app = await mitBestand({
    expiry: "06-30",
    entitlements: [{ employeeId: "e1", year: VERGANGEN, additionalDays: 0, carryOverDays: 2 }],
    days: [urlaub("e1", `${VERGANGEN}-05-04`), urlaub("e1", `${VERGANGEN}-05-05`)],
  });
  const anspruch = app.getVacationEntitlement(app.getState().employees[0], VERGANGEN);
  assert.equal(anspruch.expired, 0);
  assert.equal(anspruch.expiryDate, `${VERGANGEN}-06-30`);
});

test("Ungültige Stichtage fallen auf den 31.03. zurück", async () => {
  for (const wert of ["02-29", "13-01", "31.03.", 42]) {
    const app = await mitBestand({ expiry: wert });
    assert.equal(app.getState().settings.vacationCarryOverExpiry, "03-31", String(wert));
  }
});

test("Die Eingabe des Stichtags versteht übliche Schreibweisen", async () => {
  const app = await mitBestand();
  assert.equal(app.parseCarryOverExpiry("31.03."), "03-31");
  assert.equal(app.parseCarryOverExpiry("1.4"), "04-01");
  assert.equal(app.parseCarryOverExpiry(" 30.06 "), "06-30");
  assert.equal(app.parseCarryOverExpiry("29.02."), "");
  assert.equal(app.parseCarryOverExpiry("März"), "");
});

test("Übernahme schlägt den Rest des Vorjahres vor, nur bei vorhandenen Einträgen", async () => {
  const app = await mitBestand({
    entitlements: [{ employeeId: "e1", year: 2025, additionalDays: 1.5, carryOverDays: 0 }],
    days: Array.from({ length: 25 }, (_, index) =>
      urlaub("e1", `2025-07-${String(index + 1).padStart(2, "0")}`),
    ),
  });
  const vorschlag = app.proposedCarryOvers(2026);
  // e2 hat 2025 keinen einzigen Eintrag und bleibt deshalb aussen vor.
  assert.equal(vorschlag.length, 1);
  assert.equal(vorschlag[0].employeeId, "e1");
  assert.equal(vorschlag[0].days, 30 + 1.5 - 25);
});
