import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Ein Bestand mit ACLS-Training rechnet ACLS-Provider nach dem Laden an", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(bestand) {
      // Ein Bestand aus der Zeit vor der Abdeckung: TeO verbindet beides
      // beim Laden selbst.
      bestand.version = 27;
      bestand.catalogs.qualifications.push({ id: "aclsProvider", label: "ACLS-Provider" });
      const provider = bestand.employees.find((employee) => employee.active);
      provider.qualifications.aclsProvider = true;
      bestand.trainings.push({
        id: "acls-training",
        title: "ACLS-Training",
        description: "",
        year: 2024,
        recurrenceMonths: 12,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
    },
  });
  if (!teo) return;

  await teo.zeigeAnsicht("trainings");
  const karte = await teo.evaluate(() => {
    const knopf = document.querySelector('[data-action="edit-training"][data-id="acls-training"]');
    const article = knopf.closest(".training-card");
    return {
      hinweis: article.querySelector(".training-meta").parentElement.textContent,
      stand: article.querySelector(".training-progress-block strong").textContent,
    };
  });
  assert.match(karte.hinweis, /Gilt als absolviert, solange „ACLS-Provider“ gültig ist/);
  assert.match(karte.stand, /Stand\s*1 von/);

  await teo.page.click('[data-action="edit-training"][data-id="acls-training"]');
  await teo.page.waitForSelector("#trainingDialog[open]");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#trainingCoveredByQualification").value),
    "aclsProvider",
  );
});
