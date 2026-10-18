  // Excel-Export der Einweisungsmatrix: Geräte als Spalten, Mitarbeiter als
  // Zeilen, je Zelle das Datum der letzten gültigen Einweisung. Die Datei
  // entsteht ganz im Browser als echtes .xlsx (Office Open XML), damit Excel
  // sie ohne Warnung öffnet und die Daten als Datum sortieren und filtern kann.
  function deviceMatrixColumnLabel(device) {
    return `${device.manufacturer} ${device.productName}`.trim();
  }

  // Als Geburtsname gilt der Nachname des ältesten eingetragenen Namens -
  // sofern er sich vom heutigen unterscheidet.
  function employeeBirthName(employee) {
    const earliest = (employee.nameChanges || [])[0];
    const birthName = String(earliest?.lastName || "").trim();
    return birthName && birthName !== String(employee.lastName || "").trim()
      ? birthName
      : "";
  }

  function deviceMatrixRowLabel(employee) {
    const birthName = employeeBirthName(employee);
    return [
      employee.lastName,
      birthName ? `geb. ${birthName}` : "",
      employee.firstName,
      employee.qualifications?.medizinproduktebeauftragter
        ? "MP-Beauftragte/r"
        : "",
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  // Durch eine angeordnete Neueinweisung nichtige Nachweise zählen nicht: Die
  // Zelle bleibt dann leer wie bei einer fehlenden Einweisung.
  function latestValidDeviceInstructionDate(employee, device) {
    const instructions =
      deviceInstructionIndex().byPair.get(`${device.id}|${employee.id}`) || [];
    const cutoff = deviceInstructionCutoff(device);
    return (
      instructions.find((instruction) =>
        isDeviceInstructionValid(instruction, cutoff),
      )?.date || ""
    );
  }

  // Unabhängig von den Filtern der Matrix: Die Datei enthält alle Mitarbeiter
  // und je Geräteauswahl ein Blatt. Umgeschaltet wird in Excel - zwischen den
  // Geräten über die Blattreiter, zwischen den Mitarbeitern über den
  // Autofilter der Spalte Status. Spalten lassen sich in Excel ohne Makros
  // nicht filtern, deshalb die Blätter.
  const DEVICE_MATRIX_EXPORT_SHEETS = [
    { name: "Alle Geräte", tabColor: "2166D1", matches: () => true },
    {
      name: "Anlage 1",
      tabColor: "197149",
      matches: (device) => device.currentInventory && device.annex1,
    },
    {
      name: "Außer Anlage 1",
      tabColor: "5E6D7C",
      matches: (device) => device.currentInventory && !device.annex1,
    },
    {
      name: "Nicht in Betrieb",
      tabColor: "9BA6B2",
      matches: (device) => !device.currentInventory,
    },
  ];

  function deviceMatrixExportDevices() {
    return [...state.devices].sort(
      (a, b) =>
        a.productName.localeCompare(b.productName, "de") ||
        a.manufacturer.localeCompare(b.manufacturer, "de"),
    );
  }

  // Aufbau je Blatt: Titel, eine Zeile Erläuterung, dann die Tabelle. Grün
  // hinterlegt ist, wer gültig eingewiesen ist - wie in der Matrix. Inaktive
  // Mitarbeiter stehen grau, damit sie beim Lesen zurücktreten.
  function createDeviceMatrixSheet(sheet, devices, employees, today = todayIso()) {
    const header = (value) => ({ value, style: "header" });
    return {
      name: sheet.name,
      tabColor: sheet.tabColor,
      headerRow: 2,
      frozenColumns: 2,
      rowHeights: { 0: 28, 1: 20, 2: 66 },
      defaultRowHeight: 18,
      columnWidths: [40, 15, ...devices.map(() => 15)],
      rows: [
        [{ value: `Einweisungsmatrix – ${sheet.name}`, style: "title" }],
        [
          {
            value: `Stand ${formatDate(today)} · Datum der letzten gültigen Einweisung, leer = keine gültige Einweisung · Mitarbeiter über den Filter in „Status“ wählen`,
            style: "subtitle",
          },
        ],
        [
          { value: "Mitarbeiter", style: "headerLeft" },
          { value: "Status", style: "headerLeft" },
          ...devices.map((device) => header(deviceMatrixColumnLabel(device))),
        ],
        ...employees.map((employee) => {
          const muted = employee.employmentStatus === "inactive";
          return [
            {
              value: deviceMatrixRowLabel(employee),
              style: muted ? "rowHeaderMuted" : "rowHeader",
            },
            {
              value: EMPLOYMENT_STATUSES[employee.employmentStatus] || "",
              style: muted ? "statusMuted" : "status",
            },
            ...devices.map((device) => {
              const date = latestValidDeviceInstructionDate(employee, device);
              return date
                ? { value: date, type: "date", style: "date" }
                : { value: "", style: "empty" };
            }),
          ];
        }),
      ],
    };
  }

  function createDeviceMatrixWorkbook(
    devices = deviceMatrixExportDevices(),
    employees = deviceInstructionEmployees().sort(sortEmployees),
  ) {
    return createXlsxWorkbook(
      DEVICE_MATRIX_EXPORT_SHEETS.map((sheet) =>
        createDeviceMatrixSheet(sheet, devices.filter(sheet.matches), employees),
      ),
    );
  }

  function exportDeviceMatrixExcel() {
    const employees = deviceInstructionEmployees().sort(sortEmployees);
    if (!state.devices.length || !employees.length) {
      showToast("Für den Export fehlen noch Geräte oder Mitarbeiter.", "warning");
      return;
    }
    downloadTextFile(
      `TeO-Einweisungsmatrix-${todayIso()}.xlsx`,
      createDeviceMatrixWorkbook(deviceMatrixExportDevices(), employees),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    showToast(
      `Einweisungsmatrix mit ${employees.length} Mitarbeiter${
        employees.length === 1 ? "" : "n"
      } und ${state.devices.length} Gerät${
        state.devices.length === 1 ? "" : "en"
      } wurde nach Excel exportiert.`,
    );
  }

  // --- Office Open XML -------------------------------------------------------
  // Eine Arbeitsmappe mit einem oder mehreren Blättern, Texte als
  // Inline-Zeichenketten, Daten als Excel-Seriennummer mit Datumsformat. Je
  // Blatt sind die Kopfzeile und die vorderen Spalten fixiert, die Kopfzeile
  // trägt einen Autofilter.
  // Farben aus den Farbmarken von TeO (00-foundation.css), Schrift Segoe UI
  // wie auf jedem Windows-Arbeitsplatz vorhanden. Die Reihenfolge ergibt den
  // Index in cellXfs.
  const XLSX_CELL_STYLES = [
    "default",
    "header",
    "headerLeft",
    "rowHeader",
    "rowHeaderMuted",
    "status",
    "statusMuted",
    "date",
    "empty",
    "title",
    "subtitle",
  ];
  const XLSX_STYLE_INDEX = Object.fromEntries(
    XLSX_CELL_STYLES.map((name, index) => [name, index]),
  );

  function xlsxColumnName(index) {
    let name = "";
    for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) {
      name = String.fromCharCode(65 + ((rest - 1) % 26)) + name;
    }
    return name;
  }

  function xlsxDateSerial(isoDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ""));
    if (!match) return null;
    const days =
      (Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) -
        Date.UTC(1899, 11, 30)) /
      86400000;
    return Number.isFinite(days) ? days : null;
  }

  function escapeXlsxText(value) {
    return String(value ?? "")
      // Steuerzeichen sind in XML 1.0 nicht erlaubt und machen die Datei für
      // Excel unlesbar.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderXlsxCell(cell, reference) {
    const style =
      XLSX_STYLE_INDEX[cell.style] ?? (cell.type === "date" ? XLSX_STYLE_INDEX.date : 0);
    if (cell.type === "date") {
      const serial = xlsxDateSerial(cell.value);
      return serial === null
        ? `<c r="${reference}" s="${style}"/>`
        : `<c r="${reference}" s="${style}"><v>${serial}</v></c>`;
    }
    const text = String(cell.value ?? "");
    if (!text) return `<c r="${reference}" s="${style}"/>`;
    return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXlsxText(
      text,
    )}</t></is></c>`;
  }

  function renderXlsxSheet({
    name,
    rows,
    columnWidths = [],
    headerRow = 0,
    frozenColumns = 1,
    rowHeights = {},
    defaultRowHeight = 15,
    tabColor = "",
  }) {
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const lastColumn = xlsxColumnName(columnCount - 1);
    const lastRow = Math.max(headerRow + 1, rows.length);
    const firstRow = headerRow + 1;
    const filterRange = `A${firstRow}:${lastColumn}${lastRow}`;
    const topLeft = `${xlsxColumnName(frozenColumns)}${firstRow + 1}`;
    const sheetRows = rows
      .map((row, rowIndex) => {
        const height = rowHeights[rowIndex]
          ? ` ht="${rowHeights[rowIndex]}" customHeight="1"`
          : "";
        return `<row r="${rowIndex + 1}"${height}>${row
          .map((cell, columnIndex) =>
            renderXlsxCell(cell, `${xlsxColumnName(columnIndex)}${rowIndex + 1}`),
          )
          .join("")}</row>`;
      })
      .join("");
    const columns = columnWidths.length
      ? `<cols>${columnWidths
          .map(
            (width, index) =>
              `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
          )
          .join("")}</cols>`
      : "";
    const quotedName = `'${xlsxSheetName(name).replaceAll("'", "''")}'`;
    return {
      filterRange: `${quotedName}!$A$${firstRow}:$${lastColumn}$${lastRow}`,
      // Beim Drucken wiederholen sich Kopfzeile und Namensspalten auf jeder
      // Seite.
      printTitles: `${quotedName}!$A:$${xlsxColumnName(Math.max(0, frozenColumns - 1))},${quotedName}!$1:$${firstRow}`,
      xml: `${XLSX_XML_HEAD}<worksheet xmlns="${XLSX_MAIN_NS}" xmlns:r="${XLSX_REL_NS}">\
<sheetPr>${tabColor ? `<tabColor rgb="FF${tabColor}"/>` : ""}</sheetPr>\
<dimension ref="A1:${lastColumn}${lastRow}"/>\
<sheetViews><sheetView showGridLines="0" workbookViewId="0">\
<pane xSplit="${frozenColumns}" ySplit="${firstRow}" topLeftCell="${topLeft}" activePane="bottomRight" state="frozen"/>\
<selection pane="topRight"/><selection pane="bottomLeft"/>\
<selection pane="bottomRight" activeCell="${topLeft}" sqref="${topLeft}"/>\
</sheetView></sheetViews>\
<sheetFormatPr defaultRowHeight="${defaultRowHeight}" customHeight="1"/>${columns}\
<sheetData>${sheetRows}</sheetData>\
<autoFilter ref="${filterRange}"/>\
<printOptions horizontalCentered="1"/>\
<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>\
<pageSetup paperSize="9" orientation="landscape"/>\
<headerFooter><oddFooter>&amp;L&amp;8&amp;A&amp;R&amp;8Seite &amp;P von &amp;N</oddFooter></headerFooter>\
</worksheet>`,
    };
  }

  const XLSX_XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const XLSX_MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const XLSX_REL_NS =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const XLSX_PACKAGE_REL_NS =
    "http://schemas.openxmlformats.org/package/2006/relationships";

  // Blattnamen: höchstens 31 Zeichen, ohne : \ / ? * [ ]
  function xlsxSheetName(name) {
    return String(name || "Tabelle").replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
  }

  function createXlsxWorkbook(sheets) {
    const xmlHead = XLSX_XML_HEAD;
    const mainNs = XLSX_MAIN_NS;
    const relNs = XLSX_REL_NS;
    const packageRelNs = XLSX_PACKAGE_REL_NS;
    const rendered = sheets.map((sheet) => ({
      ...renderXlsxSheet(sheet),
      name: xlsxSheetName(sheet.name),
    }));

    // Einfache Anfuehrungszeichen am Rahmenstil: Die Strukturpruefung sucht
    // style-Attribute in doppelten Anfuehrungszeichen als verbotenes
    // HTML-Attribut, hier ist es Excel-XML.
    const font = (size, color, extra = "") =>
      `<font>${extra}<sz val="${size}"/><color rgb="FF${color}"/><name val="Segoe UI"/><family val="2"/></font>`;
    const fill = (color) =>
      `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`;
    const side = (edge, color) => `<${edge} style='thin'><color rgb="FF${color}"/></${edge}>`;
    const border = (color) =>
      `<border>${["left", "right", "top", "bottom"].map((edge) => side(edge, color)).join("")}<diagonal/></border>`;
    // Schriften: 0 Text, 1 Kopf, 2 Name, 3 Titel, 4 Erläuterung, 5 Datum, 6 inaktiv
    const fonts = [
      font(10, "29384A"),
      font(10, "FFFFFF", "<b/>"),
      font(10, "182230", "<b/>"),
      font(15, "182230", "<b/>"),
      font(9, "5E6D7C"),
      font(10, "197149"),
      font(10, "9BA6B2", "<i/>"),
    ];
    // Füllungen: 0 und 1 verlangt Excel, 2 Kopf, 3 eingewiesen, 4 Namensspalte
    const fills = [
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      fill("2166D1"),
      fill("E2F5EB"),
      fill("F7F8FA"),
    ];
    // Rahmen: 0 keiner, 1 Tabelle, 2 Kopf
    const borders = [
      "<border><left/><right/><top/><bottom/><diagonal/></border>",
      border("E1E6EB"),
      border("1B57B3"),
    ];
    const xf = ({ font: fontId = 0, fill: fillId = 0, border: borderId = 0, numFmt = 0, align = "" }) =>
      `<xf numFmtId="${numFmt}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment ${align}/></xf>`;
    const cellFormats = {
      default: xf({}),
      header: xf({ font: 1, fill: 2, border: 2, align: 'horizontal="center" vertical="center" wrapText="1"' }),
      headerLeft: xf({ font: 1, fill: 2, border: 2, align: 'horizontal="left" vertical="center" indent="1"' }),
      rowHeader: xf({ font: 2, fill: 4, border: 1, align: 'vertical="center" indent="1"' }),
      rowHeaderMuted: xf({ font: 6, fill: 4, border: 1, align: 'vertical="center" indent="1"' }),
      status: xf({ font: 0, fill: 4, border: 1, align: 'vertical="center" indent="1"' }),
      statusMuted: xf({ font: 6, fill: 4, border: 1, align: 'vertical="center" indent="1"' }),
      date: xf({ font: 5, fill: 3, border: 1, numFmt: 164, align: 'horizontal="center" vertical="center"' }),
      empty: xf({ border: 1, align: 'horizontal="center" vertical="center"' }),
      title: xf({ font: 3, align: 'vertical="center"' }),
      subtitle: xf({ font: 4, align: 'vertical="center"' }),
    };
    // Einfache Anfuehrungszeichen am Rahmenstil: Die Strukturpruefung sucht
    // style-Attribute in doppelten Anfuehrungszeichen als verbotenes
    // HTML-Attribut, hier ist es Excel-XML.
    const styles = `${xmlHead}<styleSheet xmlns="${mainNs}">\
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\.mm\\.yyyy"/></numFmts>\
<fonts count="${fonts.length}">${fonts.join("")}</fonts>\
<fills count="${fills.length}">${fills.join("")}</fills>\
<borders count="${borders.length}">${borders.join("")}</borders>\
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>\
<cellXfs count="${XLSX_CELL_STYLES.length}">${XLSX_CELL_STYLES.map((name) => cellFormats[name]).join("")}</cellXfs>\
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>\
</styleSheet>`;

    const workbook = `${xmlHead}<workbook xmlns="${mainNs}" xmlns:r="${relNs}">\
<sheets>${rendered
      .map(
        (sheet, index) =>
          `<sheet name="${escapeXlsxText(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
      )
      .join("")}</sheets>\
