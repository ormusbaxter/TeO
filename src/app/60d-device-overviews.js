  function getEmployeeDeviceOverview(employeeId) {
    return [...state.devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      )
      .map((device) => {
        const instructions = state.deviceInstructions
          .filter(
            (instruction) =>
              instruction.deviceId === device.id &&
              instruction.participants.some(
                (participant) => participant.employeeId === employeeId,
              ),
          )
          .sort(
            (a, b) =>
              b.date.localeCompare(a.date) ||
              String(b.createdAt || "").localeCompare(
                String(a.createdAt || ""),
              ),
          );
        return {
          device,
          instructions,
          latestInstruction: instructions[0] || null,
          isInstructed: instructions.length > 0,
        };
      });
  }

  function getDeviceEmployeeOverview(deviceId) {
    return [...state.employees].sort(sortEmployees).map((employee) => {
      const instructions = state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.participants.some(
              (participant) => participant.employeeId === employee.id,
            ),
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        );
      return {
        employee,
        instructions,
        latestInstruction: instructions[0] || null,
        isInstructed: instructions.length > 0,
      };
    });
  }

  function filterDeviceEmployeeOverview(
    overview,
    {
      searchTerm = "",
      instructionFilter = "all",
      employmentFilter = "employed",
    } = {},
  ) {
    const normalizedSearch = searchKey(searchTerm);
    return overview.filter(({ employee, isInstructed }) => {
      if (instructionFilter === "instructed" && !isInstructed) return false;
      if (instructionFilter === "missing" && isInstructed) return false;
      if (
        employmentFilter === "employed" &&
        employee.employmentStatus === "inactive"
      ) {
        return false;
      }
      if (
        !["all", "employed"].includes(employmentFilter) &&
        employee.employmentStatus !== employmentFilter
      ) {
        return false;
      }
      return (
        !normalizedSearch ||
        searchKey(
          [employeeSearchText(employee), employee.profession].filter(Boolean).join(" "),
        ).includes(normalizedSearch)
      );
    });
  }

  function openDeviceOverview(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    deviceOverviewDeviceId = device.id;
    deviceOverviewInstructionFilter = "all";
    deviceOverviewEmploymentFilter = "employed";
    deviceOverviewSearchTerm = "";
    elements.deviceOverviewSearch.value = "";
    elements.deviceOverviewInstructionFilter.value = "all";
    elements.deviceOverviewEmploymentFilter.value = "employed";
    elements.deviceOverviewTitle.textContent = device.productName;
    elements.deviceOverviewSubtitle.textContent = [
      device.manufacturer,
      device.category,
      device.currentInventory ? "aktueller Bestand" : "nicht mehr im Bestand",
    ].join(" · ");
    renderDeviceOverview();
    if (!elements.deviceOverviewDialog.open) {
      elements.deviceOverviewDialog.showModal();
    }
    window.setTimeout(() => elements.deviceOverviewSearch.focus(), 0);
  }

  function renderDeviceOverview() {
    const device = getDevice(deviceOverviewDeviceId);
    if (!device) return;
    const completeOverview = getDeviceEmployeeOverview(device.id);
    const overview = filterDeviceEmployeeOverview(completeOverview, {
      searchTerm: deviceOverviewSearchTerm,
      instructionFilter: deviceOverviewInstructionFilter,
      employmentFilter: deviceOverviewEmploymentFilter,
    });
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    const missingCount = overview.length - instructedCount;
    elements.deviceOverviewContent.innerHTML = `
      <div class="device-employee-overview-summary" aria-label="Zusammenfassung der gefilterten Mitarbeiter">
        <span><strong>${overview.length}</strong> sichtbar</span>
        <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
        <span class="is-missing"><strong>${missingCount}</strong> nicht eingewiesen</span>
      </div>
      ${
        overview.length
          ? `<div class="device-employee-overview-list">
              ${overview
                .map(({ employee, instructions, latestInstruction, isInstructed }) => {
                  const details = isInstructed
                    ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                    : "Für diese Person ist keine Einweisung dokumentiert.";
                  const content = `
                    ${renderAvatar(employee, true)}
                    <span class="device-employee-overview-device">
                      <strong>${escapeHtml(fullName(employee))}</strong>
                      <small>${escapeHtml(employee.profession)} · ${escapeHtml(employeeStatusLabel(employee))}</small>
                      <small>${details}</small>
                    </span>
                    <span class="status-badge ${isInstructed ? "" : "inactive"}">
                      ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                    </span>
                    ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
                  `;
                  return isInstructed
                    ? `<button
                        class="device-employee-overview-row"
                        type="button"
                        data-device-history-employee="${employee.id}"
                        data-device-history-device="${device.id}"
                        aria-label="Einweisungsverlauf für ${escapeHtml(fullName(employee))} anzeigen"
                      >${content}</button>`
                    : `<article class="device-employee-overview-row is-missing">${content}</article>`;
                })
                .join("")}
            </div>`
          : renderEmptyState({
              title: "Keine Mitarbeiter für diese Filter",
              text: "Ändern Sie die Suche oder die ausgewählten Statusfilter.",
              compact: true,
            })
      }
    `;
  }

  function openDeviceEmployeeOverview(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const overview = getEmployeeDeviceOverview(employeeId);
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    elements.deviceEmployeeOverviewTitle.textContent = fullName(employee);
    elements.deviceEmployeeOverviewSubtitle.textContent = overview.length
      ? `${instructedCount} von ${overview.length} Geräten mit dokumentierter Einweisung`
      : "Keine Geräte angelegt";
    elements.deviceEmployeeOverviewContent.innerHTML = overview.length
      ? `
        <div class="device-employee-overview-summary" aria-label="Zusammenfassung">
          <span><strong>${overview.length}</strong> Geräte gesamt</span>
          <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
          <span class="is-missing"><strong>${overview.length - instructedCount}</strong> nicht eingewiesen</span>
        </div>
        <div class="device-employee-overview-list">
          ${overview
            .map(({ device, instructions, latestInstruction, isInstructed }) => {
              const details = isInstructed
                ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                : "Für dieses Gerät ist keine Einweisung dokumentiert.";
              const content = `
                <span class="device-employee-overview-icon" aria-hidden="true">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span class="device-employee-overview-device">
                  <strong>${escapeHtml(deviceLabel(device))}</strong>
                  <small>${escapeHtml(device.category)}${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                  <small>${details}</small>
                </span>
                <span class="status-badge ${isInstructed ? "" : "inactive"}">
                  ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                </span>
                ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
              `;
              return isInstructed
                ? `
                  <button
                    class="device-employee-overview-row"
                    type="button"
                    data-device-history-employee="${employeeId}"
                    data-device-history-device="${device.id}"
                    aria-label="Einweisungsverlauf für ${escapeHtml(deviceLabel(device))} anzeigen"
                  >${content}</button>
                `
                : `<article class="device-employee-overview-row is-missing">${content}</article>`;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Noch keine Geräte",
          text: "Nach dem Anlegen eines Geräts erscheint hier der Einweisungsstatus.",
          compact: true,
        });
    if (!elements.deviceEmployeeOverviewDialog.open) {
      elements.deviceEmployeeOverviewDialog.showModal();
    }
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
        }, { undo: "Einweisungsnachweis gelöscht" });
        if (!committed) return;
        if (elements.deviceInstructionHistoryDialog.open) {
          elements.deviceInstructionHistoryDialog.close();
        }
        showUndoToast("Einweisungsnachweis wurde gelöscht.");
      },
    });
  }

  function deviceLabel(device) {
    return `${device.manufacturer} ${device.productName}`.trim();
  }
