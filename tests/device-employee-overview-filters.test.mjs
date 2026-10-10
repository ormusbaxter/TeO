import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const MITARBEITER = "employee-demo-001";

function gerät(id, productName, currentInventory) {
  return {
    id,
    productName,
    manufacturer: "Prüfwerk",
    category: "Testgerät",
    annex1: false,
    currentInventory,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function sichtbareGeräte(teo) {
  return teo.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#deviceEmployeeOverviewContent .device-employee-overview-row strong",
      ),
    ].map((element) => element.textContent.trim()),
  );
}

async function schalte(teo, selektor) {
  await teo.evaluate((s) => document.querySelector(s).click(), selektor);
}

// Drei Geräte decken alle Fälle ab: eingewiesen und im Bestand, offen und im
// Bestand, offen und ausgemustert.
test("Die Geräteübersicht eines Mitarbeiters filtert nach offenen Einweisungen und Bestand", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(bestand) {
      bestand.employees.find((e) => e.id === MITARBEITER).employmentStatus =
        "active";
      bestand.devices = [
        gerät("geraet-a", "Alpha", true),
        gerät("geraet-b", "Beta", true),
        gerät("geraet-c", "Gamma", false),
      ];
      bestand.deviceInstructions = [
        {
          id: "einweisung-a",
          deviceId: "geraet-a",
          date: "2026-02-01",
          instructorType: "manufacturer",
          instructorEmployeeId: "",
          instructorName: "Prüfwerk",
          instructorWasMedicalProductsOfficer: false,
          participants: [
            { employeeId: MITARBEITER, wasMedicalProductsOfficer: false },
          ],
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ];
    },
  });
  if (!teo) return;

  await teo.zeigeAnsicht("devices");
  await schalte(teo, `[data-device-employee-overview="${MITARBEITER}"]`);

  const alle = await sichtbareGeräte(teo);
  assert.equal(alle.length, 3, alle.join(", "));

  await schalte(teo, "#deviceEmployeeOverviewOpenFilter");
  const offen = await sichtbareGeräte(teo);
  assert.equal(offen.length, 2, offen.join(", "));
  assert.ok(offen.every((name) => !name.includes("Alpha")));

  await schalte(teo, "#deviceEmployeeOverviewInventoryFilter");
  const offenImBestand = await sichtbareGeräte(teo);
  assert.equal(offenImBestand.length, 1);
  assert.match(offenImBestand[0], /Beta/);

  await schalte(teo, "#deviceEmployeeOverviewOpenFilter");
  const imBestand = await sichtbareGeräte(teo);
  assert.equal(imBestand.length, 2, imBestand.join(", "));
  assert.ok(imBestand.every((name) => !name.includes("Gamma")));

  // Der Untertitel zählt weiter alle Geräte, die Zusammenfassung die sichtbaren.
  const texte = await teo.evaluate(() => ({
    untertitel: document.querySelector("#deviceEmployeeOverviewSubtitle")
      .textContent,
    zusammenfassung: document.querySelector(
      "#deviceEmployeeOverviewContent .device-employee-overview-summary",
    ).textContent,
  }));
  assert.match(texte.untertitel, /1 von 3 Geräten/);
  assert.match(texte.zusammenfassung, /2\s*sichtbar/);

  // Beim nächsten Mitarbeiter bleibt der Filter stehen.
  await teo.evaluate(() => document.querySelector("#deviceEmployeeOverviewDialog").close());
  await schalte(teo, `[data-device-employee-overview="${MITARBEITER}"]`);
  const erneut = await teo.evaluate(
    () => document.querySelector("#deviceEmployeeOverviewInventoryFilter").checked,
  );
  assert.equal(erneut, true);
  assert.equal((await sichtbareGeräte(teo)).length, 2);
});
