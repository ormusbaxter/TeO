import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Aufgebaut wird immer nur die sichtbare Ansicht. Diese Zuordnung haelt fest,
// woran sich das je Ansicht ablesen laesst.
const ANSICHTEN = {
  employees: "#employeeTable",
  vacations: "#vacationPlanner",
  devices: "#deviceCatalog",
  trainings: "#trainingList",
  meetings: "#meetingList",
  appointments: "#appointmentList",
  memos: "#memoList",
  weekends: "#weekendDistributionContent",
};

async function anwendungMitDaten() {
  const app = await loadAppFunctions(
    ["renderAll", "showView", "normalizeState"],
    { withDom: true },
  );
  const mitarbeiter = Array.from({ length: 5 }, (_, index) => ({
    ...createEmployee(`employee-${index}`),
    username: `Demo${100 + index}`,
    lastName: `Person${index}`,
  }));
  const zustand = app.normalizeState(
    createMinimalState({
      employees: mitarbeiter,
      devices: [
        {
          id: "device-1",
          manufacturer: "Dräger",
          productName: "V500",
          category: "Beatmungsgerät",
          annex1: true,
          currentInventory: true,
        },
      ],
      trainings: [
        {
          id: "training-1",
          title: "Reanimation",
          year: 2026,
          recurrenceMonths: 12,
        },
      ],
      meetings: [{ id: "meeting-1", title: "Teamsitzung", date: "2026-03-02" }],
      appointments: [
        { id: "appointment-1", title: "Begehung", date: "2026-09-01" },
      ],
      memos: [
        {
          id: "memo-1",
          title: "Materialbestand prüfen",
          visibility: "all",
          createdByUserId: "user-1",
        },
      ],
      vacationDays: mitarbeiter.map((person, index) => ({
        id: `vacation-${index}`,
        employeeId: person.id,
        date: "2026-07-15",
        type: "vacation",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })),
    }),
  );
  app.setState(zustand);
  app.setCurrentUser({ id: "user-1", username: "Pruefer", role: "admin" });
  return app;
}

test("Nur die sichtbare Ansicht wird aufgebaut", async () => {
  const app = await anwendungMitDaten();

  for (const [ansicht, kennung] of Object.entries(ANSICHTEN)) {
    app.dom.resetMarkup();
    app.setActiveView(ansicht);
    app.renderAll();

    assert.ok(
      app.dom.markupLength(kennung) > 0,
      `Die sichtbare Ansicht ${ansicht} muss aufgebaut werden`,
    );
    for (const [andere, andereKennung] of Object.entries(ANSICHTEN)) {
      if (andere === ansicht) continue;
      // Beide Geraeteansichten teilen sich eine Renderfunktion.
      if (ansicht === "devices" && andere === "devices") continue;
      assert.equal(
        app.dom.markupLength(andereKennung),
        0,
        `Die verdeckte Ansicht ${andere} darf beim Aufbau von ${ansicht} nicht mitgerendert werden`,
      );
    }
  }
});

test("Eine verdeckte Ansicht wird beim Wechsel dorthin nachgezogen", async () => {
  const app = await anwendungMitDaten();

  app.setActiveView("vacations");
  app.renderAll();

  app.dom.resetMarkup();
  app.showView("devices", false);
  assert.ok(
    app.dom.markupLength("#deviceCatalog") > 0,
    "Beim Wechsel muss die vorgemerkte Geraeteansicht aufgebaut werden",
  );
  assert.equal(
    app.getActiveView(),
    "devices",
    "showView muss die sichtbare Ansicht mitfuehren",
  );
});

test("Ein zweiter Wechsel ohne Aenderung baut nicht erneut auf", async () => {
  const app = await anwendungMitDaten();

  app.setActiveView("dashboard");
  app.renderAll();
  app.showView("employees", false);

  // Zurueck und wieder hin: ohne zwischenzeitliche Aenderung ist der Inhalt
  // noch gueltig und muss nicht neu entstehen.
  app.showView("dashboard", false);
  app.dom.resetMarkup();
  app.showView("employees", false);
  assert.equal(
    app.dom.markupLength("#employeeTable"),
    0,
    "Ohne Aenderung darf eine bereits aufgebaute Ansicht nicht erneut aufgebaut werden",
  );
});

test("Nach einer Aenderung gilt jede verdeckte Ansicht wieder als veraltet", async () => {
  const app = await anwendungMitDaten();

  app.setActiveView("employees");
  app.renderAll();
  app.showView("devices", false);
  app.showView("employees", false);

  // Eine Aenderung schlaegt sich in renderAll nieder; die Geraeteansicht ist
  // damit veraltet, obwohl sie schon einmal aufgebaut war.
  app.renderAll();
  app.dom.resetMarkup();
  app.showView("devices", false);
  assert.ok(
    app.dom.markupLength("#deviceCatalog") > 0,
    "Nach einer Aenderung muss die Geraeteansicht erneut aufgebaut werden",
  );
});
