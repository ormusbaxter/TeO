  // Stellenumfang an einem Tag: die letzte Änderung bis zu diesem Tag, sonst
  // der Ausgangswert. employmentPercent ist damit der Wert vor der ersten
  // Änderung, nicht zwingend der heutige.
  function employmentPercentOn(employee, date) {
    let percent = employee.employmentPercent;
    for (const change of employee.employmentChanges || []) {
      if (change.from > date) break;
      percent = change.percent;
    }
    return percent;
  }

  function currentEmploymentPercent(employee) {
    return employmentPercentOn(employee, todayIso());
  }

  function upcomingEmploymentChange(employee) {
    const today = todayIso();
    return (employee.employmentChanges || []).find((change) => change.from > today) || null;
  }

  function isEmployedOn(employee, date) {
    return (
      (!employee.entryDate || employee.entryDate <= date) &&
      (!employee.exitDate || date <= employee.exitDate)
    );
  }

  // Beschäftigt an mindestens einem Tag des Zeitraums.
  function isEmployedBetween(employee, firstDate, lastDate) {
    return (
      (!employee.entryDate || employee.entryDate <= lastDate) &&
      (!employee.exitDate || firstDate <= employee.exitDate)
    );
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
    const collections = TRACKED_COLLECTION_KEYS;
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
      .filter(
        (collection) => !COLLECTIONS_WITHOUT_TIMESTAMPS.includes(collection),
      )
      .some((collection) =>
        (candidateState[collection] || []).some((entry) =>
          ["updatedAt", "createdAt"].some(
            (property) =>
              Date.parse(entry?.[property] || "") > lastBackupTimestamp,
          ),
        ),
      );
  }

  // Nach einem Import beschreiben die zuvor gesetzten Filter einen anderen
  // Datenbestand: Eine Namenssuche, eine Kategorie oder ein Bestandsfilter
  // laesst Listen dann leer wirken, obwohl die Daten vollstaendig vorliegen.
  // Deshalb gehen alle Listenfilter gemeinsam auf ihre Voreinstellung zurueck.
  // Sortierungen bleiben bewusst erhalten, sie verbergen keine Datensaetze.
  //
  // tools/check.mjs prueft, dass jede Filter- und Suchvariable hier vorkommt,
  // damit ein spaeter ergaenzter Filter nicht vergessen wird.
  function resetListFilters() {
    workQueueFilter = "all";
    employeeStatusFilter = "all";
    employeeSearchTerm = "";
    employeeProfessionFilter = "all";
    employeeQualificationFilter = "all";
    employeeWeekendFilter = "all";
    elements.employeeSearch.value = "";
    elements.employeeProfessionFilter.value = employeeProfessionFilter;
    elements.employeeQualificationFilter.value = employeeQualificationFilter;
    elements.employeeWeekendFilter.value = employeeWeekendFilter;

    appointmentPeriodFilter = "all";
    appointmentSearchTerm = "";
    elements.appointmentSearch.value = "";

    memoSearchTerm = "";
    memoCategoryFilter = "all";
    memoStatusFilter = "open";
    elements.memoSearch.value = "";
    elements.memoCategoryFilter.value = memoCategoryFilter;

    completionSearchTerm = "";
    elements.completionEmployeeSearch.value = "";

    attendanceSearchTerm = "";
    attendanceStatusFilter = "all";
    elements.attendanceSearch.value = "";
    elements.attendanceFilter.value = attendanceStatusFilter;

    vacationEmployeeSearchTerm = "";
    elements.vacationEmployeeSearch.value = "";

    deviceInventoryFilter = "current";
    deviceAnnexFilter = "all";
    deviceCategoryFilter = "all";
    deviceSearchTerm = "";
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceCategoryFilter.value = deviceCategoryFilter;
    elements.deviceSearch.value = "";

    deviceManagementSearchTerm = "";
    deviceManagementInventoryFilter = "current";
    deviceManagementAnnexFilter = "all";
    deviceManagementCategoryFilter = "all";
    deviceManagementAuthorizationFilter = "all";
    elements.deviceManagementSearch.value = "";
    elements.deviceManagementInventoryFilter.value = deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceManagementCategoryFilter.value = deviceManagementCategoryFilter;
    elements.deviceManagementAuthorizationFilter.value =
      deviceManagementAuthorizationFilter;

    deviceEmployeeStatusFilter = "employed";
    deviceEmployeeSearchTerm = "";
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;
    elements.deviceEmployeeSearch.value = "";

    deviceOverviewInstructionFilter = "all";
    deviceOverviewEmploymentFilter = "employed";
    deviceOverviewSearchTerm = "";
    elements.deviceOverviewInstructionFilter.value = deviceOverviewInstructionFilter;
    elements.deviceOverviewEmploymentFilter.value = deviceOverviewEmploymentFilter;
    elements.deviceOverviewSearch.value = "";

    deviceParticipantSearchTerm = "";
    deviceInstructionSearchTerm = "";
    deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
    deviceInstructionDeviceSearchTerm = "";
    elements.deviceParticipantSearch.value = "";
    elements.deviceInstructionSearch.value = "";
    elements.deviceInstructionDeviceSearch.value = "";
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
        ${dynamicStyle({ "--phone-columns": columns.length, "--phone-font-size": fontSize, "--phone-cell-padding": cellPadding })}
      >
        <header class="phone-list-document-header">
          <h1>Telefonliste</h1>
          <span>${rows.length} Mitarbeiter · Stand ${formatDate(todayIso())}</span>
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

  async function copyListToClipboard(values, { successMessage, errorLogLabel }) {
    const exportText = values.join(";");
    const message = successMessage(values.length);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextWithFallback(exportText);
      }
      showToast(message);
    } catch (error) {
      try {
        copyTextWithFallback(exportText);
        showToast(message);
      } catch (fallbackError) {
        console.error(errorLogLabel, error, fallbackError);
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
      successMessage: (count) =>
        `${count} E-Mail-Adresse${
          count === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      errorLogLabel: "E-Mail-Adressen konnten nicht kopiert werden.",
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
      successMessage: (count) =>
        `${count} Benutzername${
          count === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      errorLogLabel: "Benutzernamen konnten nicht kopiert werden.",
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

    let copied;
    try {
      copied = document.execCommand("copy");
    } finally {
      textArea.remove();
    }
    if (!copied) throw new Error("Fallback-Kopiervorgang wurde vom Browser abgelehnt.");
  }
