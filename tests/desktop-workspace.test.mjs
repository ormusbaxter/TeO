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

test("Die Arbeitsliste bündelt Überfälliges und lässt sich eingrenzen", async () => {
  const app = await loadAppFunctions(
    ["renderDashboardWorkQueue", "handleWorkQueueAction"],
    { withDom: true },
  );
  app.setState(
    createMinimalState({
      employees: [createEmployee("e1")],
      memos: [
        {
          id: "m1",
          title: "Längst fällig",
          category: "Aufgabe",
          visibility: "all",
          date: heuteVerschoben(-5),
          completed: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "m2",
          title: "Nächste Woche",
          category: "Aufgabe",
          visibility: "all",
          date: heuteVerschoben(4),
          completed: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "m3",
          title: "Erledigt",
          category: "Aufgabe",
          visibility: "all",
          date: heuteVerschoben(-2),
          completed: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }),
  );

  app.setCurrentUser({ id: "u1", username: "Demo", role: "admin" });
  app.renderDashboardWorkQueue();
  const alles = app.dom.markupText("#dashboardWorkQueue");
  assert.match(alles, /Längst fällig/);
  assert.match(alles, /Nächste Woche/);
  assert.doesNotMatch(alles, /Erledigt/, "Erledigtes gehört nicht in die Arbeitsliste");
  assert.match(alles, /is-overdue/, "Überfälliges hebt sich ab");

  // Der Filter „Überfällig“ lässt nur stehen, was schon vorbei ist.
  const filter = new app.HTMLElement({
    tagName: "BUTTON",
    dataset: { workQueueFilter: "overdue" },
  });
  app.handleWorkQueueAction({ target: filter });
  const nurUeberfaellig = app.dom.markupText("#dashboardWorkQueue");
  assert.match(nurUeberfaellig, /Längst fällig/);
  assert.doesNotMatch(nurUeberfaellig, /Nächste Woche/);

  // Und „7 Tage“ lässt das Überfällige weg.
  const woche = new app.HTMLElement({
    tagName: "BUTTON",
    dataset: { workQueueFilter: "week" },
  });
  app.handleWorkQueueAction({ target: woche });
  const nurWoche = app.dom.markupText("#dashboardWorkQueue");
  assert.doesNotMatch(nurWoche, /Längst fällig/);
  assert.match(nurWoche, /Nächste Woche/);
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
