import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { PROJECT_META } from "../../src/meta/project-meta.mjs";
import { validateStateShape } from "../../src/shared/state-schema.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export async function loadAppFunctions(names) {
  const source = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");
  const exposed = names.join(", ");
  const instrumented = source.replace(
    "initialize().catch(handleInitializationError);",
    `globalThis.__teoTest = {
      ${exposed},
      setState(value) { state = value; },
      getState() { return state; },
      setEmployeeFilters(value = {}) {
        employeeStatusFilter = value.status || "all";
        employeeProfessionFilter = value.profession || "all";
        employeeQualificationFilter = value.qualification || "all";
        employeeWeekendFilter = value.weekend || "all";
        employeeSearchTerm = value.search || "";
      }
    };`,
  );
  if (instrumented === source) {
    throw new Error("Der Testeinsprung konnte in app.js nicht gefunden werden.");
  }

  const emptyElement = () => null;
  const context = {
    console,
    crypto: globalThis.crypto,
    Blob: globalThis.Blob || class Blob {},
    Date,
    Intl,
    TextDecoder,
    TextEncoder,
    URL,
    clearTimeout,
    setTimeout,
    document: {
      querySelector: emptyElement,
      querySelectorAll: () => [],
    },
    localStorage: {},
    navigator: {},
    sessionStorage: {},
    window: {
      TeOProjectMeta: PROJECT_META,
      TeOStateSchema: { validateStateShape },
    },
  };
  context.globalThis = context;
  context.window.window = context.window;
  vm.createContext(context);
  new vm.Script(instrumented, { filename: "app.js" }).runInContext(context);
  return context.__teoTest;
}

export function createMinimalState(overrides = {}) {
  return {
    version: PROJECT_META.stateVersion,
    employees: [],
    trainings: [],
    completions: [],
    meetings: [],
    meetingAttendances: [],
    appointments: [],
    devices: [],
    deviceInstructions: [],
    vacationEntitlements: [],
    vacationDays: [],
    settings: {
      theme: "standard",
      deadlineKinds: ["training"],
      serviceWeekends: {
        weekend_a: { name: "Wochenende A", ownerId: "" },
        weekend_b: { name: "Wochenende B", ownerId: "" },
      },
    },
    users: [],
    auditLog: [],
    catalogs: {
      professions: ["Pflegefachkraft"],
      qualifications: [],
    },
    ...overrides,
  };
}

export function createEmployee(id = "employee-test") {
  return {
    id,
    firstName: "Test",
    lastName: "Person",
    username: "Demo999",
    birthDate: "1990-01-01",
    phone: "+49 000 1000 0999",
    email: "test.person@example.invalid",
    employmentPercent: 100,
    profession: "Pflegefachkraft",
    serviceWeekend: "none",
    active: true,
    employmentStatus: "active",
    qualifications: {},
    qualificationExpiries: {},
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
