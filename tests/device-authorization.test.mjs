import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const indexUrl = new URL("../index.html", import.meta.url);
const deviceSourceUrl = new URL(
  "../src/app/60-appointments-devices.js",
  import.meta.url,
);

test("Die Statusbestätigung zeigt ihre Meldung direkt im Formular", async () => {
  const [indexHtml, deviceSource] = await Promise.all([
    readFile(indexUrl, "utf8"),
    readFile(deviceSourceUrl, "utf8"),
  ]);

  assert.match(
    indexHtml,
    /id="employeeInstructorMpoConfirmationError"[^>]*role="alert"/s,
  );
  assert.doesNotMatch(
    deviceSource,
    /employeeInstructorMpoConfirmation\.required\s*=/,
  );
  assert.match(
    deviceSource,
    /employeeInstructorMpoConfirmationError\.textContent\s*=[\s\S]*Bitte bestätigen Sie den Status zum Einweisungszeitpunkt\./,
  );
  assert.match(deviceSource, /scrollIntoView\(\{ block: "center", behavior: "smooth" \}\)/);
  assert.match(deviceSource, /employeeInstructorMpoConfirmation\.focus\(\{ preventScroll: true \}\)/);
});

test("Einweisungsberechtigung folgt der Herstellereinweisung und dem damaligen Status", async () => {
  const app = await loadAppFunctions([
    "getDeviceAuthorizedEmployees",
    "filteredDevices",
  ]);
  const authorized = createEmployee("employee-authorized");
  const other = {
    ...createEmployee("employee-other"),
    firstName: "Andere",
  };
  const devices = [
    {
      id: "device-qualified",
      manufacturer: "Hersteller A",
      productName: "Gerät A",
      category: "Monitoring",
      currentInventory: true,
      annex1: false,
    },
    {
      id: "device-without-qualified",
      manufacturer: "Hersteller B",
      productName: "Gerät B",
      category: "Monitoring",
      currentInventory: true,
      annex1: false,
    },
  ];
  app.setState(
    createMinimalState({
      employees: [authorized, other],
      devices,
      deviceInstructions: [
        {
          id: "manufacturer-instruction",
          deviceId: devices[0].id,
          date: "2025-03-01",
          instructorType: "manufacturer",
          instructorName: "Hersteller",
          participants: [
            {
              employeeId: authorized.id,
              wasMedicalProductsOfficer: true,
            },
            {
              employeeId: other.id,
              wasMedicalProductsOfficer: false,
            },
          ],
        },
        {
          id: "internal-instruction",
          deviceId: devices[1].id,
          date: "2025-04-01",
          instructorType: "employee",
          instructorEmployeeId: authorized.id,
          instructorName: "Test Person",
          participants: [
            {
              employeeId: other.id,
              wasMedicalProductsOfficer: true,
            },
          ],
        },
      ],
    }),
  );
  const plain = (value) => JSON.parse(JSON.stringify(value));

  assert.deepEqual(
    plain(
      app
        .getDeviceAuthorizedEmployees(devices[0].id)
        .map((employee) => employee.id),
    ),
    [authorized.id],
  );
  assert.deepEqual(
    plain(
      app
        .filteredDevices({
          inventoryFilter: "all",
          authorizationFilter: "assigned",
        })
        .map((device) => device.id),
    ),
    [devices[0].id],
  );
  assert.deepEqual(
    plain(
      app
        .filteredDevices({
          inventoryFilter: "all",
          authorizationFilter: "unassigned",
        })
        .map((device) => device.id),
    ),
    [devices[1].id],
  );
  assert.deepEqual(
    plain(
      app.filteredDevices({
        inventoryFilter: "all",
        authorizationFilter: `employee:${other.id}`,
      }),
    ),
    [],
  );
});

test("Mitarbeiter der Geräteeinweisung sind nach Nachname und Vorname sortiert", async () => {
  const app = await loadAppFunctions([
    "deviceInstructionEmployeeOptionLabel",
    "filteredDeviceParticipants",
  ]);
  const employees = [
    { ...createEmployee("zimmer"), firstName: "Berta", lastName: "Zimmer" },
    { ...createEmployee("adler-zoe"), firstName: "Zoe", lastName: "Adler" },
    { ...createEmployee("adler-anna"), firstName: "Anna", lastName: "Adler" },
  ];
  app.setState(createMinimalState({ employees }));

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.filteredDeviceParticipants().map((employee) => employee.id),
      ),
    ),
    ["adler-anna", "adler-zoe", "zimmer"],
  );
  assert.equal(
    app.deviceInstructionEmployeeOptionLabel(employees[0]),
    "Zimmer, Berta",
    "Der sichtbare Optionswert muss mit dem Nachnamen beginnen, damit die native Tastatursuche danach springt.",
  );
});

