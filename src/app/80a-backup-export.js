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

  async function encryptBackup(plainText, password, keyDirectory = null) {
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
      // Fassung 2 fuehrt das Schluesselverzeichnis. Aeltere TeO-Fassungen lesen
      // solche Dateien unveraendert weiter - sie ignorieren die Zusatzfelder.
      formatVersion: keyDirectory ? 2 : 1,
      algorithm: "AES-GCM",
      keyDerivation: "PBKDF2-SHA-256",
      iterations: 250000,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      ...(keyDirectory
        ? {
            keyFingerprint: keyDirectory.keyFingerprint,
            keyEnvelopes: keyDirectory.keyEnvelopes,
          }
        : {}),
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

  async function readBackupFile(file, { adoptKeyDirectory = false } = {}) {
    const fileContent = await file.text();
    let envelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
    }
    if (envelope?.format === `${BACKUP_FORMAT}-verschluesselt`) {
      // Nur die gemeinsame Datei darf das Verzeichnis stellen. Ein von Hand
      // gewaehlter Import kann aus einem fremden Datenbestand stammen und
      // wuerde den Schluessel dieses Bestands verdraengen.
      if (adoptKeyDirectory) {
        await adoptAutomaticBackupKeyDirectory(
          readAutomaticBackupKeyDirectory(envelope),
        );
        await unlockAutomaticBackupWithPendingLogin();
      }
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
