  function openCatalogManagementDialog() {
    elements.newProfession.value = "";
    elements.newQualification.value = "";
    renderCatalogManagement();
    elements.catalogManagementDialog.showModal();
  }

  function renderCatalogManagement() {
    elements.professionCatalogList.innerHTML = state.catalogs.professions
      .map(
        (profession, index) => `
          <div class="catalog-row" data-profession-index="${index}">
            <input type="text" maxlength="100" value="${escapeHtml(
              profession,
            )}" aria-label="Beruf ${escapeHtml(profession)} bearbeiten" />
            <button class="icon-button" type="button" data-catalog-action="save-profession"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-profession"
              aria-label="${escapeHtml(profession)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        `,
      )
      .join("");
    elements.qualificationCatalogList.innerHTML = state.catalogs.qualifications
      .map(
        (qualification) => {
          const systemQualification =
            LEADERSHIP_QUALIFICATION_IDS.includes(qualification.id);
          return `
          <div class="catalog-row" data-qualification-id="${qualification.id}">
            <input type="text" maxlength="100" value="${escapeHtml(
              qualification.label,
            )}" aria-label="Zusatzqualifikation ${escapeHtml(
              qualification.label,
            )} bearbeiten" ${systemQualification ? "readonly" : ""} />
            ${
              systemQualification
                ? '<span class="field-hint catalog-system-role">Systemrolle</span>'
                : `<button class="icon-button" type="button"
              data-catalog-action="save-qualification"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-qualification"
              aria-label="${escapeHtml(qualification.label)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>`
            }
          </div>
        `;
        },
      )
      .join("");
  }

  async function addProfession() {
    const profession = normalizeProfession(elements.newProfession.value);
    if (!profession) {
      showToast("Bitte eine Berufsbezeichnung eingeben.", "error");
      return;
    }
    if (catalogIncludesLabel(state.catalogs.professions, profession)) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.catalogs.professions.push(profession);
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
    });
    if (!committed) return;
    elements.newProfession.value = "";
    renderCatalogManagement();
    showToast("Beruf wurde hinzugefügt.");
  }

  async function addQualification() {
    const label = elements.newQualification.value.trim();
    if (!label) {
      showToast("Bitte eine Bezeichnung für die Zusatzqualifikation eingeben.", "error");
      return;
    }
    if (
      catalogIncludesLabel(
        state.catalogs.qualifications.map((qualification) => qualification.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }

    const qualification = { id: `qualification-${createId()}`, label };
    const committed = await commitStateMutation(() => {
      state.catalogs.qualifications.push(qualification);
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
      state.employees.forEach((employee) => {
        employee.qualifications[qualification.id] = false;
      });
    });
    if (!committed) return;
    elements.newQualification.value = "";
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde hinzugefügt.");
  }

  function handleProfessionCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-profession-index]");
    if (!button || !row) return;
    const index = Number(row.dataset.professionIndex);
    if (button.dataset.catalogAction === "save-profession") {
      saveProfession(index, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-profession") deleteProfession(index);
  }

  function handleQualificationCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-qualification-id]");
    if (!button || !row) return;
    if (button.dataset.catalogAction === "save-qualification") {
      saveQualification(row.dataset.qualificationId, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-qualification") {
      deleteQualification(row.dataset.qualificationId);
    }
  }

  async function saveProfession(index, nextValue) {
    const previousValue = state.catalogs.professions[index];
    const profession = normalizeProfession(nextValue);
    if (!previousValue || !profession) {
      showToast("Die Berufsbezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      profession.toLocaleLowerCase("de-DE") !==
        previousValue.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(state.catalogs.professions, profession)
    ) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.catalogs.professions[index] = profession;
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
      state.employees.forEach((employee) => {
        if (employee.profession === previousValue) {
          employee.profession = profession;
          employee.updatedAt = now;
        }
      });
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Berufsbezeichnung wurde aktualisiert.");
  }

  function deleteProfession(index) {
    const profession = state.catalogs.professions[index];
    if (!profession) return;
    const assignmentCount = state.employees.filter(
      (employee) => employee.profession === profession,
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Der Beruf ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Beruf löschen?",
      message: `„${profession}“ wird aus dem Berufskatalog entfernt.`,
      acceptLabel: "Beruf löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.professions.splice(index, 1);
        }, { undo: "Beruf gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Beruf wurde gelöscht.");
      },
    });
  }

  async function saveQualification(id, nextValue) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    const label = String(nextValue || "").trim();
    if (
      LEADERSHIP_QUALIFICATION_IDS.includes(id) &&
      label !== DEFAULT_QUALIFICATIONS[id]
    ) {
      showToast(
        "Die Leitungsfunktionen sind feste Systemqualifikationen und können nicht umbenannt werden.",
        "error",
      );
      renderCatalogManagement();
      return;
    }
    if (!qualification || !label) {
      showToast("Die Bezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      label.toLocaleLowerCase("de-DE") !==
        qualification.label.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(
        state.catalogs.qualifications.map((item) => item.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }
    const committed = await commitStateMutation(() => {
      qualification.label = label;
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde aktualisiert.");
  }

  function deleteQualification(id) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    if (!qualification) return;
    if (LEADERSHIP_QUALIFICATION_IDS.includes(id)) {
      showToast(
        "Die Leitungsfunktionen werden für die Dienstwochenendzuweisung benötigt und können nicht gelöscht werden.",
        "error",
      );
      return;
    }
    const assignmentCount = state.employees.filter(
      (employee) => employee.qualifications[id],
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Die Zusatzqualifikation ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Zusatzqualifikation löschen?",
      message: `„${qualification.label}“ wird aus dem Katalog entfernt.`,
      acceptLabel: "Qualifikation löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.qualifications = state.catalogs.qualifications.filter(
            (item) => item.id !== id,
          );
          state.employees.forEach((employee) => {
            delete employee.qualifications[id];
            delete employee.qualificationExpiries[id];
          });
        }, { undo: "Zusatzqualifikation gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Zusatzqualifikation wurde gelöscht.");
      },
    });
  }

  function catalogIncludesLabel(values, candidate) {
    const normalizedCandidate = candidate.toLocaleLowerCase("de-DE");
    return values.some(
      (value) => value.toLocaleLowerCase("de-DE") === normalizedCandidate,
    );
  }

  function renderDashboardGreeting(now = new Date()) {
    const hour = now.getHours();
    const salutation =
      hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
    const firstName = getCurrentUserFirstName();
    elements.dashboardGreeting.textContent = firstName
      ? `${salutation}, ${firstName}!`
      : `${salutation}!`;
  }

  function getCurrentUserFirstName() {
    if (!currentUser?.username) return "";
    const usernameKey = currentUser.username.toLocaleLowerCase("de-DE");
    const linkedEmployee = state.employees.find(
      (employee) =>
        employee.username?.toLocaleLowerCase("de-DE") === usernameKey,
    );
    if (linkedEmployee?.firstName?.trim()) return linkedEmployee.firstName.trim();

    const employeeCode = usernameKey.replace(/\d+$/, "");
    const matchingEmployee = state.employees.find((employee) =>
      normalizeCompactLookupValue(employee.lastName).startsWith(employeeCode),
    );
    return (
      matchingEmployee?.firstName?.trim() ||
      USER_FIRST_NAME_FALLBACKS[usernameKey] ||
      currentUser.username
    );
  }

  function normalizeCompactLookupValue(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "");
  }

  function projectBuildNumber() {
    return [PROJECT_VERSION.major, PROJECT_VERSION.minor, PROJECT_VERSION.patch]
      .map((part) => String(part || 0))
      .join(".");
  }

  function renderProjectMetadata() {
    const buildNumber = projectBuildNumber();
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${buildNumber}`;
    elements.loginProjectVersion.textContent = `Version ${buildNumber}`;
  }

  function renderSidebarSystemStatus() {
    if (!elements.sidebarSystemStatus) return;
    const localMode = !isMariaDbMode();
    const status = localMode ? "local" : backendConnectionStatus;
    const rows = [...elements.sidebarSystemStatus.querySelectorAll("dl > div")];
    const terms = rows.map((row) => row.querySelector("dt"));
    const remoteTerms = ["Backend", "Server", "Revision", "DB-Schema"];
    terms.forEach((term, index) => {
      if (term) term.textContent = remoteTerms[index];
      if (rows[index]) rows[index].hidden = false;
    });
    elements.sidebarSystemStatus.classList.toggle("is-local", status === "local");
    elements.sidebarSystemStatus.classList.toggle(
      "is-connected",
      status === "connected",
    );
    elements.sidebarSystemStatus.classList.toggle("is-error", status === "error");

    if (localMode) {
      elements.sidebarConnectionLabel.textContent = "Lokal bereit";
      if (terms[0]) terms[0].textContent = "Speicherort";
      if (terms[1]) terms[1].textContent = "Zuletzt gespeichert";
      rows.slice(2).forEach((row) => {
        row.hidden = true;
      });
      elements.sidebarBackendLabel.textContent = "Dieses Browserprofil";
      elements.sidebarServerLabel.textContent = localLastSaveAt
        ? formatSidebarStatusDateTime(localLastSaveAt)
        : "Noch nicht erfasst";
      elements.sidebarSyncLabel.textContent =
        "Automatische lokale Speicherung aktiv";
      elements.sidebarServerLabel.title = "";
      elements.sidebarSyncLabel.title = "";
      updateSidebarFooterSummaries();
      return;
    }

    const statusLabels = {
      checking: "Verbindung wird geprüft",
      connected: "MariaDB verbunden",
      warning: "Backend prüfen",
      error: "Server nicht erreichbar",
    };
    elements.sidebarConnectionLabel.textContent =
      statusLabels[status] || "MariaDB konfiguriert";
    elements.sidebarBackendLabel.textContent =
      backendHealth?.storageModel === "relational"
        ? "MariaDB · relational"
        : "MariaDB";
    const serverLabel = backendServerLabel();
    elements.sidebarServerLabel.textContent = serverLabel;
    elements.sidebarServerLabel.title = backendConfig.apiUrl || serverLabel;
    elements.sidebarRevisionLabel.textContent =
      remoteRevision || backendHealth?.revision
        ? String(remoteRevision || backendHealth.revision)
        : "–";
    elements.sidebarSchemaLabel.textContent =
      backendHealth?.databaseSchemaVersion == null
        ? "–"
        : String(backendHealth.databaseSchemaVersion);

    let detail = "Noch kein Serverkontakt";
    if (status === "checking") detail = "Serverstatus wird abgerufen …";
    else if (status === "error") {
      detail = backendConnectionError || "Verbindung fehlgeschlagen";
    } else if (backendLastSyncAt) {
      detail = `Letzter Abgleich ${formatSidebarStatusTime(backendLastSyncAt)}`;
    } else if (backendLastContactAt) {
      detail = `Server geprüft ${formatSidebarStatusTime(backendLastContactAt)}`;
    }
    elements.sidebarSyncLabel.textContent = detail;
    elements.sidebarSyncLabel.title = detail;
    // Eingeklappt bleibt vom Block nur der Punkt - der Kurzhinweis muss den
    // neuen Stand mittragen, auch wenn sonst nichts neu aufgebaut wurde.
    updateSidebarFooterSummaries();
  }

  function backendServerLabel() {
    try {
      return new URL(backendConfig.apiUrl).host;
    } catch {
      return backendConfig.apiUrl || "nicht konfiguriert";
    }
  }

  function formatSidebarStatusTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatSidebarStatusDateTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function markBackendConnected({ health = null, synchronized = false } = {}) {
    if (health) backendHealth = health;
    backendConnectionStatus =
      backendHealth &&
      (backendHealth.storageModel !== "relational" ||
        !Number.isSafeInteger(Number(backendHealth.databaseSchemaVersion)))
        ? "warning"
        : "connected";
    backendConnectionError = "";
    backendLastContactAt = new Date().toISOString();
    if (synchronized) backendLastSyncAt = backendLastContactAt;
    renderSidebarSystemStatus();
  }

  function markBackendConnectionError(error) {
    backendConnectionStatus = "error";
    backendConnectionError =
      error?.message || "Der TeO-Server ist nicht erreichbar.";
    renderSidebarSystemStatus();
  }

  async function refreshBackendHealth() {
    if (!isMariaDbMode()) {
      backendConnectionStatus = "local";
      renderSidebarSystemStatus();
      return;
    }
    backendConnectionStatus = "checking";
    renderSidebarSystemStatus();
    try {
      const health = await window.TeOBackend.health(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      markBackendConnected({ health });
    } catch (error) {
      markBackendConnectionError(error);
    }
  }
