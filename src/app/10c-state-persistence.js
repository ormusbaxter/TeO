  async function persistState() {
    if (isMariaDbMode()) {
      const token = window.TeOBackend.readToken();
      if (!token) {
        showToast("Die Serversitzung ist abgelaufen. Bitte erneut anmelden.", "error");
        showLoginDialog();
        return false;
      }

      try {
        const result = await window.TeOBackend.save(
          backendConfig.apiUrl,
          token,
          state,
          remoteRevision,
        );
        remoteRevision = Number(result.revision) || remoteRevision + 1;
        markBackendConnected({ synchronized: true });
        pendingRemoteConflictState = null;
      } catch (error) {
        console.error("MariaDB-Datenbestand konnte nicht gespeichert werden.", error);
        if (error.status) markBackendConnected();
        else markBackendConnectionError(error);
        if (error.code === "revision_conflict" && error.details?.state) {
          remoteRevision = Number(error.details.revision) || remoteRevision;
          pendingRemoteConflictState = normalizeState(error.details.state);
          showToast(
            "Ein anderer Arbeitsplatz hat den Datenbestand verändert. Die aktuellen Serverdaten wurden geladen; bitte die Änderung erneut eingeben.",
            "error",
          );
        } else if (error.status === 401) {
          window.TeOBackend.writeToken("");
          showToast("Die Serversitzung ist abgelaufen. Bitte erneut anmelden.", "error");
          showLoginDialog();
        } else {
          showToast(
            error.message || "Speichern in MariaDB ist fehlgeschlagen.",
            "error",
          );
        }
        return false;
      }
    } else {
      try {
        await dataStore.setItem(STORAGE_KEY, state);
        localLastSaveAt = new Date().toISOString();
      } catch (error) {
        console.error("Daten konnten nicht gespeichert werden.", error);
        showToast(
          "Speichern fehlgeschlagen. Der Browserspeicher ist möglicherweise voll.",
          "error",
        );
        return false;
      }
      try {
        await dataStore.setItem(LOCAL_SAVE_TIMESTAMP_KEY, localLastSaveAt);
      } catch (error) {
        console.warn(
          "Der Zeitpunkt der lokalen Speicherung konnte nicht vorgemerkt werden.",
          error,
        );
      }
      renderSidebarSystemStatus();
    }

    try {
      dataSyncChannel?.postMessage({
        type: "state-updated",
        backend: backendMode,
      });
    } catch (syncError) {
      console.warn("Andere Tabs konnten nicht benachrichtigt werden.", syncError);
    }
    return true;
  }

  // auditAction ersetzt die automatisch ermittelte Beschreibung. Eine leere
  // Zeichenkette laesst den Protokolleintrag ganz weg - fuer Aenderungen, die
  // nur die Anzeige eines einzelnen Kontos betreffen und den fachlichen
  // Datenbestand unberuehrt lassen.
  //
  // undo benennt die Aenderung fuer ein spaeteres Zuruecknehmen („Mitarbeiter
  // gelöscht“). Der Schnappschuss davor entsteht ohnehin fuer den Ruecklauf,
  // ein Schritt zurueck kostet also nur, ihn aufzuheben. Ohne undo verfaellt
  // der zuletzt gemerkte Schritt: Was danach passiert ist, laesst sich nicht
  // mehr ueberspringen.
  async function commitStateMutation(mutate, { auditAction, undo = "" } = {}) {
    // Die Kopie fuer den Ruecklauf entsteht ueber JSON: In Chromium ist der
    // Umweg ueber Text fuer diesen Bestand messbar schneller als
    // structuredClone (6,5 ms gegenueber 11 ms bei 3600 Nachweisen).
    const previousState = JSON.parse(JSON.stringify(state));
    mutate();
    appendAuditEntry(
      auditAction === undefined
        ? describeMutation(previousState, state)
        : auditAction,
      describeEmployeeChanges(previousState, state),
    );

    if (await persistState()) {
      stateMutationSequence += 1;
      databaseSaveReminderArmed = true;
      undoableMutation = undo ? { label: undo, state: previousState } : null;
      renderAll();
      scheduleAutomaticBackup();
      return true;
    }

    // Nach einem Ruecklauf auf den eigenen Stand bleibt ein gemerkter Schritt
    // gueltig - der Datenbestand ist derselbe wie zuvor. Hat dagegen der
    // Server einen anderen Stand geschickt, passt der Schnappschuss nicht mehr
    // dazu und wuerde fremde Aenderungen ueberschreiben.
    if (pendingRemoteConflictState) undoableMutation = null;
    state = pendingRemoteConflictState || previousState;
    pendingRemoteConflictState = null;
    if (currentUser) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    if (currentUser?.mustChangePassword) {
      completeLogin(currentUser);
      showToast(
        "Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.",
      );
      return false;
    }
    renderAll();
    return false;
  }

  function hasUndoableMutation() {
    return Boolean(undoableMutation);
  }

  // Nimmt den zuletzt gemeldeten Schritt zurueck. Das Zuruecknehmen ist selbst
  // eine Aenderung: Es wird gespeichert und steht im Protokoll, damit im
  // Nachhinein nachvollziehbar bleibt, was wann verschwand und wiederkam.
  async function undoLastMutation() {
    if (!undoableMutation) {
      showToast("Es ist kein Schritt gemerkt, der sich zurücknehmen lässt.", "warning");
      return false;
    }
    const { label, state: snapshot } = undoableMutation;
    undoableMutation = null;
    const committed = await commitStateMutation(
      () => {
        // Das Protokoll bleibt, wie es ist: Der Schnappschuss kennt den
        // zurueckgenommenen Schritt noch nicht, und ein Protokoll, das die
        // eigene Geschichte loescht, waere keins. Nach dem Zuruecknehmen
        // stehen beide Zeilen darin - die Aenderung und ihre Ruecknahme.
        const auditLog = state.auditLog;
        state = snapshot;
        state.auditLog = auditLog;
        // Der wiederhergestellte Bestand traegt eigene Kontoobjekte; ohne
        // diesen Abgleich zeigte die Oberflaeche weiter auf das alte.
        if (currentUser) {
          currentUser =
            state.users.find((user) => user.id === currentUser.id) || currentUser;
        }
      },
      { auditAction: `Rückgängig gemacht: ${label}` },
    );
    if (committed) showToast(`${label} – wieder hergestellt.`);
    return committed;
  }

  // Gibt die Kennung des angelegten Eintrags zurueck, damit ein Aufrufer ihn
  // gezielt wieder entfernen kann, wenn das Speichern anschliessend scheitert.
  // subjects nennt die betroffenen Mitarbeiter samt Art der Aenderung; daraus
  // entsteht der Aenderungsverlauf in der Mitarbeiter-Akte.
  function appendAuditEntry(action, subjects = []) {
    if (!action) return "";
    const id = createId();
    state.auditLog.unshift({
      id,
      timestamp: new Date().toISOString(),
      username: currentUser?.username || "System",
      action,
      ...(subjects.length ? { subjects } : {}),
    });
    state.auditLog = state.auditLog.slice(0, MAX_AUDIT_LOG_ENTRIES);
    return id;
  }

  // Welche Mitarbeiter eine Aenderung betrifft und wie. Verglichen werden nur
  // Sammlungen, die sich ueberhaupt geaendert haben - der Normalfall ist ein
  // einziger Eintrag, und der kurze Vergleich bricht beim ersten Unterschied ab.
  function describeEmployeeChanges(before, after) {
    const changes = new Map();
    const note = (employeeId, label, count = 1) => {
      if (!employeeId) return;
      if (!changes.has(employeeId)) changes.set(employeeId, new Map());
      const labels = changes.get(employeeId);
      labels.set(label, (labels.get(label) || 0) + count);
    };

    if (!sameStoredValue(before.employees, after.employees)) {
      const previous = new Map(before.employees.map((employee) => [employee.id, employee]));
      const current = new Map(after.employees.map((employee) => [employee.id, employee]));
      current.forEach((employee, id) => {
        const old = previous.get(id);
        if (!old) {
          note(id, "angelegt");
          return;
        }
        const fields = Object.entries(EMPLOYEE_FIELD_LABELS)
          .filter(([field]) => !sameStoredValue(old[field], employee[field]))
          .map(([, label]) => label);
        if (fields.length) note(id, `Stammdaten: ${fields.join(", ")}`);
      });
      previous.forEach((_, id) => {
        if (!current.has(id)) note(id, "gelöscht");
      });
    }

    EMPLOYEE_RELATED_COLLECTIONS.forEach(({ key, label, recordKey, employeeIdsOf }) => {
      if (!sameStoredValue(before[key], after[key])) {
        const previous = new Map(before[key].map((record) => [recordKey(record), record]));
        const current = new Map(after[key].map((record) => [recordKey(record), record]));
        const touched = (record) =>
          employeeIdsOf(record).forEach((employeeId) => note(employeeId, label));
        current.forEach((record, id) => {
          const old = previous.get(id);
          if (!old) touched(record);
          else if (!sameStoredValue(old, record)) {
            // Wechselt ein Eintrag den Mitarbeiter, betrifft er beide.
            new Set([...employeeIdsOf(old), ...employeeIdsOf(record)]).forEach(
              (employeeId) => note(employeeId, label),
            );
          }
        });
        previous.forEach((record, id) => {
          if (!current.has(id)) touched(record);
        });
      }
    });

    return [...changes]
      .slice(0, MAX_AUDIT_SUBJECTS)
      .map(([employeeId, labels]) => ({
        employeeId,
        change: [...labels]
          .map(([label, count]) =>
            count > 1 ? `${label}: ${count} Einträge` : label,
          )
          .join("; ")
          .slice(0, 240),
      }));
  }

  function describeMutation(before, after) {
    for (const [key, label] of TRACKED_COLLECTIONS) {
      const difference = after[key].length - before[key].length;
      if (difference > 0) return `${label}: ${difference} Eintrag/Einträge hinzugefügt`;
      if (difference < 0) return `${label}: ${Math.abs(difference)} Eintrag/Einträge gelöscht`;
      if (!sameStoredValue(before[key], after[key])) {
        return `${label} geändert`;
      }
    }
    if (!sameStoredValue(before.catalogs, after.catalogs)) {
      return "Berufs- oder Qualifikationskatalog geändert";
    }
    if (!sameStoredValue(before.settings, after.settings)) {
      return "Anwendungseinstellungen geändert";
    }
    return "Datenbestand aktualisiert";
  }

  // Verglichen wurde bisher ueber JSON.stringify: Fuer die Beschreibung einer
  // einzigen Aenderung wurde dabei der halbe Bestand in Text verwandelt, auch
  // die unveraenderten Sammlungen. Der Vergleich laeuft jetzt direkt ueber die
  // Werte, bricht beim ersten Unterschied ab und legt nichts an. Die Reihen-
  // folge der Felder spielt dabei - anders als bei JSON.stringify - keine
  // Rolle; nicht gesetzte Felder gelten wie zuvor als nicht vorhanden.
  function sameStoredValue(before, after) {
    if (before === after) return true;
    if (before === null || after === null) return false;
    if (typeof before !== "object" || typeof after !== "object") return false;

    if (Array.isArray(before) || Array.isArray(after)) {
      if (!Array.isArray(before) || !Array.isArray(after)) return false;
      if (before.length !== after.length) return false;
      for (let position = 0; position < before.length; position += 1) {
        if (!sameStoredValue(before[position], after[position])) return false;
      }
      return true;
    }

    // Ohne Zwischenlisten: Ein Vergleich laeuft ueber Zehntausende Objekte,
    // und je ein Array fuer die Schluesselnamen kostete dort mehr als der
    // Vergleich selbst.
    let beforeCount = 0;
    for (const key in before) {
      if (!Object.hasOwn(before, key) || before[key] === undefined) continue;
      beforeCount += 1;
      if (!sameStoredValue(before[key], after[key])) return false;
    }
    let afterCount = 0;
    for (const key in after) {
      if (Object.hasOwn(after, key) && after[key] !== undefined) afterCount += 1;
    }
    return beforeCount === afterCount;
  }

  function handleInitializationError(error) {
    console.error("Anwendung konnte nicht initialisiert werden.", error);
    const message = document.createElement("div");
    message.className = "noscript-message";
    message.textContent =
      "Die lokale Datenspeicherung konnte nicht gestartet werden. Bitte laden Sie die Seite neu oder verwenden Sie einen aktuellen Browser.";
    document.body.append(message);
  }
