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
    elements.employeeInstructorMpoConfirmationError.textContent = "";
    // Bewusst kein Vorgabedatum: Einweisungen werden haeufig nachtraeglich
    // erfasst, ein voreingetragenes Heute wuerde leicht uebersehen.
    elements.deviceInstructionDate.value = "";
    elements.deviceInstructionDeviceSearch.value = "";
    elements.deviceInstructionDeviceError.textContent = "";
    deviceInstructionDeviceSearchTerm = "";
    deviceInstructionDeviceDraft = new Set();

    const selectedDeviceId = existingInstruction?.deviceId || deviceId;
    if (selectedDeviceId && getDevice(selectedDeviceId)) {
      deviceInstructionDeviceDraft.add(selectedDeviceId);
    }

    // Beim Bearbeiten gehoert der Nachweis zu genau einem Geraet; das
    // Sammelanlegen gibt es nur beim Neuanlegen.
    const einzelauswahl = Boolean(existingInstruction);
    elements.toggleAllInstructionDevices.hidden = einzelauswahl;
    elements.deviceSelectionHeadingLabel.textContent = einzelauswahl
      ? "Gerät"
      : "Geräte · Mehrfachauswahl möglich";
    elements.employeeInstructor.innerHTML = `
      <option value="">Bitte auswählen</option>
      ${[...state.employees]
        .sort(compareDeviceInstructionEmployees)
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
    renderInstructionDeviceList();
    renderDeviceParticipantList();
    elements.deviceInstructionDialog.showModal();
    // Erst jetzt ist die Liste vermessbar.
    limitInstructionDeviceListHeight();
    captureCleanForm(elements.deviceInstructionForm);
    window.setTimeout(() => elements.deviceInstructionDeviceSearch.focus(), 0);
  }

  function instructionDeviceSingleSelect() {
    return Boolean(elements.deviceInstructionId.value);
  }

  function filteredInstructionDevices() {
    return [...state.devices]
      .filter(
        (device) =>
          !deviceInstructionDeviceSearchTerm ||
          searchKey(`${device.manufacturer} ${device.productName}`).includes(
            deviceInstructionDeviceSearchTerm,
          ),
      )
      .sort(
        (a, b) =>
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.productName.localeCompare(b.productName, "de"),
      );
  }

  function renderInstructionDeviceList() {
    const devices = filteredInstructionDevices();
    const einzelauswahl = instructionDeviceSingleSelect();
    elements.deviceInstructionDeviceList.innerHTML = devices.length
      ? devices
          .map(
            (device) => `
              <label class="selection-card">
                <input
                  type="${einzelauswahl ? "radio" : "checkbox"}"
                  ${einzelauswahl ? 'name="deviceInstructionDeviceChoice"' : ""}
                  data-instruction-device="${device.id}"
                  ${deviceInstructionDeviceDraft.has(device.id) ? "checked" : ""}
                />
                <span class="device-selection-icon">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span>
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}${
                    device.annex1 ? " · Anlage 1" : ""
                  }${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                </span>
              </label>
            `,
          )
          .join("")
      : '<p class="completion-empty">Keine Geräte für diese Suche gefunden.</p>';
    limitInstructionDeviceListHeight();
    updateInstructionDeviceCount();
  }

  // Fuenf Eintraege bleiben sichtbar. Die Hoehe wird an der ersten
  // ueberzaehligen Karte gemessen, weil lange Geraetenamen umbrechen koennen.
  // Solange der Dialog geschlossen ist, liefern alle Masse 0; die Begrenzung
  // wird dann beim Oeffnen nachgeholt.
  function limitInstructionDeviceListHeight() {
    const list = elements.deviceInstructionDeviceList;
    list.style.maxHeight = "";
    if (!list.offsetParent) return;

    const cards = [...list.querySelectorAll(".selection-card")];
    if (cards.length <= VISIBLE_INSTRUCTION_DEVICES) return;
    // Bis zur Unterkante der letzten sichtbaren Karte, zuzueglich des unteren
    // Innenabstands. Ueber die Oberkante der naechsten Karte gerechnet waere
    // der Rasterabstand doppelt gezaehlt und die fuenfte Karte abgeschnitten.
    // offsetTop/offsetHeight statt getBoundingClientRect: Der Dialog faehrt
    // beim Oeffnen skaliert ein, wodurch gemessene Rechtecke zu klein waeren.
    const letzte = cards[VISIBLE_INSTRUCTION_DEVICES - 1];
    const innenabstand =
      Number.parseFloat(getComputedStyle(list).paddingBottom) || 0;
    list.style.maxHeight = `${
      letzte.offsetTop + letzte.offsetHeight + innenabstand
    }px`;
  }

  function updateInstructionDeviceCount() {
    const selectedCount = deviceInstructionDeviceDraft.size;
    elements.toggleAllInstructionDevices.textContent =
      selectedCount && filteredInstructionDevices().every((device) =>
        deviceInstructionDeviceDraft.has(device.id),
      )
        ? "Sichtbare abwählen"
        : "Sichtbare auswählen";
    if (selectedCount) elements.deviceInstructionDeviceError.textContent = "";
    updateDeviceInstructionCutoffHint();
  }

  // Ein Nachweis vor dem Stichtag einer angeordneten Neueinweisung laesst
  // sich speichern (etwa als Nachtrag), zaehlt aber nicht.
  function updateDeviceInstructionCutoffHint() {
    const date = elements.deviceInstructionDate.value;
    const affected = date
      ? [...deviceInstructionDeviceDraft]
          .map(getDevice)
          .filter((device) => device && date < deviceInstructionCutoff(device))
      : [];
    elements.deviceInstructionCutoffHint.hidden = !affected.length;
    elements.deviceInstructionCutoffHint.textContent = affected.length
      ? affected.length === 1
        ? `Für ${affected[0].productName} ist seit ${formatDate(
            deviceInstructionCutoff(affected[0]),
          )} eine Neueinweisung angeordnet. Eine Einweisung mit früherem Datum ist nichtig.`
        : `Für ${affected.length} der gewählten Geräte gilt eine angeordnete Neueinweisung nach diesem Datum. Die Einweisung ist dort nichtig.`
      : "";
  }

  function handleInstructionDeviceChange(event) {
    const checkbox = event.target.closest("[data-instruction-device]");
    if (!checkbox) return;
    const deviceId = checkbox.dataset.instructionDevice;
    if (instructionDeviceSingleSelect()) {
      deviceInstructionDeviceDraft = new Set([deviceId]);
    } else if (checkbox.checked) {
      deviceInstructionDeviceDraft.add(deviceId);
    } else {
      deviceInstructionDeviceDraft.delete(deviceId);
    }
    updateInstructionDeviceCount();
  }

  function toggleVisibleInstructionDevices() {
    const devices = filteredInstructionDevices();
    const alleGewaehlt = devices.every((device) =>
      deviceInstructionDeviceDraft.has(device.id),
    );
    devices.forEach((device) => {
      if (alleGewaehlt) deviceInstructionDeviceDraft.delete(device.id);
      else deviceInstructionDeviceDraft.add(device.id);
    });
    renderInstructionDeviceList();
  }

  function updateDeviceInstructorFields() {
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorField.hidden = isEmployee;
    elements.employeeInstructorFields.hidden = !isEmployee;
    elements.externalInstructorName.required = !isEmployee;
    elements.employeeInstructor.required = isEmployee;
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
          searchKey(employeeSearchText(employee)).includes(deviceParticipantSearchTerm),
      )
      .sort(compareDeviceInstructionEmployees);
  }

  function compareDeviceInstructionEmployees(a, b) {
    return (
      a.lastName.localeCompare(b.lastName, "de", { sensitivity: "base" }) ||
      a.firstName.localeCompare(b.firstName, "de", { sensitivity: "base" }) ||
      a.id.localeCompare(b.id)
    );
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
    const instructorConfirmationMissing =
      isEmployee && !elements.employeeInstructorMpoConfirmation.checked;
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.employeeInstructorMpoConfirmationError.textContent =
      instructorConfirmationMissing
        ? "Bitte bestätigen Sie den Status zum Einweisungszeitpunkt."
        : "";
    if (!elements.deviceInstructionForm.reportValidity()) return;
    if (instructorConfirmationMissing) {
      elements.employeeInstructorMpoConfirmation
        .closest(".device-instructor-confirmation")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      elements.employeeInstructorMpoConfirmation.focus({ preventScroll: true });
      return;
    }
    if (!deviceInstructionDeviceDraft.size) {
      elements.deviceInstructionDeviceError.textContent =
        "Bitte mindestens ein Gerät auswählen.";
      elements.deviceInstructionDeviceSearch.focus();
      return;
    }
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
    // Alle ausgewaehlten Geraete erhalten denselben Nachweis - je Geraet ein
    // eigener Datensatz, damit Verlauf und Matrix unveraendert funktionieren.
    const gemeinsameAngaben = {
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
    };
    const erstellt = new Date().toISOString();
    const instructions = [...deviceInstructionDeviceDraft].map((deviceId) => ({
      id: existingInstruction?.id || createId(),
      deviceId,
      ...gemeinsameAngaben,
      createdAt: existingInstruction?.createdAt || erstellt,
    }));

    const committed = await commitStateMutation(() => {
      if (existingInstruction) {
        state.deviceInstructions = state.deviceInstructions.map((item) =>
          item.id === instructions[0].id ? instructions[0] : item,
        );
      } else {
        state.deviceInstructions.push(...instructions);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceInstructionForm);
    elements.deviceInstructionDialog.close();
    const teilnehmerzahl = gemeinsameAngaben.participants.length;
    const teilnehmerText = `${teilnehmerzahl} Mitarbeiter/in${
      teilnehmerzahl === 1 ? "" : "nen"
    }`;
    showToast(
      existingInstruction
        ? "Einweisung wurde aktualisiert."
        : instructions.length === 1
          ? `Einweisung wurde für ${teilnehmerText} gespeichert.`
          : `${instructions.length} Einweisungen wurden für ${teilnehmerText} gespeichert.`,
    );
  }
