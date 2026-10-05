  // Nach dem Lesen der gemeinsamen Datei: Ihr Schluesselverzeichnis kennt die
  // Huelle des angemeldeten Kontos womoeglich, obwohl dieser Arbeitsplatz sie
  // beim Login noch nicht hatte.
  async function unlockAutomaticBackupWithPendingLogin() {
    if (
      automaticBackupPassword ||
      !automaticBackupSettings?.encrypted ||
      !pendingLoginPassword ||
      !currentUser
    ) {
      return false;
    }
    // Jetzt ist das Verzeichnis der Datei bekannt. Bleibt die Huelle auch damit
    // aus, ist der getrennt verwahrte Schluessel der letzte Weg.
    return unlockAutomaticBackupForLogin(currentUser, pendingLoginPassword);
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

  // Fragt den gemeinsamen Sicherungsordner ab. Meldungen gehen in das
  // uebergebene Feld, damit Start- und Auswahldialog denselben Weg nutzen.
  async function requestSharedBackupDirectory(statusElement) {
    if (typeof window.showDirectoryPicker !== "function") {
      statusElement.textContent =
        "Dieser Browser unterstützt keine direkte Ordnerfreigabe. Verwenden Sie Chrome oder Edge über HTTPS beziehungsweise localhost.";
      return null;
    }
    try {
      return await window.showDirectoryPicker({
        id: "teo-automatic-backup",
        mode: "readwrite",
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(
          "Der gemeinsame Sicherungsordner konnte nicht geöffnet werden.",
          error,
        );
        statusElement.textContent = "Der Ordner konnte nicht geöffnet werden.";
      }
      return null;
    }
  }

  function sharedBackupDirectoryMessage(status) {
    return status === "file-missing"
      ? `In diesem Ordner liegt keine ${AUTO_BACKUP_FILENAME}. Wählen Sie den Ordner mit der gemeinsamen Datensicherung.`
      : startupBackupFallbackMessage(status) ||
          "Der Ordner konnte nicht gelesen werden.";
  }

  // Zweite Tuer beim Erststart: Der Datenbestand liegt bereits im gemeinsamen
  // Ordner. Ordnerverknuepfung, Schluesselverzeichnis und Anmeldung entstehen
  // hier in einem Zug - der Weg ueber die Ersteinrichtung legt ein Konto an,
  // das den Konten aus der Datei gleich wieder im Weg staende.
  async function openSharedDataSet() {
    // Ein bereits verknuepfter Ordner genuegt; erst wenn er nichts hergibt,
    // wird ausgewaehlt. Nach einer misslungenen Anmeldung entfaellt so der
    // zweite Gang durch die Ordnerauswahl.
    let located = automaticBackupDirectoryHandle
      ? await findStartupBackupFileInSavedDirectory(
          automaticBackupDirectoryHandle,
          true,
        )
      : { status: "directory-missing" };

    if (located.status !== "found") {
      const handle = await requestSharedBackupDirectory(
        elements.dataOriginStatus,
      );
      if (!handle) return false;
      located = await findStartupBackupFileInSavedDirectory(handle, true);
      if (located.status !== "found") {
        elements.dataOriginStatus.textContent = sharedBackupDirectoryMessage(
          located.status,
        );
        return false;
      }
      try {
        await linkAutomaticBackupDirectory(handle);
      } catch (error) {
        console.error("Die Ordnerverknüpfung konnte nicht gespeichert werden.", error);
        elements.dataOriginStatus.textContent =
          "Die Ordnerverknüpfung konnte nicht gespeichert werden.";
        return false;
      }
    }

    await adoptSharedKeyDirectoryFromFile(located.file);
    elements.dataOriginDialog.close();
    showLoginDialog();
    elements.loginError.textContent =
      "Melden Sie sich mit Ihrem vorhandenen TeO-Konto an. Der gemeinsame Datenbestand wird dabei geladen.";
    return true;
  }

  async function adoptSharedKeyDirectoryFromFile(file) {
    try {
      const envelope = JSON.parse(await file.text());
      if (envelope?.format !== `${BACKUP_FORMAT}-verschluesselt`) return false;
      return await adoptAutomaticBackupKeyDirectory(
        readAutomaticBackupKeyDirectory(envelope),
      );
    } catch (error) {
      console.warn(
        "Das Schlüsselverzeichnis der gemeinsamen Datei konnte nicht gelesen werden.",
        error,
      );
      return false;
    }
  }

  // Erste Anmeldung an einem Arbeitsplatz ohne eigene Konten: Die Konten stehen
  // im verschluesselten Teil der gemeinsamen Datei. Erst der Schluessel aus dem
  // Verzeichnis oeffnet sie, danach wird das Passwort wie sonst geprueft.
  // Rueckgabe ist die Meldung fuer den Anmeldedialog, leer bei Erfolg.
  async function loginFromSharedDataSet(username, password) {
    const located = await findStartupBackupFileInSavedDirectory(
      automaticBackupDirectoryHandle,
      true,
    );
    if (located.status !== "found") {
      return (
        startupBackupFallbackMessage(located.status) ||
        `Im verknüpften Ordner wurde ${AUTO_BACKUP_FILENAME} nicht gefunden.`
      );
    }
    const volume = backupVolumeAssessment(located.file.size);
    if (volume.exceeded) return backupVolumeMessage(volume);

    let fileContent = await located.file.text();
    let envelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      return "Die gemeinsame Sicherungsdatei enthält kein gültiges JSON.";
    }

    if (envelope?.format === `${BACKUP_FORMAT}-verschluesselt`) {
      await adoptAutomaticBackupKeyDirectory(
        readAutomaticBackupKeyDirectory(envelope),
      );
      let key = await unlockAutomaticBackupKeyWithPassword(password);
      if (!key) {
        // Ohne passende Huelle bleibt der getrennt verwahrte Schluessel. Fehlt
        // auch das Verzeichnis, stammt die Datei aus einer aelteren Fassung und
        // traegt ein frei gewaehltes Passwort.
        key = automaticBackupSettings.keyFingerprint
          ? await requestAutomaticBackupRecoveryKey()
          : ((await requestBackupPassword({ mode: "import" })) || "").trim();
        if (!key) return "Benutzername oder Passwort ist nicht korrekt.";
      }
      try {
        fileContent = await decryptBackup(envelope, key);
      } catch (error) {
        return error.message;
      }
      automaticBackupPassword = key;
    }

    let importedState;
    try {
      importedState = parseBackup(fileContent);
    } catch (error) {
      return error.message;
    }

    const user = importedState.users.find(
      (item) =>
        item.username.toLocaleLowerCase("de-DE") ===
        username.toLocaleLowerCase("de-DE"),
    );
    if (!user || !(await verifyPassword(password, user))) {
      automaticBackupPassword = "";
      return "Benutzername oder Passwort ist nicht korrekt.";
    }

    if (
      !(await importDatabase(importedState, {
        adoptUsers: true,
        resumeSession: false,
      }))
    ) {
      automaticBackupPassword = "";
      return "Der Datenbestand konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
    }

    currentUser = user;
    startupBackupSynchronized = true;
    pendingLoginPassword = "";
    await rememberSharedBackupFileStamp(located.file);
    await rememberBackupVolume(volume.sizeBytes);
    if (
      automaticBackupPassword &&
      !automaticBackupSettings.keyEnvelopes?.[user.id]
    ) {
      await registerAutomaticBackupUserKey(user.id, password);
    }
    completeLogin(user);
    showToast(
      volume.warning
        ? backupVolumeMessage(volume)
        : `Der gemeinsame Datenbestand wurde aus ${AUTO_BACKUP_FILENAME} geladen.`,
      volume.warning ? "warning" : undefined,
    );
    return "";
  }

  // Im Startdialog: Statt der einzelnen Datei den Ordner freigeben. Damit gilt
  // die Verknuepfung auch fuer die naechste Sitzung, und die Dateiauswahl
  // entfaellt kuenftig.
  async function selectStartupBackupDirectory() {
    const handle = await requestSharedBackupDirectory(
      elements.startupBackupStatus,
    );
    if (!handle) return false;
    const located = await findStartupBackupFileInSavedDirectory(handle, true);
    if (located.status !== "found") {
      elements.startupBackupStatus.textContent = sharedBackupDirectoryMessage(
        located.status,
      );
      return false;
    }
    try {
      await linkAutomaticBackupDirectory(handle);
    } catch (error) {
      console.error("Die Ordnerverknüpfung konnte nicht gespeichert werden.", error);
    }
    return synchronizeStartupBackupFile(located.file);
  }

  // Schliesst die Ersteinrichtung ab: Der gewaehlte Ordner wird verknuepft und
  // bekommt die erste teo-autosicherung.json. Liegt dort schon eine, gehoert
  // sie zu einem anderen Datenbestand - ueberschrieben wird sie nicht.
  async function selectFirstSharedBackupDirectory() {
    const status = elements.firstSharedFolderStatus;
    status.textContent = "";
    firstSharedFolderOccupiedHandle = null;
    elements.openOccupiedSharedFolderButton.hidden = true;
    const handle = await requestSharedBackupDirectory(status);
    if (!handle) return false;
    const located = await findStartupBackupFileInSavedDirectory(handle, true);
    if (located.status === "found") {
      firstSharedFolderOccupiedHandle = handle;
      elements.openOccupiedSharedFolderButton.hidden = false;
      status.textContent =
        `In diesem Ordner liegt bereits eine ${AUTO_BACKUP_FILENAME}. Wählen Sie einen leeren Ordner – ` +
        "oder öffnen Sie den vorhandenen Datenbestand.";
      return false;
    }
    if (located.status !== "file-missing") {
      status.textContent = sharedBackupDirectoryMessage(located.status);
      return false;
    }
    elements.selectFirstSharedFolderButton.disabled = true;
    status.textContent = `${AUTO_BACKUP_FILENAME} wird angelegt …`;
    try {
      await linkAutomaticBackupDirectory(handle);
      const written = await runAutomaticBackup({
        force: true,
        requestPermission: true,
        overwriteForeignChanges: true,
      });
      if (!written) {
        status.textContent =
          automaticBackupNotice ||
          `${AUTO_BACKUP_FILENAME} konnte nicht angelegt werden.`;
        return false;
      }
      automaticBackupSettings = normalizeAutomaticBackupSettings({
        ...automaticBackupSettings,
        firstSharedFilePending: false,
      });
      await persistAutomaticBackupConfiguration();
    } catch (error) {
      console.error("Der Sicherungsordner konnte nicht eingerichtet werden.", error);
      status.textContent = "Der Sicherungsordner konnte nicht eingerichtet werden.";
      return false;
    } finally {
      elements.selectFirstSharedFolderButton.disabled = false;
    }
    finishFirstSharedFolderStep();
    return true;
  }

  // Wer eben „neu“ gewaehlt hat, den Datenbestand aber schon im Ordner findet,
  // kehrt hier auf den Weg „Vorhandenen Datenbestand öffnen“ zurueck. Der eben
  // angelegte Bestand ist leer bis auf das neue Konto und wird verworfen - nur
  // nach Rueckfrage, die Datei im Ordner bleibt dabei unberuehrt.
  function confirmOpenOccupiedSharedFolder() {
    if (!firstSharedFolderOccupiedHandle) return;
    requestConfirmation({
      title: "Vorhandenen Datenbestand öffnen?",
      message:
        `TeO verwirft den eben eingerichteten Datenbestand samt dem Konto „${currentUser?.username || ""}“ ` +
        `und lädt ${AUTO_BACKUP_FILENAME} aus dem gewählten Ordner. Angemeldet wird anschließend ` +
        "mit einem Konto aus dieser Datei.",
      acceptLabel: "Verwerfen und öffnen",
      callback: () => void openOccupiedSharedFolder(),
    });
  }

  async function openOccupiedSharedFolder() {
    const handle = firstSharedFolderOccupiedHandle;
    const status = elements.firstSharedFolderStatus;
    if (!handle) return false;
    const located = await findStartupBackupFileInSavedDirectory(handle, true);
    if (located.status !== "found") {
      status.textContent = sharedBackupDirectoryMessage(located.status);
      return false;
    }
    const previousState = state;
    state = emptyState();
    if (!(await persistState())) {
      state = previousState;
      status.textContent = "Der eingerichtete Datenbestand konnte nicht verworfen werden.";
      return false;
    }
    clearUndoHistory();
    databaseSaveReminderArmed = false;
    try {
      await linkAutomaticBackupDirectory(handle);
      automaticBackupSettings = normalizeAutomaticBackupSettings({
        ...automaticBackupSettings,
        firstSharedFilePending: false,
      });
      await persistAutomaticBackupConfiguration();
    } catch (error) {
      console.error("Die Ordnerverknüpfung konnte nicht gespeichert werden.", error);
    }
    await adoptSharedKeyDirectoryFromFile(located.file);
    firstSharedFolderOccupiedHandle = null;
    showLoginDialog();
    elements.loginError.textContent =
      "Melden Sie sich mit Ihrem vorhandenen TeO-Konto an. Der gemeinsame Datenbestand wird dabei geladen.";
    return true;
  }

  // Nur ohne Ordnerauswahl im Browser: Die Sitzung oeffnet, der Vermerk bleibt.
  // Beim naechsten Start fragt TeO wieder nach dem Ordner statt nach einer
  // Datei, die es nicht gibt.
  function continueWithoutFirstSharedFolder() {
    if (typeof window.showDirectoryPicker === "function") return;
    finishFirstSharedFolderStep();
  }

  function finishFirstSharedFolderStep() {
    startupBackupSynchronized = true;
    if (elements.firstSharedFolderDialog.open) elements.firstSharedFolderDialog.close();
    if (currentUser) completeLogin(currentUser);
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
      const importedState = await readBackupFile(file, {
        adoptKeyDirectory: true,
      });
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
      // Der Startabgleich laedt den gemeinsamen Datenbestand, keinen Teilimport:
      // Die Konten gehoeren dazu, sonst kennt jeder Arbeitsplatz nur die dort
      // angelegten und ueberschreibt beim naechsten Sichern die uebrigen.
      if (!(await importDatabase(importedState, { adoptUsers: true }))) {
        elements.startupBackupStatus.textContent =
          "Der Datenbestand konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
        return false;
      }

      startupBackupSynchronized = true;
      pendingLoginPassword = "";
      await rememberSharedBackupFileStamp(file);
      await rememberBackupVolume(volume.sizeBytes);
      renderBackupVolumeMeter();
      if (elements.startupBackupDialog.open) elements.startupBackupDialog.close();
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
      scheduleAutomaticBackup();
      // Der zweite Weg in die freigeschaltete Anwendung - completeLogin endet
      // hier vorzeitig, weil erst der Datenbestand geladen werden musste.
      showWhatsNewIfUpdated();
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
