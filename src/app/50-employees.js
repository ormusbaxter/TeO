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
      // Der Status wird nicht von selbst umgestellt: Ein Austritt kann sich
      // verschieben, und ein stiller Statuswechsel nähme den Mitarbeiter aus
      // Fortbildungen und Sitzungen, ohne dass es jemand bemerkt.
      if (employee.active && employee.exitDate && employee.exitDate < todayIso()) {
        issues.push({
          employeeId: employee.id,
          severity: "high",
          title: `${fullName(employee)} ist ausgetreten, aber noch aktiv`,
          detail: `Austritt am ${formatDate(employee.exitDate)} – Status auf „Inaktiv“ setzen.`,
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
                <span>${escapeHtml(entry.action)}${
                  entry.subjects?.length
                    ? `<small class="audit-subjects">${escapeHtml(auditSubjectNames(entry))}</small>`
                    : ""
                }</span>
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

  // Geloeschte Mitarbeiter stehen nicht mehr im Bestand; sie erscheinen als
  // „gelöschter Mitarbeiter“, damit der Eintrag lesbar bleibt.
  function auditSubjectNames(entry, limit = 3) {
    const names = (entry.subjects || []).map((subject) => {
      const employee = getEmployee(subject.employeeId);
      return employee ? fullName(employee) : "gelöschter Mitarbeiter";
    });
    if (names.length <= limit) return names.join(" · ");
    return `${names.slice(0, limit).join(" · ")} und ${names.length - limit} weitere`;
  }

  function exportAuditLogCsv() {
    if (!requireAdmin() || state.auditLog.length === 0) {
      showToast("Das Änderungsprotokoll enthält noch keine Einträge.", "error");
      return;
    }
    downloadCsv(
      `teo-aenderungsprotokoll_${todayIso()}.csv`,
      ["Zeitpunkt", "Benutzer", "Änderung", "Betroffene Mitarbeiter"],
      state.auditLog.map((entry) => [
        formatDateTime(entry.timestamp),
        entry.username,
        entry.action,
        auditSubjectNames(entry, Infinity),
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
          employeeSearchText(employee),
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
        <td data-column="employment" class="${pinnedEmployeeColumn === "employment" ? "is-pinned-column" : ""}"${employeeColumnStyle("employment")}><strong>${currentEmploymentPercent(employee)}&thinsp;%</strong>${
          upcomingEmploymentChange(employee)
            ? `<small class="employment-change-note">ab ${formatDate(upcomingEmploymentChange(employee).from)}: ${upcomingEmploymentChange(employee).percent}&thinsp;%</small>`
            : ""
        }</td>
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
      employment: () => currentEmploymentPercent(a) - currentEmploymentPercent(b),
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
