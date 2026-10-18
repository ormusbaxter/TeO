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
  instructionResets: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

function instruction(id, date, employeeIds) {
  return {
    id,
    deviceId: DEVICE.id,
    date,
    instructorType: "manufacturer",
    instructorEmployeeId: "",
    instructorName: "Außendienst",
    instructorWasMedicalProductsOfficer: false,
    participants: employeeIds.map((employeeId) => ({
      employeeId,
      wasMedicalProductsOfficer: false,
    })),
    createdAt: `${date}T10:00:00.000Z`,
  };
}

// Pflege ist eingewiesen, Sekretariat ist ausgenommen und hat aus der Zeit
// davor noch eine Einweisung, die nach dem Stichtag nichtig ist.
function bestand({ reset = false } = {}) {
  const pflege = { ...createEmployee("employee-pflege"), lastName: "Pflege" };
  const sekretariat = {
    ...createEmployee("employee-sekretariat"),
    lastName: "Sekretariat",
    deviceInstructionExempt: true,
  };
  const offen = { ...createEmployee("employee-offen"), lastName: "Offen" };
  return createMinimalState({
    employees: [pflege, sekretariat, offen],
    devices: [
      {
        ...DEVICE,
        instructionResets: reset
          ? [{ id: "r1", effectiveDate: "2026-09-01", reason: "Update", createdAt: "2026-09-01T08:00:00.000Z" }]
          : [],
      },
    ],
    deviceInstructions: [
      instruction("i-1", "2026-03-01", [pflege.id, sekretariat.id]),
      ...(reset ? [instruction("i-2", "2026-09-02", [pflege.id])] : []),
    ],
  });
}

test("Normalisierung kennt die Ausnahme nur bei ausdrücklichem true", async () => {
  const app = await loadAppFunctions(["normalizeEmployee"]);
  assert.equal(
    app.normalizeEmployee({ ...createEmployee(), deviceInstructionExempt: true })
      .deviceInstructionExempt,
    true,
  );
  assert.equal(
    app.normalizeEmployee({ ...createEmployee(), deviceInstructionExempt: "ja" })
      .deviceInstructionExempt,
    false,
  );
  assert.equal(
    app.normalizeEmployee(createEmployee()).deviceInstructionExempt,
    false,
    "Bestehende Mitarbeiter bleiben einzuweisen",
  );
});

test("Ausgenommene fehlen in Matrix, Übersicht je Gerät und Prozentwert", async () => {
  const app = await loadAppFunctions([
    "deviceMatrixEmployees",
    "deviceInstructionEmployees",
    "getDeviceEmployeeOverview",
    "getDeviceInstructionPercentage",
    "createDeviceMatrixWorkbook",
  ]);
  const state = bestand();
  app.setState(state);

  assert.equal(
    app.deviceMatrixEmployees().map((employee) => employee.id).join(","),
    "employee-offen,employee-pflege",
  );
  assert.equal(
    app.getDeviceEmployeeOverview(DEVICE.id).map((item) => item.employee.id).join(","),
    "employee-offen,employee-pflege",
  );
  // Eine von zwei einzuweisenden Personen, nicht zwei von drei.
  assert.equal(
    app.getDeviceInstructionPercentage(DEVICE.id, app.deviceInstructionEmployees()),
    50,
  );

  const workbook = new TextDecoder().decode(app.createDeviceMatrixWorkbook());
  assert.match(workbook, /Pflege/);
  assert.doesNotMatch(workbook, /Sekretariat/, "Der Excel-Export lässt Ausgenommene weg");
});

test("Ausgenommene zählen nicht zu offenen Neueinweisungen", async () => {
  const app = await loadAppFunctions(["getOpenDeviceReinstructions"]);
  app.setState(bestand({ reset: true }));
  // Nur das Sekretariat hat ausschließlich nichtige Einweisungen.
  assert.equal(app.getOpenDeviceReinstructions("2026-10-01").length, 0);

  const ohneAusnahme = bestand({ reset: true });
  ohneAusnahme.employees[1].deviceInstructionExempt = false;
  app.setState(ohneAusnahme);
  const open = app.getOpenDeviceReinstructions("2026-10-01");
  assert.equal(open[0].status.pending.map((employee) => employee.id).join(","), "employee-sekretariat");
});

test("Haken im Mitarbeiterdialog nimmt aus der Einweisungsmatrix", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin", mitDemodaten: true });
  if (!teo) return;

  const matrixZeilen = () =>
    teo.evaluate(() =>
      document.querySelectorAll(
        '#deviceInstructionMatrix [data-device-employee-overview="employee-demo-001"]',
      ).length,
    );
  await teo.zeigeAnsicht("device-management");
  assert.equal(await matrixZeilen(), 1);

  await teo.zeigeAnsicht("employees");
  const ergebnis = await teo.evaluate(async () => {
    document
      .querySelector('[data-action="edit-employee"][data-id="employee-demo-001"]')
      .click();
    const dialog = document.querySelector("#employeeDialog");
    const haken = document.querySelector("#deviceInstructionExempt");
    const vorher = haken.checked;
    haken.click();
    document.querySelector("#employeeForm").requestSubmit();
    for (let i = 0; i < 50 && dialog.open; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return {
      vorher,
      offen: dialog.open,
      liste: document
        .querySelector('[data-action="edit-employee"][data-id="employee-demo-001"]')
        ?.closest("tr")
        ?.textContent.replace(/\s+/g, " "),
    };
  });
  assert.equal(ergebnis.vorher, false);
  assert.equal(ergebnis.offen, false, "Der Dialog schließt nach dem Speichern");
  assert.match(ergebnis.liste, /ohne Geräteeinweisungen/);

  await teo.zeigeAnsicht("device-management");
  assert.equal(await matrixZeilen(), 0, "Ausgenommene stehen nicht mehr in der Matrix");

  const wiederGeoeffnet = await teo.evaluate(() => {
    document
      .querySelector('[data-action="edit-employee"][data-id="employee-demo-001"]')
      .click();
    const checked = document.querySelector("#deviceInstructionExempt").checked;
    document.querySelector("#employeeDialog").close();
    return checked;
  });
  assert.equal(wiederGeoeffnet, true, "Der Haken bleibt gespeichert");
});