test("Erfasste Einweisungen sind filterbar und standardmäßig nach Eingabe sortiert", async () => {
  const app = await loadAppFunctions(["filteredDeviceInstructions"]);
  const anna = { ...createEmployee("anna"), firstName: "Anna", lastName: "Adler" };
  const berta = { ...createEmployee("berta"), firstName: "Berta", lastName: "Berg" };
  app.setState(
    createMinimalState({
      employees: [anna, berta],
      devices: [
        {
          id: "monitor",
          manufacturer: "Hersteller Nord",
          productName: "Monitor Alpha",
          category: "Monitoring",
          currentInventory: true,
          annex1: false,
        },
      ],
      deviceInstructions: [
        {
          id: "older-entry",
          deviceId: "monitor",
          date: "2026-05-20",
          createdAt: "2026-06-01T08:00:00.000Z",
          instructorType: "manufacturer",
          instructorName: "Externe Person",
          participants: [{ employeeId: anna.id, wasMedicalProductsOfficer: false }],
        },
        {
          id: "newer-entry",
          deviceId: "monitor",
          date: "2026-04-10",
          createdAt: "2026-07-01T08:00:00.000Z",
          instructorType: "employee",
          instructorName: "Interne Person",
          participants: [{ employeeId: berta.id, wasMedicalProductsOfficer: false }],
        },
      ],
    }),
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(app.filteredDeviceInstructions().map(({ id }) => id))),
    ["newer-entry", "older-entry"],
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.filteredDeviceInstructions({ searchTerm: "adler" }).map(({ id }) => id),
      ),
    ),
    ["older-entry"],
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.filteredDeviceInstructions({ searchTerm: "hersteller nord" }).map(
          ({ id }) => id,
        ),
      ),
    ),
    ["newer-entry", "older-entry"],
  );
});

test("Die Einweisungsliste ist auf zehn sichtbare Einträge begrenzt", async () => {
  const [indexHtml, deviceSource, styles] = await Promise.all([
    readFile(indexUrl, "utf8"),
    readFile(deviceSourceUrl, "utf8"),
    readFile(new URL("../src/styles/00-core.css", import.meta.url), "utf8"),
  ]);

  assert.match(indexHtml, /id="deviceInstructionSearch"[^>]*type="search"/s);
  assert.match(deviceSource, /VISIBLE_DEVICE_INSTRUCTION_ROWS - 1/);
  assert.match(
    styles,
    /\.device-instruction-log\s*\{[^}]*position: relative;[^}]*overflow-y: auto;/s,
  );
});

test("Mitarbeiterübersicht führt alle Geräte mit und ohne Einweisung auf", async () => {
  const app = await loadAppFunctions(["getEmployeeDeviceOverview"]);
  const employee = createEmployee("employee-overview");
  const devices = [
    {
      id: "device-zulu",
      manufacturer: "Hersteller Z",
      productName: "Zulu",
      category: "Beatmung",
      currentInventory: false,
      annex1: false,
    },
    {
      id: "device-alpha",
      manufacturer: "Hersteller A",
      productName: "Alpha",
      category: "Monitoring",
      currentInventory: true,
      annex1: false,
    },
  ];
  app.setState(
    createMinimalState({
      employees: [employee],
      devices,
      deviceInstructions: [
        {
          id: "older-instruction",
          deviceId: "device-zulu",
          date: "2025-03-01",
          createdAt: "2025-03-01T10:00:00.000Z",
          instructorType: "manufacturer",
          instructorName: "Hersteller Z",
          participants: [{ employeeId: employee.id, wasMedicalProductsOfficer: false }],
        },
        {
          id: "latest-instruction",
          deviceId: "device-zulu",
          date: "2026-04-15",
          createdAt: "2026-04-15T10:00:00.000Z",
          instructorType: "employee",
          instructorName: "Max Mustermann",
          participants: [{ employeeId: employee.id, wasMedicalProductsOfficer: false }],
        },
      ],
    }),
  );

  const overview = JSON.parse(
    JSON.stringify(app.getEmployeeDeviceOverview(employee.id)),
  );

  assert.deepEqual(
    overview.map(({ device, isInstructed }) => ({
      deviceId: device.id,
      isInstructed,
    })),
    [
      { deviceId: "device-alpha", isInstructed: false },
      { deviceId: "device-zulu", isInstructed: true },
    ],
    "Auch Geräte außerhalb des aktuellen Bestands müssen erscheinen.",
  );
  assert.equal(overview[1].instructions.length, 2);
  assert.equal(overview[1].latestInstruction.id, "latest-instruction");
});
