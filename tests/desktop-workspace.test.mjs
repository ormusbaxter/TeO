import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

after(closeTeO);

function heuteVerschoben(tage) {
  const datum = new Date();
  datum.setDate(datum.getDate() + tage);
  return [
    datum.getFullYear(),
    String(datum.getMonth() + 1).padStart(2, "0"),
    String(datum.getDate()).padStart(2, "0"),
  ].join("-");
}

test("Die Schnellansicht zeigt den gewählten Mitarbeiter", async () => {
  const app = await loadAppFunctions(
    ["selectEmployeeInspector", "renderEmployeeInspector"],
    { withDom: true },
  );
  app.setState(
    createMinimalState({
      employees: [
        { ...createEmployee("e1"), firstName: "Anna", lastName: "Berg" },
        { ...createEmployee("e2"), firstName: "Bert", lastName: "Cara" },
      ],
    }),
  );

  app.selectEmployeeInspector("e1");
  const ersteAnsicht = app.dom.markupText("#employeeInspectorContent");
  assert.match(ersteAnsicht, /Anna/);
  assert.doesNotMatch(ersteAnsicht, /Bert/);

  app.selectEmployeeInspector("e2");
  assert.match(app.dom.markupText("#employeeInspectorContent"), /Bert/);

  // Ein unbekannter Mitarbeiter wird übergangen - die Ansicht bleibt stehen,
  // statt leer zu werden oder einen falschen Namen zu zeigen.
  app.selectEmployeeInspector("gibtesnicht");
  assert.match(app.dom.markupText("#employeeInspectorContent"), /Bert/);
});

function vorEinemJahr(tage) {
  const datum = heuteVerschoben(tage);
  return `${Number(datum.slice(0, 4)) - 1}${datum.slice(4)}`;
}

test("Das Dashboard bündelt überfällige Nachweise und blickt nach vorn", async () => {
  const app = await loadAppFunctions(
    [
      "renderDeadlineOverview",
      "renderDashboardTrainingProgress",
      "renderDashboardSummary",
      "handleDashboardAction",
    ],
    { withDom: true },
  );
  const vorjahr = Number(heuteVerschoben(0).slice(0, 4)) - 1;
  app.setState(
    createMinimalState({
      employees: [{ ...createEmployee("e1"), firstName: "Anna", lastName: "Berg" }],
      trainings: [
        { id: "t1", title: "Brandschutz", year: vorjahr, recurrenceMonths: 12, createdAt: "", updatedAt: "" },
        { id: "t2", title: "Hygiene", year: vorjahr, recurrenceMonths: 12, createdAt: "", updatedAt: "" },
      ],
      // Hygiene wurde vor knapp einem Jahr abgeschlossen und ist in 20 Tagen
      // wieder fällig; Brandschutz fehlt ganz und ist damit überfällig.
      completions: [
        { id: "c1", employeeId: "e1", trainingId: "t2", completedOn: vorEinemJahr(20), note: "", createdAt: "" },
      ],
    }),
  );
  app.setCurrentUser({ id: "u1", username: "Demo", role: "admin" });

  app.renderDeadlineOverview();
  const vorschau = app.dom.markupText("#deadlineOverview");
  assert.match(vorschau, /Hygiene/, "In 20 Tagen Fälliges steht im 30-Tage-Blick");
  assert.doesNotMatch(
    vorschau,
    /Brandschutz/,
    "Überfällige Pflichtfortbildungen stehen gebündelt unter den offenen Nachweisen",
  );

  app.renderDashboardTrainingProgress();
  const nachweise = app.dom.markupText("#dashboardTrainingProgress");
  assert.match(nachweise, /Brandschutz[\s\S]*1 überfällig/);
  assert.match(nachweise, /AB/, "Die Betroffenen erscheinen als Kürzel");

  app.renderDashboardSummary();
  assert.match(app.dom.markupText("#dashboardKpis"), /1<\/strong>[\s\S]*Nachweis überfällig/);

  // „7 Tage“ grenzt den Blick ein - die Hygiene in 20 Tagen fällt heraus.
  const woche = new app.HTMLElement({ tagName: "BUTTON", dataset: { deadlineHorizon: "7" } });
  app.handleDashboardAction({ target: woche });
  assert.doesNotMatch(app.dom.markupText("#deadlineOverview"), /Hygiene/);
});

test("Favoriten und Verlauf erscheinen in der Befehlspalette", async () => {
  const app = await loadAppFunctions(
    ["toggleWorkspaceFavorite", "workspaceCommandPaletteEntries", "trackWorkspaceRecord"],
    { withDom: true },
  );
  app.setState(
    createMinimalState({
      employees: [{ ...createEmployee("e1"), firstName: "Anna", lastName: "Berg" }],
    }),
  );

  assert.equal(
    app.workspaceCommandPaletteEntries().length,
    0,
    "Ohne Verlauf und Favoriten steht dort nichts",
  );

  app.toggleWorkspaceFavorite("employee", "e1");
  const mitFavorit = app.workspaceCommandPaletteEntries();
  assert.ok(
    mitFavorit.some((eintrag) => JSON.stringify(eintrag).includes("Berg")),
    "Der Favorit steht in der Palette",
  );

  // Und er liegt im Browserprofil, nicht im Datenbestand.
  assert.match(
    String(app.dom.window.localStorage?.getItem?.("teo-workspace-favorites-v1") ?? ""),
    /e1/,
  );

  app.toggleWorkspaceFavorite("employee", "e1");
  assert.equal(
    app.workspaceCommandPaletteEntries().length,
    0,
    "Ein zweiter Griff nimmt ihn wieder heraus",
  );
});

test("Die Namensspalte der Tabelle bleibt beim seitlichen Blättern stehen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("employees");
  const gemessen = await teo.evaluate(() => {
    const kopf = document.querySelector('.employee-table th[data-column="name"]');
    if (!kopf) return null;
    const stil = getComputedStyle(kopf);
    return { position: stil.position, breite: stil.width };
  });

  if (gemessen) {
    assert.equal(gemessen.position, "sticky", "Die Namensspalte klebt");
    assert.match(gemessen.breite, /^\d/, "und hat eine feste Breite");
  }
});

test("Die Änderungshistorie führt die neueste Fassung zuerst", async () => {
  // Eine Prüfung über das Dokument als Ganzes: Sie fragt nach der Reihenfolge
  // aller Einträge, nicht nach dem Verhalten einer Funktion.
  const changelog = await fs.readFile(path.join(projectRoot, "CHANGELOG.md"), "utf8");
  const fassungen = [...changelog.matchAll(/^### (\d+)\.(\d+)\.(\d+)/gm)].map(
    ([, major, minor, patch]) => [Number(major), Number(minor), Number(patch)],
  );
  assert.ok(fassungen.length >= 5, "Das Verzeichnis nennt mehrere Fassungen");
  for (let index = 1; index < fassungen.length; index += 1) {
    const vorher = fassungen[index - 1];
    const jetzt = fassungen[index];
    assert.ok(
      vorher.join(".") !== jetzt.join("."),
      `Die Fassung ${jetzt.join(".")} steht doppelt im Verzeichnis`,
    );
    assert.ok(
      vorher[0] > jetzt[0] ||
        (vorher[0] === jetzt[0] && vorher[1] > jetzt[1]) ||
        (vorher[0] === jetzt[0] && vorher[1] === jetzt[1] && vorher[2] > jetzt[2]),
      `Die Fassung ${jetzt.join(".")} steht vor der älteren ${vorher.join(".")}`,
    );
  }
});
