import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Baut einen Bestand, wie er über Jahre entsteht: viele Geräte, viele
// Mitarbeiter und für jedes Paar eine Einweisung.
function createInstructionState(deviceCount, employeeCount, instructedPairs = 0) {
  const employees = Array.from({ length: employeeCount }, (_, index) =>
    createEmployee(`employee-${index}`),
  );
  const devices = Array.from({ length: deviceCount }, (_, index) => ({
    id: `device-${index}`,
    productName: `Gerät ${String(index).padStart(3, "0")}`,
    manufacturer: "Hersteller",
    category: "Beatmung",
    annex1: true,
    currentInventory: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
  // Ohne Angabe bekommt jedes Paar seine Einweisung. Mit Angabe nur die
  // ersten n Geräte und Mitarbeiter - dann bleibt der Bestand gleich groß,
  // während die Matrix wächst.
  const eingewiesen = instructedPairs
    ? { devices: devices.slice(0, instructedPairs), employees: employees.slice(0, instructedPairs) }
    : { devices, employees };
  const deviceInstructions = eingewiesen.devices.flatMap((device, deviceIndex) =>
    eingewiesen.employees.map((employee, employeeIndex) => ({
      id: `instruction-${deviceIndex}-${employeeIndex}`,
      deviceId: device.id,
      date: "2026-02-01",
      instructorId: "",
      externalInstructor: "Hersteller",
      participants: [{ employeeId: employee.id }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })),
  );
  return createMinimalState({ employees, devices, deviceInstructions });
}

test("Der Index findet die Einweisung eines Paares in einem Griff", async () => {
  const app = await loadAppFunctions(["deviceInstructionIndex"], { withDom: true });
  app.setState(createInstructionState(3, 4));

  const index = app.deviceInstructionIndex();
  assert.equal(
    index.byPair.get("device-1|employee-2").length,
    1,
    "Zu jedem Paar steht die Einweisung bereit",
  );
  assert.equal(index.byPair.get("device-1|employee-99"), undefined);
  assert.equal(
    index.byDevice.get("device-0").size,
    4,
    "Und je Gerät die Menge der eingewiesenen Mitarbeiter",
  );

  // Der Index wird zwischengespeichert: Ohne Änderung am Bestand entsteht er
  // nicht noch einmal.
  assert.equal(app.deviceInstructionIndex(), index, "Unverändert bleibt er derselbe");

  app.getState().deviceInstructions = [...app.getState().deviceInstructions];
  assert.notEqual(
    app.deviceInstructionIndex(),
    index,
    "Nach einer Änderung entsteht er neu",
  );
});

test("Die Matrix durchläuft den Bestand einmal, nicht je Zelle", async () => {
  const app = await loadAppFunctions(["renderDeviceInstructionMatrix"], {
    withDom: true,
  });

  // Gezählt statt gestoppt: Eine Zeitmessung streut auf einem geteilten
  // Rechner um ein Vielfaches und sagt am Ende mehr über die Auslastung als
  // über den Aufbau. Die Frage lässt sich genauer stellen - wie viele
  // Einweisungen liest die Anwendung beim Aufbau überhaupt? Der Index
  // durchläuft sie einmal, unabhängig von der Größe der Matrix. Ohne ihn
  // durchsucht sie jede Zelle von vorn.
  //
  // Der Bestand an Einweisungen bleibt dabei gleich; nur die Matrix wächst.
  const zaehleGelesen = (deviceCount, employeeCount) => {
    const state = createInstructionState(deviceCount, employeeCount, 5);
    let gelesen = 0;
    state.deviceInstructions = new Proxy(state.deviceInstructions, {
      get(ziel, schluessel) {
        if (typeof schluessel === "string" && /^\d+$/.test(schluessel)) {
          gelesen += 1;
        }
        return ziel[schluessel];
      },
    });
    app.setState(state);
    app.renderDeviceInstructionMatrix();
    return gelesen;
  };

  const klein = zaehleGelesen(5, 6);
  const gross = zaehleGelesen(20, 24);

  // Sechzehnmal so viele Zellen, derselbe Bestand: Der Aufwand bleibt gleich.
  assert.equal(
    gross,
    klein,
    `Sechzehnfache Zellzahl las ${gross} statt ${klein} Einweisungen - der Aufbau durchsucht den Bestand offenbar mehrfach`,
  );
  // Und ein Durchgang genügt: 25 Einweisungen, 25 gelesene Einträge.
  assert.equal(gross, 25, `Ein Durchgang wären 25 Einträge, gelesen wurden ${gross}`);
});

test("Das Einweisungsprotokoll kommt seitenweise", async () => {
  const app = await loadAppFunctions(
    [
      "renderDeviceInstructionList",
      "handleDeviceInstructionListAction",
      "DEVICE_INSTRUCTION_LOG_PAGE",
    ],
    { withDom: true },
  );
  app.setState(createInstructionState(30, 5));
  const gesamt = app.getState().deviceInstructions.length;
  const seite = app.DEVICE_INSTRUCTION_LOG_PAGE;
  assert.ok(seite < gesamt, "Der Bestand ist größer als eine Seite");

  const zeilen = () => {
    app.renderDeviceInstructionList();
    const markup = app.dom.markupText("#deviceInstructionList");
    return {
      eintraege: (markup.match(/data-edit-device-instruction=/g) || []).length,
      mehr: markup.includes("data-show-more-device-instructions"),
    };
  };

  const erste = zeilen();
  assert.equal(erste.eintraege, seite, `Es kommt eine Seite mit ${seite} Einträgen`);
  assert.equal(erste.mehr, true, "Und ein Weg zu den übrigen");

  // Nachgeladen wird über dieselbe Schaltfläche, die im Protokoll steht.
  const mehrSchalter = new app.HTMLElement({
    tagName: "BUTTON",
    attributes: { "data-show-more-device-instructions": "" },
  });
  app.handleDeviceInstructionListAction({ target: mehrSchalter });
  const zweite = zeilen();
  assert.equal(zweite.eintraege, seite * 2, "Der Weg holt die nächste Seite");
});
