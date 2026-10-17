import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

after(closeTeO);

function gerät(id, productName, currentInventory, extra = {}) {
  return {
    id,
    productName,
    manufacturer: "Prüfwerk",
    category: "Testgerät",
    annex1: false,
    currentInventory,
    instructionResets: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function herstellereinweisung(id, deviceId, date, participants) {
  return {
    id,
    deviceId,
    date,
    instructorType: "manufacturer",
    instructorEmployeeId: "",
    instructorName: "Prüfwerk",
    instructorWasMedicalProductsOfficer: false,
    participants,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

// Alpha: Anna berechtigt (zweimal eingewiesen, das jüngere Datum zählt).
// Beta: Annas Herstellereinweisung ist durch eine Neueinweisung nichtig.
// Gamma: ausgemustert, Clara berechtigt, inzwischen nicht mehr beschäftigt.
// Bernd ist aktuell Gerätebeauftragter, aber ohne Herstellereinweisung;
// Dora hat teilgenommen, war damals aber nicht Gerätebeauftragte.
function bestand() {
  const anna = {
    ...createEmployee("anna"),
    firstName: "Anna",
    lastName: "Adler",
    qualifications: { medizinproduktebeauftragter: true },
  };
  const bernd = {
    ...createEmployee("bernd"),
    firstName: "Bernd",
    lastName: "Berg",
    qualifications: { medizinproduktebeauftragter: true },
  };
  const clara = {
    ...createEmployee("clara"),
    firstName: "Clara",
    lastName: "Claus",
    active: false,
    employmentStatus: "inactive",
  };
  const dora = { ...createEmployee("dora"), firstName: "Dora", lastName: "Dahl" };
  return {
    employees: [anna, bernd, clara, dora],
    devices: [
      gerät("alpha", "Alpha", true),
      gerät("beta", "Beta", true, {
        instructionResets: [
          {
            id: "reset-beta",
            effectiveDate: "2026-05-01",
            reason: "Softwareupdate",
            createdAt: "2026-05-01T00:00:00.000Z",
          },
        ],
      }),
      gerät("gamma", "Gamma", false),
    ],
    deviceInstructions: [
      herstellereinweisung("e1", "alpha", "2025-03-01", [
        { employeeId: "anna", wasMedicalProductsOfficer: true },
        { employeeId: "dora", wasMedicalProductsOfficer: false },
      ]),
      herstellereinweisung("e2", "alpha", "2026-02-01", [
        { employeeId: "anna", wasMedicalProductsOfficer: true },
      ]),
      herstellereinweisung("e3", "beta", "2026-01-15", [
        { employeeId: "anna", wasMedicalProductsOfficer: true },
      ]),
      herstellereinweisung("e4", "gamma", "2024-06-01", [
        { employeeId: "clara", wasMedicalProductsOfficer: true },
      ]),
    ],
  };
}

test("Einweisungsberechtigungen je Gerätebeauftragtem und je Gerät", async () => {
  const app = await loadAppFunctions(["getDeviceAuthorizationOverview"]);
  const daten = bestand();
  app.setState(createMinimalState(daten));

  const imBestand = app.getDeviceAuthorizationOverview({ today: "2026-10-17" });
  assert.equal(
    imBestand.officers.map((officer) => officer.employee.id).join(","),
    "anna,bernd",
  );
  const anna = imBestand.officers[0];
  assert.equal(
    anna.devices.map(({ device, date }) => `${device.id}@${date}`).join(","),
    "alpha@2026-02-01",
  );
  assert.equal(imBestand.officers[1].devices.length, 0);
  assert.equal(
    imBestand.devicesWithoutAuthorization.map((device) => device.id).join(","),
    "beta",
  );
  assert.equal(
    imBestand.devices
      .map(
        ({ device, authorized }) =>
          `${device.id}:${authorized.map(({ employee }) => employee.id).join("+")}`,
      )
      .join(","),
    "alpha:anna,beta:",
  );

  const alle = app.getDeviceAuthorizationOverview({
    inventoryOnly: false,
    today: "2026-10-17",
  });
  const clara = alle.officers.find((officer) => officer.employee.id === "clara");
  assert.ok(clara, "Clara bleibt für das ausgemusterte Gerät berechtigt");
  assert.equal(clara.isEmployed, false);
  assert.equal(clara.devices.map(({ device }) => device.id).join(","), "gamma");
  assert.ok(!alle.officers.some((officer) => officer.employee.id === "dora"));
});

test("Die Schaltfläche Einweisungsberechtigungen öffnet die Übersicht", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(demo) {
      const daten = bestand();
      demo.employees.push(...daten.employees);
      demo.devices = daten.devices;
      demo.deviceInstructions = daten.deviceInstructions;
    },
  });
  if (!teo) return;

  await teo.zeigeAnsicht("devices");
  await teo.evaluate(() =>
    document.querySelector("#openDeviceAuthorizationButton").click(),
  );
  assert.equal(
    await teo.evaluate(
      () => document.querySelector("#deviceAuthorizationDialog").open,
    ),
    true,
  );

  const anna = await teo.evaluate(() =>
    [
      ...document.querySelectorAll(
        '[data-device-authorization-officer="anna"] li strong',
      ),
    ].map((element) => element.textContent.trim()),
  );
  assert.equal(anna.join(","), "Prüfwerk Alpha");
  const ohne = await teo.evaluate(() =>
    [...document.querySelectorAll("[data-device-authorization-missing]")].map(
      (element) => element.dataset.deviceAuthorizationMissing,
    ),
  );
  assert.equal(ohne.join(","), "beta");

  await teo.evaluate(() =>
    document
      .querySelector('[data-device-authorization-grouping="device"]')
      .click(),
  );
  const jeGerät = await teo.evaluate(() =>
    [...document.querySelectorAll("[data-device-authorization-device]")].map(
      (element) =>
        `${element.dataset.deviceAuthorizationDevice}:${[
          ...element.querySelectorAll(".device-authorization-person"),
        ]
          .map((person) => person.textContent.trim())
          .join("+")}`,
    ),
  );
  // Die Namensform ist einstellbar, deshalb nur der Vorname.
  assert.equal(jeGerät.length, 2);
  assert.match(jeGerät[0], /^alpha:[^+]*Anna[^+]*$/);
  assert.equal(jeGerät[1], "beta:");

  await teo.evaluate(() =>
    document.querySelector("#deviceAuthorizationInventoryFilter").click(),
  );
  const mitAusgemustert = await teo.evaluate(() =>
    [...document.querySelectorAll("[data-device-authorization-device]")].map(
      (element) => element.dataset.deviceAuthorizationDevice,
    ),
  );
  assert.equal(mitAusgemustert.join(","), "alpha,beta,gamma");
});
