import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Mit echter Anmeldung: Der Änderungsverlauf hängt am angemeldeten Konto,
// nicht an der Rolle, die die Oberfläche zeigt.

async function telefonAendernUndAkteOeffnen(teo) {
  await teo.zeigeAnsicht("employees");
  const id = await teo.evaluate(() =>
    document.querySelector('[data-action="edit-employee"]').dataset.id,
  );
  await teo.evaluate((mitarbeiter) => {
    document.querySelector(`[data-action="edit-employee"][data-id="${mitarbeiter}"]`).click();
  }, id);
  await teo.page.waitForSelector("#employeeDialog[open]");
  await teo.page.fill("#phone", "+49 000 1000 9999");
  await teo.evaluate(() => document.querySelector("#employeeForm").requestSubmit());
  await teo.page.waitForFunction(() => !document.querySelector("#employeeDialog").open);
  await teo.evaluate((mitarbeiter) => {
    document.querySelector(`[data-action="view-employee"][data-id="${mitarbeiter}"]`).click();
  }, id);
  await teo.page.waitForSelector("#employeeDossierDialog[open]");
  return teo.evaluate(() => document.querySelector("#employeeDossierContent").textContent);
}

test("Administratoren sehen in der Akte, wer was geändert hat", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "admin" });
  if (!teo) return;
  const akte = await telefonAendernUndAkteOeffnen(teo);
  assert.match(akte, /Änderungsverlauf/);
  assert.match(akte, /Stammdaten: Telefon/);
  assert.match(akte, /DemoAdmin/);
  assert.deepEqual(teo.problems, []);
});

test("Normale Benutzer sehen in der Akte keinen Änderungsverlauf", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "user" });
  if (!teo) return;
  const akte = await telefonAendernUndAkteOeffnen(teo);
  assert.doesNotMatch(akte, /Änderungsverlauf/);
  assert.deepEqual(teo.problems, []);
});
