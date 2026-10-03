  function openEmployeeDossier(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    trackWorkspaceRecord("employee", employeeId);
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
        ${renderDossierItem("Stellenumfang", `${currentEmploymentPercent(employee)} %`)}
        ${renderDossierItem("Eintritt", employee.entryDate ? formatDate(employee.entryDate) : "–")}
        ${renderDossierItem("Austritt", employee.exitDate ? formatDate(employee.exitDate) : "–")}
        ${renderDossierItem("Dienstwochenende", serviceWeekendLabel(employee.serviceWeekend))}
        ${renderDossierItem(
          "Sitzungsteilnahme",
          `${percentage(participated, expectedMeetings)} % (${participated}/${expectedMeetings})`,
        )}
      </div>
      ${
        employee.employmentChanges?.length
          ? `<section class="dossier-section">
              <h3>Stellenumfang im Verlauf</h3>
              <div class="dossier-list">
                <div class="dossier-list-row">
                  <strong>${employee.employmentPercent} %</strong>
                  <span>${employee.entryDate ? `ab ${formatDate(employee.entryDate)}` : "Ausgangswert"}</span>
                </div>
                ${employee.employmentChanges
                  .map(
                    (change) => `<div class="dossier-list-row">
                      <strong>${change.percent} %</strong>
                      <span>ab ${formatDate(change.from)}${change.from > todayIso() ? " (geplant)" : ""}</span>
                    </div>`,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }
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
      ${isAdmin() ? renderEmployeeChangeHistory(employee.id) : ""}
    `;
    elements.employeeDossierDialog.showModal();
  }

  // Wie das Aenderungsprotokoll selbst nur fuer Administratoren: Es nennt,
  // wer wann an einem Mitarbeiter gearbeitet hat.
  function employeeChangeHistory(employeeId) {
    return state.auditLog.flatMap((entry) => {
      const subject = entry.subjects?.find((item) => item.employeeId === employeeId);
      return subject ? [{ ...entry, change: subject.change }] : [];
    });
  }

  function renderEmployeeChangeHistory(employeeId) {
    const history = employeeChangeHistory(employeeId);
    const shown = history.slice(0, EMPLOYEE_HISTORY_VISIBLE_ENTRIES);
    return `
      <section class="dossier-section employee-change-history">
        <h3>Änderungsverlauf</h3>
        ${
          shown.length
            ? `<div class="dossier-list">${shown
                .map(
                  (entry) => `<div class="dossier-list-row">
                    <strong>${escapeHtml(entry.change)}</strong>
                    <span>${formatDateTime(entry.timestamp)} · ${escapeHtml(entry.username)}</span>
                  </div>`,
                )
                .join("")}</div>${
                history.length > shown.length
                  ? `<p class="field-hint">${history.length - shown.length} ältere Änderungen stehen im Änderungsprotokoll.</p>`
                  : ""
              }`
            : '<p class="field-hint">Seit Einführung des Änderungsverlaufs wurde an diesem Mitarbeiter nichts geändert.</p>'
        }
      </section>
    `;
  }

  function renderDossierItem(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function printEmployeeDossier() {
    document.body.classList.add("print-employee-dossier");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-employee-dossier"), 0);
  }
