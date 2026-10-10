  function toggleDeviceMatrixMaximized() {
    setDeviceMatrixMaximized(
      !elements.deviceMatrixWidget.classList.contains("is-maximized"),
    );
  }

  function setDeviceMatrixMaximized(maximized) {
    const active = Boolean(maximized);
    const widget = elements.deviceMatrixWidget;
    if (active && !deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor = document.createComment("device-matrix-widget-anchor");
      widget.parentNode.insertBefore(deviceMatrixWidgetAnchor, widget);
      document.body.append(widget);
    } else if (!active && deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor.parentNode?.insertBefore(widget, deviceMatrixWidgetAnchor);
      deviceMatrixWidgetAnchor.remove();
      deviceMatrixWidgetAnchor = null;
    }
    widget.classList.toggle("is-maximized", active);
    document.body.classList.toggle("is-device-matrix-maximized", active);
    elements.toggleDeviceMatrixMaximizeButton.setAttribute(
      "aria-pressed",
      String(active),
    );
    elements.toggleDeviceMatrixMaximizeButton.title = active
      ? "Einweisungsmatrix verkleinern (Esc)"
      : "Einweisungsmatrix maximieren";
    elements.deviceMatrixMaximizeLabel.textContent = active
      ? "Verkleinern"
      : "Maximieren";
    elements.deviceMatrixMaximizeIcon.setAttribute(
      "href",
      active ? "#icon-minimize" : "#icon-maximize",
    );
  }

  function handleDeviceMatrixMaximizeKeydown(event) {
    if (
      event.key !== "Escape" ||
      !elements.deviceMatrixWidget.classList.contains("is-maximized") ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    event.preventDefault();
    setDeviceMatrixMaximized(false);
    elements.toggleDeviceMatrixMaximizeButton.focus();
  }

  function renderDevices() {
    renderViewFilterChips("devices");
    renderViewFilterChips("device-management");
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    const categoryOptions = `
      <option value="all">Alle Kategorien</option>
      ${categories
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
        )
        .join("")}
    `;
    if (
      deviceCategoryFilter !== "all" &&
      !categories.includes(deviceCategoryFilter)
    ) {
      deviceCategoryFilter = "all";
    }
    if (
      deviceManagementCategoryFilter !== "all" &&
      !categories.includes(deviceManagementCategoryFilter)
    ) {
      deviceManagementCategoryFilter = "all";
    }
    elements.deviceCategoryFilter.innerHTML = categoryOptions;
    elements.deviceManagementCategoryFilter.innerHTML = categoryOptions;
    elements.deviceCategoryFilter.value = deviceCategoryFilter;
    elements.deviceManagementCategoryFilter.value =
      deviceManagementCategoryFilter;
    const authorizedEmployees = [
      ...new Map(
        state.devices
          .flatMap((device) => getDeviceAuthorizedEmployees(device.id))
          .map((employee) => [employee.id, employee]),
      ).values(),
    ].sort(sortEmployees);
    const validAuthorizationFilters = new Set([
      "all",
      "assigned",
      "unassigned",
      ...authorizedEmployees.map((employee) => `employee:${employee.id}`),
    ]);
    if (!validAuthorizationFilters.has(deviceManagementAuthorizationFilter)) {
      deviceManagementAuthorizationFilter = "all";
    }
    elements.deviceManagementAuthorizationFilter.innerHTML = `
      <option value="all">Alle Geräte</option>
      <option value="assigned">Mit Einweisungsberechtigten</option>
      <option value="unassigned">Ohne Einweisungsberechtigte</option>
      ${authorizedEmployees
        .map(
          (employee) =>
            `<option value="employee:${employee.id}">${escapeHtml(fullName(employee))}</option>`,
        )
        .join("")}
    `;
    elements.deviceManagementAuthorizationFilter.value =
      deviceManagementAuthorizationFilter;
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceManagementInventoryFilter.value =
      deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;

    const instructedEmployeeIds = new Set(
      state.deviceInstructions
        .filter((instruction) => isDeviceInstructionValid(instruction))
        .flatMap((instruction) =>
          instruction.participants.map((participant) => participant.employeeId),
        ),
    );
    const openReinstructions = getOpenDeviceReinstructions().reduce(
      (sum, { status }) => sum + status.pending.length,
      0,
    );
    elements.deviceSummary.innerHTML = `
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => device.currentInventory).length,
        "verfügbare Geräte",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => device.currentInventory && device.annex1,
        ).length,
        "aktuelle Geräte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "check",
        state.deviceInstructions.length,
        "dokumentierte Einweisungen",
        "teal",
      )}
      ${renderSummaryChip(
        "check",
        instructedEmployeeIds.size,
        "Mitarbeiter mit Einweisung",
        "teal",
      )}
      ${
        openReinstructions
          ? renderSummaryChip(
              "alert",
              openReinstructions,
              "Neueinweisungen offen",
              "orange",
            )
          : ""
      }
    `;
    elements.deviceManagementSummary.innerHTML = `
      ${renderSummaryChip("empty", state.devices.length, "Geräte gesamt")}
      ${renderSummaryChip(
        "check",
        state.devices.filter((device) => device.currentInventory).length,
        "aktuell im Bestand",
        "teal",
      )}
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => !device.currentInventory).length,
        "nicht mehr im Bestand",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter((device) => device.annex1).length,
        "Medizinprodukte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => getDeviceAuthorizedEmployees(device.id).length === 0,
        ).length,
        "ohne Einweisungsberechtigte",
        "orange",
      )}
    `;

    const visibleDevices = filteredDevices({
      inventoryFilter: deviceManagementInventoryFilter,
      annexFilter: deviceManagementAnnexFilter,
      categoryFilter: deviceManagementCategoryFilter,
      searchTerm: deviceManagementSearchTerm,
      authorizationFilter: deviceManagementAuthorizationFilter,
    });
    if (!state.devices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Geräte",
            text: "Legen Sie das erste Gerät an, bevor Einweisungen dokumentiert werden.",
            buttonText: "Erstes Gerät anlegen",
            buttonAttribute: "data-empty-add-device",
          })}
        </section>
      `;
      elements.deviceCatalog
        .querySelector("[data-empty-add-device]")
        ?.addEventListener("click", () => openDeviceDialog());
    } else if (!visibleDevices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Keine Geräte für diese Filter",
            text: deviceManagementSearchTerm
              ? "Passen Sie den Suchbegriff oder die Filter an."
              : "Passen Sie die Filter der Geräteverwaltung an.",
            compact: true,
          })}
        </section>
      `;
    } else {
      elements.deviceCatalog.innerHTML = visibleDevices
        .map(renderDeviceCard)
        .join("");
    }

    renderDeviceInstructionMatrix();
    renderDeviceInstructionList();
    refreshRecordInspector("device");
  }

  function filteredDevices({
    inventoryFilter = deviceInventoryFilter,
    annexFilter = deviceAnnexFilter,
    categoryFilter = deviceCategoryFilter,
    searchTerm = deviceSearchTerm,
    authorizationFilter = "all",
  } = {}) {
    return [...state.devices]
      .filter((device) => {
        if (inventoryFilter === "current" && !device.currentInventory) {
          return false;
        }
        if (inventoryFilter === "former" && device.currentInventory) {
          return false;
        }
        if (annexFilter === "yes" && !device.annex1) return false;
        if (annexFilter === "no" && device.annex1) return false;
        if (categoryFilter !== "all" && device.category !== categoryFilter) {
          return false;
        }
        // Die Berechtigten je Geraet zu ermitteln kostet einen Durchgang
        // durch alle Einweisungen. Gefragt wird danach nur, wenn auch
        // danach gefiltert wird - sonst zahlte jeder Aufbau der Geraeteliste
        // und der Matrix einen Durchgang je Geraet, ohne dass das Ergebnis
        // jemanden interessiert.
        if (authorizationFilter !== "all") {
          const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
          if (authorizationFilter === "assigned" && !authorizedEmployees.length) {
            return false;
          }
          if (authorizationFilter === "unassigned" && authorizedEmployees.length) {
            return false;
          }
          if (
            authorizationFilter.startsWith("employee:") &&
            !authorizedEmployees.some(
              (employee) =>
                employee.id === authorizationFilter.slice("employee:".length),
            )
          ) {
            return false;
          }
        }
        const normalizedSearchTerm = searchKey(searchTerm);
        if (!normalizedSearchTerm) return true;
        return searchKey(
          `${device.productName} ${device.manufacturer}`,
        ).includes(normalizedSearchTerm);
      })
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      );
  }

  function createDeviceExcelWorkbook(devices = state.devices) {
    const headers = [
      "ID bzw. Nummer",
      "Hersteller",
      "Produktname",
      "Gerätekategorie",
      "Anlage 1",
      "aktuell",
      "Neueinweisung seit",
      "Grund der Neueinweisung",
    ];
    const rows = [...devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.id.localeCompare(b.id, "de"),
      )
      .map((device) => {
        const reset = latestDeviceInstructionReset(device);
        return [
          device.id,
          device.manufacturer,
          device.productName,
          device.category,
          device.annex1 ? "Ja" : "Nein",
          device.currentInventory ? "Ja" : "Nein",
          reset ? formatDate(reset.effectiveDate) : "",
          reset?.reason || "",
        ];
      });
    const escapeXml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    const renderRow = (values, styleId) =>
      `<Row>${values
        .map(
          (value) =>
            `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join("")}</Row>`;
    const rowCount = rows.length + 1;

    return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" />
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#222222" />
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A6A6A6" /></Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#222222" />
   <Interior ss:Color="#E7E6E6" ss:Pattern="Solid" />
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center" ss:WrapText="1" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9" /></Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Geräte">
  <Table ss:ExpandedColumnCount="8" ss:ExpandedRowCount="${rowCount}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Width="150" />
   <Column ss:Width="120" />
   <Column ss:Width="150" />
   <Column ss:Width="130" />
   <Column ss:Width="70" />
   <Column ss:Width="70" />
   <Column ss:Width="110" />
   <Column ss:Width="200" />
   ${renderRow(headers, "Header")}
   ${rows.map((row) => renderRow(row, "Data")).join("\n   ")}
  </Table>
  <AutoFilter x:Range="R1C1:R${rowCount}C8" xmlns="urn:schemas-microsoft-com:office:excel" />
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes />
   <FrozenNoSplit />
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
  }

  function exportDeviceCatalogExcel() {
    const workbook = createDeviceExcelWorkbook(state.devices);
    const date = todayIso();
    downloadTextFile(
      `TeO-Geraetekatalog-${date}.xls`,
      workbook,
      "application/vnd.ms-excel;charset=utf-8",
    );
    showToast(
      `${state.devices.length} Gerät${state.devices.length === 1 ? "" : "e"} wurden nach Excel exportiert.`,
    );
  }

  function renderDeviceCard(device) {
    const cutoff = deviceInstructionCutoff(device);
    const instructions = state.deviceInstructions.filter(
      (instruction) =>
        instruction.deviceId === device.id &&
        isDeviceInstructionValid(instruction, cutoff),
    );
    const participantCount = new Set(
      instructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    ).size;
    const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
    return `
      <article
        class="training-card device-card ${device.currentInventory ? "" : "is-former"}"
        data-record-card="${device.id}"
        tabindex="0"
        aria-label="Schnellansicht zu ${escapeHtml(deviceLabel(device))} öffnen"
      >
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-empty"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(device.productName)}</h2>
              <p>${escapeHtml(device.manufacturer)} · ${escapeHtml(device.category)}</p>
              <span class="training-meta">
                ${device.currentInventory ? "Aktueller Gerätebestand" : "Nicht mehr im Gerätebestand"}
                ·
                ${device.annex1 ? "Medizinprodukt der Anlage 1" : "Kein Medizinprodukt der Anlage 1"}
                · ${participantCount} eingewiesene${participantCount === 1 ? "/r" : ""}
                Mitarbeiter/in${participantCount === 1 ? "" : "nen"}
              </span>
              <div class="device-authorization-summary ${
                authorizedEmployees.length ? "" : "is-missing"
              }">
                <strong>Einweisungsberechtigt</strong>
                <span>
                  ${
                    authorizedEmployees.length
                      ? authorizedEmployees
                          .map(
                            (employee) =>
                              `<span class="device-authorization-person">${escapeHtml(
                                fullName(employee),
                              )}</span>`,
                          )
                          .join("")
                      : "Keine einweisungsberechtigte Person hinterlegt"
                  }
                </span>
              </div>
              ${deviceReinstructionNotice(device)}
            </div>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-device-instruction"
              data-id="${device.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Einweisung
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="reinstruct-device"
              data-id="${device.id}"
              aria-label="Neueinweisung für ${escapeHtml(device.productName)} anordnen"
              title="Neueinweisung anordnen"
            >
              <svg><use href="#icon-alert"></use></svg>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function getDeviceAuthorizedEmployees(deviceId) {
    const authorizedEmployeeIds = new Set(
      state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.instructorType === "manufacturer" &&
            isDeviceInstructionValid(instruction),
        )
        .flatMap((instruction) =>
          instruction.participants
            .filter((participant) => participant.wasMedicalProductsOfficer)
            .map((participant) => participant.employeeId),
        ),
    );
    return [...authorizedEmployeeIds]
      .map(getEmployee)
      .filter(Boolean)
      .sort(sortEmployees);
  }
