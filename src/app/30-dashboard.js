  function renderDashboard() {
    renderDashboardGreeting();
    renderDashboardTrainingProgress();
    renderRecentEmployees();
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

    // Alle aktiven Pflichten: trainingObligations fasst Fortbildungsreihen auf
    // ihren aktuellen Jahrgang zusammen, sodass vergangene Jahrgaenge derselben
    // Reihe nicht mehrfach erscheinen.
    const sortedTrainings = trainingObligations()
      .map((training) => ({ training, stats: getTrainingStats(training) }))
      .sort(
        (a, b) =>
          a.stats.percent - b.stats.percent ||
          a.training.title.localeCompare(b.training.title, "de"),
      );

    elements.dashboardTrainingProgress.innerHTML = `
      <div class="progress-list">
        ${sortedTrainings
          .map(({ training, stats }) => {
            const color =
              stats.percent >= 100
                ? "var(--teal-700)"
                : stats.percent >= 60
                  ? "var(--blue-600)"
                  : "var(--orange-700)";
            return `
              <div class="progress-item">
                <div class="progress-name">
                  <strong title="${escapeHtml(training.title)} · ${training.year}">${escapeHtml(
                    training.title,
                  )}</strong>
                  <small>${training.year} · ${recurrenceLabel(training)}</small>
                </div>
                <div
                  class="progress-track"
                  role="progressbar"
                  aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="${stats.percent}"
                >
                  <div
                    class="progress-bar"
                    ${dynamicStyle({ "--progress": `${stats.percent}%`, "--progress-color": color })}
                  ></div>
                </div>
                <span class="progress-value">${stats.percent}&thinsp;%</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderDeadlineOverview() {
    const horizon = Number(elements.deadlineHorizon.value) || 90;
    const activeKinds = new Set(state.settings.deadlineKinds);
    elements.deadlineFilters.forEach((filter) => {
      filter.checked = activeKinds.has(filter.value);
    });
    const hideOverdue = Boolean(state.settings.deadlineHideOverdue);
    elements.deadlineHideOverdue.checked = hideOverdue;
    const deadlines = filterDeadlineItems(
      getDeadlineItems(),
      activeKinds,
      horizon,
      hideOverdue,
    );
    const overdue = deadlines.filter((item) => item.daysUntil < 0);
    const upcoming = deadlines.filter((item) => item.daysUntil >= 0);

    if (deadlines.length === 0) {
      const selectedLabels = DEADLINE_KINDS.filter((kind) =>
        activeKinds.has(kind),
      ).map((kind) => DEADLINE_KIND_LABELS[kind]);
      elements.deadlineOverview.innerHTML = renderEmptyState({
        title: activeKinds.size
          ? `Keine passenden Fristen innerhalb von ${horizon} Tagen`
          : "Keine Kategorien ausgewählt",
        text: activeKinds.size
          ? `Für die Auswahl ${formatList(selectedLabels)} sind innerhalb dieses Zeitraums keine ${
              hideOverdue ? "anstehenden " : ""
            }Einträge vorhanden.`
          : "Wählen Sie mindestens eine Kategorie aus, die im Fristenmonitor angezeigt werden soll.",
        compact: true,
      });
      return;
    }

    // Angepinnte Termine werden nie durch die allgemeine 25-Zeilen-Grenze
    // abgeschnitten. Freie Plaetze werden danach mit regulaeren Fristen gefuellt.
    const pinnedDeadlines = deadlines.filter((item) => item.appointment?.pinned);
    const displayedDeadlines = [
      ...pinnedDeadlines,
      ...deadlines
        .filter((item) => !item.appointment?.pinned)
        .slice(0, Math.max(0, 25 - pinnedDeadlines.length)),
    ];

    elements.deadlineOverview.innerHTML = `
      <div class="deadline-summary">
        <span class="summary-chip summary-orange">
          <strong>${overdue.length}</strong>
          <small>überfällig</small>
        </span>
        <span class="summary-chip">
          <strong>${upcoming.length}</strong>
          <small>demnächst fällig</small>
        </span>
        ${DEADLINE_KINDS.filter((kind) => activeKinds.has(kind))
          .map(
            (kind) => `
              <span class="summary-chip ${kind === "birthday" ? "summary-teal" : ""}">
                <strong>${deadlines.filter((item) => deadlineFilterKind(item) === kind).length}</strong>
                <small>${DEADLINE_KIND_LABELS[kind]}</small>
              </span>
            `,
          )
          .join("")}
      </div>
      <div class="deadline-list">
        ${displayedDeadlines
          .map(
            (item) => `
              <button
                class="deadline-row ${item.appointment?.pinned ? "is-pinned" : ""} ${item.daysUntil < 0 ? "is-overdue" : ""}"
                type="button"
                ${
                  item.kind === "appointment"
                    ? `data-deadline-appointment="${item.appointment.id}"`
                    : `data-deadline-employee="${item.employeeId}"`
                }
              >
                <span>${
                  item.kind === "appointment"
                    ? `<span class="deadline-calendar-icon" ${
                        appointmentCategoryLabel(item.appointment)
                          ? `title="${escapeHtml(appointmentCategoryLabel(item.appointment))}"`
                          : ""
                      }><svg><use href="#icon-${appointmentCategoryIcon(
                        item.appointment,
                      )}"></use></svg></span>`
                    : renderAvatar(item.employee, true)
                }</span>
                <span>
                  <strong>${item.appointment?.pinned ? `<span class="deadline-pin-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>` : ""}${escapeHtml(
                    item.kind === "birthday"
                      ? `${fullName(item.employee)} - ${item.title}`
                      : item.title,
                  )}</strong>
                  <small>${escapeHtml(
                    item.kind === "birthday"
                      ? `Geburtsdatum: ${formatDate(item.employee.birthDate)}`
                      : item.kind === "appointment"
                        ? [
                            item.type,
                            formatAppointmentTime(item.appointment),
                            item.appointment.location,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : `${fullName(item.employee)} · ${item.type}`,
                  )}</small>
                  ${
                    item.kind === "appointment" && item.appointment.description
                      ? `<small
                          class="deadline-description"
                          title="${escapeHtml(item.appointment.description)}"
                        >${escapeHtml(item.appointment.description)}</small>`
                      : ""
                  }
                </span>
                <span>
                  <strong>${formatDate(item.dueDate)}</strong>
                  <small>${deadlineRelativeLabel(item.daysUntil)}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
      ${
        deadlines.length > displayedDeadlines.length
          ? `<p class="field-hint">${deadlines.length - displayedDeadlines.length} weitere Einträge werden in den jeweiligen Übersichten angezeigt.</p>`
          : ""
      }
    `;
    limitDeadlineListHeight();
    elements.deadlineOverview
      .querySelectorAll("[data-deadline-employee]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          openEmployeeDossier(button.dataset.deadlineEmployee),
        );
      });
    elements.deadlineOverview
      .querySelectorAll("[data-deadline-appointment]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          openAppointmentDialog(button.dataset.deadlineAppointment),
        );
      });
  }

  // Die sichtbare Hoehe wird an der ersten ueberzaehligen Zeile gemessen statt
  // aus einer angenommenen Zeilenhoehe gerechnet - Titel koennen umbrechen,
  // und Termine bringen andere Zeilenhoehen mit als Geburtstage.
  function limitDeadlineListHeight() {
    const list = elements.deadlineOverview.querySelector(".deadline-list");
    if (!list) return;
    list.style.maxHeight = "";
    list.scrollTop = 0;

    // Waehrend das Dashboard ausgeblendet ist, liefern alle Masse 0. Die
    // Begrenzung wird dann uebersprungen und von showView nachgeholt, sobald
    // die Ansicht wieder sichtbar ist.
    if (!list.offsetParent) {
      list.classList.remove("is-scrollable");
      return;
    }

    const rows = [...list.querySelectorAll(".deadline-row")];
    if (rows.length <= VISIBLE_DEADLINE_ROWS) {
      list.classList.remove("is-scrollable");
      return;
    }
    const oberkante = list.getBoundingClientRect().top;
    const grenze = rows[VISIBLE_DEADLINE_ROWS].getBoundingClientRect().top;
    list.style.maxHeight = `${Math.round(grenze - oberkante)}px`;
    list.classList.add("is-scrollable");
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
