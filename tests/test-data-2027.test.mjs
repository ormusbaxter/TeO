import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

// Der Testdatensatz 2026/2027 (tools/generate-test-data-2027.mjs) muss sich in
// TeO laden lassen und die zugesagte Zusammensetzung behalten.
const datei = new URL("../demo/teo-testdatensatz-60-ma-2026-2027.json", import.meta.url);

test("Der Testdatensatz 2026/2027 lässt sich als Sicherung einlesen", async () => {
  const app = await loadAppFunctions(["parseBackup"]);
  const bestand = app.parseBackup(await fs.readFile(datei, "utf8"));

  assert.equal(bestand.employees.length, 60, "Kein Mitarbeiter geht beim Einlesen verloren");
  const beruf = (name) => bestand.employees.filter((employee) => employee.profession === name);
  assert.equal(beruf("Pflegefachkraft").length, 56);
  assert.equal(beruf("Intensivtechnische/r Assistent/in").length, 2);
  assert.equal(beruf("Medizinische/r Fachangestellte/r").length, 1);
  assert.equal(beruf("Stationsassistenz").length, 1);
  assert.equal(
    beruf("Pflegefachkraft").filter((employee) => employee.qualifications.fachweiterbildungIA).length,
    17,
    "Rund 30 % der Pflegefachkräfte haben die Fachweiterbildung",
  );

  const geplant2027 = bestand.vacationDays.filter((entry) => entry.date.startsWith("2027-"));
  assert.ok(geplant2027.length > 1000, "Die Urlaubsplanung 2027 ist gefüllt");
  assert.ok(bestand.appointments.length >= 15 && bestand.memos.length >= 8);
  assert.ok(bestand.deviceInstructions.length > 100 && bestand.completions.length > 100);
});
