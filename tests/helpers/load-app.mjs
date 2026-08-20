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
      // Ohne Browser gibt es keinen Speicher. Wer eine Aenderung samt
      // Speichern und Ruecklauf pruefen will, legt hier einen hin.
      setDataStore(value) { dataStore = value; },
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
    // Die Anwendung loest Ereignisse wie eine Bedienung von Hand aus - etwa
    // beim Entfernen eines Filter-Chips oder bei der Schnelleingabe im
    // Datumsfeld. Ohne Browser genuegt dafuer ein Ersatz, der Art und
    // Blasenverhalten mitfuehrt.
    Event:
      globalThis.Event ||
      class Event {
        constructor(type, options = {}) {
          this.type = type;
          this.bubbles = Boolean(options.bubbles);
        }
      },
    atob: globalThis.atob,
    btoa: globalThis.btoa,
    // Die Anwendung fragt an mehreren Stellen `target instanceof HTMLElement`,
    // bevor sie eine Taste oder einen Klick deutet. Ohne diese Kennung im
    // Kontext liefe jede solche Pruefung in einen ReferenceError.
    HTMLElement: StubHtmlElement,
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
    localStorage: createStorageStub(),
    navigator: {},
    sessionStorage: createStorageStub(),
    // Kein Ausbreiten: Sonst waere dom.window eine Kopie, und was ein Test
    // nachtraeglich daran setzt - etwa getSelection - kaeme in der Anwendung
    // nie an.
    window: Object.assign(dom ? dom.window : {}, {
      TeOProjectMeta: PROJECT_META,
      TeOStateSchema: { validateStateShape },
      crypto: globalThis.crypto,
    }),
  };
  context.globalThis = context;
  context.window.window = context.window;
  vm.createContext(context);
  new vm.Script(instrumented, { filename: "app.js" }).runInContext(context);
  return dom
    ? { ...context.__teoTest, dom, HTMLElement: StubHtmlElement }
    : { ...context.__teoTest, HTMLElement: StubHtmlElement };
}

// Der Browserspeicher, so weit die Anwendung ihn benutzt. Zuvor stand dort
// ein leeres Objekt: Jeder Zugriff warf, die Anwendung fing es ab und schrieb
// eine Warnung - gemerkte Einstellungen liessen sich so nicht pruefen.
function createStorageStub() {
  const entries = new Map();
  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  };
}

// Eine Klassenliste, die sich merkt, was in ihr steht. Der frühere Ersatz
// nahm alles an und antwortete auf contains() immer mit false - jede Prüfung
// „ist diese Klasse gesetzt?“ ging damit ins Leere, ohne dass ein Test es
// bemerkte.
function createClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add(...names) {
      for (const name of names) classes.add(name);
    },
    remove(...names) {
      for (const name of names) classes.delete(name);
    },
    toggle(name, force) {
      const next = force === undefined ? !classes.has(name) : Boolean(force);
      if (next) classes.add(name);
      else classes.delete(name);
      return next;
    },
    contains: (name) => classes.has(name),
    get value() {
      return [...classes].join(" ");
    },
  };
}

