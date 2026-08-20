import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

const ANSICHTEN = ["employees", "appointments", "memos", "devices", "device-management"];

test("Jede gefilterte Ansicht hat eine Leiste für ihre aktiven Filter", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const vorhanden = await teo.evaluate(() =>
    [...document.querySelectorAll("[data-filter-chips]")].map(
      (leiste) => leiste.dataset.filterChips,
    ),
  );
  assert.equal(
    [...vorhanden].sort().join(","),
    [...ANSICHTEN].sort().join(","),
    "Genau diese Ansichten führen eine Chip-Leiste",
  );
});

test("Ein Filter erscheint als Chip und lässt sich darüber wieder entfernen", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("employees");

  // Suchbegriff eintippen wie von Hand.
  const mitFilter = await teo.evaluate(() => {
    const suche = document.querySelector("#employeeSearch");
    suche.value = "Meier";
    suche.dispatchEvent(new Event("input", { bubbles: true }));
    const leiste = document.querySelector('[data-filter-chips="employees"]');
    const chips = [...leiste.querySelectorAll("[data-clear-filter]")];
    return {
      leisteSichtbar: !leiste.hidden,
      beschriftungen: chips.map((chip) => chip.textContent.replace(/\s+/g, " ").trim()),
    };
  });

  assert.equal(mitFilter.leisteSichtbar, true, "Die Leiste zeigt sich mit dem Filter");
  // Die Beschriftung kommt aus dem Bedienelement selbst - hier aus dem
  // Eingetippten.
  assert.equal(
    mitFilter.beschriftungen.join(" | "),
    "Suche: Meier",
    "Der Chip nennt Filter und Wert",
  );

  // Und ein Klick auf den Chip räumt genau dieses Bedienelement ab.
  const nachKlick = await teo.evaluate(() => {
    document
      .querySelector('[data-filter-chips="employees"] [data-clear-filter]')
      .click();
    const leiste = document.querySelector('[data-filter-chips="employees"]');
    return {
      suchfeld: document.querySelector("#employeeSearch").value,
      chips: leiste.querySelectorAll("[data-clear-filter]").length,
    };
  });

  assert.equal(nachKlick.suchfeld, "", "Das Suchfeld ist leer");
  assert.equal(nachKlick.chips, 0, "Und der Chip ist weg");
});

test("Mehrere Filter stehen nebeneinander, jeder mit eigenem Chip", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("employees");
  const chips = await teo.evaluate(() => {
    const suche = document.querySelector("#employeeSearch");
    suche.value = "Meier";
    suche.dispatchEvent(new Event("input", { bubbles: true }));
    const status = document.querySelector('[data-status-filter]:not([data-status-filter="all"])');
    status?.click();
    return [
      ...document.querySelectorAll('[data-filter-chips="employees"] [data-clear-filter]'),
    ].map((chip) => chip.textContent.replace(/\s+/g, " ").trim());
  });

  assert.equal(chips.length, 2, `Erwartet zwei Chips, gefunden: ${chips.join(" | ")}`);
  assert.ok(chips.some((chip) => chip.startsWith("Suche:")));
  assert.ok(chips.some((chip) => chip.startsWith("Status:")));
});

test("Eine gemerkte Ansicht überlebt den Neustart", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  await teo.zeigeAnsicht("employees");
  await teo.evaluate(() => {
    const suche = document.querySelector("#employeeSearch");
    suche.value = "Meier";
    suche.dispatchEvent(new Event("input", { bubbles: true }));
    document
      .querySelector('[data-filter-chips="employees"] [data-remember-filters]')
      .click();
  });

  const gemerkt = await teo.evaluate(() => localStorage.getItem("teo-view-filters-v1"));
  assert.ok(gemerkt, "Die Ansicht liegt im Browserprofil");
  assert.match(gemerkt, /Meier/);

  // Neu geladen steht der Filter wieder da - und zwar im Bedienelement,
  // nicht nur als Chip.
  const nachNeustart = await openTeO(t, { angemeldetAls: "admin" });
  await nachNeustart.zeigeAnsicht("employees");
  const wiederhergestellt = await nachNeustart.page.waitForFunction(
    () => document.querySelector("#employeeSearch").value || null,
    null,
    { timeout: 5000 },
  );
  assert.equal(await wiederhergestellt.jsonValue(), "Meier");

  await nachNeustart.evaluate(() => {
    localStorage.removeItem("teo-view-filters-v1");
  });
});
