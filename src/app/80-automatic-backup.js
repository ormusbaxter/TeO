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
      await linkAutomaticBackupDirectory(handle);
      renderAutomaticBackupStatus();
      // Einen Ordner zu waehlen ist die ausdrueckliche Entscheidung, dorthin zu
      // sichern - die Wache gegen fremde Schreibvorgaenge stuende hier im Weg.
      await runAutomaticBackup({
        force: true,
        requestPermission: true,
        overwriteForeignChanges: true,
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Der Sicherungsordner konnte nicht gespeichert werden.", error);
      automaticBackupNotice =
        "Der Sicherungsordner konnte nicht verknüpft werden.";
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "error");
    }
  }

  // „Jetzt automatisch sichern“ ist der Ausweg aus einer erkannten
  // Fremdschreibung: Ohne ihn blieben die Aenderungen dieser Sitzung ungesichert
  // liegen. Ueberschrieben wird nur nach ausdruecklicher Bestaetigung.
  async function runAutomaticBackupOnDemand() {
    if (await sharedBackupFileChangedElsewhere()) {
      requestConfirmation({
        title: `${AUTO_BACKUP_FILENAME} überschreiben?`,
        message:
          `Ein anderer Arbeitsplatz hat ${AUTO_BACKUP_FILENAME} zwischenzeitlich geschrieben. ` +
          "Beim Überschreiben gehen die dort gesicherten Änderungen verloren. " +
          "Sicherer ist: abmelden, TeO neu laden und den Startabgleich wiederholen.",
        acceptLabel: "Trotzdem überschreiben",
        callback: () =>
          void runAutomaticBackup({
            force: true,
            requestPermission: true,
            overwriteForeignChanges: true,
          }),
      });
      return;
    }
    await runAutomaticBackup({ force: true, requestPermission: true });
  }

  async function linkAutomaticBackupDirectory(handle) {
    await dataStore.setItem(AUTO_BACKUP_DIRECTORY_KEY, handle);
    automaticBackupDirectoryHandle = handle;
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      enabled: true,
      directoryName: handle.name,
    });
    automaticBackupNotice = "";
    await persistAutomaticBackupConfiguration();
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

  // Das Schluesselverzeichnis reist in der aeusseren, unverschluesselten Huelle
  // der gemeinsamen Datei mit. Im Datenbestand selbst waere es unerreichbar:
  // Wer die Datei an einem weiteren Arbeitsplatz zum ersten Mal oeffnet, muss
  // die Huelle seines Kontos finden, bevor er entschluesseln kann.
  function automaticBackupKeyDirectory() {
    if (
      !automaticBackupSettings?.encrypted ||
      !automaticBackupSettings.keyFingerprint
    ) {
      return null;
    }
    return {
      keyFingerprint: automaticBackupSettings.keyFingerprint,
      keyEnvelopes: { ...automaticBackupSettings.keyEnvelopes },
    };
  }

  function readAutomaticBackupKeyDirectory(envelope) {
    const normalized = normalizeAutomaticBackupSettings({
      encrypted: true,
      keyFingerprint: envelope?.keyFingerprint,
      keyEnvelopes: envelope?.keyEnvelopes,
    });
    return normalized.keyFingerprint
      ? {
          keyFingerprint: normalized.keyFingerprint,
          keyEnvelopes: normalized.keyEnvelopes,
        }
      : null;
  }

  // Die Datei ist massgeblich: Bei abweichendem Fingerabdruck gilt ihr
  // Schluessel, der bisher gehaltene ist fuer sie wertlos. Stimmt er ueberein,
  // werden die Huellen vereinigt - eine hier angelegte Huelle, die es noch
  // nicht in die Datei geschafft hat, bleibt so erhalten.
  async function adoptAutomaticBackupKeyDirectory(directory) {
    if (!directory) return false;
    const sameKey =
      automaticBackupSettings?.keyFingerprint === directory.keyFingerprint;
    const known =
      sameKey &&
      automaticBackupSettings.encrypted &&
      Object.keys(directory.keyEnvelopes).every((userId) =>
        Object.hasOwn(automaticBackupSettings.keyEnvelopes, userId),
      );
    if (known) return false;
    if (!sameKey) automaticBackupPassword = "";
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      encrypted: true,
      keyFingerprint: directory.keyFingerprint,
      keyEnvelopes: sameKey
        ? { ...automaticBackupSettings.keyEnvelopes, ...directory.keyEnvelopes }
        : directory.keyEnvelopes,
    });
    try {
      await persistAutomaticBackupConfiguration();
    } catch (error) {
      console.warn(
        "Das Schlüsselverzeichnis der gemeinsamen Datei konnte nicht gespeichert werden.",
        error,
      );
    }
    return true;
  }

  // Sucht die passende Schluesselhuelle. Die eigene zuerst, danach alle
  // uebrigen: Beim ersten Login an einem weiteren Arbeitsplatz ist die eigene
  // Konto-ID noch unbekannt, sie steht im verschluesselten Teil der Datei. Das
  // kostet je Konto eine Schluesselableitung und faellt genau einmal an.
  async function unlockAutomaticBackupKeyWithPassword(loginPassword, userId = "") {
    if (!loginPassword || !automaticBackupSettings?.keyFingerprint) return "";
    const envelopes = automaticBackupSettings.keyEnvelopes || {};
    const order = [
      ...(envelopes[userId] ? [userId] : []),
      ...Object.keys(envelopes).filter((id) => id !== userId),
    ];
    for (const id of order) {
      try {
        const key = await decryptBackup(envelopes[id], loginPassword);
        if (
          (await automaticBackupKeyFingerprint(key)) ===
          automaticBackupSettings.keyFingerprint
        ) {
          return key;
        }
      } catch {
        // Naechste Huelle: Diese gehoert zu einem anderen Konto.
      }
    }
    return "";
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

  async function unlockAutomaticBackupForLogin(
    user,
    loginPassword,
    { promptRecovery = true } = {},
  ) {
    if (!automaticBackupSettings?.encrypted) return true;
    const key = await unlockAutomaticBackupKeyWithPassword(
      loginPassword,
      user.id,
    );
    if (key) {
      automaticBackupPassword = key;
      automaticBackupNotice = "";
      // Ein Konto, das der Schluessel ueber eine fremde Huelle erreicht hat,
      // bekommt seine eigene - damit die naechste Anmeldung ohne Suche gelingt.
      if (!automaticBackupSettings.keyEnvelopes?.[user.id]) {
        await registerAutomaticBackupUserKey(user.id, loginPassword);
      }
      return true;
    }
    // Ohne passende Huelle bleibt der Wiederherstellungsschluessel. Beim
    // Startabgleich wird zuerst die gemeinsame Datei gelesen: Ihr
    // Schluesselverzeichnis kennt die Huelle womoeglich schon.
    if (!promptRecovery) return false;
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
    overwriteForeignChanges = false,
  } = {}) {
    const execute = () =>
      performAutomaticBackup({ force, requestPermission, overwriteForeignChanges });
    if (typeof navigator.locks?.request === "function") {
      return navigator.locks.request("teo-automatic-backup", execute);
    }
    return execute();
  }

  async function performAutomaticBackup({
    force = false,
    requestPermission = false,
    overwriteForeignChanges = false,
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

    if (!overwriteForeignChanges && (await sharedBackupFileChangedElsewhere())) {
      automaticBackupRetryAt = Date.now() + 60 * 60 * 1000;
      automaticBackupNotice = FOREIGN_BACKUP_NOTICE;
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "warning");
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
          await encryptBackup(
            fileContent,
            automaticBackupPassword,
            automaticBackupKeyDirectory(),
          ),
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
      // Sofort nach dem Schreiben: Der Stempel beschreibt die Datei, nicht den
      // Ausgang der folgenden Schritte. Bliebe er stehen, hielte der naechste
      // Lauf die eigene Sicherung fuer einen fremden Schreibvorgang.
      await rememberSharedBackupFileStamp();

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
      renderAfterAutomaticBackup();
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

  // Erkennt einen fremden Schreibvorgang, ohne die Datei zu lesen: Groesse und
  // Aenderungszeit stehen im File-Objekt. Nur wenn beides dem entspricht, was
  // TeO zuletzt selbst geschrieben oder eingelesen hat, gehoert die Datei noch
  // zu dieser Sitzung.
  async function readSharedBackupFileStamp(
    directoryHandle = automaticBackupDirectoryHandle,
  ) {
    if (!directoryHandle) return null;
    try {
      const fileHandle = await directoryHandle.getFileHandle(
        AUTO_BACKUP_FILENAME,
        { create: false },
      );
      return sharedBackupFileStampOf(await fileHandle.getFile());
    } catch (error) {
      if (error?.name === "NotFoundError") return null;
      console.warn(
        "Der Stand der gemeinsamen Sicherungsdatei konnte nicht geprüft werden.",
        error,
      );
      return null;
    }
  }

  function sharedBackupFileStampOf(file) {
    return file
      ? { lastModified: Number(file.lastModified) || 0, size: Number(file.size) || 0 }
      : null;
  }

  async function rememberSharedBackupFileStamp(file = null) {
    sharedBackupFileStamp = file
      ? sharedBackupFileStampOf(file)
      : await readSharedBackupFileStamp();
  }

  async function sharedBackupFileChangedElsewhere() {
    if (!sharedBackupFileStamp) return false;
    const stamp = await readSharedBackupFileStamp();
    if (!stamp) return false;
    return (
      stamp.lastModified !== sharedBackupFileStamp.lastModified ||
      stamp.size !== sharedBackupFileStamp.size
    );
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
