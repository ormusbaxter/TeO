  // Die Befehlspalette: ein Feld für alles. Sie findet Ansichten, Aktionen und
  // Datensätze und führt beim Bestätigen aus, was gewählt wurde. Gesucht wird
  // über searchKey - also nachsichtig gegenüber Umlauten, „ß“ und Akzenten.
  const COMMAND_PALETTE_LIMIT = 24;
  const COMMAND_PALETTE_GROUP_LIMIT = 5;

  let commandPaletteMatches = [];
  let commandPaletteIndex = 0;
  // Die Datensätze werden je Änderung einmal aufbereitet, nicht bei jedem
  // Tastendruck: Der Zähler der Änderungen sagt, wann das nötig ist.
  let commandPaletteRecordCache = { sequence: -1, userId: "", records: [] };

  function bindCommandPalette() {
    elements.openCommandPaletteButton?.addEventListener("click", openCommandPalette);
    elements.commandPaletteInput?.addEventListener("input", () => {
      commandPaletteIndex = 0;
      renderCommandPalette();
    });
    elements.commandPaletteInput?.addEventListener("keydown", handleCommandPaletteKeydown);
    elements.commandPaletteResults?.addEventListener("click", (event) => {
      const option = event.target.closest("[data-command-index]");
      if (option) runCommandPaletteEntry(Number(option.dataset.commandIndex));
    });
  }

  function openCommandPalette() {
    if (!elements.commandPalette || elements.commandPalette.open) return;
    elements.commandPaletteInput.value = "";
    commandPaletteIndex = 0;
    renderCommandPalette();
    elements.commandPalette.showModal();
    elements.commandPaletteInput.focus();
  }

  function handleCommandPaletteKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!commandPaletteMatches.length) return;
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const count = commandPaletteMatches.length;
      commandPaletteIndex = (commandPaletteIndex + offset + count) % count;
      renderCommandPalette();
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!commandPaletteMatches.length) return;
      event.preventDefault();
      commandPaletteIndex = event.key === "Home" ? 0 : commandPaletteMatches.length - 1;
      renderCommandPalette();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runCommandPaletteEntry(commandPaletteIndex);
    }
  }

  // Erst schließen, dann ausführen: Was gewählt wurde, öffnet oft selbst einen
  // Dialog, und zwei übereinander wären einer zu viel.
  function runCommandPaletteEntry(index) {
    const entry = commandPaletteMatches[index];
    if (!entry) return;
    trackWorkspaceCommand(entry);
    elements.commandPalette.close();
    entry.run();
  }

  function renderCommandPalette() {
    const query = searchKey(elements.commandPaletteInput.value);
    commandPaletteMatches = matchingCommandPaletteEntries(query);
    if (commandPaletteIndex >= commandPaletteMatches.length) commandPaletteIndex = 0;

    if (!commandPaletteMatches.length) {
      elements.commandPaletteResults.innerHTML = renderEmptyState({
        title: "Nichts gefunden",
        text: "Kein Eintrag, keine Ansicht und keine Aktion passt zu dieser Eingabe.",
        compact: true,
      });
      const preview = document.querySelector("#commandPalettePreview");
      if (preview) preview.textContent = "";
      return;
    }

    let lastGroup = "";
    elements.commandPaletteResults.innerHTML = commandPaletteMatches
      .map((entry, index) => {
        const heading =
          entry.group === lastGroup
            ? ""
            : `<p class="command-palette-group">${escapeHtml(entry.group)}</p>`;
        lastGroup = entry.group;
        const active = index === commandPaletteIndex;
        return `${heading}<button
            class="command-palette-option ${active ? "is-active" : ""}"
            type="button"
            role="option"
            aria-selected="${active}"
            id="commandPaletteOption${index}"
            data-command-index="${index}"
          >
            <svg aria-hidden="true"><use href="#${entry.icon}"></use></svg>
            <span class="command-palette-label">${escapeHtml(entry.label)}</span>
            ${entry.hint ? `<span class="command-palette-hint">${escapeHtml(entry.hint)}</span>` : ""}
          </button>`;
      })
      .join("");

    elements.commandPaletteInput.setAttribute(
      "aria-activedescendant",
      `commandPaletteOption${commandPaletteIndex}`,
    );
    elements.commandPaletteResults
      .querySelector(".command-palette-option.is-active")
      ?.scrollIntoView({ block: "nearest" });
    const activeEntry = commandPaletteMatches[commandPaletteIndex];
    const preview = document.querySelector("#commandPalettePreview");
    if (preview) preview.innerHTML = `<span>${escapeHtml(activeEntry.group)}</span><strong>${escapeHtml(activeEntry.label)}</strong><small>${escapeHtml(activeEntry.hint || "Mit Enter ausführen")}</small>`;
  }

  // Ohne Eingabe stehen Ansichten und Aktionen bereit - die Palette ist dann
  // ein Inhaltsverzeichnis. Datensätze kommen erst mit einem Suchbegriff dazu,
  // sonst wäre die Liste nur lang.
  function matchingCommandPaletteEntries(query) {
    const groups = [workspaceCommandPaletteEntries(), commandPaletteViews(), commandPaletteActions()];
    if (query) groups.push(commandPaletteRecords());

    const matches = [];
    for (const group of groups) {
      const found = new Map();
      for (const entry of group) {
        const rank = commandPaletteRank(entry, query);
        if (rank < 0) continue;
        const bucket = found.get(entry.group);
        if (bucket) bucket.push({ entry, rank });
        else found.set(entry.group, [{ entry, rank }]);
      }
      for (const bucket of found.values()) {
        bucket.sort((a, b) => a.rank - b.rank);
        const limit = query ? COMMAND_PALETTE_GROUP_LIMIT : bucket.length;
        matches.push(...bucket.slice(0, limit).map((item) => item.entry));
      }
    }
    // Ohne Eingabe ist die Liste das Inhaltsverzeichnis und bleibt vollstaendig;
    // eine Suche dagegen wird gekappt, damit die besten Treffer oben stehen
    // und nicht in einer langen Liste untergehen.
    return query ? matches.slice(0, COMMAND_PALETTE_LIMIT) : matches;
  }

  // Ein Treffer am Wortanfang steht vor einem irgendwo in der Mitte, und der
  // Name zählt mehr als der Zusatz dahinter.
  function commandPaletteRank(entry, query) {
    if (!query) return 0;
    const label = entry.searchLabel ?? (entry.searchLabel = searchKey(entry.label));
    if (label.startsWith(query)) return 0;
    if (label.includes(query)) return 1;
    const extra =
      entry.searchExtra ??
      (entry.searchExtra = searchKey(`${entry.hint || ""} ${entry.keywords || ""}`));
    return extra.includes(query) ? 2 : -1;
  }

  function commandPaletteViews() {
    return Object.entries(VIEW_SHORTCUTS).map(([key, view]) => {
      const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
      return {
        group: "Ansichten",
        icon:
          navItem?.querySelector("use")?.getAttribute("href")?.replace("#", "") ||
          "icon-dashboard",
        label: navItem?.querySelector("span")?.textContent.trim() || view,
        hint: `g ${key}`,
        run: () => showView(view),
      };
    });
  }

  function commandPaletteActions() {
    const entries = [
      { label: "Mitarbeiter anlegen", icon: "icon-users", run: () => openEmployeeDialog() },
      { label: "Termin anlegen", icon: "icon-calendar", run: () => openAppointmentDialog() },
      { label: "Memo / ToDo anlegen", icon: "icon-memo", run: () => openMemoDialog() },
      {
        label: "Pflichtfortbildung anlegen",
        icon: "icon-training",
        run: () => openTrainingDialog(),
      },
      {
        label: "Fortbildungsnachweis anlegen",
        icon: "icon-clipboard-check",
        run: () => openCompletionDialog(),
      },
      { label: "Teamsitzung anlegen", icon: "icon-meeting", run: () => openMeetingDialog() },
      {
        label: "Geräteeinweisung anlegen",
        icon: "icon-device",
        run: () => openDeviceInstructionDialog(),
      },
      { label: "Gerät anlegen", icon: "icon-construction", run: () => openDeviceDialog() },
      {
        label: "Sicherung exportieren",
        icon: "icon-download",
        keywords: "Datensicherung Backup speichern",
        run: () => void exportDatabase(),
      },
      {
        label: "Datenqualität prüfen",
        icon: "icon-check",
        keywords: "Plausibilität Auffälligkeiten",
        run: () => openDataQualityDialog(),
      },
      {
        label: "Arbeitsliste: Überfällig",
        icon: "icon-alert",
        keywords: "Dashboard Fristen offen Aufgaben",
        run: () => {
          workQueueFilter = "overdue";
          showView("dashboard");
          renderDesktopWorkspace();
          document.querySelector("#dashboardWorkQueuePanel")?.scrollIntoView({ block: "start" });
        },
      },
      {
        label: "Mitarbeiter: aktuell Beschäftigte",
        icon: "icon-users",
        keywords: "Filter aktiv Einarbeitung",
        run: () => {
          employeeStatusFilter = "employed";
          showView("employees");
          renderEmployees();
        },
      },
      {
        label: "Berufe und Qualifikationen",
        icon: "icon-edit",
        keywords: "Katalog Stammdaten",
        run: () => openCatalogManagementDialog(),
      },
      { label: "Tastenkürzel", icon: "icon-keyboard", run: openShortcutsDialog },
      { label: "Abmelden", icon: "icon-logout", run: () => logout() },
    ];

    if (isAdmin()) {
      entries.push(
        {
          label: "Änderungsprotokoll",
          icon: "icon-clipboard-check",
          keywords: "Audit Nachvollziehbarkeit",
          run: () => openAuditLogDialog(),
        },
        {
          label: "Benutzerverwaltung",
          icon: "icon-lock",
          keywords: "Konten Passwort Rollen",
          run: () => openUserManagementDialog(),
        },
      );
    }

    return entries.map((entry) => ({ group: "Aktionen", hint: "", ...entry }));
  }

  // Ein Datensatz führt dorthin, wo man ihn bearbeitet - und die Ansicht
  // dahinter wechselt mit, damit nach dem Schließen nicht die alte Seite steht.
  function commandPaletteRecords() {
    // Auch das angemeldete Konto zaehlt: Es entscheidet, welche Memos
    // ueberhaupt sichtbar sind.
    if (
      commandPaletteRecordCache.sequence === stateMutationSequence &&
      commandPaletteRecordCache.userId === (currentUser?.id || "")
    ) {
      return commandPaletteRecordCache.records;
    }

    const records = [
      ...state.employees.map((employee) => ({
        group: "Mitarbeiter",
        icon: "icon-users",
        label: fullName(employee),
        hint: employee.profession || "",
        keywords: employee.email || "",
        run: () => {
          showView("employees");
          openEmployeeDossier(employee.id);
        },
      })),
      ...state.appointments.map((appointment) => ({
        group: "Termine",
        icon: "icon-calendar",
        label: appointment.title,
        hint: `${formatDate(appointment.date)}${appointment.location ? ` · ${appointment.location}` : ""}`,
        run: () => {
          showView("appointments");
          openAppointmentDialog(appointment.id);
        },
      })),
      ...state.memos
        .filter((memo) => memoVisibleToCurrentUser(memo))
        .map((memo) => ({
          group: "Memo / ToDo",
          icon: "icon-memo",
          label: memo.title,
          hint: memo.category || formatDate(memo.date),
          run: () => {
            showView("memos");
            openMemoDialog(memo.id);
          },
        })),
      ...state.trainings.map((training) => ({
        group: "Pflichtfortbildungen",
        icon: "icon-training",
        label: training.title,
        hint: String(training.year || ""),
        run: () => {
          showView("trainings");
          openTrainingDialog(training.id);
        },
      })),
      ...state.meetings.map((meeting) => ({
        group: "Teamsitzungen",
        icon: "icon-meeting",
        label: meeting.title,
        hint: formatDate(meeting.date),
        run: () => {
          showView("meetings");
          openMeetingDialog(meeting.id);
        },
      })),
      ...state.devices.map((device) => ({
        group: "Geräte",
        icon: "icon-device",
        label: deviceLabel(device),
        hint: device.category || "",
        run: () => {
          showView("device-management");
          openDeviceDialog(device.id);
        },
      })),
    ];

    commandPaletteRecordCache = {
      sequence: stateMutationSequence,
      userId: currentUser?.id || "",
      records,
    };
    return records;
  }
