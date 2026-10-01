import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

function person(id, lastName, firstName, overrides = {}) {
  return { ...createEmployee(id), lastName, firstName, ...overrides };
}

// Je ein Vertreter jeder Gruppe, absichtlich nicht in Gruppenreihenfolge und
// mit Nachnamen, die alphabetisch anders liefen.
const TEAM = [
  person("sa", "Adler", "Sina", { profession: "Stationsassistenz" }),
  person("mfa", "Becker", "Mia", { profession: "Medizinische/r Fachangestellte/r" }),
  person("pfa", "Clausen", "Ida", { profession: "Pflegefachassistenz" }),
  person("ita", "Ismer", "Tom", { profession: "Intensivtechnische/r Assistent/in" }),
  person("ita2", "Albrecht", "Jan", { profession: "ITA" }),
  person("ein", "Dorn", "Eva", { employmentStatus: "onboarding" }),
  person("pfk2", "Zander", "Paul"),
  person("pfk1", "Engel", "Pia"),
  person("fwb", "Fuchs", "Finn", { qualifications: { fachweiterbildungIA: true } }),
  person("stv", "Graf", "Sven", {
    qualifications: { stellvertretendeStationsleitung: true },
  }),
  person("sl", "Huber", "Lea", { qualifications: { stationsleitung: true } }),
  person("ohne", "Albers", "Anton", { profession: "Praktikant/in" }),
];

async function planung(order) {
  const app = await loadAppFunctions(
    ["renderVacationPlanner", "normalizeState", "compareEmployeesByVacationSortGroup"],
    { withDom: true },
  );
  const state = createMinimalState({ employees: TEAM });
  if (order) state.settings = { ...state.settings, vacationSortGroupOrder: order };
  app.setState(app.normalizeState(state));
  app.setVacationPeriod(2026, 6);
  return app;
}

function reihenfolge(app) {
  return [...app.getState().employees]
    .sort(app.compareEmployeesByVacationSortGroup)
    .map((employee) => employee.id)
    .join(",");
}

test("Nach Qualifikation: Gruppen in der Vorgabe, darin nach Nachname", async () => {
  const app = await planung();
  assert.equal(reihenfolge(app), "sl,stv,fwb,pfk1,pfk2,ein,ita2,ita,pfa,mfa,sa,ohne");
});

test("Eine umgestellte Reihenfolge aus den Einstellungen wirkt", async () => {
  const app = await planung(["mfa", "stationsleitung"]);
  // Fehlende Gruppen haengen sich in der Vorgabereihenfolge an.
  assert.equal(
    app.getState().settings.vacationSortGroupOrder.join(","),
    "mfa,stationsleitung,stellvertretendeStationsleitung,fachweiterbildung,pflegefachkraft,onboarding,ita,pflegefachassistenz,stationsassistenz",
  );
  assert.equal(reihenfolge(app), "mfa,sl,stv,fwb,pfk1,pfk2,ein,ita2,ita,pfa,sa,ohne");
});

test("Unbekannte und doppelte Gruppen werden verworfen", async () => {
  const app = await planung(["ita", "gibtsnicht", "ita", 7]);
  assert.equal(app.getState().settings.vacationSortGroupOrder[0], "ita");
  assert.equal(app.getState().settings.vacationSortGroupOrder.length, 9);
});

test("Die Planungstabelle zeigt Nachname, Vorname", async () => {
  const app = await planung();
  app.renderVacationPlanner();
  const html = app.dom.document.querySelector("#vacationPlanner").innerHTML;
  assert.match(html, />Huber, Lea<\/button>/);
  assert.doesNotMatch(html, />Lea Huber<\/button>/);
});
