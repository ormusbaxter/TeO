import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loadAppFunctions } from "./helpers/load-app.mjs";

test("Geräteverwaltung bietet einen Excel-Export mit Tabellen-Icon an", async () => {
  const [indexHtml, uiSource] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app.js", import.meta.url), "utf8"),
  ]);

  assert.match(indexHtml, /id="icon-spreadsheet"/);
  assert.match(
    indexHtml,
    /id="exportDeviceCatalogExcelButton"[\s\S]*href="#icon-spreadsheet"[\s\S]*Export Excel/,
  );
  assert.match(
    uiSource,
    /exportDeviceCatalogExcelButton\.addEventListener\([\s\S]*exportDeviceCatalogExcel/,
  );
});

test("Excel-Export enthält alle Gerätespalten und den vollständigen Katalog", async () => {
  const app = await loadAppFunctions(["createDeviceExcelWorkbook"]);
  const workbook = app.createDeviceExcelWorkbook([
    {
      id: "MP-002",
      manufacturer: "Hersteller & Partner",
      productName: "Zeta <Plus>",
      category: "Monitoring",
      annex1: false,
      currentInventory: false,
    },
    {
      id: "MP-001",
      manufacturer: "Muster GmbH",
      productName: "Alpha",
      category: "Beatmung",
      annex1: true,
      currentInventory: true,
      instructionResets: [
        {
          id: "reset-1",
          effectiveDate: "2026-09-01",
          reason: "Softwareupdate 3.2",
          createdAt: "2026-09-01T08:00:00.000Z",
        },
      ],
    },
  ]);

  assert.ok(workbook.startsWith("\uFEFF<?xml"));
  assert.match(workbook, /mso-application progid="Excel\.Sheet"/);
  assert.match(workbook, /ss:ExpandedColumnCount="8" ss:ExpandedRowCount="3"/);
  for (const header of [
    "ID bzw. Nummer",
    "Hersteller",
    "Produktname",
    "Gerätekategorie",
    "Anlage 1",
    "aktuell",
    "Neueinweisung seit",
    "Grund der Neueinweisung",
  ]) {
    assert.match(workbook, new RegExp(`>${header}<`));
  }
  assert.ok(workbook.indexOf(">Alpha<") < workbook.indexOf(">Zeta &lt;Plus&gt;<"));
  assert.match(workbook, />Hersteller &amp; Partner</);
  assert.match(
    workbook,
    />MP-001<[\s\S]*>Ja<[\s\S]*>Ja<[\s\S]*>01\.09\.2026<[\s\S]*>Softwareupdate 3\.2</,
  );
  assert.match(workbook, />MP-002<[\s\S]*>Nein<[\s\S]*>Nein</);
  assert.match(workbook, /<AutoFilter x:Range="R1C1:R3C8"/);
  assert.match(workbook, /<FreezePanes \/>/);
});
