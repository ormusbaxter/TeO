  function renderView(view) {
    staleViews.delete(view);
    for (const render of VIEW_RENDERERS[view] || []) render();
  }

  // Eine Aenderung betrifft selten mehr als eine Ansicht, aufgebaut wurden
  // bisher aber alle - auch die verdeckten. Allein Geraeteliste und
  // Urlaubsmatrix kosten zusammen ein halbes Zehntel einer Sekunde, das
  // niemand zu sehen bekommt. Verdeckte Ansichten werden deshalb nur
  // vorgemerkt; showView() holt sie beim Wechsel nach.
  function renderAll() {
    // Nur Mitarbeiter, die tatsaechlich im Dienst stehen. Ausgetretene sollen
    // die Zahl in der Seitenleiste nicht dauerhaft aufblaehen.
    elements.navEmployeeCount.textContent = String(employedActiveEmployees().length);
    elements.navTrainingCount.textContent = String(state.trainings.length);
    elements.navMeetingCount.textContent = String(state.meetings.length);
    elements.navAppointmentCount.textContent = String(
      state.appointments.filter((appointment) => appointment.date >= todayIso()).length,
    );
    elements.navMemoCount.textContent = String(
      visibleMemos().filter((memo) => !memo.completed).length,
    );
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    updateUsernameExportButton();
    updateSidebarCollapsedLabels();
    for (const view of Object.keys(VIEW_RENDERERS)) {
      if (view !== activeView) staleViews.add(view);
    }
    renderView(activeView);
    renderBackupStatus();
    renderAutomaticBackupStatus();
    renderDatabaseSaveWarning();
    refreshFormattedDateInputs();
    void renderBrowserStorageStatus();
    scheduleAutomaticBackup();
    applyAccessControl();
    renderSidebarSystemStatus();
  }

  // Die automatische Sicherung laeuft im Hintergrund, oft waehrend jemand
  // weiter unten in einer Tabelle arbeitet. Sie aendert nur Sicherungszeitpunkt
  // und Protokoll - nichts, was die offene Ansicht zeigt. Ein vollstaendiger
  // Neuaufbau wie in renderAll() setzte dort Bildlauf und Fokus zurueck und
  // liess die Seite springen. Deshalb nur die Statusanzeigen; die uebrigen
  // Ansichten werden beim naechsten Wechsel ohnehin neu aufgebaut.
  function renderAfterAutomaticBackup() {
    for (const view of Object.keys(VIEW_RENDERERS)) {
      if (view !== activeView) staleViews.add(view);
    }
    if (activeView === "settings") renderView(activeView);
    renderBackupStatus();
    renderDatabaseSaveWarning();
    renderSidebarSystemStatus();
  }

  // Das Farbthema gehoert zum Benutzerkonto, nicht zum Datenbestand: Wer sich
  // anmeldet, bringt seine eigene Auswahl mit. state.settings.theme bleibt die
  // gemeinsame Vorgabe - sie gilt vor der Anmeldung und fuer Konten, die noch
  // nie ein eigenes Thema gewaehlt haben.
  function activeThemeKey() {
    return normalizeTheme(currentUser?.theme || state.settings.theme);
  }

  async function changeTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    if (!currentUser) {
      // Ohne Anmeldung gibt es kein Konto, das die Wahl aufbewahren koennte.
      applyTheme(nextTheme);
      showToast(
        "Das Farbthema gilt vorerst nur für diese Sitzung. Nach der Anmeldung wird es für das Benutzerkonto gespeichert.",
      );
      return;
    }
    if (nextTheme === activeThemeKey()) {
      applyTheme(nextTheme);
      return;
    }

    const committed = await commitStateMutation(
      () => {
        const account = state.users.find((user) => user.id === currentUser.id);
        if (account) account.theme = nextTheme;
        currentUser.theme = nextTheme;
      },
      // Eine Anzeigeeinstellung eines einzelnen Kontos ist keine fachliche
      // Aenderung und hat im Änderungsprotokoll nichts verloren.
      { auditAction: "" },
    );
    if (committed) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    applyTheme(activeThemeKey());
    if (committed) {
      showToast(
        `Farbthema „${THEMES[nextTheme]}“ wurde für „${currentUser.username}“ gespeichert.`,
      );
    }
  }

  function applyTheme(theme) {
    const activeTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = DARK_THEMES.has(activeTheme)
      ? "dark"
      : "light";
    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.value = activeTheme;
    });
    elements.mobileThemeButton.setAttribute(
      "aria-label",
      `Farbthema wechseln. Aktuell: ${THEMES[activeTheme]}`,
    );
    elements.mobileThemeButton.title = `Farbthema: ${THEMES[activeTheme]}`;
    // Wo das Farbthema neu gesetzt wird, hat sich das Konto geaendert - der
    // Symbolsatz zieht deshalb an derselben Stelle nach.
    applyIconSet(activeIconSetKey());
  }

  // Der Symbolsatz gehoert wie das Farbthema zum Benutzerkonto. Eine
  // gemeinsame Vorgabe gibt es nicht: Ohne eigene Wahl gilt "Standard".
  function activeIconSetKey() {
    return normalizeIconSet(currentUser?.iconSet);
  }

  async function changeIconSet(iconSet) {
    const nextIconSet = normalizeIconSet(iconSet);
    if (!currentUser) {
      applyIconSet(nextIconSet);
      showToast(
        "Der Symbolsatz gilt vorerst nur für diese Sitzung. Nach der Anmeldung wird er für das Benutzerkonto gespeichert.",
      );
      return;
    }
    if (nextIconSet === activeIconSetKey()) {
      applyIconSet(nextIconSet);
      return;
    }

    const committed = await commitStateMutation(
      () => {
        const account = state.users.find((user) => user.id === currentUser.id);
        if (account) account.iconSet = nextIconSet;
        currentUser.iconSet = nextIconSet;
      },
      // Wie beim Farbthema: reine Anzeigeeinstellung, kein Protokolleintrag.
      { auditAction: "" },
    );
    if (committed) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    applyIconSet(activeIconSetKey());
    if (committed) {
      showToast(
        `Symbolsatz „${ICON_SETS[nextIconSet]}“ wurde für „${currentUser.username}“ gespeichert.`,
      );
    }
  }

  // Die eigenen Zeichnungen der Sprite, beim ersten Aufruf gemerkt, damit
  // "Standard" sie nach einem anderen Satz zurueckholen kann.
  let teoIconSymbols = null;

  // Ein Satz tauscht den Inhalt der <symbol> in der Sprite aus. Jedes <use>
  // zeigt die neue Zeichnung sofort, ohne dass das Markup der Ansichten
  // davon wissen muss. Was ein Satz nicht kennt - das Logo etwa -, behaelt
  // die TeO-Zeichnung.
  function applyIconSet(iconSet) {
    const activeIconSet = normalizeIconSet(iconSet);
    if (document.documentElement.dataset.iconSet !== activeIconSet) {
      const symbols = document.querySelectorAll(".icon-library symbol[id^='icon-']");
      teoIconSymbols ??= new Map(
        [...symbols].map((symbol) => [
          symbol.id,
          [symbol.getAttribute("viewBox"), symbol.innerHTML],
        ]),
      );
      const drawings = ICON_SET_SYMBOLS[activeIconSet] || {};
      symbols.forEach((symbol) => {
        const drawing =
          drawings[symbol.id.slice("icon-".length)] ?? teoIconSymbols.get(symbol.id);
        if (!drawing) return;
        const [viewBox, markup] = Array.isArray(drawing) ? drawing : ["0 0 24 24", drawing];
        symbol.setAttribute("viewBox", viewBox);
        symbol.innerHTML = markup;
      });
    }
    document.documentElement.dataset.iconSet = activeIconSet;
    document.querySelectorAll("[data-icon-set-select]").forEach((select) => {
      select.value = activeIconSet;
    });
  }

  function restoreAuthenticationSession() {
    if (!isMariaDbMode() && state.users.length === 0) {
      showDataOriginDialog();
      return;
    }
    const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
    const user = state.users.find((item) => item.id === sessionUserId);
    if (user && automaticBackupSettings?.encrypted) {
      sessionStorage.removeItem(SESSION_USER_KEY);
      showLoginDialog();
      elements.loginError.textContent =
        "Bitte erneut anmelden, damit TeO den Sicherungsschlüssel entsperren kann.";
      return;
    }
    if (!user) {
      showLoginDialog();
      if (isMariaDbMode() && backendStartupError) {
        elements.loginError.textContent = backendStartupError;
      }
      return;
    }
    completeLogin(user);
  }

  // Ohne eigene Konten stehen zwei Wege offen: ein neuer Datenbestand oder der
  // bereits vorhandene aus dem gemeinsamen Ordner. Frueher fuehrte nur der
  // erste Weg weiter - und legte ein Konto an, das anschliessend die Konten aus
  // der gemeinsamen Datei verdraengte.
  function showDataOriginDialog() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.dataOriginStatus.textContent = "";
    const sharedDataSetAvailable =
      typeof window.showDirectoryPicker === "function";
    elements.openSharedDataSetButton.disabled = !sharedDataSetAvailable;
    if (!sharedDataSetAvailable) {
      elements.dataOriginStatus.textContent =
        "Einen vorhandenen Datenbestand können nur Chrome und Edge über HTTPS beziehungsweise localhost öffnen.";
    }
    if (!elements.dataOriginDialog.open) elements.dataOriginDialog.showModal();
    window.setTimeout(
      () =>
        (sharedDataSetAvailable
          ? elements.openSharedDataSetButton
          : elements.createDataSetButton
        ).focus(),
      0,
    );
  }

  function showSetupDialog() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.setupForm.reset();
    elements.setupError.textContent = "";
    if (!elements.setupDialog.open) elements.setupDialog.showModal();
    window.setTimeout(() => document.querySelector("#setupUsername").focus(), 0);
  }

  async function handleSetupSubmit(event) {
    event.preventDefault();
    if (isMariaDbMode() || state.users.length > 0) {
      elements.setupError.textContent =
        "Die Ersteinrichtung ist für diesen Datenbestand bereits abgeschlossen.";
      return;
    }

    const username = document.querySelector("#setupUsername").value.trim();
    const password = document.querySelector("#setupPassword").value;
    const confirmation = document.querySelector("#setupPasswordConfirmation").value;
    elements.setupError.textContent =
      /^[A-Za-z0-9]{4,40}$/.test(username)
        ? validateNewPassword(password, confirmation)
        : "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.";
    if (elements.setupError.textContent) return;

    let credentials;
    try {
      credentials = await createPasswordCredentials(password);
    } catch (error) {
      console.error("Administratorkonto konnte nicht erstellt werden.", error);
      elements.setupError.textContent =
        "Die sichere Passworterstellung ist in diesem Browser nicht verfügbar.";
      return;
    }

    const admin = {
      id: createId(),
      username,
      role: "admin",
      ...credentials,
      mustChangePassword: false,
    };
    state.users = [admin];
    currentUser = admin;
    appendAuditEntry("Ersteinrichtung abgeschlossen und Administratorkonto angelegt");
    if (!(await persistState())) {
      state.users = [];
      currentUser = null;
      elements.setupError.textContent =
        "Die Ersteinrichtung konnte nicht gespeichert werden.";
      return;
    }
    databaseSaveReminderArmed = true;
    elements.setupDialog.close();
    completeLogin(admin, { requestStartupBackupPermission: true });
    showToast("TeO wurde eingerichtet.");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    elements.loginError.textContent = "";
    const username = document.querySelector("#loginUsername").value.trim();
    const password = document.querySelector("#loginPassword").value;

    if (isMariaDbMode()) {
      try {
        const result = await window.TeOBackend.login(
          backendConfig.apiUrl,
          username,
          password,
        );
        state = normalizeState(result.state);
        clearUndoHistory();
        databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
        remoteRevision = Number(result.revision) || 0;
        backendStartupError = "";
        markBackendConnected({ synchronized: true });
        window.TeOBackend.writeToken(result.token);
        const remoteUser = state.users.find(
          (item) => item.id === result.user?.id,
        );
        if (!remoteUser) {
          throw new Error("Das angemeldete Benutzerkonto fehlt im Serverdatenbestand.");
        }
        await unlockAutomaticBackupForLogin(remoteUser, password);
        completeLogin(remoteUser);
      } catch (error) {
        console.error("Serveranmeldung fehlgeschlagen.", error);
        if (error.status) markBackendConnected();
        else markBackendConnectionError(error);
        elements.loginError.textContent =
          error.message || "Die Anmeldung am TeO-Server ist fehlgeschlagen.";
        document.querySelector("#loginPassword").value = "";
      }
      return;
    }

    const user = state.users.find(
      (item) => item.username.toLocaleLowerCase("de-DE") === username.toLocaleLowerCase("de-DE"),
    );

    // Erste Anmeldung an einem weiteren Arbeitsplatz: Die Konten liegen noch in
    // der gemeinsamen Datei, nicht in diesem Browserprofil.
    if (!user && state.users.length === 0 && automaticBackupDirectoryHandle) {
      const message = await loginFromSharedDataSet(username, password);
      if (message) {
        elements.loginError.textContent = message;
        document.querySelector("#loginPassword").value = "";
      }
      return;
    }

    let passwordMatches;
    try {
      passwordMatches = user ? await verifyPassword(password, user) : false;
    } catch (error) {
      console.error("Passwortprüfung nicht verfügbar.", error);
      elements.loginError.textContent =
        "Die sichere Passwortprüfung ist in diesem Browser nicht verfügbar.";
      return;
    }

    if (!user || !passwordMatches) {
      elements.loginError.textContent = "Benutzername oder Passwort ist nicht korrekt.";
      document.querySelector("#loginPassword").value = "";
      return;
    }

    // Bis zum Ende des Startabgleichs gemerkt: Fehlt die Schluesselhuelle
    // dieses Kontos hier noch, bringt sie das Verzeichnis der gemeinsamen Datei
    // mit - danach genuegt dasselbe Passwort. Erst wenn auch das fehlschlaegt,
    // wird nach dem Wiederherstellungsschluessel gefragt.
    pendingLoginPassword = password;
    try {
      await unlockAutomaticBackupForLogin(user, password, {
        promptRecovery: false,
      });
    } catch (error) {
      console.warn("Der automatische Sicherungsschlüssel konnte nicht entsperrt werden.", error);
      automaticBackupNotice =
        "Sicherungsschlüssel nicht entsperrt – erneut anmelden oder Wiederherstellungsschlüssel verwenden.";
    }
    completeLogin(user, { requestStartupBackupPermission: true });
  }

  function completeLogin(
    user,
    { requestStartupBackupPermission = false } = {},
  ) {
    currentUser = user;
    sessionStorage.setItem(SESSION_USER_KEY, user.id);
    // Jede Anmeldung bringt das Farbthema des Kontos mit.
    applyTheme(activeThemeKey());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    if (elements.loginDialog.open) elements.loginDialog.close();
    renderAll();

    if (user.mustChangePassword) {
      document.body.classList.add("is-auth-locked");
      elements.changePasswordForm.reset();
      elements.changePasswordError.textContent = "";
      if (!elements.changePasswordDialog.open) elements.changePasswordDialog.showModal();
      window.setTimeout(() => document.querySelector("#newPassword").focus(), 0);
      return;
    }

    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({
        requestPermission: requestStartupBackupPermission,
      });
      return;
    }

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
    scheduleAutomaticBackup();
    // Erst jetzt: Vor der Anmeldung steht die Anwendung noch hinter der
    // Sperre, und ein Hinweis darueber waere im Weg.
    showWhatsNewIfUpdated();
  }

  function showLoginDialog() {
    currentUser = null;
    // Ohne angemeldetes Konto gilt wieder die gemeinsame Vorgabe.
    applyTheme(activeThemeKey());
    clearAutomaticBackupTimer();
    automaticBackupPassword = "";
    pendingLoginPassword = "";
    startupBackupSynchronized = false;
    startupBackupImportRunning = false;
    backupReminderShown = false;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    applyAccessControl();
    if (!elements.loginDialog.open) elements.loginDialog.showModal();
    window.setTimeout(() => document.querySelector("#loginUsername").focus(), 0);
  }

  function showStartupBackupDialog(status = "") {
    document.body.classList.add("is-auth-locked");
    elements.startupBackupFile.value = "";
    elements.startupBackupStatus.textContent = status;
    elements.selectStartupBackupFileButton.disabled = false;
    if (!elements.startupBackupDialog.open) {
      elements.startupBackupDialog.showModal();
    }
    window.setTimeout(() => elements.selectStartupBackupFileButton.focus(), 0);
  }

  function logout() {
    if (isMariaDbMode()) {
      void window.TeOBackend.logout(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      window.TeOBackend.writeToken("");
    }
    showLoginDialog();
  }

  async function handlePasswordChangeSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
      showLoginDialog();
      return;
    }

    const password = document.querySelector("#newPassword").value;
    const confirmation = document.querySelector("#confirmNewPassword").value;
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      elements.changePasswordError.textContent = validationError;
      return;
    }
    if (await verifyPassword(password, currentUser)) {
      elements.changePasswordError.textContent =
        "Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.";
      return;
    }

    const credentials = await createPasswordCredentials(password);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, ...credentials, mustChangePassword: false }
          : user,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(currentUser.id, password);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte nicht auf das neue Passwort umgestellt werden.", error);
      showToast(
        "Passwort geändert; der automatische Sicherungsschlüssel konnte jedoch nicht aktualisiert werden.",
        "error",
      );
    }
    currentUser = state.users.find((user) => user.id === currentUser.id);
    // Der Startabgleich steht noch aus; er braucht das jetzt gueltige Passwort.
    if (pendingLoginPassword) pendingLoginPassword = password;
    elements.changePasswordDialog.close();
    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({ requestPermission: true });
    } else {
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
    }
    showToast("Das neue Passwort wurde gespeichert.");
  }

  function validateNewPassword(password, confirmation) {
    if (password !== confirmation) return "Die eingegebenen Passwörter stimmen nicht überein.";
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    if (!/[A-ZÄÖÜ]/.test(password) || !/[a-zäöüß]/.test(password) || !/\d/.test(password)) {
      return "Das Passwort benötigt Groß- und Kleinbuchstaben sowie mindestens eine Zahl.";
    }
    return "";
  }

  async function verifyPassword(password, user) {
    const derivedHash = await derivePasswordHash(
      password,
      user.passwordSalt,
      PASSWORD_ITERATIONS,
    );
    return constantTimeEqual(derivedHash, user.passwordHash);
  }

  async function createPasswordCredentials(password) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const passwordSalt = bytesToBase64(saltBytes);
    return {
      passwordSalt,
      passwordHash: await derivePasswordHash(password, passwordSalt, PASSWORD_ITERATIONS),
    };
  }

  async function derivePasswordHash(password, saltBase64, iterations) {
    if (!crypto.subtle) throw new Error("Web Crypto API nicht verfügbar");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64ToBytes(saltBase64),
        iterations,
      },
      key,
      256,
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function constantTimeEqual(valueA, valueB) {
    if (valueA.length !== valueB.length) return false;
    let difference = 0;
    for (let index = 0; index < valueA.length; index += 1) {
      difference |= valueA.charCodeAt(index) ^ valueB.charCodeAt(index);
    }
    return difference === 0;
  }

  function isAdmin() {
    return currentUser?.role === "admin";
  }

  function requireAdmin() {
    if (isAdmin()) return true;
    showToast("Diese Aktion ist nur für Administratoren verfügbar.", "error");
    return false;
  }

  function applyAccessControl() {
    const admin = isAdmin();
    // Die Rolle am body genuegt: Das Stylesheet blendet die als Verwaltung
    // markierten Elemente aus, solange sie nicht „admin“ lautet. Die Schleife
    // davor lief bei jedem Aufbau einer Ansicht ueber das gesamte Dokument
    // und setzte dabei nur, was die Regel schon entschieden hatte.
    document.body.dataset.userRole = currentUser?.role || "guest";
    elements.currentUsername.textContent = currentUser?.username || "Nicht angemeldet";
    elements.currentUserRole.textContent = currentUser
      ? admin
        ? "Administrator"
        : "Normaler Benutzer"
      : "–";
    elements.mobileAccountButton.title = currentUser
      ? `Benutzerkonto: ${currentUser.username}`
      : "Benutzerkonto";
    updateSidebarFooterSummaries();
    renderDatabaseSaveWarning();
  }
