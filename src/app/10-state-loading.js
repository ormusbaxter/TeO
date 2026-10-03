  async function initialize() {
    if (!window.localforage) {
      throw new Error("localForage konnte nicht geladen werden.");
    }
    if (!window.TeOBackend) {
      throw new Error("Die TeO-Backend-Komponente konnte nicht geladen werden.");
    }

    dataStore = window.localforage.createInstance({
      name: "IntensivTeam",
      storeName: "personalverwaltung",
      description: "Lokale Mitarbeiter- und Pflichtfortbildungsverwaltung",
    });
    await dataStore.setDriver([
      window.localforage.INDEXEDDB,
      window.localforage.LOCALSTORAGE,
    ]);
    backendConfig = window.TeOBackend.readConfig();
    backendMode = backendConfig.mode;
    backendConnectionStatus = isMariaDbMode() ? "checking" : "local";
    state = await loadState();
    localLastSaveAt = await loadLocalSaveTimestamp();
    await loadAutomaticBackupConfiguration();
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
    window.addEventListener("beforeunload", handleBeforeUnload);
    initializeFormattedDateInputs();
    applyTheme(activeThemeKey());
    renderProjectMetadata();

    const today = todayIso();
    document.querySelector("#birthDate").max = today;
    elements.completionDate.max = today;
    elements.deviceInstructionDate.max = today;

    bindNavigation();
    bindSidebarOrder();
    bindSidebarCollapse();
    bindKeyboardShortcuts();
    bindCommandPalette();
    bindViewFilterChips();
    bindRecordInspectors();
    bindRecordSelection();
    bindContextMenu();
    bindDragAndDrop();
    bindTableComfort();
    bindDesktopWorkspace();
    bindWhatsNew();
    bindDialogTriggers();
    bindForms();
    bindFilters();
    bindDelegatedActions();
    bindDialogs();
    bindAuthentication();
    bindCatalogManagement();
    bindDataSync();
    bindRemoteSync();

    observeDynamicStyles();
    const initialHash = window.location.hash.replace("#", "");
    showView(HASH_VIEWS[initialHash] || "dashboard", false);
    renderAll();
    // Erst nach dem ersten Aufbau: Vorher stehen in den Auswahlfeldern weder
    // Berufe noch Kategorien, ein gemerkter Wert liefe ins Leere.
    restoreRememberedViewFilters();
    restoreAuthenticationSession();
    if (discardedUserAccounts > 0) {
      showToast(
        `${discardedUserAccounts} Benutzerkonto/-konten waren ungültig oder doppelt vergeben und wurden nicht übernommen.`,
        "warning",
      );
      discardedUserAccounts = 0;
    }
    void refreshBackendHealth();
    registerServiceWorker();
  }

  // Haelt die Anwendung selbst offline verfuegbar. Der Datenbestand liegt
  // ohnehin lokal; ohne Zwischenspeicher laedt bei fehlender Verbindung
  // lediglich die Seite nicht. Beim Oeffnen per Doppelklick (file://) und in
  // unsicheren Kontexten steht die Schnittstelle nicht bereit - dann arbeitet
  // TeO wie bisher ohne Zwischenspeicher weiter.
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn(
        "Der Offlinebetrieb konnte nicht eingerichtet werden.",
        error,
      );
    });
  }

  function emptyState() {
    return {
      version: STATE_VERSION,
      employees: [],
      trainings: [],
      completions: [],
      meetings: [],
      meetingAttendances: [],
      appointments: [],
      memos: [],
      devices: createDefaultDeviceCatalog(),
      deviceInstructions: [],
      vacationEntitlements: [],
      vacationDays: [],
      settings: {
        theme: "standard",
        lastBackupAt: "",
        backupReminderDays: DEFAULT_BACKUP_REMINDER_DAYS,
        maxBackupFileSizeMb: DEFAULT_MAX_BACKUP_FILE_SIZE_MB,
        closeDialogOnOutsideClick: false,
        schoolVacationPeriods: normalizeSchoolVacationPeriods(
          NRW_SCHOOL_VACATION_PERIODS,
        ),
        meetingAttendanceThreshold: 70,
        vacationBaseDays: DEFAULT_VACATION_BASE_DAYS,
        vacationWeekendAReferenceSaturday:
          DEFAULT_WEEKEND_A_REFERENCE_SATURDAY,
        vacationWeekdayAbsenceLimit: DEFAULT_WEEKDAY_ABSENCE_LIMIT,
        vacationWeekendAbsenceLimit: DEFAULT_WEEKEND_ABSENCE_LIMIT,
        vacationSortGroupOrder: [...DEFAULT_VACATION_SORT_GROUP_ORDER],
        vacationCarryOverExpiry: DEFAULT_VACATION_CARRY_OVER_EXPIRY,
        serviceWeekends: {
          weekend_a: {
            name: SERVICE_WEEKENDS.weekend_a,
            ownerId: "",
          },
          weekend_b: {
            name: SERVICE_WEEKENDS.weekend_b,
            ownerId: "",
          },
        },
        deadlineKinds: [...DEADLINE_KINDS],
        deadlineKindsSeen: [...DEADLINE_KINDS],
        deadlineHideOverdue: false,
      },
      users: initialUsers(),
      auditLog: [],
      catalogs: {
        professions: [...DEFAULT_PROFESSIONS],
        qualifications: Object.entries(DEFAULT_QUALIFICATIONS).map(([id, label]) => ({
          id,
          label,
        })),
        memoCategories: [...DEFAULT_MEMO_CATEGORIES],
      },
    };
  }

  async function loadState() {
    if (isMariaDbMode()) {
      return loadMariaDbState();
    }

    try {
      let parsed = await dataStore.getItem(STORAGE_KEY);

      if (!parsed) {
        try {
          const legacyRaw = localStorage.getItem(STORAGE_KEY);
          if (legacyRaw) {
            parsed = JSON.parse(legacyRaw);
            await dataStore.setItem(STORAGE_KEY, parsed);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (migrationError) {
          console.warn("Vorhandene localStorage-Daten konnten nicht migriert werden.", migrationError);
        }
      }

      if (!parsed) return emptyState();
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (!parsed || typeof parsed !== "object") return emptyState();

      const normalizedState = normalizeState(parsed);
      if (Number(parsed.version) !== STATE_VERSION) {
        await dataStore.setItem(STORAGE_KEY, normalizedState);
      }
      return normalizedState;
    } catch (error) {
      console.warn("Gespeicherte Daten konnten nicht geladen werden.", error);
      return emptyState();
    }
  }

  function isMariaDbMode() {
    return backendMode === "mariadb";
  }

  async function loadLocalSaveTimestamp() {
    if (isMariaDbMode()) return "";
    try {
      const value = String(
        (await dataStore.getItem(LOCAL_SAVE_TIMESTAMP_KEY)) || "",
      );
      return Number.isFinite(new Date(value).getTime()) ? value : "";
    } catch (error) {
      console.warn(
        "Der Zeitpunkt der letzten lokalen Speicherung konnte nicht geladen werden.",
        error,
      );
      return "";
    }
  }

  async function loadMariaDbState() {
    const token = window.TeOBackend.readToken();
    if (!token) return emptyState();

    try {
      const [health, result] = await Promise.all([
        window.TeOBackend.health(backendConfig.apiUrl, token),
        window.TeOBackend.load(backendConfig.apiUrl, token),
      ]);
      markBackendConnected({ health, synchronized: true });
      remoteRevision = Number(result.revision) || 0;
      backendStartupError = "";
      return normalizeState(result.state);
    } catch (error) {
      console.warn("MariaDB-Datenbestand konnte nicht geladen werden.", error);
      backendStartupError = error.message || "Der TeO-Server ist nicht erreichbar.";
      markBackendConnectionError(error);
      if (error.status === 401) {
        window.TeOBackend.writeToken("");
        sessionStorage.removeItem(SESSION_USER_KEY);
      }
      return emptyState();
    }
  }
