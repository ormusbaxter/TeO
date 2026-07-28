  function renderVacationPlanner() {
    renderVacationControls();
    const employees = activeEmployeeList().sort(sortEmployees);
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, index) =>
      [
        vacationYear,
        String(vacationMonth).padStart(2, "0"),
        String(index + 1).padStart(2, "0"),
      ].join("-"),
    );
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    const selectedMonthLabel = new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
    }).format(new Date(vacationYear, vacationMonth - 1, 1, 12));
    const schoolVacationCoverageNote = schoolVacations.size
      ? "Hinterlegte Schulferien sind berücksichtigt; bewegliche Ferientage sind nicht enthalten."
      : "Für dieses Jahr sind keine Schulferien hinterlegt. Sie lassen sich unter Einstellungen → Schulferien ergänzen.";
    const monthEntries = state.vacationDays.filter(
      (vacationDay) =>
        getEmployee(vacationDay.employeeId)?.active &&
        vacationDay.date.startsWith(
          `${vacationYear}-${String(vacationMonth).padStart(2, "0")}-`,
        ),
    );
    const monthAbsenceCount = monthEntries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const monthDutyCount = monthEntries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const capacityDays = dates.filter((date) => {
      const stats = getPlannerDayStats(date, holidays);
      return stats.absenceCount >= stats.limit;
    }).length;
    const totalEntitlement = employees.reduce(
      (sum, employee) => sum + getVacationEntitlement(employee, vacationYear).total,
      0,
    );
    const totalPlanned = employees.reduce(
      (sum, employee) => sum + getPlannedVacationDays(employee.id, vacationYear),
      0,
    );

    elements.vacationSummary.innerHTML = `
      ${renderSummaryChip("calendar", formatVacationNumber(totalEntitlement), "Urlaubsanspruch gesamt")}
      ${renderSummaryChip("check", totalPlanned, "Urlaubstage im Jahr geplant", "teal")}
      ${renderSummaryChip("calendar", monthAbsenceCount, "Abwesenheiten im Monat", "orange")}
      ${renderSummaryChip("users", monthDutyCount, "Dienstzusagen im Monat", "blue")}
      ${renderSummaryChip(
        "alert",
        capacityDays,
        "Tage an oder über Grenze",
        capacityDays ? "orange" : "blue",
      )}
    `;

    if (employees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Aktive Mitarbeiter und Mitarbeiter in Einarbeitung erscheinen hier automatisch.",
        compact: true,
      });
      return;
    }

    elements.vacationPlanner.innerHTML = `
      <div class="vacation-table-note">
        <span>
          „Urlaub“ und „Urlaub Einarbeitung“ werden vom Jahresanspruch abgezogen.
          Urlaub Einarbeitung und Dienstzusagen zählen nicht gegen die Tagesgrenze
          (${state.settings.vacationWeekdayAbsenceLimit} werktags,
          ${state.settings.vacationWeekendAbsenceLimit} an Wochenenden und Feiertagen).
          Eine Überschreitung bleibt möglich und färbt den Tag rot. Auf einem
          Dienstwochenende gleicht die Zusage eines Mitarbeiters vom jeweils anderen
          festen Wochenende einen Urlaub auf dem eigenen Wochenende aus.
        </span>
        <span class="${
          schoolVacations.size ? "" : "is-warning"
        }">${schoolVacationCoverageNote}</span>
      </div>
      <div class="vacation-table-scroll">
        <table class="vacation-table">
          <thead>
            <tr>
              <th class="vacation-employee-column" scope="col">${escapeHtml(
                selectedMonthLabel,
              )}</th>
              ${dates
                .map((date) =>
                  renderVacationDayHeader(date, holidays, schoolVacations),
                )
                .join("")}
              <th class="vacation-total-column" scope="col">Basis</th>
              <th class="vacation-total-column" scope="col">Zusatz</th>
              <th class="vacation-total-column" scope="col">Anspruch</th>
              <th class="vacation-total-column" scope="col">Geplant</th>
              <th class="vacation-total-column" scope="col">Rest</th>
            </tr>
          </thead>
          <tbody>
            ${employees
              .map((employee) =>
                renderVacationEmployeeRow(
                  employee,
                  dates,
                  holidays,
                  schoolVacations,
                ),
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    applyAccessControl();
  }

  function renderVacationControls() {
    const availableYears = new Set([
      new Date().getFullYear() - 1,
      new Date().getFullYear(),
      new Date().getFullYear() + 1,
      new Date().getFullYear() + 2,
      vacationYear,
      ...state.vacationEntitlements.map((entry) => entry.year),
      ...state.vacationDays.map((entry) => Number(entry.date.slice(0, 4))),
      // Jahre, fuer die Schulferien hinterlegt sind, muessen aufrufbar sein -
      // sonst liessen sich weit vorausgeplante Ferien nie ansehen.
      ...schoolVacationPeriods().flatMap((period) => [
        Number(period.start.slice(0, 4)),
        Number(period.end.slice(0, 4)),
      ]),
    ]);
    elements.vacationYear.innerHTML = [...availableYears]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((a, b) => a - b)
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");
    elements.vacationYear.value = String(vacationYear);
    elements.vacationMonth.value = String(vacationMonth);
    elements.vacationEntryType.value = vacationEntryType;
    elements.vacationBaseDays.value = String(state.settings.vacationBaseDays);
    elements.vacationWeekdayAbsenceLimit.value = String(
      state.settings.vacationWeekdayAbsenceLimit,
    );
    elements.vacationWeekendAbsenceLimit.value = String(
      state.settings.vacationWeekendAbsenceLimit,
    );
    elements.vacationWeekendAReferenceSaturday.value =
      state.settings.vacationWeekendAReferenceSaturday;
    elements.vacationWeekendAReferenceLabel.textContent =
      `Referenzsamstag ${serviceWeekendLabel("weekend_a")}`;
    elements.vacationWeekendALegend.textContent =
      serviceWeekendLabel("weekend_a");
    elements.vacationWeekendBLegend.textContent =
      serviceWeekendLabel("weekend_b");
  }

  function renderVacationDayHeader(date, holidays, schoolVacations) {
    const day = parseLocalDate(date);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const stats = getPlannerDayStats(date, holidays);
    const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" })
      .format(day)
      .replace(".", "");
    const capacityClass = stats.isOverLimit
      ? "is-over-limit"
      : stats.isAtLimit
        ? "is-at-limit"
        : "";
    const title = [
      metadata.title,
      stats.compensatedAbsenceCount
        ? `${stats.effectiveAbsenceCount} wirksame Abwesenheiten von maximal ${stats.limit} (${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} durch fremde Dienstzusage ausgeglichen)`
        : `${stats.effectiveAbsenceCount} von maximal ${stats.limit} abwesend`,
      stats.dutyCount
        ? `${stats.dutyCount} verpflichtende Dienstzusage${
            stats.dutyCount === 1 ? "" : "n"
          }`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `
      <th
        class="vacation-day-column ${metadata.className} ${capacityClass}"
        scope="col"
        title="${escapeHtml(title)}"
      >
        <strong>${day.getDate()}</strong>
        <small>${escapeHtml(weekday)}</small>
        <span class="vacation-capacity" aria-label="${stats.effectiveAbsenceCount} wirksame Abwesenheiten von ${stats.limit}">
          ${stats.effectiveAbsenceCount}/${stats.limit}
        </span>
        ${
          stats.compensatedAbsenceCount
            ? `<span class="vacation-offset-count" aria-label="${stats.compensatedAbsenceCount} Abwesenheiten ausgeglichen">−${stats.compensatedAbsenceCount}</span>`
            : ""
        }
        ${
          stats.dutyCount
            ? `<span class="vacation-duty-count" aria-label="${stats.dutyCount} Dienstzusagen">D${stats.dutyCount}</span>`
            : ""
        }
        ${metadata.holiday ? '<span class="vacation-holiday-dot" aria-hidden="true"></span>' : ""}
        ${
          metadata.schoolVacation
            ? '<span class="vacation-school-vacation-dot" aria-hidden="true"></span>'
            : ""
        }
      </th>
    `;
  }

  function renderVacationEmployeeRow(employee, dates, holidays, schoolVacations) {
    const entitlement = getVacationEntitlement(employee, vacationYear);
    const planned = getPlannedVacationDays(employee.id, vacationYear);
    const remaining = entitlement.total - planned;
    const plannedEntries = new Map(
      state.vacationDays
        .filter((vacationDay) => vacationDay.employeeId === employee.id)
        .map((vacationDay) => [vacationDay.date, vacationDay]),
    );
    return `
      <tr class="${employee.active ? "" : "is-inactive"}">
        <th
          class="vacation-employee-column vacation-employee-weekend-${employee.serviceWeekend}"
          scope="row"
          title="${escapeHtml(serviceWeekendLabel(employee.serviceWeekend))}"
        >
          <span class="vacation-employee">
            ${renderAvatar(employee, true)}
            <span>
              <button
                class="vacation-employee-link"
                type="button"
                data-vacation-employee-overview="${employee.id}"
                aria-label="Jahresabwesenheiten von ${escapeHtml(fullName(employee))} öffnen"
              >${escapeHtml(fullName(employee))}</button>
              <small>${escapeHtml(employeeStatusLabel(employee))} · ${employee.employmentPercent} %</small>
            </span>
          </span>
        </th>
        ${dates
          .map((date) => {
            const metadata = getVacationDayMetadata(
              date,
              holidays,
              schoolVacations,
            );
            const dayStats = getPlannerDayStats(date, holidays);
            const entry = plannedEntries.get(date);
            const entryType = entry
              ? PLANNER_ENTRY_TYPES[entry.type]
              : null;
            const ownWeekend =
              metadata.weekendGroup &&
              employee.serviceWeekend === metadata.weekendGroup;
            return `
              <td class="vacation-day-cell ${metadata.className} ${
                dayStats.isOverLimit ? "is-over-limit" : ""
              } ${
                ownWeekend ? "is-own-weekend" : ""
              }">
                <button
                  type="button"
                  data-vacation-employee="${employee.id}"
                  data-vacation-date="${date}"
                  aria-pressed="${Boolean(entry)}"
                  aria-label="${escapeHtml(fullName(employee))}: ${
                    entryType
                      ? `${entryType.label} am ${formatDate(date)}`
                      : `Eintrag am ${formatDate(date)} anlegen`
                  }"
                  title="${escapeHtml(
                    [entryType?.label, metadata.title].filter(Boolean).join(" · "),
                  )}"
                  class="${entry ? `planner-entry-${entry.type}` : ""}"
                >${entryType?.shortLabel || ""}</button>
              </td>
            `;
          })
          .join("")}
        <td class="vacation-total-column">${formatVacationNumber(entitlement.base)}</td>
        <td class="vacation-total-column">
          <input
            class="vacation-additional-input"
            type="number"
            min="0"
            max="30"
            step="0.5"
            value="${entitlement.additional}"
            data-vacation-additional-employee="${employee.id}"
            aria-label="Zusatzurlaub ${escapeHtml(fullName(employee))}"
          />
        </td>
        <td class="vacation-total-column"><strong>${formatVacationNumber(entitlement.total)}</strong></td>
        <td class="vacation-total-column">${planned}</td>
        <td class="vacation-total-column ${
          remaining < 0 ? "vacation-negative" : ""
        }"><strong>${formatVacationNumber(remaining)}</strong></td>
      </tr>
    `;
  }

  function openVacationEmployeeOverview(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;

    const entries = state.vacationDays
      .filter(
        (entry) =>
          entry.employeeId === employeeId &&
          Number(entry.date.slice(0, 4)) === vacationYear,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    const plannedVacationCount = entries.filter(
      (entry) =>
        PLANNER_ENTRY_TYPES[entry.type]?.countsVacationEntitlement,
    ).length;
    const countedAbsenceCount = entries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;

    elements.vacationEmployeeOverviewTitle.textContent =
      `${fullName(employee)} · ${vacationYear}`;
    elements.vacationEmployeeOverviewSubtitle.textContent =
      `${employeeStatusLabel(employee)} · ${employee.employmentPercent} % · ${serviceWeekendLabel(employee.serviceWeekend)}`;

    elements.vacationEmployeeOverviewContent.innerHTML = `
      <div class="dossier-summary-grid vacation-overview-summary">
        ${renderDossierItem("Planungseinträge", entries.length)}
        ${renderDossierItem("Urlaubstage", plannedVacationCount)}
        ${renderDossierItem("Zählende Abwesenheiten", countedAbsenceCount)}
        ${renderDossierItem("Dienstzusagen", dutyCount)}
      </div>
      <div class="vacation-year-legend" aria-label="Legende der Jahresübersicht">
        ${Object.entries(PLANNER_ENTRY_TYPES)
          .map(
            ([type, definition]) => `
              <span>
                <i class="vacation-year-entry planner-entry-${type}">${definition.shortLabel}</i>
                ${escapeHtml(definition.label)}
              </span>
            `,
          )
          .join("")}
        <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
        <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
      </div>
      ${renderVacationYearMatrix(entries, employee)}
    `;
    elements.vacationEmployeeOverviewDialog.showModal();
  }

  function renderVacationYearMatrix(entries, employee) {
    const entriesByDate = new Map(
      entries.map((entry) => [entry.date, entry]),
    );
    const days = Array.from({ length: 31 }, (_, index) => index + 1);
    return `
      <div class="vacation-year-matrix-scroll">
        <table class="vacation-year-matrix">
          <thead>
            <tr>
              <th class="vacation-year-month-column" scope="col">Monat</th>
              ${days.map((day) => `<th scope="col">${day}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 12 }, (_, index) =>
              renderVacationYearMonthRow(
                index + 1,
                days,
                entriesByDate,
                employee,
              ),
            ).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderVacationYearMonthRow(month, days, entriesByDate, employee) {
    const monthLabel = new Intl.DateTimeFormat("de-DE", {
      month: "long",
    }).format(new Date(vacationYear, month - 1, 1, 12));
    const daysInMonth = new Date(vacationYear, month, 0).getDate();
    return `
      <tr>
        <th class="vacation-year-month-column" scope="row">${escapeHtml(monthLabel)}</th>
        ${days
          .map((day) =>
            renderVacationYearDayCell(
              month,
              day,
              daysInMonth,
              entriesByDate,
              employee,
            ),
          )
          .join("")}
      </tr>
    `;
  }

  function renderVacationYearDayCell(
    month,
    day,
    daysInMonth,
    entriesByDate,
    employee,
  ) {
    if (day > daysInMonth) {
      return '<td class="is-unavailable" aria-label="Dieser Kalendertag existiert nicht"></td>';
    }
    const date = [
      vacationYear,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
    const entry = entriesByDate.get(date);
    const entryType = entry ? PLANNER_ENTRY_TYPES[entry.type] : null;
    const metadata = getVacationDayMetadata(date);
    const parsedDate = parseLocalDate(date);
    const weekday = new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
    }).format(parsedDate);
    const details = [
      formatDate(date),
      weekday,
      entryType?.label,
      metadata.holiday,
      metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
      metadata.weekendGroup
        ? employee.serviceWeekend === metadata.weekendGroup
          ? `Eigenes Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
          : `Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
        : "",
    ].filter(Boolean);
    return `
      <td
        class="${metadata.className} ${entry ? "has-entry" : ""}"
        title="${escapeHtml(details.join(" · "))}"
        aria-label="${escapeHtml(details.join(", "))}"
      >
        ${
          entry
            ? `<span class="vacation-year-entry planner-entry-${entry.type}">${entryType.shortLabel}</span>`
            : ""
        }
      </td>
    `;
  }

  function getVacationEntitlement(employee, year) {
    const base =
      Math.round(
        state.settings.vacationBaseDays * (employee.employmentPercent / 100) * 2,
      ) / 2;
    const stored = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employee.id && entry.year === year,
    );
    const additional = stored?.additionalDays || 0;
    return { base, additional, total: base + additional };
  }

  function getPlannedVacationDays(employeeId, year) {
    return state.vacationDays.filter(
      (vacationDay) =>
        vacationDay.employeeId === employeeId &&
        Number(vacationDay.date.slice(0, 4)) === year &&
        PLANNER_ENTRY_TYPES[vacationDay.type]?.countsVacationEntitlement,
    ).length;
  }

  function getPlannerDayStats(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
  ) {
    const entries = state.vacationDays.filter(
      (entry) =>
        entry.date === date && getEmployee(entry.employeeId)?.active,
    );
    const absenceCount = entries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const parsed = parseLocalDate(date);
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const ownWeekendVacationCount = weekendGroup
      ? entries.filter((entry) => {
          if (entry.type !== "vacation") return false;
          return getEmployee(entry.employeeId)?.serviceWeekend === weekendGroup;
        }).length
      : 0;
    const foreignWeekendDutyCount = weekendGroup
      ? entries.filter((entry) => {
          if (entry.type !== "mandatoryDuty") return false;
          const serviceWeekend = getEmployee(entry.employeeId)?.serviceWeekend;
          return (
            SERVICE_WEEKEND_KEYS.includes(serviceWeekend) &&
            serviceWeekend !== weekendGroup
          );
        }).length
      : 0;
    const compensatedAbsenceCount = Math.min(
      ownWeekendVacationCount,
      foreignWeekendDutyCount,
    );
    const effectiveAbsenceCount = Math.max(
      0,
      absenceCount - compensatedAbsenceCount,
    );
    const usesWeekendLimit =
      Boolean(holidays.get(date)) ||
      Boolean(parsed && [0, 6].includes(parsed.getDay()));
    const limit = usesWeekendLimit
      ? state.settings.vacationWeekendAbsenceLimit
      : state.settings.vacationWeekdayAbsenceLimit;
    return {
      absenceCount,
      effectiveAbsenceCount,
      dutyCount,
      ownWeekendVacationCount,
      foreignWeekendDutyCount,
      compensatedAbsenceCount,
      weekendGroup,
      limit,
      usesWeekendLimit,
      isAtLimit: effectiveAbsenceCount === limit,
      isOverLimit: effectiveAbsenceCount > limit,
    };
  }

  function formatVacationNumber(value) {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  async function handleVacationPlannerClick(event) {
    const employeeOverviewButton = event.target.closest(
      "[data-vacation-employee-overview]",
    );
    if (employeeOverviewButton) {
      openVacationEmployeeOverview(
        employeeOverviewButton.dataset.vacationEmployeeOverview,
      );
      return;
    }

    const button = event.target.closest(
      "[data-vacation-employee][data-vacation-date]",
    );
    if (!button) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = button.dataset.vacationEmployee;
    const date = button.dataset.vacationDate;
    const existing = state.vacationDays.find(
      (vacationDay) =>
        vacationDay.employeeId === employeeId && vacationDay.date === date,
    );
    const selectedType = Object.hasOwn(
      PLANNER_ENTRY_TYPES,
      vacationEntryType,
    )
      ? vacationEntryType
      : "vacation";
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      if (existing?.type === selectedType) {
        state.vacationDays = state.vacationDays.filter(
          (vacationDay) => vacationDay.id !== existing.id,
        );
      } else if (existing) {
        existing.type = selectedType;
        existing.updatedAt = now;
      } else {
        state.vacationDays.push({
          id: createId(),
          employeeId,
          date,
          type: selectedType,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
    restoreVacationScrollPosition(scrollPosition);
    if (!committed) return;
    const updatedStats = getPlannerDayStats(date);
    if (updatedStats.isOverLimit) {
      const compensationNote = updatedStats.compensatedAbsenceCount
        ? ` (${updatedStats.absenceCount} eingetragen, ${updatedStats.compensatedAbsenceCount} ausgeglichen)`
        : "";
      showToast(
        `Warnung: Am ${formatDate(date)} bestehen ${updatedStats.effectiveAbsenceCount} wirksame Abwesenheiten${compensationNote}, vorgesehen sind maximal ${updatedStats.limit}.`,
        "error",
      );
    }
  }

  async function handleVacationPlannerChange(event) {
    const input = event.target.closest("[data-vacation-additional-employee]");
    if (!input) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = input.dataset.vacationAdditionalEmployee;
    const additionalDays =
      Math.round(clampNumber(input.value, 0, 30, 0) * 2) / 2;
    const existing = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employeeId && entry.year === vacationYear,
    );
    await commitStateMutation(() => {
      if (existing) {
        existing.additionalDays = additionalDays;
      } else {
        state.vacationEntitlements.push({
          employeeId,
          year: vacationYear,
          additionalDays,
        });
      }
    });
    restoreVacationScrollPosition(scrollPosition);
  }

  function captureVacationScrollPosition() {
    const container = elements.vacationPlanner.querySelector(
      ".vacation-table-scroll",
    );
    return {
      left: container?.scrollLeft || 0,
      top: container?.scrollTop || 0,
    };
  }

  function restoreVacationScrollPosition(position) {
    const container = elements.vacationPlanner.querySelector(
      ".vacation-table-scroll",
    );
    if (!container) return;
    container.scrollLeft = position.left;
    container.scrollTop = position.top;
  }

  function schoolVacationPeriods() {
    return state.settings.schoolVacationPeriods || [];
  }

  function renderSchoolVacationSettings() {
    const periods = schoolVacationPeriods();
    elements.schoolVacationCount.textContent = periods.length
      ? `${periods.length} ${
          periods.length === 1 ? "Zeitraum" : "Zeiträume"
        } hinterlegt · bis ${formatDate(periods[periods.length - 1].end)}`
      : "Keine Zeiträume hinterlegt";

    elements.schoolVacationList.innerHTML = periods.length
      ? periods
          .map(
            (period, index) => `
              <article class="school-vacation-row">
                <div>
                  <strong>${escapeHtml(period.label)}</strong>
                  <small>${formatDate(period.start)} – ${formatDate(period.end)}</small>
                </div>
                <button
                  class="icon-button danger"
                  type="button"
                  data-delete-school-vacation="${index}"
                  aria-label="${escapeHtml(
                    `${period.label} vom ${formatDate(period.start)} bis ${formatDate(period.end)} entfernen`,
                  )}"
                  title="Zeitraum entfernen"
                >
                  <svg><use href="#icon-trash"></use></svg>
                </button>
              </article>
            `,
          )
          .join("")
      : renderEmptyState({
          title: "Keine Schulferien hinterlegt",
          text: "Ergänzen Sie Zeiträume oder setzen Sie die amtliche NRW-Liste ein.",
          compact: true,
        });
  }

  async function addSchoolVacationPeriod(event) {
    event.preventDefault();
    if (!requireAdmin()) return;

    const start = elements.newSchoolVacationStart.value;
    const end = elements.newSchoolVacationEnd.value;
    const label = elements.newSchoolVacationLabel.value.trim();

    if (!parseLocalDate(start) || !parseLocalDate(end)) {
      showToast("Bitte Beginn und Ende als vollständiges Datum angeben.", "error");
      return;
    }
    if (end < start) {
      showToast("Das Ende darf nicht vor dem Beginn liegen.", "error");
      elements.newSchoolVacationEnd.focus();
      return;
    }
    if (!label) {
      showToast("Bitte eine Bezeichnung angeben, etwa „Sommerferien“.", "error");
      elements.newSchoolVacationLabel.focus();
      return;
    }
    if (schoolVacationPeriods().length >= MAX_SCHOOL_VACATION_PERIODS) {
      showToast(
        `Es sind höchstens ${MAX_SCHOOL_VACATION_PERIODS} Zeiträume möglich.`,
        "error",
      );
      return;
    }
    if (
      schoolVacationPeriods().some(
        (period) =>
          period.start === start && period.end === end && period.label === label,
      )
    ) {
      showToast("Dieser Zeitraum ist bereits hinterlegt.", "error");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = sortSchoolVacationPeriods([
        ...schoolVacationPeriods(),
        { start, end, label: label.slice(0, 60) },
      ]);
    });
    if (!committed) return;

    elements.schoolVacationForm.reset();
    renderSchoolVacationSettings();
    showToast(`„${label}“ wurde hinterlegt.`);
  }

  async function deleteSchoolVacationPeriod(index) {
    if (!requireAdmin()) return;
    const period = schoolVacationPeriods()[index];
    if (!period) return;

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = schoolVacationPeriods().filter(
        (_, position) => position !== index,
      );
    });
    if (!committed) return;

    renderSchoolVacationSettings();
    showToast(`„${period.label}“ wurde entfernt.`);
  }

  async function restoreOfficialSchoolVacations() {
    if (!requireAdmin()) return;
    const vorhandene = new Set(
      schoolVacationPeriods().map(
        (period) => `${period.start}|${period.end}|${period.label}`,
      ),
    );
    const fehlende = NRW_SCHOOL_VACATION_PERIODS.filter(
      (period) => !vorhandene.has(`${period.start}|${period.end}|${period.label}`),
    );
    if (fehlende.length === 0) {
      showToast("Alle amtlichen NRW-Termine sind bereits hinterlegt.");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = sortSchoolVacationPeriods([
        ...schoolVacationPeriods(),
        ...fehlende,
      ]).slice(0, MAX_SCHOOL_VACATION_PERIODS);
    });
    if (!committed) return;

    renderSchoolVacationSettings();
    showToast(
      `${fehlende.length} amtliche NRW-Zeiträume wurden ergänzt. Eigene Einträge blieben erhalten.`,
    );
  }

  function sortSchoolVacationPeriods(periods) {
    return [...periods].sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
    );
  }

  async function saveVacationSettings() {
    const baseDays =
      Math.round(clampNumber(elements.vacationBaseDays.value, 1, 60, 30) * 2) /
      2;
    const weekdayAbsenceLimit = Math.round(
      clampNumber(
        elements.vacationWeekdayAbsenceLimit.value,
        1,
        100,
        DEFAULT_WEEKDAY_ABSENCE_LIMIT,
      ),
    );
    const weekendAbsenceLimit = Math.round(
      clampNumber(
        elements.vacationWeekendAbsenceLimit.value,
        1,
        100,
        DEFAULT_WEEKEND_ABSENCE_LIMIT,
      ),
    );
    const referenceDate = elements.vacationWeekendAReferenceSaturday.value;
    const parsedReference = parseLocalDate(referenceDate);
    if (!parsedReference || parsedReference.getDay() !== 6) {
      showToast(
        `Die Referenz für „${serviceWeekendLabel("weekend_a")}“ muss ein Samstag sein.`,
        "error",
      );
      elements.vacationWeekendAReferenceSaturday.focus();
      return;
    }
    const committed = await commitStateMutation(() => {
      state.settings.vacationBaseDays = baseDays;
      state.settings.vacationWeekendAReferenceSaturday = referenceDate;
      state.settings.vacationWeekdayAbsenceLimit = weekdayAbsenceLimit;
      state.settings.vacationWeekendAbsenceLimit = weekendAbsenceLimit;
    });
    if (committed) showToast("Planungseinstellungen wurden gespeichert.");
  }

  function getVacationDayMetadata(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
    schoolVacations = getNrwSchoolVacations(Number(date.slice(0, 4))),
  ) {
    const parsed = parseLocalDate(date);
    const holiday = holidays.get(date) || "";
    const schoolVacation = schoolVacations.get(date) || "";
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const classNames = [];
    if (weekendGroup) classNames.push(`vacation-weekend-${weekendGroup}`);
    if (holiday) classNames.push("vacation-holiday");
    if (schoolVacation) classNames.push("vacation-school-vacation");
    const titleParts = [
      holiday,
      schoolVacation ? `${schoolVacation} NRW` : "",
      weekendGroup
        ? `Dienstwochenende ${serviceWeekendLabel(weekendGroup)}`
        : "",
    ].filter(Boolean);
    return {
      weekendGroup,
      holiday,
      schoolVacation,
      className: classNames.join(" "),
      title: titleParts.length ? titleParts.join(" · ") : formatDate(date),
    };
  }

  function getWeekendRotationForDate(date) {
    const parsed = parseLocalDate(date);
    const reference = parseLocalDate(state.settings.vacationWeekendAReferenceSaturday);
    if (!parsed || !reference) return "";
    const saturday = new Date(parsed);
    if (saturday.getDay() === 0) saturday.setDate(saturday.getDate() - 1);
    if (saturday.getDay() !== 6) return "";
    const weekDifference = Math.round(
      (saturday.getTime() - reference.getTime()) / (7 * 86400000),
    );
    return ((weekDifference % 2) + 2) % 2 === 0 ? "weekend_a" : "weekend_b";
  }

  function getNrwHolidays(year) {
    const holidays = new Map([
      [`${year}-01-01`, "Neujahr"],
      [`${year}-05-01`, "Tag der Arbeit"],
      [`${year}-10-03`, "Tag der Deutschen Einheit"],
      [`${year}-11-01`, "Allerheiligen"],
      [`${year}-12-25`, "1. Weihnachtstag"],
      [`${year}-12-26`, "2. Weihnachtstag"],
    ]);
    const easterSunday = getEasterSunday(year);
    [
      [-2, "Karfreitag"],
      [1, "Ostermontag"],
      [39, "Christi Himmelfahrt"],
      [50, "Pfingstmontag"],
      [60, "Fronleichnam"],
    ].forEach(([offset, label]) => {
      const date = new Date(easterSunday);
      date.setDate(date.getDate() + offset);
      holidays.set(localDateToIso(date), label);
    });
    return holidays;
  }

  function getNrwSchoolVacations(year) {
    const vacationDays = new Map();
    schoolVacationPeriods().forEach((period) => {
      let date = parseLocalDate(period.start);
      const end = parseLocalDate(period.end);
      while (date && end && date <= end) {
        if (date.getFullYear() === year) {
          vacationDays.set(localDateToIso(date), period.label);
        }
        date.setDate(date.getDate() + 1);
      }
    });
    return vacationDays;
  }

  function getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day, 12);
  }

  function localDateToIso(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }
