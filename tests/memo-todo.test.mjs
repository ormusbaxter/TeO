import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

test("Gemeinsame Memos sind für alle sichtbar, private nur für den Ersteller", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "memoVisibleToCurrentUser",
    "visibleMemos",
    "sortMemos",
  ]);
  const state = app.normalizeState(
    createMinimalState({
      memos: [
        { id: "shared", title: "Gemeinsam", visibility: "all", createdByUserId: "user-a" },
        { id: "mine", title: "Privat A", visibility: "private", createdByUserId: "user-a" },
        { id: "other", title: "Privat B", visibility: "private", createdByUserId: "user-b" },
      ],
    }),
  );
  app.setState(state);
  app.setCurrentUser({ id: "user-a", username: "NutzerA" });

  assert.deepEqual(
    Array.from(app.visibleMemos(), (memo) => memo.id).sort(),
    ["mine", "shared"],
  );
  assert.equal(app.memoVisibleToCurrentUser(state.memos[2]), false);
});

test("Angepinnte Memos stehen vor offenen und erledigten Einträgen", async () => {
  const app = await loadAppFunctions(["sortMemos"]);
  const entries = [
    { id: "done", title: "Erledigt", pinned: false, completed: true, date: "", updatedAt: "" },
    { id: "open", title: "Offen", pinned: false, completed: false, date: "2026-08-18", updatedAt: "" },
    { id: "pinned", title: "Wichtig", pinned: true, completed: false, date: "", updatedAt: "" },
  ];
  assert.deepEqual(entries.sort(app.sortMemos).map((memo) => memo.id), ["pinned", "open", "done"]);
});

test("Memo-Oberfläche, Kategorien und das bedarfsabhängige Dashboard sind verdrahtet", async () => {
  const [html, appSource, css] = await Promise.all([
    fs.readFile("index.html", "utf8"),
    fs.readFile("app.js", "utf8"),
    fs.readFile("styles.css", "utf8"),
  ]);

  assert.ok(html.indexOf('data-view="appointments"') < html.indexOf('data-view="memos"'));
  assert.match(html, /id="memoDialog"[\s\S]*id="memoDate"[\s\S]*id="memoVisibility"/);
  assert.match(html, /id="memoCategoryForm"[\s\S]*id="memoCategoryList"/);
  assert.match(html, /id="dashboardPriorityGrid"[\s\S]*id="dashboardMemoPanel"/);
  assert.match(appSource, /dashboardPriorityGrid\.classList\.toggle\("has-memos", visible\)/);
  assert.match(css, /\.dashboard-priority-grid\.has-memos\s*\{[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
});
