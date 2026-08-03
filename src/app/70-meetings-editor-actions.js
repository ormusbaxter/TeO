  function renderMeetings() {
    const meetingStats = state.meetings.map((meeting) => getMeetingStats(meeting));
    const completedMeetings = meetingStats.filter(
      (stats) => stats.total > 0 && stats.documented === stats.total,
    ).length;
    const openEntries = meetingStats.reduce((sum, stats) => sum + stats.open, 0);

    elements.meetingSummary.innerHTML = `
      ${renderSummaryChip("meeting", state.meetings.length, "Teamsitzungen angelegt")}
      ${renderSummaryChip("check", completedMeetings, "vollständig dokumentiert", "teal")}
      ${renderSummaryChip("alert", openEntries, "Teilnahmestatus offen", "orange")}
    `;
    elements.openMeetingStatsButton.disabled = state.meetings.length === 0;

    if (state.meetings.length === 0) {
      elements.meetingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Teamsitzungen",
            text: "Legen Sie die erste Sitzung an. Anschließend kann der Status des gesamten aktiven Teams gesammelt erfasst werden.",
            buttonText: "Erste Teamsitzung anlegen",
            buttonAttribute: "data-empty-add-meeting",
          })}
        </section>
      `;
      elements.meetingList
        .querySelector("[data-empty-add-meeting]")
        ?.addEventListener("click", () => openMeetingDialog());
      return;
    }

    elements.meetingList.innerHTML = [...state.meetings]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt),
      )
      .map(renderMeetingCard)
      .join("");
  }

  function renderMeetingCard(meeting) {
    const stats = getMeetingStats(meeting);
    const records = state.meetingAttendances
      .filter((attendance) => attendance.meetingId === meeting.id)
      .sort((a, b) => {
        const employeeA = getEmployee(a.employeeId);
        const employeeB = getEmployee(b.employeeId);
        if (!employeeA || !employeeB) return 0;
        return sortEmployees(employeeA, employeeB);
      });
    const breakdown = Object.keys(ATTENDANCE_STATUSES)
      .map((status) => ({
        status,
        count: records.filter((record) => record.status === status).length,
      }))
      .filter((item) => item.count > 0);

    return `
      <article class="meeting-card">
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon meeting-icon">
              <svg><use href="#icon-meeting"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(meeting.title)}</h2>
              <p>${escapeHtml(meeting.notes || "Keine Bemerkung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${formatDate(meeting.date)}${meeting.time ? ` · ${formatTime(meeting.time)} Uhr` : ""}
              </span>
            </div>
          </div>
          <div class="meeting-progress-block">
            <div class="meeting-progress-label">
              <strong>${stats.documented} von ${stats.total} dokumentiert</strong>
              <span>${stats.percent}&thinsp;%</span>
            </div>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(meeting.title)}: ${stats.percent} Prozent dokumentiert"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${stats.percent}"
            >
              <div class="progress-bar" style="--progress: ${stats.percent}%"></div>
            </div>
            <div class="meeting-breakdown">
              ${
                breakdown.length
                  ? breakdown
                      .map(
                        ({ status, count }) =>
                          `<span class="attendance-badge attendance-${ATTENDANCE_STATUSES[status].tone}">${count} ${escapeHtml(
                            ATTENDANCE_STATUSES[status].label,
                          )}</span>`,
                      )
                      .join("")
                  : '<span class="attendance-badge attendance-muted">Noch keine Erfassung</span>'
              }
            </div>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="record-attendance"
              data-id="${meeting.id}"
            >
              <svg><use href="#icon-users"></use></svg>
              Teilnahme erfassen
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-meeting"
              data-id="${meeting.id}"
              aria-label="${escapeHtml(meeting.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-meeting"
              data-id="${meeting.id}"
              aria-label="${escapeHtml(meeting.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <details class="training-card-details">
          <summary>${records.length} dokumentierte${records.length === 1 ? "r" : ""} Status${
            records.length === 1 ? "" : ""
          }</summary>
          <div class="meeting-attendance-history">
            ${
              records.length
                ? records.map(renderMeetingAttendanceHistoryRow).join("")
                : '<p class="completion-empty">Die Teilnahme wurde noch nicht dokumentiert.</p>'
            }
          </div>
        </details>
      </article>
    `;
  }

  function renderMeetingAttendanceHistoryRow(attendance) {
    const employee = getEmployee(attendance.employeeId);
    const status = ATTENDANCE_STATUSES[attendance.status];
    if (!employee || !status) return "";

    return `
      <div class="meeting-history-row">
        <div class="completion-person">
          ${renderAvatar(employee, true)}
          <strong>${escapeHtml(fullName(employee))}</strong>
          ${
            employee.employmentStatus === "active"
              ? ""
              : `<span class="tag tag-muted">${escapeHtml(
                  employeeStatusLabel(employee),
                )}</span>`
          }
        </div>
        <span class="attendance-badge attendance-${status.tone}">${escapeHtml(status.label)}</span>
      </div>
    `;
  }

  function openMeetingStatsDialog() {
    const years = [...new Set(
      state.meetings
        .map((meeting) => Number(meeting.date.slice(0, 4)))
        .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100),
    )].sort((a, b) => b - a);

    if (years.length === 0) {
      showToast("Für die Auswertung sind noch keine Teamsitzungen vorhanden.", "error");
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = years.includes(currentYear) ? currentYear : years[0];
    elements.meetingStatsYear.innerHTML = years
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");
    elements.meetingAttendanceThreshold.value = String(
      state.settings.meetingAttendanceThreshold,
    );
    renderMeetingStatistics();
    elements.meetingStatsDialog.showModal();
  }

  function renderMeetingStatistics() {
    const year = Number(elements.meetingStatsYear.value);
    const statistics = getAnnualMeetingStatistics(year);

    if (statistics.meetingCount === 0) {
      elements.meetingStatsContent.innerHTML = renderEmptyState({
        title: "Keine Teamsitzungen in diesem Jahr",
        text: "Wählen Sie ein anderes Auswertungsjahr.",
        compact: true,
      });
      return;
    }

    const chartSegments = [
      ...Object.entries(ATTENDANCE_STATUSES).map(([status, config]) => ({
        key: status,
        label: config.label,
        count: statistics.statusCounts[status],
        color: ATTENDANCE_CHART_COLORS[status],
      })),
      {
        key: "open",
        label: "Noch offen",
        count: statistics.open,
        color: ATTENDANCE_CHART_COLORS.open,
      },
    ].filter((segment) => segment.count > 0);
    let chartPosition = 0;
    const chartStops = chartSegments
      .map((segment) => {
        const start = chartPosition;
        chartPosition += statistics.totalSlots
          ? (segment.count / statistics.totalSlots) * 100
          : 0;
        return `${segment.color} ${start.toFixed(2)}% ${chartPosition.toFixed(2)}%`;
      })
      .join(", ");
    const chartDescription = chartSegments
      .map((segment) => `${segment.label}: ${segment.count}`)
      .join(", ") || "Keine erwarteten Personenplätze";
    const chartBackground = chartStops
      ? `conic-gradient(${chartStops})`
      : "var(--slate-100)";

    elements.meetingStatsContent.innerHTML = `
      <div class="meeting-stat-cards">
        ${renderMeetingStatCard("Teamsitzungen", statistics.meetingCount, `${year}`)}
        ${renderMeetingStatCard(
          "Ø Teilnahmen",
          formatDecimal(statistics.averageParticipated),
          "pro Sitzung",
        )}
        ${renderMeetingStatCard(
          "Ø Abwesenheiten",
          formatDecimal(statistics.averageAbsent),
          "pro Sitzung",
        )}
        ${renderMeetingStatCard(
          "Teilnahmequote",
          `${statistics.attendanceRate} %`,
          "der dokumentierten Status",
        )}
        ${renderMeetingStatCard(
          "Dokumentationsstand",
          `${statistics.documentationRate} %`,
          `${statistics.documented} von ${statistics.totalSlots} Status`,
        )}
      </div>

      <section class="meeting-chart-section" aria-labelledby="meetingChartTitle">
        <div class="meeting-chart-copy">
          <p class="eyebrow">Verteilung aller Personenplätze</p>
          <h3 id="meetingChartTitle">Teilnahmen und Abwesenheitsgründe</h3>
          <p>
            Grundlage sind ${statistics.totalSlots} erwartete Personenplätze aus
            ${statistics.meetingCount} Sitzung${statistics.meetingCount === 1 ? "" : "en"}.
          </p>
        </div>
        <div class="meeting-chart-layout">
          <div
            class="meeting-pie-chart"
            role="img"
            aria-label="${escapeHtml(chartDescription)}"
            style="--chart-segments: ${chartBackground}"
          >
            <span>
              <strong>${statistics.participated}</strong>
              Teilnahmen
            </span>
          </div>
          <div class="meeting-chart-legend">
            ${
              chartSegments.length
                ? chartSegments
                    .map(
                      (segment) => `
                  <div class="meeting-legend-item">
                    <span
                      class="meeting-legend-color"
                      style="--legend-color: ${segment.color}"
                      aria-hidden="true"
                    ></span>
                    <span>${escapeHtml(segment.label)}</span>
                    <strong>${segment.count}</strong>
                    <small>${percentage(segment.count, statistics.totalSlots)} %</small>
                  </div>
                `,
                    )
                    .join("")
                : '<p class="meeting-chart-empty">Für diese Sitzungen waren keine Mitarbeiter hinterlegt.</p>'
            }
          </div>
        </div>
      </section>

      <section class="meeting-stat-table-section" aria-labelledby="meetingStatTableTitle">
        <h3 id="meetingStatTableTitle">Sitzungen im Jahresvergleich</h3>
        <div class="meeting-stat-table-wrap">
          <table class="meeting-stat-table">
            <thead>
              <tr>
                <th scope="col">Datum</th>
                <th scope="col">Teamsitzung</th>
                <th scope="col">Teilgenommen</th>
                <th scope="col">Abwesend</th>
                <th scope="col">Offen</th>
              </tr>
            </thead>
            <tbody>
              ${statistics.meetings
                .map(
                  (meeting) => `
                    <tr>
                      <td>${formatDate(meeting.date)}</td>
                      <td>${escapeHtml(meeting.title)}</td>
                      <td>${meeting.participated}</td>
                      <td>${meeting.absent}</td>
                      <td>${meeting.open}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="meeting-stat-table-section" aria-labelledby="employeeMeetingStatTitle">
        <h3 id="employeeMeetingStatTitle">Teilnahme je Mitarbeiter</h3>
        <p class="field-hint">
          Markiert werden Quoten unter ${state.settings.meetingAttendanceThreshold} %.
        </p>
        <div class="meeting-stat-table-wrap">
          <table class="meeting-stat-table employee-meeting-stat-table">
            <thead>
              <tr>
                <th scope="col">Mitarbeiter</th>
                <th scope="col">Erwartet</th>
                <th scope="col">Teilgenommen</th>
                <th scope="col">Urlaub</th>
                <th scope="col">Dienst</th>
                <th scope="col">Krankheit</th>
                <th scope="col">Schule</th>
                <th scope="col">Entschuldigt</th>
                <th scope="col">Unentschuldigt</th>
                <th scope="col">Quote</th>
              </tr>
            </thead>
            <tbody>
              ${statistics.employeeRows
                .map(
                  (employee) => `
                    <tr class="${
                      employee.expected > 0 &&
                      employee.attendanceRate < state.settings.meetingAttendanceThreshold
                        ? "is-below-threshold"
                        : ""
                    }">
                      <td>${escapeHtml(employee.name)}</td>
                      <td>${employee.expected}</td>
                      <td>${employee.statusCounts.teilgenommen}</td>
                      <td>${employee.statusCounts.urlaub}</td>
                      <td>${employee.statusCounts.dienst}</td>
                      <td>${employee.statusCounts.krankheit}</td>
                      <td>${employee.statusCounts.schule}</td>
                      <td>${employee.statusCounts.entschuldigt}</td>
                      <td>${employee.statusCounts.unentschuldigt}</td>
                      <td><strong>${employee.attendanceRate} %</strong></td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  async function updateMeetingAttendanceThreshold() {
    const threshold = clampNumber(
      elements.meetingAttendanceThreshold.value,
      1,
      100,
      70,
    );
    if (threshold === state.settings.meetingAttendanceThreshold) return;
    const committed = await commitStateMutation(() => {
      state.settings.meetingAttendanceThreshold = threshold;
    });
    if (committed) renderMeetingStatistics();
  }

  function exportMeetingStatsCsv() {
    const year = Number(elements.meetingStatsYear.value);
    const statistics = getAnnualMeetingStatistics(year);
    if (!statistics.employeeRows.length) {
      showToast("Für dieses Jahr sind keine Mitarbeiterdaten vorhanden.", "error");
      return;
    }
    downloadCsv(
      `teo-teamsitzungen_${year}.csv`,
      [
        "Mitarbeiter",
        "Erwartet",
        "Teilgenommen",
        "Urlaub",
        "Dienst",
        "Krankheit",
        "Schule",
        "Entschuldigt",
        "Unentschuldigt",
        "Offen",
        "Teilnahmequote",
      ],
      statistics.employeeRows.map((employee) => [
        employee.name,
        employee.expected,
        employee.statusCounts.teilgenommen,
        employee.statusCounts.urlaub,
        employee.statusCounts.dienst,
        employee.statusCounts.krankheit,
        employee.statusCounts.schule,
        employee.statusCounts.entschuldigt,
        employee.statusCounts.unentschuldigt,
        employee.open,
        `${employee.attendanceRate} %`,
      ]),
    );
  }

  function renderMeetingStatCard(label, value, detail) {
    return `
      <div class="meeting-stat-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
    `;
  }

  function renderEmptyState({ title, text, buttonText, buttonAttribute, compact = false }) {
    return `
      <div class="empty-state ${compact ? "compact" : ""}">
        <span class="empty-icon"><svg><use href="#icon-empty"></use></svg></span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
        ${
          buttonText
            ? `<button class="button button-primary" type="button" ${buttonAttribute}>${escapeHtml(
                buttonText,
              )}</button>`
            : ""
        }
      </div>
    `;
  }

  function handleEmployeeTableAction(event) {
    const sortButton = event.target.closest("[data-employee-sort]");
    if (sortButton) {
      const nextKey = sortButton.dataset.employeeSort;
      if (employeeSortKey === nextKey) {
        employeeSortDirection = employeeSortDirection === "asc" ? "desc" : "asc";
      } else {
        employeeSortKey = nextKey;
        employeeSortDirection = "asc";
      }
      renderEmployees();
      return;
    }
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "view-employee") openEmployeeDossier(id);
    if (action === "edit-employee") openEmployeeDialog(id);
    if (action === "toggle-employee") toggleEmployee(id);
    if (action === "delete-employee") requestDeleteEmployee(id);
  }

  function handleEmployeeTableSelection(event) {
    const selectAll = event.target.closest("[data-select-all-employees]");
    if (selectAll) {
      visibleEmployeesForSelection().forEach((employee) => {
        if (selectAll.checked) selectedEmployeeIds.add(employee.id);
        else selectedEmployeeIds.delete(employee.id);
      });
      renderEmployees();
      return;
    }
    const checkbox = event.target.closest("[data-select-employee]");
    if (!checkbox) return;
    if (checkbox.checked) selectedEmployeeIds.add(checkbox.dataset.selectEmployee);
    else selectedEmployeeIds.delete(checkbox.dataset.selectEmployee);
    updateEmployeeBulkBar();
  }

  function visibleEmployeesForSelection() {
    return [...elements.employeeTable.querySelectorAll("[data-select-employee]")]
      .map((checkbox) => getEmployee(checkbox.dataset.selectEmployee))
      .filter(Boolean);
  }

  function updateEmployeeBulkBar() {
    selectedEmployeeIds = new Set(
      [...selectedEmployeeIds].filter((employeeId) => getEmployee(employeeId)),
    );
    elements.employeeBulkBar.hidden = selectedEmployeeIds.size === 0;
    elements.employeeBulkCount.textContent = `${selectedEmployeeIds.size} ausgewählt`;
  }

  function clearEmployeeSelection() {
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function resetEmployeeFilters() {
    employeeProfessionFilter = "all";
    employeeQualificationFilter = "all";
    employeeWeekendFilter = "all";
    employeeSearchTerm = "";
    elements.employeeSearch.value = "";
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function handleRecentEmployeeAction(event) {
    const button = event.target.closest("[data-edit-recent-employee]");
    if (button) openEmployeeDialog(button.dataset.editRecentEmployee);
  }

  function handleTrainingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "add-completion") openCompletionDialog(id);
    if (action === "edit-training") openTrainingDialog(id);
    if (action === "delete-training") requestDeleteTraining(id);
    if (action === "delete-completion") requestDeleteCompletion(id);
  }

  function handleMeetingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "record-attendance") openAttendanceDialog(id);
    if (action === "edit-meeting") openMeetingDialog(id);
    if (action === "delete-meeting") requestDeleteMeeting(id);
  }

  function handleAppointmentAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "edit-appointment") openAppointmentDialog(id);
    if (action === "delete-appointment") requestDeleteAppointment(id);
  }

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

    const employee = employeeId ? getEmployee(employeeId) : null;
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
      document.querySelector("#employeeStatus").value = employee.employmentStatus;

      document.querySelectorAll('input[name="qualification"]').forEach((checkbox) => {
        checkbox.checked = Boolean(employee.qualifications[checkbox.value]);
      });
    }

    elements.employeeDialog.showModal();
    captureCleanForm(elements.employeeForm);
    window.setTimeout(() => document.querySelector("#firstName").focus(), 0);
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
        });
        if (!committed) return;

        showToast("Mitarbeiter wurde gelöscht.");
      },
    });
  }

  function openTrainingDialog(trainingId = null) {
    elements.trainingForm.reset();
    document.querySelector("#trainingTitle").setCustomValidity("");
    document.querySelector("#trainingId").value = "";
    document.querySelector("#trainingYear").value = String(new Date().getFullYear());
    document.querySelector("#trainingRecurrence").value = String(
      DEFAULT_TRAINING_RECURRENCE_MONTHS,
    );
    trainingRecurrenceManuallyChanged = false;

    const training = trainingId ? getTraining(trainingId) : null;
    elements.trainingDialogTitle.textContent = training
      ? "Pflichtfortbildung bearbeiten"
      : "Pflichtfortbildung anlegen";
    elements.trainingSubmitLabel.textContent = training
      ? "Änderungen speichern"
      : "Fortbildung speichern";

    if (training) {
      document.querySelector("#trainingId").value = training.id;
      document.querySelector("#trainingTitle").value = training.title;
      document.querySelector("#trainingYear").value = String(training.year);
      document.querySelector("#trainingRecurrence").value = training.recurrenceMonths
        ? String(training.recurrenceMonths)
        : "";
      document.querySelector("#trainingDescription").value = training.description;
    }

    elements.trainingDialog.showModal();
    captureCleanForm(elements.trainingForm);
    window.setTimeout(() => document.querySelector("#trainingTitle").focus(), 0);
  }

  async function handleTrainingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#trainingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.trainingForm.reportValidity()) return;

    const trainingId = document.querySelector("#trainingId").value;
    const existingTraining = trainingId ? getTraining(trainingId) : null;
    const now = new Date().toISOString();
    const recurrence = Number(document.querySelector("#trainingRecurrence").value);
    const recurrenceMonths =
      Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null;
    const trainingYear = Number(document.querySelector("#trainingYear").value);
    const matchingSeries = state.trainings.find(
      (item) =>
        item.id !== existingTraining?.id &&
        item.recurrenceMonths &&
        trainingSeriesSignature(item.title) === trainingSeriesSignature(titleInput.value),
    );
    const training = {
      id: existingTraining?.id || createId(),
      title: titleInput.value.trim(),
      year: trainingYear,
      recurrenceMonths,
      seriesId: recurrenceMonths
        ? existingTraining?.seriesId ||
          matchingSeries?.seriesId ||
          generatedTrainingSeriesId(titleInput.value, existingTraining?.id)
        : "",
      description: document.querySelector("#trainingDescription").value.trim(),
      createdAt: existingTraining?.createdAt || now,
      updatedAt: now,
    };

    const previousDisplayYear = trainingDisplayYear;
    trainingDisplayYear = trainingYear;
    const committed = await commitStateMutation(() => {
      if (existingTraining) {
        state.trainings = state.trainings.map((item) =>
          item.id === training.id ? training : item,
        );
      } else {
        state.trainings.push(training);
      }
    });
    if (!committed) {
      trainingDisplayYear = previousDisplayYear;
      return;
    }

    elements.trainingDialog.close();
    showToast(existingTraining ? "Fortbildung wurde aktualisiert." : "Fortbildung wurde angelegt.");
  }

  function requestDeleteTraining(trainingId) {
    const training = getTraining(trainingId);
    if (!training) return;
    const completionCount = state.completions.filter(
      (completion) => completion.trainingId === trainingId,
    ).length;
    const historyNote = completionCount
      ? ` ${completionCount} erfasste${completionCount === 1 ? "r" : ""} Nachweis${
          completionCount === 1 ? "" : "e"
        } werden ebenfalls gelöscht.`
      : "";

    requestConfirmation({
      title: "Pflichtfortbildung löschen?",
      message: `„${training.title}“ (${training.year}) wird dauerhaft entfernt.${historyNote}`,
      acceptLabel: "Fortbildung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.trainings = state.trainings.filter((item) => item.id !== trainingId);
          state.completions = state.completions.filter(
            (completion) => completion.trainingId !== trainingId,
          );
        });
        if (!committed) return;

        showToast("Pflichtfortbildung wurde gelöscht.");
      },
    });
  }

  function openAppointmentDialog(appointmentId = null) {
    renderAppointmentCategoryOptions();
    elements.appointmentForm.reset();
    document.querySelector("#appointmentId").value = "";
    document.querySelector("#appointmentTitle").setCustomValidity("");
    document.querySelector("#appointmentEndTime").setCustomValidity("");
    document.querySelector("#appointmentDate").value = todayIso();

    const appointment = appointmentId ? getAppointment(appointmentId) : null;
    elements.appointmentDialogTitle.textContent = appointment
      ? "Termin bearbeiten"
      : "Termin anlegen";
    elements.appointmentSubmitLabel.textContent = appointment
      ? "Änderungen speichern"
      : "Termin speichern";

    if (appointment) {
      document.querySelector("#appointmentId").value = appointment.id;
      document.querySelector("#appointmentTitle").value = appointment.title;
      document.querySelector("#appointmentDate").value = appointment.date;
      document.querySelector("#appointmentStartTime").value = appointment.startTime;
      document.querySelector("#appointmentEndTime").value = appointment.endTime;
      elements.appointmentCategory.value = appointment.category || "";
      document.querySelector("#appointmentLocation").value = appointment.location;
      document.querySelector("#appointmentDescription").value = appointment.description;
    }

    elements.appointmentDialog.showModal();
    captureCleanForm(elements.appointmentForm);
    window.setTimeout(() => document.querySelector("#appointmentTitle").focus(), 0);
  }

  function validateAppointmentTimes() {
    const startTime = document.querySelector("#appointmentStartTime").value;
    const endTimeInput = document.querySelector("#appointmentEndTime");
    const endTime = endTimeInput.value;
    endTimeInput.setCustomValidity(
      endTime && !startTime
        ? "Bitte zuerst eine Startzeit angeben."
        : startTime && endTime && endTime <= startTime
          ? "Die Endzeit muss nach der Startzeit liegen."
          : "",
    );
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#appointmentTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte einen Titel eingeben.",
    );
    validateAppointmentTimes();
    if (!elements.appointmentForm.reportValidity()) return;

    const appointmentId = document.querySelector("#appointmentId").value;
    const existingAppointment = appointmentId
      ? getAppointment(appointmentId)
      : null;
    const now = new Date().toISOString();
    const appointment = {
      id: existingAppointment?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#appointmentDate").value,
      startTime: document.querySelector("#appointmentStartTime").value,
      endTime: document.querySelector("#appointmentEndTime").value,
      category: elements.appointmentCategory.value,
      location: document.querySelector("#appointmentLocation").value.trim(),
      description: document.querySelector("#appointmentDescription").value.trim(),
      createdAt: existingAppointment?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingAppointment) {
        state.appointments = state.appointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        );
      } else {
        state.appointments.push(appointment);
      }
    });
    if (!committed) return;

    elements.appointmentDialog.close();
    showToast(
      existingAppointment ? "Termin wurde aktualisiert." : "Termin wurde angelegt.",
    );
  }

  function requestDeleteAppointment(appointmentId) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;

    requestConfirmation({
      title: "Termin löschen?",
      message: `„${appointment.title}“ am ${formatDate(
        appointment.date,
      )} wird dauerhaft entfernt.`,
      acceptLabel: "Termin löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.appointments = state.appointments.filter(
            (item) => item.id !== appointmentId,
          );
        });
        if (!committed) return;
        showToast("Termin wurde gelöscht.");
      },
    });
  }

  function openMeetingDialog(meetingId = null) {
    elements.meetingForm.reset();
    document.querySelector("#meetingTitle").setCustomValidity("");
    document.querySelector("#meetingId").value = "";
    document.querySelector("#meetingTitle").value = "Teamsitzung";
    document.querySelector("#meetingDate").value = todayIso();

    const meeting = meetingId ? getMeeting(meetingId) : null;
    elements.meetingDialogTitle.textContent = meeting
      ? "Teamsitzung bearbeiten"
      : "Teamsitzung anlegen";
    elements.meetingSubmitLabel.textContent = meeting
      ? "Änderungen speichern"
      : "Teamsitzung speichern";

    if (meeting) {
      document.querySelector("#meetingId").value = meeting.id;
      document.querySelector("#meetingTitle").value = meeting.title;
      document.querySelector("#meetingDate").value = meeting.date;
      document.querySelector("#meetingTime").value = meeting.time;
      document.querySelector("#meetingNotes").value = meeting.notes;
    }

    elements.meetingDialog.showModal();
    captureCleanForm(elements.meetingForm);
    window.setTimeout(() => document.querySelector("#meetingTitle").focus(), 0);
  }

  async function handleMeetingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#meetingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.meetingForm.reportValidity()) return;

    const meetingId = document.querySelector("#meetingId").value;
    const existingMeeting = meetingId ? getMeeting(meetingId) : null;
    const now = new Date().toISOString();
    const meeting = {
      id: existingMeeting?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#meetingDate").value,
      time: document.querySelector("#meetingTime").value,
      notes: document.querySelector("#meetingNotes").value.trim(),
      expectedEmployeeIds:
        existingMeeting?.expectedEmployeeIds || activeEmployeeList().map((employee) => employee.id),
      createdAt: existingMeeting?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingMeeting) {
        state.meetings = state.meetings.map((item) => (item.id === meeting.id ? meeting : item));
      } else {
        state.meetings.push(meeting);
      }
    });
    if (!committed) return;

    elements.meetingDialog.close();
    showToast(existingMeeting ? "Teamsitzung wurde aktualisiert." : "Teamsitzung wurde angelegt.");

    if (!existingMeeting && meeting.expectedEmployeeIds.length > 0) {
      openAttendanceDialog(meeting.id);
    }
  }

  function requestDeleteMeeting(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;
    const attendanceCount = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    ).length;

    requestConfirmation({
      title: "Teamsitzung löschen?",
      message: `„${meeting.title}“ vom ${formatDate(meeting.date)} wird dauerhaft entfernt.${
        attendanceCount
          ? ` ${attendanceCount} dokumentierte Teilnahmestatus werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Teamsitzung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.meetings = state.meetings.filter((item) => item.id !== meetingId);
          state.meetingAttendances = state.meetingAttendances.filter(
            (attendance) => attendance.meetingId !== meetingId,
          );
        });
        if (!committed) return;

        showToast("Teamsitzung wurde gelöscht.");
      },
    });
  }

  function openAttendanceDialog(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    const existingRecords = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    );
    const employeeIds = new Set(meeting.expectedEmployeeIds);
    existingRecords.forEach((record) => employeeIds.add(record.employeeId));
    if (existingRecords.length === 0) {
      activeEmployeeList().forEach((employee) => employeeIds.add(employee.id));
    }

    attendanceEmployeeIds = [...employeeIds].filter((employeeId) => getEmployee(employeeId));
    if (attendanceEmployeeIds.length === 0) {
      showToast("Für diese Sitzung sind keine Mitarbeiter verfügbar.", "error");
      return;
    }

    attendanceDraft = new Map(
      existingRecords.map((record) => [record.employeeId, record.status]),
    );
    attendanceSearchTerm = "";
    attendanceStatusFilter = "all";
    elements.attendanceSearch.value = "";
    elements.attendanceFilter.value = "all";
    elements.attendanceBulkStatus.value = "teilgenommen";
    document.querySelector("#attendanceMeetingId").value = meeting.id;
    elements.attendanceMeetingMeta.textContent = `${formatDate(meeting.date)}${
      meeting.time ? ` · ${formatTime(meeting.time)} Uhr` : ""
    } · ${meeting.title}`;

    renderAttendanceList();
    elements.attendanceDialog.showModal();
    captureCleanForm(elements.attendanceForm);
    window.setTimeout(() => elements.attendanceSearch.focus(), 0);
  }

  function filteredAttendanceEmployees() {
    return attendanceEmployeeIds
      .map(getEmployee)
      .filter(Boolean)
      .filter((employee) => {
        const status = attendanceDraft.get(employee.id) || "";
        if (attendanceStatusFilter === "open" && status) return false;
        if (attendanceStatusFilter === "documented" && !status) return false;
        if (
          attendanceStatusFilter === "absent" &&
          (!status || status === "teilgenommen")
        ) {
          return false;
        }
        if (!attendanceSearchTerm) return true;
        return [employee.firstName, employee.lastName, employee.profession]
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(attendanceSearchTerm);
      })
      .sort(sortEmployees);
  }

  function renderAttendanceList() {
    const employees = filteredAttendanceEmployees();
    if (employees.length === 0) {
      elements.attendanceList.innerHTML = renderEmptyState({
        title: "Keine passenden Mitarbeiter",
        text: "Ändern Sie die Suche oder den Anzeigefilter.",
        compact: true,
      });
      updateAttendanceProgress();
      return;
    }

    elements.attendanceList.innerHTML = employees
      .map((employee) => {
        const selectedStatus = attendanceDraft.get(employee.id) || "";
        const statusConfig = ATTENDANCE_STATUSES[selectedStatus];
        return `
          <div class="attendance-row ${
            statusConfig ? `has-status attendance-row-${statusConfig.tone}` : ""
          }">
            <div class="attendance-person">
              ${renderAvatar(employee)}
              <span>
                <strong>${escapeHtml(fullName(employee))}</strong>
                <small>${escapeHtml(employee.profession)} · ${escapeHtml(
                  employeeStatusLabel(employee),
                )}${employee.active ? "" : " seit Erfassung"}</small>
              </span>
            </div>
            <label class="attendance-status-field">
              <span class="sr-only">Teilnahmestatus für ${escapeHtml(fullName(employee))}</span>
              <select
                data-attendance-employee-id="${employee.id}"
                aria-label="Teilnahmestatus für ${escapeHtml(fullName(employee))}"
              >
                <option value="">Noch offen</option>
                ${renderAttendanceStatusOptions(selectedStatus)}
              </select>
            </label>
          </div>
        `;
      })
      .join("");

    updateAttendanceProgress();
  }

  function renderAttendanceStatusOptions(selectedStatus = "") {
    return Object.entries(ATTENDANCE_STATUSES)
      .map(
        ([value, config]) =>
          `<option value="${value}" ${value === selectedStatus ? "selected" : ""}>${escapeHtml(
            config.label,
          )}</option>`,
      )
      .join("");
  }

  function updateAttendanceProgress() {
    const documented = attendanceEmployeeIds.filter((employeeId) =>
      attendanceDraft.has(employeeId),
    ).length;
    const total = attendanceEmployeeIds.length;
    elements.attendanceProgress.textContent = `${documented} von ${total} dokumentiert${
      total - documented > 0 ? ` · ${total - documented} offen` : " · vollständig"
    }`;
  }

  function updateAttendanceRowState(row, status) {
    if (!row) return;
    row.className = "attendance-row";
    const statusConfig = ATTENDANCE_STATUSES[status];
    if (statusConfig) {
      row.classList.add("has-status", `attendance-row-${statusConfig.tone}`);
    }
  }

  async function handleAttendanceSubmit(event) {
    event.preventDefault();
    const meetingId = document.querySelector("#attendanceMeetingId").value;
    const meeting = getMeeting(meetingId);
    if (!meeting) {
      elements.attendanceDialog.close();
      showToast("Die Teamsitzung ist nicht mehr vorhanden.", "error");
      return;
    }

    const existingByEmployee = new Map(
      state.meetingAttendances
        .filter((attendance) => attendance.meetingId === meetingId)
        .map((attendance) => [attendance.employeeId, attendance]),
    );
    const now = new Date().toISOString();
    const nextRecords = attendanceEmployeeIds
      .filter((employeeId) => attendanceDraft.has(employeeId))
      .map((employeeId) => {
        const existing = existingByEmployee.get(employeeId);
        return {
          id: existing?.id || createId(),
          meetingId,
          employeeId,
          status: attendanceDraft.get(employeeId),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
      });

    const committed = await commitStateMutation(() => {
      state.meetingAttendances = state.meetingAttendances
        .filter((attendance) => attendance.meetingId !== meetingId)
        .concat(nextRecords);
      meeting.expectedEmployeeIds = [...attendanceEmployeeIds];
      meeting.updatedAt = now;
    });
    if (!committed) return;

    elements.attendanceDialog.close();
    const openCount = attendanceEmployeeIds.length - nextRecords.length;
    showToast(
      `${nextRecords.length} Teilnahmestatus gespeichert.${
        openCount ? ` ${openCount} sind noch offen.` : " Die Erfassung ist vollständig."
      }`,
    );
  }

  function openCompletionDialog(trainingId = null) {
    if (state.trainings.length === 0) {
      showView("trainings");
      showToast("Legen Sie zuerst eine Pflichtfortbildung an.", "error");
      return;
    }

    if (activeEmployeeList().length === 0) {
      showView("employees");
      showToast("Für einen Abschluss wird mindestens ein aktiver Mitarbeiter benötigt.", "error");
      return;
    }

    elements.completionForm.reset();
    selectedCompletionEmployeeIds = new Set();
    completionSearchTerm = "";
    elements.completionEmployeeSearch.value = "";
    elements.completionEmployeeError.textContent = "";
    elements.completionDate.setCustomValidity("");
    elements.completionDate.value = todayIso();

    elements.completionTraining.innerHTML = groupTrainingsByYear(trainingObligations())
      .map(
        ([year, trainings]) => `
          <optgroup label="Im Katalog seit ${year}">
            ${trainings
              .map(
                (training) =>
                  `<option value="${training.id}" ${
                    training.id === trainingId ? "selected" : ""
                  }>${escapeHtml(training.title)}</option>`,
              )
              .join("")}
          </optgroup>
        `,
      )
      .join("");

    renderCompletionEmployeeList();
    elements.completionDialog.showModal();
    captureCleanForm(elements.completionForm);
    window.setTimeout(() => elements.completionTraining.focus(), 0);
  }

  function renderCompletionEmployeeList() {
    const employees = filteredCompletionEmployees();
    const training = getTraining(elements.completionTraining.value);

    if (employees.length === 0) {
      elements.completionEmployeeList.innerHTML = `
        <div class="empty-state compact">
          <p>Keine aktiven Mitarbeiter passen zur Suche.</p>
        </div>
      `;
      updateCompletionSelectionUi();
      return;
    }

    elements.completionEmployeeList.innerHTML = employees
      .map((employee) => {
        const status = training
          ? getEmployeeCompletionStatus(employee.id, training)
          : { label: "Kein Status" };
        return `
          <label class="selection-card">
            <input
              type="checkbox"
              data-employee-id="${employee.id}"
              ${selectedCompletionEmployeeIds.has(employee.id) ? "checked" : ""}
            />
            ${renderAvatar(employee, true)}
            <span>
              <strong>${escapeHtml(fullName(employee))}</strong>
              <small>${escapeHtml(employee.profession)} · ${escapeHtml(status.label)}</small>
            </span>
          </label>
        `;
      })
      .join("");

    updateCompletionSelectionUi();
  }

  function filteredCompletionEmployees() {
    return activeEmployeeList()
      .filter((employee) => {
        if (!completionSearchTerm) return true;
        return [employee.firstName, employee.lastName, employee.profession]
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(completionSearchTerm);
      })
      .sort(sortEmployees);
  }

  function updateCompletionSelectionUi() {
    const count = selectedCompletionEmployeeIds.size;
    elements.completionSelectionCount.textContent = `${count} ausgewählt`;

    const visibleEmployees = filteredCompletionEmployees();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) => selectedCompletionEmployeeIds.has(employee.id));
    elements.toggleAllEmployees.textContent = allSelected ? "Auswahl aufheben" : "Alle auswählen";
  }

  async function handleCompletionSubmit(event) {
    event.preventDefault();

    elements.completionDate.setCustomValidity(
      elements.completionDate.value && elements.completionDate.value > todayIso()
        ? "Das Abschlussdatum darf nicht in der Zukunft liegen."
        : "",
    );
    if (!elements.completionForm.reportValidity()) return;

    if (selectedCompletionEmployeeIds.size === 0) {
      elements.completionEmployeeError.textContent = "Bitte mindestens einen Mitarbeiter auswählen.";
      elements.completionEmployeeList.scrollIntoView({ block: "nearest" });
      return;
    }

    const trainingId = elements.completionTraining.value;
    const completedOn = elements.completionDate.value;
    const note = document.querySelector("#completionNote").value.trim();
    const now = new Date().toISOString();
    let addedCount = 0;
    let duplicateCount = 0;
    let inactiveCount = 0;
    const newCompletions = [];

    selectedCompletionEmployeeIds.forEach((employeeId) => {
      const employeeIsActive = state.employees.some(
        (employee) => employee.id === employeeId && employee.active,
      );
      if (!employeeIsActive) {
        inactiveCount += 1;
        return;
      }

      const duplicate = state.completions.some(
        (completion) =>
          completion.employeeId === employeeId &&
          completion.trainingId === trainingId &&
          completion.completedOn === completedOn,
      );
      if (duplicate) {
        duplicateCount += 1;
        return;
      }

      newCompletions.push({
        id: createId(),
        employeeId,
        trainingId,
        completedOn,
        note,
        createdAt: now,
      });
      addedCount += 1;
    });

    if (addedCount > 0) {
      const committed = await commitStateMutation(() => {
        state.completions.push(...newCompletions);
      });
      if (!committed) return;

      elements.completionDialog.close();
      const duplicateNote = duplicateCount
        ? ` ${duplicateCount} bereits vorhandene${duplicateCount === 1 ? "r" : ""} Nachweis${
            duplicateCount === 1 ? "" : "e"
          } wurde${duplicateCount === 1 ? "" : "n"} übersprungen.`
        : "";
      showToast(
        `${addedCount} Nachweis${addedCount === 1 ? "" : "e"} gespeichert.${duplicateNote}`,
      );
    } else {
      showToast(
        inactiveCount
          ? "Die ausgewählten Mitarbeiter sind nicht mehr aktiv."
          : "Diese Nachweise sind für das gewählte Datum bereits vorhanden.",
        "error",
      );
    }
  }

  function requestDeleteCompletion(completionId) {
    const completion = state.completions.find((item) => item.id === completionId);
    if (!completion) return;
    const employee = getEmployee(completion.employeeId);
    const training = getTraining(completion.trainingId);

    requestConfirmation({
      title: "Nachweis löschen?",
      message: `Der Abschluss „${training?.title || "Fortbildung"}“ von ${
        employee ? fullName(employee) : "diesem Mitarbeiter"
      } am ${formatDate(completion.completedOn)} wird entfernt.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.completions = state.completions.filter((item) => item.id !== completionId);
        });
        if (!committed) return;

        showToast("Fortbildungsnachweis wurde gelöscht.");
      },
    });
  }
