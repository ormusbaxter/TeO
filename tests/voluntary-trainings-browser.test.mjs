import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Fortbildungen haben eine eigene Ansicht und bleiben aus der Pflichtquote", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(bestand) {
      bestand.trainings.push({
        id: "kinaesthetik",
        title: "Kinästhetik Grundkurs",
        description: "",
        year: 2025,
        recurrenceMonths: null,
        mandatory: false,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      });
    },
  });
  if (!teo) return;

  const pflichtKarten = async () =>
    teo.evaluate(() =>
      [...document.querySelectorAll('#trainingList [data-action="edit-training"]')].map(
        (knopf) => knopf.dataset.id,
      ),
    );

  await teo.zeigeAnsicht("trainings");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#trainingsViewTitle").textContent),
    "Pflichtfortbildungen",
  );
  assert.ok(!(await pflichtKarten()).includes("kinaesthetik"));

  await teo.zeigeAnsicht("voluntary-trainings");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#trainingsViewTitle").textContent),
    "Fortbildungen",
  );
  assert.equal((await pflichtKarten()).join(","), "kinaesthetik");
  assert.equal(
    await teo.evaluate(() => document.querySelector("#navVoluntaryTrainingCount").textContent),
    "1",
  );

  // Neu angelegt wird die Art der offenen Ansicht
  await teo.page.click('[data-view-panel~="voluntary-trainings"] [data-open-training]');
  await teo.page.waitForSelector("#trainingDialog[open]");
  assert.deepEqual(
    await teo.evaluate(() => ({
      art: document.querySelector("#trainingMandatory").value,
      titel: document.querySelector("#trainingDialogTitle").textContent,
    })),
    { art: "false", titel: "Fortbildung anlegen" },
  );
  await teo.page.fill("#trainingTitle", "Wundmanagement");
  await teo.page.click('#trainingForm button[type="submit"]');
  await teo.page.waitForFunction(() => !document.querySelector("#trainingDialog").open);

  const neu = await teo.evaluate(() =>
    [...document.querySelectorAll("#trainingList .training-card h2")].map((h) => h.textContent),
  );
  assert.ok(neu.includes("Wundmanagement"), "Die neue Fortbildung steht in ihrer Ansicht");

  await teo.zeigeAnsicht("dashboard");
  const quote = await teo.evaluate(() => document.querySelector(".dashboard-training-list")?.textContent || "");
  assert.doesNotMatch(quote, /Wundmanagement|Kinästhetik/, "Die Übersicht zeigt nur Pflichten");
});

test("Direktlinks wechseln zwischen Pflichtfortbildungen und Fortbildungen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const titel = () =>
    teo.evaluate(() => document.querySelector("#trainingsViewTitle").textContent);
  const springe = async (hash) => {
    await teo.evaluate((ziel) => {
      window.location.hash = ziel;
    }, hash);
    await teo.page.waitForFunction(
      (ziel) => document.querySelector(".nav-item.is-active")?.dataset.view === ziel,
      hash === "fortbildungen" ? "voluntary-trainings" : "trainings",
    );
  };

  // Beide Menüpunkte teilen sich eine Ansicht: Auch ohne Datenänderung muss
  // jeder Wechsel sie für die richtige Art aufbauen, in beide Richtungen.
  await springe("pflichtfortbildungen");
  assert.equal(await titel(), "Pflichtfortbildungen");
  await springe("fortbildungen");
  assert.equal(await titel(), "Fortbildungen");
  await springe("pflichtfortbildungen");
  assert.equal(await titel(), "Pflichtfortbildungen");
  await teo.zeigeAnsicht("voluntary-trainings");
  assert.equal(await titel(), "Fortbildungen");
});
