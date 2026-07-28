import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

test("Der E-Mail-Export verwendet alle aktuellen Mitarbeiterfilter", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getFilteredEmployeeEmailExport",
  ]);
  const anna = {
    ...createEmployee("employee-anna"),
    firstName: "Anna",
    lastName: "Aktiv",
    username: "Anna001",
    email: "anna@example.invalid",
  };
  const bert = {
    ...createEmployee("employee-bert"),
    firstName: "Bert",
    lastName: "Inaktiv",
    username: "Bert001",
    email: "bert@example.invalid",
    active: false,
    employmentStatus: "inactive",
  };
  const clara = {
    ...createEmployee("employee-clara"),
    firstName: "Clara",
    lastName: "Ärztin",
    username: "Clara001",
    profession: "Arzt/Ärztin",
    email: "clara@example.invalid",
  };
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [anna, bert, clara],
        catalogs: {
          professions: ["Pflegefachkraft", "Arzt/Ärztin"],
          qualifications: [],
        },
      }),
    ),
  );

  app.setEmployeeFilters({
    status: "active",
    profession: "Pflegefachkraft",
    search: "anna",
  });

  assert.equal(
    app.getFilteredEmployeeEmailExport(),
    "anna@example.invalid",
  );
});

test("Der Benutzernamen-Export folgt denselben Filtern wie der E-Mail-Export", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getFilteredEmployeeUsernames",
  ]);
  const anna = {
    ...createEmployee("employee-anna"),
    firstName: "Anna",
    lastName: "Aktiv",
    username: "Anna001",
  };
  const bert = {
    ...createEmployee("employee-bert"),
    firstName: "Bert",
    lastName: "Inaktiv",
    username: "Bert001",
    active: false,
    employmentStatus: "inactive",
  };
  const clara = {
    ...createEmployee("employee-clara"),
    firstName: "Clara",
    lastName: "Ohnekonto",
    username: "",
  };
  app.setState(
    app.normalizeState(createMinimalState({ employees: [anna, bert, clara] })),
  );

  // Ohne Filter: alle mit hinterlegtem Benutzernamen, auch inaktive
  app.setEmployeeFilters({});
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.getFilteredEmployeeUsernames())),
    ["Anna001", "Bert001"],
    "Mitarbeiter ohne Benutzernamen dürfen nicht erscheinen",
  );

  app.setEmployeeFilters({ status: "active" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.getFilteredEmployeeUsernames())),
    ["Anna001"],
    "Der Statusfilter muss wirken",
  );

  app.setEmployeeFilters({ search: "bert" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.getFilteredEmployeeUsernames())),
    ["Bert001"],
    "Die Suche muss wirken",
  );
});

test("Der Mitarbeiterfilter findet Personen ohne Qualifikation", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getFilteredEmployeeEmailExport",
  ]);
  const withoutQualification = {
    ...createEmployee("employee-without-qualification"),
    firstName: "Ohne",
    lastName: "Qualifikation",
    email: "ohne@example.invalid",
  };
  const withQualification = {
    ...createEmployee("employee-with-qualification"),
    firstName: "Mit",
    lastName: "Qualifikation",
    email: "mit@example.invalid",
    qualifications: { praxisanleiter: true },
  };
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [withQualification, withoutQualification],
        catalogs: {
          professions: ["Pflegefachkraft"],
          qualifications: [
            { id: "praxisanleiter", label: "Praxisanleiter" },
          ],
        },
      }),
    ),
  );
  app.setEmployeeFilters({ qualification: "none" });

  assert.equal(app.getFilteredEmployeeEmailExport(), "ohne@example.invalid");
});

test("Die Telefonliste zeigt aktive und einzuarbeitende Mitarbeiter unabhängig von den Filtern", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getFilteredEmployeePhoneListRows",
    "splitPhoneListIntoColumns",
    "buildEmployeePhoneListPrintHtml",
  ]);
  const zora = {
    ...createEmployee("employee-zora"),
    firstName: "Zora",
    lastName: "Abel",
    phone: "",
  };
  const anna = {
    ...createEmployee("employee-anna"),
    firstName: "Anna",
    lastName: "Ziegler",
    phone: "+49 221 123456",
  };
  const inactive = {
    ...createEmployee("employee-inactive"),
    firstName: "Bert",
    lastName: "Inaktiv",
    phone: "0221 999999",
    active: false,
    employmentStatus: "inactive",
  };
  const onboarding = {
    ...createEmployee("employee-onboarding"),
    firstName: "Cara",
    lastName: "Neu",
    phone: "0221 555555",
    employmentStatus: "onboarding",
  };
  app.setState(
    app.normalizeState(
      createMinimalState({
        employees: [anna, inactive, zora, onboarding],
      }),
    ),
  );

  const erwartet = [
    ["Zora Abel", ""],
    ["Cara Neu", "0221 555555"],
    ["Anna Ziegler", "+49 221 123456"],
  ];

  // Ohne Filter: aktive und einzuarbeitende Mitarbeiter, keine inaktiven
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.getFilteredEmployeePhoneListRows())),
    erwartet,
  );

  // Auch ein enger Tabellenfilter darf die Liste nicht verkuerzen
  for (const filter of [
    { status: "active" },
    { status: "inactive" },
    { profession: "Stationsassistenz" },
    { search: "Ziegler" },
  ]) {
    app.setEmployeeFilters(filter);
    assert.deepEqual(
      JSON.parse(JSON.stringify(app.getFilteredEmployeePhoneListRows())),
      erwartet,
      `Filter ${JSON.stringify(filter)} darf die Telefonliste nicht beeinflussen`,
    );
  }

  const sixtyRows = Array.from(
    { length: 60 },
    (_, index) => [`Person ${index + 1}`, `100${index + 1}`],
  );
  const columns = app.splitPhoneListIntoColumns(sixtyRows);
  assert.equal(columns.length, 2);
  assert.deepEqual(
    Array.from(columns, (column) => column.length),
    [30, 30],
  );

  const printHtml = app.buildEmployeePhoneListPrintHtml(sixtyRows);
  assert.match(printHtml, /class="phone-list-document"/);
  assert.match(printHtml, /--phone-columns: 2/);
  assert.match(printHtml, /--phone-font-size: 10pt/);
  assert.match(printHtml, /--phone-cell-padding: 2mm/);
  assert.match(printHtml, /<th>Name<\/th><th>Nummer<\/th>/);
  assert.doesNotMatch(printHtml, /Beruf|Stellenanteil|Status/);
  assert.doesNotMatch(printHtml, /<!doctype|window\.print/);

  const sixtyOneRows = Array.from(
    { length: 61 },
    (_, index) => [`Person ${index + 1}`, `200${index + 1}`],
  );
  assert.match(
    app.buildEmployeePhoneListPrintHtml(sixtyOneRows),
    /--phone-cell-padding: 1\.65mm/,
  );
});
