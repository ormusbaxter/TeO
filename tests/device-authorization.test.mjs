import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

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
