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
                    style="--progress: ${stats.percent}%; --progress-color: ${color}"
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
        ${deadlines
          .slice(0, 25)
          .map(
            (item) => `
              <button
                class="deadline-row ${item.daysUntil < 0 ? "is-overdue" : ""}"
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
                  <strong>${escapeHtml(
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
        deadlines.length > 25
          ? `<p class="field-hint">${deadlines.length - 25} weitere Einträge werden in den jeweiligen Übersichten angezeigt.</p>`
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
    return items.filter(
      (item) =>
        activeKinds.has(deadlineFilterKind(item)) &&
        item.daysUntil <= horizon &&
        (!hideOverdue || item.daysUntil >= 0),
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
    activeEmployeeList().forEach((employee) => {
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
    state.appointments.forEach((appointment) => {
      const daysUntil = daysBetween(today, parseLocalDate(appointment.date));
      if (daysUntil < 0) return;
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
        a.daysUntil - b.daysUntil ||
        (a.employee && b.employee ? sortEmployees(a.employee, b.employee) : 0) ||
        a.title.localeCompare(b.title, "de"),
    );
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

  function openEmployeeDossier(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const selectedQualifications = state.catalogs.qualifications.filter(
      (qualification) => employee.qualifications[qualification.id],
    );
    const trainings = trainingObligations().sort(
      (a, b) => b.year - a.year || a.title.localeCompare(b.title, "de"),
    );
    const attendances = state.meetingAttendances.filter(
      (attendance) => attendance.employeeId === employee.id,
    );
    const participated = attendances.filter(
      (attendance) => attendance.status === "teilgenommen",
    ).length;
    const expectedMeetings = state.meetings.filter((meeting) => {
      if (!meeting.expectedEmployeeIds.includes(employee.id)) return false;
      return !attendances.some(
        (attendance) =>
          attendance.meetingId === meeting.id &&
          attendance.status === "nicht_zutreffend",
      );
    }).length;

    elements.employeeDossierTitle.textContent = fullName(employee);
    elements.employeeDossierSubtitle.textContent = `${employee.profession} · ${employeeStatusLabel(
      employee,
    )}`;
    elements.employeeDossierDialog.dataset.employeeId = employee.id;
    elements.employeeDossierContent.innerHTML = `
      <div class="dossier-summary-grid">
        ${renderDossierItem("Geburtsdatum", formatDate(employee.birthDate))}
        ${renderDossierItem("Telefon", employee.phone || "–")}
        ${renderDossierItem("E-Mail", employee.email || "–")}
        ${renderDossierItem("Benutzername", employee.username || "–")}
        ${renderDossierItem("Stellenumfang", `${employee.employmentPercent} %`)}
        ${renderDossierItem("Dienstwochenende", serviceWeekendLabel(employee.serviceWeekend))}
        ${renderDossierItem(
          "Sitzungsteilnahme",
          `${percentage(participated, expectedMeetings)} % (${participated}/${expectedMeetings})`,
        )}
      </div>
      <section class="dossier-section">
        <h3>Zusatzqualifikationen</h3>
        ${
          selectedQualifications.length
            ? `<div class="dossier-list">${selectedQualifications
                .map((qualification) => {
                  const expiry = employee.qualificationExpiries[qualification.id];
                  const expired = expiry && expiry < todayIso();
                  return `<div class="dossier-list-row">
                    <strong>${escapeHtml(qualification.label)}</strong>
                    <span class="${expired ? "text-danger" : ""}">${
                      expiry ? `gültig bis ${formatDate(expiry)}` : "ohne Ablaufdatum"
                    }</span>
                  </div>`;
                })
                .join("")}</div>`
            : '<p class="field-hint">Keine Zusatzqualifikationen zugewiesen.</p>'
        }
      </section>
      <section class="dossier-section">
        <h3>Pflichtfortbildungen</h3>
        ${
          trainings.length
            ? `<div class="dossier-list">${trainings
                .map((training) => {
                  const status = getEmployeeCompletionStatus(employee.id, training);
                  return `<div class="dossier-list-row">
                    <strong>${escapeHtml(training.title)} <small>${training.year}</small></strong>
                    <span class="status-badge ${status.kind === "current" ? "" : status.kind}">${escapeHtml(
                      status.label,
                    )}</span>
                  </div>`;
                })
                .join("")}</div>`
            : '<p class="field-hint">Keine Pflichtfortbildungen angelegt.</p>'
        }
      </section>
      <section class="dossier-section">
        <h3>Teamsitzungen</h3>
        <div class="dossier-list">
          ${state.meetings
            .filter((meeting) => meeting.expectedEmployeeIds.includes(employee.id))
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((meeting) => {
              const attendance = attendances.find(
                (item) => item.meetingId === meeting.id,
              );
              return `<div class="dossier-list-row">
                <strong>${formatDate(meeting.date)} · ${escapeHtml(meeting.title)}</strong>
                <span>${escapeHtml(
                  attendance ? ATTENDANCE_STATUSES[attendance.status]?.label : "Noch offen",
                )}</span>
              </div>`;
            })
            .join("") || '<p class="field-hint">Keine erwarteten Teamsitzungen.</p>'}
        </div>
      </section>
    `;
    elements.employeeDossierDialog.showModal();
  }

  function renderDossierItem(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function printEmployeeDossier() {
    document.body.classList.add("print-employee-dossier");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-employee-dossier"), 0);
  }

  function openWeekendOverviewDialog() {
    renderWeekendOverview();
    elements.weekendOverviewDialog.showModal();
  }

  function openWeekendSimulationDialog() {
    renderWeekendSimulation();
    elements.weekendSimulationDialog.showModal();
  }

  function renderWeekendSimulation() {
    const simulation = simulateWeekendDistribution();
    currentWeekendSimulation = simulation;
    if (simulation.employeeCount === 0) {
      elements.weekendSimulationContent.innerHTML = renderEmptyState({
        title: "Keine festen Wochenendzuordnungen",
        text: "Für die Simulation werden aktive Mitarbeiter mit einem bereits fest zugewiesenen Dienstwochenende benötigt.",
        compact: true,
      });
      return;
    }

    const metricRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];
    const changedAssignments = simulation.assignments.filter(
      (assignment) => assignment.changeType !== "unchanged",
    );
    const improvement = Math.max(
      0,
      Math.round(
        ((simulation.currentBalanceScore - simulation.proposedBalanceScore) /
          Math.max(simulation.currentBalanceScore, 0.0001)) *
          100,
      ),
    );

    elements.weekendSimulationContent.innerHTML = `
      <div class="weekend-simulation-summary">
        <article>
          <span>Bestehende Wechsel</span>
          <strong>${simulation.switchedCount}</strong>
          <small>von ${simulation.fixedAssignmentCount} festen Zuordnungen</small>
        </article>
        <article>
          <span>Nicht zugeordnet</span>
          <strong>${simulation.unassignedCount}</strong>
          <small>bleiben ohne festes Wochenende</small>
        </article>
        <article>
          <span>Struktureller Ausgleich</span>
          <strong>${improvement} %</strong>
          <small>Verbesserung der gewichteten Abweichung</small>
        </article>
      </div>

      <section class="panel weekend-simulation-comparison">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ist und Simulation</p>
            <h3>Kennzahlenvergleich</h3>
          </div>
          <span class="weekend-comparison-note">
            VZÄ, Kopfzahl, Einarbeitung und Schlüsselqualifikationen werden gemeinsam gewichtet.
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th rowspan="2">Kennzahl</th>
                <th colspan="2">Aktuell</th>
                <th colspan="2">Simulation</th>
              </tr>
              <tr>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
              </tr>
            </thead>
            <tbody>
              ${metricRows
                .map(
                  ([label, key, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      <td><strong>${formatter(simulation.current.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.current.weekend_b[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_b[key])}</strong></td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-simulation-groups">
        ${SERVICE_WEEKEND_KEYS
          .map((weekend) => {
            const assignments = simulation.assignments.filter(
              (assignment) => assignment.proposedWeekend === weekend,
            );
            return `
              <section class="panel weekend-simulation-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Simulierte Zuordnung</p>
                    <h2>${escapeHtml(serviceWeekendLabel(weekend))}</h2>
                  </div>
                  <strong>${assignments.length} Personen</strong>
                </div>
                <div class="weekend-simulation-list">
                  ${assignments.map(renderWeekendSimulationEmployee).join("")}
                </div>
              </section>
            `;
          })
          .join("")}
      </div>

      <section class="panel weekend-simulation-changes">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Minimale Veränderung</p>
            <h3>Abweichungen von der heutigen Zuordnung</h3>
          </div>
        </div>
        ${
          changedAssignments.length
            ? `<div class="weekend-simulation-change-list">
                ${changedAssignments
                  .map(
                    ({ employee, originalWeekend, proposedWeekend }) => `
                      <div>
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        <span>${escapeHtml(serviceWeekendLabel(originalWeekend))} → ${escapeHtml(
                          serviceWeekendLabel(proposedWeekend),
                        )}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : '<p class="weekend-simulation-no-changes">Die bestehende feste Verteilung ist bereits die beste gefundene Lösung.</p>'
        }
      </section>
    `;
  }

  function requestApplyWeekendSimulation() {
    const simulation = currentWeekendSimulation;
    if (!simulation || simulation.employeeCount === 0) {
      showToast("Es liegt keine übernehmbare Simulation vor.", "error");
      return;
    }
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Mitarbeiterdaten haben sich verändert. Die Simulation wurde neu berechnet.",
        "error",
      );
      return;
    }
    const changedCount = simulation.switchedCount;
    if (changedCount === 0) {
      showToast("Die Simulation enthält keine geänderten Zuordnungen.");
      return;
    }

    requestConfirmation({
      title: "Wochenendverteilung übernehmen?",
      message:
        `${simulation.switchedCount} bestehende Zuordnung${
          simulation.switchedCount === 1 ? "" : "en"
        } werden zwischen den beiden Dienstwochenenden gewechselt. Mitarbeiter ohne festes Wochenende bleiben unberührt. Diese Änderung wird gespeichert.`,
      acceptLabel: "Verteilung übernehmen",
      tone: "primary",
      callback: () => applyWeekendSimulation(simulation),
    });
  }

  async function applyWeekendSimulation(simulation) {
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Ausgangsdaten haben sich geändert. Bitte prüfen Sie die neu berechnete Simulation.",
        "error",
      );
      return;
    }
    const proposedByEmployeeId = new Map(
      simulation.assignments.map((assignment) => [
        assignment.employee.id,
        assignment.proposedWeekend,
      ]),
    );
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.employees.forEach((employee) => {
        const proposedWeekend = proposedByEmployeeId.get(employee.id);
        if (
          !SERVICE_WEEKEND_KEYS.includes(proposedWeekend) ||
          serviceWeekendOwnerKey(employee.id) ||
          employee.serviceWeekend === proposedWeekend
        ) {
          return;
        }
        employee.serviceWeekend = proposedWeekend;
        employee.updatedAt = now;
      });
    });
    if (!committed) return;

    currentWeekendSimulation = null;
    if (elements.weekendSimulationDialog.open) {
      elements.weekendSimulationDialog.close();
    }
    showToast(
      `Die simulierte Verteilung wurde für ${
        simulation.switchedCount
      } Mitarbeiter/innen übernommen.`,
    );
  }

  function weekendSimulationMatchesCurrentState(simulation) {
    const activeEmployees = activeEmployeeList().filter((employee) =>
      SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    );
    if (activeEmployees.length !== simulation.assignments.length) return false;
    const currentById = new Map(
      activeEmployees.map((employee) => [employee.id, employee]),
    );
    return simulation.assignments.every(
      ({ employee, originalWeekend, ownerWeekend }) => {
        const currentEmployee = currentById.get(employee.id);
        if (!currentEmployee) return false;
        const normalizedCurrentWeekend = SERVICE_WEEKEND_KEYS.includes(
          currentEmployee.serviceWeekend,
        )
          ? currentEmployee.serviceWeekend
          : "none";
        const currentOwnerWeekend = serviceWeekendOwnerKey(currentEmployee.id);
        return (
          normalizedCurrentWeekend === originalWeekend &&
          currentOwnerWeekend === ownerWeekend &&
          (!currentOwnerWeekend || currentOwnerWeekend === originalWeekend)
        );
      },
    );
  }

  function simulateWeekendDistribution(employees = activeEmployeeList()) {
    const unassignedCount = employees.filter(
      (employee) => !SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    ).length;
    const candidates = employees
      .filter((employee) =>
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
      )
      .sort(sortEmployees);
    const originalAssignments = new Map(
      candidates.map((employee) => [
        employee.id,
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend)
          ? employee.serviceWeekend
          : "none",
      ]),
    );
    const assignments = new Map();
    candidates.forEach((employee) => {
      const original = originalAssignments.get(employee.id);
      if (original !== "none") assignments.set(employee.id, original);
    });

    let evaluation = evaluateWeekendSimulation(
      candidates,
      assignments,
      originalAssignments,
    );
    for (let iteration = 0; iteration < 100; iteration += 1) {
      let bestAction = null;
      let bestEvaluation = evaluation;

      candidates.forEach((employee) => {
        if (serviceWeekendOwnerKey(employee.id)) return;
        const currentWeekend = assignments.get(employee.id);
        assignments.set(
          employee.id,
          currentWeekend === "weekend_a" ? "weekend_b" : "weekend_a",
        );
        const candidateEvaluation = evaluateWeekendSimulation(
          candidates,
          assignments,
          originalAssignments,
        );
        assignments.set(employee.id, currentWeekend);
        if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
          bestEvaluation = candidateEvaluation;
          bestAction = { type: "move", first: employee.id };
        }
      });

      for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < candidates.length;
          rightIndex += 1
        ) {
          const left = candidates[leftIndex];
          const right = candidates[rightIndex];
          if (
            serviceWeekendOwnerKey(left.id) ||
            serviceWeekendOwnerKey(right.id)
          ) {
            continue;
          }
          const leftWeekend = assignments.get(left.id);
          const rightWeekend = assignments.get(right.id);
          if (leftWeekend === rightWeekend) continue;
          assignments.set(left.id, rightWeekend);
          assignments.set(right.id, leftWeekend);
          const candidateEvaluation = evaluateWeekendSimulation(
            candidates,
            assignments,
            originalAssignments,
          );
          assignments.set(left.id, leftWeekend);
          assignments.set(right.id, rightWeekend);
          if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
            bestEvaluation = candidateEvaluation;
            bestAction = { type: "swap", first: left.id, second: right.id };
          }
        }
      }

      if (!bestAction) break;
      if (bestAction.type === "move") {
        assignments.set(
          bestAction.first,
          assignments.get(bestAction.first) === "weekend_a" ? "weekend_b" : "weekend_a",
        );
      } else {
        const firstWeekend = assignments.get(bestAction.first);
        assignments.set(bestAction.first, assignments.get(bestAction.second));
        assignments.set(bestAction.second, firstWeekend);
      }
      evaluation = bestEvaluation;
    }

    const currentGroups = {
      weekend_a: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_a",
      ),
      weekend_b: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_b",
      ),
    };
    const current = {
      weekend_a: weekendSimulationMetrics(currentGroups.weekend_a),
      weekend_b: weekendSimulationMetrics(currentGroups.weekend_b),
    };
    const resultAssignments = candidates
      .map((employee) => {
        const originalWeekend = originalAssignments.get(employee.id);
        const proposedWeekend = assignments.get(employee.id);
        return {
          employee,
          originalWeekend,
          proposedWeekend,
          ownerWeekend: serviceWeekendOwnerKey(employee.id),
          isWeekendOwner: Boolean(serviceWeekendOwnerKey(employee.id)),
          changeType:
            originalWeekend === proposedWeekend ? "unchanged" : "switched",
        };
      })
      .sort(
        (left, right) =>
          left.proposedWeekend.localeCompare(right.proposedWeekend) ||
          sortEmployees(left.employee, right.employee),
      );

    return {
      employeeCount: candidates.length,
      unassignedCount,
      fixedAssignmentCount: resultAssignments.filter(
        (assignment) => assignment.originalWeekend !== "none",
      ).length,
      switchedCount: resultAssignments.filter(
        (assignment) => assignment.changeType === "switched",
      ).length,
      newAssignmentCount: 0,
      current,
      proposed: evaluation.metrics,
      currentBalanceScore: weekendSimulationBalanceScore(current),
      proposedBalanceScore: evaluation.balanceScore,
      assignments: resultAssignments,
    };
  }

  function evaluateWeekendSimulation(
    employees,
    assignments,
    originalAssignments,
  ) {
    const groups = { weekend_a: [], weekend_b: [] };
    employees.forEach((employee) => {
      const weekend = assignments.get(employee.id);
      if (groups[weekend]) groups[weekend].push(employee);
    });
    const metrics = {
      weekend_a: weekendSimulationMetrics(groups.weekend_a),
      weekend_b: weekendSimulationMetrics(groups.weekend_b),
    };
    const switchedCount = employees.filter((employee) => {
      const original = originalAssignments.get(employee.id);
      return original !== "none" && original !== assignments.get(employee.id);
    }).length;
    const balanceScore = weekendSimulationBalanceScore(metrics);
    return {
      metrics,
      balanceScore,
      switchedCount,
      score: balanceScore + switchedCount * 0.75,
    };
  }

  function weekendSimulationMetrics(employees) {
    const employmentPercent = employees.reduce(
      (sum, employee) => sum + employee.employmentPercent,
      0,
    );
    return {
      headcount: employees.length,
      employmentPercent,
      fte: employmentPercent / 100,
      onboarding: employees.filter(
        (employee) => employee.employmentStatus === "onboarding",
      ).length,
      fachweiterbildung: employees.filter((employee) =>
        hasCurrentQualification(employee, "fachweiterbildungIA"),
      ).length,
      praxisanleiter: employees.filter((employee) =>
        hasCurrentQualification(employee, "praxisanleiter"),
      ).length,
    };
  }

  function weekendSimulationBalanceScore(metrics) {
    const difference = (key) =>
      Math.abs((metrics.weekend_a[key] || 0) - (metrics.weekend_b[key] || 0));
    return (
      difference("headcount") ** 2 +
      difference("fte") ** 2 * 2 +
      difference("onboarding") ** 2 * 1.5 +
      difference("fachweiterbildung") ** 2 * 1.5 +
      difference("praxisanleiter") ** 2 * 1.5
    );
  }

  function renderWeekendSimulationEmployee({
    employee,
    originalWeekend,
    changeType,
    isWeekendOwner,
  }) {
    const changeLabel = {
      unchanged: isWeekendOwner ? "verantwortlich" : "unverändert",
      switched: `von ${serviceWeekendLabel(originalWeekend)}`,
    }[changeType];
    return `
      <div class="weekend-simulation-employee">
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${employee.employmentPercent} % · ${escapeHtml(
              employeeStatusLabel(employee),
            )}</small>
          </span>
        </span>
        <span class="simulation-change-badge is-${changeType}">${escapeHtml(
          changeLabel,
        )}</span>
        <span>${hasCurrentQualification(employee, "fachweiterbildungIA") ? "FWB" : "–"}</span>
        <span>${hasCurrentQualification(employee, "praxisanleiter") ? "PA" : "–"}</span>
      </div>
    `;
  }

  function renderWeekendDistribution() {
    elements.weekendDistributionContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendDistributionContent);
  }

  function renderWeekendOverview() {
    elements.weekendOverviewContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendOverviewContent, true);
  }

  function renderWeekendDistributionMarkup() {
    const distribution = getWeekendDistributionData();
    const keys = ["weekend_a", "weekend_b", "none"];
    const weekendA = distribution.weekend_a.metrics;
    const weekendB = distribution.weekend_b.metrics;
    const comparisonRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Stellenanteil kumuliert", "employmentPercent", (value) => `${value} %`],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];

    return `
      <section class="panel weekend-comparison-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Kumulativer Vergleich</p>
            <h2>Struktur der Dienstwochenenden</h2>
          </div>
          <span class="weekend-comparison-note">
            ${escapeHtml(serviceWeekendLabel("weekend_a"))} ↔ ${escapeHtml(serviceWeekendLabel("weekend_b"))}: ${Math.abs(weekendA.employmentPercent - weekendB.employmentPercent)} %
            Unterschied beim Stellenanteil
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th scope="col">Kennzahl</th>
                ${keys
                  .map(
                    (key) =>
                      `<th scope="col">${escapeHtml(serviceWeekendLabel(key))}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${comparisonRows
                .map(
                  ([label, property, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      ${keys
                        .map((key) => {
                          const metrics = distribution[key].metrics;
                          const share =
                            ["fachweiterbildung", "praxisanleiter", "onboarding"].includes(
                              property,
                            ) && metrics.headcount
                              ? ` <small>(${percentage(
                                  metrics[property],
                                  metrics.headcount,
                                )} %)</small>`
                              : "";
                          return `<td><strong>${escapeHtml(
                            formatter(metrics[property]),
                          )}</strong>${share}</td>`;
                        })
                        .join("")}
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-group-grid weekend-distribution-groups">
        ${keys
          .map((key) => {
            const group = distribution[key];
            return `
              <section class="panel weekend-distribution-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Festes Dienstwochenende</p>
                    <h2>${escapeHtml(serviceWeekendLabel(key))}</h2>
                  </div>
                  <button
                    class="button button-ghost button-compact"
                    type="button"
                    data-filter-weekend="${key}"
                  >
                    In Mitarbeiterliste
                  </button>
                </div>
                <div class="weekend-group-metrics">
                  <span><strong>${group.metrics.headcount}</strong> Personen</span>
                  <span><strong>${group.metrics.employmentPercent} %</strong> Stellenanteil</span>
                  <span><strong>${formatDecimal(group.metrics.fte)}</strong> VZÄ</span>
                </div>
                <div class="weekend-distribution-list">
                  ${
                    group.employees
                      .map((employee) => renderWeekendEmployee(employee))
                      .join("") ||
                    '<p class="field-hint">Keine aktiven Mitarbeiter zugeordnet.</p>'
                  }
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function getWeekendDistributionData() {
    const groups = Object.fromEntries(
      Object.keys(SERVICE_WEEKENDS).map((key) => [key, []]),
    );
    activeEmployeeList()
      .sort(sortEmployees)
      .forEach((employee) => groups[employee.serviceWeekend].push(employee));

    return Object.fromEntries(
      Object.entries(groups).map(([key, employees]) => {
        const employmentPercent = employees.reduce(
          (sum, employee) => sum + employee.employmentPercent,
          0,
        );
        return [
          key,
          {
            employees,
            metrics: {
              headcount: employees.length,
              employmentPercent,
              fte: employmentPercent / 100,
              onboarding: employees.filter(
                (employee) => employee.employmentStatus === "onboarding",
              ).length,
              fachweiterbildung: employees.filter(
                (employee) =>
                  hasCurrentQualification(employee, "fachweiterbildungIA"),
              ).length,
              praxisanleiter: employees.filter(
                (employee) => hasCurrentQualification(employee, "praxisanleiter"),
              ).length,
            },
          },
        ];
      }),
    );
  }

  function renderWeekendEmployee(employee) {
    const fachweiterbildung = getQualificationDisplayState(
      employee,
      "fachweiterbildungIA",
    );
    const praxisanleiter = getQualificationDisplayState(
      employee,
      "praxisanleiter",
    );
    return `
      <button
        class="weekend-distribution-employee"
        type="button"
        data-weekend-employee="${employee.id}"
      >
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${escapeHtml(employeeStatusLabel(employee))}${
              serviceWeekendOwnerKey(employee.id)
                ? " · Verantwortliche Person"
                : ""
            }</small>
          </span>
        </span>
        <strong class="weekend-employment-percent">${employee.employmentPercent} %</strong>
        <span class="weekend-qualification-state ${fachweiterbildung.className}"
          title="Fachweiterbildung I/A: ${fachweiterbildung.title}">
          ${fachweiterbildung.symbol} FWB I/A
        </span>
        <span class="weekend-qualification-state ${praxisanleiter.className}"
          title="Praxisanleiter/in: ${praxisanleiter.title}">
          ${praxisanleiter.symbol} PA
        </span>
      </button>
    `;
  }

  function hasCurrentQualification(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) return false;
    const expiry = employee.qualificationExpiries[qualificationId];
    return !expiry || expiry >= todayIso();
  }

  function getQualificationDisplayState(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) {
      return { symbol: "×", className: "", title: "nicht vorhanden" };
    }
    if (!hasCurrentQualification(employee, qualificationId)) {
      return { symbol: "!", className: "is-expired", title: "abgelaufen" };
    }
    return { symbol: "✓", className: "is-qualified", title: "vorhanden" };
  }

  function bindWeekendDistributionActions(container, closeDialog = false) {
    container
      .querySelectorAll("[data-filter-weekend]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          employeeWeekendFilter = button.dataset.filterWeekend;
          if (closeDialog) elements.weekendOverviewDialog.close();
          showView("employees");
          renderEmployees();
        }),
      );
    container
      .querySelectorAll("[data-weekend-employee]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          openEmployeeDossier(button.dataset.weekendEmployee),
        ),
      );
  }

  function printWeekendOverview() {
    document.body.classList.add("print-weekend-overview");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-weekend-overview"), 0);
  }
