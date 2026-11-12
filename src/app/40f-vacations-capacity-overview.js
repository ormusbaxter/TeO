  // Jahresuebersicht der Belegung: Fuer jeden Tag des Planungsjahres, wie viele
  // Abwesenheiten noch Platz haben (Luecke) oder wie viele zu viel geplant
  // sind (Ueberbelegung). Gerechnet wird ausschliesslich mit
  // getPlannerDayStats, also mit derselben Tagesgrenze, denselben
  // ausgenommenen Berufsgruppen und demselben Ausgleich durch Dienstzusagen
  // vom anderen Wochenende wie in der Monatsplanung - die Uebersicht kann
  // deshalb nie etwas anderes sagen als die Kopfzeile des Monats.
  //
  // Vergangene Tage stehen grau in der Tabelle, zaehlen aber nicht zu den
  // freien Plaetzen: Dort laesst sich nichts mehr planen. Ueberbelegungen
  // zaehlen dagegen das ganze Jahr, denn sie sind auch rueckblickend ein
  // Befund.
  function collectVacationCapacityYear(year, today = todayIso()) {
    const holidays = getNrwHolidays(year);
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (__, dayIndex) => {
        const date = [
          year,
          String(month).padStart(2, "0"),
          String(dayIndex + 1).padStart(2, "0"),
        ].join("-");
        const stats = getPlannerDayStats(date, holidays);
        const balance = stats.limit - stats.effectiveAbsenceCount;
        return {
          date,
          stats,
          free: Math.max(0, balance),
          over: Math.max(0, -balance),
          isPast: date < today,
          status: balance < 0 ? "over" : balance === 0 ? "full" : "free",
        };
      });
      const upcoming = days.filter((day) => !day.isPast);
      return {
        month,
        days,
        freeSlots: upcoming.reduce((sum, day) => sum + day.free, 0),
        overDays: days.filter((day) => day.status === "over").length,
        overSlots: days.reduce((sum, day) => sum + day.over, 0),
        fullDays: upcoming.filter((day) => day.status === "full").length,
      };
    });
    const allDays = months.flatMap((month) => month.days);
    return {
      year,
      months,
      freeSlots: months.reduce((sum, month) => sum + month.freeSlots, 0),
      overDays: months.reduce((sum, month) => sum + month.overDays, 0),
      overSlots: months.reduce((sum, month) => sum + month.overSlots, 0),
      fullDays: months.reduce((sum, month) => sum + month.fullDays, 0),
      openDays: allDays.filter((day) => !day.isPast && day.status === "free")
        .length,
    };
  }

  function openVacationCapacityOverview() {
    const overview = collectVacationCapacityYear(vacationYear);
    elements.vacationCapacityTitle.textContent =
      `Belegung im Jahr ${vacationYear}`;
    elements.vacationCapacitySubtitle.textContent = overview.overDays
      ? `${overview.overDays} überplante${overview.overDays === 1 ? "r" : ""} Tag${overview.overDays === 1 ? "" : "e"} · ${overview.freeSlots} freie Plätze`
      : `Keine Überplanung · ${overview.freeSlots} freie Plätze`;
    elements.vacationCapacityContent.innerHTML = `
      ${renderVacationCapacitySummary(overview)}
      <div class="vacation-capacity-legend" aria-label="Legende der Belegung">
        <span><i class="vacation-capacity-swatch is-free-many">5</i> Lücke, mindestens die Hälfte frei</span>
        <span><i class="vacation-capacity-swatch is-free-some">2</i> Noch frei</span>
        <span><i class="vacation-capacity-swatch is-free-one">1</i> Letzter freier Platz</span>
        <span><i class="vacation-capacity-swatch is-full">0</i> Grenze erreicht</span>
        <span><i class="vacation-capacity-swatch is-over">+1</i> Überbelegt, Zahl = zu viel</span>
        <span><i class="vacation-capacity-swatch is-past"></i> Vergangen</span>
      </div>
      <p class="vacation-capacity-note">
        Die Zahl im Tag nennt die freien Plätze bis zur Tagesgrenze, bei
        Überbelegung die Abwesenheiten zu viel. Grundlage sind die Tagesgrenzen der Monatsplanung
        (${state.settings.vacationWeekdayAbsenceLimit} werktags,
        ${state.settings.vacationWeekendAbsenceLimit} an Wochenenden und Feiertagen),
        einschließlich des Ausgleichs durch Dienstzusagen vom anderen
        Wochenende. Abwesenheiten von
        ${escapeHtml(absenceLimitExemptProfessionNote())} zählen nicht mit.
        Freie Plätze werden ab heute gezählt. Ein Klick auf einen Tag öffnet
        den Monat in der Planung.
      </p>
      ${renderVacationCapacityMatrix(overview)}
    `;
    elements.vacationCapacityDialog.showModal();
  }

  function renderVacationCapacitySummary(overview) {
    const items = [
      {
        className: overview.overDays ? "is-over" : "is-ok",
        value: overview.overDays,
        label: overview.overDays === 1 ? "Tag überplant" : "Tage überplant",
        detail: overview.overSlots
          ? `${overview.overSlots} Abwesenheit${overview.overSlots === 1 ? "" : "en"} zu viel`
          : "alle Tage innerhalb der Grenze",
      },
      {
        className: "is-full",
        value: overview.fullDays,
        label: overview.fullDays === 1 ? "Tag ausgebucht" : "Tage ausgebucht",
        detail: "ab heute, Grenze genau erreicht",
      },
      {
        className: "is-free",
        value: overview.freeSlots,
        label: overview.freeSlots === 1 ? "freier Platz" : "freie Plätze",
        detail: `an ${overview.openDays} Tag${overview.openDays === 1 ? "" : "en"} ab heute`,
      },
    ];
    return `
      <div class="vacation-capacity-summary">
        ${items
          .map(
            (item) => `
              <div class="vacation-capacity-kpi ${item.className}">
                <strong>${item.value}</strong>
                <span>${escapeHtml(item.label)}</span>
                <small>${escapeHtml(item.detail)}</small>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderVacationCapacityMatrix(overview) {
    const dayNumbers = Array.from({ length: 31 }, (_, index) => index + 1);
    const schoolVacations = getNrwSchoolVacations(overview.year);
    const holidays = getNrwHolidays(overview.year);
    return `
      <div class="vacation-year-matrix-scroll">
        <table class="vacation-year-matrix vacation-capacity-matrix">
          <thead>
            <tr>
              <th class="vacation-year-month-column" scope="col">Monat</th>
              ${dayNumbers.map((day) => `<th scope="col">${day}</th>`).join("")}
              <th class="vacation-year-total-column" scope="col" title="Freie Plätze ab heute">Frei</th>
              <th class="vacation-year-total-column" scope="col" title="Tage über der Tagesgrenze">Über</th>
            </tr>
          </thead>
          <tbody>
            ${overview.months
              .map((month) => {
                const monthLabel = dateFormat({ month: "long" }).format(
                  new Date(overview.year, month.month - 1, 1, 12),
                );
                return `
                  <tr>
                    <th class="vacation-year-month-column" scope="row">${escapeHtml(monthLabel)}</th>
                    ${dayNumbers
                      .map((dayNumber) => {
                        const day = month.days[dayNumber - 1];
                        return day
                          ? renderVacationCapacityCell(day, holidays, schoolVacations)
                          : '<td class="is-unavailable" aria-label="Dieser Kalendertag existiert nicht"></td>';
                      })
                      .join("")}
                    <td class="vacation-year-total-column vacation-capacity-total">${month.freeSlots}</td>
                    <td class="vacation-year-total-column vacation-capacity-total ${
                      month.overDays ? "is-over" : ""
                    }">${month.overDays || ""}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function vacationCapacityCellClass(day) {
    if (day.status === "over") return "is-over";
    if (day.status === "full") return "is-full";
    if (day.free === 1) return "is-free-one";
    // Mindestens die Haelfte der Tagesgrenze frei: eine echte Luecke, in die
    // sich noch mehrere Urlaube legen lassen. Sie soll ins Auge springen.
    return day.free * 2 >= day.stats.limit ? "is-free-many" : "is-free-some";
  }

  function renderVacationCapacityCell(day, holidays, schoolVacations) {
    const { stats } = day;
    const metadata = getVacationDayMetadata(day.date, holidays, schoolVacations);
    const weekday = dateFormat({ weekday: "long" }).format(parseLocalDate(day.date));
    const balanceText =
      day.status === "over"
        ? `${day.over} zu viel`
        : day.status === "full"
          ? "Grenze erreicht"
          : `${day.free} frei`;
    const details = [
      `${weekday}, ${formatDate(day.date)}`,
      `${stats.effectiveAbsenceCount} von maximal ${stats.limit} abwesend`,
      balanceText,
      stats.compensatedAbsenceCount
        ? `${stats.compensatedAbsenceCount} durch fremde Dienstzusage ausgeglichen`
        : "",
      metadata.holiday,
      metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
    ].filter(Boolean);
    const value =
      day.status === "over" ? `+${day.over}` : String(day.free);
    return `
      <td class="vacation-capacity-cell ${metadata.className} ${
        day.isPast ? "is-past" : ""
      }">
        <button
          class="vacation-capacity-value ${vacationCapacityCellClass(day)}"
          type="button"
          data-vacation-capacity-date="${day.date}"
          title="${escapeHtml(details.join(" · "))}"
          aria-label="${escapeHtml(details.join(", "))}"
        >${value}</button>
      </td>
    `;
  }

  function openVacationMonthFromCapacityOverview(date) {
    vacationYear = Number(date.slice(0, 4));
    vacationMonth = Number(date.slice(5, 7));
    saveVacationViewPreference();
    elements.vacationCapacityDialog.close();
    renderVacationPlanner();
  }
