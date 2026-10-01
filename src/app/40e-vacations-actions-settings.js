  async function handleVacationPlannerClick(event) {
    const monthShiftButton = event.target.closest("[data-vacation-month-shift]");
    if (monthShiftButton) {
      shiftVacationMonth(Number(monthShiftButton.dataset.vacationMonthShift));
      return;
    }

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
    const additionalInput = event.target.closest("[data-vacation-additional-employee]");
    const carryOverInput = event.target.closest("[data-vacation-carry-over-employee]");
    const input = additionalInput || carryOverInput;
    if (!input) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = additionalInput
      ? input.dataset.vacationAdditionalEmployee
      : input.dataset.vacationCarryOverEmployee;
    const field = additionalInput ? "additionalDays" : "carryOverDays";
    const value =
      Math.round(clampNumber(input.value, 0, additionalInput ? 30 : 60, 0) * 2) / 2;
    await commitStateMutation(() => {
      setVacationEntitlementValue(employeeId, vacationYear, field, value);
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
    const carryOverExpiry = parseCarryOverExpiry(
      elements.vacationCarryOverExpiry.value,
    );
    if (!carryOverExpiry) {
      showToast(
        "Den Verfall des Resturlaubs bitte als Tag und Monat angeben, etwa 31.03.",
        "error",
      );
      elements.vacationCarryOverExpiry.focus();
      return;
    }
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
      state.settings.vacationCarryOverExpiry = carryOverExpiry;
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
      const date = parseLocalDate(period.start);
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
