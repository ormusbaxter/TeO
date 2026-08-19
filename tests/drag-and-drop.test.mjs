import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Ziehen beginnt erst jenseits einer Schwelle", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  assert.match(appSource, /const DRAG_THRESHOLD = 6;/);
  // Beide Raster prüfen die Schwelle, bevor aus dem Druck ein Ziehen wird -
  // sonst verlöre ein gewöhnlicher Klick seine bisherige Bedeutung.
  for (const bewegung of ["movePlannerDrag", "moveAppointmentDrag"]) {
    assert.match(
      appSource,
      new RegExp(
        `function ${bewegung}\\(event\\) \\{[\\s\\S]*?Math\\.abs\\(event\\.clientX - \\w+\\.x\\) < DRAG_THRESHOLD`,
      ),
      `${bewegung} wartet die Schwelle ab`,
    );
  }

  // Nach dem Ziehen darf der abschliessende Klick nicht auch noch wirken.
  assert.match(appSource, /function suppressNextClick\(element\) \{[\s\S]*?capture: true, once: true/);
  assert.match(appSource, /suppressNextClick\(elements\.vacationPlanner\);/);
  assert.match(appSource, /suppressNextClick\(elements\.appointmentCalendarGrid\);/);
});

test("Im Urlaubsraster spannt das Ziehen denselben Bereich auf wie die Tastatur", async () => {
  const appSource = await fs.readFile(path.join(projectRoot, "app.js"), "utf8");

  // Ausgangspunkt und aktuelles Feld sind dieselben Groessen, die auch
  // Umschalt + Pfeiltaste verwendet - und angewendet wird ueber denselben Weg.
  assert.match(
    appSource,
    /vacationSelectionAnchor = plannerDrag\.start;\s*vacationFocus = position;\s*applyVacationSelectionHighlight\(\);/,
  );
  assert.match(
    appSource,
    /await applyVacationEntryToSelection\(vacationEntryType \|\| "vacation"\);/,
  );
});

test("Ein Termin lässt sich im Monatsraster auf einen anderen Tag ziehen", async () => {
  const [appSource, styles] = await Promise.all([
    fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
    fs.readFile(path.join(projectRoot, "styles.css"), "utf8"),
  ]);

  // Das Ziel hebt sich waehrend des Ziehens ab, der Ausgangstag zaehlt nicht.
  assert.match(
    appSource,
    /if \(day && day\.dataset\.calendarDay !== appointmentDrag\.from\) \{\s*day\.classList\.add\("is-drop-target"\);/,
  );
  assert.match(styles, /\.appointment-calendar-day\.is-drop-target \{[\s\S]*?outline: 2px dashed/);

  // Verschoben wird als eine Aenderung, die sich zurueckziehen laesst.
  assert.match(
    appSource,
    /function moveAppointmentToDate\(appointmentId, date\)[\s\S]*?\{ undo: "Termin verschoben" \}/,
  );
  assert.match(appSource, /showUndoToast\(`„\$\{appointment\.title\}“ liegt jetzt am \$\{formatDate\(date\)\}\.`\)/);
  // Auf denselben Tag gezogen passiert nichts.
  assert.match(appSource, /if \(!drag\.to \|\| drag\.to === drag\.from\) return;/);
});
