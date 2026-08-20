import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

// Baut einen Bestand, wie er über Jahre entsteht: viele Geräte, viele
// Mitarbeiter und für jedes Paar eine Einweisung.
function createInstructionState(deviceCount, employeeCount) {
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
  const deviceInstructions = devices.flatMap((device, deviceIndex) =>
    employees.map((employee, employeeIndex) => ({
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

test("Die Matrix wächst nicht quadratisch mit dem Bestand", async () => {
  const app = await loadAppFunctions(["renderDeviceInstructionMatrix"], {
    withDom: true,
  });

  const messe = (deviceCount, employeeCount) => {
    app.setState(createInstructionState(deviceCount, employeeCount));
    // Ein Durchlauf zum Aufwärmen, damit nicht die erste Übersetzung gemessen
    // wird.
    app.renderDeviceInstructionMatrix();
    const start = process.hrtime.bigint();
    app.renderDeviceInstructionMatrix();
    return Number(process.hrtime.bigint() - start) / 1e6;
  };

  const klein = messe(10, 20);
  const gross = messe(40, 80);

  // Sechzehnfache Zellzahl. Mit dem Index kostet das ungefähr das Sechsfache
  // - der feste Aufwand für das Markup überwiegt bei der kleinen Messung.
  // Fragte jede Zelle wieder den ganzen Bestand ab, wären es rund das
  // Siebzigfache; gemessen wurden 4,8 -> 27,7 ms mit Index und 3,4 -> 237,8 ms
  // ohne. Die Grenze liegt weit zwischen beiden, damit die Prüfung nicht an
  // der Tagesform des Rechners hängt und den Rückfall trotzdem sicher fängt.
  const verhaeltnis = gross / Math.max(klein, 0.05);
  assert.ok(
    verhaeltnis < 20,
    `Sechzehnfache Zellzahl kostete das ${verhaeltnis.toFixed(1)}-fache (${klein.toFixed(1)} ms -> ${gross.toFixed(1)} ms)`,
  );
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
