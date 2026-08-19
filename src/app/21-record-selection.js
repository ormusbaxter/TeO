  // Mehrfachauswahl für Karten - Termine, Memos und Geräte.
  //
  // Gewählt wird wie in einer Dateiliste: Strg klickt einzelne Karten hinzu,
  // Umschalt einen Bereich bis zur zuletzt angeklickten. Ein gewöhnlicher
  // Klick bleibt der Schnellansicht vorbehalten und hebt eine bestehende
  // Auswahl auf. Die Sammelaktionen sind zurücknehmbar wie jede andere
  // Änderung auch.
  const selectedRecords = { appointment: new Set(), memo: new Set(), device: new Set() };
  const recordSelectionAnchors = {};

  function recordSelectionDefinitions() {
    return {
      appointment: {
        bar: "#appointmentBulkBar",
        count: "#appointmentBulkCount",
        actions: "#appointmentBulkActions",
        singular: "Termin",
        plural: "Termine",
        // Die Reihenfolge der Karten in der Ansicht bestimmt, was „dazwischen“
        // heißt - nicht die Reihenfolge im Datenbestand.
        visibleIds: () =>
          [...document.querySelectorAll("#appointmentWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          {
            label: "Anpinnen",
            icon: "icon-star",
            run: () => setAppointmentsPinned(ids, true),
          },
          {
            label: "Nicht mehr anpinnen",
            icon: "icon-star",
            run: () => setAppointmentsPinned(ids, false),
          },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteAppointments(ids) },
        ],
      },
      memo: {
        bar: "#memoBulkBar",
        count: "#memoBulkCount",
        actions: "#memoBulkActions",
        singular: "Eintrag",
        plural: "Einträge",
        visibleIds: () =>
          [...document.querySelectorAll("#memoWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          { label: "Erledigt", icon: "icon-check", run: () => setMemosCompleted(ids, true) },
          { label: "Wieder öffnen", icon: "icon-memo", run: () => setMemosCompleted(ids, false) },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteMemos(ids) },
        ],
      },
      device: {
        bar: "#deviceBulkBar",
        count: "#deviceBulkCount",
        actions: "#deviceBulkActions",
        singular: "Gerät",
        plural: "Geräte",
        visibleIds: () =>
          [...document.querySelectorAll("#deviceWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          {
            label: "Im Bestand",
            icon: "icon-check",
            run: () => setDevicesInventory(ids, true),
          },
          {
            label: "Nicht mehr im Bestand",
            icon: "icon-empty",
            run: () => setDevicesInventory(ids, false),
          },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteDevices(ids) },
        ],
      },
    };
  }

  function bindRecordSelection() {
    for (const [type, definition] of Object.entries(recordSelectionDefinitions())) {
      document
        .querySelector(definition.bar)
        ?.addEventListener("click", (event) => handleRecordBulkAction(type, event));
    }
  }

  // Wird aus der Kartenbehandlung der Schnellansicht heraus gefragt: Gehört
  // dieser Klick zur Auswahl statt zur Ansicht?
  function handleRecordSelectionClick(type, event, id) {
    if (!selectedRecords[type]) return false;

    if (event.shiftKey) {
      selectRecordRange(type, id);
      return true;
    }
    if (event.ctrlKey || event.metaKey) {
      toggleRecordSelection(type, id);
      recordSelectionAnchors[type] = id;
      return true;
    }
    // Ein gewöhnlicher Klick räumt eine bestehende Auswahl ab und führt sonst
    // wie bisher in die Schnellansicht.
    if (selectedRecords[type].size) {
      clearRecordSelection(type);
    }
    recordSelectionAnchors[type] = id;
    return false;
  }

  function toggleRecordSelection(type, id) {
    if (selectedRecords[type].has(id)) selectedRecords[type].delete(id);
    else selectedRecords[type].add(id);
    renderRecordSelection(type);
  }

  function selectRecordRange(type, id) {
    const visible = recordSelectionDefinitions()[type].visibleIds();
    const anchor = recordSelectionAnchors[type];
    const from = visible.indexOf(anchor);
    const to = visible.indexOf(id);
    if (from < 0 || to < 0) {
      selectedRecords[type].add(id);
      recordSelectionAnchors[type] = id;
    } else {
      visible
        .slice(Math.min(from, to), Math.max(from, to) + 1)
        .forEach((entry) => selectedRecords[type].add(entry));
    }
    renderRecordSelection(type);
  }

  function clearRecordSelection(type) {
    selectedRecords[type].clear();
    renderRecordSelection(type);
  }

  // Zugriff von aussen - etwa aus dem Kontextmenue - laeuft ueber diese
  // Abfrage statt ueber die Sammlung selbst.
  function selectedRecordIds(type) {
    return [...(selectedRecords[type] || [])];
  }

  function hasRecordSelection() {
    return Object.values(selectedRecords).some((selection) => selection.size > 0);
  }

  function clearAllRecordSelections() {
    Object.keys(selectedRecords).forEach(clearRecordSelection);
  }

  // Nach jedem Neuaufbau der Liste: Was nicht mehr in ihr steht, fällt aus der
  // Auswahl - gelöscht oder weggefiltert. Eine Sammelaktion trifft damit immer
  // genau das, was auch zu sehen ist. Nur hier wird abgeräumt: Beim Auswählen
  // selbst steht die Liste ja unverändert.
  function refreshRecordSelection(type) {
    const visible = new Set(recordSelectionDefinitions()[type].visibleIds());
    [...selectedRecords[type]].forEach((id) => {
      if (!visible.has(id)) selectedRecords[type].delete(id);
    });
    renderRecordSelection(type);
  }

  function renderRecordSelection(type) {
    const definition = recordSelectionDefinitions()[type];
    const bar = document.querySelector(definition.bar);
    const visible = new Set(definition.visibleIds());

    visible.forEach((id) => {
      document
        .querySelectorAll(`[data-record-card="${CSS.escape(id)}"]`)
        .forEach((card) => card.classList.toggle("is-selected", selectedRecords[type].has(id)));
    });

    if (!bar) return;
    const count = selectedRecords[type].size;
    bar.hidden = count === 0;
    document.querySelector(definition.count).textContent = `${count} ${
      count === 1 ? definition.singular : definition.plural
    } ausgewählt`;
    document.querySelector(definition.actions).innerHTML = definition
      .bulkActions([...selectedRecords[type]])
      .map(
        (action, index) => `
          <button
            class="button ${action.danger ? "button-danger" : "button-secondary"} button-compact"
            type="button"
            data-record-bulk="${index}"
          >
            ${action.icon ? `<svg><use href="#${action.icon}"></use></svg>` : ""}${escapeHtml(action.label)}
          </button>
        `,
      )
      .join("");
  }

  function handleRecordBulkAction(type, event) {
    if (event.target.closest("[data-clear-record-selection]")) {
      clearRecordSelection(type);
      return;
    }
    const button = event.target.closest("[data-record-bulk]");
    if (!button) return;
    const ids = [...selectedRecords[type]];
    if (!ids.length) return;
    recordSelectionDefinitions()[type].bulkActions(ids)[Number(button.dataset.recordBulk)]?.run();
  }

  // Die Sammelaktionen selbst. Jede ist eine einzige Änderung - damit steht
  // auch nur ein Schritt im Protokoll und einer zum Zurücknehmen.
  async function setAppointmentsPinned(ids, pinned) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.appointments.forEach((appointment) => {
          if (!ids.includes(appointment.id)) return;
          appointment.pinned = pinned;
          appointment.updatedAt = now;
        });
      },
      { undo: `${ids.length} Termine geändert` },
    );
    if (committed) {
      showUndoToast(`${ids.length} Termine ${pinned ? "angepinnt" : "gelöst"}.`);
    }
  }

  function deleteAppointments(ids) {
    requestConfirmation({
      title: `${ids.length} Termine löschen?`,
      message: `Die ausgewählten Termine werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.`,
      acceptLabel: "Termine löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.appointments = state.appointments.filter(
              (appointment) => !ids.includes(appointment.id),
            );
          },
          { undo: `${ids.length} Termine gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("appointment");
        showUndoToast(`${ids.length} Termine wurden gelöscht.`);
      },
    });
  }

  async function setMemosCompleted(ids, completed) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.memos.forEach((memo) => {
          if (!ids.includes(memo.id) || !memoVisibleToCurrentUser(memo)) return;
          memo.completed = completed;
          memo.updatedAt = now;
        });
      },
      { undo: `${ids.length} Einträge geändert` },
    );
    if (committed) {
      showUndoToast(`${ids.length} Einträge ${completed ? "erledigt" : "wieder geöffnet"}.`);
    }
  }

  function deleteMemos(ids) {
    requestConfirmation({
      title: `${ids.length} Einträge löschen?`,
      message:
        "Die ausgewählten Memos und ToDos werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Einträge löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.memos = state.memos.filter(
              (memo) => !ids.includes(memo.id) || !memoVisibleToCurrentUser(memo),
            );
          },
          { undo: `${ids.length} Einträge gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("memo");
        showUndoToast(`${ids.length} Einträge wurden gelöscht.`);
      },
    });
  }

  async function setDevicesInventory(ids, currentInventory) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.devices.forEach((device) => {
          if (!ids.includes(device.id)) return;
          device.currentInventory = currentInventory;
          device.updatedAt = now;
        });
      },
      { undo: `${ids.length} Geräte geändert` },
    );
    if (committed) {
      showUndoToast(
        `${ids.length} Geräte ${currentInventory ? "als aktuell" : "als nicht mehr im Bestand"} vermerkt.`,
      );
    }
  }

  function deleteDevices(ids) {
    const instructionCount = state.deviceInstructions.filter((instruction) =>
      ids.includes(instruction.deviceId),
    ).length;
    requestConfirmation({
      title: `${ids.length} Geräte löschen?`,
      message: instructionCount
        ? `Mit den Geräten werden ${instructionCount} Einweisungsnachweise entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.`
        : "Die ausgewählten Geräte werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Geräte löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.devices = state.devices.filter((device) => !ids.includes(device.id));
            state.deviceInstructions = state.deviceInstructions.filter(
              (instruction) => !ids.includes(instruction.deviceId),
            );
          },
          { undo: `${ids.length} Geräte gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("device");
        showUndoToast(`${ids.length} Geräte wurden gelöscht.`);
      },
    });
  }

  // Mehrere Mitarbeiter auf einmal loeschen. Der Umfang entspricht dem
  // einzelnen Loeschen: Nachweise, Sitzungsstatus, Urlaubseintraege und
  // Einweisungen der Betroffenen gehen mit.
  function deleteEmployees(ids) {
    const verantwortliche = ids
      .map(getEmployee)
      .filter((employee) => employee && serviceWeekendOwnerKey(employee.id));
    if (verantwortliche.length) {
      showToast(
        `${verantwortliche
          .map(fullName)
          .join(", ")} ist für ein Dienstwochenende verantwortlich. Bitte zuerst die verantwortliche Person in den Einstellungen ändern.`,
        "error",
      );
      return;
    }

    requestConfirmation({
      title: `${ids.length} Mitarbeiter löschen?`,
      message:
        "Mit den Personen werden ihre Fortbildungsnachweise, Sitzungsstatus, Planungseinträge und Einweisungen gelöscht. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Mitarbeiter löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            const betroffen = new Set(ids);
            state.employees = state.employees.filter((employee) => !betroffen.has(employee.id));
            state.completions = state.completions.filter(
              (completion) => !betroffen.has(completion.employeeId),
            );
            state.meetingAttendances = state.meetingAttendances.filter(
              (attendance) => !betroffen.has(attendance.employeeId),
            );
            state.vacationEntitlements = state.vacationEntitlements.filter(
              (entitlement) => !betroffen.has(entitlement.employeeId),
            );
            state.vacationDays = state.vacationDays.filter(
              (vacationDay) => !betroffen.has(vacationDay.employeeId),
            );
            state.deviceInstructions = state.deviceInstructions
              .map((instruction) => ({
                ...instruction,
                instructorEmployeeId: betroffen.has(instruction.instructorEmployeeId)
                  ? ""
                  : instruction.instructorEmployeeId,
                participants: instruction.participants.filter(
                  (participant) => !betroffen.has(participant.employeeId),
                ),
              }))
              .filter((instruction) => instruction.participants.length);
            state.meetings.forEach((meeting) => {
              meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter(
                (employeeId) => !betroffen.has(employeeId),
              );
            });
          },
          { undo: `${ids.length} Mitarbeiter gelöscht` },
        );
        if (!committed) return;
        clearEmployeeSelection();
        showUndoToast(`${ids.length} Mitarbeiter wurden gelöscht.`);
      },
    });
  }
