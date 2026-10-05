  // Zeitraum der Liste „Als Nächstes“. Bewusst kein gespeicherter Filter: Er
  // schränkt keinen Bestand ein, sondern nur den Blick nach vorn.
  let dashboardHorizon = 30;

  function renderDashboard() {
    renderDashboardGreeting();
    renderDashboardSummary();
    renderDashboardAbsences();
    renderDashboardTrainingProgress();
  }

  // Die Kennzahlen zählen immer den ganzen Bestand. Die Filter der Liste
  // „Als Nächstes“ ändern nur, was dort steht - sonst sähe eine abgewählte
  // Kategorie aus, als sei sie erledigt.
  function dashboardFigures(today = todayIso()) {
    const deadlines = getDeadlineItems();
    const upcoming = deadlines.filter((item) => item.daysUntil >= 0);
    const overdueTrainings = deadlines.filter(
      (item) => item.kind === "training" && item.daysUntil < 0,
    );
    const week = dashboardWeekDates(today);
    const absentThisWeek = new Set(
      week.flatMap((date) => dashboardAbsencesOn(date).map((employee) => employee.id)),
    );
    const birthdays = upcoming.filter(
      (item) => item.kind === "birthday" && item.daysUntil <= 30,
    );
    return {
      overdueTrainings: overdueTrainings.length,
      overdueTrainingCount: new Set(overdueTrainings.map((item) => item.trainingId)).size,
      dueWeek: upcoming.filter((item) => item.daysUntil <= 7).length,
      dueMonth: upcoming.filter((item) => item.daysUntil <= 30).length,
      absentToday: dashboardAbsencesOn(today),
      absentThisWeek: absentThisWeek.size,
      employed: employedActiveEmployees(today).length,
      birthdays,
    };
  }

  function renderDashboardSummary(now = new Date()) {
    const figures = dashboardFigures();
    if (elements.dashboardDate) {
      elements.dashboardDate.textContent = now.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (elements.dashboardSummary) {
      elements.dashboardSummary.innerHTML = dashboardSummaryText(figures);
    }
    if (!elements.dashboardKpis) return;
    const nextBirthday = figures.birthdays[0];
    const present = Math.max(0, figures.employed - figures.absentToday.length);
    elements.dashboardKpis.innerHTML = [
      dashboardKpi({
        key: "overdue",
        tone: figures.overdueTrainings ? "critical" : "good",
        icon: figures.overdueTrainings ? "icon-alert" : "icon-check",
        value: figures.overdueTrainings,
        label: figures.overdueTrainings === 1 ? "Nachweis überfällig" : "Nachweise überfällig",
        hint: figures.overdueTrainings
          ? `in ${figures.overdueTrainingCount} Pflichtfortbildung${figures.overdueTrainingCount === 1 ? "" : "en"}`
          : "Alle Pflichtfortbildungen auf Stand",
      }),
      dashboardKpi({
        key: "week",
        tone: "warning",
        icon: "icon-calendar",
        value: figures.dueWeek,
        label: "Fristen in 7 Tagen",
        hint: `${figures.dueMonth} in 30 Tagen`,
      }),
      dashboardKpi({
        key: "absence",
        tone: "calm",
        icon: "icon-vacation",
        value: figures.absentToday.length,
        label: "heute abwesend",
        hint: `${present} von ${figures.employed} im Dienst`,
      }),
      dashboardKpi({
        key: "birthdays",
        tone: "info",
        icon: "icon-star",
        value: figures.birthdays.length,
        label: figures.birthdays.length === 1 ? "Geburtstag" : "Geburtstage",
        hint: nextBirthday
          ? `${nextBirthday.employee.firstName} ${nextBirthday.employee.lastName.charAt(0)}. am ${formatDate(nextBirthday.dueDate).slice(0, 6)}`
          : "in den nächsten 30 Tagen",
      }),
    ].join("");
  }

  function dashboardKpi({ key, tone, icon, value, label, hint }) {
    return `
      <button class="dashboard-kpi is-${tone}" type="button" data-dashboard-kpi="${key}">
        <span class="dashboard-kpi-icon"><svg><use href="#${icon}"></use></svg></span>
        <span class="dashboard-kpi-body">
          <strong>${value}</strong>
          <span>${escapeHtml(label)}</span>
          <small>${escapeHtml(hint)}</small>
        </span>
      </button>
    `;
  }

  function dashboardSummaryText(figures) {
    const due =
      figures.dueWeek === 0
        ? "In den nächsten 7 Tagen steht keine Frist an"
        : `In den nächsten 7 Tagen ${
            figures.dueWeek === 1 ? "steht <strong>eine Frist</strong>" : `stehen <strong>${figures.dueWeek} Fristen</strong>`
          } an`;
    const absent =
      figures.absentThisWeek === 0
        ? "diese Woche ist niemand abwesend"
        : `diese Woche ${
            figures.absentThisWeek === 1
              ? "ist <strong>eine Person</strong>"
              : `sind <strong>${figures.absentThisWeek} Personen</strong>`
          } abwesend`;
    const trainings = figures.overdueTrainings
      ? `Bei den Pflichtfortbildungen ${
          figures.overdueTrainings === 1 ? "fehlt noch <strong>ein Nachweis</strong>" : `fehlen noch <strong>${figures.overdueTrainings} Nachweise</strong>`
        }.`
      : "Alle Pflichtfortbildungen sind auf Stand.";
    return `${due}, ${absent}. ${trainings}`;
  }

  // Montag bis Freitag der laufenden Woche; am Wochenende die kommende.
  function dashboardWeekDates(today = todayIso()) {
    const weekday = parseLocalDate(today).getDay();
    const monday =
      weekday === 0 ? addDays(today, 1) : weekday === 6 ? addDays(today, 2) : addDays(today, 1 - weekday);
    return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
  }

  function dashboardAbsencesOn(date) {
    const seen = new Set();
    return vacationDaysOn(date)
      .filter((entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence)
      .map((entry) => getEmployee(entry.employeeId))
      .filter((employee) => {
        if (!employee?.active || seen.has(employee.id)) return false;
        seen.add(employee.id);
        return true;
      })
      .sort(sortEmployees);
  }

  function renderDashboardAbsences(today = todayIso()) {
    if (!elements.dashboardAbsence) return;
    const days = dashboardWeekDates(today).map((date) => {
      const parsed = parseLocalDate(date);
      return {
        date,
        label: `${parsed.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "")} ${parsed.getDate()}.`,
        employees: dashboardAbsencesOn(date),
        stats: getPlannerDayStats(date),
      };
    });
    const absentToday = dashboardAbsencesOn(today);
    elements.dashboardAbsence.innerHTML = `
      <div class="dashboard-week">
        ${days
          .map(({ date, label, employees, stats }) => {
            const limitClass = stats.isOverLimit ? "is-over-limit" : stats.isAtLimit ? "is-at-limit" : "";
            const names = employees.map(fullName).join(", ");
            return `
              <button
                class="dashboard-week-day ${date === today ? "is-today" : ""} ${limitClass}"
                type="button"
                data-dashboard-absence-day="${date}"
                title="${escapeHtml(names || "Niemand abwesend")}"
              >
                <span class="dashboard-week-label">${escapeHtml(label)}</span>
                ${renderDashboardFaces(employees, 4, "is-column")}
                <small>${employees.length ? `${employees.length} weg` : "alle da"}</small>
              </button>
            `;
          })
          .join("")}
      </div>
      <p class="dashboard-absence-note">${
        absentToday.length
          ? `Heute abwesend: ${escapeHtml(absentToday.map(fullName).join(" · "))}`
          : dashboardWeekDates(today).includes(today)
            ? "Heute sind alle im Dienst."
            : "Die Übersicht zeigt die kommende Woche."
      }</p>
    `;
  }

  // Kürzel der Betroffenen, überlappend. Die Farbe folgt dem Mitarbeiter,
  // nicht der Position - dieselbe Person sieht überall gleich aus.
  function renderDashboardFaces(employees, limit = 4, modifier = "") {
    if (!employees.length) return "";
    const shown = employees.slice(0, limit);
    const rest = employees.length - shown.length;
    return `<span class="dashboard-faces ${modifier}">${shown
      .map(
        (employee) =>
          `<i class="dashboard-face tone-${dashboardFaceTone(employee.id)}" title="${escapeHtml(
            fullName(employee),
          )}">${escapeHtml(initials(employee))}</i>`,
      )
      .join("")}${rest > 0 ? `<i class="dashboard-face is-more">+${rest}</i>` : ""}</span>`;
  }

  function dashboardFaceTone(id) {
    let hash = 0;
    for (const character of String(id)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return (hash % 6) + 1;
  }

  function renderDashboardTrainingProgress() {
    if (state.trainings.length === 0) {
      elements.dashboardTrainingProgress.innerHTML = renderEmptyState({
        title: "Noch keine Pflichtfortbildungen",
        text: "Legen Sie die erste Pflichtfortbildung an, um den Teamfortschritt zu verfolgen.",
        buttonText: "Fortbildung anlegen",
        buttonAttribute: "data-open-training",
        compact: true,
      });
      elements.dashboardTrainingProgress
        .querySelector("[data-open-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    // Wer überfällig ist, steht als Kürzel an seiner Fortbildung statt als
    // eigene Zeile - bei 60 Mitarbeitern und sieben Pflichten wären das sonst
    // über hundert gleich aussehende Einträge.
    const overdueByTraining = new Map();
    getDeadlineItems()
      .filter((item) => item.kind === "training" && item.daysUntil < 0)
      .forEach((item) => {
        if (!overdueByTraining.has(item.trainingId)) overdueByTraining.set(item.trainingId, []);
        overdueByTraining.get(item.trainingId).push(item.employee);
      });

    // Alle aktiven Pflichten: trainingObligations fasst Fortbildungsreihen auf
    // ihren aktuellen Jahrgang zusammen, sodass vergangene Jahrgaenge derselben
    // Reihe nicht mehrfach erscheinen.
    const sortedTrainings = trainingObligations()
      .map((training) => ({
        training,
        stats: getTrainingStats(training),
        overdue: overdueByTraining.get(training.id) || [],
      }))
      .sort(
        (a, b) =>
          b.overdue.length - a.overdue.length ||
          a.stats.percent - b.stats.percent ||
          a.training.title.localeCompare(b.training.title, "de"),
      );

    elements.dashboardTrainingProgress.innerHTML = `
      <div class="dashboard-training-list">
        ${sortedTrainings
          .map(({ training, stats, overdue }) => {
            const pill = overdue.length
              ? `<span class="dashboard-pill is-critical">${overdue.length} überfällig</span>`
              : stats.open
                ? `<span class="dashboard-pill">${stats.open} offen</span>`
                : `<span class="dashboard-pill is-good">erledigt</span>`;
            return `
              <button class="dashboard-training-row" type="button" data-dashboard-training="${training.id}" title="Abschluss für ${escapeHtml(training.title)} eintragen">
                <span class="dashboard-training-name">
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>${training.year} · ${recurrenceLabel(training)}</small>
                </span>
                ${renderDashboardFaces(overdue, 4, "is-small") || '<span class="dashboard-faces"></span>'}
                <span
                  class="progress-track"
                  role="progressbar"
                  aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="${stats.percent}"
                >
                  <span class="progress-bar" ${dynamicStyle({ "--progress": `${stats.percent}%` })}></span>
                </span>
                <span class="progress-value">${stats.percent}&thinsp;%</span>
                ${pill}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderDeadlineOverview() {
    const horizon = dashboardHorizon;
    document.querySelectorAll("[data-deadline-horizon]").forEach((button) => {
      const active = Number(button.dataset.deadlineHorizon) === horizon;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const activeKinds = new Set(state.settings.deadlineKinds);
    elements.deadlineFilters.forEach((filter) => {
      filter.checked = activeKinds.has(filter.value);
    });
    const hideOverdue = Boolean(state.settings.deadlineHideOverdue);
    elements.deadlineHideOverdue.checked = hideOverdue;
    // Überfällige Pflichtfortbildungen stehen gebündelt unter „Offene
    // Nachweise“; hier bleiben nur die übrigen überfälligen Fristen.
    const deadlines = filterDeadlineItems(
      getDeadlineItems(),
      activeKinds,
      horizon,
      hideOverdue,
    ).filter((item) => !(item.kind === "training" && item.daysUntil < 0));
    const qualityIssues = hideOverdue
      ? []
      : getDataQualityIssues().filter((issue) => issue.severity === "high");

    if (deadlines.length === 0 && qualityIssues.length === 0) {
      const selectedLabels = DEADLINE_KINDS.filter((kind) =>
        activeKinds.has(kind),
      ).map((kind) => DEADLINE_KIND_LABELS[kind]);
      elements.deadlineOverview.innerHTML = renderEmptyState({
        title: activeKinds.size
          ? `Keine Fristen in den nächsten ${horizon} Tagen`
          : "Keine Kategorien ausgewählt",
        text: activeKinds.size
          ? `Für ${formatList(selectedLabels)} steht in diesem Zeitraum nichts an.`
          : "Wählen Sie mindestens eine Kategorie aus, die hier angezeigt werden soll.",
        compact: true,
      });
      return;
    }

    // Angepinnte Termine werden nie durch die allgemeine 25-Zeilen-Grenze
    // abgeschnitten. Freie Plaetze werden danach mit regulaeren Fristen gefuellt.
    const pinnedDeadlines = deadlines.filter((item) => item.appointment?.pinned);
    const regular = deadlines.filter((item) => !item.appointment?.pinned);
    const displayed = regular.slice(
      0,
      Math.max(0, DASHBOARD_TIMELINE_ROWS - pinnedDeadlines.length - qualityIssues.length),
    );
    const overdue = displayed.filter((item) => item.daysUntil < 0);
    const soon = displayed.filter((item) => item.daysUntil >= 0 && item.daysUntil <= 7);
    const later = displayed.filter((item) => item.daysUntil > 7);
    const days = [...new Set(soon.map((item) => item.dueDate))];

    const group = (title, content) =>
      content ? `<div class="timeline-group"><p class="timeline-group-title">${escapeHtml(title)}</p>${content}</div>` : "";

    elements.deadlineOverview.innerHTML = `
      <div class="deadline-list">
        ${group("Angeheftet", pinnedDeadlines.map((item) => renderDeadlineRow(item)).join(""))}
        ${group(
          "Überfällig und zu prüfen",
          [
            ...qualityIssues.map(
              (issue) => `
                <button class="deadline-row is-overdue" type="button" data-deadline-quality="${issue.employeeId}">
                  <span class="timeline-tag is-quality">Datenqualität</span>
                  <strong>${escapeHtml(issue.title)}</strong>
                  <small>${escapeHtml(issue.detail)}</small>
                </button>`,
            ),
            ...overdue.map((item) => renderDeadlineRow(item)),
          ].join(""),
        )}
        ${group(
          "Nächste 7 Tage",
          days
            .map((date) => {
              const parsed = parseLocalDate(date);
              return `
                <div class="timeline-day">
                  <span class="timeline-date">
                    <b>${String(parsed.getDate()).padStart(2, "0")}</b>
                    ${escapeHtml(parsed.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""))}
                  </span>
                  <div class="timeline-day-items">
                    ${soon.filter((item) => item.dueDate === date).map((item) => renderDeadlineRow(item)).join("")}
                  </div>
                </div>`;
            })
            .join(""),
        )}
        ${group(
          "Später",
          later.map((item) => renderDeadlineRow(item, true)).join(""),
        )}
      </div>
      ${
        regular.length > displayed.length
          ? `<p class="field-hint">${regular.length - displayed.length} weitere Einträge werden in den jeweiligen Übersichten angezeigt.</p>`
          : ""
      }
    `;
  }

  function renderDeadlineRow(item, compact = false) {
    const title =
      item.kind === "birthday" ? `${fullName(item.employee)} · ${item.title}` : item.title;
    const detail =
      item.kind === "birthday"
        ? deadlineRelativeLabel(item.daysUntil)
        : item.kind === "appointment"
          ? [formatAppointmentTime(item.appointment), item.appointment.location, deadlineRelativeLabel(item.daysUntil)]
              .filter(Boolean)
              .join(" · ")
          : `${fullName(item.employee)} · ${deadlineRelativeLabel(item.daysUntil)}`;
    const target =
      item.kind === "appointment"
        ? `data-deadline-appointment="${item.appointment.id}"`
        : `data-deadline-employee="${item.employeeId}"`;
    if (compact) {
      return `
        <button class="deadline-row is-compact" type="button" ${target}>
          <span class="timeline-compact-date">${formatDate(item.dueDate).slice(0, 6)}</span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(item.kind === "appointment" || item.kind === "birthday" ? item.type : fullName(item.employee))}</small>
        </button>`;
    }
    return `
      <button
        class="deadline-row ${item.appointment?.pinned ? "is-pinned" : ""} ${item.daysUntil < 0 ? "is-overdue" : ""}"
        type="button"
        ${target}
      >
        <span class="timeline-tag is-${item.kind}">${
          item.appointment?.pinned
            ? `<span class="important-notification-icon" aria-hidden="true"></span>Wichtig · `
            : ""
        }${escapeHtml(item.type)}</span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(item.daysUntil < 0 ? `${formatDate(item.dueDate)} · ${detail}` : detail)}</small>
        ${
          item.kind === "appointment" && item.appointment.description
            ? `<small
                class="deadline-description"
                title="${escapeHtml(item.appointment.description)}"
              >${escapeHtml(item.appointment.description)}</small>`
            : ""
        }
      </button>`;
  }

  function handleDashboardAction(event) {
    const horizon = event.target.closest("[data-deadline-horizon]");
    if (horizon) {
      dashboardHorizon = Number(horizon.dataset.deadlineHorizon) || 30;
      renderDeadlineOverview();
      return;
    }
    const kpi = event.target.closest("[data-dashboard-kpi]");
    if (kpi) {
      const key = kpi.dataset.dashboardKpi;
      if (key === "absence") {
        showView("vacations");
        return;
      }
      if (key === "overdue") {
        document.querySelector("#dashboardTrainingPanel")?.scrollIntoView({ block: "start" });
        return;
      }
      dashboardHorizon = key === "week" ? 7 : 30;
      renderDeadlineOverview();
      document.querySelector("#dashboardUpcomingPanel")?.scrollIntoView({ block: "start" });
      return;
    }
    const employee = event.target.closest("[data-deadline-employee]");
    if (employee) {
      openEmployeeDossier(employee.dataset.deadlineEmployee);
      return;
    }
    const appointment = event.target.closest("[data-deadline-appointment]");
    if (appointment) {
      openAppointmentDialog(appointment.dataset.deadlineAppointment);
      return;
    }
    const quality = event.target.closest("[data-deadline-quality]");
    if (quality) {
      openEmployeeDialog(quality.dataset.deadlineQuality);
      return;
    }
    if (event.target.closest("[data-dashboard-absence-day]")) {
      showView("vacations");
      return;
    }
    const training = event.target.closest("[data-dashboard-training]");
    if (training) openCompletionDialog(training.dataset.dashboardTraining);
  }

  async function updateDeadlineFilters() {
    const selectedKinds = elements.deadlineFilters
      .filter((filter) => filter.checked)
      .map((filter) => filter.value)
      .filter((kind) => DEADLINE_KINDS.includes(kind));
    if (
      JSON.stringify(selectedKinds) ===
      JSON.stringify(state.settings.deadlineKinds)
    ) {
      renderDeadlineOverview();
      return;
    }
    await commitStateMutation(() => {
      state.settings.deadlineKinds = selectedKinds;
    });
  }

  async function updateDeadlineOverdueFilter() {
    const hideOverdue = elements.deadlineHideOverdue.checked;
    if (hideOverdue === Boolean(state.settings.deadlineHideOverdue)) {
      renderDeadlineOverview();
      return;
    }
    await commitStateMutation(() => {
      state.settings.deadlineHideOverdue = hideOverdue;
    });
  }

  function filterDeadlineItems(items, activeKinds, horizon, hideOverdue = false) {
    return items
      .filter(
        (item) =>
          (!hideOverdue || item.daysUntil >= 0) &&
          (item.appointment?.pinned ||
            (activeKinds.has(deadlineFilterKind(item)) &&
              item.daysUntil <= horizon)),
      )
      .sort(
        (a, b) =>
          Number(Boolean(b.appointment?.pinned)) -
          Number(Boolean(a.appointment?.pinned)),
      );
  }

  function deadlineFilterKind(item) {
    if (
      item?.kind === "appointment" &&
      ["schulung", "geraeteeinweisung"].includes(item.appointment?.category)
    ) {
      return "training";
    }
    return item?.kind || "";
  }

  function getDeadlineItems() {
    const today = parseLocalDate(todayIso());
    const items = [];
    employedActiveEmployees().forEach((employee) => {
      const birthday = getNextBirthday(employee.birthDate, today);
      if (birthday) {
        items.push({
          employeeId: employee.id,
          employee,
          title: `${birthday.age}. Geburtstag`,
          type: "Geburtstag",
          kind: "birthday",
          dueDate: birthday.date,
          daysUntil: daysBetween(today, parseLocalDate(birthday.date)),
        });
      }
      trainingObligations().forEach((training) => {
        const latest = latestCompletion(employee.id, training.id);
        let dueDate = "";
        if (latest && training.recurrenceMonths) {
          dueDate = addMonths(latest.completedOn, training.recurrenceMonths);
        } else if (!latest) {
          dueDate = `${training.year}-12-31`;
        }
        if (dueDate) {
          items.push({
            employeeId: employee.id,
            employee,
            trainingId: training.id,
            title: training.title,
            type: "Pflichtfortbildung",
            kind: "training",
            dueDate,
            daysUntil: daysBetween(today, parseLocalDate(dueDate)),
          });
        }
      });
      Object.entries(employee.qualificationExpiries || {}).forEach(([id, dueDate]) => {
        if (!employee.qualifications[id] || !parseLocalDate(dueDate)) return;
        items.push({
          employeeId: employee.id,
          employee,
          title: qualificationLabel(id),
          type: "Zusatzqualifikation",
          kind: "qualification",
          dueDate,
          daysUntil: daysBetween(today, parseLocalDate(dueDate)),
        });
      });
    });
    // Personalfristen auch für künftig Eintretende - gerade deren Probezeit
    // will im Blick sein. Vergangenes bleibt draußen: Ein abgelaufenes
    // Probezeitende ist erledigt, keine überfällige Aufgabe.
    activeEmployeeList().forEach((employee) => {
      employmentDeadlines(employee).forEach((deadline) => {
        const daysUntil = daysBetween(today, parseLocalDate(deadline.dueDate));
        if (daysUntil < 0) return;
        items.push({
          employeeId: employee.id,
          employee,
          type: "Personal",
          kind: "employment",
          daysUntil,
          ...deadline,
        });
      });
    });
    state.appointments.forEach((appointment) => {
      const daysUntil = daysBetween(today, parseLocalDate(appointment.date));
      if (daysUntil < 0 && !appointment.pinned) return;
      items.push({
        employeeId: "",
        employee: null,
        appointment,
        title: appointment.title,
        type: appointmentCategoryLabel(appointment) || "Termin",
        kind: "appointment",
        dueDate: appointment.date,
        daysUntil,
      });
    });
    return items.sort(
      (a, b) =>
        Number(Boolean(b.appointment?.pinned)) -
          Number(Boolean(a.appointment?.pinned)) ||
        a.daysUntil - b.daysUntil ||
        (a.employee && b.employee ? sortEmployees(a.employee, b.employee) : 0) ||
        a.title.localeCompare(b.title, "de"),
    );
  }

  function employmentDeadlines(employee, today = todayIso()) {
    const deadlines = [];
    if (employee.entryDate) {
      // Die Probezeit endet mit dem Tag vor dem Monatsjahrestag.
      const probationEnd = addDays(addMonths(employee.entryDate, PROBATION_MONTHS), -1);
      deadlines.push({ title: "Ende der Probezeit", dueDate: probationEnd });
      const entryYear = Number(employee.entryDate.slice(0, 4));
      const monthDay = employee.entryDate.slice(5);
      const thisYear = Number(today.slice(0, 4));
      const candidateYear = `${thisYear}-${monthDay}` >= today ? thisYear : thisYear + 1;
      const years = candidateYear - entryYear;
      if (SERVICE_ANNIVERSARY_YEARS.includes(years)) {
        deadlines.push({
          title: `${years}-jähriges Dienstjubiläum`,
          dueDate: monthDay === "02-29" ? `${candidateYear}-02-28` : `${candidateYear}-${monthDay}`,
        });
      }
    }
    if (employee.exitDate) {
      deadlines.push({ title: "Austritt", dueDate: employee.exitDate });
    }
    (employee.employmentChanges || []).forEach((change) => {
      deadlines.push({
        title: `Stellenumfang ${change.percent} %`,
        dueDate: change.from,
      });
    });
    return deadlines;
  }

  function addDays(dateString, dayCount) {
    const date = parseLocalDate(dateString);
    date.setDate(date.getDate() + dayCount);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function getNextBirthday(birthDate, referenceDate = parseLocalDate(todayIso())) {
    const birth = parseLocalDate(birthDate);
    if (!birth || !referenceDate) return null;
    const birthMonth = birth.getMonth() + 1;
    const birthDay = birth.getDate();
    let year = referenceDate.getFullYear();
    let date = birthdayDateForYear(year, birthMonth, birthDay);
    if (date < referenceDate) {
      year += 1;
      date = birthdayDateForYear(year, birthMonth, birthDay);
    }
    return {
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-"),
      age: year - birth.getFullYear(),
    };
  }

  function birthdayDateForYear(year, month, day) {
    const adjustedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
    return new Date(year, month - 1, adjustedDay, 12);
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function daysBetween(from, to) {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }

  function deadlineRelativeLabel(days) {
    if (days < 0) return `seit ${Math.abs(days)} Tag${Math.abs(days) === 1 ? "" : "en"} überfällig`;
    if (days === 0) return "heute fällig";
    return `in ${days} Tag${days === 1 ? "" : "en"}`;
  }
