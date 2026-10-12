  // Verschluesselter Browserspeicher im lokalen Betrieb. Er verwendet denselben
  // Datenschluessel wie die gemeinsame Datei: zufaellig erzeugt, je Konto mit
  // dessen Login-Passwort umhuellt und bei der Anmeldung entsperrt. Ein
  // zweites Passwort gibt es deshalb nicht, und ohne Anmeldung liegt im
  // Browserprofil nichts Lesbares.
  //
  // Der Schluessel ist selbst zufaellig; eine teure Ableitung wie bei
  // Passwoertern braucht es nicht. HKDF trennt den Schluessel fuer den
  // Browserspeicher von dem fuer die Datei, und das Speichern bleibt schnell.
  const LOCAL_STATE_FORMAT = "teo-browserspeicher-verschluesselt";

  function isEncryptedLocalState(value) {
    return Boolean(
      value &&
        value.format === LOCAL_STATE_FORMAT &&
        typeof value.salt === "string" &&
        typeof value.iv === "string" &&
        typeof value.ciphertext === "string",
    );
  }

  async function localStateCryptoKey(dataKey, salt, usage) {
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(dataKey),
      "HKDF",
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt,
        info: new TextEncoder().encode(LOCAL_STATE_FORMAT),
      },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      [usage],
    );
  }

  async function encryptLocalState(value, dataKey, keyFingerprint) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await localStateCryptoKey(dataKey, salt, "encrypt");
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(JSON.stringify(value)),
    );
    return {
      format: LOCAL_STATE_FORMAT,
      formatVersion: 1,
      keyFingerprint,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };
  }

  async function decryptLocalState(envelope, dataKey) {
    try {
      const key = await localStateCryptoKey(
        dataKey,
        base64ToBytes(envelope.salt),
        "decrypt",
      );
      const plainText = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
        key,
        base64ToBytes(envelope.ciphertext),
      );
      return JSON.parse(new TextDecoder().decode(plainText));
    } catch {
      throw new Error(
        "Der Datenbestand dieses Browsers konnte nicht entschlüsselt werden.",
      );
    }
  }

  // Einziger Weg, den Bestand in den Browserspeicher zu schreiben. Ist der
  // Bestand verschluesselt, wird ohne entsperrten Schluessel nichts
  // geschrieben - unverschluesselt schon gar nicht.
  async function writeLocalState(value) {
    if (automaticBackupSettings?.encrypted) {
      if (!automaticBackupPassword) {
        throw new Error(
          "Der Datenbestand ist gesperrt; ohne Anmeldung speichert TeO nichts.",
        );
      }
      await dataStore.setItem(
        ENCRYPTED_STORAGE_KEY,
        await encryptLocalState(
          value,
          automaticBackupPassword,
          automaticBackupSettings.keyFingerprint,
        ),
      );
      await dataStore.removeItem(STORAGE_KEY);
      return;
    }
    // Noch kein Schluessel: ein Bestand aus der Zeit vor der
    // Pflichtverschluesselung, bis sich ein Administrator anmeldet. Einen
    // verschluesselten Stand daneben gibt es dann nicht - Neubeginn und
    // Verwerfen raeumen beide Ablagen mit clearLocalState.
    await dataStore.setItem(STORAGE_KEY, value);
  }

  // Bei null anfangen: beide Ablagen leeren, verschluesselt wie im Klartext.
  async function clearLocalState() {
    await dataStore.removeItem(ENCRYPTED_STORAGE_KEY);
    await dataStore.removeItem(STORAGE_KEY);
    localStateLocked = false;
  }

  // Abmelden: Schluessel und Datenbestand verlassen den Arbeitsspeicher. Was
  // auf dem Bildschirm stand, wird mit dem leeren Bestand neu gezeichnet.
  function lockLocalState() {
    if (isMariaDbMode() || !automaticBackupSettings?.encrypted) return;
    state = emptyState();
    clearUndoHistory();
    localStateLocked = true;
    renderAll();
  }

  // Anmeldung gegen die Konten dieses Browsers: Der Bestand wird mit dem
  // Schluessel geoeffnet, den das Passwort entsperrt. Liegt er noch im
  // Klartext vor, wird er wie bisher geladen. Rueckgabe ist eine Meldung fuer
  // den Anmeldedialog, leer bei Erfolg.
  async function openLocalStateForLogin(loginPassword) {
    if (!localStateLocked) return "";
    let envelope;
    try {
      envelope = await dataStore.getItem(ENCRYPTED_STORAGE_KEY);
    } catch (error) {
      console.warn("Der verschlüsselte Datenbestand konnte nicht gelesen werden.", error);
      return "Der Datenbestand dieses Browsers konnte nicht gelesen werden.";
    }
    if (!isEncryptedLocalState(envelope)) {
      state = await loadState();
      return "";
    }
    const key =
      automaticBackupPassword ||
      (await unlockAutomaticBackupKeyWithPassword(loginPassword));
    if (!key) return "Benutzername oder Passwort ist nicht korrekt.";
    try {
      state = normalizeState(await decryptLocalState(envelope, key));
    } catch (error) {
      return error.message;
    }
    automaticBackupPassword = key;
    localStateLocked = false;
    clearUndoHistory();
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
    return "";
  }
