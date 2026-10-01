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
    const allEmployees = activeEmployeeList().sort(
      vacationSortMode === "qualification"
        ? compareEmployeesByVacationSortGroup
        : sortEmployees,
    );
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
        ${renderCarryOverWarning(allEmployees)}
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
              <th class="vacation-employee-column" scope="col">
                <div class="vacation-month-heading">
                  <button
                    class="icon-button vacation-month-navigation vacation-month-previous"
                    type="button"
                    data-vacation-month-shift="-1"
                    aria-label="Vorheriger Monat"
                    title="Vorheriger Monat (Bild ↑)"
                  >
                    <svg><use href="#icon-chevron"></use></svg>
                  </button>
                  <span class="vacation-month-label">${escapeHtml(selectedMonthLabel)}</span>
                  <button
                    class="icon-button vacation-month-navigation"
                    type="button"
                    data-vacation-month-shift="1"
                    aria-label="Nächster Monat"
                    title="Nächster Monat (Bild ↓)"
                  >
                    <svg><use href="#icon-chevron"></use></svg>
                  </button>
                </div>
              </th>
              ${dates
                .map((date) =>
                  renderVacationDayHeader(date, holidays, schoolVacations),
                )
                .join("")}
              <th class="vacation-total-column" scope="col">Basis</th>
              <th class="vacation-total-column" scope="col">Zusatz</th>
              <th
                class="vacation-total-column"
                scope="col"
                title="Resturlaub aus ${vacationYear - 1}; verfällt, soweit er nicht bis zum ${formatCarryOverExpiry()}${vacationYear} geplant ist"
              >Übertrag</th>
              <th class="vacation-total-column" scope="col">Anspruch</th>
              <th class="vacation-total-column" scope="col">Geplant</th>
              <th class="vacation-total-column" scope="col">Rest</th>
            </tr>
          </thead>
          <tbody>
            ${employees
              .map(
                (employee, index) =>
                  renderVacationGroupRow(employees, index, dates.length) +
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

  // Bei der Sortierung nach Qualifikation beginnt jede Gruppe mit einer
  // Zwischenzeile. Sie traegt keine Tagesfelder; die Tastaturnavigation
  // arbeitet mit Mitarbeiter und Datum und ueberspringt sie damit von selbst.
  function renderVacationGroupRow(employees, index, dayCount) {
    if (vacationSortMode !== "qualification") return "";
    const group = vacationSortGroupOf(employees[index]);
    if (index > 0 && vacationSortGroupOf(employees[index - 1]) === group) return "";
    const count = employees.filter((employee) => vacationSortGroupOf(employee) === group).length;
    return `
      <tr class="vacation-group-row">
        <th class="vacation-employee-column" scope="rowgroup">
          ${escapeHtml(VACATION_SORT_GROUPS[group] || "Ohne Gruppe")}
          <span class="vacation-group-count">${count}</span>
        </th>
        <td colspan="${dayCount + 6}" aria-hidden="true"></td>
      </tr>
    `;
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
      sort: "name",
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
        sort: Object.hasOwn(VACATION_SORT_MODES, value?.sort) ? value.sort : fallback.sort,
      };
    } catch {
      return fallback;
    }
  }

  function saveVacationViewPreference() {
    try {
      window.localStorage?.setItem?.(
        VACATION_VIEW_KEY,
        JSON.stringify({
          year: vacationYear,
          month: vacationMonth,
          sort: vacationSortMode,
        }),
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
    elements.vacationSortMode.value = vacationSortMode;
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
    elements.vacationCarryOverExpiry.value = formatCarryOverExpiry();
    elements.vacationWeekendAReferenceLabel.textContent =
      `Referenzsamstag ${serviceWeekendLabel("weekend_a")}`;
    renderVacationSortOrderSettings();
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

  // Die Rangfolge ist fest und unabhaengig von der eingestellten Reihenfolge:
  // Leitungsfunktionen vor der Einarbeitung, die Einarbeitung vor
  // Weiterbildung und Beruf. ITA steht fuer Intensivtechnische/r
  // Assistent/in.
  // Wer in keine Gruppe faellt, steht hinter allen Gruppen.
  function vacationSortGroupOf(employee) {
    const qualifications = employee.qualifications || {};
    if (qualifications.stationsleitung) return "stationsleitung";
    if (qualifications.stellvertretendeStationsleitung) {
      return "stellvertretendeStationsleitung";
    }
    if (employee.employmentStatus === "onboarding") return "onboarding";
    if (qualifications.fachweiterbildungIA) return "fachweiterbildung";
    const signature = professionSignature(employee.profession);
    if (
      signature === "ita" ||
      (signature.includes("intensivtechn") && signature.includes("assist"))
    ) {
      return "ita";
    }
    if (signature.includes("pflegefachassisten")) return "pflegefachassistenz";
    if (signature === "mfa" || signature.includes("fachangestellt")) return "mfa";
    if (signature.includes("stationsassisten")) return "stationsassistenz";
    if (signature.includes("pflegefach") || signature.includes("krankenpfleg")) {
      return "pflegefachkraft";
    }
    return "";
  }

  function vacationSortGroupRank(employee) {
    const position = state.settings.vacationSortGroupOrder.indexOf(
      vacationSortGroupOf(employee),
    );
    return position < 0 ? state.settings.vacationSortGroupOrder.length : position;
  }

  function compareEmployeesByVacationSortGroup(a, b) {
    return vacationSortGroupRank(a) - vacationSortGroupRank(b) || sortEmployees(a, b);
  }

  function renderVacationSortOrderSettings() {
    const order = state.settings.vacationSortGroupOrder;
    elements.vacationSortOrderList.innerHTML = order
      .map(
        (key, index) => `
          <li class="vacation-sort-order-row">
            <span><span class="vacation-sort-order-position">${index + 1}.</span> ${escapeHtml(
              VACATION_SORT_GROUPS[key],
            )}</span>
            <span class="vacation-sort-order-actions">
              <button
                class="icon-button vacation-sort-order-up"
                type="button"
                data-vacation-sort-move="${key}"
                data-direction="up"
                aria-label="${escapeHtml(VACATION_SORT_GROUPS[key])} nach oben"
                title="Nach oben"
                ${index === 0 ? "disabled" : ""}
              ><svg><use href="#icon-chevron"></use></svg></button>
              <button
                class="icon-button vacation-sort-order-down"
                type="button"
                data-vacation-sort-move="${key}"
                data-direction="down"
                aria-label="${escapeHtml(VACATION_SORT_GROUPS[key])} nach unten"
                title="Nach unten"
                ${index === order.length - 1 ? "disabled" : ""}
              ><svg><use href="#icon-chevron"></use></svg></button>
            </span>
          </li>`,
      )
      .join("");
    elements.resetVacationSortOrderButton.disabled =
      order.join("|") === DEFAULT_VACATION_SORT_GROUP_ORDER.join("|");
  }

  async function handleVacationSortOrderClick(event) {
    const button = event.target.closest("[data-vacation-sort-move]");
    if (!button) return;
    const order = [...state.settings.vacationSortGroupOrder];
    const index = order.indexOf(button.dataset.vacationSortMove);
    const target = index + (button.dataset.direction === "up" ? -1 : 1);
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    const committed = await commitStateMutation(() => {
      state.settings.vacationSortGroupOrder = order;
    });
    // Nach dem Neuaufbau der Liste steht der Fokus sonst im Leeren; er folgt
    // der verschobenen Gruppe, damit sich mehrfach hintereinander schieben
    // laesst.
    if (committed) {
      elements.vacationSortOrderList
        .querySelector(
          `[data-vacation-sort-move="${button.dataset.vacationSortMove}"][data-direction="${button.dataset.direction}"]:not([disabled])`,
        )
        ?.focus();
    }
  }

  async function resetVacationSortOrder() {
    const committed = await commitStateMutation(() => {
      state.settings.vacationSortGroupOrder = [...DEFAULT_VACATION_SORT_GROUP_ORDER];
    });
    if (committed) showToast("Die Sortierreihenfolge steht wieder auf der Vorgabe.");
  }

  function filterVacationEmployees(employees) {
    const searchTerm = searchKey(vacationEmployeeSearchTerm);
    if (!searchTerm) return employees;
    return employees.filter((employee) =>
      searchKey(
        [
          employeeSearchText(employee),
          employee.username,
        ].join(" "),
      ).includes(searchTerm),
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
    const carryOverNote = vacationCarryOverNote(entitlement);
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
        <td
          class="vacation-total-column ${
            entitlement.expiring ? "vacation-carry-over-expiring" : ""
          } ${entitlement.expired ? "vacation-carry-over-expired" : ""}"
          ${carryOverNote ? `title="${escapeHtml(carryOverNote)}"` : ""}
        >
          <input
            class="vacation-additional-input"
            type="number"
            min="0"
            max="60"
            step="0.5"
            value="${entitlement.carryOver}"
            data-vacation-carry-over-employee="${employee.id}"
            aria-label="Resturlaub aus ${vacationYear - 1} für ${escapeHtml(fullName(employee))}"
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
