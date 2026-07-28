  function renderAppointments() {
    const today = todayIso();
    const upcoming = [...state.appointments]
      .filter((appointment) => appointment.date >= today)
      .sort(sortAppointments);
    const past = [...state.appointments]
      .filter((appointment) => appointment.date < today)
      .sort((a, b) => sortAppointments(b, a));
    const todayCount = upcoming.filter((appointment) => appointment.date === today).length;

    elements.appointmentSummary.innerHTML = `
      ${renderSummaryChip("calendar", state.appointments.length, "Termine gesamt")}
      ${renderSummaryChip("alert", upcoming.length, "anstehende Termine", "orange")}
      ${renderSummaryChip("check", todayCount, "Termine heute", "teal")}
    `;

    if (state.appointments.length === 0) {
      elements.appointmentList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Termine",
            text: "Legen Sie den ersten Termin an. Anstehende Termine erscheinen automatisch im Fristenmonitor.",
            buttonText: "Ersten Termin anlegen",
            buttonAttribute: "data-empty-add-appointment",
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-empty-add-appointment]")
        ?.addEventListener("click", () => openAppointmentDialog());
      return;
    }

    elements.appointmentList.innerHTML = `
      ${
        upcoming.length
          ? `<section class="appointment-group">
              <h2 class="appointment-group-title">Anstehende Termine</h2>
              ${upcoming.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
      ${
        past.length
          ? `<section class="appointment-group appointment-group-past">
              <h2 class="appointment-group-title">Vergangene Termine</h2>
              ${past.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
    `;
  }

  function sortAppointments(a, b) {
    return (
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title, "de")
    );
  }

  function renderAppointmentCard(appointment) {
    const daysUntil = daysBetween(
      parseLocalDate(todayIso()),
      parseLocalDate(appointment.date),
    );
    const timeLabel = formatAppointmentTime(appointment);
    const meta = [
      formatDate(appointment.date),
      timeLabel,
      appointment.location,
    ].filter(Boolean);
    return `
      <article
        class="meeting-card appointment-card ${daysUntil < 0 ? "is-past" : ""}"
        data-appointment-card="${appointment.id}"
      >
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon appointment-icon">
              <svg><use href="#icon-calendar"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(appointment.title)}</h2>
              <p>${escapeHtml(appointment.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${escapeHtml(meta.join(" · "))}
              </span>
            </div>
          </div>
          <div class="appointment-date-status">
            <strong>${formatDate(appointment.date)}</strong>
            <span>${escapeHtml(appointmentRelativeLabel(daysUntil))}</span>
          </div>
          <div class="training-actions">
            <button
              class="icon-button"
              type="button"
              data-action="edit-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function formatAppointmentTime(appointment) {
    if (appointment.startTime && appointment.endTime) {
      return `${formatTime(appointment.startTime)}–${formatTime(
        appointment.endTime,
      )} Uhr`;
    }
    return appointment.startTime ? `ab ${formatTime(appointment.startTime)} Uhr` : "";
  }

  function appointmentRelativeLabel(daysUntil) {
    if (daysUntil === 0) return "Heute";
    if (daysUntil === 1) return "Morgen";
    if (daysUntil > 1) return `In ${daysUntil} Tagen`;
    if (daysUntil === -1) return "Gestern";
    return `Vor ${Math.abs(daysUntil)} Tagen`;
  }

  function renderDevices() {
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
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceManagementInventoryFilter.value =
      deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;

    const instructedEmployeeIds = new Set(
      state.deviceInstructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
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
    `;

    const visibleDevices = filteredDevices({
      inventoryFilter: deviceManagementInventoryFilter,
      annexFilter: deviceManagementAnnexFilter,
      categoryFilter: deviceManagementCategoryFilter,
      searchTerm: deviceManagementSearchTerm,
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
              : "Passen Sie Anlage-1- oder Kategoriefilter an.",
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
  }

  function filteredDevices({
    inventoryFilter = deviceInventoryFilter,
    annexFilter = deviceAnnexFilter,
    categoryFilter = deviceCategoryFilter,
    searchTerm = deviceSearchTerm,
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
        if (!searchTerm) return true;
        return `${device.productName} ${device.manufacturer}`
          .toLocaleLowerCase("de-DE")
          .includes(searchTerm);
      })
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      );
  }

  function renderDeviceCard(device) {
    const instructions = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === device.id,
    );
    const participantCount = new Set(
      instructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    ).size;
    return `
      <article class="training-card device-card ${
        device.currentInventory ? "" : "is-former"
      }">
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

  function renderDeviceInstructionMatrix() {
    const devices = filteredDevices();
    const employees = [...state.employees]
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
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceEmployeeSearchTerm)
        );
      })
      .sort(sortEmployees);

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
                      <span>${escapeHtml(device.manufacturer)}</span>
                      <strong>${escapeHtml(device.productName)}</strong>
                      <small class="completion-progress ${completionProgressTone(
                        instructionPercentage,
                      )}">
                        ${instructionPercentage} % eingewiesen
                      </small>
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
                      <strong>${escapeHtml(fullName(employee))}</strong>
                      ${
                        employee.qualifications.medizinproduktebeauftragter
                          ? '<small class="device-mpo-status is-qualified">Gerätebeauftragte/r</small>'
                          : ""
                      }
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
        Herstellereinweisung als Gerätebeauftragte/r. Per Klick öffnet sich der Verlauf.
      </p>
    `;
  }

  function renderDeviceInstructionList() {
    const instructions = [...state.deviceInstructions].sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.createdAt.localeCompare(a.createdAt),
    );
    if (!instructions.length) {
      elements.deviceInstructionList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Einweisungen dokumentiert",
            text: "Gespeicherte Einweisungen erscheinen hier chronologisch.",
            compact: true,
          })}
        </section>
      `;
      return;
    }

    elements.deviceInstructionList.innerHTML = `
      <div class="device-instruction-log">
        ${instructions
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
            return `
              <article class="device-instruction-log-row">
                <time datetime="${instruction.date}">
                  ${formatDate(instruction.date)}
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
      </div>
    `;
  }

  function getDeviceInstructionPercentage(deviceId, employees) {
    if (!employees.length) return 0;
    const instructedEmployeeIds = new Set(
      state.deviceInstructions
        .filter((instruction) => instruction.deviceId === deviceId)
        .flatMap((instruction) =>
          instruction.participants.map((participant) => participant.employeeId),
        ),
    );
    const instructedCount = employees.filter((employee) =>
      instructedEmployeeIds.has(employee.id),
    ).length;
    return Math.round((instructedCount / employees.length) * 100);
  }

  // Gemeinsam genutzt von der Einweisungsmatrix und der Jahresauswertung der
  // Pflichtfortbildungen, damit beide denselben Farbmassstab verwenden.
  function completionProgressTone(percentage) {
    if (percentage <= 65) return "is-low";
    if (percentage <= 80) return "is-medium";
    return "is-high";
  }

  function renderDeviceMatrixCell(employee, device) {
    const instructions = state.deviceInstructions
      .filter(
        (instruction) =>
          instruction.deviceId === device.id &&
          instruction.participants.some(
            (participant) => participant.employeeId === employee.id,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!instructions.length) {
      return `
        <td>
          <span class="device-matrix-status is-missing" aria-label="Keine Einweisung">×</span>
        </td>
      `;
    }
    const latest = instructions[0];
    const hasManufacturerOfficerInstruction = instructions.some(
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
  }

  function handleDeviceMatrixAction(event) {
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

  function handleDeviceInstructionListAction(event) {
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
        });
        if (committed) showToast("Gerät wurde gelöscht.");
      },
    });
  }

  function openDeviceInstructionDialog(deviceId = null, instructionId = null) {
    if (!state.devices.length) {
      showToast("Bitte legen Sie zuerst ein Gerät an.", "error");
      return;
    }
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (instruction) => instruction.id === instructionId,
        )
      : null;
    if (instructionId && !existingInstruction) {
      showToast("Der Einweisungsnachweis wurde nicht gefunden.", "error");
      return;
    }
    elements.deviceInstructionForm.reset();
    deviceParticipantSearchTerm = "";
    deviceParticipantDraft = new Map();
    elements.deviceInstructionId.value = "";
    elements.deviceInstructionDialogTitle.textContent = existingInstruction
      ? "Einweisung bearbeiten"
      : "Einweisung dokumentieren";
    elements.deviceInstructionSubmitLabel.textContent = existingInstruction
      ? "Änderungen speichern"
      : "Einweisung speichern";
    elements.deviceParticipantSearch.value = "";
    elements.deviceParticipantError.textContent = "";
    elements.deviceInstructionDate.setCustomValidity("");
    elements.externalInstructorName.setCustomValidity("");
    elements.employeeInstructor.setCustomValidity("");
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.deviceInstructionDate.value = todayIso();
    elements.deviceInstructionDevice.innerHTML = [...state.devices]
      .sort(
        (a, b) =>
          Number(b.currentInventory) - Number(a.currentInventory) ||
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      )
      .map(
        (device) =>
          `<option value="${device.id}">${escapeHtml(deviceLabel(device))}${
            device.currentInventory ? "" : " · nicht mehr im Bestand"
          }</option>`,
      )
      .join("");
    const selectedDeviceId = existingInstruction?.deviceId || deviceId;
    if (selectedDeviceId && getDevice(selectedDeviceId)) {
      elements.deviceInstructionDevice.value = selectedDeviceId;
    }
    elements.employeeInstructor.innerHTML = `
      <option value="">Bitte auswählen</option>
      ${[...state.employees]
        .sort(sortEmployees)
        .map(
          (employee) => `
            <option value="${employee.id}">
              ${escapeHtml(fullName(employee))}${
                employee.qualifications.medizinproduktebeauftragter
                  ? " · aktuell Medizinproduktebeauftragte/r"
                  : ""
              }
            </option>
          `,
        )
        .join("")}
    `;
    if (existingInstruction) {
      elements.deviceInstructionId.value = existingInstruction.id;
      elements.deviceInstructionDate.value = existingInstruction.date;
      elements.deviceInstructorType.value = existingInstruction.instructorType;
      if (existingInstruction.instructorType === "employee") {
        elements.employeeInstructor.value =
          existingInstruction.instructorEmployeeId;
        elements.employeeInstructorMpoConfirmation.checked =
          existingInstruction.instructorWasMedicalProductsOfficer;
      } else {
        elements.externalInstructorName.value =
          existingInstruction.instructorName;
      }
      deviceParticipantDraft = new Map(
        existingInstruction.participants.map((participant) => [
          participant.employeeId,
          participant.wasMedicalProductsOfficer,
        ]),
      );
    } else {
      elements.deviceInstructorType.value = "manufacturer";
    }
    updateDeviceInstructorFields();
    renderDeviceParticipantList();
    elements.deviceInstructionDialog.showModal();
    captureCleanForm(elements.deviceInstructionForm);
    window.setTimeout(() => elements.deviceInstructionDevice.focus(), 0);
  }

  function updateDeviceInstructorFields() {
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorField.hidden = isEmployee;
    elements.employeeInstructorFields.hidden = !isEmployee;
    elements.externalInstructorName.required = !isEmployee;
    elements.employeeInstructor.required = isEmployee;
    elements.employeeInstructorMpoConfirmation.required = isEmployee;
    if (isEmployee) {
      elements.externalInstructorName.setCustomValidity("");
    } else {
      elements.employeeInstructor.setCustomValidity("");
      elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    }
  }

  function filteredDeviceParticipants() {
    return [...state.employees]
      .filter(
        (employee) =>
          !deviceParticipantSearchTerm ||
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceParticipantSearchTerm),
      )
      .sort(sortEmployees);
  }

  function renderDeviceParticipantList() {
    const employees = filteredDeviceParticipants();
    elements.deviceParticipantList.innerHTML = employees.length
      ? employees
          .map((employee) => {
            const selected = deviceParticipantDraft.has(employee.id);
            const wasMpo = deviceParticipantDraft.get(employee.id) || false;
            return `
              <div class="device-participant-row">
                <label class="selection-card">
                  <input
                    type="checkbox"
                    data-device-participant="${employee.id}"
                    ${selected ? "checked" : ""}
                  />
                  ${renderAvatar(employee, true)}
                  <span>
                    <strong>${escapeHtml(fullName(employee))}</strong>
                    <small>${escapeHtml(
                      EMPLOYMENT_STATUSES[employee.employmentStatus] ||
                        employee.employmentStatus,
                    )}</small>
                  </span>
                </label>
                <label class="device-mpo-toggle">
                  <input
                    type="checkbox"
                    data-device-participant-mpo="${employee.id}"
                    ${wasMpo ? "checked" : ""}
                    ${selected ? "" : "disabled"}
                  />
                  <span>MP-Beauftragte/r</span>
                </label>
              </div>
            `;
          })
          .join("")
      : '<p class="completion-empty">Keine Mitarbeiter für diese Suche gefunden.</p>';
    updateDeviceParticipantCount();
  }

  function handleDeviceParticipantChange(event) {
    const participantCheckbox = event.target.closest(
      "[data-device-participant]",
    );
    if (participantCheckbox) {
      const employee = getEmployee(participantCheckbox.dataset.deviceParticipant);
      if (!employee) return;
      if (participantCheckbox.checked) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      } else {
        deviceParticipantDraft.delete(employee.id);
      }
      elements.deviceParticipantError.textContent = "";
      renderDeviceParticipantList();
      return;
    }
    const mpoCheckbox = event.target.closest("[data-device-participant-mpo]");
    if (mpoCheckbox && deviceParticipantDraft.has(mpoCheckbox.dataset.deviceParticipantMpo)) {
      deviceParticipantDraft.set(
        mpoCheckbox.dataset.deviceParticipantMpo,
        mpoCheckbox.checked,
      );
      updateDeviceParticipantCount();
    }
  }

  function toggleVisibleDeviceParticipants() {
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    visibleEmployees.forEach((employee) => {
      if (allSelected) {
        deviceParticipantDraft.delete(employee.id);
      } else if (!deviceParticipantDraft.has(employee.id)) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      }
    });
    renderDeviceParticipantList();
  }

  function updateDeviceParticipantCount() {
    const count = deviceParticipantDraft.size;
    elements.deviceParticipantCount.textContent = `${count} ausgewählt`;
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    elements.toggleAllDeviceParticipants.textContent = allSelected
      ? "Sichtbare abwählen"
      : "Sichtbare auswählen";
  }

  async function handleDeviceInstructionSubmit(event) {
    event.preventDefault();
    const date = elements.deviceInstructionDate.value;
    elements.deviceInstructionDate.setCustomValidity(
      date && date > todayIso()
        ? "Das Einweisungsdatum darf nicht in der Zukunft liegen."
        : "",
    );
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorName.setCustomValidity(
      !isEmployee && !elements.externalInstructorName.value.trim()
        ? "Bitte den Namen des Einweisenden eingeben."
        : "",
    );
    elements.employeeInstructorMpoConfirmation.setCustomValidity(
      isEmployee && !elements.employeeInstructorMpoConfirmation.checked
        ? "Bitte bestätigen Sie den Status zum Einweisungszeitpunkt."
        : "",
    );
    if (!elements.deviceInstructionForm.reportValidity()) return;
    if (!deviceParticipantDraft.size) {
      elements.deviceParticipantError.textContent =
        "Bitte mindestens einen Einweisungsteilnehmer auswählen.";
      return;
    }
    const instructorEmployee = isEmployee
      ? getEmployee(elements.employeeInstructor.value)
      : null;
    if (isEmployee && !instructorEmployee) {
      elements.employeeInstructor.setCustomValidity(
        "Bitte eine einweisende Person auswählen.",
      );
      elements.employeeInstructor.reportValidity();
      return;
    }
    const instructionId = elements.deviceInstructionId.value;
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (item) => item.id === instructionId,
        )
      : null;
    const instruction = {
      id: existingInstruction?.id || createId(),
      deviceId: elements.deviceInstructionDevice.value,
      date,
      instructorType: isEmployee ? "employee" : "manufacturer",
      instructorEmployeeId: instructorEmployee?.id || "",
      instructorName: instructorEmployee
        ? fullName(instructorEmployee)
        : elements.externalInstructorName.value.trim(),
      instructorWasMedicalProductsOfficer: isEmployee,
      participants: [...deviceParticipantDraft].map(
        ([employeeId, wasMedicalProductsOfficer]) => ({
          employeeId,
          wasMedicalProductsOfficer,
        }),
      ),
      createdAt: existingInstruction?.createdAt || new Date().toISOString(),
    };
    const committed = await commitStateMutation(() => {
      if (existingInstruction) {
        state.deviceInstructions = state.deviceInstructions.map((item) =>
          item.id === instruction.id ? instruction : item,
        );
      } else {
        state.deviceInstructions.push(instruction);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceInstructionForm);
    elements.deviceInstructionDialog.close();
    showToast(
      existingInstruction
        ? "Einweisung wurde aktualisiert."
        : `Einweisung wurde für ${instruction.participants.length} Mitarbeiter/in${
            instruction.participants.length === 1 ? "" : "nen"
          } gespeichert.`,
    );
  }

  function openDeviceInstructionHistory(employeeId, deviceId) {
    const employee = getEmployee(employeeId);
    const device = getDevice(deviceId);
    if (!employee || !device) return;
    const instructions = state.deviceInstructions
      .filter(
        (instruction) =>
          instruction.deviceId === deviceId &&
          instruction.participants.some(
            (participant) => participant.employeeId === employeeId,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    elements.deviceInstructionHistoryTitle.textContent = fullName(employee);
    elements.deviceInstructionHistorySubtitle.textContent = deviceLabel(device);
    elements.deviceInstructionHistoryContent.innerHTML = instructions.length
      ? `
        <div class="device-history-list">
          ${instructions
            .map((instruction) => {
              const participant = instruction.participants.find(
                (item) => item.employeeId === employeeId,
              );
              return `
                <article class="device-history-row">
                  <div>
                    <strong>${formatDate(instruction.date)}</strong>
                    <small>
                      Einweisende Person: ${escapeHtml(instruction.instructorName)}
                      · ${
                        instruction.instructorType === "employee"
                          ? "interne/r Medizinproduktebeauftragte/r"
                          : "von der Herstellerfirma beauftragt"
                      }
                    </small>
                  </div>
                  <span class="status-badge ${
                    participant?.wasMedicalProductsOfficer ? "onboarding" : ""
                  }">
                    ${
                      participant?.wasMedicalProductsOfficer
                        ? "Teilnehmer/in war MP-Beauftragte/r"
                        : "Teilnehmer/in ohne MP-Beauftragtenstatus"
                    }
                  </span>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisungsnachweis vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Nachweis löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Einweisungen",
          text: "Für diese Kombination sind keine Nachweise vorhanden.",
          compact: true,
        });
    applyAccessControl();
    if (!elements.deviceInstructionHistoryDialog.open) {
      elements.deviceInstructionHistoryDialog.showModal();
    }
  }

  function requestDeleteDeviceInstruction(instructionId) {
    const instruction = state.deviceInstructions.find(
      (item) => item.id === instructionId,
    );
    if (!instruction) return;
    requestConfirmation({
      title: "Einweisungsnachweis löschen?",
      message: `Die Einweisung vom ${formatDate(
        instruction.date,
      )} für ${instruction.participants.length} Teilnehmer/in${
        instruction.participants.length === 1 ? "" : "nen"
      } wird dauerhaft gelöscht.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.deviceInstructions = state.deviceInstructions.filter(
            (item) => item.id !== instructionId,
          );
        });
        if (!committed) return;
        if (elements.deviceInstructionHistoryDialog.open) {
          elements.deviceInstructionHistoryDialog.close();
        }
        showToast("Einweisungsnachweis wurde gelöscht.");
      },
    });
  }

  function deviceLabel(device) {
    return `${device.manufacturer} ${device.productName}`.trim();
  }

