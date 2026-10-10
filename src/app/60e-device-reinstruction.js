  // Neueinweisung: Ein Softwareupdate oder ein Umbau kann ein Geraet erneut
  // einweisungspflichtig machen. Statt Nachweise zu loeschen, bekommt das
  // Geraet einen Stichtag; jede Einweisung davor ist ab dann nichtig, bleibt
  // aber als Verlauf sichtbar. Eine Einweisung am Stichtag selbst zaehlt.
  function latestDeviceInstructionReset(deviceOrId) {
    const device =
      typeof deviceOrId === "string" ? getDevice(deviceOrId) : deviceOrId;
    const resets = device?.instructionResets || [];
    return resets.reduce(
      (latest, reset) =>
        !latest ||
        reset.effectiveDate > latest.effectiveDate ||
        (reset.effectiveDate === latest.effectiveDate &&
          reset.createdAt > latest.createdAt)
          ? reset
          : latest,
      null,
    );
  }

  function deviceInstructionCutoff(deviceOrId) {
    return latestDeviceInstructionReset(deviceOrId)?.effectiveDate || "";
  }

  function isDeviceInstructionValid(
    instruction,
    cutoff = deviceInstructionCutoff(instruction.deviceId),
  ) {
    return !cutoff || instruction.date >= cutoff;
  }

  // Wer an diesem Geraet nur nichtige Einweisungen hat und noch beschaeftigt
  // ist, muss neu eingewiesen werden.
  function getDeviceReinstructionStatus(device, today = todayIso()) {
    const reset = latestDeviceInstructionReset(device);
    if (!reset) return null;
    const employees = employedActiveEmployees(today);
    const index = deviceInstructionIndex();
    const pending = [];
    const renewed = [];
    employees.forEach((employee) => {
      const instructions =
        index.byPair.get(`${device.id}|${employee.id}`) || [];
      if (!instructions.length) return;
      if (instructions.some((item) => item.date >= reset.effectiveDate)) {
        if (instructions.some((item) => item.date < reset.effectiveDate)) {
          renewed.push(employee);
        }
      } else {
        pending.push(employee);
      }
    });
    return { reset, pending, renewed };
  }

  // Geraete im aktuellen Bestand mit offenen Neueinweisungen, fuer
  // Kennzahlen und das Dashboard.
  function getOpenDeviceReinstructions(today = todayIso()) {
    return state.devices
      .filter((device) => device.currentInventory)
      .map((device) => ({ device, status: getDeviceReinstructionStatus(device, today) }))
      .filter(({ status }) => status?.pending.length)
      .sort(
        (a, b) =>
          b.status.reset.effectiveDate.localeCompare(a.status.reset.effectiveDate) ||
          a.device.productName.localeCompare(b.device.productName, "de"),
      );
  }

  function deviceReinstructionNotice(device) {
    const status = getDeviceReinstructionStatus(device);
    if (!status) return "";
    const total = status.pending.length + status.renewed.length;
    return `
      <div class="device-reinstruction-notice">
        <strong>Neueinweisung seit ${formatDate(status.reset.effectiveDate)}</strong>
        <span>${escapeHtml(status.reset.reason)} · ${status.renewed.length} von ${total} neu eingewiesen</span>
      </div>
    `;
  }

  function openDeviceReinstructionDialog(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    elements.deviceReinstructionForm.reset();
    elements.deviceReinstructionDeviceId.value = device.id;
    elements.deviceReinstructionSubtitle.textContent = deviceLabel(device);
    elements.deviceReinstructionDate.max = todayIso();
    elements.deviceReinstructionDate.value = todayIso();
    elements.deviceReinstructionDate.setCustomValidity("");
    elements.deviceReinstructionReason.setCustomValidity("");
    renderDeviceReinstructionDialog();
    elements.deviceReinstructionDialog.showModal();
    captureCleanForm(elements.deviceReinstructionForm);
    window.setTimeout(() => elements.deviceReinstructionReason.focus(), 0);
  }

  // Wie viele Einweisungen ein Stichtag nichtig machen wuerde: Massgeblich
  // ist, wer danach keine gueltige Einweisung mehr haette.
  function previewDeviceReinstruction(device, effectiveDate) {
    const currentCutoff = deviceInstructionCutoff(device);
    const cutoff =
      effectiveDate && effectiveDate > currentCutoff ? effectiveDate : currentCutoff;
    const employeeIds = new Set();
    const affected = new Set();
    const authorizedBefore = getDeviceAuthorizedEmployees(device.id).length;
    let authorizedAfter = new Set();
    state.deviceInstructions
      .filter((instruction) => instruction.deviceId === device.id)
      .forEach((instruction) => {
        const valid = isDeviceInstructionValid(instruction, cutoff);
        instruction.participants.forEach((participant) => {
          if (valid) {
            employeeIds.add(participant.employeeId);
            if (
              instruction.instructorType === "manufacturer" &&
              participant.wasMedicalProductsOfficer
            ) {
              authorizedAfter.add(participant.employeeId);
            }
          } else if (isDeviceInstructionValid(instruction, currentCutoff)) {
            affected.add(participant.employeeId);
          }
        });
      });
    const voided = [...affected].filter(
      (employeeId) => !employeeIds.has(employeeId) && getEmployee(employeeId),
    ).length;
    authorizedAfter = [...authorizedAfter].filter(getEmployee).length;
    return {
      voided,
      lostAuthorizations: Math.max(0, authorizedBefore - authorizedAfter),
    };
  }

  function renderDeviceReinstructionDialog() {
    const device = getDevice(elements.deviceReinstructionDeviceId.value);
    if (!device) return;
    const effectiveDate = elements.deviceReinstructionDate.value;
    const preview = previewDeviceReinstruction(device, effectiveDate);
    elements.deviceReinstructionPreview.textContent = !effectiveDate
      ? "Bitte einen Stichtag wählen."
      : preview.voided
        ? `Damit werden die Einweisungen von ${preview.voided} Mitarbeiter${
            preview.voided === 1 ? "/in" : "/innen"
          } nichtig${
            preview.lostAuthorizations
              ? `, ${preview.lostAuthorizations} Einweisungsberechtigung${
                  preview.lostAuthorizations === 1 ? " entfällt" : "en entfallen"
                }`
              : ""
          }.`
        : "Damit wird keine bestehende Einweisung nichtig; neue Einweisungen zählen erst ab dem Stichtag.";
    const resets = [...(device.instructionResets || [])].sort(
      (a, b) =>
        b.effectiveDate.localeCompare(a.effectiveDate) ||
        b.createdAt.localeCompare(a.createdAt),
    );
    elements.deviceReinstructionHistory.hidden = !resets.length;
    elements.deviceReinstructionHistoryList.innerHTML = resets
      .map(
        (reset) => `
          <li class="device-reinstruction-history-row">
            <span>
              <strong>ab ${formatDate(reset.effectiveDate)}</strong>
              <small>${escapeHtml(reset.reason)}</small>
            </span>
            <button
              class="text-button"
              type="button"
              data-remove-device-reinstruction="${reset.id}"
              aria-label="Neueinweisung ab ${formatDate(reset.effectiveDate)} aufheben"
            >
              Aufheben
            </button>
          </li>
        `,
      )
      .join("");
  }

  async function handleDeviceReinstructionSubmit(event) {
    event.preventDefault();
    const device = getDevice(elements.deviceReinstructionDeviceId.value);
    if (!device) return;
    const dateInput = elements.deviceReinstructionDate;
    const reasonInput = elements.deviceReinstructionReason;
    const effectiveDate = dateInput.value;
    const reason = reasonInput.value.trim();
    dateInput.setCustomValidity(
      !effectiveDate
        ? "Bitte einen Stichtag wählen."
        : effectiveDate > todayIso()
          ? "Der Stichtag darf nicht in der Zukunft liegen."
          : "",
    );
    reasonInput.setCustomValidity(
      reason ? "" : "Bitte einen Grund angeben, etwa das Softwareupdate.",
    );
    if (!elements.deviceReinstructionForm.reportValidity()) return;

    const now = new Date().toISOString();
    const reset = { id: createId(), effectiveDate, reason, createdAt: now };
    const committed = await commitStateMutation(
      () => {
        state.devices = state.devices.map((item) =>
          item.id === device.id
            ? {
                ...item,
                instructionResets: [...(item.instructionResets || []), reset],
                updatedAt: now,
              }
            : item,
        );
      },
      { undo: "Neueinweisung angeordnet" },
    );
    if (!committed) return;
    markFormClean(elements.deviceReinstructionForm);
    elements.deviceReinstructionDialog.close();
    refreshOpenDeviceOverviews();
    showUndoToast(
      `Neueinweisung für ${device.productName} ab ${formatDate(effectiveDate)} angeordnet.`,
    );
  }

  async function handleDeviceReinstructionHistoryAction(event) {
    const button = event.target.closest("[data-remove-device-reinstruction]");
    if (!button) return;
    const device = getDevice(elements.deviceReinstructionDeviceId.value);
    const resetId = button.dataset.removeDeviceReinstruction;
    const reset = device?.instructionResets?.find((item) => item.id === resetId);
    if (!reset) return;
    const committed = await commitStateMutation(
      () => {
        state.devices = state.devices.map((item) =>
          item.id === device.id
            ? {
                ...item,
                instructionResets: item.instructionResets.filter(
                  (entry) => entry.id !== resetId,
                ),
                updatedAt: new Date().toISOString(),
              }
            : item,
        );
      },
      { undo: "Neueinweisung aufgehoben" },
    );
    if (!committed) return;
    renderDeviceReinstructionDialog();
    refreshOpenDeviceOverviews();
    showUndoToast(
      `Neueinweisung ab ${formatDate(reset.effectiveDate)} wurde aufgehoben.`,
    );
  }

  function refreshOpenDeviceOverviews() {
    if (elements.deviceOverviewDialog.open) renderDeviceOverview();
    if (elements.deviceEmployeeOverviewDialog.open) renderDeviceEmployeeOverview();
  }
