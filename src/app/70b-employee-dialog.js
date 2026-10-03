  function openEmployeeDialog(employeeId = null) {
    elements.employeeForm.reset();
    [
      "#firstName",
      "#lastName",
      "#profession",
      "#birthDate",
      "#employeeUsername",
    ].forEach((selector) => {
      document.querySelector(selector).setCustomValidity("");
    });
    document.querySelector("#employeeId").value = "";
    document.querySelector("#employmentPercent").value = "100";
    document.querySelector("#employeeStatus").value = "active";
    renderEmploymentChangeRows([]);

    const employee = employeeId ? getEmployee(employeeId) : null;
    if (employee) trackWorkspaceRecord("employee", employee.id);
    renderEmployeeCatalogFields(employee);
    elements.employeeDialogTitle.textContent = employee ? "Mitarbeiter bearbeiten" : "Mitarbeiter anlegen";
    elements.employeeSubmitLabel.textContent = employee ? "Änderungen speichern" : "Mitarbeiter speichern";

    if (employee) {
      document.querySelector("#employeeId").value = employee.id;
      document.querySelector("#firstName").value = employee.firstName;
      document.querySelector("#lastName").value = employee.lastName;
      document.querySelector("#employeeUsername").value =
        employee.username || "";
      document.querySelector("#birthDate").value = employee.birthDate;
      document.querySelector("#phone").value = employee.phone;
      document.querySelector("#email").value = employee.email;
      document.querySelector("#profession").value = employee.profession;
      document.querySelector("#serviceWeekend").value = employee.serviceWeekend;
      document.querySelector("#employmentPercent").value = String(employee.employmentPercent);
      document.querySelector("#entryDate").value = employee.entryDate || "";
      document.querySelector("#exitDate").value = employee.exitDate || "";
      renderEmploymentChangeRows(employee.employmentChanges || []);
      document.querySelector("#employeeStatus").value = employee.employmentStatus;

      document.querySelectorAll('input[name="qualification"]').forEach((checkbox) => {
        checkbox.checked = Boolean(employee.qualifications[checkbox.value]);
      });
    }

    elements.employeeDialog.showModal();
    captureCleanForm(elements.employeeForm);
    window.setTimeout(() => document.querySelector("#firstName").focus(), 0);
  }

  function renderEmploymentChangeRows(changes) {
    elements.employmentChangeList.innerHTML = changes
      .map((change) => employmentChangeRowMarkup(change))
      .join("");
  }

  function employmentChangeRowMarkup({ from = "", percent = "" } = {}) {
    return `
      <div class="employment-change-row">
        <label>
          <span>ab</span>
          <input type="date" data-employment-change-from value="${escapeHtml(from)}" required />
        </label>
        <label>
          <span>Stellenumfang</span>
          <span class="input-suffix">
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              data-employment-change-percent
              value="${escapeHtml(String(percent))}"
              required
            />
            <span>%</span>
          </span>
        </label>
        <button
          class="icon-button danger"
          type="button"
          data-remove-employment-change
          aria-label="Änderung entfernen"
          title="Änderung entfernen"
        ><svg><use href="#icon-trash"></use></svg></button>
      </div>
    `;
  }

  function handleEmploymentChangeAction(event) {
    const remove = event.target.closest("[data-remove-employment-change]");
    if (remove) remove.closest(".employment-change-row").remove();
  }

  function addEmploymentChangeRow() {
    elements.employmentChangeList.insertAdjacentHTML(
      "beforeend",
      employmentChangeRowMarkup({
        percent: document.querySelector("#employmentPercent").value || "100",
      }),
    );
    elements.employmentChangeList
      .querySelector(".employment-change-row:last-child [data-employment-change-from]")
      ?.focus();
  }

  function readEmploymentChangeRows() {
    return [...elements.employmentChangeList.querySelectorAll(".employment-change-row")]
      .map((row) => ({
        from: row.querySelector("[data-employment-change-from]").value,
        percent: Number(row.querySelector("[data-employment-change-percent]").value),
      }))
      .filter((change) => change.from && Number.isFinite(change.percent));
  }

  function renderEmployeeCatalogFields(employee = null) {
    const professions = [...state.catalogs.professions];
    if (
      employee?.profession &&
      !professions.some(
        (profession) =>
          profession.toLocaleLowerCase("de-DE") ===
          employee.profession.toLocaleLowerCase("de-DE"),
      )
    ) {
      professions.push(employee.profession);
      professions.sort((left, right) => left.localeCompare(right, "de"));
    }
    const professionSelect = document.querySelector("#profession");
    professionSelect.innerHTML = [
      '<option value="">Beruf auswählen</option>',
      ...professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    professionSelect.value = employee?.profession || "";

    const ownerWeekend = serviceWeekendOwnerKey(employee?.id);
    elements.serviceWeekend.innerHTML = serviceWeekendOptionsMarkup();
    elements.serviceWeekend.value =
      ownerWeekend || employee?.serviceWeekend || "none";
    elements.serviceWeekend.disabled = Boolean(ownerWeekend);
    elements.serviceWeekendOwnerHint.hidden = !ownerWeekend;
    elements.serviceWeekendOwnerHint.textContent = ownerWeekend
      ? `Als verantwortliche Person fest mit „${serviceWeekendLabel(
          ownerWeekend,
        )}“ verbunden.`
      : "";

    document.querySelector("#qualificationFields").innerHTML = state.catalogs.qualifications
      .map(
        (qualification) => `
          <div class="qualification-expiry-row">
            <label class="check-card">
              <input
                type="checkbox"
                name="qualification"
                value="${qualification.id}"
                ${employee?.qualifications?.[qualification.id] ? "checked" : ""}
              />
              <span class="check-box"><svg><use href="#icon-check"></use></svg></span>
              <span>${escapeHtml(qualification.label)}</span>
            </label>
            <label class="qualification-expiry-field">
              <span>Gültig bis (optional)</span>
              <input
                type="date"
                name="qualification-expiry"
                data-qualification-expiry="${qualification.id}"
                value="${escapeHtml(employee?.qualificationExpiries?.[qualification.id] || "")}"
              />
            </label>
          </div>
        `,
      )
      .join("");
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();

    const birthDate = document.querySelector("#birthDate");
    const firstNameInput = document.querySelector("#firstName");
    const lastNameInput = document.querySelector("#lastName");
    const professionInput = document.querySelector("#profession");
    const usernameInput = document.querySelector("#employeeUsername");

    birthDate.setCustomValidity(
      birthDate.value && birthDate.value > todayIso()
        ? "Das Geburtsdatum darf nicht in der Zukunft liegen."
        : "",
    );
    firstNameInput.setCustomValidity(
      firstNameInput.value.trim() ? "" : "Bitte einen Vornamen eingeben.",
    );
    lastNameInput.setCustomValidity(
      lastNameInput.value.trim() ? "" : "Bitte einen Nachnamen eingeben.",
    );
    professionInput.setCustomValidity(
      professionInput.value.trim() ? "" : "Bitte einen Beruf eingeben.",
    );
    const username = usernameInput.value.trim();
    const editingEmployeeId = document.querySelector("#employeeId").value;
    const duplicateUsername = username
      ? state.employees.some(
          (employee) =>
            employee.id !== editingEmployeeId &&
            employee.username?.toLocaleLowerCase("de-DE") ===
              username.toLocaleLowerCase("de-DE"),
        )
      : false;
    usernameInput.setCustomValidity(
      username && !/^[A-Za-z0-9]{4,40}$/.test(username)
        ? "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen."
        : duplicateUsername
          ? "Dieser Benutzername ist bereits einem anderen Mitarbeiter zugewiesen."
          : "",
    );
    if (!elements.employeeForm.reportValidity()) return;

    const employeeId = document.querySelector("#employeeId").value;
    const existingEmployee = employeeId ? getEmployee(employeeId) : null;
    const now = new Date().toISOString();
    const qualifications = {};
    const qualificationExpiries = {};
    state.catalogs.qualifications.forEach(({ id: key }) => {
      qualifications[key] = Boolean(
        document.querySelector(`input[name="qualification"][value="${key}"]`)?.checked,
      );
      const expiry = document.querySelector(
        `[data-qualification-expiry="${key}"]`,
      )?.value;
      if (qualifications[key] && expiry) qualificationExpiries[key] = expiry;
    });
    const ownerWeekend = serviceWeekendOwnerKey(existingEmployee?.id);
    if (
      ownerWeekend &&
      !LEADERSHIP_QUALIFICATION_IDS.some(
        (qualificationId) => qualifications[qualificationId],
      )
    ) {
      showToast(
        "Die verantwortliche Person muss Stationsleitung oder stellvertretende Stationsleitung bleiben. Bitte zuerst die Dienstwochenendzuweisung ändern.",
        "error",
      );
      return;
    }

    const entryDate = document.querySelector("#entryDate").value;
    const exitDate = document.querySelector("#exitDate").value;
    if (entryDate && exitDate && exitDate < entryDate) {
      document.querySelector("#exitDate").setCustomValidity(
        "Das Austrittsdatum liegt vor dem Eintrittsdatum.",
      );
      document.querySelector("#exitDate").reportValidity();
      document.querySelector("#exitDate").setCustomValidity("");
      return;
    }
    const employmentChanges = normalizeEmploymentChanges(readEmploymentChangeRows());

    const employee = {
      id: existingEmployee?.id || createId(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      username,
      birthDate: birthDate.value,
      phone: document.querySelector("#phone").value.trim(),
      email: document.querySelector("#email").value.trim(),
      employmentPercent: clampNumber(
        document.querySelector("#employmentPercent").value,
        1,
        100,
        100,
      ),
      entryDate,
      exitDate,
      employmentChanges,
      profession: normalizeProfession(professionInput.value),
      serviceWeekend:
        ownerWeekend ||
        document.querySelector("#serviceWeekend").value,
      employmentStatus: document.querySelector("#employeeStatus").value,
      active: document.querySelector("#employeeStatus").value !== "inactive",
      qualifications,
      qualificationExpiries,
      createdAt: existingEmployee?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingEmployee) {
        state.employees = state.employees.map((item) =>
          item.id === employee.id ? employee : item,
        );
        if (ownerWeekend) {
          state.settings.serviceWeekends[ownerWeekend].name =
            employee.firstName.slice(0, 50);
        }
      } else {
        state.employees.push(employee);
      }
      if (
        !state.catalogs.professions.some(
          (profession) =>
            profession.toLocaleLowerCase("de-DE") ===
            employee.profession.toLocaleLowerCase("de-DE"),
        )
      ) {
        state.catalogs.professions.push(employee.profession);
        state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
      }
    });
    if (!committed) return;

    elements.employeeDialog.close();
    showToast(existingEmployee ? "Mitarbeiter wurde aktualisiert." : "Mitarbeiter wurde angelegt.");
  }

  async function toggleEmployee(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;

    const employeeName = fullName(employee);
    const nextActiveState = !employee.active;
    const committed = await commitStateMutation(() => {
      employee.active = nextActiveState;
      employee.employmentStatus = nextActiveState ? "active" : "inactive";
      employee.updatedAt = new Date().toISOString();
    });
    if (!committed) return;

    showToast(`${employeeName} ist jetzt ${nextActiveState ? "aktiv" : "inaktiv"}.`);
  }

  function requestDeleteEmployee(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const ownerWeekend = serviceWeekendOwnerKey(employeeId);
    if (ownerWeekend) {
      showToast(
        `${fullName(employee)} ist für „${serviceWeekendLabel(
          ownerWeekend,
        )}“ verantwortlich. Bitte zuerst die verantwortliche Person in den Einstellungen ändern.`,
        "error",
      );
      return;
    }
    const completionCount = state.completions.filter(
      (completion) => completion.employeeId === employeeId,
    ).length;
    const attendanceCount = state.meetingAttendances.filter(
      (attendance) => attendance.employeeId === employeeId,
    ).length;
    const vacationDayCount = state.vacationDays.filter(
      (vacationDay) => vacationDay.employeeId === employeeId,
    ).length;
    const deviceInstructionCount = state.deviceInstructions.filter(
      (instruction) =>
        instruction.participants.some(
          (participant) => participant.employeeId === employeeId,
        ),
    ).length;
    const historyParts = [];
    if (completionCount) {
      historyParts.push(
        `${completionCount} Fortbildungsnachweis${completionCount === 1 ? "" : "e"}`,
      );
    }
    if (attendanceCount) {
      historyParts.push(`${attendanceCount} Sitzungsstatus`);
    }
    if (vacationDayCount) {
      historyParts.push(
        vacationDayCount === 1
          ? "1 Planungseintrag"
          : `${vacationDayCount} Planungseinträge`,
      );
    }
    if (deviceInstructionCount) {
      historyParts.push(
        `${deviceInstructionCount} Geräteeinweisungsnachweis${
          deviceInstructionCount === 1 ? "" : "e"
        }`,
      );
    }
    const historyNote = historyParts.length
      ? ` Dabei werden auch ${historyParts.join(" und ")} gelöscht.`
      : "";

    requestConfirmation({
      title: "Mitarbeiter löschen?",
      message: `${fullName(
        employee,
      )} wird dauerhaft aus der Verwaltung entfernt.${historyNote} Für ausgeschiedene Mitarbeiter ist „Inaktiv“ meist die bessere Wahl.`,
      acceptLabel: "Mitarbeiter löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.employees = state.employees.filter((item) => item.id !== employeeId);
          state.completions = state.completions.filter(
            (completion) => completion.employeeId !== employeeId,
          );
          state.meetingAttendances = state.meetingAttendances.filter(
            (attendance) => attendance.employeeId !== employeeId,
          );
          state.vacationEntitlements = state.vacationEntitlements.filter(
            (entitlement) => entitlement.employeeId !== employeeId,
          );
          state.vacationDays = state.vacationDays.filter(
            (vacationDay) => vacationDay.employeeId !== employeeId,
          );
          state.deviceInstructions = state.deviceInstructions
            .map((instruction) => ({
              ...instruction,
              instructorEmployeeId:
                instruction.instructorEmployeeId === employeeId
                  ? ""
                  : instruction.instructorEmployeeId,
              participants: instruction.participants.filter(
                (participant) => participant.employeeId !== employeeId,
              ),
            }))
            .filter((instruction) => instruction.participants.length);
          state.meetings.forEach((meeting) => {
            meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter(
              (expectedEmployeeId) => expectedEmployeeId !== employeeId,
            );
          });
        }, { undo: "Mitarbeiter gelöscht" });
        if (!committed) return;

        showUndoToast("Mitarbeiter wurde gelöscht.");
      },
    });
  }
