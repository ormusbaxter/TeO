  function toggleVacationPlannerMaximized() {
    setVacationPlannerMaximized(
      !elements.vacationPlannerWidget.classList.contains("is-maximized"),
    );
  }

  function setVacationPlannerMaximized(maximized) {
    const active = Boolean(maximized);
    const widget = elements.vacationPlannerWidget;
    if (active && !vacationPlannerWidgetAnchor) {
      vacationPlannerWidgetAnchor = document.createComment(
        "vacation-planner-widget-anchor",
      );
      widget.parentNode.insertBefore(vacationPlannerWidgetAnchor, widget);
      document.body.append(widget);
    } else if (!active && vacationPlannerWidgetAnchor) {
      vacationPlannerWidgetAnchor.parentNode?.insertBefore(
        widget,
        vacationPlannerWidgetAnchor,
      );
      vacationPlannerWidgetAnchor.remove();
      vacationPlannerWidgetAnchor = null;
    }
    widget.classList.toggle("is-maximized", active);
    document.body.classList.toggle("is-vacation-planner-maximized", active);
    elements.toggleVacationPlannerMaximizeButton.setAttribute(
      "aria-pressed",
      String(active),
    );
    elements.toggleVacationPlannerMaximizeButton.title = active
      ? "Planungstabelle verkleinern (Esc)"
      : "Planungstabelle maximieren";
    elements.vacationPlannerMaximizeLabel.textContent = active
      ? "Verkleinern"
      : "Maximieren";
    elements.vacationPlannerMaximizeIcon.setAttribute(
      "href",
      active ? "#icon-minimize" : "#icon-maximize",
    );
  }

  function handleVacationPlannerMaximizeKeydown(event) {
    if (
      event.key !== "Escape" ||
      !elements.vacationPlannerWidget.classList.contains("is-maximized") ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    event.preventDefault();
    setVacationPlannerMaximized(false);
    elements.toggleVacationPlannerMaximizeButton.focus();
  }

  function renderVacationPlanner() {
    renderVacationControls();
    const allEmployees = activeEmployeeList().sort(sortEmployees);
    const employees = filterVacationEmployees(allEmployees);
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, index) =>
      [
        vacationYear,
        String(vacationMonth).padStart(2, "0"),
        String(index + 1).padStart(2, "0"),
      ].join("-"),
    );
    vacationVisibleEmployeeIds = employees.map((employee) => employee.id);
    vacationVisibleDates = dates;
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    const selectedMonthLabel = dateFormat({
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
    // Die Kennzahlen beschreiben immer das gesamte Team. Ein Namensfilter
    // schraenkt nur die sichtbaren Zeilen ein, nicht die Auslastung des Monats.
    const totalEntitlement = allEmployees.reduce(
      (sum, employee) => sum + getVacationEntitlement(employee, vacationYear).total,
      0,
    );
    const totalPlanned = allEmployees.reduce(
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

    if (allEmployees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Aktive Mitarbeiter und Mitarbeiter in Einarbeitung erscheinen hier automatisch.",
        compact: true,
      });
      return;
    }

    if (employees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Kein Mitarbeiter gefunden",
        text: `Zur Suche „${vacationEmployeeSearchTerm}“ gibt es keinen Treffer. Leeren Sie das Suchfeld, um wieder alle ${allEmployees.length} Mitarbeiter zu sehen.`,
        compact: true,
      });
      return;
    }

    elements.vacationPlanner.innerHTML = `
      <div class="vacation-table-note">
        <span class="vacation-note-detail">
          „Urlaub“ und „Urlaub Einarbeitung“ werden vom Jahresanspruch abgezogen.
          Urlaub Einarbeitung und Dienstzusagen zählen nicht gegen die Tagesgrenze
          (${state.settings.vacationWeekdayAbsenceLimit} werktags,
          ${state.settings.vacationWeekendAbsenceLimit} an Wochenenden und Feiertagen).
          Eine Überschreitung bleibt möglich und färbt den Tag rot. Auf einem
          Dienstwochenende gleicht die Zusage eines Mitarbeiters vom jeweils anderen
          festen Wochenende einen Urlaub auf dem eigenen Wochenende aus.
        </span>
        <span class="vacation-note-detail">
          Abwesenheiten von ${escapeHtml(absenceLimitExemptProfessionNote())}
          bleiben sichtbar, zählen aber nicht gegen die Tagesgrenze.
        </span>
        ${renderPlannerKeyboardHint()}
        <span class="vacation-note-detail ${
          schoolVacations.size ? "" : "is-warning"
        }">${schoolVacationCoverageNote}</span>
        ${
          employees.length === allEmployees.length
            ? ""
            : `<span class="vacation-note-detail is-warning">Namensfilter aktiv: ${employees.length} von ${allEmployees.length} Mitarbeitern sichtbar. Die Tagesgrenzen berücksichtigen weiterhin das gesamte Team.</span>`
        }
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
    restoreVacationFocus();
  }

  function renderPlannerKeyboardHint() {
    const shortcuts = Object.entries(PLANNER_ENTRY_KEYS)
      .map(([key, type]) => {
        const definition = PLANNER_ENTRY_TYPES[type];
        return `<span class="vacation-shortcut">
          <kbd>${key.toLocaleUpperCase("de-DE")}</kbd>
          <i class="vacation-shortcut-symbol planner-entry-${type}" aria-hidden="true">${definition.shortLabel}</i>
          <span>${escapeHtml(definition.label)}</span>
        </span>`;
      })
      .join("");
    return `<div class="vacation-keyboard-hint">
      <strong>Tastatur:</strong>
      <span class="vacation-shortcut-list">${shortcuts}</span>
      <span class="vacation-navigation-hint">Pfeiltasten wechseln das Feld · Pos 1/Ende springen an den Monatsrand · Bild auf/ab wechseln den Monat · Umschalt + Pfeil markiert · Entf/Rücktaste löscht</span>
    </div>`;
  }

  function readVacationViewPreference() {
    const fallback = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    };
    try {
      const raw = window.localStorage?.getItem?.(VACATION_VIEW_KEY);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      const year = Number(value?.year);
      const month = Number(value?.month);
      return {
        year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
        month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
      };
    } catch {
      return fallback;
    }
  }

  function saveVacationViewPreference() {
    try {
      window.localStorage?.setItem?.(
        VACATION_VIEW_KEY,
        JSON.stringify({ year: vacationYear, month: vacationMonth }),
      );
    } catch {
      // Die Planung bleibt auch ohne verfügbaren Browserspeicher bedienbar.
    }
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
    renderVacationSettingsControls();
    elements.vacationWeekendALegend.textContent =
      serviceWeekendLabel("weekend_a");
    elements.vacationWeekendBLegend.textContent =
      serviceWeekendLabel("weekend_b");
  }

  function renderVacationSettingsControls() {
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
  }

  function renderVacationDayHeader(date, holidays, schoolVacations) {
    const day = parseLocalDate(date);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const stats = getPlannerDayStats(date, holidays);
    const weekday = dateFormat({ weekday: "short" })
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
      stats.exemptAbsenceCount
        ? `${stats.exemptAbsenceCount} Abwesenheit${
            stats.exemptAbsenceCount === 1 ? "" : "en"
          } ohne Anrechnung auf die Tagesgrenze`
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

  function filterVacationEmployees(employees) {
    const searchTerm = vacationEmployeeSearchTerm.trim().toLocaleLowerCase("de-DE");
    if (!searchTerm) return employees;
    return employees.filter((employee) =>
      [
        fullName(employee),
        employee.lastName,
        employee.firstName,
        employee.username,
      ]
        .join(" ")
        .toLocaleLowerCase("de-DE")
        .includes(searchTerm),
    );
  }

  // Der Beschaeftigungsgrad bleibt in der Mitarbeiterzeile stehen; statt des
  // Beschaeftigungsstatus interessiert bei der Urlaubsplanung das feste
  // Dienstwochenende. „Kein festes Dienstwochenende“ waere in der schmalen
  // Spalte zu lang und wird deshalb gekuerzt.
  function vacationServiceWeekendLabel(employee) {
    return employee.serviceWeekend === "none"
      ? "Kein festes WE"
      : serviceWeekendLabel(employee.serviceWeekend);
  }

  // Faellt der Geburtstag auf den 29. Februar, wird er in Nicht-Schaltjahren
  // wie im Fristenmonitor am 28. Februar gefuehrt.
  function employeeBirthdayAt(employee, date) {
    const birth = parseLocalDate(employee.birthDate);
    if (!birth) return null;
    const year = Number(date.slice(0, 4));
    const observed = birthdayDateForYear(year, birth.getMonth() + 1, birth.getDate());
    if (localDateToIso(observed) !== date) return null;
    return { age: year - birth.getFullYear() };
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
          title="${escapeHtml(
            [
              serviceWeekendLabel(employee.serviceWeekend),
              employeeStatusLabel(employee),
              `${employee.employmentPercent} %`,
            ].join(" · "),
          )}"
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
              <small>${escapeHtml(
                vacationServiceWeekendLabel(employee),
              )} · ${employee.employmentPercent} %</small>
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
            const birthday = employeeBirthdayAt(employee, date);
            const birthdayNote = birthday
              ? `${birthday.age}. Geburtstag`
              : "";
            return `
              <td class="vacation-day-cell ${metadata.className} ${
                dayStats.isOverLimit ? "is-over-limit" : ""
              } ${
                ownWeekend ? "is-own-weekend" : ""
              } ${birthday ? "is-birthday" : ""}">
                <button
                  type="button"
                  data-vacation-employee="${employee.id}"
                  data-vacation-date="${date}"
                  aria-pressed="${Boolean(entry)}"
                  aria-label="${escapeHtml(
                    [
                      `${fullName(employee)}: ${
                        entryType
                          ? `${entryType.label} am ${formatDate(date)}`
                          : `Eintrag am ${formatDate(date)} anlegen`
                      }`,
                      birthdayNote,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  )}"
                  title="${escapeHtml(
                    [entryType?.label, birthdayNote, metadata.title]
                      .filter(Boolean)
                      .join(" · "),
                  )}"
                  class="${entry ? `planner-entry-${entry.type}` : ""}"
                >${entryType?.shortLabel || ""}</button>
                ${
                  birthday
                    ? '<span class="vacation-birthday-marker" aria-hidden="true"></span>'
                    : ""
                }
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

  // Reine Koordinatenrechnung. Bewusst ohne DOM, damit die Navigation ohne
  // Browserumgebung pruefbar bleibt.
  function nextPlannerPosition(position, key, bounds) {
    const row = clampPlannerIndex(position.row, bounds.rowCount);
    const column = clampPlannerIndex(position.column, bounds.columnCount);
    switch (key) {
      case "ArrowLeft":
        return { row, column: Math.max(0, column - 1) };
      case "ArrowRight":
        return { row, column: clampPlannerIndex(column + 1, bounds.columnCount) };
      case "ArrowUp":
        return { row: Math.max(0, row - 1), column };
      case "ArrowDown":
        return { row: clampPlannerIndex(row + 1, bounds.rowCount), column };
      case "Home":
        return { row, column: 0 };
      case "End":
        return { row, column: clampPlannerIndex(bounds.columnCount, bounds.columnCount) };
      default:
        return { row, column };
    }
  }

  function clampPlannerIndex(value, count) {
    return Math.min(Math.max(value, 0), Math.max(0, count - 1));
  }

  // Anker und aktuelles Feld spannen ein Rechteck auf, unabhaengig davon, in
  // welche Richtung markiert wurde.
  function plannerSelectionBounds(anchor, focus) {
    return {
      rowStart: Math.min(anchor.row, focus.row),
      rowEnd: Math.max(anchor.row, focus.row),
      columnStart: Math.min(anchor.column, focus.column),
      columnEnd: Math.max(anchor.column, focus.column),
    };
  }

  function plannerSelectionPositions(anchor, focus) {
    const bounds = plannerSelectionBounds(anchor, focus);
    const positions = [];
    for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
      for (
        let column = bounds.columnStart;
        column <= bounds.columnEnd;
        column += 1
      ) {
        positions.push({ row, column });
      }
    }
    return positions;
  }

  function plannerBounds() {
    return {
      rowCount: vacationVisibleEmployeeIds.length,
      columnCount: vacationVisibleDates.length,
    };
  }

  function plannerPositionOf(employeeId, date) {
    const row = vacationVisibleEmployeeIds.indexOf(employeeId);
    const column = vacationVisibleDates.indexOf(date);
    return row < 0 || column < 0 ? null : { row, column };
  }

  function plannerCoordinates(position) {
    return {
      employeeId: vacationVisibleEmployeeIds[position.row],
      date: vacationVisibleDates[position.column],
    };
  }

  function plannerCellButton(position) {
    const { employeeId, date } = plannerCoordinates(position);
    if (!employeeId || !date) return null;
    return elements.vacationPlanner.querySelector(
      `[data-vacation-employee="${employeeId}"][data-vacation-date="${date}"]`,
    );
  }

  function currentPlannerSelection() {
    if (!vacationFocus) return [];
    return plannerSelectionPositions(
      vacationSelectionAnchor || vacationFocus,
      vacationFocus,
    );
  }

  function applyVacationSelectionHighlight() {
    elements.vacationPlanner
      .querySelectorAll(".vacation-day-cell.is-selected")
      .forEach((cell) => cell.classList.remove("is-selected"));
    // Ein einzelnes Feld zeigt der Fokusrahmen an; hervorgehoben wird nur ein
    // wirklich aufgezogener Bereich.
    if (!vacationSelectionAnchor) return;
    currentPlannerSelection().forEach((position) => {
      plannerCellButton(position)?.closest("td")?.classList.add("is-selected");
    });
  }

  function focusVacationCell(position, { keepSelection = false } = {}) {
    const button = plannerCellButton(position);
    if (!button) return;
    vacationFocus = position;
    if (!keepSelection) vacationSelectionAnchor = null;
    button.focus();
    applyVacationSelectionHighlight();
  }

  // Das Neuzeichnen ersetzt die Tabelle vollstaendig, der Fokus faellt dabei
  // auf den Body zurueck. Nur dann wird er zurueckgeholt - liegt er inzwischen
  // im Suchfeld oder in einem Dialog, bleibt er dort.
  function restoreVacationFocus() {
    applyVacationSelectionHighlight();
    if (!vacationFocus) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    plannerCellButton(vacationFocus)?.focus({ preventScroll: true });
  }

  function handleVacationPlannerKeydown(event) {
    const button = event.target.closest(
      "[data-vacation-employee][data-vacation-date]",
    );
    if (!button || event.altKey || event.ctrlKey || event.metaKey) return;
    const position = plannerPositionOf(
      button.dataset.vacationEmployee,
      button.dataset.vacationDate,
    );
    if (!position) return;
    vacationFocus = position;

    if (PLANNER_NAVIGATION_KEYS.includes(event.key)) {
      event.preventDefault();
      if (event.shiftKey && !vacationSelectionAnchor) {
        vacationSelectionAnchor = position;
      }
      focusVacationCell(nextPlannerPosition(position, event.key, plannerBounds()), {
        keepSelection: event.shiftKey,
      });
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      shiftVacationMonth(event.key === "PageUp" ? -1 : 1, position);
      return;
    }

    if (event.key === "Escape" && vacationSelectionAnchor) {
      event.preventDefault();
      vacationSelectionAnchor = null;
      applyVacationSelectionHighlight();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void applyVacationEntryToSelection("");
      return;
    }

    const key = event.key.toLocaleLowerCase("de-DE");
    if (!Object.hasOwn(PLANNER_ENTRY_KEYS, key)) return;
    event.preventDefault();
    void applyVacationEntryToSelection(PLANNER_ENTRY_KEYS[key]);
  }

  function shiftVacationMonth(offset, position) {
    const target = new Date(vacationYear, vacationMonth - 1 + offset, 1, 12);
    vacationYear = target.getFullYear();
    vacationMonth = target.getMonth() + 1;
    saveVacationViewPreference();
    // Der Tag im Monat entspricht dem Spaltenindex; kuerzere Monate werden
    // abgeschnitten.
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const nextPosition = position || vacationFocus || { row: 0, column: 0 };
    vacationFocus = {
      row: nextPosition.row,
      column: Math.min(nextPosition.column, daysInMonth - 1),
    };
    vacationSelectionAnchor = null;
    renderVacationPlanner();
  }

  // Buchstaben weisen zu, statt umzuschalten: Beim Durchtippen einer Reihe
  // waere ein Umschalten bei gleicher Eintragsart unerwartet. Entfernt wird
  // ausschliesslich mit Entf oder Rücktaste.
  async function applyVacationEntryToSelection(entryType) {
    const cells = currentPlannerSelection()
      .map(plannerCoordinates)
      .filter((cell) => cell.employeeId && cell.date);
    if (!cells.length) return;

    // Die Eintragsart der Steuerleiste zieht mit, damit Klick und Taste
    // dieselbe Auswahl verwenden.
    if (entryType) {
      vacationEntryType = entryType;
      elements.vacationEntryType.value = entryType;
    }

    const changed = cells.filter((cell) => {
      const existing = findVacationDay(cell.employeeId, cell.date);
      return entryType ? existing?.type !== entryType : Boolean(existing);
    });
    if (!changed.length) return;

    const now = new Date().toISOString();
    const scrollPosition = captureVacationScrollPosition();
    const committed = await commitStateMutation(() => {
      const removableIds = new Set();
      changed.forEach((cell) => {
        const existing = findVacationDay(cell.employeeId, cell.date);
        if (!entryType) {
          if (existing) removableIds.add(existing.id);
          return;
        }
        if (existing) {
          existing.type = entryType;
          existing.updatedAt = now;
          return;
        }
        state.vacationDays.push({
          id: createId(),
          employeeId: cell.employeeId,
          date: cell.date,
          type: entryType,
          createdAt: now,
          updatedAt: now,
        });
      });
      if (removableIds.size) {
        state.vacationDays = state.vacationDays.filter(
          (vacationDay) => !removableIds.has(vacationDay.id),
        );
      }
    });
    restoreVacationScrollPosition(scrollPosition);
    if (!committed) return;
    warnAboutVacationLimit([...new Set(changed.map((cell) => cell.date))]);
  }

  // Die Urlaubsmatrix befragt denselben Bestand aus drei Richtungen: je Tag
  // fuer die Tagesgrenze, je Mitarbeiter und Tag fuer den Zelleninhalt und je
  // Mitarbeiter fuer den Jahresverbrauch. Ohne Vorsortierung durchsucht jede
  // dieser Fragen den gesamten Bestand; bei einer gefuellten Jahresplanung
  // summiert sich das zu Millionen Vergleichen je Aufbau der Ansicht.
  //
  // Der Zwischenspeicher folgt derselben Regel wie indexById: Er gilt, solange
  // Feld und Laenge unveraendert sind. Eintraege werden ausschliesslich per
  // push ergaenzt oder per filter entfernt, beides faellt dadurch auf.
  const vacationIndexes = new WeakMap();

  function vacationIndex() {
    const collection = state.vacationDays;
    const cached = vacationIndexes.get(collection);
    if (cached && cached.size === collection.length) return cached.index;
    const byDate = new Map();
    const byEmployee = new Map();
    const byEmployeeAndDate = new Map();
    for (const entry of collection) {
      const dayEntries = byDate.get(entry.date);
      if (dayEntries) dayEntries.push(entry);
      else byDate.set(entry.date, [entry]);

      const employeeEntries = byEmployee.get(entry.employeeId);
      if (employeeEntries) employeeEntries.push(entry);
      else byEmployee.set(entry.employeeId, [entry]);

      // Doppelte Eintraege zu einem Tag sind nicht vorgesehen; sollte es sie
      // doch geben, gewinnt der erste - wie zuvor bei der Suche mit find().
      const key = `${entry.employeeId}|${entry.date}`;
      if (!byEmployeeAndDate.has(key)) byEmployeeAndDate.set(key, entry);
    }
    const index = { byDate, byEmployee, byEmployeeAndDate };
    vacationIndexes.set(collection, { size: collection.length, index });
    return index;
  }

  function vacationDaysOn(date) {
    return vacationIndex().byDate.get(date) || [];
  }

  function vacationDaysOf(employeeId) {
    return vacationIndex().byEmployee.get(employeeId) || [];
  }

  function findVacationDay(employeeId, date) {
    return vacationIndex().byEmployeeAndDate.get(`${employeeId}|${date}`);
  }

  // Eine Bereichseingabe kann viele Tage auf einmal ueberplanen. Einzelne
  // Meldungen wuerden den Bildschirm fluten, deshalb eine Sammelmeldung.
  function warnAboutVacationLimit(dates) {
    const overLimitDates = dates
      .filter((date) => getPlannerDayStats(date).isOverLimit)
      .sort((a, b) => a.localeCompare(b));
    if (!overLimitDates.length) return;

    if (overLimitDates.length > 1) {
      showToast(
        `Warnung: An ${overLimitDates.length} Tagen ist die Abwesenheitsgrenze überschritten, zuerst am ${formatDate(overLimitDates[0])}.`,
        "error",
      );
      return;
    }

    const stats = getPlannerDayStats(overLimitDates[0]);
    const compensationNote = stats.compensatedAbsenceCount
      ? ` (${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} ausgeglichen)`
      : "";
    showToast(
      `Warnung: Am ${formatDate(overLimitDates[0])} bestehen ${stats.effectiveAbsenceCount} wirksame Abwesenheiten${compensationNote}, vorgesehen sind maximal ${stats.limit}.`,
      "error",
    );
  }

  function absenceLimitExemptProfessionNote() {
    const professions = [
      ...new Set(
        activeEmployeeList()
          .map((employee) => employee.profession)
          .filter(isAbsenceLimitExemptProfession),
      ),
    ].sort((a, b) => a.localeCompare(b, "de"));
    return professions.length
      ? professions.join(", ")
      : "Medizinischen Fachangestellten, Pflegefachassistenz und Stationsassistenz";
  }

  // Sammelt alle Tage des Planungsjahres, an denen die Tagesgrenze
  // ueberschritten ist, und nennt die dabei beteiligten Mitarbeiter.
  function collectVacationConflicts(year) {
    const holidaysByYear = new Map();
    const dates = [
      ...new Set(
        state.vacationDays
          .filter((entry) => Number(entry.date.slice(0, 4)) === year)
          .map((entry) => entry.date),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return dates
      .map((date) => {
        const entryYear = Number(date.slice(0, 4));
        if (!holidaysByYear.has(entryYear)) {
          holidaysByYear.set(entryYear, getNrwHolidays(entryYear));
        }
        const stats = getPlannerDayStats(date, holidaysByYear.get(entryYear));
        if (!stats.isOverLimit) return null;
        const participants = state.vacationDays
          .filter((entry) => entry.date === date)
          .map((entry) => ({ entry, employee: getEmployee(entry.employeeId) }))
          .filter(
            ({ entry, employee }) =>
              employee?.active && PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
          )
          .sort((a, b) => sortEmployees(a.employee, b.employee));
        return { date, stats, participants };
      })
      .filter(Boolean);
  }

  function openVacationConflictOverview() {
    const conflicts = collectVacationConflicts(vacationYear);
    elements.vacationConflictSubtitle.textContent = conflicts.length
      ? `${conflicts.length} überplante Tage im Jahr ${vacationYear}`
      : `Keine überplanten Tage im Jahr ${vacationYear}`;

    elements.vacationConflictContent.innerHTML = conflicts.length
      ? `
        <p class="vacation-conflict-note">
          Aufgeführt sind alle Tage, an denen die wirksamen Abwesenheiten über
          der Tagesgrenze liegen. Abwesenheiten von
          ${escapeHtml(absenceLimitExemptProfessionNote())} sind darin nicht
          enthalten. Ein Klick auf einen Tag öffnet den zugehörigen Monat.
        </p>
        <div class="vacation-conflict-list">
          ${conflicts.map(renderVacationConflictRow).join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Überschneidungen",
          text: `Im Jahr ${vacationYear} bleibt jeder Tag innerhalb der hinterlegten Tagesgrenzen.`,
          compact: true,
        });
    elements.vacationConflictDialog.showModal();
  }

  function renderVacationConflictRow({ date, stats, participants }) {
    const weekday = dateFormat({ weekday: "long" }).format(parseLocalDate(date));
    const metadata = getVacationDayMetadata(date);
    return `
      <article class="vacation-conflict-row">
        <header>
          <button
            class="vacation-conflict-date"
            type="button"
            data-vacation-conflict-date="${date}"
          >${escapeHtml(`${weekday}, ${formatDate(date)}`)}</button>
          <span class="vacation-conflict-count">
            ${stats.effectiveAbsenceCount} von ${stats.limit} abwesend
          </span>
        </header>
        <p class="vacation-conflict-context">
          ${escapeHtml(
            [
              metadata.holiday,
              metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
              metadata.weekendGroup
                ? `Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
                : "",
              stats.compensatedAbsenceCount
                ? `${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} durch fremde Dienstzusage ausgeglichen`
                : "",
              stats.exemptAbsenceCount
                ? `${stats.exemptAbsenceCount} nicht angerechnete Abwesenheit${
                    stats.exemptAbsenceCount === 1 ? "" : "en"
                  }`
                : "",
            ]
              .filter(Boolean)
              .join(" · "),
          )}
        </p>
        <ul class="vacation-conflict-participants">
          ${participants
            .map(
              ({ entry, employee }) => `
                <li class="${
                  countsTowardsAbsenceLimit(employee) ? "" : "is-exempt"
                }">
                  <strong>${escapeHtml(fullName(employee))}</strong>
                  <span>${escapeHtml(
                    [
                      PLANNER_ENTRY_TYPES[entry.type].label,
                      employee.profession,
                      vacationServiceWeekendLabel(employee),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  )}</span>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
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

  // Die Jahresmatrix ist breiter als hoch und wird deshalb quer gedruckt.
  function printVacationEmployeeOverview() {
    if (!elements.vacationEmployeeOverviewDialog.open) return;
    document.body.classList.add("print-vacation-overview");
    window.print();
    window.setTimeout(
      () => document.body.classList.remove("print-vacation-overview"),
      0,
    );
  }

  function vacationEmployeesForBlankYearPrint() {
    return state.employees
      .filter((employee) =>
        ["active", "onboarding"].includes(employee.employmentStatus),
      )
      .sort(sortEmployees);
  }

  function printBlankVacationYearOverviews() {
    const employees = vacationEmployeesForBlankYearPrint();
    if (!employees.length) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter vorhanden.",
        "error",
      );
      return;
    }

    elements.vacationBlankYearPrintSurface.innerHTML = employees
      .map(renderBlankVacationYearPrintDocument)
      .join("");
    document.body.classList.add("print-vacation-blank-year");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-vacation-blank-year");
      elements.vacationBlankYearPrintSurface.innerHTML = "";
    }, 0);
  }

  function renderBlankVacationYearPrintDocument(employee) {
    return `
      <article class="vacation-blank-year-document">
        <header class="vacation-blank-year-header">
          <div>
            <p>Leere Jahresübersicht</p>
            <h1>${escapeHtml(fullName(employee))}</h1>
          </div>
          <div class="vacation-blank-year-meta">
            <strong>${vacationYear}</strong>
            <span>${escapeHtml(
              [
                employeeStatusLabel(employee),
                `${employee.employmentPercent} %`,
                serviceWeekendLabel(employee.serviceWeekend),
              ].join(" · "),
            )}</span>
          </div>
        </header>
        <div class="vacation-blank-year-legend" aria-label="Legende">
          <span><i class="vacation-blank-holiday-swatch"></i> Feiertag NRW</span>
          <span><i class="vacation-blank-school-vacation-swatch"></i> Schulferien NRW</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
          <span><i class="vacation-blank-own-weekend-swatch"></i> Eigenes Dienstwochenende</span>
        </div>
        ${renderVacationYearMatrix([], employee)}
        <footer>
          <span>Urlaubsplanung ${vacationYear}</span>
          <span>Stand ${formatDate(todayIso())}</span>
        </footer>
      </article>
    `;
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
    const monthLabel = dateFormat({ month: "long" }).format(
      new Date(vacationYear, month - 1, 1, 12),
    );
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
    const weekday = dateFormat({ weekday: "long" }).format(parsedDate);
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
        class="${metadata.className} ${
          metadata.weekendGroup === employee.serviceWeekend
            ? "is-own-weekend"
            : ""
        } ${entry ? "has-entry" : ""}"
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
    return vacationDaysOf(employeeId).filter(
      (vacationDay) =>
        Number(vacationDay.date.slice(0, 4)) === year &&
        PLANNER_ENTRY_TYPES[vacationDay.type]?.countsVacationEntitlement,
    ).length;
  }

  function getPlannerDayStats(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
  ) {
    const entries = vacationDaysOn(date).filter(
      (entry) => getEmployee(entry.employeeId)?.active,
    );
    // Berufsgruppen ausserhalb des Pflegepools bleiben aus jeder Berechnung der
    // Tagesgrenze heraus - auch aus dem Ausgleich am Dienstwochenende.
    const limitEntries = entries.filter((entry) =>
      countsTowardsAbsenceLimit(getEmployee(entry.employeeId)),
    );
    const absenceCount = limitEntries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const exemptAbsenceCount =
      entries.filter((entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence)
        .length - absenceCount;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const parsed = parseLocalDate(date);
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const ownWeekendVacationCount = weekendGroup
      ? limitEntries.filter((entry) => {
          if (entry.type !== "vacation") return false;
          return getEmployee(entry.employeeId)?.serviceWeekend === weekendGroup;
        }).length
      : 0;
    const foreignWeekendDutyCount = weekendGroup
      ? limitEntries.filter((entry) => {
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
      exemptAbsenceCount,
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
    return numberFormat({
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
    // Ein Klick setzt den Ausgangspunkt der Tastaturnavigation und beendet
    // eine bestehende Bereichsmarkierung.
    const clickedPosition = plannerPositionOf(employeeId, date);
    if (clickedPosition) {
      vacationFocus = clickedPosition;
      vacationSelectionAnchor = null;
    }
    const existing = findVacationDay(employeeId, date);
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
    warnAboutVacationLimit([date]);
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
