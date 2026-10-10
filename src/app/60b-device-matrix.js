  // Die Matrix und ihr Excel-Export zeigen dieselben Mitarbeiter: Wer im
  // Filter steht, steht auch in der Datei.
  function deviceMatrixEmployees() {
    return [...state.employees]
      .filter((employee) => {
        if (
          deviceEmployeeStatusFilter === "employed" &&
          employee.employmentStatus === "inactive"
        ) {
          return false;
        }
        if (
          !["all", "employed"].includes(deviceEmployeeStatusFilter) &&
          employee.employmentStatus !== deviceEmployeeStatusFilter
        ) {
          return false;
        }
        return (
          !deviceEmployeeSearchTerm ||
          searchKey(employeeSearchText(employee)).includes(deviceEmployeeSearchTerm)
        );
      })
      .sort(sortEmployees);
  }

  function renderDeviceInstructionMatrix() {
    const devices = filteredDevices();
    const employees = deviceMatrixEmployees();
    if (elements.exportDeviceMatrixExcelButton) {
      elements.exportDeviceMatrixExcelButton.disabled =
        !devices.length || !employees.length;
    }

    if (!state.devices.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Matrix noch nicht verfügbar",
        text: "Nach dem Anlegen eines Geräts erscheint hier die Einweisungsmatrix.",
        compact: true,
      });
      return;
    }
    if (!devices.length || !employees.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Keine Matrixeinträge für diese Filter",
        text: "Passen Sie die Geräte- oder Mitarbeiterfilter an.",
        compact: true,
      });
      return;
    }

    elements.deviceInstructionMatrix.innerHTML = `
      <div
        class="device-matrix-scroll"
        tabindex="0"
        aria-label="Einweisungsmatrix nach Mitarbeiter und Gerät"
      >
        <table class="device-matrix-table">
          <thead>
            <tr>
              <th scope="col">Mitarbeiter</th>
              ${devices
                .map((device) => {
                  const instructionPercentage =
                    getDeviceInstructionPercentage(device.id, employees);
                  return `
                    <th scope="col" title="${escapeHtml(deviceLabel(device))}">
                      <button
                        class="device-matrix-device"
                        type="button"
                        data-device-overview="${device.id}"
                        aria-label="Einweisungsübersicht für ${escapeHtml(deviceLabel(device))} anzeigen"
                      >
                        <span>${escapeHtml(device.manufacturer)}</span>
                        <strong>${escapeHtml(device.productName)}</strong>
                        <small class="completion-progress ${completionProgressTone(
                          instructionPercentage,
                        )}">
                          ${instructionPercentage} % eingewiesen
                        </small>
                      </button>
                    </th>
                  `;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
              .map(
                (employee) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="device-matrix-employee"
                        type="button"
                        data-device-employee-overview="${employee.id}"
                        aria-label="Geräteübersicht für ${escapeHtml(fullName(employee))} anzeigen"
                      >
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        ${
                          employee.qualifications.medizinproduktebeauftragter
                            ? '<small class="device-mpo-status is-qualified">Gerätebeauftragte/r</small>'
                            : ""
                        }
                      </button>
                    </th>
                    ${devices
                      .map((device) =>
                        renderDeviceMatrixCell(employee, device),
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="device-matrix-hint">
        Grün zeigt eine dokumentierte Einweisung. Gold kennzeichnet eine
        Herstellereinweisung als Gerätebeauftragte/r. Orange mit ↻ heißt: Die
        Einweisung ist durch eine angeordnete Neueinweisung nichtig. Gerätenamen
        und Statusfelder öffnen die jeweilige Detailübersicht.
      </p>
    `;
  }

  function filteredDeviceInstructions({
    searchTerm = deviceInstructionSearchTerm,
    sortKey = deviceInstructionSortKey,
  } = {}) {
    const normalizedSearchTerm = searchKey(searchTerm);
    const nachEingabe = sortKey === "createdAt";

    return [...state.deviceInstructions]
      .filter((instruction) => {
        if (!normalizedSearchTerm) return true;
        const device = getDevice(instruction.deviceId);
        const participantNames = instruction.participants
          .map((participant) => getEmployee(participant.employeeId))
          .filter(Boolean)
          .map(fullName);
        const searchableText = searchKey(
          [
            device?.productName,
            device?.manufacturer,
            instruction.instructorName,
            instruction.instructorType === "employee"
              ? "Interne Einweisung"
              : "Herstellereinweisung",
            instruction.date,
            String(instruction.createdAt || "").slice(0, 10),
            isDeviceInstructionValid(instruction) ? "" : "nichtig Neueinweisung",
            ...participantNames,
          ]
            .filter(Boolean)
            .join(" "),
        );
        return searchableText.includes(normalizedSearchTerm);
      })
      .sort((a, b) =>
        nachEingabe
          ? String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
            b.date.localeCompare(a.date)
          : b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
      );
  }

  function renderDeviceInstructionList() {
    elements.deviceInstructionSort.value = deviceInstructionSortKey;
    // Beide Sortierungen fallen auf das jeweils andere Datum zurueck, damit
    // gleichzeitig erfasste Nachweise eine stabile Reihenfolge behalten.
    const nachEingabe = deviceInstructionSortKey === "createdAt";
    const instructions = filteredDeviceInstructions();
    if (!instructions.length) {
      elements.deviceInstructionList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: state.deviceInstructions.length
              ? "Keine Einweisungen für diesen Filter"
              : "Noch keine Einweisungen dokumentiert",
            text: state.deviceInstructions.length
              ? "Passen Sie den Suchbegriff an."
              : "Gespeicherte Einweisungen erscheinen hier chronologisch.",
            compact: true,
          })}
        </section>
      `;
      return;
    }

    const shown = instructions.slice(0, deviceInstructionLogLimit);
    const remaining = instructions.length - shown.length;
    elements.deviceInstructionList.innerHTML = `
      <div class="device-instruction-log">
        ${shown
          .map((instruction) => {
            const device = getDevice(instruction.deviceId);
            if (!device) return "";
            const participantNames = instruction.participants
              .map((participant) => {
                const employee = getEmployee(participant.employeeId);
                if (!employee) return "";
                return `${fullName(employee)}${
                  participant.wasMedicalProductsOfficer
                    ? " · Gerätebeauftragte/r"
                    : ""
                }`;
              })
              .filter(Boolean);
            const voided = !isDeviceInstructionValid(instruction);
            return `
              <article class="device-instruction-log-row ${voided ? "is-voided" : ""}">
                <time datetime="${instruction.date}">
                  ${formatDate(instruction.date)}
                  ${
                    voided
                      ? `<small class="device-instruction-voided">nichtig seit ${formatDate(
                          deviceInstructionCutoff(instruction.deviceId),
                        )}</small>`
                      : ""
                  }
                  ${
                    nachEingabe
                      ? `<small>erfasst ${formatDate(
                          instruction.createdAt.slice(0, 10),
                        )}</small>`
                      : ""
                  }
                </time>
                <div class="device-instruction-log-device">
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}</small>
                </div>
                <div>
                  <strong>${escapeHtml(instruction.instructorName)}</strong>
                  <small>
                    ${
                      instruction.instructorType === "employee"
                        ? "Interne Einweisung"
                        : "Herstellereinweisung"
                    }
                  </small>
                </div>
                <div class="device-instruction-log-participants">
                  <strong>
                    ${instruction.participants.length} Teilnehmer/in${
                      instruction.participants.length === 1 ? "" : "nen"
                    }
                  </strong>
                  <small>${escapeHtml(participantNames.join(", "))}</small>
                </div>
                <div class="device-instruction-log-actions">
                  <button
                    class="icon-button"
                    type="button"
                    data-edit-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} bearbeiten"
                    title="Einweisung bearbeiten"
                  >
                    <svg><use href="#icon-edit"></use></svg>
                  </button>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Einweisung löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
        ${
          remaining
            ? `
              <button
                class="button button-secondary device-instruction-log-more"
                type="button"
                data-show-more-device-instructions
              >
                Weitere ${remaining} Einweisung${remaining === 1 ? "" : "en"} anzeigen
              </button>
            `
            : ""
        }
      </div>
    `;
    limitDeviceInstructionLogHeight();
  }

  function limitDeviceInstructionLogHeight() {
    const log = elements.deviceInstructionList.querySelector(
      ".device-instruction-log",
    );
    if (!log) return;
    log.style.maxHeight = "";
    const rows = [...log.querySelectorAll(".device-instruction-log-row")];
    if (rows.length <= VISIBLE_DEVICE_INSTRUCTION_ROWS || !log.offsetParent) {
      return;
    }
    const lastVisibleRow = rows[VISIBLE_DEVICE_INSTRUCTION_ROWS - 1];
    log.style.maxHeight = `${
      lastVisibleRow.offsetTop + lastVisibleRow.offsetHeight
    }px`;
  }

  function getDeviceInstructionPercentage(deviceId, employees) {
    if (!employees.length) return 0;
    const instructedEmployeeIds =
      deviceInstructionIndex().byDevice.get(deviceId) || EMPTY_EMPLOYEE_IDS;
    const instructedCount = employees.filter((employee) =>
      instructedEmployeeIds.has(employee.id),
    ).length;
    return Math.round((instructedCount / employees.length) * 100);
  }

  // Die Einweisungsmatrix stellt je Zelle dieselbe Frage: Welche Einweisungen
  // hat dieser Mitarbeiter an diesem Geraet? Ohne Index durchsucht jede der
  // Tausenden Zellen den gesamten Bestand samt Teilnehmerlisten. Ein Durchgang
  // beantwortet alle Fragen; der Index haelt, solange die Sammlung dieselbe
  // bleibt - sie wird bei jeder Aenderung neu aufgebaut.
  const EMPTY_EMPLOYEE_IDS = new Set();
  const deviceInstructionIndexCache = {
    instructions: null,
    devices: null,
    count: -1,
    value: { byPair: new Map(), byDevice: new Map() },
  };

  function deviceInstructionIndex() {
    const cache = deviceInstructionIndexCache;
    if (
      cache.instructions === state.deviceInstructions &&
      cache.devices === state.devices &&
      cache.count === state.deviceInstructions.length
    ) {
      return cache.value;
    }

    // byDevice kennt nur gueltig Eingewiesene; byPair behaelt auch die durch
    // eine Neueinweisung nichtigen Nachweise fuer den Verlauf.
    const cutoffs = new Map(
      state.devices.map((device) => [device.id, deviceInstructionCutoff(device)]),
    );
    const byPair = new Map();
    const byDevice = new Map();
    for (const instruction of state.deviceInstructions) {
      let employeeIds = byDevice.get(instruction.deviceId);
      if (!employeeIds) {
        employeeIds = new Set();
        byDevice.set(instruction.deviceId, employeeIds);
      }
      const valid = isDeviceInstructionValid(
        instruction,
        cutoffs.get(instruction.deviceId) || "",
      );
      for (const participant of instruction.participants) {
        if (valid) employeeIds.add(participant.employeeId);
        const key = `${instruction.deviceId}|${participant.employeeId}`;
        const bucket = byPair.get(key);
        if (bucket) bucket.push(instruction);
        else byPair.set(key, [instruction]);
      }
    }
    for (const bucket of byPair.values()) {
      bucket.sort((a, b) => b.date.localeCompare(a.date));
    }

    cache.instructions = state.deviceInstructions;
    cache.devices = state.devices;
    cache.count = state.deviceInstructions.length;
    cache.value = { byPair, byDevice };
    return cache.value;
  }

  // Gemeinsam genutzt von der Einweisungsmatrix und der Jahresauswertung der
  // Pflichtfortbildungen, damit beide denselben Farbmassstab verwenden.
  function completionProgressTone(percentage) {
    if (percentage <= 65) return "is-low";
    if (percentage <= 80) return "is-medium";
    return "is-high";
  }

  function renderDeviceMatrixCell(employee, device) {
    const instructions =
      deviceInstructionIndex().byPair.get(`${device.id}|${employee.id}`) || [];
    if (!instructions.length) {
      return `
        <td>
          <span class="device-matrix-status is-missing" aria-label="Keine Einweisung">×</span>
        </td>
      `;
    }
    const latest = instructions[0];
    const cutoff = deviceInstructionCutoff(device);
    const validInstructions = instructions.filter((instruction) =>
      isDeviceInstructionValid(instruction, cutoff),
    );
    if (!validInstructions.length) {
      return `
        <td>
          <button
            class="device-matrix-status is-voided"
            type="button"
            data-device-history-employee="${employee.id}"
            data-device-history-device="${device.id}"
            aria-label="Einweisung von ${escapeHtml(fullName(employee))} in ${escapeHtml(
              deviceLabel(device),
            )} vom ${formatDate(latest.date)} ist nichtig seit ${formatDate(
              cutoff,
            )}, Neueinweisung nötig"
            title="Nichtig seit ${formatDate(cutoff)} – Neueinweisung nötig"
          >
            <span>↻</span>
            <small>${formatDate(latest.date)}</small>
          </button>
        </td>
      `;
    }
    const hasManufacturerOfficerInstruction = validInstructions.some(
      (instruction) =>
        instruction.instructorType === "manufacturer" &&
        instruction.participants.some(
          (participant) =>
            participant.employeeId === employee.id &&
            participant.wasMedicalProductsOfficer,
        ),
    );
    return `
      <td>
        <button
          class="device-matrix-status ${
            hasManufacturerOfficerInstruction
              ? "is-manufacturer-officer"
              : "is-complete"
          }"
          type="button"
          data-device-history-employee="${employee.id}"
          data-device-history-device="${device.id}"
          aria-label="${instructions.length} Einweisung${instructions.length === 1 ? "" : "en"} für ${escapeHtml(
            fullName(employee),
          )} in ${escapeHtml(deviceLabel(device))} anzeigen${
            hasManufacturerOfficerInstruction
              ? ", Herstellereinweisung als Gerätebeauftragte/r vorhanden"
              : ""
          }"
        >
          <span>✓</span>
          <small>${formatDate(latest.date)}</small>
          ${instructions.length > 1 ? `<i>${instructions.length}</i>` : ""}
        </button>
      </td>
    `;
  }

  function handleDeviceAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "add-device-instruction") openDeviceInstructionDialog(id);
    if (action === "edit-device") openDeviceDialog(id);
    if (action === "delete-device") requestDeleteDevice(id);
    if (action === "reinstruct-device") openDeviceReinstructionDialog(id);
  }

  function handleDeviceMatrixAction(event) {
    const deviceButton = event.target.closest("[data-device-overview]");
    if (deviceButton) {
      openDeviceOverview(deviceButton.dataset.deviceOverview);
      return;
    }
    const employeeButton = event.target.closest(
      "[data-device-employee-overview]",
    );
    if (employeeButton) {
      openDeviceEmployeeOverview(
        employeeButton.dataset.deviceEmployeeOverview,
      );
      return;
    }
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceHistoryAction(event) {
    const button = event.target.closest("[data-delete-device-instruction]");
    if (!button) return;
    requestDeleteDeviceInstruction(button.dataset.deleteDeviceInstruction);
  }

  function handleDeviceEmployeeOverviewAction(event) {
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceInstructionListAction(event) {
    const moreButton = event.target.closest("[data-show-more-device-instructions]");
    if (moreButton) {
      // Die Blickposition im Protokoll bleibt erhalten, sonst spraenge der
      // Kasten beim Nachladen an den Anfang zurueck.
      const log = moreButton.closest(".device-instruction-log");
      const scrollTop = log?.scrollTop || 0;
      deviceInstructionLogLimit += DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
      const refreshed = elements.deviceInstructionList.querySelector(
        ".device-instruction-log",
      );
      if (refreshed) refreshed.scrollTop = scrollTop;
      return;
    }
    const editButton = event.target.closest("[data-edit-device-instruction]");
    if (editButton) {
      openDeviceInstructionDialog(
        null,
        editButton.dataset.editDeviceInstruction,
      );
      return;
    }
    const deleteButton = event.target.closest("[data-delete-device-instruction]");
    if (deleteButton) {
      requestDeleteDeviceInstruction(deleteButton.dataset.deleteDeviceInstruction);
    }
  }

  function openDeviceDialog(deviceId = null) {
    elements.deviceForm.reset();
    document.querySelector("#deviceId").value = "";
    document.querySelector("#deviceCurrentInventory").checked = true;
    ["#deviceProductName", "#deviceManufacturer", "#deviceCategory"].forEach(
      (selector) => document.querySelector(selector).setCustomValidity(""),
    );
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    document.querySelector("#deviceCategoryOptions").innerHTML = categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}"></option>`,
      )
      .join("");

    const device = deviceId ? getDevice(deviceId) : null;
    elements.deviceDialogTitle.textContent = device
      ? "Gerät bearbeiten"
      : "Gerät anlegen";
    elements.deviceSubmitLabel.textContent = device
      ? "Änderungen speichern"
      : "Gerät speichern";
    if (device) {
      document.querySelector("#deviceId").value = device.id;
      document.querySelector("#deviceProductName").value = device.productName;
      document.querySelector("#deviceManufacturer").value = device.manufacturer;
      document.querySelector("#deviceCategory").value = device.category;
      document.querySelector("#deviceAnnex1").value = device.annex1
        ? "yes"
        : "no";
      document.querySelector("#deviceCurrentInventory").checked =
        device.currentInventory;
    }
    elements.deviceDialog.showModal();
    captureCleanForm(elements.deviceForm);
    window.setTimeout(
      () => document.querySelector("#deviceProductName").focus(),
      0,
    );
  }

  async function handleDeviceSubmit(event) {
    event.preventDefault();
    const productName = document.querySelector("#deviceProductName");
    const manufacturer = document.querySelector("#deviceManufacturer");
    const category = document.querySelector("#deviceCategory");
    [
      [productName, "Bitte einen Produktnamen eingeben."],
      [manufacturer, "Bitte einen Hersteller eingeben."],
      [category, "Bitte eine Gerätekategorie eingeben."],
    ].forEach(([input, message]) => {
      input.setCustomValidity(input.value.trim() ? "" : message);
    });
    if (!elements.deviceForm.reportValidity()) return;

    const deviceId = document.querySelector("#deviceId").value;
    const existingDevice = deviceId ? getDevice(deviceId) : null;
    const now = new Date().toISOString();
    const device = {
      id: existingDevice?.id || createId(),
      productName: productName.value.trim(),
      manufacturer: manufacturer.value.trim(),
      category: category.value.trim(),
      annex1: document.querySelector("#deviceAnnex1").value === "yes",
      currentInventory: document.querySelector("#deviceCurrentInventory").checked,
      instructionResets: existingDevice?.instructionResets || [],
      createdAt: existingDevice?.createdAt || now,
      updatedAt: now,
    };
    const committed = await commitStateMutation(() => {
      if (existingDevice) {
        state.devices = state.devices.map((item) =>
          item.id === device.id ? device : item,
        );
      } else {
        state.devices.push(device);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceForm);
    elements.deviceDialog.close();
    showToast(
      existingDevice ? "Gerät wurde aktualisiert." : "Gerät wurde angelegt.",
    );
  }

  function requestDeleteDevice(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    const instructionCount = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === deviceId,
    ).length;
    requestConfirmation({
      title: "Gerät löschen?",
      message: `„${deviceLabel(device)}“ wird dauerhaft entfernt.${
        instructionCount
          ? ` ${instructionCount} Einweisungsnachweis${
              instructionCount === 1 ? "" : "e"
            } werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Gerät löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.devices = state.devices.filter((item) => item.id !== deviceId);
          state.deviceInstructions = state.deviceInstructions.filter(
            (instruction) => instruction.deviceId !== deviceId,
          );
        }, { undo: "Gerät gelöscht" });
        if (committed) showUndoToast("Gerät wurde gelöscht.");
      },
    });
  }
