import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

// Das Dashboard im echten Browser mit der Demodatenbank: Kennzahlen, „Als
// Nächstes“ und gebündelte Nachweise müssen tatsächlich zu sehen sein, und die
// Seite darf auf schmalen Bildschirmen nicht seitlich überstehen.
test("Das Dashboard zeigt Kennzahlen, anstehende Fristen und gebündelte Nachweise", async (t) => {
  const teo = await openTeO(t, { anmeldenAls: "admin" });
  if (!teo) return;
  await teo.zeigeAnsicht("dashboard");

  const bild = await teo.evaluate(() => ({
    kennzahlen: document.querySelectorAll("#dashboardKpis .dashboard-kpi").length,
    schnellzugriffe: document.querySelectorAll(".dashboard-quick-panel .quick-action").length,
    nachweise: document.querySelectorAll("#dashboardTrainingProgress .dashboard-training-row").length,
    ueberfaelligeImBlick: [...document.querySelectorAll("#deadlineOverview .deadline-row")].filter(
      (row) => row.classList.contains("is-overdue") && /Pflichtfortbildung/.test(row.textContent),
    ).length,
    zusammenfassung: document.querySelector("#dashboardSummary").textContent,
  }));
  assert.equal(bild.kennzahlen, 4);
  assert.equal(bild.schnellzugriffe, 4);
  assert.ok(bild.nachweise > 0, "Jede Pflichtfortbildung hat eine Zeile");
  assert.equal(bild.ueberfaelligeImBlick, 0, "Überfällige Nachweise stehen nur gebündelt");
  assert.match(bild.zusammenfassung, /In den nächsten 7 Tagen/);

  // Die Kennzahlen stehen nebeneinander, solange Platz ist.
  assert.match(await teo.stil("#dashboardKpis", "grid-template-columns"), /^\S+ \S+ \S+ \S+$/);

  await teo.page.setViewportSize({ width: 390, height: 900 });
  const breite = await teo.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(breite <= 390, `Die Seite steht seitlich über (${breite} Pixel)`);
});
