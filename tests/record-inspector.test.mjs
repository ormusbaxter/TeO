import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TERMIN = {
  id: "appointment-1",
  title: "Hygienebegehung",
  date: "2026-08-21",
  startTime: "09:30",
  endTime: "11:00",
  category: "meeting",
  location: "Raum 2",
  description: "Begehung mit der Hygienefachkraft.",
  pinned: true,
  participantList: true,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-01T08:00:00.000Z",
};

const MEMO = {
  id: "memo-1",
  title: "Dienstplan prüfen",
  description: "",
  date: "2026-08-20",
  category: "Organisation",
  pinned: false,
  completed: false,
  visibility: "private",
  createdByUserId: "user-1",
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-01T08:00:00.000Z",
};

const GERAET = {
  id: "device-1",
  productName: "Perfusor Space",
  manufacturer: "B. Braun",
  category: "Infusion",
  currentInventory: true,
  annex1: true,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-01T08:00:00.000Z",
};

async function anwendung() {
  const app = await loadAppFunctions([
    "normalizeState",
    "recordInspectorDefinitions",
  ]);
  app.setState(
    app.normalizeState(
      createMinimalState({ appointments: [TERMIN], memos: [MEMO], devices: [GERAET] }),
    ),
  );
  return app;
}

test("Jede Datenart beschreibt ihre eigenen Eckdaten", async () => {
  const app = await anwendung();
  app.setCurrentUser({ id: "user-1", username: "Demo", role: "admin" });
  const definitionen = app.recordInspectorDefinitions();

  assert.deepEqual(
    Object.keys(definitionen).sort().join(","),
    "appointment,device,memo",
    "Termine, Memos und Geräte haben eine Schnellansicht",
  );

  const termin = definitionen.appointment;
  const gefunden = termin.find("appointment-1");
  assert.equal(termin.title(gefunden), "Hygienebegehung");
  assert.match(termin.subtitle(gefunden), /^21\.08\.2026 · 09:30/);
  const fakten = Object.fromEntries(termin.facts(gefunden));
  assert.equal(fakten.Ort, "Raum 2");
  assert.equal(fakten.Wichtig, "Angepinnt");
  assert.equal(
    termin.actions(gefunden).map((action) => action.label).join(","),
    "Bearbeiten,Kalender",
  );

  const geraet = definitionen.device;
  const gefundenesGeraet = geraet.find("device-1");
  assert.equal(geraet.title(gefundenesGeraet), "B. Braun Perfusor Space");
  assert.equal(Object.fromEntries(geraet.facts(gefundenesGeraet))["Anlage 1"], "Ja");
  assert.equal(geraet.sections(gefundenesGeraet)[0].title, "Einweisungsberechtigt");
});

test("Die Schnellansicht zeigt kein fremdes persönliches Memo", async () => {
  const app = await anwendung();
  const definitionen = () => app.recordInspectorDefinitions().memo;

  app.setCurrentUser({ id: "user-1", username: "Demo", role: "admin" });
  assert.ok(definitionen().find("memo-1"), "Das eigene Memo ist sichtbar");

  app.setCurrentUser({ id: "user-2", username: "Andere", role: "user" });
  assert.equal(
    definitionen().find("memo-1"),
    null,
    "Das persönliche Memo eines anderen Kontos bleibt verborgen",
  );
});

test("Eine Karte öffnet die Schnellansicht, der Stift den Dialog", async () => {
  const [appSource, indexHtml] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  for (const [workspace, inspector] of [
    ["appointmentWorkspace", "appointmentInspector"],
    ["memoWorkspace", "memoInspector"],
    ["deviceWorkspace", "deviceInspector"],
  ]) {
    assert.ok(indexHtml.includes(`id="${workspace}"`), `${workspace} steht im Markup`);
    assert.ok(indexHtml.includes(`id="${inspector}"`), `${inspector} steht im Markup`);
  }
  // Dieselbe Bauform wie die Mitarbeiter-Schnellansicht.
  assert.match(indexHtml, /class="employee-inspector record-inspector"/);

  // Karten tragen die gemeinsame Kennung; der frühere Weg in den Dialog ist
  // fort - sonst öffneten sich Schnellansicht und Dialog gleichzeitig.
  assert.match(appSource, /data-record-card="\$\{appointment\.id\}"/);
  assert.match(appSource, /data-record-card="\$\{memo\.id\}"/);
  assert.match(appSource, /data-record-card="\$\{device\.id\}"/);
  assert.doesNotMatch(appSource, /openAppointmentDialog\(card\.dataset\.appointmentCard\)/);
  assert.doesNotMatch(appSource, /openMemoDialog\(card\.dataset\.memoCard\)/);

  // Schaltflächen auf der Karte behalten ihre Aufgabe.
  assert.match(
    appSource,
    /const control = event\.target\.closest\("button, input, a, select, textarea"\);\s*if \(control && control !== card\) return;/,
  );
});

test("Verlauf, Favoriten und Palette führen in dieselbe Schnellansicht", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  for (const typ of ["appointment", "memo", "device"]) {
    assert.ok(
      appSource.includes(`selectRecordInspector("${typ}"`),
      `Die Palette öffnet ${typ} in der Schnellansicht`,
    );
  }
  // Geräte kamen mit der Schnellansicht in den Verlauf.
  assert.match(appSource, /if \(item\.type === "device"\) \{[\s\S]*?group: "Geräte"/);

  // Ein gelöschter oder weggefilterter Datensatz schließt die Schnellansicht.
  assert.match(
    appSource,
    /if \(inspectedRecords\[type\] && !definition\.find\(inspectedRecords\[type\]\)\) \{\s*inspectedRecords\[type\] = "";/,
  );
});
