import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Eintritt, Austritt und Änderungen des Stellenumfangs lassen sich erfassen", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "admin" });
  if (!teo) return;
  await teo.zeigeAnsicht("employees");
  const id = await teo.evaluate(() => document.querySelector('[data-action="edit-employee"]').dataset.id);
  const oeffnen = async () => {
    await teo.evaluate((mitarbeiter) => {
      document.querySelector(`[data-action="edit-employee"][data-id="${mitarbeiter}"]`).click();
    }, id);
    await teo.page.waitForSelector("#employeeDialog[open]");
  };

  await oeffnen();
  await teo.page.fill("#entryDate", "2020-04-01");
  await teo.page.fill("#exitDate", "2099-12-31");
  await teo.page.fill("#employmentPercent", "100");
  await teo.page.click("#addEmploymentChangeButton");
  await teo.page.fill(".employment-change-row:last-child [data-employment-change-from]", "2099-01-01");
  await teo.page.fill(".employment-change-row:last-child [data-employment-change-percent]", "50");
  await teo.evaluate(() => document.querySelector("#employeeForm").requestSubmit());
  await teo.page.waitForFunction(() => !document.querySelector("#employeeDialog").open);

  // Die Liste nennt die bevorstehende Änderung.
  const zeile = await teo.evaluate(
    (mitarbeiter) =>
      document.querySelector(`[data-action="edit-employee"][data-id="${mitarbeiter}"]`)
        .closest("tr")
        .querySelector(".employment-change-note")?.textContent,
    id,
  );
  assert.match(zeile, /ab 01\.01\.2099: 50/);

  // Wieder geöffnet stehen alle Angaben im Formular.
  await oeffnen();
  const formular = await teo.evaluate(() => ({
    eintritt: document.querySelector("#entryDate").value,
    austritt: document.querySelector("#exitDate").value,
    aenderungen: [...document.querySelectorAll(".employment-change-row")].map(
      (reihe) =>
        `${reihe.querySelector("[data-employment-change-from]").value}:${reihe.querySelector("[data-employment-change-percent]").value}`,
    ),
  }));
  assert.equal(formular.eintritt, "2020-04-01");
  assert.equal(formular.austritt, "2099-12-31");
  assert.equal(formular.aenderungen.join(","), "2099-01-01:50");

  // Ein Austritt vor dem Eintritt wird nicht gespeichert.
  await teo.page.fill("#exitDate", "2019-01-01");
  await teo.evaluate(() => document.querySelector("#employeeForm").requestSubmit());
  assert.equal(await teo.evaluate(() => document.querySelector("#employeeDialog").open), true);
  assert.deepEqual(teo.problems, []);
});
