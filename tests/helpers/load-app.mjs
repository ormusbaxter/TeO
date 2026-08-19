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

export async function loadAppFunctions(names, { withDom = false } = {}) {
  const source = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");
  const exposed = names.join(", ");
  const instrumented = source.replace(
    "initialize().catch(handleInitializationError);",
    `globalThis.__teoTest = {
      ${exposed},
      setState(value) { state = value; },
      getState() { return state; },
      getStateMutationSequence() { return stateMutationSequence; },
      setCurrentUser(value) { currentUser = value; },
      setActiveView(value) { activeView = value; },
      getActiveView() { return activeView; },
      setAppointmentFilters(value = {}) {
        appointmentSearchTerm = searchKey(value.search || "");
        appointmentPeriodFilter = value.period || "all";
        if (value.year) appointmentCalendarYear = value.year;
        if (value.month) appointmentCalendarMonth = value.month;
      },
      setEmployeeFilters(value = {}) {
        employeeStatusFilter = value.status || "all";
        employeeProfessionFilter = value.profession || "all";
        employeeQualificationFilter = value.qualification || "all";
        employeeWeekendFilter = value.weekend || "all";
        employeeSearchTerm = searchKey(value.search || "");
      }
    };`,
  );
  if (instrumented === source) {
    throw new Error("Der Testeinsprung konnte in app.js nicht gefunden werden.");
  }

  const dom = withDom ? createDomStub() : null;
  const emptyElement = () => null;
  const context = {
    console,
    crypto: globalThis.crypto,
    Blob: globalThis.Blob || class Blob {},
    atob: globalThis.atob,
    btoa: globalThis.btoa,
    Date,
    Intl,
    TextDecoder,
    TextEncoder,
    URL,
    clearTimeout,
    setTimeout,
    document: dom
      ? dom.document
      : {
          querySelector: emptyElement,
          querySelectorAll: () => [],
        },
    localStorage: {},
    navigator: {},
    sessionStorage: {},
    window: {
      TeOProjectMeta: PROJECT_META,
      TeOStateSchema: { validateStateShape },
      crypto: globalThis.crypto,
      ...(dom ? dom.window : {}),
    },
  };
  context.globalThis = context;
  context.window.window = context.window;
  vm.createContext(context);
  new vm.Script(instrumented, { filename: "app.js" }).runInContext(context);
  return dom ? { ...context.__teoTest, dom } : context.__teoTest;
}

// Eine Bedienoberflaeche laesst sich ohne Browser nicht nachbauen, wohl aber
// die Frage, welche Ansicht ueberhaupt aufgebaut wurde. Der Ersatz merkt sich
// dazu je Kennung, wie viel Markup hineingeschrieben wurde.
function createDomStub() {
  const markup = new Map();
  const elements = new Map();

  const createElement = (selector = "") => {
    const target = {
      tagName: "DIV",
      id: selector.replace(/^#/, ""),
      value: "",
      textContent: "",
      innerHTML: "",
      checked: false,
      disabled: false,
      hidden: false,
      open: false,
      max: "",
      min: "",
      children: [],
      options: [],
      files: [],
      style: {},
      dataset: {},
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains: () => false,
      },
    };
    return new Proxy(target, {
      get(object, property) {
        if (property === Symbol.toPrimitive) return () => "";
        if (property === Symbol.iterator) return [][Symbol.iterator].bind([]);
        if (property === "then") return undefined;
        if (property in object) return object[property];
        return (...args) => {
          void args;
          if (property === "querySelectorAll") return [];
          if (property === "getAttribute") return null;
          if (property === "hasAttribute" || property === "matches") {
            return false;
          }
          return createElement();
        };
      },
      set(object, property, value) {
        if (property === "innerHTML" && selector) {
          markup.set(selector, String(value).length);
        }
        object[property] = value;
        return true;
      },
    });
  };

  const querySelector = (selector) => {
    let element = elements.get(selector);
    if (!element) {
      element = createElement(selector);
      elements.set(selector, element);
    }
    return element;
  };

  return {
    document: {
      documentElement: createElement(),
      body: createElement(),
      head: createElement(),
      querySelector,
      querySelectorAll: () => [],
      getElementById: (id) => querySelector(`#${id}`),
      createElement: () => createElement(),
      createDocumentFragment: () => createElement(),
      addEventListener() {},
      removeEventListener() {},
    },
    window: {
      location: { hash: "", href: "http://localhost/" },
      history: { pushState() {} },
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener() {},
      removeEventListener() {},
      scrollTo() {},
      getComputedStyle: () => ({ getPropertyValue: () => "" }),
      setTimeout,
      clearTimeout,
      requestAnimationFrame: (callback) => setTimeout(callback, 0),
    },
    // Wie viel Markup zuletzt in dieses Element geschrieben wurde. Null
    // bedeutet: seit dem Zuruecksetzen wurde es nicht aufgebaut.
    markupLength(selector) {
      return markup.get(selector) || 0;
    },
    resetMarkup() {
      markup.clear();
    },
  };
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
    memos: [],
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
      memoCategories: ["Allgemein", "Aufgabe"],
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
