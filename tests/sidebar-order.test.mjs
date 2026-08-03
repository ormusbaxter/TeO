import assert from "node:assert/strict";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const STANDARD = [
  "dashboard",
  "employees",
  "weekends",
  "vacations",
  "appointments",
  "trainings",
  "meetings",
  "devices",
  "device-management",
  "settings",
  "help",
];

test("Die gespeicherte Navigationsreihenfolge überlebt Änderungen am Menü", async () => {
  const app = await loadAppFunctions(["mergeSidebarOrder"]);
  const merge = (gespeichert, vorhanden = STANDARD) =>
    JSON.parse(JSON.stringify(app.mergeSidebarOrder(gespeichert, vorhanden)));

  assert.deepEqual(
    merge([]),
    STANDARD,
    "Ohne gespeicherte Reihenfolge gilt die Standardreihenfolge",
  );

  assert.deepEqual(
    merge(["help", "settings"]),
    [
      "help",
      "settings",
      "dashboard",
      "employees",
      "weekends",
      "vacations",
      "appointments",
      "trainings",
      "meetings",
      "devices",
      "device-management",
    ],
    "Gespeicherte Einträge stehen vorn, der Rest folgt in Standardreihenfolge",
  );

  // Ein neuer Menuepunkt in einer spaeteren Programmversion
  const mitNeuem = [...STANDARD, "auswertungen"];
  assert.deepEqual(
    merge(["help", "dashboard"], mitNeuem).slice(-1),
    ["auswertungen"],
    "Neue Menüpunkte hängen sich hinten an, statt zu verschwinden",
  );

  // Ein entfallener Menuepunkt darf keine Luecke hinterlassen
  assert.deepEqual(
    merge(["help", "gibtesnichtmehr", "dashboard"]),
    [
      "help",
      "dashboard",
      "employees",
      "weekends",
      "vacations",
      "appointments",
      "trainings",
      "meetings",
      "devices",
      "device-management",
      "settings",
    ],
    "Unbekannte Einträge werden verworfen",
  );

  assert.deepEqual(
    merge(["help", "help", "dashboard"]).slice(0, 2),
    ["help", "dashboard"],
    "Doppelte Einträge erscheinen nur einmal",
  );

  assert.deepEqual(
    merge(null),
    STANDARD,
    "Ein beschädigter Speicherwert führt zur Standardreihenfolge",
  );

  assert.deepEqual(
    merge(STANDARD),
    STANDARD,
    "Die Standardreihenfolge bleibt unverändert",
  );
});
