  function openBulkEditDialog() {
    if (selectedEmployeeIds.size === 0) return;
    elements.bulkEditForm.reset();
    elements.bulkEditSubtitle.textContent = `${selectedEmployeeIds.size} Mitarbeiter werden gemeinsam bearbeitet.`;
    elements.bulkProfession.innerHTML = [
      '<option value="">Nicht ändern</option>',
      ...state.catalogs.professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    elements.bulkQualification.innerHTML = [
      '<option value="">Keine auswählen</option>',
      ...state.catalogs.qualifications.map(
        (qualification) =>
          `<option value="${qualification.id}">${escapeHtml(qualification.label)}</option>`,
      ),
    ].join("");
    elements.bulkServiceWeekend.innerHTML = serviceWeekendOptionsMarkup({
      includeUnchanged: true,
    });
    elements.bulkEditDialog.showModal();
    captureCleanForm(elements.bulkEditForm);
  }

  async function handleBulkEditSubmit(event) {
    event.preventDefault();
    if (selectedEmployeeIds.size === 0) return;
    const active = elements.bulkActive.value;
    const profession = elements.bulkProfession.value;
    const weekend = elements.bulkServiceWeekend.value;
    const qualificationId = elements.bulkQualification.value;
    const qualificationState = elements.bulkQualificationState.value;
    if (!active && !profession && !weekend && !(qualificationId && qualificationState)) {
      showToast("Bitte mindestens eine Änderung auswählen.", "error");
      return;
    }
    if (weekend) {
      const protectedEmployees = [...selectedEmployeeIds]
        .map(getEmployee)
        .filter(
          (employee) =>
            employee &&
            serviceWeekendOwnerKey(employee.id) &&
            serviceWeekendOwnerKey(employee.id) !== weekend,
        );
      if (protectedEmployees.length) {
        showToast(
          `${protectedEmployees
            .map(fullName)
            .join(
              ", ",
            )} kann als verantwortliche Person nicht in ein anderes Dienstwochenende verschoben werden.`,
          "error",
        );
        return;
      }
    }
    if (
      qualificationState === "remove" &&
      LEADERSHIP_QUALIFICATION_IDS.includes(qualificationId)
    ) {
      const protectedEmployees = [...selectedEmployeeIds]
        .map(getEmployee)
        .filter(
          (employee) =>
            employee &&
            serviceWeekendOwnerKey(employee.id) &&
            !LEADERSHIP_QUALIFICATION_IDS.some(
              (id) =>
                id !== qualificationId && employee.qualifications[id],
            ),
        );
      if (protectedEmployees.length) {
        showToast(
          `Die Leitungsfunktion von ${protectedEmployees
            .map(fullName)
            .join(
              ", ",
            )} kann erst nach Änderung der Dienstwochenendzuweisung entfernt werden.`,
          "error",
        );
        return;
      }
    }
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.employees.forEach((employee) => {
        if (!selectedEmployeeIds.has(employee.id)) return;
        if (active) {
          employee.employmentStatus = active;
          employee.active = active !== "inactive";
        }
        if (profession) employee.profession = profession;
        if (weekend) employee.serviceWeekend = weekend;
        if (qualificationId && qualificationState) {
          employee.qualifications[qualificationId] = qualificationState === "add";
          if (qualificationState === "remove") {
            delete employee.qualificationExpiries[qualificationId];
          }
        }
        employee.updatedAt = now;
      });
    }, { undo: `Massenänderung an ${selectedEmployeeIds.size} Mitarbeitern` });
    if (!committed) return;
    markFormClean(elements.bulkEditForm);
    elements.bulkEditDialog.close();
    const changedCount = selectedEmployeeIds.size;
    selectedEmployeeIds.clear();
    showUndoToast(`${changedCount} Mitarbeiter wurden aktualisiert.`);
  }

  function openDataQualityDialog() {
    const issues = getDataQualityIssues();
    elements.dataQualityContent.innerHTML = issues.length
      ? `<div class="quality-issue-list">${issues
          .map(
            (issue) => `
              <button
                class="quality-issue ${issue.severity === "high" ? "is-high" : ""}"
                type="button"
                data-quality-employee="${issue.employeeId}"
              >
                <span class="status-badge ${issue.severity === "high" ? "expired" : "open"}">
                  ${issue.severity === "high" ? "Prüfen" : "Hinweis"}
                </span>
                <span>
                  <strong>${escapeHtml(issue.title)}</strong>
                  <small>${escapeHtml(issue.detail)}</small>
                </span>
              </button>
            `,
          )
          .join("")}</div>`
      : renderEmptyState({
          title: "Keine Auffälligkeiten gefunden",
          text: "Die automatischen Plausibilitätsprüfungen melden aktuell keine Probleme.",
          compact: true,
        });
    elements.dataQualityContent
      .querySelectorAll("[data-quality-employee]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          elements.dataQualityDialog.close();
          openEmployeeDialog(button.dataset.qualityEmployee);
        }),
      );
    elements.dataQualityDialog.showModal();
  }

  function getDataQualityIssues() {
    const issues = [];
    state.employees.forEach((employee, index) => {
      const normalizedEmail = employee.email.trim().toLocaleLowerCase("de-DE");
      if (employee.active && !employee.email && !employee.phone) {
        issues.push({
          employeeId: employee.id,
          severity: "low",
          title: `${fullName(employee)} ohne Kontaktdaten`,
          detail: "Weder E-Mail-Adresse noch Telefonnummer sind hinterlegt.",
        });
      }
      if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        issues.push({
          employeeId: employee.id,
          severity: "high",
          title: `${fullName(employee)} mit auffälliger E-Mail-Adresse`,
          detail: employee.email,
        });
      }
      if (employee.phone && !/^[+\d][\d\s()/.-]{5,}$/.test(employee.phone)) {
        issues.push({
          employeeId: employee.id,
          severity: "low",
          title: `${fullName(employee)} mit auffälliger Telefonnummer`,
          detail: employee.phone,
        });
      }
      state.employees.slice(index + 1).forEach((other) => {
        const sameName =
          fullName(employee).toLocaleLowerCase("de-DE") ===
          fullName(other).toLocaleLowerCase("de-DE");
        const sameBirthDate =
          employee.birthDate && employee.birthDate === other.birthDate;
        const sameEmail =
          normalizedEmail &&
          normalizedEmail === other.email.trim().toLocaleLowerCase("de-DE");
        if ((sameName && sameBirthDate) || sameEmail) {
          issues.push({
            employeeId: employee.id,
            severity: "high",
            title: `Mögliche Dublette: ${fullName(employee)}`,
            detail: `Ähnlichkeit mit ${fullName(other)} (${sameEmail ? "gleiche E-Mail" : "Name und Geburtsdatum"})`,
          });
        }
      });
    });
    return issues;
  }

  function openAuditLogDialog() {
    if (!requireAdmin()) return;
    elements.auditLogContent.innerHTML = state.auditLog.length
      ? `<div class="audit-list">${state.auditLog
          .map(
            (entry) => `
              <div class="audit-row">
                <span>${formatDateTime(entry.timestamp)}</span>
                <strong>${escapeHtml(entry.username)}</strong>
                <span>${escapeHtml(entry.action)}</span>
              </div>
            `,
          )
          .join("")}</div>`
      : renderEmptyState({
          title: "Noch keine Änderungen protokolliert",
          text: "Neue Änderungen werden ab dieser Anwendungsversion lokal aufgezeichnet.",
          compact: true,
        });
    elements.auditLogDialog.showModal();
  }

  function exportAuditLogCsv() {
    if (!requireAdmin() || state.auditLog.length === 0) {
      showToast("Das Änderungsprotokoll enthält noch keine Einträge.", "error");
      return;
    }
    downloadCsv(
      `teo-aenderungsprotokoll_${todayIso()}.csv`,
      ["Zeitpunkt", "Benutzer", "Änderung"],
      state.auditLog.map((entry) => [
        formatDateTime(entry.timestamp),
        entry.username,
        entry.action,
      ]),
    );
  }

  function renderRecentEmployees() {
    const employees = [...state.employees]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 4);

    if (employees.length === 0) {
      elements.recentEmployees.innerHTML = renderEmptyState({
        title: "Das Team ist noch leer",
        text: "Nach dem ersten Eintrag erscheinen die zuletzt bearbeiteten Mitarbeiter hier.",
        compact: true,
      });
      return;
    }

    elements.recentEmployees.innerHTML = `
      <div class="employee-strip">
        ${employees
          .map(
            (employee) => `
              <button
                class="employee-mini"
                type="button"
                data-edit-recent-employee="${employee.id}"
                aria-label="${escapeHtml(fullName(employee))} bearbeiten"
              >
                ${renderAvatar(employee)}
                <span>
                  <strong>${escapeHtml(fullName(employee))}</strong>
                  <small>${escapeHtml(
                    employee.profession || "Beruf nicht angegeben",
                  )} · ${escapeHtml(employeeStatusLabel(employee))}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderEmployees() {
    renderEmployeeFilterOptions();
    renderViewFilterChips("employees");
    const filtered = filteredEmployeesForTable();
    updateEmailExportButton();
    updateUsernameExportButton();
    updatePhoneListExportButton();

    updateEmployeeBulkBar();

    if (state.employees.length === 0) {
      elements.employeeTable.innerHTML = renderEmptyState({
        title: "Noch keine Mitarbeiter angelegt",
        text: "Erfassen Sie Stammdaten, Beschäftigungsumfang und Zusatzqualifikationen.",
        buttonText: "Ersten Mitarbeiter anlegen",
        buttonAttribute: "data-empty-add-employee",
      });
      elements.employeeTable
        .querySelector("[data-empty-add-employee]")
        ?.addEventListener("click", () => openEmployeeDialog());
      return;
    }

    if (filtered.length === 0) {
      elements.employeeTable.innerHTML = renderEmptyState({
        title: "Keine passenden Mitarbeiter",
        text: "Ändern Sie den Suchbegriff oder den ausgewählten Statusfilter.",
        compact: true,
      });
      return;
    }

    elements.employeeTable.innerHTML = `
      <div class="table-scroll">
        <table class="data-table employee-table"${employeeTableStyle()}>
          <thead>
            <tr>
              <th class="selection-column">
                <input
                  type="checkbox"
                  data-select-all-employees
                  aria-label="Alle sichtbaren Mitarbeiter auswählen"
                  ${filtered.every((employee) => selectedEmployeeIds.has(employee.id)) ? "checked" : ""}
                />
              </th>
              ${renderEmployeeSortHeader("name", "Mitarbeiter")}
              ${visibleEmployeeColumns()
                .map((column) => renderEmployeeSortHeader(column.key, column.label))
                .join("")}
              <th><span class="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(renderEmployeeRow).join("")}
          </tbody>
        </table>
      </div>
    `;
    renderEmployeeInspector();
  }

  function filteredEmployeesForTable() {
    return [...state.employees]
      .filter((employee) => {
        if (
          employeeStatusFilter !== "all" &&
          (employeeStatusFilter === "employed"
            ? employee.employmentStatus === "inactive"
            : employee.employmentStatus !== employeeStatusFilter)
        ) {
          return false;
        }
        if (
          employeeProfessionFilter !== "all" &&
          employee.profession !== employeeProfessionFilter
        ) {
          return false;
        }
        if (
          employeeQualificationFilter === "none" &&
          selectedQualificationCount(employee) > 0
        ) {
          return false;
        }
        if (
          !["all", "none"].includes(employeeQualificationFilter) &&
          !employee.qualifications[employeeQualificationFilter]
        ) {
          return false;
        }
        if (
          employeeWeekendFilter !== "all" &&
          employee.serviceWeekend !== employeeWeekendFilter
        ) {
          return false;
        }
        if (!employeeSearchTerm) return true;

        const haystack = searchKey(
          [employee.firstName, employee.lastName].join(" "),
        );
        return haystack.includes(employeeSearchTerm);
      })
      .sort(compareEmployeesForTable);
  }

  function renderEmployeeRow(employee) {
    const selectedQualifications = Object.entries(employee.qualifications)
      .filter(([, selected]) => selected)
      .map(([key]) => qualificationLabel(key));
    const trainingStats = getEmployeeTrainingStats(employee.id);
    const cells = employeeRowCells(employee, { selectedQualifications, trainingStats });

    return `
      <tr data-employee-row="${employee.id}" tabindex="0" class="${employeeInspectorId === employee.id ? "is-inspected" : ""}">
        <td class="selection-column">
          <input
            type="checkbox"
            data-select-employee="${employee.id}"
            aria-label="${escapeHtml(fullName(employee))} auswählen"
            ${selectedEmployeeIds.has(employee.id) ? "checked" : ""}
          />
        </td>
        <td data-column="name"${employeeColumnStyle("name")}>
          <div class="employee-cell">
            ${renderAvatar(employee)}
            <div>
              <strong>${escapeHtml(fullName(employee))}</strong>
              <small>${escapeHtml(
                [
                  employee.username
                    ? `Benutzername: ${employee.username}`
                    : "",
                  employee.email || employee.phone || "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Keine Kontaktdaten",
              )}</small>
            </div>
          </div>
        </td>
        ${visibleEmployeeColumns()
          .map((column) => cells[column.key])
          .join("")}
        <td>
          <div class="table-actions">
            <button
              class="icon-button"
              type="button"
              data-action="view-employee"
              data-id="${employee.id}"
              aria-label="Übersicht für ${escapeHtml(fullName(employee))} öffnen"
              title="Mitarbeiterakte"
            >
              <svg><use href="#icon-more"></use></svg>
            </button>
            <span>
            <button
              class="icon-button"
              type="button"
              data-action="edit-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="toggle-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} ${
                employee.active ? "deaktivieren" : "aktivieren"
              }"
              title="${employee.active ? "Deaktivieren" : "Aktivieren"}"
            >
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
            </span>
          </div>
        </td>
      </tr>
    `;
  }

  // Die wählbaren Spalten der Mitarbeitertabelle. Name, Auswahl und Aktionen
  // stehen immer; alles dazwischen lässt sich abwählen.
  function employeeRowCells(employee, { selectedQualifications, trainingStats }) {
    return {
      profession: `
        <td data-column="profession" class="${pinnedEmployeeColumn === "profession" ? "is-pinned-column" : ""}"${employeeColumnStyle("profession")}>
          <span class="profession-cell">
            <strong>${escapeHtml(employee.profession)}</strong>
            <small>Dienstwochenende: ${escapeHtml(
              serviceWeekendLabel(employee.serviceWeekend),
            )}</small>
          </span>
        </td>
      `,
      employment: `
        <td data-column="employment" class="${pinnedEmployeeColumn === "employment" ? "is-pinned-column" : ""}"${employeeColumnStyle("employment")}><strong>${employee.employmentPercent}&thinsp;%</strong></td>
      `,
      qualifications: `
        <td data-column="qualifications" class="${pinnedEmployeeColumn === "qualifications" ? "is-pinned-column" : ""}"${employeeColumnStyle("qualifications")}>
          <div class="qualification-tags">
            ${
              selectedQualifications.length
                ? selectedQualifications
                    .slice(0, 2)
                    .map((qualification) => `<span class="tag">${escapeHtml(qualification)}</span>`)
                    .join("") +
                  (selectedQualifications.length > 2
                    ? `<span class="tag tag-muted">+${selectedQualifications.length - 2}</span>`
                    : "")
                : '<span class="tag tag-muted">Keine</span>'
            }
          </div>
        </td>
      `,
      trainings: `
        <td data-column="trainings" class="${pinnedEmployeeColumn === "trainings" ? "is-pinned-column" : ""}"${employeeColumnStyle("trainings")}>
          <div class="table-progress">
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(fullName(employee))}: ${trainingStats.percent} Prozent der Pflichtfortbildungen aktuell"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${trainingStats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${trainingStats.percent}%` })}></div>
            </div>
            <span>${trainingStats.current}/${trainingStats.total}</span>
          </div>
        </td>
      `,
      status: `
        <td data-column="status" class="${pinnedEmployeeColumn === "status" ? "is-pinned-column" : ""}"${employeeColumnStyle("status")}>
          <span class="status-badge ${
            employee.employmentStatus === "inactive"
              ? "inactive"
              : employee.employmentStatus === "onboarding"
                ? "onboarding"
                : ""
          }">
            ${escapeHtml(employeeStatusLabel(employee))}
          </span>
        </td>
      `,
    };
  }

  function renderEmployeeSortHeader(key, label) {
    const active = employeeSortKey === key;
    const direction = active ? (employeeSortDirection === "asc" ? "▲" : "▼") : "";
    return `
      <th data-column="${key}" class="${pinnedEmployeeColumn === key ? "is-pinned-column" : ""}"${employeeColumnStyle(key)}>
        <button
          class="table-sort-button ${active ? "is-active" : ""}"
          type="button"
          data-employee-sort="${key}"
          aria-label="${escapeHtml(label)} sortieren"
        >
          ${escapeHtml(label)} <span aria-hidden="true">${direction}</span>
        </button>
        <span class="column-resize-handle" data-resize-employee-column="${key}" aria-hidden="true"></span>
      </th>
    `;
  }

  function compareEmployeesForTable(a, b) {
    const direction = employeeSortDirection === "asc" ? 1 : -1;
    const values = {
      name: () => sortEmployees(a, b),
      profession: () => a.profession.localeCompare(b.profession, "de"),
      employment: () => a.employmentPercent - b.employmentPercent,
      qualifications: () =>
        selectedQualificationCount(a) - selectedQualificationCount(b),
      trainings: () =>
        getEmployeeTrainingStats(a.id).percent - getEmployeeTrainingStats(b.id).percent,
      status: () =>
        employmentStatusOrder(a.employmentStatus) -
        employmentStatusOrder(b.employmentStatus),
    };
    return direction * (values[employeeSortKey]?.() || sortEmployees(a, b));
  }

  function selectedQualificationCount(employee) {
    return Object.values(employee.qualifications).filter(Boolean).length;
  }

  function renderEmployeeFilterOptions() {
    const professionValue = employeeProfessionFilter;
    elements.employeeProfessionFilter.innerHTML = [
      '<option value="all">Alle Berufe</option>',
      ...state.catalogs.professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    elements.employeeProfessionFilter.value = state.catalogs.professions.includes(
      professionValue,
    )
      ? professionValue
      : "all";
    employeeProfessionFilter = elements.employeeProfessionFilter.value;

    const qualificationValue = employeeQualificationFilter;
    elements.employeeQualificationFilter.innerHTML = [
      '<option value="all">Alle Qualifikationen</option>',
      '<option value="none">Keine Qualifikation</option>',
      ...state.catalogs.qualifications.map(
        (qualification) =>
          `<option value="${qualification.id}">${escapeHtml(qualification.label)}</option>`,
      ),
    ].join("");
    elements.employeeQualificationFilter.value =
      qualificationValue === "none" ||
      state.catalogs.qualifications.some(
        (qualification) => qualification.id === qualificationValue,
      )
      ? qualificationValue
      : "all";
    employeeQualificationFilter = elements.employeeQualificationFilter.value;
    elements.employeeWeekendFilter.innerHTML = [
      '<option value="all">Alle Dienstwochenenden</option>',
      serviceWeekendOptionsMarkup(),
    ].join("");
    elements.employeeWeekendFilter.value = [
      "all",
      "none",
      ...SERVICE_WEEKEND_KEYS,
    ].includes(employeeWeekendFilter)
      ? employeeWeekendFilter
      : "all";
    employeeWeekendFilter = elements.employeeWeekendFilter.value;
  }

  function renderTrainings() {
    const availableYears = getTrainingDisplayYears();
    if (!availableYears.includes(trainingDisplayYear)) {
      trainingDisplayYear = new Date().getFullYear();
    }
    elements.trainingDisplayYear.innerHTML = availableYears
      .map(
        (year) =>
          `<option value="${year}" ${year === trainingDisplayYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");

    const displayedTrainings = trainingObligations().filter(
      (training) => training.year <= trainingDisplayYear,
    );
    const activeCount = activeEmployeeList().length;
    const totalAssignments = activeCount * displayedTrainings.length;
    const currentAssignments = displayedTrainings.reduce(
      (sum, training) => sum + getTrainingStats(training).current,
      0,
    );
    const openAssignments = Math.max(0, totalAssignments - currentAssignments);

    elements.trainingSummary.innerHTML = `
      ${renderSummaryChip("training", displayedTrainings.length, `im Katalog ${trainingDisplayYear}`)}
      ${renderSummaryChip("check", currentAssignments, "aktuelle Nachweise", "teal")}
      ${renderSummaryChip("alert", openAssignments, "offene Nachweise", "orange")}
    `;
    elements.openTrainingMatrixButton.disabled = state.trainings.length === 0;

    if (state.trainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Pflichtfortbildungen",
            text: "Legen Sie eine Fortbildung an und erfassen Sie anschließend die absolvierten Nachweise aktiver Mitarbeiter.",
            buttonText: "Erste Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    if (displayedTrainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: `Bis ${trainingDisplayYear} keine Pflichtfortbildungen`,
            text: "Wählen Sie ein späteres Jahr oder ergänzen Sie den Fortbildungskatalog.",
            buttonText: "Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    elements.trainingList.innerHTML = groupTrainingsByYear(displayedTrainings)
      .map(
        ([year, trainings]) => `
          <section class="training-year-group" aria-labelledby="trainingYear${year}">
            <div class="training-year-header">
              <div>
                <p class="eyebrow">Im Katalog seit</p>
                <h2 id="trainingYear${year}">${year}</h2>
              </div>
              <span>${trainings.length} Fortbildung${trainings.length === 1 ? "" : "en"}</span>
            </div>
            <div class="training-year-items">
              ${trainings.map(renderTrainingCard).join("")}
            </div>
          </section>
        `,
      )
      .join("");
  }

  function getTrainingDisplayYears() {
    return [
      ...new Set([
        new Date().getFullYear(),
        ...state.trainings.map((training) => Number(training.year)),
      ]),
    ]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((yearA, yearB) => yearB - yearA);
  }

  function formatMinutesAsHoursAndMinutes(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function formatSecondsAsMinutesAndSeconds(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatSecondsAsRoundedMinutes(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const roundedMinutes = Math.round(safeSeconds / 60);
    return `${roundedMinutes} Minute${roundedMinutes === 1 ? "" : "n"}`;
  }

  function openTrainingTimeCalculator() {
    elements.timeSpanList.innerHTML = Array.from({ length: 20 }, (_, index) => `
      <div class="time-span-row">
        <span>${index + 1}.</span>
        <label>
          <span class="sr-only">Minuten der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-minutes placeholder="0" />
          <small>Min.</small>
        </label>
        <span aria-hidden="true">:</span>
        <label>
          <span class="sr-only">Sekunden der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-seconds placeholder="00" />
          <small>Sek.</small>
        </label>
      </div>
    `).join("");

    const configuredTrainings = state.trainings
      .filter((training) => Number.isInteger(training.targetMinutes) && training.targetMinutes > 0)
      .sort(
        (trainingA, trainingB) =>
          trainingA.title.localeCompare(trainingB.title, "de") ||
          trainingB.year - trainingA.year,
      );
    elements.creditedTrainingTimeList.innerHTML = configuredTrainings.length
      ? configuredTrainings
          .map(
            (training) => `
              <label class="credited-training-time-row">
                <span>
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</small>
                </span>
                <span class="input-suffix">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-credited-training-minutes
                    data-training-id="${training.id}"
                    aria-label="Anrechenbare Minuten für ${escapeHtml(training.title)}"
                  />
                  <span>Min.</span>
                </span>
              </label>
            `,
          )
          .join("")
      : `<div class="time-calculator-empty">
          <strong>Keine Soll-Zeiten hinterlegt</strong>
          <p>Unter Einstellungen → Pflichtfortbildungen können Sie Soll-Zeiten in Minuten eintragen.</p>
        </div>`;

    updateTimeSpanTotal();
    updateCreditedTrainingTimeTotal();
    elements.trainingTimeCalculatorDialog.showModal();
    window.setTimeout(() => elements.timeSpanList.querySelector("input")?.focus(), 0);
  }

  function updateTimeSpanTotal() {
    const rows = [...elements.timeSpanList.querySelectorAll(".time-span-row")];
    const totalSeconds = rows.reduce((sum, row) => {
      const minutes = Math.max(
        0,
        Number(row.querySelector("[data-time-minutes]").value) || 0,
      );
      const seconds = Math.max(
        0,
        Number(row.querySelector("[data-time-seconds]").value) || 0,
      );
      return sum + Math.round(minutes * 60 + seconds);
    }, 0);
    elements.timeSpanTotalRoundedMinutes.textContent =
      formatSecondsAsRoundedMinutes(totalSeconds);
    elements.timeSpanTotalFormatted.value = formatSecondsAsMinutesAndSeconds(totalSeconds);
  }

  function updateCreditedTrainingTimeTotal() {
    const totalMinutes = [...elements.creditedTrainingTimeList.querySelectorAll(
      "[data-credited-training-minutes]",
    )].reduce((sum, input) => {
      const minutes = Math.max(0, Math.round(Number(input.value) || 0));
      return sum + minutes;
    }, 0);
    elements.creditedTrainingTotalMinutes.textContent = `${totalMinutes} Minute${totalMinutes === 1 ? "" : "n"}`;
    elements.creditedTrainingTotalFormatted.value = formatMinutesAsHoursAndMinutes(totalMinutes);
  }

  function groupTrainingsByYear(trainings = state.trainings) {
    const groups = new Map();
    trainings.forEach((training) => {
      if (!groups.has(training.year)) groups.set(training.year, []);
      groups.get(training.year).push(training);
    });

    return [...groups.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, trainings]) => [
        year,
        trainings.sort((a, b) => a.title.localeCompare(b.title, "de")),
      ]);
  }

  function openTrainingMatrixDialog() {
    const years = getTrainingEvaluationYears();
    if (years.length === 0) {
      showToast("Für die Auswertung sind noch keine Pflichtfortbildungen vorhanden.", "error");
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = years.includes(currentYear) ? currentYear : years[0];
    elements.trainingMatrixYear.innerHTML = years
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");
    renderTrainingRateHistory(years);
    renderTrainingMatrix();
    elements.trainingMatrixDialog.showModal();
  }

  function renderTrainingRateHistory(years = getTrainingEvaluationYears()) {
    const annualRates = [...years]
      .sort((yearA, yearB) => yearA - yearB)
      .map((year) => ({ year, rate: getAnnualTrainingMatrix(year).completionRate }));
    elements.trainingRateHistoryChart.innerHTML = annualRates.length
      ? `<div class="training-rate-chart" role="img" aria-label="${escapeHtml(
          annualRates.map(({ year, rate }) => `${year}: ${rate} Prozent`).join(", "),
        )}">
          ${annualRates
            .map(
              ({ year, rate }) => `
                <div class="training-rate-bar-row">
                  <strong>${year}</strong>
                  <div class="training-rate-bar-track" aria-hidden="true">
                    <span${dynamicStyle({ "--training-rate": `${rate}%` })}></span>
                  </div>
                  <span>${rate}&thinsp;%</span>
                </div>
              `,
            )
            .join("")}
        </div>`
      : '<p class="training-rate-chart-empty">Noch keine Jahresdaten vorhanden.</p>';
  }

  function renderTrainingMatrix() {
    const year = Number(elements.trainingMatrixYear.value);
    const matrix = getAnnualTrainingMatrix(year);
    elements.trainingMatrixDialogTitle.textContent = `Status der Pflichtfortbildungen · ${year}`;
    elements.trainingMatrixSummary.innerHTML = `
      <strong>${matrix.completedAssignments} von ${matrix.totalAssignments}</strong>
      <span>Pflichten zum Jahresende erfüllt · ${matrix.completionRate}&thinsp;%</span>
    `;

    if (matrix.employees.length === 0) {
      elements.trainingMatrixContent.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Für die Jahresauswertung wird mindestens ein aktiver Mitarbeiter benötigt.",
        compact: true,
      });
      return;
    }

    elements.trainingMatrixContent.innerHTML = `
      <div
        class="training-matrix-horizontal-scroll"
        tabindex="0"
        aria-label="Fortbildungsspalten horizontal scrollen"
      >
        <div class="training-matrix-horizontal-spacer"></div>
      </div>
      <div class="training-matrix-scroll" tabindex="0" aria-label="Fortbildungsmatrix ${year}">
        <table class="training-matrix-table">
          <thead>
            <tr>
              <th scope="col">Aktive Mitarbeiter</th>
              ${matrix.trainingColumns
                .map(
                  ({ training, completedCount, completionRate }) => `
                    <th scope="col" title="${escapeHtml(training.title)}">
                      <span>${escapeHtml(training.title)}</span>
                      <small
                        class="completion-progress ${completionProgressTone(completionRate)}"
                        title="${completedCount} von ${matrix.employees.length} aktiven Mitarbeitern erfüllen diese Pflicht zum Jahresende"
                      >
                        ${completionRate}&thinsp;% erfüllt
                      </small>
                    </th>
                  `,
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${matrix.rows
              .map(
                (row) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="training-matrix-employee-link"
                        type="button"
                        data-training-matrix-employee="${row.employee.id}"
                        title="Mitarbeiter-Akte von ${escapeHtml(fullName(row.employee))} öffnen"
                      >${escapeHtml(fullName(row.employee))}</button>
                    </th>
                    ${row.statuses
                      .map(
                        ({ training, completed }) => `
                          <td>
                            <span
                              class="matrix-status ${completed ? "matrix-complete" : "matrix-open"}"
                              role="img"
                              aria-label="${escapeHtml(
                                `${fullName(row.employee)}: ${training.title} ${
                                  completed ? "für das Auswertungsjahr erfüllt" : "offen"
                                }`,
                              )}"
                              title="${
                                completed
                                  ? "Für das Auswertungsjahr erfüllt"
                                  : "Zum Jahresende offen"
                              }"
                            >${completed ? "✓" : "×"}</span>
                          </td>
                        `,
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    elements.trainingMatrixContent
      .querySelectorAll("[data-training-matrix-employee]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          elements.trainingMatrixDialog.close();
          openEmployeeDossier(button.dataset.trainingMatrixEmployee);
        }),
      );
    bindTrainingMatrixScrollers();
  }

  function bindTrainingMatrixScrollers() {
    const horizontalScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-horizontal-scroll",
    );
    const matrixScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-scroll",
    );
    const spacer = horizontalScroll?.querySelector(
      ".training-matrix-horizontal-spacer",
    );
    if (!horizontalScroll || !matrixScroll || !spacer) return;

    let syncing = false;
    const synchronize = (source, target) => {
      if (syncing) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };
    horizontalScroll.addEventListener("scroll", () =>
      synchronize(horizontalScroll, matrixScroll),
    );
    matrixScroll.addEventListener("scroll", () =>
      synchronize(matrixScroll, horizontalScroll),
    );

    window.requestAnimationFrame(() => {
      spacer.style.width = `${matrixScroll.scrollWidth}px`;
      horizontalScroll.hidden =
        matrixScroll.scrollWidth <= matrixScroll.clientWidth + 1;
      horizontalScroll.scrollLeft = matrixScroll.scrollLeft;
    });
  }

  function printTrainingMatrix() {
    if (!elements.trainingMatrixDialog.open) return;
    window.print();
  }

  function exportTrainingMatrixCsv() {
    const year = Number(elements.trainingMatrixYear.value);
    const matrix = getAnnualTrainingMatrix(year);
    if (!matrix.employees.length || !matrix.trainings.length) {
      showToast("Für dieses Jahr sind keine auswertbaren Fortbildungsdaten vorhanden.", "error");
      return;
    }

    downloadCsv(
      `teo-pflichtfortbildungen_${year}.csv`,
      ["Mitarbeiter", ...matrix.trainings.map((training) => training.title)],
      matrix.rows.map((row) => [
        fullName(row.employee),
        ...row.statuses.map(({ completed }) => (completed ? "Erfüllt" : "Offen")),
      ]),
    );
  }

  function getAnnualTrainingMatrix(year) {
    const referenceDate = `${year}-12-31`;
    const trainings = trainingObligations()
      .filter((training) => training.year <= year)
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    const employees = [...activeEmployeeList()].sort(sortEmployees);
    let completedAssignments = 0;
    const completedPerTraining = trainings.map(() => 0);
    const rows = employees.map((employee) => ({
      employee,
      statuses: trainings.map((training, trainingIndex) => {
        const latest = latestCompletionForTraining(
          employee.id,
          training,
          referenceDate,
        );
        const completed = Boolean(
          latest &&
            (!training.recurrenceMonths ||
              addMonths(latest.completedOn, training.recurrenceMonths) >= referenceDate),
        );
        if (completed) {
          completedAssignments += 1;
          completedPerTraining[trainingIndex] += 1;
        }
        return { training, completed, completion: latest || null };
      }),
    }));
    const totalAssignments = employees.length * trainings.length;

    return {
      year,
      trainings,
      // Je Fortbildung, wie viele der aktiven Mitarbeiter sie zum Jahresende
      // erfuellt haben - Grundlage fuer den Komplettierungsgrad in der Spalte.
      trainingColumns: trainings.map((training, trainingIndex) => ({
        training,
        completedCount: completedPerTraining[trainingIndex],
        completionRate: percentage(completedPerTraining[trainingIndex], employees.length),
      })),
      employees,
      rows,
      completedAssignments,
      totalAssignments,
      completionRate: percentage(completedAssignments, totalAssignments),
    };
  }

  function getTrainingEvaluationYears() {
    const currentYear = new Date().getFullYear();
    const trainingYears = state.trainings
      .map((training) => Number(training.year))
      .filter(Number.isInteger);
    const completionYears = [];
    state.completions.forEach((completion) => {
      const completionYear = Number(completion.completedOn.slice(0, 4));
      if (Number.isInteger(completionYear)) completionYears.push(completionYear);
    });
    const firstYear = trainingYears.length
      ? Math.min(...trainingYears)
      : completionYears.length
        ? Math.min(...completionYears)
        : currentYear;
    const lastYear = Math.max(currentYear, ...trainingYears, ...completionYears);
    const years = new Set();
    for (let year = firstYear; year <= lastYear; year += 1) years.add(year);
    return [...years].sort((a, b) => b - a);
  }

  function renderSummaryChip(icon, value, label, tone = "blue") {
    const tones = {
      teal: "summary-chip-icon-teal",
      orange: "summary-chip-icon-orange",
      blue: "",
    };

    return `
      <article class="summary-chip">
        <span class="summary-chip-icon ${tones[tone] || ""}">
          <svg><use href="#icon-${icon}"></use></svg>
        </span>
        <span>
          <strong>${value}</strong>
          <small>${label}</small>
        </span>
      </article>
    `;
  }

  function renderTrainingCard(training) {
    const stats = getTrainingStats(training);
    const activeCount = activeEmployeeList().length;
    const history = state.completions
      .filter((completion) => completionMatchesTraining(completion, training))
      .sort(
        (a, b) =>
          b.completedOn.localeCompare(a.completedOn) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );

    return `
      <article class="training-card">
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-training"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(training.title)}</h2>
              <p>${escapeHtml(training.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${recurrenceLabel(training)}
              </span>
              ${
                training.targetMinutes
                  ? `<span class="training-meta"><svg><use href="#icon-chart"></use></svg>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</span>`
                  : ""
              }
            </div>
          </div>
          <div class="training-progress-block">
            <strong>
              <span>Aktueller Stand</span>
              <span>${activeCount ? `${stats.current} von ${activeCount}` : "Kein aktives Personal"}</span>
            </strong>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${stats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${stats.percent}%` })}></div>
            </div>
            <small>${stats.open} Nachweis${stats.open === 1 ? "" : "e"} offen</small>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-completion"
              data-id="${training.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Abschluss
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <details class="training-card-details">
          <summary>${history.length} erfasste${history.length === 1 ? "r" : ""} Nachweis${
            history.length === 1 ? "" : "e"
          }${training.recurrenceMonths ? " in dieser Fortbildungsreihe" : ""}</summary>
          <div class="completion-history">
            ${
              history.length
                ? history.map((completion) => renderCompletionRow(completion, training)).join("")
                : '<p class="completion-empty">Für diese Fortbildung wurde noch kein Abschluss erfasst.</p>'
            }
          </div>
        </details>
      </article>
    `;
  }

  function renderCompletionRow(completion, training) {
    const employee = getEmployee(completion.employeeId);
    if (!employee) return "";

    const validity = training.recurrenceMonths
      ? `gültig bis ${formatDate(addMonths(completion.completedOn, training.recurrenceMonths))}`
      : "ohne Ablauf";

    return `
      <div class="completion-row">
        <div class="completion-person">
          ${renderAvatar(employee, true)}
          <strong>${escapeHtml(fullName(employee))}</strong>
        </div>
        <span>${formatDate(completion.completedOn)}</span>
        <span title="${escapeHtml(completion.note || validity)}">${escapeHtml(
          completion.note || validity,
        )}</span>
        <button
          class="icon-button danger"
          type="button"
          data-action="delete-completion"
          data-id="${completion.id}"
          aria-label="Nachweis von ${escapeHtml(fullName(employee))} löschen"
          title="Nachweis löschen"
        >
          <svg><use href="#icon-trash"></use></svg>
        </button>
      </div>
    `;
  }
