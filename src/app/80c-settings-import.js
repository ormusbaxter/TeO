  function renderSettings() {
    elements.settingsBackupReminderDays.value = String(
      state.settings.backupReminderDays,
    );
    elements.settingsMaxBackupFileSizeMb.value = String(
      state.settings.maxBackupFileSizeMb,
    );
    renderBackupVolumeMeter();
    elements.settingsCloseDialogOnOutsideClick.value = state.settings
      .closeDialogOnOutsideClick
      ? "on"
      : "off";
    renderTrainingDurationSettings();
    renderMemoCategorySettings();
    renderSchoolVacationSettings();
    renderVacationSettingsControls();
    elements.settingsStorageBackend.value = backendMode;
    elements.settingsMariaDbApiUrl.value =
      backendConfig.apiUrl ||
      (/^https?:$/.test(window.location.protocol)
        ? window.location.origin
        : "");
    elements.settingsMariaDbPassword.value = "";
    elements.settingsMariaDbBootstrapToken.value = "";
    elements.settingsBackendStatus.classList.toggle(
      "is-remote",
      isMariaDbMode(),
    );
    elements.settingsBackendStatus.classList.remove("is-error");
    elements.settingsBackendStatus.innerHTML = isMariaDbMode()
      ? `<i></i> MariaDB verbunden · Revision ${remoteRevision}`
      : "<i></i> Lokal verbunden";
    renderWeekendSettings();
    renderBackendSelection();
  }

  function renderTrainingDurationSettings() {
    const trainings = [...state.trainings].sort(
      (trainingA, trainingB) =>
        trainingA.title.localeCompare(trainingB.title, "de") ||
        trainingB.year - trainingA.year,
    );
    elements.trainingDurationSettings.innerHTML = trainings.length
      ? trainings
          .map(
            (training) => `
              <label class="training-duration-setting-row">
                <span>
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>Im Katalog seit ${training.year}</small>
                </span>
                <span class="input-suffix">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    value="${training.targetMinutes || ""}"
                    placeholder="Optional"
                    data-training-duration="${training.id}"
                    aria-label="Soll-Zeit für ${escapeHtml(training.title)} in Minuten"
                  />
                  <span>Min.</span>
                </span>
              </label>
            `,
          )
          .join("")
      : `<p class="settings-empty-copy">Legen Sie zuerst eine Pflichtfortbildung an.</p>`;
    elements.saveTrainingDurationsButton.disabled = trainings.length === 0;
  }

  async function saveTrainingDurations() {
    const inputs = [...elements.trainingDurationSettings.querySelectorAll(
      "[data-training-duration]",
    )];
    const invalidInput = inputs.find(
      (input) =>
        input.value.trim() &&
        (!Number.isInteger(Number(input.value)) || Number(input.value) < 1),
    );
    if (invalidInput) {
      invalidInput.setCustomValidity("Bitte ganze Minuten ab 1 eingeben oder das Feld leer lassen.");
      invalidInput.reportValidity();
      invalidInput.setCustomValidity("");
      return;
    }

    const targetMinutesById = new Map(
      inputs.map((input) => [
        input.dataset.trainingDuration,
        input.value.trim() ? Number(input.value) : null,
      ]),
    );
    const changed = state.trainings.some(
      (training) =>
        (training.targetMinutes || null) !== targetMinutesById.get(training.id),
    );
    if (!changed) {
      showToast("Die Soll-Zeiten sind bereits aktuell.");
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.trainings = state.trainings.map((training) => ({
        ...training,
        targetMinutes: targetMinutesById.get(training.id),
        updatedAt:
          (training.targetMinutes || null) === targetMinutesById.get(training.id)
            ? training.updatedAt
            : now,
      }));
    });
    if (committed) showToast("Soll-Zeiten wurden gespeichert.");
  }

  function renderWeekendSettings() {
    const configurationA = state.settings.serviceWeekends.weekend_a;
    const configurationB = state.settings.serviceWeekends.weekend_b;
    elements.settingsWeekendNameA.value = configurationA.name;
    elements.settingsWeekendNameB.value = configurationB.name;

    const selectedOwnerIds = new Set([
      configurationA.ownerId,
      configurationB.ownerId,
    ]);
    const ownerOptions = state.employees
      .filter(
        (employee) =>
          (employee.employmentStatus !== "inactive" &&
            isWeekendLeadership(employee)) ||
          selectedOwnerIds.has(employee.id),
      )
      .sort(sortEmployees)
      .map(
        (employee) =>
          `<option value="${escapeHtml(employee.id)}">${escapeHtml(
            fullName(employee),
          )}${
            employee.employmentStatus === "inactive" ? " (inaktiv)" : ""
          }${
            !isWeekendLeadership(employee)
              ? " (keine Leitungsfunktion)"
              : ""
          }</option>`,
      )
      .join("");
    const options =
      '<option value="">Person auswählen</option>' + ownerOptions;
    elements.settingsWeekendOwnerA.innerHTML = options;
    elements.settingsWeekendOwnerB.innerHTML = options;
    elements.settingsWeekendOwnerA.value = configurationA.ownerId;
    elements.settingsWeekendOwnerB.value = configurationB.ownerId;
    updateWeekendNamePreviews();
  }

  function updateWeekendNamePreviews() {
    const ownerA = getEmployee(elements.settingsWeekendOwnerA.value);
    const ownerB = getEmployee(elements.settingsWeekendOwnerB.value);
    elements.settingsWeekendNameA.value = ownerA?.firstName || "";
    elements.settingsWeekendNameB.value = ownerB?.firstName || "";
  }

  async function saveWeekendSettings() {
    const ownerA = elements.settingsWeekendOwnerA.value;
    const ownerB = elements.settingsWeekendOwnerB.value;
    if (!ownerA || !ownerB) {
      showToast(
        "Bitte jedem Dienstwochenende eine verantwortliche Person zuweisen.",
        "error",
      );
      (!ownerA
        ? elements.settingsWeekendOwnerA
        : elements.settingsWeekendOwnerB
      ).focus();
      return;
    }
    if (ownerA === ownerB) {
      showToast(
        "Die beiden Dienstwochenenden benötigen unterschiedliche verantwortliche Personen.",
        "error",
      );
      elements.settingsWeekendOwnerB.focus();
      return;
    }
    const ownerEmployeeA = getEmployee(ownerA);
    const ownerEmployeeB = getEmployee(ownerB);
    if (!ownerEmployeeA || !ownerEmployeeB) {
      showToast("Eine ausgewählte Person ist nicht mehr vorhanden.", "error");
      renderWeekendSettings();
      return;
    }
    if (
      !isWeekendLeadership(ownerEmployeeA) ||
      !isWeekendLeadership(ownerEmployeeB)
    ) {
      showToast(
        "Als Verantwortliche können nur Stationsleitungen oder stellvertretende Stationsleitungen ausgewählt werden.",
        "error",
      );
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.settings.serviceWeekends = {
        weekend_a: {
          name: ownerEmployeeA.firstName.slice(0, 50),
          ownerId: ownerA,
        },
        weekend_b: {
          name: ownerEmployeeB.firstName.slice(0, 50),
          ownerId: ownerB,
        },
      };
      [
        ["weekend_a", ownerA],
        ["weekend_b", ownerB],
      ].forEach(([weekend, ownerId]) => {
        const owner = state.employees.find(
          (employee) => employee.id === ownerId,
        );
        if (owner && owner.serviceWeekend !== weekend) {
          owner.serviceWeekend = weekend;
          owner.updatedAt = now;
        }
      });
    });
    if (committed) {
      showToast("Dienstwochenenden und Verantwortliche wurden gespeichert.");
    }
  }

  function renderBackendSelection() {
    const selectedBackend = elements.settingsStorageBackend.value;
    const mariaDbSelected = selectedBackend === "mariadb";
    elements.mariaDbSettingsFields.hidden = !mariaDbSelected;
    elements.testBackendConnectionButton.hidden = !mariaDbSelected;
    elements.applyStorageBackendButton.hidden =
      selectedBackend === "local" && !isMariaDbMode();
    elements.applyStorageBackendButton.textContent =
      selectedBackend === "local"
        ? "Lokalen Modus aktivieren"
        : isMariaDbMode()
          ? "MariaDB neu verbinden"
          : "MariaDB aktivieren";
    elements.settingsBackendHint.textContent = mariaDbSelected
      ? "Beim ersten Verbinden wird der aktuelle lokale Datenbestand nach MariaDB übertragen. Enthält der Server bereits Daten, werden diese nach erfolgreicher Anmeldung geladen."
      : isMariaDbMode()
        ? "Beim Wechsel in den lokalen Modus wird der aktuelle Serverdatenbestand als lokale Kopie gespeichert."
        : "Die Daten werden ausschließlich in diesem Browserprofil gespeichert.";
  }

  async function testBackendConnection() {
    if (!requireAdmin()) return;
    const apiUrl = window.TeOBackend.normalizeApiUrl(
      elements.settingsMariaDbApiUrl.value,
    );
    if (!apiUrl) {
      showToast("Bitte die Adresse des TeO-Servers eingeben.", "error");
      elements.settingsMariaDbApiUrl.focus();
      return;
    }

    setBackendButtonsBusy(true);
    try {
      // Ohne angemeldete Sitzung meldet der Server nur seine Erreichbarkeit.
      // Die Datenrevision erscheint deshalb erst, wenn bereits eine Sitzung
      // besteht - der Verbindungstest selbst kommt ohne sie aus.
      const health = await window.TeOBackend.health(
        apiUrl,
        apiUrl === backendConfig.apiUrl ? window.TeOBackend.readToken() : "",
      );
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnected({ health });
      }
      elements.settingsBackendStatus.classList.remove("is-error");
      elements.settingsBackendStatus.innerHTML =
        health.initialized === undefined
          ? "<i></i> Server erreichbar"
          : health.initialized
            ? `<i></i> Server erreichbar · Datenrevision ${health.revision}`
            : "<i></i> Server erreichbar · noch nicht eingerichtet";
      showToast("Verbindung zum TeO-Server wurde erfolgreich geprüft.");
    } catch (error) {
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnectionError(error);
      }
      elements.settingsBackendStatus.classList.add("is-error");
      elements.settingsBackendStatus.innerHTML =
        "<i></i> Server nicht erreichbar";
      showToast(error.message || "Verbindungstest fehlgeschlagen.", "error");
    } finally {
      setBackendButtonsBusy(false);
    }
  }

  async function applyStorageBackend() {
    if (!requireAdmin()) return;
    const selectedBackend = elements.settingsStorageBackend.value;
    if (selectedBackend === "local") {
      if (!isMariaDbMode()) return;
      requestConfirmation({
        title: "In den lokalen Modus wechseln?",
        message:
          "Der aktuelle MariaDB-Datenbestand wird als lokale Kopie in diesem Browser gespeichert. Weitere Änderungen werden anschließend nicht mehr mit dem Server geteilt.",
        acceptLabel: "Lokal weiterarbeiten",
        callback: switchToLocalBackend,
      });
      return;
    }

    const apiUrl = window.TeOBackend.normalizeApiUrl(
      elements.settingsMariaDbApiUrl.value,
    );
    const password = elements.settingsMariaDbPassword.value;
    if (!apiUrl) {
      showToast("Bitte die Adresse des TeO-Servers eingeben.", "error");
      elements.settingsMariaDbApiUrl.focus();
      return;
    }
    if (!password) {
      showToast("Bitte das aktuelle Administratorpasswort eingeben.", "error");
      elements.settingsMariaDbPassword.focus();
      return;
    }

    setBackendButtonsBusy(true);
    try {
      // Ob der Server bereits einen Datenbestand hat, sagt er selbst: Die
      // Anmeldung antwortet auf einer leeren Datenbank mit "not_initialized".
      // Deshalb erst anmelden und nur im Bedarfsfall einrichten - so verlangt
      // der Weg den Einrichtungsschluessel nur dort, wo er wirklich noetig
      // ist, und der Server muss den Einrichtungsstand nicht offenlegen.
      const bootstrapToken = elements.settingsMariaDbBootstrapToken.value.trim();
      let initialized = true;
      let result;
      try {
        result = await window.TeOBackend.login(
          apiUrl,
          currentUser.username,
          password,
        );
      } catch (error) {
        if (error?.code !== "not_initialized") throw error;
        initialized = false;
        result = await window.TeOBackend.bootstrap(
          apiUrl,
          state,
          currentUser.username,
          password,
          bootstrapToken,
        );
      }

      await dataStore.setItem(STORAGE_KEY, state);
      backendConfig = window.TeOBackend.writeConfig({
        mode: "mariadb",
        apiUrl,
      });
      backendMode = "mariadb";
      remoteRevision = Number(result.revision) || 1;
      window.TeOBackend.writeToken(result.token);
      // Revision und Schemastand liefert der Server erst der angemeldeten
      // Sitzung, deshalb erst jetzt abfragen. Bleibt die Auskunft aus, gilt
      // die Verbindung trotzdem als hergestellt.
      const health = await window.TeOBackend
        .health(apiUrl, result.token)
        .catch(() => null);
      markBackendConnected(
        health ? { health, synchronized: true } : { synchronized: true },
      );
      state = normalizeState(result.state);
      clearUndoHistory();
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      backendStartupError = "";
      const remoteUser = state.users.find(
        (user) => user.id === result.user?.id,
      );
      if (!remoteUser) {
        throw new Error("Das Administratorkonto fehlt im MariaDB-Datenbestand.");
      }
      elements.settingsMariaDbPassword.value = "";
      elements.settingsMariaDbBootstrapToken.value = "";
      // completeLogin setzt das Farbthema des Kontos.
      completeLogin(remoteUser);
      showView("settings", false);
      showToast(
        initialized
          ? "MariaDB wurde verbunden und der Serverdatenbestand geladen."
          : "MariaDB wurde eingerichtet und der lokale Datenbestand übertragen.",
      );
    } catch (error) {
      console.error("MariaDB konnte nicht aktiviert werden.", error);
      showToast(error.message || "MariaDB konnte nicht aktiviert werden.", "error");
    } finally {
      setBackendButtonsBusy(false);
    }
  }

  async function switchToLocalBackend() {
    setBackendButtonsBusy(true);
    try {
      await dataStore.setItem(STORAGE_KEY, state);
      await window.TeOBackend.logout(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      window.TeOBackend.writeToken("");
      window.TeOBackend.writeConfig({ mode: "local", apiUrl: "" });
      sessionStorage.removeItem(SESSION_USER_KEY);
      window.location.reload();
    } catch (error) {
      console.error("Lokaler Modus konnte nicht aktiviert werden.", error);
      showToast(
        "Die lokale Kopie konnte nicht gespeichert werden. Der Backendwechsel wurde abgebrochen.",
        "error",
      );
      setBackendButtonsBusy(false);
    }
  }

  function setBackendButtonsBusy(busy) {
    elements.testBackendConnectionButton.disabled = busy;
    elements.applyStorageBackendButton.disabled = busy;
    elements.settingsStorageBackend.disabled = busy;
  }

  async function saveCloseDialogOnOutsideClick(aktiviert) {
    if (!requireAdmin()) {
      renderSettings();
      return;
    }
    if (aktiviert === state.settings.closeDialogOnOutsideClick) return;

    const committed = await commitStateMutation(() => {
      state.settings.closeDialogOnOutsideClick = aktiviert;
    });
    if (!committed) {
      renderSettings();
      return;
    }
    showToast(
      aktiviert
        ? "Ein Klick neben einen Dialog schließt ihn wieder."
        : "Dialoge bleiben bei einem Klick daneben geöffnet.",
    );
  }

  async function saveGeneralSettings() {
    if (!requireAdmin()) return;

    const previousMaxBackupFileSizeMb = state.settings.maxBackupFileSizeMb;
    const backupReminderDays = Number(
      elements.settingsBackupReminderDays.value,
    );
    const maxBackupFileSizeMb = Number(
      elements.settingsMaxBackupFileSizeMb.value,
    );
    if (
      !Number.isInteger(backupReminderDays) ||
      backupReminderDays < 1 ||
      backupReminderDays > 365
    ) {
      showToast(
        "Bitte für die Sicherungserinnerung einen Wert zwischen 1 und 365 Tagen eingeben.",
        "error",
      );
      elements.settingsBackupReminderDays.focus();
      return;
    }

    if (
      !Number.isInteger(maxBackupFileSizeMb) ||
      maxBackupFileSizeMb < MIN_BACKUP_FILE_SIZE_MB ||
      maxBackupFileSizeMb > MAX_BACKUP_FILE_SIZE_MB
    ) {
      showToast(
        `Bitte für die maximale Sicherungsgröße einen Wert zwischen ${MIN_BACKUP_FILE_SIZE_MB} und ${MAX_BACKUP_FILE_SIZE_MB} MB eingeben.`,
        "error",
      );
      elements.settingsMaxBackupFileSizeMb.focus();
      return;
    }

    if (
      backupReminderDays === state.settings.backupReminderDays &&
      maxBackupFileSizeMb === state.settings.maxBackupFileSizeMb
    ) {
      showToast("Die Einstellungen sind bereits aktuell.");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.backupReminderDays = backupReminderDays;
      state.settings.maxBackupFileSizeMb = maxBackupFileSizeMb;
    });
    if (committed) {
      if (maxBackupFileSizeMb !== previousMaxBackupFileSizeMb) {
        automaticBackupRetryAt = 0;
        scheduleAutomaticBackup();
      }
      showToast("Einstellungen wurden gespeichert.");
    }
  }

  function renderBackupStatus() {
    const lastBackupAt = state.settings.lastBackupAt;
    if (!lastBackupAt) {
      elements.backupStatus.textContent =
        "Noch keine Sicherung dokumentiert – bitte zeitnah exportieren.";
      elements.backupStatus.classList.add("is-warning");
      if (!backupReminderShown) {
        backupReminderShown = true;
        showToast("Es wurde noch keine Datensicherung dokumentiert.", "error");
      }
      return;
    }
    const ageDays = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(lastBackupAt)) / 86400000),
    );
    const overdue = ageDays >= state.settings.backupReminderDays;
    elements.backupStatus.textContent = `Letzte Sicherung: ${formatDateTime(
      lastBackupAt,
    )} (${ageDays === 0 ? "heute" : `vor ${ageDays} Tagen`})${
      overdue ? " – neue Sicherung empfohlen" : ""
    }`;
    elements.backupStatus.classList.toggle("is-warning", overdue);
    if (overdue && !backupReminderShown) {
      backupReminderShown = true;
      showToast(
        `Die letzte Datensicherung liegt ${ageDays} Tage zurück. Bitte eine neue Sicherung exportieren.`,
        "error",
      );
    }
  }

  function renderDatabaseSaveWarning() {
    const visible = Boolean(currentUser && databaseSaveReminderArmed);
    elements.databaseSaveWarning.hidden = !visible;
    if (visible) {
      elements.databaseSaveWarningText.textContent =
        "Änderungen wurden automatisch gespeichert, aber noch nicht als Datensicherung exportiert.";
    }
    // Die Warnung teilt sich die oberste Ebene mit den Meldungen: erscheint sie
    // als einzige, muss das Popover geoeffnet werden, verschwindet sie als
    // letzte, wieder geschlossen.
    if (visible) {
      syncNotificationLayer();
      return;
    }
    if (
      !elements.toastRegion.childElementCount &&
      typeof elements.notificationStack.hidePopover === "function" &&
      elements.notificationStack.matches(":popover-open")
    ) {
      elements.notificationStack.hidePopover();
    }
  }

  async function renderBrowserStorageStatus() {
    if (isMariaDbMode()) {
      elements.browserStorageStatus.textContent =
        `Zentraler Datenspeicher: MariaDB über ${backendConfig.apiUrl} · Revision ${remoteRevision}.`;
      elements.requestPersistentStorageButton.hidden = true;
      return;
    }

    const browserStorage = navigator.storage;
    const persistSupported = typeof browserStorage?.persist === "function";

    if (typeof browserStorage?.estimate !== "function") {
      elements.browserStorageStatus.textContent =
        "Speicherinformationen werden von diesem Browser nicht unterstützt.";
      elements.requestPersistentStorageButton.hidden = true;
      return;
    }

    elements.browserStorageStatus.textContent = "Browserspeicher wird ermittelt …";

    try {
      const [estimate, persistent] = await Promise.all([
        browserStorage.estimate(),
        typeof browserStorage.persisted === "function"
          ? browserStorage.persisted()
          : Promise.resolve(false),
      ]);
      const usage = formatStorageSize(estimate.usage || 0);
      const quota = estimate.quota
        ? `von geschätzt ${formatStorageSize(estimate.quota)}`
        : "bei unbekanntem Kontingent";
      const persistenceLabel = persistent
        ? "dauerhaft geschützt"
        : browserPersistenceNotice || "Best-Effort-Speicher";

      elements.browserStorageStatus.textContent =
        `Browserspeicher: ${usage} ${quota} verwendet · ${persistenceLabel}.`;
      elements.requestPersistentStorageButton.hidden =
        persistent || !persistSupported;
      elements.requestPersistentStorageButton.disabled = false;
    } catch (error) {
      console.warn("Browserspeicher konnte nicht ermittelt werden.", error);
      elements.browserStorageStatus.textContent =
        "Browserspeicher konnte nicht ermittelt werden.";
      elements.requestPersistentStorageButton.hidden = !persistSupported;
      elements.requestPersistentStorageButton.disabled = false;
    }
  }

  async function requestPersistentBrowserStorage() {
    const browserStorage = navigator.storage;
    if (typeof browserStorage?.persist !== "function") {
      showToast(
        "Dauerhafter Browserspeicher wird von diesem Browser nicht unterstützt.",
        "error",
      );
      await renderBrowserStorageStatus();
      return;
    }

    elements.requestPersistentStorageButton.disabled = true;
    try {
      const granted = await browserStorage.persist();
      if (granted) {
        browserPersistenceNotice = "";
        await renderBrowserStorageStatus();
        showToast("Dauerhafter Browserspeicher wurde aktiviert.");
      } else {
        browserPersistenceNotice = persistentStorageDenialExplanation();
        await renderBrowserStorageStatus();
        showToast(browserPersistenceNotice, "warning");
      }
    } catch (error) {
      console.warn(
        "Dauerhafter Browserspeicher konnte nicht angefordert werden.",
        error,
      );
      elements.requestPersistentStorageButton.disabled = false;
      showToast(
        "Dauerhafter Browserspeicher konnte nicht angefordert werden.",
        "error",
      );
      await renderBrowserStorageStatus();
    }
  }

  function persistentStorageDenialExplanation() {
    if (!window.isSecureContext) {
      return "Nicht dauerhaft geschützt: Bitte TeO über HTTPS oder localhost aufrufen.";
    }
    return "Nicht dauerhaft geschützt: Der Browser hat automatisch entschieden und keine Freigabe erteilt.";
  }

  function parseBackup(fileContent) {
    let backup;
    try {
      backup = JSON.parse(fileContent);
    } catch {
      throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
    }

    if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
      throw new Error("Die ausgewählte Datei ist keine gültige TeO-Sicherung.");
    }
    if (backup.format !== BACKUP_FORMAT || backup.formatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error("Das Format dieser Sicherungsdatei wird nicht unterstützt.");
    }
    if (Number(backup.appVersion) > STATE_VERSION) {
      throw new Error("Die Sicherung stammt aus einer neueren Anwendungsversion.");
    }

    const importedData = backup.data;
    const collections = [
      "employees",
      "trainings",
      "completions",
      "meetings",
      "meetingAttendances",
    ];
    if (Number(backup.appVersion) >= 15) collections.push("appointments");
    if (Number(backup.appVersion) >= 17) {
      collections.push("devices", "deviceInstructions");
    }
    if (Number(backup.appVersion) >= 25) collections.push("memos");
    const vacationCollections = ["vacationEntitlements", "vacationDays"];
    if (
      !importedData ||
      typeof importedData !== "object" ||
      collections.some((collection) => !Array.isArray(importedData[collection])) ||
      (Number(backup.appVersion) >= 5 && !Array.isArray(importedData.users)) ||
      (Number(backup.appVersion) >= 6 &&
        (!importedData.catalogs ||
          !Array.isArray(importedData.catalogs.professions) ||
          !Array.isArray(importedData.catalogs.qualifications))) ||
      (Number(backup.appVersion) >= 25 &&
        !Array.isArray(importedData.catalogs?.memoCategories)) ||
      (Number(backup.appVersion) >= 7 && !Array.isArray(importedData.auditLog)) ||
      (Number(backup.appVersion) >= 9 &&
        vacationCollections.some(
          (collection) => !Array.isArray(importedData[collection]),
        )) ||
      (Number(backup.appVersion) >= 10 &&
        importedData.vacationDays.some(
          (entry) => !Object.hasOwn(PLANNER_ENTRY_TYPES, entry?.type),
        ))
    ) {
      throw new Error("Die Sicherungsdatei ist unvollständig oder beschädigt.");
    }

    const normalizedState = normalizeState(importedData);
    if (
      collections.some(
        (collection) => normalizedState[collection].length !== importedData[collection].length,
      ) ||
      (Array.isArray(importedData.users) &&
        normalizedState.users.length !== importedData.users.length) ||
      (Number(backup.appVersion) >= 6 &&
        (normalizedState.catalogs.professions.length !==
          importedData.catalogs.professions.length ||
          normalizedState.catalogs.qualifications.length !==
            importedData.catalogs.qualifications.length)) ||
      (Number(backup.appVersion) >= 25 &&
        normalizedState.catalogs.memoCategories.length !==
          importedData.catalogs.memoCategories.length) ||
      (Number(backup.appVersion) >= 7 &&
        normalizedState.auditLog.length !==
          Math.min(importedData.auditLog.length, MAX_AUDIT_LOG_ENTRIES)) ||
      (Number(backup.appVersion) >= 9 &&
        vacationCollections.some(
          (collection) =>
            normalizedState[collection].length !== importedData[collection].length,
        ))
    ) {
      throw new Error("Die Sicherungsdatei enthält beschädigte oder unvollständige Datensätze.");
    }

    const validation = window.TeOStateSchema?.validateStateShape(normalizedState, {
      maxBytes: configuredBackupMaxBytes(),
      requireAdmin: normalizedState.users.length > 0,
      maxAuditEntries: MAX_AUDIT_LOG_ENTRIES,
    });
    if (!validation?.valid) {
      throw new Error(
        `Die Sicherungsdatei ist ungültig: ${
          validation?.issues?.[0] || "Datenprüfung nicht verfügbar."
        }`,
      );
    }

    return normalizedState;
  }

  async function importDatabase(
    importedState,
    { adoptUsers = false, resumeSession = true } = {},
  ) {
    const previousState = state;
    // Beim Import von Hand sind Benutzerkonten bewusst nicht Teil des Vorgangs:
    // Er ersetzt den fachlichen Datenbestand, die Anmeldung bleibt davon
    // unberührt. Nur auf einem System ohne jedes Konto werden die Konten aus der
    // Sicherung übernommen, damit eine Wiederherstellung von Grund auf möglich
    // bleibt. Der Startabgleich verlangt dagegen ausdrücklich die Konten aus der
    // Datei: Dort ist die gemeinsame Datei der Datenbestand, nicht ein Teil davon.
    const preservedUsers = Array.isArray(previousState?.users)
      ? previousState.users
      : [];
    const usersFromBackup = adoptUsers || preservedUsers.length === 0;
    if (!usersFromBackup) {
      importedState.users = preservedUsers;
    }
    // Im MariaDB-Modus fuehrt der Server das Aenderungsprotokoll, und ein
    // normales Konto kann es nur ergaenzen. Die Eintraege einer Sicherung kaemen
    // dort als neue an, unter dem Namen des importierenden Kontos - sie bleiben
    // deshalb draussen, wie die Benutzerkonten.
    if (isMariaDbMode() && currentUser && !isAdmin()) {
      importedState.auditLog = previousState.auditLog;
    }
    state = importedState;
    if (!(await persistState())) {
      state = previousState;
      renderAll();
      return false;
    }
    // Die gemerkten Schritte gehoeren zum Bestand vor dem Import.
    clearUndoHistory();
    stateMutationSequence += 1;
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);

    resetListFilters();
    selectedCompletionEmployeeIds.clear();
    selectedEmployeeIds.clear();
    attendanceDraft.clear();
    if (!resumeSession) return true;
    currentUser = state.users.find((user) => user.id === currentUser?.id) || null;
    if (!currentUser) {
      showLoginDialog();
      elements.loginError.textContent =
        "Ihr Konto ist im gemeinsamen Datenbestand nicht enthalten. Bitte melden Sie sich mit einem dort geführten Konto an.";
      return false;
    }
    // Nach dem Auffrischen des Kontos, damit das Farbthema aus der Sicherung
    // greift.
    applyTheme(activeThemeKey());
    renderAll();
    // Der Startabgleich meldet sich selbst; eine zweite Meldung ueber dieselbe
    // Uebernahme waere nur Rauschen.
    if (!adoptUsers) {
      showToast(
        usersFromBackup
          ? "Die Datensicherung wurde einschließlich der Benutzerkonten importiert."
          : "Die Datensicherung wurde importiert. Die Benutzerkonten sind unverändert.",
      );
    }
    return true;
  }
