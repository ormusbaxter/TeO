import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

after(closeTeO);

// Liest ein ZIP-Archiv über sein zentrales Verzeichnis - so, wie Excel es
// tut. Stimmen Versätze oder Prüfsummen nicht, fällt das hier auf.
function entpacke(bytes) {
  const puffer = Buffer.from(bytes);
  const ende = puffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(ende >= 0, "Kein Ende des zentralen Verzeichnisses");
  const anzahl = puffer.readUInt16LE(ende + 10);
  let stelle = puffer.readUInt32LE(ende + 16);
  const dateien = new Map();
  for (let i = 0; i < anzahl; i += 1) {
    assert.equal(puffer.readUInt32LE(stelle), 0x02014b50);
    const methode = puffer.readUInt16LE(stelle + 10);
    const pruefsumme = puffer.readUInt32LE(stelle + 16);
    const groesse = puffer.readUInt32LE(stelle + 20);
    const namenslaenge = puffer.readUInt16LE(stelle + 28);
    const lokal = puffer.readUInt32LE(stelle + 42);
    const name = puffer.toString("utf8", stelle + 46, stelle + 46 + namenslaenge);
    assert.equal(puffer.readUInt32LE(lokal), 0x04034b50, `Kopf von ${name}`);
    const beginn = lokal + 30 + puffer.readUInt16LE(lokal + 26) + puffer.readUInt16LE(lokal + 28);
    const roh = puffer.subarray(beginn, beginn + puffer.readUInt32LE(stelle + 24));
    const inhalt = methode === 8 ? inflateRawSync(roh) : roh;
    assert.equal(inhalt.length, groesse, `Größe von ${name}`);
    assert.equal(crc32(inhalt), pruefsumme, `Prüfsumme von ${name}`);
    dateien.set(name, inhalt.toString("utf8"));
    stelle += 46 + namenslaenge + puffer.readUInt16LE(stelle + 30) + puffer.readUInt16LE(stelle + 32);
  }
  return dateien;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Zellen eines Blatts als { A1: { wert, stil, typ } } - genug, um Kopfzeilen,
// Texte und Datumswerte zu prüfen.
function zellen(blatt) {
  const ergebnis = {};
  for (const [, ref, attribute, rumpf = ""] of blatt.matchAll(
    /<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
  )) {
    const text = /<t[^>]*>([\s\S]*?)<\/t>/.exec(rumpf)?.[1];
    const zahl = /<v>([\s\S]*?)<\/v>/.exec(rumpf)?.[1];
    ergebnis[ref] = {
      wert: text ?? (zahl === undefined ? "" : Number(zahl)),
      stil: /s="(\d+)"/.exec(attribute)?.[1],
    };
  }
  return ergebnis;
}

// Excel zählt Tage ab dem 30.12.1899.
const seriell = (iso) => (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000;

function geraet(id, manufacturer, productName, extra = {}) {
  return {
    id,
    manufacturer,
    productName,
    category: "Infusion",
    annex1: true,
    currentInventory: true,
    instructionResets: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...extra,
  };
}

function einweisung(id, deviceId, date, employeeIds) {
  return {
    id,
    deviceId,
    date,
    instructorType: "manufacturer",
    instructorEmployeeId: "",
    instructorName: "Außendienst",
    instructorWasMedicalProductsOfficer: false,
    participants: employeeIds.map((employeeId) => ({
      employeeId,
      wasMedicalProductsOfficer: false,
    })),
    createdAt: `${date}T10:00:00.000Z`,
  };
}

function bestand() {
  const mueller = {
    ...createEmployee("e-mueller"),
    firstName: "Anna",
    lastName: "Müller",
    nameChanges: [
      { date: "2015-06-01", firstName: "Anna", lastName: "Schmidt", reason: "Heirat" },
      { date: "2020-06-01", firstName: "Anna", lastName: "Meier", reason: "Heirat" },
    ],
    qualifications: { medizinproduktebeauftragter: true },
  };
  const becker = { ...createEmployee("e-becker"), firstName: "Ben", lastName: "Becker & Co" };
  const inaktiv = {
    ...createEmployee("e-inaktiv"),
    firstName: "Ina",
    lastName: "Alt",
    employmentStatus: "inactive",
    active: false,
  };
  return createMinimalState({
    employees: [mueller, becker, inaktiv],
    devices: [
      geraet("d-pumpe", "Braun", "Perfusor <Space>"),
      geraet("d-beatmung", "Dräger", "Evita V500", {
        instructionResets: [
          { id: "r1", effectiveDate: "2026-09-01", reason: "Update", createdAt: "2026-09-01T08:00:00.000Z" },
        ],
      }),
      geraet("d-alt", "Alt", "Ausgemustert", { currentInventory: false }),
      geraet("d-ohne", "Braun", "Infusion ohne Anlage", { annex1: false }),
    ],
    deviceInstructions: [
      einweisung("i1", "d-pumpe", "2025-02-03", ["e-mueller", "e-becker"]),
      einweisung("i2", "d-pumpe", "2026-04-20", ["e-mueller"]),
      // Vor dem Stichtag: nichtig, zählt nicht als letzte Einweisung.
      einweisung("i3", "d-beatmung", "2026-03-01", ["e-mueller", "e-becker"]),
      einweisung("i4", "d-beatmung", "2026-09-01", ["e-becker"]),
    ],
  });
}

const BLAETTER = ["Alle Geräte", "Anlage 1", "Außer Anlage 1", "Nicht in Betrieb"];

// Spaltenköpfe ab C eines Blatts, in Reihenfolge.
function geraetespalten(c) {
  return Object.keys(c)
    .filter((ref) => /^[A-Z]+3$/.test(ref) && !["A3", "B3"].includes(ref))
    .map((ref) => c[ref].wert);
}

test("Excel-Export der Einweisungsmatrix: ein Blatt je Geräteauswahl, alle Mitarbeiter", async () => {
  const app = await loadAppFunctions(["createDeviceMatrixWorkbook"]);
  app.setState(bestand());

  const dateien = entpacke(app.createDeviceMatrixWorkbook());
  for (const teil of [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
    "xl/worksheets/sheet4.xml",
  ]) {
    assert.ok(dateien.has(teil), `${teil} fehlt`);
  }
  const mappe = dateien.get("xl/workbook.xml");
  assert.equal(
    [...mappe.matchAll(/<sheet name="([^"]+)"/g)].map((m) => m[1]).join("|"),
    BLAETTER.join("|"),
  );
  const blaetter = BLAETTER.map((_, i) => zellen(dateien.get(`xl/worksheets/sheet${i + 1}.xml`)));

  // Die Geräte verteilen sich auf die Blätter, unabhängig vom Matrixfilter
  // (der zeigt nur aktuelle Geräte).
  assert.equal(
    geraetespalten(blaetter[0]).join("|"),
    "Alt Ausgemustert|Dräger Evita V500|Braun Infusion ohne Anlage|Braun Perfusor &lt;Space&gt;",
  );
  assert.equal(
    geraetespalten(blaetter[1]).join("|"),
    "Dräger Evita V500|Braun Perfusor &lt;Space&gt;",
  );
  assert.equal(geraetespalten(blaetter[2]).join("|"), "Braun Infusion ohne Anlage");
  assert.equal(geraetespalten(blaetter[3]).join("|"), "Alt Ausgemustert");

  // Titel und Erläuterung über der Tabelle, Kopfzeile in Zeile 3.
  const c = blaetter[1];
  assert.equal(c.A1.wert, "Einweisungsmatrix – Anlage 1");
  assert.match(String(c.A2.wert), /^Stand \d{2}\.\d{2}\.\d{4} · /);
  assert.equal(c.A3.wert, "Mitarbeiter");
  assert.equal(c.B3.wert, "Status");

  // Alle Mitarbeiter, auch inaktive; die Spalte Status schaltet per Autofilter.
  assert.equal(c.A4.wert, "Alt, Ina");
  assert.equal(c.B4.wert, "Inaktiv");
  assert.equal(c.A5.wert, "Becker &amp; Co, Ben");
  assert.equal(c.B5.wert, "Aktiv");
  assert.equal(c.A6.wert, "Müller, geb. Schmidt, Anna, MP-Beauftragte/r");

  assert.equal(c.C5.wert, seriell("2026-09-01"));
  assert.equal(c.D5.wert, seriell("2025-02-03"));
  assert.equal(c.C6.wert, "", "nichtige Einweisung zählt nicht");
  assert.equal(c.D6.wert, seriell("2026-04-20"), "jüngste Einweisung");

  // Datumszellen tragen das Datumsformat TT.MM.JJJJ und sind grün
  // hinterlegt, leere nicht; Inaktive stehen in eigener, grauer Schrift.
  const styles = dateien.get("xl/styles.xml");
  const xfs = [...styles.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)[1].matchAll(/<xf [^>]*>/g)].map(
    (m) => m[0],
  );
  const fuellungen = [...styles.match(/<fills[^>]*>([\s\S]*?)<\/fills>/)[1].matchAll(/<fill>[\s\S]*?<\/fill>/g)].map(
    (m) => m[0],
  );
  const fuellung = (zelle) => fuellungen[Number(/fillId="(\d+)"/.exec(xfs[Number(zelle.stil)])[1])];
  assert.match(xfs[Number(c.D6.stil)], /numFmtId="164"/);
  assert.match(fuellung(c.D6), /rgb="FFE2F5EB"/);
  assert.match(fuellung(c.C6), /patternType="none"/);
  assert.notEqual(c.A4.stil, c.A5.stil);
  assert.match(styles, /numFmtId="164" formatCode="dd\\.mm\\.yyyy"/);
  assert.match(styles, /<name val="Segoe UI"\/>/);

  const blatt = dateien.get("xl/worksheets/sheet2.xml");
  assert.match(blatt, /<pane xSplit="2" ySplit="3" topLeftCell="C4"[^>]*state="frozen"/);
  assert.match(blatt, /<autoFilter ref="A3:D6"\/>/);
  assert.match(blatt, /showGridLines="0"/);
  assert.match(mappe, /localSheetId="1" hidden="1">'Anlage 1'!\$A\$3:\$D\$6</);
  assert.match(mappe, /_xlnm\.Print_Titles" localSheetId="1">'Anlage 1'!\$A:\$B,'Anlage 1'!\$1:\$3</);
});

test("Ein Geburtsname, der dem heutigen Nachnamen entspricht, erscheint nicht", async () => {
  const app = await loadAppFunctions(["createDeviceMatrixWorkbook"]);
  const daten = bestand();
  daten.employees[0].nameChanges = [
    { date: "2015-06-01", firstName: "Anni", lastName: "Müller", reason: "Vorname" },
  ];
  app.setState(daten);
  const c = zellen(entpacke(app.createDeviceMatrixWorkbook()).get("xl/worksheets/sheet1.xml"));
  assert.equal(c.A6.wert, "Müller, Anna, MP-Beauftragte/r");
});

test("Export Excel an der Einweisungsmatrix lädt alle Mitarbeiter und Geräte herunter", async (t) => {
  const teo = await openTeO(t, { angemeldetAls: "admin", mitDemodaten: true });
  if (!teo) return;
  await teo.zeigeAnsicht("devices");
  // Ein Matrixfilter wirkt nicht auf den Export.
  await teo.page.fill("#deviceEmployeeSearch", "Ahrens");

  const [download] = await Promise.all([
    teo.page.waitForEvent("download"),
    teo.page.click("#exportDeviceMatrixExcelButton"),
  ]);
  assert.match(download.suggestedFilename(), /^TeO-Einweisungsmatrix-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const { readFile } = await import("node:fs/promises");
  const dateien = entpacke(await readFile(await download.path()));
  const c = zellen(dateien.get("xl/worksheets/sheet1.xml"));

  const zeilen = Object.keys(c).filter((ref) => /^A\d+$/.test(ref)).length - 3;
  assert.equal(zeilen, 60);
  assert.ok(geraetespalten(c).length > 0);
  assert.ok(
    Object.values(c).some((zelle) => typeof zelle.wert === "number"),
    "mindestens ein Einweisungsdatum",
  );
});