// Aus data-vacation-employee wird vacationEmployee - dieselbe Umsetzung, die
// der Browser fuer dataset vornimmt.
function datasetKey(attributeName) {
  return attributeName
    .replace(/^data-/, "")
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Genug Selektorverstaendnis fuer das, was die Anwendung tatsaechlich fragt:
// Elementname, Klassen und Attribute mit oder ohne Wert, beliebig kombiniert
// - etwa [data-vacation-employee][data-vacation-date] oder dialog[open].
function matchesSelector(element, selector) {
  const parts = selector.trim().match(/^([a-zA-Z][\w-]*)?((?:[.#[][^.#[]*)*)$/);
  if (!parts) return false;
  const [, tagName, rest = ""] = parts;
  if (tagName && element.tagName !== tagName.toUpperCase()) return false;
  for (const token of rest.match(/[.#[][^.#[]*/g) || []) {
    if (token.startsWith(".")) {
      if (!element.classList.contains(token.slice(1))) return false;
      continue;
    }
    if (token.startsWith("#")) {
      if (element.id !== token.slice(1)) return false;
      continue;
    }
    const attribute = token.slice(1, -1).match(/^([^=\]]+)(?:="?([^"\]]*)"?)?$/);
    if (!attribute) return false;
    const [, name, expected] = attribute;
    const value = element.getAttribute(name);
    if (value === null || value === undefined) return false;
    if (expected !== undefined && String(value) !== expected) return false;
  }
  return true;
}

// Ein Element, wie die Anwendung es anfasst: mit Klassen, Attributen, dataset
// und einer Abstammung fuer closest(). Tests bauen sich damit den Ausschnitt
// der Oberflaeche, um den es ihnen geht.
export class StubHtmlElement {
  constructor({
    tagName = "DIV",
    id = "",
    attributes = {},
    dataset = {},
    classes = [],
    isContentEditable = false,
    parentElement = null,
    value = "",
  } = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.dataset = { ...dataset };
    this.ownAttributes = { ...attributes };
    this.isContentEditable = isContentEditable;
    this.parentElement = parentElement;
    this.classList = createClassList(classes);
    this.value = value;
    this.hidden = false;
    this.disabled = false;
    this.textContent = "";
  }

  getAttribute(name) {
    if (name in this.ownAttributes) return this.ownAttributes[name];
    const key = datasetKey(name);
    return key in this.dataset ? this.dataset[key] : null;
  }

  hasAttribute(name) {
    return this.getAttribute(name) !== null;
  }

  setAttribute(name, value) {
    this.ownAttributes[name] = String(value);
  }

  toggleAttribute(name, force) {
    const next = force === undefined ? !this.hasAttribute(name) : Boolean(force);
    if (next) this.ownAttributes[name] = "";
    else delete this.ownAttributes[name];
    return next;
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches?.(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  querySelectorAll() {
    return [];
  }

  querySelector() {
    return null;
  }

  focus() {}

  select() {}
}

// Eine Bedienoberflaeche laesst sich ohne Browser nicht nachbauen, wohl aber
// die Frage, welche Ansicht ueberhaupt aufgebaut wurde. Der Ersatz merkt sich
// dazu je Kennung, wie viel Markup hineingeschrieben wurde.
function createDomStub() {
  const markup = new Map();
  const elements = new Map();
  // Listenabfragen liefern ohne Zutun nichts. Wer eine Funktion prueft, die
  // ueber eine Auswahl laeuft, hinterlegt sie hier mit setQueryAll().
  const queryAllResults = new Map();

  const createElement = (selector = "") => {
    const listeners = new Map();
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
      classList: createClassList(),
      // Gebundene Behandlungen werden gemerkt, damit ein Test sie ausloesen
      // kann. Zuvor verschluckte der Ersatz jede Bindung - alles, was in
      // einem Ereignis steckt, blieb dadurch ungeprueft.
      addEventListener(type, handler) {
        if (typeof handler !== "function") return;
        const forType = listeners.get(type) || [];
        forType.push(handler);
        listeners.set(type, forType);
      },
      removeEventListener(type, handler) {
        const forType = listeners.get(type) || [];
        const position = forType.indexOf(handler);
        if (position >= 0) forType.splice(position, 1);
      },
      dispatch(type, event = {}) {
        for (const handler of [...(listeners.get(type) || [])]) handler(event);
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
          markup.set(selector, String(value));
        }
        object[property] = value;
        return true;
      },
    });
  };

  // Hinterlegte Antworten gehen vor. Nur so laesst sich pruefen, was
  // geschieht, wenn ein Element *nicht* da ist - etwa kein offener Dialog.
  const queryResults = new Map();
  let elementAtPoint = () => null;
  const querySelector = (selector) => {
    if (queryResults.has(selector)) return queryResults.get(selector);
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
      querySelectorAll: (selector) => queryAllResults.get(selector) || [],
      getElementById: (id) => querySelector(`#${id}`),
      createElement: () => createElement(),
      createDocumentFragment: () => createElement(),
      // Beim Ziehen fragt die Anwendung, was unter dem Zeiger liegt. Ohne
      // Bildschirm beantwortet das ein hinterlegter Handgriff.
      elementFromPoint: (x, y) => elementAtPoint(x, y),
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
      return (markup.get(selector) || "").length;
    },
    // Das zuletzt hineingeschriebene Markup. Ob eine Ansicht ueberhaupt
    // aufgebaut wurde, beantwortet markupLength; was in ihr steht, dies hier.
    markupText(selector) {
      return markup.get(selector) || "";
    },
    setQueryAll(selector, found) {
      queryAllResults.set(selector, found);
    },
    setQuery(selector, found) {
      queryResults.set(selector, found);
    },
    setElementFromPoint(handler) {
      elementAtPoint = handler;
    },
    // Loest ein Ereignis an dem Element aus, das unter diesem Selektor
    // gefuehrt wird - der Weg zu allem, was in einer Bindung steckt.
    dispatch(selector, type, event = {}) {
      querySelector(selector).dispatch(type, event);
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
