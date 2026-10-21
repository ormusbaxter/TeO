  // Notfallzugang im lokalen Betrieb. Ein eigenes Administratorkonto, dessen
  // Passwort TeO je Installation zufaellig erzeugt und einmal auf dem
  // Notfallblatt ausgibt. Technisch ist es eine weitere Schluesselhuelle: Wer
  // das Passwort kennt, oeffnet den Datenbestand an jedem Arbeitsplatz, auch
  // wenn alle anderen Passwoerter und der Wiederherstellungsschluessel
  // verloren sind. Ein festes, ueberall gleiches Passwort waere eine
  // Hintertuer - deshalb gibt es keins.
  //
  // Das Passwort bleibt, wie es ausgegeben wurde, bis jemand ein neues Blatt
  // erzeugt. Jede Benutzung landet im Protokoll und als Hinweis bei allen
  // Administratoren.
  const EMERGENCY_USERNAME = "Notfall";
  const EMERGENCY_PASSWORD_HINT = "Steht auf dem Notfallblatt im verschlossenen Umschlag.";
  // 32 Zeichen ohne Verwechsler (0/O, 1/I). 256 ist ein Vielfaches von 32,
  // jedes Zeichen ist also gleich wahrscheinlich; 24 Zeichen ergeben 120 Bit.
  const EMERGENCY_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const EMERGENCY_PASSWORD_LENGTH = 24;

  // Die Benutzung wird je Anmeldung einmal vermerkt.
  let emergencyAccessUseRecorded = false;

  function isEmergencyUser(user) {
    return Boolean(user?.emergency);
  }

  function emergencyUser() {
    return state.users.find(isEmergencyUser) || null;
  }

  function createEmergencyPassword() {
    const bytes = crypto.getRandomValues(new Uint8Array(EMERGENCY_PASSWORD_LENGTH));
    const characters = [...bytes].map(
      (byte) => EMERGENCY_PASSWORD_ALPHABET[byte % EMERGENCY_PASSWORD_ALPHABET.length],
    );
    const groups = [];
    for (let start = 0; start < characters.length; start += 4) {
      groups.push(characters.slice(start, start + 4).join(""));
    }
    return groups.join("-");
  }

  // Heisst ein gewoehnliches Konto schon „Notfall“, bekommt der Zugang eine
  // Nummer dazu.
  function emergencyUsername() {
    if (!isUsernameTaken(EMERGENCY_USERNAME)) return EMERGENCY_USERNAME;
    let number = 2;
    while (isUsernameTaken(`${EMERGENCY_USERNAME}${number}`)) number += 1;
    return `${EMERGENCY_USERNAME}${number}`;
  }

  // Nur mit entsperrtem Datenschluessel: Ohne ihn liesse sich keine Huelle
  // anlegen. Im Serverbetrieb verwaltet der Datenbankadministrator die Konten.
  function emergencyAccessAvailable() {
    return (
      !isMariaDbMode() &&
      Boolean(automaticBackupSettings?.encrypted && automaticBackupPassword)
    );
  }

  // Legt den Zugang an oder erneuert ihn: neues Passwort, neue Huelle unter
  // derselben Konto-ID. Die bisherige Huelle ist damit ersetzt, das alte Blatt
  // oeffnet den Bestand nicht mehr.
  async function issueEmergencyAccess() {
    if (!emergencyAccessAvailable() || !isAdmin()) return false;
    const existing = emergencyUser();
    const password = createEmergencyPassword();
    const credentials = await createPasswordCredentials(password);
    const account = {
      ...(existing || {
        id: `user-${createId()}`,
        username: emergencyUsername(),
      }),
      ...credentials,
      role: "admin",
      mustChangePassword: false,
      passwordHint: EMERGENCY_PASSWORD_HINT,
      emergency: true,
      emergencyIssuedAt: new Date().toISOString(),
      emergencySheetConfirmed: false,
      emergencyLastUsedAt: existing?.emergencyLastUsedAt || "",
      emergencyUseAcknowledged: true,
    };
    const committed = await commitStateMutation(
      () => {
        state.users = existing
          ? state.users.map((item) => (item.id === account.id ? account : item))
          : [...state.users, account];
      },
      {
        auditAction: existing
          ? "Neues Notfallblatt erzeugt"
          : "Notfallzugang eingerichtet",
      },
    );
    if (!committed) return false;
    if (currentUser?.id === account.id) {
      currentUser = state.users.find((item) => item.id === account.id);
    }
    try {
      await registerAutomaticBackupUserKey(account.id, password);
    } catch (error) {
      console.error("Die Schlüsselhülle des Notfallzugangs konnte nicht angelegt werden.", error);
      showToast(
        "Der Notfallzugang konnte nicht mit dem Datenschlüssel verbunden werden. Bitte erneut ein Notfallblatt erzeugen.",
        "error",
      );
      return false;
    }
    // Die gemeinsame Datei traegt das Schluesselverzeichnis; erst mit ihr
    // gilt das neue Blatt auch an anderen Arbeitsplaetzen.
    scheduleAutomaticBackup();
    renderEmergencyAccessNotice();
    showEmergencySheet(account, password, { renewed: Boolean(existing) });
    return true;
  }

  // Nach der Anmeldung eines Administrators: Fehlt der Zugang noch, entsteht
  // er jetzt. Einen vorhandenen erneuert TeO nie von selbst - auch nicht, wenn
  // sein Blatt nicht bestaetigt wurde: Die Bestaetigung kann schlicht noch
  // nicht in der gemeinsamen Datei stehen, und ein verwahrtes Blatt waere
  // dann wertlos. Dafuer steht der Hinweis auf der Uebersicht.
  async function offerEmergencyAccess() {
    if (!isAdmin() || isEmergencyUser(currentUser) || !emergencyAccessAvailable()) {
      return false;
    }
    if (document.querySelector("dialog[open]") || emergencyUser()) return false;
    return issueEmergencyAccess();
  }

  function showEmergencySheet(account, password, { renewed = false } = {}) {
    elements.emergencySheetIntroduction.textContent = renewed
      ? "TeO hat ein neues Notfallblatt erzeugt. Das bisherige Notfallpasswort gilt nicht mehr – vernichten Sie das alte Blatt."
      : "TeO hat einen Notfallzugang eingerichtet. Er ist ein eigenes Administratorkonto für den Fall, dass niemand mehr an den Datenbestand kommt.";
    elements.emergencySheetUsername.textContent = account.username;
    elements.emergencySheetPassword.textContent = password;
    elements.emergencySheetConfirmed.checked = false;
    elements.closeEmergencySheet.disabled = true;
    elements.emergencySheetPrintSurface.innerHTML = emergencySheetDocument(
      account,
      password,
    );
    if (!elements.emergencySheetDialog.open) elements.emergencySheetDialog.showModal();
    elements.printEmergencySheet.focus();
  }

  function emergencySheetDocument(account, password) {
    const fingerprint = String(automaticBackupSettings?.keyFingerprint || "").slice(0, 8);
    return `
      <article class="emergency-sheet-document">
        <p class="emergency-sheet-document-eyebrow">TeO – Team &amp; Employee Organizer</p>
        <h1>Notfallblatt</h1>
        <p>Ausgestellt am ${escapeHtml(formatDateTime(account.emergencyIssuedAt))}
          · Schlüssel ${escapeHtml(fingerprint)}</p>
        <dl>
          <dt>Benutzername</dt>
          <dd>${escapeHtml(account.username)}</dd>
          <dt>Notfallpasswort</dt>
          <dd class="emergency-sheet-document-password">${escapeHtml(password)}</dd>
        </dl>
        <h2>Im Notfall</h2>
        <ol>
          <li>TeO öffnen und mit diesem Benutzernamen und Passwort anmelden –
            Großbuchstaben und Bindestriche genau wie hier.</li>
          <li>Unter Konto → Benutzerverwaltung die Passwörter der
            Administratoren zurücksetzen.</li>
          <li>Danach unter Einstellungen → Daten ein neues Notfallblatt
            erzeugen und dieses Blatt vernichten.</li>
        </ol>
        <p class="emergency-sheet-document-warning">Wer dieses Blatt hat, hat
          vollen Zugriff auf alle Daten. Verschlossen und getrennt vom
          Arbeitsplatz aufbewahren.</p>
      </article>`;
  }

  async function confirmEmergencySheet() {
    const account = emergencyUser();
    if (account && !account.emergencySheetConfirmed) {
      const committed = await commitStateMutation(
        () => {
          state.users = state.users.map((item) =>
            item.id === account.id ? { ...item, emergencySheetConfirmed: true } : item,
          );
        },
        { auditAction: "Notfallblatt als verwahrt bestätigt" },
      );
      if (!committed) return;
      if (currentUser?.id === account.id) {
        currentUser = state.users.find((item) => item.id === account.id);
      }
    }
    elements.emergencySheetPassword.textContent = "";
    elements.emergencySheetPrintSurface.innerHTML = "";
    elements.emergencySheetDialog.close();
    showToast("Das Notfallblatt ist verwahrt.");
  }

  function printEmergencySheet() {
    document.body.classList.add("print-emergency-sheet");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-emergency-sheet"), 0);
  }

  async function copyEmergencySheetPassword() {
    try {
      await navigator.clipboard.writeText(elements.emergencySheetPassword.textContent);
      showToast("Das Notfallpasswort wurde kopiert.");
    } catch {
      showToast("Das Passwort konnte nicht kopiert werden.", "error");
    }
  }

  function requestNewEmergencySheet() {
    if (!requireAdmin()) return;
    if (!emergencyAccessAvailable()) {
      showToast(
        "Ein Notfallblatt lässt sich nur im lokalen Betrieb mit verschlüsseltem Datenbestand erzeugen.",
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Neues Notfallblatt erzeugen?",
      message:
        "TeO erzeugt ein neues Notfallpasswort. Das bisherige Notfallblatt gilt danach nicht mehr; ältere Sicherungsdateien lassen sich mit ihm aber weiterhin öffnen.",
      acceptLabel: "Neues Notfallblatt",
      tone: "primary",
      callback: () => void issueEmergencyAccess(),
    });
  }

  // Anmeldung mit dem Notfallzugang: vermerken und allen Administratoren
  // anzeigen, bis einer den Hinweis bestaetigt.
  async function recordEmergencyAccessUse() {
    if (!isEmergencyUser(currentUser) || emergencyAccessUseRecorded) return;
    emergencyAccessUseRecorded = true;
    const usedAt = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.users = state.users.map((item) =>
          item.id === currentUser.id
            ? { ...item, emergencyLastUsedAt: usedAt, emergencyUseAcknowledged: false }
            : item,
        );
      },
      { auditAction: "Anmeldung mit dem Notfallzugang" },
    );
    if (committed) currentUser = state.users.find((item) => item.id === currentUser.id);
    renderEmergencyAccessNotice();
    showToast(
      "Angemeldet mit dem Notfallzugang. Bitte danach ein neues Notfallblatt erzeugen.",
      "warning",
    );
  }

  // Bestaetigt, was der Hinweis meldet: eine Benutzung des Zugangs oder ein
  // Blatt, das bei der Ausgabe nicht als verwahrt bestaetigt wurde.
  async function acknowledgeEmergencyAccessUse() {
    if (!requireAdmin()) return;
    const account = emergencyUser();
    if (!account) return;
    const sheetPending = !account.emergencySheetConfirmed;
    if (!sheetPending && account.emergencyUseAcknowledged) return;
    await commitStateMutation(
      () => {
        state.users = state.users.map((item) =>
          item.id === account.id
            ? sheetPending
              ? { ...item, emergencySheetConfirmed: true }
              : { ...item, emergencyUseAcknowledged: true }
            : item,
        );
      },
      {
        auditAction: sheetPending
          ? "Notfallblatt als verwahrt bestätigt"
          : "Benutzung des Notfallzugangs zur Kenntnis genommen",
      },
    );
    renderEmergencyAccessNotice();
  }

  // Was der Hinweis ueber den Kennzahlen meldet, in dieser Reihenfolge: die
  // eigene Anmeldung mit dem Zugang, eine Benutzung, ein unbestaetigtes Blatt.
  function emergencyAccessNoticeContent() {
    const account = emergencyUser();
    if (isMariaDbMode() || !account || !isAdmin()) return null;
    if (isEmergencyUser(currentUser)) {
      return {
        title: "Angemeldet mit dem Notfallzugang",
        text: "Setzen Sie in der Benutzerverwaltung die Passwörter der Administratoren zurück und erzeugen Sie danach ein neues Notfallblatt – das bisherige ist geöffnet worden.",
        users: true,
      };
    }
    if (account.emergencyLastUsedAt && !account.emergencyUseAcknowledged) {
      return {
        title: "Der Notfallzugang wurde benutzt",
        text: `Anmeldung mit dem Notfallzugang am ${formatDateTime(
          account.emergencyLastUsedAt,
        )}. War das nicht abgesprochen, erzeugen Sie ein neues Notfallblatt und prüfen Sie das Änderungsprotokoll.`,
        acknowledge: "Zur Kenntnis genommen",
      };
    }
    if (!account.emergencySheetConfirmed) {
      return {
        title: "Notfallblatt nicht bestätigt",
        text: `Das Notfallblatt vom ${formatDateTime(
          account.emergencyIssuedAt,
        )} wurde nicht als verwahrt bestätigt. Liegt es nicht sicher vor, erzeugen Sie ein neues.`,
        acknowledge: "Blatt liegt vor",
      };
    }
    return null;
  }

  function renderEmergencyAccessNotice() {
    const content = emergencyAccessNoticeContent();
    elements.emergencyAccessNotice.hidden = !content;
    if (elements.issueEmergencySheetButton) {
      elements.issueEmergencySheetButton.hidden =
        isMariaDbMode() || !automaticBackupSettings?.encrypted;
    }
    if (!content) return;
    elements.emergencyAccessNoticeTitle.textContent = content.title;
    elements.emergencyAccessNoticeText.textContent = content.text;
    elements.emergencyAccessUsersButton.hidden = !content.users;
    elements.emergencyAccessAcknowledgeButton.hidden = !content.acknowledge;
    elements.emergencyAccessAcknowledgeButton.textContent = content.acknowledge || "";
  }

  // Anmeldung mit dem Wiederherstellungsschluessel statt des Passworts: Der
  // Schluessel oeffnet den Bestand, danach legt das Konto ein neues Passwort
  // fest - derselbe Weg wie nach einem Zuruecksetzen durch einen
  // Administrator.
  async function startRecoveryKeyLogin() {
    const username = document.querySelector("#loginUsername").value.trim();
    if (!username) {
      elements.loginError.textContent =
        "Bitte zuerst den Benutzernamen eingeben, dessen Passwort neu festgelegt werden soll.";
      document.querySelector("#loginUsername").focus();
      return;
    }
    if (isMariaDbMode() || startupBackupImportRunning) return;
    elements.loginError.textContent = "";
    startupBackupImportRunning = true;
    let message;
    try {
      message = automaticBackupSettings?.firstSharedFilePending
        ? await openLocalStateWithRecoveryKey(username)
        : await loginWithSharedDataSet(username, "", { useRecoveryKey: true });
    } finally {
      startupBackupImportRunning = false;
    }
    if (message) elements.loginError.textContent = message;
  }

  function findUserByUsername(users, username) {
    const normalized = username.toLocaleLowerCase("de-DE");
    return users.find(
      (item) => item.username.toLocaleLowerCase("de-DE") === normalized,
    );
  }

  // Gemeinsamer Schluss beider Wege. Rueckgabe wie bei der Anmeldung: eine
  // Meldung fuer den Dialog, leer bei Erfolg.
  async function completeRecoveryKeyLogin(user) {
    if (isEmergencyUser(user)) {
      return "Der Notfallzugang wird über ein neues Notfallblatt erneuert, nicht über den Wiederherstellungsschlüssel.";
    }
    state.users = state.users.map((item) =>
      item.id === user.id ? { ...item, mustChangePassword: true } : item,
    );
    const account = state.users.find((item) => item.id === user.id);
    currentUser = account;
    appendAuditEntry("Anmeldung mit dem Wiederherstellungsschlüssel");
    if (!(await persistState())) {
      currentUser = null;
      return "Der Datenbestand konnte nicht gespeichert werden. Bitte erneut versuchen.";
    }
    databaseSaveReminderArmed = true;
    completeLogin(account);
    return "";
  }

  function bindEmergencyAccess() {
    elements.emergencySheetConfirmed.addEventListener("change", () => {
      elements.closeEmergencySheet.disabled = !elements.emergencySheetConfirmed.checked;
    });
    elements.closeEmergencySheet.addEventListener(
      "click",
      () => void confirmEmergencySheet(),
    );
    elements.printEmergencySheet.addEventListener("click", printEmergencySheet);
    elements.copyEmergencySheetPassword.addEventListener(
      "click",
      () => void copyEmergencySheetPassword(),
    );
    // Die Schaltflaechen der Benutzerverwaltung entstehen erst beim Zeichnen;
    // deren Klick nimmt die Liste entgegen.
    document.querySelectorAll("[data-issue-emergency-sheet]").forEach((button) => {
      button.addEventListener("click", requestNewEmergencySheet);
    });
    elements.emergencyAccessAcknowledgeButton.addEventListener(
      "click",
      () => void acknowledgeEmergencyAccessUse(),
    );
    elements.emergencyAccessUsersButton.addEventListener("click", openUserManagementDialog);
    elements.loginWithRecoveryKeyButton.addEventListener(
      "click",
      () => void startRecoveryKeyLogin(),
    );
    // Der Wiederherstellungsschluessel geht dem Notfallblatt voraus: Beide
    // entstehen bei der Einrichtung, das Blatt folgt, sobald der Schluessel
    // verwahrt ist.
    elements.automaticBackupRecoveryDialog.addEventListener("close", () => {
      window.setTimeout(() => void offerEmergencyAccess(), 0);
    });
  }
