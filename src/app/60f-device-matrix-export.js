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

  function createDeviceMatrixWorkbook(
    devices = filteredDevices(),
    employees = deviceMatrixEmployees(),
  ) {
    const rows = [
      [
        { value: "Mitarbeiter", style: "header" },
        ...devices.map((device) => ({
          value: deviceMatrixColumnLabel(device),
          style: "header",
        })),
      ],
      ...employees.map((employee) => [
        { value: deviceMatrixRowLabel(employee), style: "rowHeader" },
        ...devices.map((device) => ({
          value: latestValidDeviceInstructionDate(employee, device),
          type: "date",
        })),
      ]),
    ];
    return createXlsxWorkbook({
      sheetName: "Einweisungsmatrix",
      rows,
      columnWidths: [42, ...devices.map(() => 18)],
      headerHeight: 48,
    });
  }

  function exportDeviceMatrixExcel() {
    const devices = filteredDevices();
    const employees = deviceMatrixEmployees();
    if (!devices.length || !employees.length) {
      showToast("Für diese Filter enthält die Einweisungsmatrix keine Einträge.", "warning");
      return;
    }
    downloadTextFile(
      `TeO-Einweisungsmatrix-${todayIso()}.xlsx`,
      createDeviceMatrixWorkbook(devices, employees),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    showToast(
      `Einweisungsmatrix mit ${employees.length} Mitarbeiter${
        employees.length === 1 ? "" : "n"
      } und ${devices.length} Gerät${devices.length === 1 ? "" : "en"} wurde nach Excel exportiert.`,
    );
  }

  // --- Office Open XML -------------------------------------------------------
  // Eine Arbeitsmappe mit einem Blatt, Texte als Inline-Zeichenketten, Daten
  // als Excel-Seriennummer mit Datumsformat. Die erste Zeile und die erste
  // Spalte sind fixiert, die Kopfzeile trägt einen Autofilter.
  const XLSX_STYLE_INDEX = { default: 0, header: 1, rowHeader: 2, date: 3 };

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
    const style = XLSX_STYLE_INDEX[cell.type === "date" ? "date" : cell.style] || 0;
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

  function createXlsxWorkbook({ sheetName, rows, columnWidths = [], headerHeight }) {
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const lastCell = `${xlsxColumnName(columnCount - 1)}${Math.max(1, rows.length)}`;
    const sheetRows = rows
      .map((row, rowIndex) => {
        const height =
          rowIndex === 0 && headerHeight
            ? ` ht="${headerHeight}" customHeight="1"`
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
    const xmlHead = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const mainNs = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    const relNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const packageRelNs = "http://schemas.openxmlformats.org/package/2006/relationships";

    const sheet = `${xmlHead}<worksheet xmlns="${mainNs}" xmlns:r="${relNs}">\
<dimension ref="A1:${lastCell}"/>\
<sheetViews><sheetView workbookViewId="0">\
<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>\
<selection pane="topRight"/><selection pane="bottomLeft"/>\
<selection pane="bottomRight" activeCell="B2" sqref="B2"/>\
</sheetView></sheetViews>\
<sheetFormatPr defaultRowHeight="15"/>${columns}\
<sheetData>${sheetRows}</sheetData>\
<autoFilter ref="A1:${lastCell}"/>\
<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>\
<pageSetup orientation="landscape" paperSize="9"/>\
</worksheet>`;

    // Einfache Anfuehrungszeichen am Rahmenstil: Die Strukturpruefung sucht
    // style-Attribute in doppelten Anfuehrungszeichen als verbotenes
    // HTML-Attribut, hier ist es Excel-XML.
    const styles = `${xmlHead}<styleSheet xmlns="${mainNs}">\
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\.mm\\.yyyy"/></numFmts>\
<fonts count="2">\
<font><sz val="11"/><color rgb="FF222222"/><name val="Calibri"/><family val="2"/></font>\
<font><b/><sz val="11"/><color rgb="FF222222"/><name val="Calibri"/><family val="2"/></font>\
</fonts>\
<fills count="3">\
<fill><patternFill patternType="none"/></fill>\
<fill><patternFill patternType="gray125"/></fill>\
<fill><patternFill patternType="solid"><fgColor rgb="FFE7E6E6"/><bgColor indexed="64"/></patternFill></fill>\
</fills>\
<borders count="2">\
<border><left/><right/><top/><bottom/><diagonal/></border>\
<border><left/><right/><top/><bottom style='thin'><color rgb="FFA6A6A6"/></bottom><diagonal/></border>\
</borders>\
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>\
<cellXfs count="4">\
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>\
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>\
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>\
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>\
</cellXfs>\
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>\
</styleSheet>`;

    const workbook = `${xmlHead}<workbook xmlns="${mainNs}" xmlns:r="${relNs}">\
<sheets><sheet name="${escapeXlsxText(String(sheetName).slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>\
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${escapeXlsxText(
      String(sheetName).slice(0, 31).replaceAll("'", "''"),
    )}'!$A$1:$${xlsxColumnName(columnCount - 1)}$${Math.max(1, rows.length)}</definedName></definedNames>\
</workbook>`;

    return createZipArchive([
      {
        name: "[Content_Types].xml",
        content: `${xmlHead}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\
<Default Extension="xml" ContentType="application/xml"/>\
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\
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
<Relationship Id="rId1" Type="${relNs}/worksheet" Target="worksheets/sheet1.xml"/>\
<Relationship Id="rId2" Type="${relNs}/styles" Target="styles.xml"/>\
</Relationships>`,
      },
      { name: "xl/styles.xml", content: styles },
      { name: "xl/worksheets/sheet1.xml", content: sheet },
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
