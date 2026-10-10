import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

after(closeTeO);

const DEVICE = {
  id: "device-1",
  manufacturer: "Hersteller A",
  productName: "Pumpe",
  category: "Infusion",
  annex1: true,
  currentInventory: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

function instruction(id, date, participants, instructorType = "manufacturer") {
  return {
    id,
    deviceId: DEVICE.id,
    date,
    instructorType,
    instructorEmployeeId: "",
    instructorName: "Außendienst",
    instructorWasMedicalProductsOfficer: false,
    participants: participants.map(([employeeId, wasMedicalProductsOfficer = false]) => ({
      employeeId,
      wasMedicalProductsOfficer,
    })),
    createdAt: `${date}T10:00:00.000Z`,
  };
}

function reset(id, effectiveDate, reason = "Softwareupdate 3.2") {
  return { id, effectiveDate, reason, createdAt: `${effectiveDate}T08:00:00.000Z` };
}

// Drei Mitarbeiter: alt nur vor dem Stichtag eingewiesen, neu am Stichtag
// erneut, nie gar nicht. alt war damals Gerätebeauftragte/r.
function bestand(resets = [reset("reset-1", "2026-09-01")]) {
  const alt = createEmployee("employee-alt");
  const neu = { ...createEmployee("employee-neu"), firstName: "Neu" };
  const nie = { ...createEmployee("employee-nie"), firstName: "Nie" };
  return createMinimalState({
    employees: [alt, neu, nie],
    devices: [{ ...DEVICE, instructionResets: resets }],
    deviceInstructions: [
      instruction("i-alt", "2026-03-01", [[alt.id, true], [neu.id]]),
      instruction("i-neu", "2026-09-01", [[neu.id]]),
    ],
  });
}

test("Normalisierung behält gültige Neueinweisungen und verwirft unvollständige", async () => {
  const app = await loadAppFunctions(["normalizeDevice"]);
  const device = app.normalizeDevice({
    ...DEVICE,
    instructionResets: [
      reset("r2", "2026-09-01"),
      reset("r1", "2026-02-01"),
      { id: "ohne-grund", effectiveDate: "2026-03-01", reason: "  " },
      { id: "ohne-datum", effectiveDate: "kein Datum", reason: "Update" },
      reset("r1", "2026-05-01"),
    ],
  });
  assert.equal(device.instructionResets.map((entry) => entry.id).join(","), "r1,r2");

  const ohne = app.normalizeDevice(DEVICE);
  assert.equal(ohne.instructionResets.length, 0, "Bestehende Geräte bleiben ohne Neueinweisung");
});

test("Einweisungen vor dem Stichtag sind nichtig, am Stichtag gültig", async () => {
  const app = await loadAppFunctions([
    "isDeviceInstructionValid",
    "deviceInstructionCutoff",
    "getDeviceInstructionPercentage",
    "getDeviceAuthorizedEmployees",
    "getDeviceEmployeeOverview",
    "getEmployeeDeviceOverview",
    "filterDeviceEmployeeOverview",
    "filterEmployeeDeviceOverview",
    "getOpenDeviceReinstructions",
  ]);
  const state = bestand();
  app.setState(state);

  assert.equal(app.deviceInstructionCutoff(DEVICE.id), "2026-09-01");
  assert.equal(app.isDeviceInstructionValid(state.deviceInstructions[0]), false);
  assert.equal(app.isDeviceInstructionValid(state.deviceInstructions[1]), true);

  // Nur neu ist gültig eingewiesen: ein Drittel.
  assert.equal(app.getDeviceInstructionPercentage(DEVICE.id, state.employees), 33);

  // Die Herstellereinweisung als Gerätebeauftragte/r liegt vor dem Stichtag.
  assert.equal(app.getDeviceAuthorizedEmployees(DEVICE.id).length, 0);

  const overview = app.getDeviceEmployeeOverview(DEVICE.id);
  const status = Object.fromEntries(
    overview.map((item) => [
      item.employee.id,
      item.isInstructed ? "gültig" : item.isVoided ? "nichtig" : "fehlt",
    ]),
  );
  assert.equal(status["employee-alt"], "nichtig");
  assert.equal(status["employee-neu"], "gültig");
  assert.equal(status["employee-nie"], "fehlt");
  assert.equal(
    app
      .filterDeviceEmployeeOverview(overview, { instructionFilter: "voided" })
      .map((item) => item.employee.id)
      .join(","),
    "employee-alt",
  );

  // In der Geräteübersicht eines Mitarbeiters ist eine nichtige Einweisung offen.
  const offen = app.filterEmployeeDeviceOverview(
    app.getEmployeeDeviceOverview("employee-alt"),
    { openOnly: true },
  );
  assert.equal(offen.length, 1);

  const open = app.getOpenDeviceReinstructions("2026-10-01");
  assert.equal(open.length, 1);
  assert.equal(open[0].status.pending.map((employee) => employee.id).join(","), "employee-alt");
  assert.equal(open[0].status.renewed.map((employee) => employee.id).join(","), "employee-neu");
});

test("Der späteste Stichtag gilt, ohne Stichtag zählt alles", async () => {
  const app = await loadAppFunctions([
    "deviceInstructionCutoff",
    "getDeviceInstructionPercentage",
    "getDeviceAuthorizedEmployees",
  ]);
  const mehrere = bestand([reset("r-spaet", "2026-02-01"), reset("r-frueh", "2025-06-01")]);
  app.setState(mehrere);
  assert.equal(app.deviceInstructionCutoff(DEVICE.id), "2026-02-01");
  // Beide Einweisungen liegen nach dem 01.02.2026: alt und neu sind gültig.
  assert.equal(app.getDeviceInstructionPercentage(DEVICE.id, mehrere.employees), 67);

  const ohne = bestand([]);
  app.setState(ohne);
  assert.equal(app.deviceInstructionCutoff(DEVICE.id), "");
  assert.equal(app.getDeviceAuthorizedEmployees(DEVICE.id).length, 1);
});

test("Neueinweisung anordnen macht Einweisungen in der Matrix sichtbar nichtig", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten: true,
  });
  if (!teo) return;

  await teo.zeigeAnsicht("device-management");
  const vorher = await teo.evaluate(() => ({
    nichtig: document.querySelectorAll(".device-matrix-status.is-voided").length,
  }));
  assert.equal(vorher.nichtig, 0);

  const ergebnis = await teo.evaluate(async () => {
    document
      .querySelector('[data-action="reinstruct-device"][data-id="device-catalog-010"]')
      .click();
    const dialog = document.querySelector("#deviceReinstructionDialog");
    const vorschau = document.querySelector("#deviceReinstructionPreview").textContent;
    document.querySelector("#deviceReinstructionReason").value = "Softwareupdate 3.2";
    document.querySelector("#deviceReinstructionForm").requestSubmit();
    for (let i = 0; i < 50 && dialog.open; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return {
      offen: dialog.open,
      vorschau,
      hinweis: document
        .querySelector('[data-record-card="device-catalog-010"] .device-reinstruction-notice')
        ?.textContent.replace(/\s+/g, " ")
        .trim(),
    };
  });
  assert.equal(ergebnis.offen, false, "Der Dialog schließt nach dem Speichern");
  assert.match(ergebnis.vorschau, /Damit werden die Einweisungen von \d+ Mitarbeiter/);
  assert.match(ergebnis.hinweis, /Neueinweisung seit .*Softwareupdate 3\.2 · 0 von \d+ neu eingewiesen/);

  // Wer das Gerät danach bearbeitet, verliert die Anordnung nicht.
  const nachBearbeiten = await teo.evaluate(async () => {
    document
      .querySelector('[data-action="edit-device"][data-id="device-catalog-010"]')
      .click();
    const dialog = document.querySelector("#deviceDialog");
    document.querySelector("#deviceForm").requestSubmit();
    for (let i = 0; i < 50 && dialog.open; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return Boolean(
      document.querySelector(
        '[data-record-card="device-catalog-010"] .device-reinstruction-notice',
      ),
    );
  });
  assert.equal(nachBearbeiten, true);

  await teo.zeigeAnsicht("devices");
  const matrix = await teo.evaluate(() => {
    const zelle = document.querySelector(
      '.device-matrix-status.is-voided[data-device-history-device="device-catalog-010"]',
    );
    const gueltig = document.querySelector(".device-matrix-status.is-complete");
    return {
      nichtig: document.querySelectorAll(
        '.device-matrix-status.is-voided[data-device-history-device="device-catalog-010"]',
      ).length,
      farbe: zelle && getComputedStyle(zelle).backgroundColor,
      gruen: gueltig && getComputedStyle(gueltig).backgroundColor,
    };
  });
  assert.ok(matrix.nichtig > 0, "Nichtige Einweisungen erscheinen in der Matrix");
  assert.notEqual(matrix.farbe, matrix.gruen, "Nichtig sieht anders aus als gültig");

  await teo.zeigeAnsicht("dashboard");
  const dashboard = await teo.evaluate(() =>
    document
      .querySelector('[data-deadline-device="device-catalog-010"]')
      ?.textContent.replace(/\s+/g, " ")
      .trim(),
  );
  assert.match(dashboard || "", /Neueinweisung .*Infusomat Space .*offen/);
});
