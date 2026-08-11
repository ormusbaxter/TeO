  function getTrainingStats(training) {
    const activeEmployees = activeEmployeeList();
    const current = activeEmployees.filter((employee) =>
      isEmployeeCurrentForTraining(employee.id, training),
    ).length;
    const total = activeEmployees.length;
    return {
      current,
      open: Math.max(0, total - current),
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function getEmployeeTrainingStats(employeeId) {
    const obligations = trainingObligations();
    const total = obligations.length;
    const current = obligations.filter((training) =>
      isEmployeeCurrentForTraining(employeeId, training),
    ).length;
    return {
      current,
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function isEmployeeCurrentForTraining(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return false;
    if (!training.recurrenceMonths) return true;
    return addMonths(latest.completedOn, training.recurrenceMonths) >= todayIso();
  }

  function getEmployeeCompletionStatus(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return { kind: "open", label: "Offen" };

    if (!training.recurrenceMonths) {
      return {
        kind: "current",
        label: `absolviert am ${formatDate(latest.completedOn)}`,
      };
    }

    const validUntil = addMonths(latest.completedOn, training.recurrenceMonths);
    if (validUntil >= todayIso()) {
      return {
        kind: "current",
        label: `gültig bis ${formatDate(validUntil)}`,
      };
    }

    return {
      kind: "expired",
      label: `abgelaufen am ${formatDate(validUntil)}`,
    };
  }

  function latestCompletion(employeeId, trainingId) {
    const training = getTraining(trainingId);
    return training
      ? latestCompletionForTraining(employeeId, training)
      : state.completions
          .filter(
            (completion) =>
              completion.employeeId === employeeId &&
              completion.trainingId === trainingId,
          )
          .sort(sortCompletionsDescending)[0];
  }

  function latestCompletionForTraining(employeeId, training, completedOnOrBefore = "") {
    return state.completions
      .filter(
        (completion) =>
          completion.employeeId === employeeId &&
          completionMatchesTraining(completion, training) &&
          (!completedOnOrBefore || completion.completedOn <= completedOnOrBefore),
      )
      .sort(sortCompletionsDescending)[0];
  }

  function sortCompletionsDescending(a, b) {
    return (
      b.completedOn.localeCompare(a.completedOn) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }

  function completionMatchesTraining(completion, training) {
    if (!completion || !training) return false;
    if (!training.recurrenceMonths || !training.seriesId) {
      return completion.trainingId === training.id;
    }
    const completedTraining = getTraining(completion.trainingId);
    return (
      completedTraining?.recurrenceMonths &&
      completedTraining.seriesId === training.seriesId
    );
  }

  function trainingObligations() {
    const obligations = new Map();
    state.trainings.forEach((training) => {
      const key =
        training.recurrenceMonths && training.seriesId
          ? `series:${training.seriesId}`
          : `training:${training.id}`;
      const existing = obligations.get(key);
      if (
        !existing ||
        training.year < existing.year ||
        (training.year === existing.year &&
          training.updatedAt.localeCompare(existing.updatedAt) > 0)
      ) {
        obligations.set(key, training);
      }
    });
    return [...obligations.values()];
  }

  function getMeetingStats(meeting) {
    const records = [
      ...new Map(
        state.meetingAttendances
          .filter((attendance) => attendance.meetingId === meeting.id)
          .map((attendance) => [attendance.employeeId, attendance]),
      ).values(),
    ];
    const expectedEmployeeIds = new Set(meeting.expectedEmployeeIds);
    records.forEach((record) => expectedEmployeeIds.add(record.employeeId));
    const validExpectedIds = [...expectedEmployeeIds].filter((employeeId) =>
      getEmployee(employeeId),
    );
    const documentedEmployeeIds = new Set(records.map((record) => record.employeeId));
    const documented = validExpectedIds.filter((employeeId) =>
      documentedEmployeeIds.has(employeeId),
    ).length;
    const total = validExpectedIds.length;
    const notApplicable = records.filter(
      (record) => record.status === "nicht_zutreffend",
    ).length;

    return {
      total,
      documented,
      open: Math.max(0, total - documented),
      notApplicable,
      applicableTotal: Math.max(0, total - notApplicable),
      applicableDocumented: Math.max(0, documented - notApplicable),
      participated: records.filter((record) => record.status === "teilgenommen").length,
      percent: total ? Math.round((documented / total) * 100) : 0,
    };
  }

  function getAnnualMeetingStatistics(year) {
    const meetings = state.meetings
      .filter((meeting) => Number(meeting.date.slice(0, 4)) === year)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const statusCounts = Object.fromEntries(
      Object.keys(ATTENDANCE_STATUSES).map((status) => [status, 0]),
    );
    let totalSlots = 0;
    let documented = 0;
    let open = 0;

    const meetingRows = meetings.map((meeting) => {
      const records = [
        ...new Map(
          state.meetingAttendances
            .filter((attendance) => attendance.meetingId === meeting.id)
            .map((attendance) => [attendance.employeeId, attendance]),
        ).values(),
      ];
      records.forEach((record) => {
        statusCounts[record.status] += 1;
      });
      const stats = getMeetingStats(meeting);
      const applicableRecords = records.filter(
        (record) => record.status !== "nicht_zutreffend",
      );
      const participated = applicableRecords.filter(
        (record) => record.status === "teilgenommen",
      ).length;
      const absent = Math.max(0, stats.applicableDocumented - participated);

      totalSlots += stats.applicableTotal;
      documented += stats.applicableDocumented;
      open += stats.open;

      return {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        participated,
        absent,
        open: stats.open,
      };
    });

    const participated = statusCounts.teilgenommen;
    const absent = Math.max(0, documented - participated);
    const meetingCount = meetings.length;
    const employeeRows = state.employees
      .map((employee) => {
        const expectedMeetingIds = meetings
          .filter((meeting) => meeting.expectedEmployeeIds.includes(employee.id))
          .map((meeting) => meeting.id);
        const records = state.meetingAttendances.filter(
          (attendance) =>
            attendance.employeeId === employee.id &&
            expectedMeetingIds.includes(attendance.meetingId),
        );
        const employeeStatusCounts = Object.fromEntries(
          Object.keys(ATTENDANCE_STATUSES).map((status) => [
            status,
            records.filter((record) => record.status === status).length,
          ]),
        );
        const applicableRecords = records.filter(
          (record) => record.status !== "nicht_zutreffend",
        );
        const applicableExpected = Math.max(
          0,
          expectedMeetingIds.length - employeeStatusCounts.nicht_zutreffend,
        );
        return {
          employeeId: employee.id,
          name: fullName(employee),
          expected: applicableExpected,
          documented: applicableRecords.length,
          open: Math.max(0, applicableExpected - applicableRecords.length),
          statusCounts: employeeStatusCounts,
          attendanceRate: percentage(
            employeeStatusCounts.teilgenommen,
            applicableExpected,
          ),
        };
      })
      .filter((employee) => employee.expected > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

    return {
      year,
      meetingCount,
      meetings: meetingRows,
      statusCounts,
      totalSlots,
      documented,
      open,
      participated,
      absent,
      averageParticipated: meetingCount ? participated / meetingCount : 0,
      averageAbsent: meetingCount ? absent / meetingCount : 0,
      attendanceRate: percentage(participated, documented),
      documentationRate: percentage(documented, totalSlots),
      employeeRows,
    };
  }

  function percentage(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  // Das Anlegen eines Intl-Formatierers ist deutlich teurer als seine
  // Anwendung. In den Matrizen entstehen sonst tausende gleichartige
  // Formatierer je Aufbau, deshalb werden sie nach ihren Einstellungen abgelegt
  // und wiederverwendet.
  const numberFormats = new Map();
  const dateFormats = new Map();

  function numberFormat(options) {
    const key = JSON.stringify(options);
    let format = numberFormats.get(key);
    if (!format) {
      format = new Intl.NumberFormat("de-DE", options);
      numberFormats.set(key, format);
    }
    return format;
  }

  function dateFormat(options) {
    const key = JSON.stringify(options);
    let format = dateFormats.get(key);
    if (!format) {
      format = new Intl.DateTimeFormat("de-DE", options);
      dateFormats.set(key, format);
    }
    return format;
  }

  function formatDecimal(value) {
    return numberFormat({
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  function activeEmployeeList() {
    return state.employees.filter((employee) => employee.active);
  }

  function qualificationLabel(id) {
    return (
      state.catalogs.qualifications.find((qualification) => qualification.id === id)?.label ||
      DEFAULT_QUALIFICATIONS[id] ||
      id
    );
  }

  function serviceWeekendLabel(value) {
    if (value === "none") return SERVICE_WEEKENDS.none;
    return (
      state.settings?.serviceWeekends?.[value]?.name ||
      SERVICE_WEEKENDS[value] ||
      SERVICE_WEEKENDS.none
    );
  }

  // Die Tagesgrenze der Urlaubsplanung beschreibt den Pflegepool, der sich
  // gegenseitig vertritt. Medizinische Fachangestellte, Pflegefachassistenz
  // und Stationsassistenz gehoeren nicht dazu; ihre Abwesenheiten bleiben
  // sichtbar, belegen aber keinen der gleichzeitig moeglichen Urlaube.
  function countsTowardsAbsenceLimit(employee) {
    return !isAbsenceLimitExemptProfession(employee?.profession);
  }

  function isAbsenceLimitExemptProfession(profession) {
    const signature = professionSignature(profession);
    if (!signature) return false;
    return ABSENCE_LIMIT_EXEMPT_PROFESSION_PATTERNS.some((pattern) =>
      signature.includes(pattern),
    );
  }

  // Die Normalisierung laeuft je Urlaubseintrag, obwohl es nur eine Handvoll
  // Berufsbezeichnungen gibt. Da die Umwandlung allein vom Text abhaengt, ist
  // ihr Ergebnis dauerhaft ablegbar.
  const professionSignatures = new Map();

  function professionSignature(value) {
    const text = String(value || "");
    let signature = professionSignatures.get(text);
    if (signature === undefined) {
      signature = text
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("de-DE")
        .replace(/[^a-z]/g, "");
      professionSignatures.set(text, signature);
    }
    return signature;
  }

  function serviceWeekendOwnerKey(employeeId) {
    if (!employeeId) return "";
    return (
      SERVICE_WEEKEND_KEYS.find(
        (weekend) =>
          state.settings?.serviceWeekends?.[weekend]?.ownerId === employeeId,
      ) || ""
    );
  }

  function isWeekendLeadership(employee) {
    return Boolean(
      employee &&
        LEADERSHIP_QUALIFICATION_IDS.some(
          (qualificationId) => employee.qualifications?.[qualificationId],
        ),
    );
  }

  function serviceWeekendOptionsMarkup({
    includeUnchanged = false,
    includeNone = true,
  } = {}) {
    return [
      includeUnchanged ? '<option value="">Nicht ändern</option>' : "",
      includeNone
        ? `<option value="none">${escapeHtml(SERVICE_WEEKENDS.none)}</option>`
        : "",
      ...SERVICE_WEEKEND_KEYS.map(
        (weekend) =>
          `<option value="${weekend}">${escapeHtml(
            serviceWeekendLabel(weekend),
          )}</option>`,
      ),
    ].join("");
  }

  function handleBeforeUnload(event) {
    if (!databaseSaveReminderArmed) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function shouldRemindBeforeUnload(candidateState = state) {
    if (!candidateState || typeof candidateState !== "object") return false;
    const collections = [
      "employees",
      "trainings",
      "completions",
      "meetings",
      "meetingAttendances",
      "appointments",
      "devices",
      "deviceInstructions",
      "vacationEntitlements",
      "vacationDays",
      "users",
    ];
    const containsData = collections.some(
      (collection) => candidateState[collection]?.length,
    );
    if (!containsData) return false;

    const lastBackupTimestamp = Date.parse(
      candidateState.settings?.lastBackupAt || "",
    );
    if (!Number.isFinite(lastBackupTimestamp)) return true;

    const hasLaterAuditChange = (candidateState.auditLog || []).some(
      (entry) =>
        Date.parse(entry?.timestamp || "") > lastBackupTimestamp &&
        !/Datensicherung exportiert/i.test(String(entry?.action || "")),
    );
    if (hasLaterAuditChange) return true;

    return collections
      .filter((collection) => collection !== "users")
      .some((collection) =>
        (candidateState[collection] || []).some((entry) =>
          ["updatedAt", "createdAt"].some(
            (property) =>
              Date.parse(entry?.[property] || "") > lastBackupTimestamp,
          ),
        ),
      );
  }

  function employeeStatusLabel(employee) {
    return EMPLOYMENT_STATUSES[employee?.employmentStatus] || EMPLOYMENT_STATUSES.active;
  }

  function employmentStatusOrder(status) {
    return { active: 0, onboarding: 1, inactive: 2 }[status] ?? 3;
  }

  function getFilteredEmployeeEmailAddresses() {
    const seenAddresses = new Set();

    return filteredEmployeesForTable()
      .map((employee) => employee.email.trim())
      .filter((email) => {
        if (!email) return false;
        const normalizedEmail = email.toLocaleLowerCase("de-DE");
        if (seenAddresses.has(normalizedEmail)) return false;
        seenAddresses.add(normalizedEmail);
        return true;
      });
  }

  function getFilteredEmployeeEmailExport() {
    return getFilteredEmployeeEmailAddresses().join(";");
  }

  function getFilteredEmployeeUsernames() {
    const seenUsernames = new Set();

    return filteredEmployeesForTable()
      .map((employee) => employee.username.trim())
      .filter((username) => {
        if (!username) return false;
        const normalizedUsername = username.toLocaleLowerCase("de-DE");
        if (seenUsernames.has(normalizedUsername)) return false;
        seenUsernames.add(normalizedUsername);
        return true;
      });
  }

  function updateEmailExportButton() {
    const emailCount = getFilteredEmployeeEmailAddresses().length;
    elements.copyActiveEmailsLabel.textContent = emailCount
      ? `E-Mails kopieren (${emailCount})`
      : "E-Mails kopieren";
    elements.copyActiveEmailsButton.setAttribute(
      "aria-label",
      emailCount
        ? `${emailCount} E-Mail-Adressen der aktuell gefilterten Mitarbeiter kopieren`
        : "E-Mail-Adressen der aktuell gefilterten Mitarbeiter kopieren",
    );
  }

  function updateUsernameExportButton() {
    const usernameCount = getFilteredEmployeeUsernames().length;
    elements.copyUsernamesLabel.textContent = usernameCount
      ? `Benutzernamen kopieren (${usernameCount})`
      : "Benutzernamen kopieren";
    elements.copyUsernamesButton.setAttribute(
      "aria-label",
      usernameCount
        ? `${usernameCount} Benutzernamen der aktuell gefilterten Mitarbeiter kopieren`
        : "Benutzernamen der aktuell gefilterten Mitarbeiter kopieren",
    );
  }

  // Die Telefonliste haengt bewusst nicht an den Tabellenfiltern: Sie wird
  // ausgehaengt und soll jede Person enthalten, die im Dienst erreichbar ist.
  // Das sind alle aktiven und alle in Einarbeitung befindlichen Mitarbeiter.
  const PHONE_LIST_EMPLOYMENT_STATUSES = ["active", "onboarding"];

  function employeesForPhoneList() {
    return state.employees.filter((employee) =>
      PHONE_LIST_EMPLOYMENT_STATUSES.includes(employee.employmentStatus),
    );
  }

  function getFilteredEmployeePhoneListRows() {
    return employeesForPhoneList()
      .sort(sortEmployees)
      .map((employee) => [fullName(employee), employee.phone]);
  }

  function updatePhoneListExportButton() {
    const employeeCount = getFilteredEmployeePhoneListRows().length;
    elements.exportEmployeePhoneListLabel.textContent = employeeCount
      ? `Telefonliste drucken (${employeeCount})`
      : "Telefonliste drucken";
    elements.exportEmployeePhoneListButton.setAttribute(
      "aria-label",
      employeeCount
        ? `Telefonliste für ${employeeCount} aktive und einzuarbeitende Mitarbeiter drucken`
        : "Telefonliste der aktiven und einzuarbeitenden Mitarbeiter drucken",
    );
  }

  function splitPhoneListIntoColumns(rows) {
    const columnCount = rows.length > 72 ? 3 : rows.length > 28 ? 2 : 1;
    const rowsPerColumn = Math.ceil(rows.length / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
      rows.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn),
    ).filter((column) => column.length > 0);
  }

  function buildEmployeePhoneListPrintHtml(rows) {
    const columns = splitPhoneListIntoColumns(rows);
    const maximumRows = Math.max(...columns.map((column) => column.length));
    const fontSize = maximumRows > 32 ? "9pt" : maximumRows > 28 ? "10pt" : "10.5pt";
    const cellPadding =
      maximumRows > 32
        ? "1.1mm"
        : maximumRows > 30
          ? "1.65mm"
          : maximumRows > 28
            ? "2mm"
            : "2.5mm";
    const tables = columns
      .map(
        (column) => `
          <table>
            <thead><tr><th>Name</th><th>Nummer</th></tr></thead>
            <tbody>
              ${column
                .map(
                  ([name, phone]) => `
                    <tr>
                      <td>${escapeHtml(name)}</td>
                      <td>${escapeHtml(phone || "")}</td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>`,
      )
      .join("");
    return `
      <article
        class="phone-list-document"
        style="--phone-columns: ${columns.length}; --phone-font-size: ${fontSize}; --phone-cell-padding: ${cellPadding}"
      >
        <header class="phone-list-document-header">
          <h1>Telefonliste</h1>
          <span>${rows.length} Mitarbeiter · Stand ${formatDate(new Date().toISOString().slice(0, 10))}</span>
        </header>
        <div class="phone-list-document-grid">${tables}</div>
      </article>`;
  }

  function exportEmployeePhoneList() {
    const rows = getFilteredEmployeePhoneListRows();
    if (rows.length === 0) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter erfasst.",
        "error",
      );
      return;
    }
    const previewMarkup = buildEmployeePhoneListPrintHtml(rows);
    elements.phoneListPreviewContent.innerHTML = previewMarkup;
    elements.phoneListPrintSurface.innerHTML = previewMarkup;
    elements.phoneListPreviewSubtitle.textContent =
      `${rows.length} aktive und einzuarbeitende Mitarbeiter · DIN A4 Hochformat`;
    elements.phoneListPreviewDialog.showModal();
  }

  function printEmployeePhoneList() {
    if (!elements.phoneListPreviewDialog.open) return;
    document.body.classList.add("print-phone-list");
    window.print();
    window.setTimeout(
      () => document.body.classList.remove("print-phone-list"),
      0,
    );
  }

  async function copyListToClipboard(werte, { erfolg, fehlerProtokoll }) {
    const exportText = werte.join(";");
    const meldung = erfolg(werte.length);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextWithFallback(exportText);
      }
      showToast(meldung);
    } catch (error) {
      try {
        copyTextWithFallback(exportText);
        showToast(meldung);
      } catch (fallbackError) {
        console.error(fehlerProtokoll, error, fallbackError);
        showToast(
          "Die Zwischenablage ist nicht verfügbar. Bitte prüfen Sie die Browserberechtigung.",
          "error",
        );
      }
    }
  }

  async function copyActiveEmployeeEmails() {
    const emailAddresses = getFilteredEmployeeEmailAddresses();
    if (emailAddresses.length === 0) {
      showToast(
        "Für die aktuell gefilterten Mitarbeiter sind keine E-Mail-Adressen hinterlegt.",
        "error",
      );
      return;
    }

    await copyListToClipboard(emailAddresses, {
      erfolg: (anzahl) =>
        `${anzahl} E-Mail-Adresse${
          anzahl === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      fehlerProtokoll: "E-Mail-Adressen konnten nicht kopiert werden.",
    });
  }

  async function copyFilteredEmployeeUsernames() {
    const usernames = getFilteredEmployeeUsernames();
    if (usernames.length === 0) {
      showToast(
        "Für die aktuell gefilterten Mitarbeiter sind keine Benutzernamen hinterlegt.",
        "error",
      );
      return;
    }

    await copyListToClipboard(usernames, {
      erfolg: (anzahl) =>
        `${anzahl} Benutzername${
          anzahl === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      fehlerProtokoll: "Benutzernamen konnten nicht kopiert werden.",
    });
  }

  function copyTextWithFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.setAttribute("aria-hidden", "true");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textArea.remove();
    }
    if (!copied) throw new Error("Fallback-Kopiervorgang wurde vom Browser abgelehnt.");
  }

  // Das Nachschlagen ueber die Kennung ist der haeufigste Zugriff der gesamten
  // Anwendung: Ein einziger Aufbau der Urlaubsmatrix fragt zehntausende Male
  // nach einem Mitarbeiter. Als lineare Suche summiert sich das zu Millionen
  // Vergleichen je Klick, deshalb liegt hinter jeder Sammlung eine
  // Zuordnungstabelle.
  //
  // Der Zwischenspeicher haelt sich an zwei Merkmale der Sammlung: an das Feld
  // selbst und an dessen Laenge. Jede Bestandsaenderung faellt dadurch auf,
  // denn sie ersetzt entweder das Feld (map, filter, Neuaufbau des Zustands)
  // oder aendert die Laenge (push). Aenderungen innerhalb eines Datensatzes
  // brauchen keine Erneuerung, weil die Tabelle auf dieselben Objekte zeigt.
  // Diese Aenderungsarten deckt tests/lookup-index.test.mjs ab.
  //
  // Nicht erkennbar waere ein Austausch eines Datensatzes an Ort und Stelle
  // bei gleicher Laenge (etwa state.employees[0] = anderer). So etwas kommt in
  // der Anwendung nicht vor; wer es einfuehrt, muss diese Stelle anpassen.
  const collectionIndexes = new WeakMap();

  function indexById(collection) {
    if (!Array.isArray(collection)) return new Map();
    const cached = collectionIndexes.get(collection);
    if (cached && cached.size === collection.length) return cached.index;
    const index = new Map();
    for (const item of collection) {
      // Bei doppelten Kennungen gewinnt der erste Datensatz, genau wie zuvor
      // bei der Suche mit find().
      if (!index.has(item.id)) index.set(item.id, item);
    }
    collectionIndexes.set(collection, { size: collection.length, index });
    return index;
  }

  function getEmployee(employeeId) {
    return indexById(state.employees).get(employeeId);
  }

  function getTraining(trainingId) {
    return indexById(state.trainings).get(trainingId);
  }

  function getMeeting(meetingId) {
    return indexById(state.meetings).get(meetingId);
  }

  function getAppointment(appointmentId) {
    return indexById(state.appointments).get(appointmentId);
  }

  function getDevice(deviceId) {
    return indexById(state.devices).get(deviceId);
  }

  function recurrenceLabel(training) {
    if (!training.recurrenceMonths) return "Einmalig / ohne Ablauf";
    if (training.recurrenceMonths === 12) return "Jährliche Wiederholung";
    if (training.recurrenceMonths === 24) return "Wiederholung alle 2 Jahre";
    if (training.recurrenceMonths === 36) return "Wiederholung alle 3 Jahre";
    if (training.recurrenceMonths === 60) return "Wiederholung alle 5 Jahre";
    return `Wiederholung alle ${training.recurrenceMonths} Monate`;
  }

  function renderAvatar(employee, small = false) {
    const status = ["active", "onboarding", "inactive"].includes(
      employee.employmentStatus,
    )
      ? employee.employmentStatus
      : employee.active === false
        ? "inactive"
        : "active";
    const employmentPercent = Math.min(
      100,
      Math.max(0, Number(employee.employmentPercent) || 0),
    );
    return `
      <span
        class="avatar avatar-status-${status} ${small ? "avatar-sm" : ""}"
        style="--avatar-fill: ${employmentPercent}%"
        aria-hidden="true"
        title="${escapeHtml(employeeStatusLabel(employee))} · ${employmentPercent} % Beschäftigungsumfang"
      >
        <span class="avatar-initials">${escapeHtml(initials(employee))}</span>
      </span>
    `;
  }

  function fullName(employee) {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  function initials(employee) {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toLocaleUpperCase("de-DE");
  }

  function sortEmployees(a, b) {
    return (
      a.lastName.localeCompare(b.lastName, "de") ||
      a.firstName.localeCompare(b.firstName, "de")
    );
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function formatStorageSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return "–";
    if (value === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
      Math.floor(Math.log(value) / Math.log(1000)),
      units.length - 1,
    );
    const amount = value / 1000 ** unitIndex;
    const maximumFractionDigits = unitIndex === 0 ? 0 : 1;
    const formattedAmount = numberFormat({ maximumFractionDigits }).format(
      amount,
    );

    return `${formattedAmount} ${units[unitIndex]}`;
  }

  function formatList(values) {
    if (values.length <= 1) return values[0] || "";
    if (values.length === 2) return `${values[0]} und ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
  }

  function todayIso() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addMonths(dateString, monthCount) {
    const date = parseLocalDate(dateString);
    if (!date) return "";
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthCount);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseLocalDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function formatDate(dateString) {
    const date = parseLocalDate(dateString);
    if (!date) return "–";
    return [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getFullYear()).padStart(4, "0"),
    ].join(".");
  }

  function formatDateInputValue(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  }

  function initializeFormattedDateInputs() {
    refreshFormattedDateInputs();
    document.addEventListener("input", handleFormattedDateInput, true);
    document.addEventListener("change", handleFormattedDateInput, true);
    dateInputObserver = new MutationObserver(() => {
      refreshFormattedDateInputs();
    });
    dateInputObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
  }

  function refreshFormattedDateInputs() {
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      let shell = input.closest(".formatted-date-shell");
      if (!shell) {
        shell = document.createElement("span");
        shell.className = "formatted-date-shell";
        input.before(shell);
        shell.append(input);
        const display = document.createElement("span");
        display.className = "formatted-date-display";
        display.setAttribute("aria-hidden", "true");
        shell.append(display);
        input.classList.add("formatted-date-input");
      }
      updateFormattedDateInput(input);
    });
  }

  function handleFormattedDateInput(event) {
    if (event.target?.matches?.('input[type="date"]')) {
      updateFormattedDateInput(event.target);
    }
  }

  function updateFormattedDateInput(input) {
    const display = input
      .closest(".formatted-date-shell")
      ?.querySelector(".formatted-date-display");
    if (!display) return;
    const formattedValue = formatDateInputValue(input.value);
    const displayValue = formattedValue || "TT.MM.JJJJ";
    if (display.textContent !== displayValue) {
      display.textContent = displayValue;
    }
    display.classList.toggle("is-placeholder", !formattedValue);
  }

  function formatTime(timeString) {
    return normalizeTimeValue(timeString) || "–";
  }

  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return "–";
    const datePart = [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getFullYear()).padStart(4, "0"),
    ].join(".");
    const timePart = [
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
    ].join(":");
    return `${datePart}, ${timePart}`;
  }

  function downloadCsv(filename, headers, rows) {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const content = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\r\n");
    downloadTextFile(filename, content, "text/csv;charset=utf-8");
    showToast("CSV-Datei wurde exportiert.");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function syncToastRegionLayer() {
    const openDialogs = [...document.querySelectorAll("dialog[open]")];
    const activeDialog = openDialogs.at(-1) || null;
    const popoverOpen =
      typeof elements.toastRegion.hidePopover === "function" &&
      elements.toastRegion.matches(":popover-open");

    if (activeDialog) {
      if (popoverOpen) elements.toastRegion.hidePopover();
      if (elements.toastRegion.parentElement !== activeDialog) {
        activeDialog.append(elements.toastRegion);
      }
      return;
    }

    if (elements.toastRegion.parentElement !== document.body) {
      document.body.append(elements.toastRegion);
    }
    if (
      elements.toastRegion.childElementCount &&
      typeof elements.toastRegion.showPopover === "function" &&
      !elements.toastRegion.matches(":popover-open")
    ) {
      try {
        elements.toastRegion.showPopover();
      } catch (error) {
        console.warn("Die Statusmeldung konnte nicht in die oberste Ebene gehoben werden.", error);
      }
    }
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">
        <svg><use href="#icon-${type === "success" ? "check" : "alert"}"></use></svg>
      </span>
      <span></span>
    `;
    toast.querySelector("span:last-child").textContent = message;
    if (type === "error") {
      toast.querySelector(".toast-icon").style.color = "#ffabb2";
      toast.querySelector(".toast-icon").style.background = "rgb(230 88 101 / 15%)";
    } else if (type === "warning") {
      toast.querySelector(".toast-icon").style.color = "#f4c86d";
      toast.querySelector(".toast-icon").style.background = "rgb(230 170 66 / 15%)";
    }

    elements.toastRegion.append(toast);
    syncToastRegionLayer();
    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => {
        toast.remove();
        if (
          !elements.toastRegion.childElementCount &&
          typeof elements.toastRegion.hidePopover === "function" &&
          elements.toastRegion.matches(":popover-open")
        ) {
          elements.toastRegion.hidePopover();
        }
        if (!elements.toastRegion.childElementCount) {
          syncToastRegionLayer();
        }
      }, 190);
    }, 3400);
  }
})();
