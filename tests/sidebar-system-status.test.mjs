import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";

after(closeTeO);

test("Der Systemstatus steht zwischen Konto und Programminfo", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Gemessen an der Lage auf dem Bildschirm, nicht an der Reihenfolge im
  // Quelltext: Die Seitenleiste ist umsortierbar, das Markup sagt darüber
  // nichts.
  const lage = await teo.evaluate(() => {
    const oben = (selector) =>
      document.querySelector(selector)?.getBoundingClientRect().top ?? null;
    return {
      konto: oben("#currentUsername"),
      status: oben("#sidebarSystemStatus"),
      programm: oben("#projectBuildLabel"),
      felder: [
        "sidebarConnectionLabel",
        "sidebarBackendLabel",
        "sidebarServerLabel",
        "sidebarRevisionLabel",
        "sidebarSchemaLabel",
        "sidebarSyncLabel",
      ].filter((id) => !document.querySelector(`#${id}`)),
    };
  });

  assert.equal(lage.felder.join(", "), "", "Diese Statusfelder fehlen");
  assert.ok(lage.status > lage.konto, "Der Status steht unter dem Konto");
  assert.ok(lage.programm > lage.status, "und über der Programminfo");
});

test("Im lokalen Betrieb nennt der Status Speicherort und letzte Speicherung", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  // Ohne eingerichteten Server läuft TeO lokal. Dann verdichtet der Status
  // die Technik auf zwei verständliche Punkte; die Serverzeilen treten ab.
  const gezeigt = await teo.evaluate(() => {
    const status = document.querySelector("#sidebarSystemStatus");
    const zeilen = [...status.querySelectorAll("dl > div")];
    return {
      lokal: status.classList.contains("is-local"),
      verbindung: document.querySelector("#sidebarConnectionLabel").textContent.trim(),
      sichtbar: zeilen
        .filter((zeile) => !zeile.hidden)
        .map((zeile) => zeile.querySelector("dt")?.textContent.trim()),
      speicherort: document.querySelector("#sidebarBackendLabel").textContent.trim(),
      abgleich: document.querySelector("#sidebarSyncLabel").textContent.trim(),
    };
  });

  assert.equal(gezeigt.lokal, true);
  assert.equal(gezeigt.verbindung, "Lokal bereit");
  assert.equal(
    gezeigt.sichtbar.join(", "),
    "Speicherort, Zuletzt gespeichert",
    "Revision und DB-Schema gehören nicht zum lokalen Betrieb",
  );
  assert.equal(gezeigt.speicherort, "Dieses Browserprofil");
  assert.match(gezeigt.abgleich, /lokale Speicherung/);
});

test("Der Status färbt sich nach seinem Zustand", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin" });
  if (!teo) return;

  const farben = await teo.evaluate(() => {
    const status = document.querySelector("#sidebarSystemStatus");
    const merke = status.className;
    const lies = (klasse) => {
      status.className = `${merke.replace(/is-(local|connected|error)/g, "")} ${klasse}`;
      return getComputedStyle(status.querySelector(".sidebar-system-status-dot"))
        .backgroundColor;
    };
    const ergebnis = {
      lokal: lies("is-local"),
      verbunden: lies("is-connected"),
      fehler: lies("is-error"),
    };
    status.className = merke;
    return ergebnis;
  });

  // Ein Fehler muss sich von einem geordneten Betrieb unterscheiden - sonst
  // sagt die Anzeige nichts. Lokal und verbunden sind beide in Ordnung und
  // teilen sich bewusst dieselbe Farbe.
  assert.notEqual(farben.lokal, farben.fehler, "Lokal und Fehler sehen gleich aus");
  assert.notEqual(farben.verbunden, farben.fehler, "Verbunden und Fehler sehen gleich aus");
  assert.equal(farben.lokal, farben.verbunden);
});
