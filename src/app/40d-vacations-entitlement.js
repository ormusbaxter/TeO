  // ACHTUNG, bewusste Vereinfachung: Der Grundanspruch wird linear zum
  // Stellenumfang gekuerzt. Das Bundesurlaubsgesetz bemisst ihn dagegen nach
  // der Zahl der ARBEITSTAGE PRO WOCHE. Wer 50 Prozent auf fuenf kuerzere Tage
  // verteilt, hat weiterhin Anspruch auf die vollen 30 Tage; wer 50 Prozent
  // auf zweieinhalb Tage verteilt, auf 15.
  //
  // Fuer die Station stimmt die Rechnung, solange Teilzeit immer auch weniger
  // Arbeitstage bedeutet. Kommt Teilzeit bei voller Fuenftagewoche vor, rechnet
  // TeO systematisch zu wenig - dann muessen die Arbeitstage pro Woche am
  // Mitarbeitenden erfasst und hier statt employmentPercent verwendet werden.
  //
  // Ein- und Austritt sowie Aenderungen des Stellenumfangs im Jahr werden
  // monatsweise gezwoelftelt, wie es TVoeD und AVR fuer Teiljahre vorsehen:
  // Jeder volle Beschaeftigungsmonat bringt ein Zwoelftel des Grundurlaubs,
  // bemessen am Stellenumfang dieses Monats. Aendert er sich mitten im Monat,
  // zaehlt jeder Tag mit seinem Wert. Angefangene Monate zaehlen nicht. Ohne
  // Ein-, Austritt und Aenderung im Jahr ergibt das genau den Jahreswert.
  // Gerundet wird wie bisher auf halbe Tage.
  function vacationBaseForYear(employee, year) {
    let twelfths = 0;
    let fullMonths = 0;
    for (let month = 1; month <= 12; month += 1) {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const firstDay = `${prefix}-01`;
      const lastDay = `${prefix}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
      if (isEmployedOn(employee, firstDay) && isEmployedOn(employee, lastDay)) {
        fullMonths += 1;
        twelfths += monthlyEmploymentPercent(employee, year, month, firstDay, lastDay);
      }
    }
    return {
      base: Math.round(((state.settings.vacationBaseDays * twelfths) / 1200) * 2) / 2,
      fullMonths,
    };
  }

  // Durchschnittlicher Stellenumfang eines Monats. Nur wenn eine Aenderung
  // in den Monat faellt, wird tageweise gerechnet - sonst genuegt ein Wert.
  function monthlyEmploymentPercent(employee, year, month, firstDay, lastDay) {
    const changesInMonth = (employee.employmentChanges || []).some(
      (change) => change.from > firstDay && change.from <= lastDay,
    );
    if (!changesInMonth) return employmentPercentOn(employee, firstDay);
    const days = new Date(year, month, 0).getDate();
    let sum = 0;
    for (let day = 1; day <= days; day += 1) {
      sum += employmentPercentOn(
        employee,
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
    return sum / days;
  }

  function getVacationEntitlement(employee, year) {
    const { base, fullMonths } = vacationBaseForYear(employee, year);
    const stored = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employee.id && entry.year === year,
    );
    const additional = stored?.additionalDays || 0;
    const carryOver = stored?.carryOverDays || 0;
    const expiryDate = `${year}-${state.settings.vacationCarryOverExpiry}`;
    // Urlaub bis zum Stichtag zehrt zuerst den Uebertrag auf. Was davon
    // uebrig bleibt, verfaellt am Stichtag; bis dahin wird nur gewarnt.
    const usedUntilExpiry = carryOver
      ? vacationDaysOf(employee.id).filter(
          (vacationDay) =>
            vacationDay.date.startsWith(`${year}-`) &&
            vacationDay.date <= expiryDate &&
            PLANNER_ENTRY_TYPES[vacationDay.type]?.countsVacationEntitlement,
        ).length
      : 0;
    const unused = Math.max(0, carryOver - usedUntilExpiry);
    const expired = todayIso() > expiryDate ? unused : 0;
    return {
      base,
      fullMonths,
      additional,
      carryOver,
      expiryDate,
      expiring: unused - expired,
      expired,
      total: base + additional + carryOver - expired,
    };
  }

  function renderCarryOverWarning(employees) {
    const expiring = employees
      .map((employee) => ({
        employee,
        entitlement: getVacationEntitlement(employee, vacationYear),
      }))
      .filter((item) => item.entitlement.expiring);
    if (!expiring.length) return "";
    const days = expiring.reduce((sum, item) => sum + item.entitlement.expiring, 0);
    return `<span class="vacation-note-detail is-warning">Resturlaub: ${formatVacationNumber(days)} Tage von ${expiring.length} Mitarbeiter${
      expiring.length === 1 ? "" : "n"
    } verfallen am ${formatDate(expiring[0].entitlement.expiryDate)}, wenn sie nicht bis dahin geplant werden – betroffen: ${escapeHtml(
      formatList(expiring.map((item) => fullName(item.employee))),
    )}.</span>`;
  }

  function vacationCarryOverNote(entitlement) {
    if (entitlement.expired) {
      return `${formatVacationNumber(entitlement.expired)} Tage Resturlaub sind am ${formatDate(entitlement.expiryDate)} verfallen.`;
    }
    if (entitlement.expiring) {
      return `${formatVacationNumber(entitlement.expiring)} Tage Resturlaub verfallen am ${formatDate(entitlement.expiryDate)}, wenn sie nicht bis dahin geplant werden.`;
    }
    return "";
  }

  // „31.03.“, „31.3“ oder „31.03“ ergeben „03-31“; Ungueltiges liefert "".
  function parseCarryOverExpiry(text) {
    const match = /^\s*(\d{1,2})\.(\d{1,2})\.?\s*$/.exec(String(text || ""));
    if (!match) return "";
    const value = `${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    return normalizeCarryOverExpiry(value) === value ? value : "";
  }

  function formatCarryOverExpiry(value = state.settings.vacationCarryOverExpiry) {
    const [month, day] = value.split("-");
    return `${day}.${month}.`;
  }

  // Rest des Vorjahres als Uebertrag des gewaehlten Jahres. Wer im Vorjahr
  // keinen einzigen Planungseintrag hat, bleibt aussen vor: Dort fehlen
  // vermutlich die Daten, und der volle Anspruch waere ein falscher Rest.
  function proposedCarryOvers(year) {
    const previousYear = year - 1;
    return activeEmployeeList()
      .filter((employee) =>
        vacationDaysOf(employee.id).some((entry) =>
          entry.date.startsWith(`${previousYear}-`),
        ),
      )
      .map((employee) => {
        const rest =
          getVacationEntitlement(employee, previousYear).total -
          getPlannedVacationDays(employee.id, previousYear);
        return {
          employeeId: employee.id,
          days: Math.min(60, Math.max(0, Math.round(rest * 2) / 2)),
        };
      });
  }

  function setVacationEntitlementValue(employeeId, year, field, value) {
    const existing = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employeeId && entry.year === year,
    );
    if (existing) {
      existing[field] = value;
      return;
    }
    state.vacationEntitlements.push({
      employeeId,
      year,
      additionalDays: 0,
      carryOverDays: 0,
      [field]: value,
    });
  }

  function requestVacationCarryOver() {
    const year = vacationYear;
    const proposals = proposedCarryOvers(year);
    const skipped = activeEmployeeList().length - proposals.length;
    if (!proposals.length) {
      showToast(
        `Für ${year - 1} gibt es keine Planungseinträge – es lässt sich kein Resturlaub übernehmen.`,
        "warning",
      );
      return;
    }
    const totalDays = proposals.reduce((sum, item) => sum + item.days, 0);
    requestConfirmation({
      title: `Resturlaub aus ${year - 1} übernehmen?`,
      message: [
        `${proposals.length} Mitarbeiter erhalten ihren Rest aus ${year - 1} als Übertrag für ${year} – zusammen ${formatVacationNumber(totalDays)} Tage. Bereits eingetragene Überträge für ${year} werden dabei ersetzt.`,
        skipped
          ? `${skipped} Mitarbeiter ohne Planungseinträge in ${year - 1} bleiben unverändert.`
          : "",
        `Nicht bis zum ${formatCarryOverExpiry()}${year} geplanter Resturlaub verfällt.`,
      ]
        .filter(Boolean)
        .join(" "),
      acceptLabel: "Resturlaub übernehmen",
      tone: "primary",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            proposals.forEach((item) =>
              setVacationEntitlementValue(item.employeeId, year, "carryOverDays", item.days),
            );
          },
          { undo: `Resturlaub ${year - 1} übernommen` },
        );
        if (committed) {
          showUndoToast(
            `Resturlaub aus ${year - 1} für ${proposals.length} Mitarbeiter übernommen.`,
          );
        }
      },
    });
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
    // Eine Dienstzusage aus dem jeweils anderen festen Wochenende ist eine
    // Dienstuebernahme: Sie verringert die Ueberplanung des Tages um einen,
    // gleich welche Abwesenheit sie ausgleicht.
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
      absenceCount,
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
