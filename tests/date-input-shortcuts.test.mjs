import assert from "node:assert/strict";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

// Der Handler braucht vom Datumsfeld nur wenige Eigenschaften. Der Ersatz
// bildet sie nach und merkt sich, welche Ereignisse ausgelöst wurden - so
// lässt sich die Schnelleingabe ohne Browser prüfen.
function datumsfeld({ min = "", max = "", readOnly = false, disabled = false } = {}) {
  return {
    value: "",
    min,
    max,
    readOnly,
    disabled,
    ereignisse: [],
    matches: (selector) => selector === 'input[type="date"]',
    dispatchEvent(event) {
      this.ereignisse.push(event.type);
      return true;
    },
  };
}

function tastendruck(input, key, extra = {}) {
  let verhindert = false;
  return {
    event: {
      key,
      target: input,
      preventDefault() {
        verhindert = true;
      },
      get defaultPrevented() {
        return verhindert;
      },
      ...extra,
    },
    verhindert: () => verhindert,
  };
}

test("„h“, „g“ und „m“ tragen heute, gestern und morgen ein", async () => {
  const app = await loadAppFunctions(["handleDateInputShortcut", "shiftDaysFromToday"]);

  for (const [taste, versatz] of [
    ["h", 0],
    ["g", -1],
    ["m", 1],
    ["H", 0],
    ["G", -1],
  ]) {
    const input = datumsfeld();
    const { event, verhindert } = tastendruck(input, taste);
    app.handleDateInputShortcut(event);
    assert.equal(input.value, app.shiftDaysFromToday(versatz), `„${taste}“ trägt ein`);
    assert.equal(verhindert(), true, "Der Tastendruck wird verbraucht");
    // Dieselben Ereignisse wie bei einer Eingabe von Hand - daran hängen
    // Anzeige, Prüfungen und die Erkennung ungespeicherter Formulare.
    assert.deepEqual(input.ereignisse.join(","), "input,change");
  }
});

test("Grenzen des Feldes und fremde Tasten bleiben unangetastet", async () => {
  const app = await loadAppFunctions(["handleDateInputShortcut", "shiftDaysFromToday"]);
  const heute = app.shiftDaysFromToday(0);

  // Ein Nachweis darf nicht in der Zukunft liegen: „m“ bleibt wirkungslos,
  // statt einen unzulässigen Wert zu setzen.
  const mitGrenze = datumsfeld({ max: heute });
  const morgen = tastendruck(mitGrenze, "m");
  app.handleDateInputShortcut(morgen.event);
  assert.equal(mitGrenze.value, "");
  assert.equal(morgen.verhindert(), false);

  const untergrenze = datumsfeld({ min: heute });
  app.handleDateInputShortcut(tastendruck(untergrenze, "g").event);
  assert.equal(untergrenze.value, "", "Gestern liegt vor der Untergrenze");

  // Ziffern und andere Tasten gehören weiter dem Feld.
  const frei = datumsfeld();
  for (const taste of ["1", "t", "ArrowUp", "Enter"]) {
    app.handleDateInputShortcut(tastendruck(frei, taste).event);
  }
  assert.equal(frei.value, "");
  assert.equal(frei.ereignisse.length, 0);

  // Mit Zusatztaste nicht - Strg+H gehört dem Browser.
  const mitStrg = datumsfeld();
  app.handleDateInputShortcut(tastendruck(mitStrg, "h", { ctrlKey: true }).event);
  assert.equal(mitStrg.value, "");

  // Gesperrte Felder ebenfalls nicht.
  const gesperrt = datumsfeld({ readOnly: true });
  app.handleDateInputShortcut(tastendruck(gesperrt, "h").event);
  assert.equal(gesperrt.value, "");
});

test("Die Schnelleingabe ist im Feld und in der Kürzelübersicht genannt", async () => {
  const app = await loadAppFunctions(["handleDateInputShortcut"]);
  assert.ok(app.handleDateInputShortcut, "Der Handler existiert");

  const [{ readFile }, path, { fileURLToPath }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
    import("node:url"),
  ]);
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const [appSource, indexHtml] = await Promise.all([
    readFile(path.join(projectRoot, "app.js"), "utf8"),
    readFile(path.join(projectRoot, "index.html"), "utf8"),
  ]);

  // Jedes Datumsfeld nennt die Tasten als Kurzhinweis, sofern es keinen
  // eigenen trägt.
  assert.match(appSource, /if \(!input\.title\) input\.title = DATE_INPUT_SHORTCUT_HINT;/);
  assert.match(
    indexHtml,
    /<dt><kbd>h<\/kbd> <kbd>g<\/kbd> <kbd>m<\/kbd><\/dt>\s*<dd>Im Datumsfeld: heute, gestern, morgen eintragen<\/dd>/,
  );
});
