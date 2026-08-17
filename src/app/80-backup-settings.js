  function requestConfirmation({ title, message, acceptLabel, callback, tone = "danger" }) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmAccept.textContent = acceptLabel;
    elements.confirmAccept.classList.toggle("button-danger", tone === "danger");
    elements.confirmAccept.classList.toggle("button-primary", tone === "primary");
    confirmCallback = callback;
    elements.confirmDialog.showModal();
    window.setTimeout(() => elements.confirmCancel.focus(), 0);
  }

  function normalizeAutomaticBackupSettings(value = {}) {
    const parsedLastBackupAt = Date.parse(value.lastBackupAt);
    const parsedLastBackupSizeBytes = Number(value.lastBackupSizeBytes);
    const keyFingerprint = String(value.keyFingerprint || "").slice(0, 200);
    const keyEnvelopes = Object.fromEntries(
      Object.entries(value.keyEnvelopes || {})
        .filter(
          ([userId, envelope]) =>
            String(userId).length > 0 &&
            envelope &&
            envelope.format === `${BACKUP_FORMAT}-verschluesselt` &&
            typeof envelope.salt === "string" &&
            typeof envelope.iv === "string" &&
            typeof envelope.ciphertext === "string",
        )
        .slice(0, 500),
    );
    return {
      enabled: Boolean(value.enabled),
      encrypted: Boolean(value.encrypted && keyFingerprint),
      keyFingerprint,
      keyEnvelopes,
      lastBackupAt: Number.isFinite(parsedLastBackupAt)
        ? new Date(parsedLastBackupAt).toISOString()
        : "",
      lastBackupSizeBytes:
        Number.isSafeInteger(parsedLastBackupSizeBytes) &&
        parsedLastBackupSizeBytes >= 0
          ? parsedLastBackupSizeBytes
          : 0,
      directoryName: String(value.directoryName || "").trim().slice(0, 200),
    };
  }

  async function loadAutomaticBackupConfiguration() {
    automaticBackupSettings = normalizeAutomaticBackupSettings();
    try {
      const [savedSettings, savedHandle] = await Promise.all([
        dataStore.getItem(AUTO_BACKUP_CONFIG_KEY),
        dataStore.getItem(AUTO_BACKUP_DIRECTORY_KEY),
      ]);
      automaticBackupSettings = normalizeAutomaticBackupSettings(savedSettings);
      automaticBackupDirectoryHandle =
        savedHandle?.kind === "directory" ? savedHandle : null;
      if (!automaticBackupDirectoryHandle) {
        automaticBackupSettings.enabled = false;
      } else {
        automaticBackupSettings.directoryName =
          automaticBackupDirectoryHandle.name ||
          automaticBackupSettings.directoryName;
      }
    } catch (error) {
      console.warn(
        "Die Konfiguration der automatischen Sicherung konnte nicht geladen werden.",
        error,
      );
      automaticBackupDirectoryHandle = null;
      automaticBackupSettings.enabled = false;
      automaticBackupNotice =
        "Die gespeicherte Ordnerverknüpfung konnte nicht geladen werden.";
    }
  }

  async function persistAutomaticBackupConfiguration() {
    await dataStore.setItem(AUTO_BACKUP_CONFIG_KEY, automaticBackupSettings);
  }

  async function selectAutomaticBackupDirectory() {
    if (typeof window.showDirectoryPicker !== "function") {
      automaticBackupNotice =
        "Dieser Browser unterstützt keine direkte Ordnerfreigabe. Verwenden Sie Chrome oder Edge über HTTPS beziehungsweise localhost.";
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "error");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({
        id: "teo-automatic-backup",
        mode: "readwrite",
      });
      await dataStore.setItem(AUTO_BACKUP_DIRECTORY_KEY, handle);
      automaticBackupDirectoryHandle = handle;
      automaticBackupSettings = normalizeAutomaticBackupSettings({
        ...automaticBackupSettings,
        enabled: true,
        directoryName: handle.name,
      });
      automaticBackupNotice = "";
      await persistAutomaticBackupConfiguration();
      renderAutomaticBackupStatus();
      await runAutomaticBackup({ force: true, requestPermission: true });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Der Sicherungsordner konnte nicht gespeichert werden.", error);
      automaticBackupNotice =
        "Der Sicherungsordner konnte nicht verknüpft werden.";
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "error");
    }
  }

  async function removeAutomaticBackupDirectory() {
    clearAutomaticBackupTimer();
    automaticBackupDirectoryHandle = null;
    automaticBackupPassword = "";
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      enabled: false,
      directoryName: "",
    });
    try {
      await Promise.all([
        dataStore.removeItem(AUTO_BACKUP_DIRECTORY_KEY),
        persistAutomaticBackupConfiguration(),
      ]);
      automaticBackupNotice = "";
      renderAutomaticBackupStatus();
      showToast(
        "Die Ordnerverknüpfung wurde entfernt. Vorhandene Sicherungsdateien bleiben erhalten.",
      );
    } catch (error) {
      console.error("Die Ordnerverknüpfung konnte nicht entfernt werden.", error);
      showToast("Die Ordnerverknüpfung konnte nicht entfernt werden.", "error");
    }
  }

  async function saveAutomaticBackupSettings() {
    const encrypted = elements.automaticBackupEncryption.checked;
    if (encrypted && !automaticBackupPassword) {
      const configured = await configureAutomaticBackupEncryption({
        persist: false,
      });
      if (!configured) {
        renderAutomaticBackupStatus();
        return;
      }
    }
    if (!encrypted) automaticBackupPassword = "";
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      enabled: Boolean(automaticBackupDirectoryHandle),
      encrypted,
    });
    try {
      await persistAutomaticBackupConfiguration();
      automaticBackupNotice = "";
      scheduleAutomaticBackup();
      renderAutomaticBackupStatus();
      showToast("Die Einstellungen der automatischen Sicherung wurden gespeichert.");
    } catch (error) {
      console.error("Die Sicherungseinstellungen konnten nicht gespeichert werden.", error);
      showToast("Die Sicherungseinstellungen konnten nicht gespeichert werden.", "error");
    }
  }

  async function configureAutomaticBackupEncryption({ persist = true } = {}) {
    if (automaticBackupSettings.encrypted) {
      if (!automaticBackupPassword) {
        automaticBackupPassword = await requestAutomaticBackupRecoveryKey();
      }
      if (!automaticBackupPassword) return false;
      showAutomaticBackupRecoveryKey();
      renderAutomaticBackupStatus();
      return true;
    }

    const loginPassword = await requestVerifiedAutomaticBackupLoginPassword();
    if (!loginPassword) return false;
    automaticBackupPassword = generateAutomaticBackupRecoveryKey();
    const keyFingerprint = await automaticBackupKeyFingerprint(
      automaticBackupPassword,
    );
    const keyEnvelope = await encryptBackup(
      automaticBackupPassword,
      loginPassword,
    );
    automaticBackupNotice = "";
    elements.automaticBackupEncryption.checked = true;
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      encrypted: true,
      keyFingerprint,
      keyEnvelopes: {
        [currentUser.id]: keyEnvelope,
      },
    });
    if (persist) {
      try {
        await persistAutomaticBackupConfiguration();
      } catch (error) {
        console.error(
          "Die Einstellung zur automatischen Verschlüsselung konnte nicht gespeichert werden.",
          error,
        );
        showToast("Die Verschlüsselungseinstellung konnte nicht gespeichert werden.", "error");
        return false;
      }
      scheduleAutomaticBackup();
      showToast("Die automatische Login-Verschlüsselung wurde eingerichtet.");
    }
    renderAutomaticBackupStatus();
    showAutomaticBackupRecoveryKey();
    return true;
  }

  async function requestVerifiedAutomaticBackupLoginPassword() {
    let errorMessage = "";
    while (true) {
      const password = await requestBackupPassword({
        mode: "automatic",
        errorMessage,
      });
      if (!password) return null;
      if (await verifyAutomaticBackupLoginPassword(password)) return password;
      errorMessage = "Das eingegebene Login-Passwort ist nicht korrekt.";
    }
  }

  async function verifyAutomaticBackupLoginPassword(password) {
    if (!currentUser) return false;
    if (!isMariaDbMode()) return verifyPassword(password, currentUser);
    try {
      const previousToken = window.TeOBackend.readToken();
      const result = await window.TeOBackend.login(
        backendConfig.apiUrl,
        currentUser.username,
        password,
      );
      window.TeOBackend.writeToken(result.token);
      if (previousToken && previousToken !== result.token) {
        void window.TeOBackend.logout(backendConfig.apiUrl, previousToken);
      }
      return true;
    } catch {
      return false;
    }
  }

  function generateAutomaticBackupRecoveryKey() {
    return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  }

  async function automaticBackupKeyFingerprint(key) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(key),
    );
    return bytesToBase64(new Uint8Array(digest));
  }

  async function registerAutomaticBackupUserKey(userId, loginPassword) {
    if (
      !automaticBackupSettings?.encrypted ||
      !automaticBackupPassword ||
      !userId ||
      !loginPassword
    ) {
      return false;
    }
    const keyEnvelope = await encryptBackup(
      automaticBackupPassword,
      loginPassword,
    );
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      keyEnvelopes: {
        ...automaticBackupSettings.keyEnvelopes,
        [userId]: keyEnvelope,
      },
    });
    await persistAutomaticBackupConfiguration();
    return true;
  }

  async function removeAutomaticBackupUserKey(userId) {
    if (!automaticBackupSettings?.keyEnvelopes?.[userId]) return false;
    const keyEnvelopes = { ...automaticBackupSettings.keyEnvelopes };
    delete keyEnvelopes[userId];
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      keyEnvelopes,
    });
    await persistAutomaticBackupConfiguration();
    return true;
  }

  async function unlockAutomaticBackupForLogin(user, loginPassword) {
    if (!automaticBackupSettings?.encrypted) return true;
    const envelope = automaticBackupSettings.keyEnvelopes?.[user.id];
    if (envelope) {
      try {
        const key = await decryptBackup(envelope, loginPassword);
        if (
          (await automaticBackupKeyFingerprint(key)) ===
          automaticBackupSettings.keyFingerprint
        ) {
          automaticBackupPassword = key;
          automaticBackupNotice = "";
          return true;
        }
      } catch {
        // Ein altes Passwort oder eine fehlende Hülle wird über den
        // Wiederherstellungsschlüssel repariert.
      }
    }
    const recoveryKey = await requestAutomaticBackupRecoveryKey();
    if (!recoveryKey) return false;
    automaticBackupPassword = recoveryKey;
    await registerAutomaticBackupUserKey(user.id, loginPassword);
    automaticBackupNotice = "";
    return true;
  }

  async function requestAutomaticBackupRecoveryKey() {
    let errorMessage = "";
    while (true) {
      const key = (
        await requestBackupPassword({ mode: "recovery", errorMessage })
      )?.trim();
      if (!key) return null;
      if (
        (await automaticBackupKeyFingerprint(key)) ===
        automaticBackupSettings.keyFingerprint
      ) {
        return key;
      }
      errorMessage = "Der Wiederherstellungsschlüssel ist nicht korrekt.";
    }
  }

  function showAutomaticBackupRecoveryKey() {
    if (!automaticBackupPassword) return;
    elements.automaticBackupRecoveryKey.value = automaticBackupPassword;
    if (!elements.automaticBackupRecoveryDialog.open) {
      elements.automaticBackupRecoveryDialog.showModal();
    }
    elements.automaticBackupRecoveryKey.focus();
    elements.automaticBackupRecoveryKey.select();
  }

  async function copyAutomaticBackupRecoveryKey() {
    const key = elements.automaticBackupRecoveryKey.value;
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      copyTextWithFallback(key);
    }
    showToast("Wiederherstellungsschlüssel wurde kopiert.");
  }

  function renderAutomaticBackupEncryptionControls() {
    elements.setAutomaticBackupPasswordButton.hidden =
      !elements.automaticBackupEncryption.checked;
    elements.setAutomaticBackupPasswordButton.textContent =
      automaticBackupSettings?.encrypted
        ? automaticBackupPassword
          ? "Wiederherstellungsschlüssel anzeigen"
          : "Wiederherstellungsschlüssel eingeben"
        : "Login-Verschlüsselung einrichten";
  }

  function renderAutomaticBackupStatus() {
    if (!automaticBackupSettings) return;
    elements.automaticBackupEncryption.checked =
      automaticBackupSettings.encrypted;
    renderAutomaticBackupEncryptionControls();
    const supported = typeof window.showDirectoryPicker === "function";
    const connected = Boolean(
      automaticBackupSettings.enabled && automaticBackupDirectoryHandle,
    );
    elements.selectAutomaticBackupDirectoryButton.disabled = !supported;
    const encryptionReady =
      !automaticBackupSettings.encrypted || Boolean(automaticBackupPassword);
    elements.runAutomaticBackupButton.disabled =
      !connected || !encryptionReady || automaticBackupRunning;
    elements.removeAutomaticBackupDirectoryButton.hidden = !automaticBackupDirectoryHandle;
    elements.saveAutomaticBackupSettingsButton.disabled = !supported;

    if (!supported) {
      elements.automaticBackupStatus.textContent =
        "Nicht unterstützt – Chrome oder Edge über HTTPS beziehungsweise localhost verwenden.";
      return;
    }
    if (automaticBackupRunning) {
      elements.automaticBackupStatus.textContent = "Datensicherung wird geschrieben …";
      return;
    }
    if (automaticBackupNotice) {
      elements.automaticBackupStatus.textContent = automaticBackupNotice;
      return;
    }
    if (!connected) {
      elements.automaticBackupStatus.textContent =
        "Noch kein Sicherungsordner ausgewählt.";
      return;
    }
    if (!encryptionReady) {
      elements.automaticBackupStatus.textContent =
        `Ordner: ${automaticBackupSettings.directoryName} · Verschlüsselung aktiv – ` +
        "erneut anmelden oder Wiederherstellungsschlüssel eingeben.";
      return;
    }
    const lastBackup = automaticBackupSettings.lastBackupAt
      ? ` · zuletzt ${formatDateTime(automaticBackupSettings.lastBackupAt)}`
      : " · noch keine automatische Sicherung";
    elements.automaticBackupStatus.textContent =
      `Ordner: ${automaticBackupSettings.directoryName}` +
      `${automaticBackupSettings.encrypted ? " · verschlüsselt" : ""}` +
      lastBackup;
  }

  function clearAutomaticBackupTimer() {
    if (automaticBackupTimer) window.clearTimeout(automaticBackupTimer);
    automaticBackupTimer = null;
  }

  function scheduleAutomaticBackup() {
    clearAutomaticBackupTimer();
    if (
      !currentUser ||
      currentUser.mustChangePassword ||
      !databaseSaveReminderArmed ||
      !automaticBackupSettings?.enabled ||
      !automaticBackupDirectoryHandle ||
      (automaticBackupSettings.encrypted && !automaticBackupPassword)
    ) {
      return;
    }
    const delay = automaticBackupScheduleDelay();
    automaticBackupTimer = window.setTimeout(() => {
      automaticBackupTimer = null;
      void runAutomaticBackup();
    }, Math.min(delay, 2147483647));
  }

  function automaticBackupScheduleDelay(now = Date.now()) {
    const retryDelay = Math.max(0, automaticBackupRetryAt - now);
    return Math.max(AUTO_BACKUP_DELAY_MS, retryDelay);
  }

  async function automaticBackupPermissionGranted(requestPermission = false) {
    const handle = automaticBackupDirectoryHandle;
    if (!handle) return false;
    const descriptor = { mode: "readwrite" };
    if (typeof handle.queryPermission !== "function") return true;
    let permission = await handle.queryPermission(descriptor);
    if (
      permission !== "granted" &&
      requestPermission &&
      typeof handle.requestPermission === "function"
    ) {
      permission = await handle.requestPermission(descriptor);
    }
    return permission === "granted";
  }

  async function runAutomaticBackup({
    force = false,
    requestPermission = false,
  } = {}) {
    const execute = () =>
      performAutomaticBackup({ force, requestPermission });
    if (typeof navigator.locks?.request === "function") {
      return navigator.locks.request("teo-automatic-backup", execute);
    }
    return execute();
  }

  async function performAutomaticBackup({
    force = false,
    requestPermission = false,
  } = {}) {
    if (automaticBackupRunning) return false;
    if (!automaticBackupDirectoryHandle) {
      showToast("Bitte wählen Sie zuerst einen Sicherungsordner aus.", "error");
      return false;
    }
    if (automaticBackupSettings.encrypted && !automaticBackupPassword) {
      automaticBackupNotice =
        "Verschlüsselung aktiv – Passwort für diese Sitzung festlegen.";
      renderAutomaticBackupStatus();
      return false;
    }
    // Merkt sich den Aenderungsstand zu Beginn der Sicherung. Kommt waehrend
    // des Schreibens eine weitere Aenderung dazu, bleibt die Erinnerung an die
    // naechste Sicherung bestehen.
    const mutationSequence = stateMutationSequence;
    if (force) {
      automaticBackupRetryAt = 0;
    } else {
      try {
        const storedSettings = normalizeAutomaticBackupSettings(
          await dataStore.getItem(AUTO_BACKUP_CONFIG_KEY),
        );
        if (
          (Date.parse(storedSettings.lastBackupAt) || 0) >
          (Date.parse(automaticBackupSettings.lastBackupAt) || 0)
        ) {
          automaticBackupSettings.lastBackupAt = storedSettings.lastBackupAt;
        }
      } catch (error) {
        console.warn("Der Sicherungszeitpunkt konnte nicht abgeglichen werden.", error);
      }
      if (!databaseSaveReminderArmed) {
        scheduleAutomaticBackup();
        return false;
      }
    }

    let permissionGranted = false;
    try {
      permissionGranted = await automaticBackupPermissionGranted(requestPermission);
    } catch (error) {
      console.warn("Die Ordnerberechtigung konnte nicht geprüft werden.", error);
    }
    if (!permissionGranted) {
      automaticBackupRetryAt = Date.now() + 60 * 60 * 1000;
      automaticBackupNotice =
        "Ordnerzugriff muss erneut bestätigt werden – „Jetzt automatisch sichern“ wählen.";
      renderAutomaticBackupStatus();
      if (requestPermission) showToast(automaticBackupNotice, "error");
      scheduleAutomaticBackup();
      return false;
    }

    automaticBackupRunning = true;
    automaticBackupNotice = "";
    renderAutomaticBackupStatus();
    try {
      const exportedAt = new Date();
      const exportedState = JSON.parse(JSON.stringify(state));
      exportedState.settings.lastBackupAt = exportedAt.toISOString();
      const backup = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        appVersion: STATE_VERSION,
        exportedAt: exportedAt.toISOString(),
        data: exportedState,
      };
      let fileContent = JSON.stringify(backup, null, 2);
      if (automaticBackupSettings.encrypted) {
        fileContent = JSON.stringify(
          await encryptBackup(fileContent, automaticBackupPassword),
          null,
          2,
        );
      }
      const volume = assessBackupContent(fileContent);
      if (volume.exceeded) {
        const error = new Error(backupVolumeMessage(volume));
        error.code = "backup_volume_exceeded";
        throw error;
      }
      await writeAutomaticBackupFile(
        automaticBackupDirectoryHandle,
        AUTO_BACKUP_FILENAME,
        fileContent,
      );

      // Die Datei liegt geschrieben vor, der Zeitstempel muss aber auch in den
      // Datenbestand. Scheitert das, darf der lokale Stand nicht so tun, als
      // waere gesichert worden - und der vom Server geladene Konfliktstand darf
      // nicht bis zur naechsten Mutation unbeachtet liegen bleiben, sonst
      // verwirft er dort eine Eingabe ohne erkennbaren Zusammenhang.
      const previousLastBackupAt = state.settings.lastBackupAt;
      state.settings.lastBackupAt = exportedAt.toISOString();
      const auditEntryId = appendAuditEntry(
        automaticBackupSettings.encrypted
          ? "Verschlüsselte automatische Datensicherung exportiert"
          : "Automatische Datensicherung exportiert",
      );
      if (!(await persistState())) {
        if (pendingRemoteConflictState) {
          state = pendingRemoteConflictState;
          pendingRemoteConflictState = null;
        } else {
          state.settings.lastBackupAt = previousLastBackupAt;
          state.auditLog = state.auditLog.filter(
            (entry) => entry.id !== auditEntryId,
          );
        }
        const error = new Error(
          "Die Sicherungsdatei wurde geschrieben, der Sicherungszeitpunkt konnte aber nicht gespeichert werden.",
        );
        error.code = "backup_timestamp_not_persisted";
        throw error;
      }
      automaticBackupSettings.lastBackupAt = exportedAt.toISOString();
      automaticBackupSettings.lastBackupSizeBytes = volume.sizeBytes;
      await persistAutomaticBackupConfiguration();
      automaticBackupRetryAt = 0;
      automaticBackupNotice = "";
      databaseSaveReminderArmed = stateMutationSequence !== mutationSequence;
      renderAll();
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : `Automatische Datensicherung „${AUTO_BACKUP_FILENAME}“ wurde aktualisiert.`,
        volume.warning ? "warning" : undefined,
      );
      return true;
    } catch (error) {
      console.error("Die automatische Datensicherung ist fehlgeschlagen.", error);
      automaticBackupRetryAt = Date.now() + 60 * 60 * 1000;
      automaticBackupNotice = [
        "backup_volume_exceeded",
        "backup_timestamp_not_persisted",
      ].includes(error?.code)
        ? error.message
        : "Automatische Sicherung fehlgeschlagen – Ordnerzugriff und freien Speicher prüfen.";
      showToast(automaticBackupNotice, "error");
      return false;
    } finally {
      automaticBackupRunning = false;
      renderAutomaticBackupStatus();
      scheduleAutomaticBackup();
    }
  }

  async function writeAutomaticBackupFile(directoryHandle, filename, content) {
    const fileHandle = await directoryHandle.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(content);
      await writable.close();
    } catch (error) {
      await writable.abort?.();
      throw error;
    }
  }

  function configuredBackupMaxBytes(settings = state?.settings) {
    const configuredMb = Number(settings?.maxBackupFileSizeMb);
    const maxMb =
      Number.isInteger(configuredMb) &&
      configuredMb >= MIN_BACKUP_FILE_SIZE_MB &&
      configuredMb <= MAX_BACKUP_FILE_SIZE_MB
        ? configuredMb
        : DEFAULT_MAX_BACKUP_FILE_SIZE_MB;
    return maxMb * 1024 * 1024;
  }

  function backupVolumeAssessment(sizeBytes, settings = state?.settings) {
    const bytes = Math.max(0, Number(sizeBytes) || 0);
    const maxBytes = configuredBackupMaxBytes(settings);
    const ratio = maxBytes ? bytes / maxBytes : 0;
    return {
      sizeBytes: bytes,
      maxBytes,
      usagePercent: Math.round(ratio * 100),
      warning: ratio >= BACKUP_VOLUME_WARNING_RATIO,
      exceeded: bytes > maxBytes,
    };
  }

  function backupVolumeMessage(assessment) {
    return assessment.exceeded
      ? `Die Sicherungsdatei ist ${formatStorageSize(assessment.sizeBytes)} groß und überschreitet das eingestellte Maximum von ${formatStorageSize(assessment.maxBytes)}.`
      : `Die Sicherungsdatei nutzt ${assessment.usagePercent} % des eingestellten Volumens (${formatStorageSize(assessment.sizeBytes)} von ${formatStorageSize(assessment.maxBytes)}).`;
  }

  function assessBackupContent(fileContent) {
    return backupVolumeAssessment(
      new TextEncoder().encode(fileContent).byteLength,
    );
  }

  function estimatedCurrentBackupSizeBytes() {
    const exportedAt = new Date().toISOString();
    return assessBackupContent(
      JSON.stringify(
        {
          format: BACKUP_FORMAT,
          formatVersion: BACKUP_FORMAT_VERSION,
          appVersion: STATE_VERSION,
          exportedAt,
          data: {
            ...state,
            settings: { ...state.settings, lastBackupAt: exportedAt },
          },
        },
        null,
        2,
      ),
    ).sizeBytes;
  }

  function formatBackupMegabytes(bytes) {
    const megabytes = Math.max(0, Number(bytes) || 0) / (1024 * 1024);
    return numberFormat({
      minimumFractionDigits: megabytes > 0 && megabytes < 1 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(megabytes);
  }

  function renderBackupVolumeMeter(configuredMaxMb = state.settings.maxBackupFileSizeMb) {
    const parsedMaxMb = Number(configuredMaxMb);
    const maxBackupFileSizeMb =
      Number.isInteger(parsedMaxMb) &&
      parsedMaxMb >= MIN_BACKUP_FILE_SIZE_MB &&
      parsedMaxMb <= MAX_BACKUP_FILE_SIZE_MB
        ? parsedMaxMb
        : state.settings.maxBackupFileSizeMb;
    const sizeBytes =
      automaticBackupSettings?.lastBackupSizeBytes ||
      estimatedCurrentBackupSizeBytes();
    const assessment = backupVolumeAssessment(sizeBytes, {
      maxBackupFileSizeMb,
    });
    const percent = Math.min(
      100,
      assessment.maxBytes ? (assessment.sizeBytes / assessment.maxBytes) * 100 : 0,
    );

    elements.backupVolumeMeter.style.setProperty(
      "--backup-volume-percent",
      `${percent}%`,
    );
    elements.backupVolumeMeter.classList.toggle("is-warning", assessment.warning);
    elements.backupVolumeMeter.classList.toggle("is-exceeded", assessment.exceeded);
    elements.backupVolumeMeter.setAttribute(
      "aria-valuenow",
      String(Math.min(100, assessment.usagePercent)),
    );
    elements.backupVolumeMeter.setAttribute("aria-valuemax", "100");
    elements.backupVolumeLabel.textContent =
      `${formatBackupMegabytes(assessment.sizeBytes)} von ${maxBackupFileSizeMb} MB`;
    elements.backupVolumeHint.textContent = assessment.exceeded
      ? "Grenzwert überschritten – maximale Sicherungsgröße erhöhen."
      : assessment.warning
        ? `Volumenwarnung: ${assessment.usagePercent} % der Grenze erreicht.`
        : `Warnung ab ${formatBackupMegabytes(assessment.maxBytes * BACKUP_VOLUME_WARNING_RATIO)} MB (90 %).`;
  }

  async function rememberBackupVolume(sizeBytes) {
    automaticBackupSettings.lastBackupSizeBytes = Math.max(
      0,
      Math.round(Number(sizeBytes) || 0),
    );
    try {
      await persistAutomaticBackupConfiguration();
    } catch (error) {
      console.warn("Das zuletzt gemessene Sicherungsvolumen konnte nicht gespeichert werden.", error);
    }
  }

  async function exportDatabase() {
    await createAndDownloadBackup();
  }

  async function exportEncryptedDatabase() {
    const password = await requestBackupPassword({ mode: "export" });
    if (!password) return;
    try {
      await createAndDownloadBackup({ encrypted: true, password });
    } catch (error) {
      console.error("Verschlüsselte Sicherung fehlgeschlagen.", error);
      showToast(
        "Die verschlüsselte Sicherung wird von diesem Browser nicht unterstützt.",
        "error",
      );
    }
  }

  function requestBackupPassword({ mode, errorMessage = "" }) {
    const exporting = mode === "export";
    const automatic = mode === "automatic";
    const recovery = mode === "recovery";
    elements.backupPasswordForm.reset();
    elements.backupPasswordDialog.dataset.mode = mode;
    elements.backupPasswordDialogTitle.textContent = automatic
      ? "Login-Verschlüsselung einrichten"
      : recovery
        ? "Wiederherstellungsschlüssel eingeben"
      : exporting
        ? "Sicherung verschlüsseln"
        : "Sicherung entschlüsseln";
    elements.backupPasswordDialogDescription.textContent = automatic
      ? "Bestätigen Sie Ihr aktuelles Login-Passwort. TeO verwendet es zum geschützten Hinterlegen des gemeinsamen Sicherungsschlüssels."
      : recovery
        ? "Dieses Konto benötigt einmalig den Wiederherstellungsschlüssel der automatischen Sicherung."
      : exporting
        ? "Schützen Sie den vollständigen Datenbestand mit einem eigenen Passwort."
        : "Diese Sicherungsdatei ist verschlüsselt. Geben Sie das zugehörige Passwort ein.";
    elements.backupPasswordNotice.textContent = automatic
      ? "Das Login-Passwort wird nicht gespeichert. Bei späteren Anmeldungen entsperrt es den Sicherungsschlüssel automatisch."
      : recovery
        ? "Nach erfolgreicher Eingabe wird der Sicherungsschlüssel mit Ihrem Login-Passwort geschützt."
      : exporting
        ? "Das Passwort wird nicht gespeichert und kann nicht wiederhergestellt werden. Bewahren Sie es getrennt von der Sicherungsdatei auf."
        : "Das Passwort wird ausschließlich zur Entschlüsselung dieser Datei verwendet und nicht gespeichert.";
    elements.backupPasswordConfirmationField.hidden = !exporting;
    elements.backupPasswordConfirmation.required = exporting;
    elements.backupPassword.minLength = exporting ? 8 : 1;
    elements.backupPassword.autocomplete = automatic
      ? "current-password"
      : exporting
      ? "new-password"
      : "current-password";
    elements.backupPasswordSubmit.textContent = automatic
      ? "Login bestätigen"
      : recovery
        ? "Schlüssel übernehmen"
      : exporting
        ? "Verschlüsselt exportieren"
        : "Sicherung entsperren";
    elements.backupPasswordError.textContent = errorMessage;
    updateBackupPasswordVisibility();

    return new Promise((resolve) => {
      backupPasswordResolver = resolve;
      elements.backupPasswordDialog.showModal();
      window.setTimeout(() => elements.backupPassword.focus(), 0);
    });
  }

  function handleBackupPasswordSubmit(event) {
    event.preventDefault();
    const mode = elements.backupPasswordDialog.dataset.mode;
    const encrypting = mode === "export";
    const password = elements.backupPassword.value;
    if (encrypting && password.length < 8) {
      elements.backupPasswordError.textContent =
        "Das Sicherungspasswort muss mindestens 8 Zeichen lang sein.";
      elements.backupPassword.focus();
      return;
    }
    if (
      encrypting &&
      password !== elements.backupPasswordConfirmation.value
    ) {
      elements.backupPasswordError.textContent =
        "Die eingegebenen Passwörter stimmen nicht überein.";
      elements.backupPasswordConfirmation.focus();
      return;
    }
    settleBackupPasswordDialog(password);
  }

  function updateBackupPasswordVisibility() {
    const inputType = elements.showBackupPassword.checked ? "text" : "password";
    elements.backupPassword.type = inputType;
    elements.backupPasswordConfirmation.type = inputType;
  }

  function settleBackupPasswordDialog(password) {
    const resolver = backupPasswordResolver;
    backupPasswordResolver = null;
    if (elements.backupPasswordDialog.open) {
      elements.backupPasswordDialog.close();
    }
    resolver?.(password);
  }

  function handleBackupPasswordDialogClose() {
    if (!backupPasswordResolver) return;
    const resolver = backupPasswordResolver;
    backupPasswordResolver = null;
    resolver(null);
  }

  async function createAndDownloadBackup({
    encrypted = false,
    password = "",
    prefix = "datensicherung",
    silent = false,
  } = {}) {
    const exportedAt = new Date();
    const exportedState = JSON.parse(JSON.stringify(state));
    exportedState.settings.lastBackupAt = exportedAt.toISOString();
    const backup = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: STATE_VERSION,
      exportedAt: exportedAt.toISOString(),
      data: exportedState,
    };
    let fileContent = JSON.stringify(backup, null, 2);
    if (encrypted) {
      fileContent = JSON.stringify(await encryptBackup(fileContent, password), null, 2);
    }
    const volume = assessBackupContent(fileContent);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return false;
    }
    downloadTextFile(
      `teo-${prefix}_${fileTimestamp(exportedAt)}${
        encrypted ? ".verschluesselt" : ""
      }.json`,
      fileContent,
      "application/json;charset=utf-8",
    );
    await rememberBackupVolume(volume.sizeBytes);
    state.settings.lastBackupAt = exportedAt.toISOString();
    appendAuditEntry(
      encrypted
        ? "Verschlüsselte Datensicherung exportiert"
        : "Datensicherung exportiert",
    );
    await persistState();
    databaseSaveReminderArmed = false;
    renderAll();
    if (!silent) {
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : encrypted
            ? "Die verschlüsselte Datensicherung wurde exportiert."
            : "Die vollständige Datensicherung wurde exportiert.",
        volume.warning ? "warning" : undefined,
      );
    }
    return true;
  }

  function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  }

  function fileTimestamp(date) {
    return date
      .toISOString()
      .replace("T", "_")
      .replaceAll(":", "-")
      .slice(0, 19);
  }

  async function encryptBackup(plainText, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plainText),
    );
    return {
      format: `${BACKUP_FORMAT}-verschluesselt`,
      formatVersion: 1,
      algorithm: "AES-GCM",
      keyDerivation: "PBKDF2-SHA-256",
      iterations: 250000,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };
  }

  async function decryptBackup(envelope, password) {
    try {
      const salt = base64ToBytes(envelope.salt);
      const iv = base64ToBytes(envelope.iv);
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
      );
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: Number(envelope.iterations) || 250000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        base64ToBytes(envelope.ciphertext),
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error(
        "Die Sicherung konnte nicht entschlüsselt werden. Bitte Passwort prüfen.",
      );
    }
  }

  async function readBackupFile(file) {
    const fileContent = await file.text();
    let envelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
    }
    if (envelope?.format === `${BACKUP_FORMAT}-verschluesselt`) {
      if (automaticBackupPassword) {
        try {
          return parseBackup(
            await decryptBackup(envelope, automaticBackupPassword),
          );
        } catch {
          // Manuelle Sicherungen können ein anderes Passwort verwenden.
        }
      }
      let errorMessage = "";
      while (true) {
        const password = await requestBackupPassword({
          mode: "import",
          errorMessage,
        });
        if (!password) return null;
        let decryptedContent;
        try {
          decryptedContent = await decryptBackup(envelope, password);
        } catch (error) {
          errorMessage =
            error.message ||
            "Die Sicherung konnte nicht entschlüsselt werden. Bitte Passwort prüfen.";
          continue;
        }
        return parseBackup(decryptedContent);
      }
    }
    return parseBackup(fileContent);
  }

  async function handleBackupFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return;
    }
    if (volume.warning) showToast(backupVolumeMessage(volume), "warning");

    let importedState;
    try {
      importedState = await readBackupFile(file);
      if (!importedState) return;
    } catch (error) {
      console.warn("Sicherungsdatei konnte nicht geprüft werden.", error);
      showToast(error.message || "Die Sicherungsdatei ist ungültig.", "error");
      return;
    }

    const counts = [
      `${importedState.employees.length} Mitarbeiter`,
      `${importedState.trainings.length} Fortbildungen`,
      `${importedState.completions.length} Nachweise`,
      `${importedState.meetings.length} Teamsitzungen`,
      `${importedState.meetingAttendances.length} Teilnahmestatus`,
      `${importedState.appointments.length} Termine`,
      `${importedState.devices.length} Geräte`,
      `${importedState.deviceInstructions.length} Geräteeinweisungen`,
    ].join(", ");
    const accountNote = state.users.length
      ? "Die bestehenden Benutzerkonten bleiben unverändert erhalten."
      : "Da noch kein Benutzerkonto vorhanden ist, werden die Konten aus der Sicherung übernommen.";

    requestConfirmation({
      title: "Datensicherung importieren?",
      message: `Die aktuellen Daten werden vollständig durch diese Sicherung ersetzt: ${counts}. ${accountNote} Dieser Vorgang kann nur mit einer zuvor exportierten Sicherung rückgängig gemacht werden.`,
      acceptLabel: "Daten importieren",
      tone: "primary",
      callback: async () => {
        const recoveryBackupCreated = await createAndDownloadBackup({
          prefix: "vor-import",
          silent: true,
        });
        if (!recoveryBackupCreated) return;
        await importDatabase(importedState);
      },
    });
  }

  async function handleBackupValidationSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return;
    }
    if (volume.warning) showToast(backupVolumeMessage(volume), "warning");
    try {
      const checkedState = await readBackupFile(file);
      if (!checkedState) return;
      showToast(
        `Sicherung gültig: ${checkedState.employees.length} Mitarbeiter, ${checkedState.trainings.length} Fortbildungen, ${checkedState.meetings.length} Teamsitzungen, ${checkedState.appointments.length} Termine und ${checkedState.devices.length} Geräte.`,
      );
    } catch (error) {
      showToast(error.message || "Die Sicherungsdatei ist ungültig.", "error");
    }
  }

  function startupBackupIsOlder(
    importedState,
    currentBackupSettings = automaticBackupSettings,
  ) {
    const importedAt = Date.parse(importedState?.settings?.lastBackupAt);
    const currentAt = Date.parse(currentBackupSettings?.lastBackupAt);
    if (!Number.isFinite(currentAt)) return false;
    return !Number.isFinite(importedAt) || importedAt < currentAt;
  }

  async function findStartupBackupFileInSavedDirectory(
    directoryHandle = automaticBackupDirectoryHandle,
    requestPermission = false,
  ) {
    if (!directoryHandle) return { status: "directory-missing" };

    try {
      if (typeof directoryHandle.queryPermission === "function") {
        const descriptor = { mode: "read" };
        let permission = await directoryHandle.queryPermission(descriptor);
        if (
          permission !== "granted" &&
          requestPermission &&
          typeof directoryHandle.requestPermission === "function"
        ) {
          permission = await directoryHandle.requestPermission(descriptor);
        }
        if (permission !== "granted") {
          return { status: "permission-required" };
        }
      }
      const fileHandle = await directoryHandle.getFileHandle(
        AUTO_BACKUP_FILENAME,
        { create: false },
      );
      return { status: "found", file: await fileHandle.getFile() };
    } catch (error) {
      if (error?.name === "NotFoundError") return { status: "file-missing" };
      console.warn(
        "Die Sicherungsdatei konnte am gespeicherten Ort nicht gelesen werden.",
        error,
      );
      return { status: "read-failed" };
    }
  }

  function startupBackupFallbackMessage(status) {
    if (status === "permission-required") {
      return "Der zuletzt verwendete Sicherungsordner muss erneut freigegeben werden. Bitte wählen Sie teo-autosicherung.json aus.";
    }
    if (status === "file-missing") {
      return "Im zuletzt verwendeten Sicherungsordner wurde teo-autosicherung.json nicht gefunden. Bitte wählen Sie die Datei aus.";
    }
    if (status === "read-failed") {
      return "Der zuletzt verwendete Sicherungsordner konnte nicht gelesen werden. Bitte wählen Sie teo-autosicherung.json aus.";
    }
    return "";
  }

  async function synchronizeStartupBackupFromSavedDirectory({
    requestPermission = false,
  } = {}) {
    document.body.classList.add("is-auth-locked");
    const located = await findStartupBackupFileInSavedDirectory(
      automaticBackupDirectoryHandle,
      requestPermission,
    );
    if (!currentUser || startupBackupSynchronized) return false;

    if (located.status !== "found") {
      showStartupBackupDialog(startupBackupFallbackMessage(located.status));
      return false;
    }

    elements.startupBackupStatus.textContent =
      "Gespeicherte Sicherungsdatei wird automatisch geladen …";
    const synchronized = await synchronizeStartupBackupFile(located.file);
    if (!synchronized && currentUser && !startupBackupSynchronized) {
      showStartupBackupDialog(elements.startupBackupStatus.textContent);
    }
    return synchronized;
  }

  async function handleStartupBackupFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await synchronizeStartupBackupFile(file);
  }

  async function synchronizeStartupBackupFile(file) {
    if (!file || startupBackupImportRunning) return false;

    if (file.name.toLocaleLowerCase("de-DE") !== AUTO_BACKUP_FILENAME) {
      elements.startupBackupStatus.textContent =
        `Bitte wählen Sie die Datei „${AUTO_BACKUP_FILENAME}“ aus.`;
      return false;
    }
    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      elements.startupBackupStatus.textContent = backupVolumeMessage(volume);
      return false;
    }

    startupBackupImportRunning = true;
    elements.selectStartupBackupFileButton.disabled = true;
    elements.startupBackupStatus.textContent = "Sicherungsdatei wird geprüft …";
    try {
      const importedState = await readBackupFile(file);
      if (!importedState) {
        elements.startupBackupStatus.textContent =
          "Der Startabgleich wurde nicht abgeschlossen.";
        return false;
      }
      if (startupBackupIsOlder(importedState)) {
        elements.startupBackupStatus.textContent =
          "Diese Sicherungsdatei ist älter als der zuletzt lokal gesicherte Datenstand. Bitte wählen Sie die aktuelle Datei aus.";
        return false;
      }
      elements.startupBackupStatus.textContent = "Datenbestand wird übernommen …";
      if (!(await importDatabase(importedState))) {
        elements.startupBackupStatus.textContent =
          "Der Datenbestand konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
        return false;
      }

      startupBackupSynchronized = true;
      await rememberBackupVolume(volume.sizeBytes);
      renderBackupVolumeMeter();
      if (elements.startupBackupDialog.open) elements.startupBackupDialog.close();
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
      scheduleAutomaticBackup();
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : "Der aktuelle Datenbestand wurde aus teo-autosicherung.json geladen.",
        volume.warning ? "warning" : undefined,
      );
      return true;
    } catch (error) {
      console.warn("Startabgleich konnte nicht abgeschlossen werden.", error);
      elements.startupBackupStatus.textContent =
        error.message || "Die Sicherungsdatei ist ungültig.";
      return false;
    } finally {
      startupBackupImportRunning = false;
      elements.selectStartupBackupFileButton.disabled = false;
    }
  }

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
      const health = await window.TeOBackend.health(apiUrl);
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnected({ health });
      }
      elements.settingsBackendStatus.classList.remove("is-error");
      elements.settingsBackendStatus.innerHTML = health.initialized
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
      const health = await window.TeOBackend.health(apiUrl);
      let result;
      if (health.initialized) {
        result = await window.TeOBackend.login(
          apiUrl,
          currentUser.username,
          password,
        );
      } else {
        result = await window.TeOBackend.bootstrap(
          apiUrl,
          state,
          currentUser.username,
          password,
          elements.settingsMariaDbBootstrapToken.value.trim(),
        );
      }

      await dataStore.setItem(STORAGE_KEY, state);
      backendConfig = window.TeOBackend.writeConfig({
        mode: "mariadb",
        apiUrl,
      });
      backendMode = "mariadb";
      remoteRevision = Number(result.revision) || 1;
      markBackendConnected({ health, synchronized: true });
      window.TeOBackend.writeToken(result.token);
      state = normalizeState(result.state);
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
      applyTheme(state.settings.theme);
      completeLogin(remoteUser);
      showView("settings", false);
      showToast(
        health.initialized
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
    if (!visible) return;
    elements.databaseSaveWarningText.textContent =
      "Änderungen wurden automatisch gespeichert, aber noch nicht als Datensicherung exportiert.";
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

  async function importDatabase(importedState) {
    const previousState = state;
    // Benutzerkonten sind bewusst nicht Teil des Imports: Der Import ersetzt den
    // fachlichen Datenbestand, die Anmeldung bleibt davon unberührt. Nur auf einem
    // System ohne jedes Konto werden die Konten aus der Sicherung übernommen,
    // damit eine Wiederherstellung von Grund auf möglich bleibt.
    const preservedUsers = Array.isArray(previousState?.users)
      ? previousState.users
      : [];
    const usersFromBackup = preservedUsers.length === 0;
    if (!usersFromBackup) {
      importedState.users = preservedUsers;
    }
    state = importedState;
    if (!(await persistState())) {
      state = previousState;
      renderAll();
      return false;
    }
    stateMutationSequence += 1;
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);

    resetListFilters();
    selectedCompletionEmployeeIds.clear();
    selectedEmployeeIds.clear();
    attendanceDraft.clear();
    applyTheme(state.settings.theme);
    currentUser = state.users.find((user) => user.id === currentUser?.id) || null;
    if (!currentUser) {
      showLoginDialog();
      return false;
    }
    renderAll();
    showToast(
      usersFromBackup
        ? "Die Datensicherung wurde einschließlich der Benutzerkonten importiert."
        : "Die Datensicherung wurde importiert. Die Benutzerkonten sind unverändert.",
    );
    return true;
  }
