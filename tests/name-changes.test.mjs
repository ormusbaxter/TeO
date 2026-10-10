import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { createEmployee, loadAppFunctions } from "./helpers/load-app.mjs";

after(closeTeO);

test("Normalisierung sortiert Namensänderungen und verwirft unvollständige", async () => {
  const app = await loadAppFunctions(["normalizeEmployee"]);
  const employee = app.normalizeEmployee({
    ...createEmployee(),
    nameChanges: [
      { date: "2026-05-02", firstName: "Anna", lastName: "Schmidt", reason: " Scheidung " },
      { date: "2020-08-15", firstName: "Anna", lastName: "Müller", reason: "Heirat" },
      { date: "kein Datum", firstName: "Anna", lastName: "Alt" },
      { date: "2024-01-01", firstName: " ", lastName: "" },
    ],
  });
  assert.equal(
    employee.nameChanges.map((change) => `${change.date} ${change.lastName}`).join(","),
    "2020-08-15 Müller,2026-05-02 Schmidt",
  );
  assert.equal(employee.nameChanges[1].reason, "Scheidung");

  const ohne = app.normalizeEmployee(createEmployee());
  assert.equal(ohne.nameChanges.length, 0, "Bestehende Mitarbeiter bleiben ohne Namensänderung");
});

test("Frühere Namen bleiben auffindbar, jüngster zuerst", async () => {
  const app = await loadAppFunctions(["employeeSearchText", "formerEmployeeNames"]);
  const employee = {
    ...createEmployee(),
    firstName: "Anna",
    lastName: "Weber",
    nameChanges: [
      { date: "2020-08-15", firstName: "Anna", lastName: "Müller", reason: "Heirat" },
      { date: "2026-05-02", firstName: "Anna", lastName: "Schmidt", reason: "Scheidung" },
    ],
  };
  assert.equal(
    app.formerEmployeeNames(employee).join(" | "),
    "Schmidt, Anna | Müller, Anna",
  );
  const text = app.employeeSearchText(employee);
  assert.match(text, /Anna Müller/);
  assert.match(text, /Schmidt, Anna/);
  assert.match(text, /Weber, Anna/);

  // Kehrt jemand zum früheren Namen zurück, ist das kein „früherer“ Name.
  const zurueck = { ...employee, lastName: "Müller" };
  assert.equal(app.formerEmployeeNames(zurueck).join(" | "), "Schmidt, Anna");
});

async function bearbeiteNamen(teo, schritte) {
  return teo.evaluate(async (schritte) => {
    document
      .querySelector('[data-action="edit-employee"][data-id="employee-demo-001"]')
      .click();
    const dialog = document.querySelector("#employeeDialog");
    const nachname = document.querySelector("#lastName");
    const hinweis = document.querySelector("#nameChangeHint");
    const tippe = (wert) => {
      nachname.value = wert;
      nachname.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const ergebnis = { hinweisAmAnfang: hinweis.hidden };
    if (schritte.tippeVorher) {
      tippe(schritte.tippeVorher);
      ergebnis.hinweisNachTippen = hinweis.hidden;
    }
    if (schritte.eintragen) {
      document.querySelector("#addNameChangeButton").click();
      ergebnis.fokus = document.activeElement?.id;
      ergebnis.hinweisNachEintragen = hinweis.hidden;
      const zeile = document.querySelector("#nameChangeList .name-change-row:last-child");
      ergebnis.frueher = zeile.querySelector("[data-name-change-last-name]").value;
      zeile.querySelector("[data-name-change-reason]").value = schritte.grund || "";
    }
    if (schritte.neuerNachname) tippe(schritte.neuerNachname);
    document.querySelector("#employeeForm").requestSubmit();
    for (let i = 0; i < 50 && dialog.open; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    ergebnis.offen = dialog.open;
    if (dialog.open) {
      document.querySelector("#employeeDialog [data-close-dialog]").click();
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (dialog.open) dialog.close();
    }
    return ergebnis;
  }, schritte);
}

test("Namensänderung eintragen: früherer Name bleibt in Liste, Suche und Akte", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin", mitDemodaten: true });
  if (!teo) return;
  await teo.zeigeAnsicht("employees");

  const fortbildungen = () =>
    teo.evaluate(() => {
      document
        .querySelector('[data-action="view-employee"][data-id="employee-demo-001"]')
        .click();
      const dialog = document.querySelector("#employeeDossierDialog");
      const text = [...document.querySelectorAll("#employeeDossierContent .dossier-section")]
        .find((section) => section.querySelector("h3")?.textContent === "Pflichtfortbildungen")
        ?.textContent.replace(/\s+/g, " ");
      dialog.close();
      return text;
    });
  const fortbildungenVorher = await fortbildungen();

  // Eintragen, ohne den Namen zu ändern, wird abgewiesen.
  const ohneNeuenNamen = await bearbeiteNamen(teo, { eintragen: true });
  assert.equal(ohneNeuenNamen.offen, true, "Ohne neuen Namen bleibt der Dialog offen");
  assert.equal(ohneNeuenNamen.frueher, "Albers");
  assert.equal(ohneNeuenNamen.fokus, "lastName", "Danach geht es zum Nachnamen");

  const ergebnis = await bearbeiteNamen(teo, {
    tippeVorher: "Albers-Kranz",
    eintragen: true,
    grund: "Heirat",
    neuerNachname: "Kranz",
  });
  assert.equal(ergebnis.hinweisAmAnfang, true, "Unveränderter Name: kein Hinweis");
  assert.equal(ergebnis.hinweisNachTippen, false, "Überschriebener Name: Hinweis erscheint");
  assert.equal(ergebnis.hinweisNachEintragen, true, "Festgehaltener Name: Hinweis verschwindet");
  assert.equal(ergebnis.frueher, "Albers", "Festgehalten wird der gespeicherte Name");
  assert.equal(ergebnis.offen, false, "Der Dialog schließt nach dem Speichern");

  const liste = await teo.evaluate(async () => {
    const suche = document.querySelector("#employeeSearch");
    suche.value = "Felix Albers";
    suche.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 400));
    const zeilen = [...document.querySelectorAll("[data-employee-row]")];
    return {
      treffer: zeilen.map((zeile) => zeile.dataset.employeeRow),
      text: zeilen[0]?.querySelector(".employee-cell").textContent.replace(/\s+/g, " "),
    };
  });
  assert.equal(liste.treffer.join(","), "employee-demo-001", "Gesucht unter dem früheren Namen");
  assert.match(liste.text, /Kranz, Felix/);
  assert.match(liste.text, /früher: Albers, Felix/);

  const akte = await teo.evaluate(() => {
    document
      .querySelector('[data-action="view-employee"][data-id="employee-demo-001"]')
      .click();
    const abschnitt = [...document.querySelectorAll("#employeeDossierContent .dossier-section")]
      .find((section) => section.querySelector("h3")?.textContent === "Namensverlauf");
    return {
      titel: document.querySelector("#employeeDossierTitle").textContent,
      verlauf: abschnitt?.textContent.replace(/\s+/g, " ").trim(),
    };
  });
  assert.equal(akte.titel, "Kranz, Felix");
  assert.match(akte.verlauf, /Kranz, Felix seit \d\d\.\d\d\.\d{4}/);
  assert.match(akte.verlauf, /Albers, Felix bis \d\d\.\d\d\.\d{4} · Heirat/);
  await teo.evaluate(() => document.querySelector("#employeeDossierDialog").close());
  assert.equal(
    await fortbildungen(),
    fortbildungenVorher,
    "Fortbildungsnachweise hängen weiter am Mitarbeiter",
  );
});