<definedNames>${rendered
      .map(
        (sheet, index) =>
          `<definedName name="_xlnm._FilterDatabase" localSheetId="${index}" hidden="1">${escapeXlsxText(
            sheet.filterRange,
          )}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="${index}">${escapeXlsxText(
            sheet.printTitles,
          )}</definedName>`,
      )
      .join("")}</definedNames>\
</workbook>`;

    return createZipArchive([
      {
        name: "[Content_Types].xml",
        content: `${xmlHead}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\
<Default Extension="xml" ContentType="application/xml"/>\
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\
${rendered
  .map(
    (sheet, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("")}\
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>\
</Types>`,
      },
      {
        name: "_rels/.rels",
        content: `${xmlHead}<Relationships xmlns="${packageRelNs}">\
<Relationship Id="rId1" Type="${relNs}/officeDocument" Target="xl/workbook.xml"/>\
</Relationships>`,
      },
      { name: "xl/workbook.xml", content: workbook },
      {
        name: "xl/_rels/workbook.xml.rels",
        content: `${xmlHead}<Relationships xmlns="${packageRelNs}">\
${rendered
  .map(
    (sheet, index) =>
      `<Relationship Id="rId${index + 1}" Type="${relNs}/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  )
  .join("")}\
<Relationship Id="rId${rendered.length + 1}" Type="${relNs}/styles" Target="styles.xml"/>\
</Relationships>`,
      },
      { name: "xl/styles.xml", content: styles },
      ...rendered.map((sheet, index) => ({
        name: `xl/worksheets/sheet${index + 1}.xml`,
        content: sheet.xml,
      })),
    ]);
  }

  // --- ZIP ohne Kompression --------------------------------------------------
  // Ein .xlsx ist ein ZIP-Archiv. Gespeichert wird unkomprimiert ("stored"):
  // Das braucht nur CRC-32 und ein paar Kopfzeilen, keine Bibliothek.
  let crc32Table = null;

  function crc32(bytes) {
    if (!crc32Table) {
      crc32Table = new Uint32Array(256);
      for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crc32Table[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) {
      crc = crc32Table[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createZipArchive(files, date = new Date()) {
    const encoder = new TextEncoder();
    const dosTime =
      (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate =
      ((Math.max(1980, date.getFullYear()) - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();
    const entries = files.map((file) => {
      const name = encoder.encode(file.name);
      const data =
        typeof file.content === "string" ? encoder.encode(file.content) : file.content;
      return { name, data, crc: crc32(data) };
    });
    const localSize = entries.reduce(
      (sum, entry) => sum + 30 + entry.name.length + entry.data.length,
      0,
    );
    const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
    const archive = new Uint8Array(localSize + centralSize + 22);
    const view = new DataView(archive.buffer);
    let offset = 0;
    const writeHeader = (signature, entry, central, localOffset) => {
      view.setUint32(offset, signature, true);
      offset += 4;
      if (central) {
        view.setUint16(offset, 20, true); // erstellt mit Version 2.0
        offset += 2;
      }
      view.setUint16(offset, 20, true); // benötigt Version 2.0
      view.setUint16(offset + 2, 0x0800, true); // Dateinamen in UTF-8
      view.setUint16(offset + 4, 0, true); // keine Kompression
      view.setUint16(offset + 6, dosTime, true);
      view.setUint16(offset + 8, dosDate, true);
      view.setUint32(offset + 10, entry.crc, true);
      view.setUint32(offset + 14, entry.data.length, true);
      view.setUint32(offset + 18, entry.data.length, true);
      view.setUint16(offset + 22, entry.name.length, true);
      view.setUint16(offset + 24, 0, true);
      offset += 26;
      if (central) {
        view.setUint16(offset, 0, true); // Kommentar
        view.setUint16(offset + 2, 0, true); // Datenträger
        view.setUint16(offset + 4, 0, true); // interne Attribute
        view.setUint32(offset + 6, 0, true); // externe Attribute
        view.setUint32(offset + 10, localOffset, true);
        offset += 14;
      }
      archive.set(entry.name, offset);
      offset += entry.name.length;
    };
    const localOffsets = entries.map((entry) => {
      const localOffset = offset;
      writeHeader(0x04034b50, entry, false);
      archive.set(entry.data, offset);
      offset += entry.data.length;
      return localOffset;
    });
    const centralOffset = offset;
    entries.forEach((entry, index) =>
      writeHeader(0x02014b50, entry, true, localOffsets[index]),
    );
    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true);
    view.setUint16(offset + 6, 0, true);
    view.setUint16(offset + 8, entries.length, true);
    view.setUint16(offset + 10, entries.length, true);
    view.setUint32(offset + 12, centralSize, true);
    view.setUint32(offset + 16, centralOffset, true);
    view.setUint16(offset + 20, 0, true);
    return archive;
  }
