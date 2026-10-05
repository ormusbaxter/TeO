  function renderMeetings() {
    const availableYears = getMeetingDisplayYears();
    if (!availableYears.includes(meetingDisplayYear)) {
      meetingDisplayYear = new Date().getFullYear();
    }
    elements.meetingDisplayYear.innerHTML = availableYears
      .map(
        (year) =>
          `<option value="${year}" ${year === meetingDisplayYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");

    const displayedMeetings = meetingsForDisplayYear();
    const meetingStats = displayedMeetings.map((meeting) => getMeetingStats(meeting));
    const completedMeetings = meetingStats.filter(
      (stats) => stats.total > 0 && stats.documented === stats.total,
    ).length;
    const openEntries = meetingStats.reduce((sum, stats) => sum + stats.open, 0);

    elements.meetingSummary.innerHTML = `
      ${renderSummaryChip("meeting", displayedMeetings.length, `Teamsitzungen ${meetingDisplayYear}`)}
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

    if (displayedMeetings.length === 0) {
      elements.meetingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: `Keine Teamsitzungen ${meetingDisplayYear}`,
            text: "Wählen Sie ein anderes Jahr oder legen Sie eine Teamsitzung an.",
            buttonText: "Teamsitzung anlegen",
            buttonAttribute: "data-empty-add-meeting",
          })}
        </section>
      `;
      elements.meetingList
        .querySelector("[data-empty-add-meeting]")
        ?.addEventListener("click", () => openMeetingDialog());
      return;
    }

    // Neueste Sitzung zuerst: Die gerade anstehende oder zuletzt gehaltene
    // ist die, an der man arbeitet.
    elements.meetingList.innerHTML = displayedMeetings
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.time.localeCompare(a.time) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      )
      .map(renderMeetingCard)
      .join("");
  }

  function getMeetingDisplayYears() {
    return [
      ...new Set([
        new Date().getFullYear(),
        ...state.meetings.map((meeting) => Number(meeting.date.slice(0, 4))),
      ]),
    ]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((yearA, yearB) => yearB - yearA);
  }

  function meetingsForDisplayYear(year = meetingDisplayYear) {
    return state.meetings.filter(
      (meeting) => Number(meeting.date.slice(0, 4)) === Number(year),
    );
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
              <div class="progress-bar"${dynamicStyle({ "--progress": `${stats.percent}%` })}></div>
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
      ...Object.entries(ATTENDANCE_STATUSES)
        .filter(([status]) => status !== "nicht_zutreffend")
        .map(([status, config]) => ({
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
            ${dynamicStyle({ "--chart-segments": chartBackground })}
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
                      ${dynamicStyle({ "--legend-color": segment.color })}
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
                <th scope="col">Nicht zutreffend</th>
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
                      <td>${employee.statusCounts.nicht_zutreffend}</td>
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
        "Nicht zutreffend",
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
        employee.statusCounts.nicht_zutreffend,
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
