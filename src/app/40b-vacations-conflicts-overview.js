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
          // Schule, Weiterbildung und externe Einsätze zuerst: Diese Termine
          // stehen in der Regel fest und lassen sich nicht verschieben. Wer nach
          // Ausweichmöglichkeiten sucht, findet die verschiebbaren Urlaube so
          // gesammelt darunter.
          .sort(
            (a, b) =>
              (isFixedAbsence(a.entry) ? 0 : 1) - (isFixedAbsence(b.entry) ? 0 : 1) ||
              sortEmployees(a.employee, b.employee),
          );
        return { date, stats, participants };
      })
      .filter(Boolean);
  }

  function isFixedAbsence(entry) {
    return FIXED_ABSENCE_TYPES.includes(entry.type);
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
                <li class="${[
                  countsTowardsAbsenceLimit(employee) ? "" : "is-exempt",
                  isFixedAbsence(entry) ? "is-fixed" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}">
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
    elements.vacationEmployeeOverviewTitle.textContent =
      `${fullName(employee)} · ${vacationYear}`;
    elements.vacationEmployeeOverviewSubtitle.textContent =
      `${employeeStatusLabel(employee)} · ${currentEmploymentPercent(employee)} % · ${serviceWeekendLabel(employee.serviceWeekend)}`;

    elements.vacationEmployeeOverviewContent.innerHTML = `
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
        ${
          employee.serviceWeekend === "weekend_a" || employee.serviceWeekend === "weekend_b"
            ? `<span><i class="vacation-year-weekend-swatch is-own-weekend"></i> Eigenes Dienstwochenende ${escapeHtml(serviceWeekendLabel(employee.serviceWeekend))}</span>`
            : ""
        }
      </div>
      ${renderVacationYearMatrix(entries, employee, { personal: true })}
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
