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

  // Leere Monatsplanungen zum Ausfuellen von Hand: je Monat ein Blatt, darauf
  // alle aktiven Mitarbeiter alphabetisch untereinander und die Tage des
  // Monats als Spalten. Das Gegenstueck zu den leeren Jahresuebersichten, die
  // je Mitarbeiter ein Blatt fuellen - dieselben Beschaeftigten, dieselben
  // Kalendermerkmale, nur andersherum aufgeteilt.
  //
  // Gedruckt wird das ganze Jahr. Wer nur einen Monat braucht, waehlt im
  // Druckdialog die Seite aus; zwoelf Blaetter neu aufzubauen ist billiger als
  // eine zweite Bedienung dafuer.
  //
  // Ein grosses Team fuellt mehr als ein Blatt. Aufgeteilt wird hier und nicht
  // vom Seitenumbruch: Nur so weiss jedes Blatt, das wievielte es ist, und
  // kann Monat und "Seite x von y" im Kopf tragen. Auf eine A4-Querseite
  // passen bei 8 mm Rand 194 mm; Kopf, Legende, Tabellenkopf und Fuss nehmen
  // davon rund 35 mm, jede Zeile 7,5 mm. Rechnerisch waeren 21 Zeilen
  // moeglich (192,6 mm) - eine bleibt als Reserve frei, damit abweichende
  // Schriftmetriken auf einem fremden Rechner die Aufteilung nicht kippen und
  // aus "Seite 1 von 2" nicht stillschweigend drei Seiten werden.
  const BLANK_MONTH_ROWS_PER_SHEET = 20;

  function blankVacationMonthSheets(employees) {
    const sheets = [];
    for (
      let position = 0;
      position < employees.length;
      position += BLANK_MONTH_ROWS_PER_SHEET
    ) {
      sheets.push(employees.slice(position, position + BLANK_MONTH_ROWS_PER_SHEET));
    }
    return sheets.length ? sheets : [[]];
  }

  function printBlankVacationMonthPlans() {
    const employees = vacationEmployeesForBlankYearPrint();
    if (!employees.length) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter vorhanden.",
        "error",
      );
      return;
    }

    // Feiertage und Schulferien gelten fuer alle zwoelf Blaetter; einmal
    // ermittelt genuegt.
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    const sheets = blankVacationMonthSheets(employees);
    elements.vacationBlankMonthPrintSurface.innerHTML = Array.from(
      { length: 12 },
      (_, index) =>
        sheets
          .map((sheetEmployees, sheetIndex) =>
            renderBlankVacationMonthPrintDocument(
              index + 1,
              sheetEmployees,
              holidays,
              schoolVacations,
              { sheet: sheetIndex + 1, sheetCount: sheets.length },
            ),
          )
          .join(""),
    ).join("");
    document.body.classList.add("print-vacation-blank-month");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-vacation-blank-month");
      elements.vacationBlankMonthPrintSurface.innerHTML = "";
    }, 0);
  }

  function renderBlankVacationMonthPrintDocument(
    month,
    employees,
    holidays,
    schoolVacations,
    { sheet = 1, sheetCount = 1 } = {},
  ) {
    const monthLabel = dateFormat({ month: "long", year: "numeric" }).format(
      new Date(vacationYear, month - 1, 1, 12),
    );
    const daysInMonth = new Date(vacationYear, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return `
      <article class="vacation-blank-month-document">
        <header class="vacation-blank-month-header">
          <h1>${escapeHtml(monthLabel)}</h1>
          ${
            // Nur wenn der Monat wirklich mehrere Blaetter braucht - sonst
            // stuende auf jedem Blatt eine Selbstverstaendlichkeit.
            sheetCount > 1
              ? `<span class="vacation-blank-month-sheet">Seite ${sheet} von ${sheetCount}</span>`
              : ""
          }
        </header>
        <div class="vacation-blank-year-legend" aria-label="Legende">
          <span><i class="vacation-blank-holiday-swatch"></i> Feiertag NRW</span>
          <span><i class="vacation-blank-school-vacation-swatch"></i> Schulferien NRW</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
          <span><i class="vacation-blank-own-weekend-swatch"></i> Eigenes Dienstwochenende</span>
        </div>
        <table class="vacation-blank-month-table">
          <thead>
            <tr>
              <th class="vacation-blank-month-name-column" scope="col">Mitarbeiter</th>
              ${days
                .map((day) =>
                  renderBlankVacationMonthDayHeader(
                    month,
                    day,
                    holidays,
                    schoolVacations,
                  ),
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
              .map((employee) =>
                renderBlankVacationMonthRow(
                  month,
                  days,
                  employee,
                  holidays,
                  schoolVacations,
                ),
              )
              .join("")}
          </tbody>
        </table>
        <footer>
          <span>Urlaubsplanung ${vacationYear}</span>
          <span>Stand ${formatDate(todayIso())}</span>
        </footer>
      </article>
    `;
  }

  function renderBlankVacationMonthDayHeader(
    month,
    day,
    holidays,
    schoolVacations,
  ) {
    const date = blankVacationMonthDate(month, day);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const weekday = dateFormat({ weekday: "short" }).format(parseLocalDate(date));
    return `
      <th class="${metadata.className}" scope="col" title="${escapeHtml(metadata.title)}">
        <span class="vacation-blank-month-day">${day}</span>
        <span class="vacation-blank-month-weekday">${escapeHtml(weekday)}</span>
      </th>
    `;
  }

  function renderBlankVacationMonthRow(
    month,
    days,
    employee,
    holidays,
    schoolVacations,
  ) {
    return `
      <tr>
        <th class="vacation-blank-month-name-column" scope="row">
          <strong>${escapeHtml(
            fullName(employee),
          )}</strong>
          <small>${escapeHtml(
            [
              `${employee.employmentPercent} %`,
              // Beim Ausfuellen von Hand ist der Jahresanspruch die Zahl, die
              // gebraucht wird - das Dienstwochenende steht ohnehin als
              // Umrandung in den Tagesspalten.
              `${formatVacationNumber(
                getVacationEntitlement(employee, vacationYear).total,
              )} Urlaubstage`,
            ].join(" · "),
          )}</small>
        </th>
        ${days
          .map((day) => {
            const date = blankVacationMonthDate(month, day);
            const metadata = getVacationDayMetadata(
              date,
              holidays,
              schoolVacations,
            );
            // Das eigene Dienstwochenende hebt sich hervor - beim Ausfuellen
            // von Hand ist das die Angabe, auf die es ankommt.
            const ownWeekend =
              metadata.weekendGroup === employee.serviceWeekend
                ? "is-own-weekend"
                : "";
            return `<td class="${metadata.className} ${ownWeekend}"></td>`;
          })
          .join("")}
      </tr>
    `;
  }

  function blankVacationMonthDate(month, day) {
    return [
      vacationYear,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  // personal: die Ansicht „Jahresabwesenheiten“ eines Mitarbeiters. Sie zeigt
  // je Monat die genommenen Urlaubs- und Schultage und markiert nur das eigene
  // Dienstwochenende; die Tönung beider Dienstwochenenden fällt weg. Der leere
  // Vordruck zum Ausfüllen von Hand bleibt, wie er ist.
  function renderVacationYearMatrix(entries, employee, { personal = false } = {}) {
    const entriesByDate = new Map(
      entries.map((entry) => [entry.date, entry]),
    );
    const days = Array.from({ length: 31 }, (_, index) => index + 1);
    const showSchool = personal && entries.some((entry) => entry.type === "school");
    return `
      <div class="vacation-year-matrix-scroll">
        <table class="vacation-year-matrix">
          <thead>
            <tr>
              <th class="vacation-year-month-column" scope="col">Monat</th>
              ${days.map((day) => `<th scope="col">${day}</th>`).join("")}
              ${
                personal
                  ? `<th class="vacation-year-total-column" scope="col" title="Genommene Urlaubstage im Monat">Urlaub</th>${
                      showSchool
                        ? '<th class="vacation-year-total-column" scope="col" title="Schule / Weiterbildung / Uni im Monat">Schule</th>'
                        : ""
                    }`
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 12 }, (_, index) =>
              renderVacationYearMonthRow(
                index + 1,
                days,
                entriesByDate,
                employee,
                { personal, showSchool },
              ),
            ).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderVacationYearMonthRow(
    month,
    days,
    entriesByDate,
    employee,
    { personal = false, showSchool = false } = {},
  ) {
    const monthLabel = dateFormat({ month: "long" }).format(
      new Date(vacationYear, month - 1, 1, 12),
    );
    const daysInMonth = new Date(vacationYear, month, 0).getDate();
    const monthPrefix = `${vacationYear}-${String(month).padStart(2, "0")}-`;
    const monthEntries = personal
      ? [...entriesByDate.values()].filter((entry) => entry.date.startsWith(monthPrefix))
      : [];
    const vacationCount = monthEntries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.countsVacationEntitlement,
    ).length;
    const schoolCount = monthEntries.filter((entry) => entry.type === "school").length;
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
              personal,
            ),
          )
          .join("")}
        ${
          personal
            ? `<td class="vacation-year-total-column">${vacationCount || ""}</td>${
                showSchool ? `<td class="vacation-year-total-column">${schoolCount || ""}</td>` : ""
              }`
            : ""
        }
      </tr>
    `;
  }

  function renderVacationYearDayCell(
    month,
    day,
    daysInMonth,
    entriesByDate,
    employee,
    personal = false,
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
        class="${
          personal
            ? metadata.className.replace(/\bvacation-weekend-weekend_[ab]\b/g, "")
            : metadata.className
        } ${
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
