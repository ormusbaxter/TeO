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
    await loadAutomaticBackupConfiguration();
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
    window.addEventListener("beforeunload", handleBeforeUnload);
    initializeFormattedDateInputs();
    applyTheme(state.settings.theme);
    renderProjectMetadata();

    const today = todayIso();
    document.querySelector("#birthDate").max = today;
    elements.completionDate.max = today;
    elements.deviceInstructionDate.max = today;

    bindNavigation();
    bindSidebarOrder();
    bindDialogTriggers();
    bindForms();
    bindFilters();
    bindDelegatedActions();
    bindDialogs();
    bindAuthentication();
    bindCatalogManagement();
    bindDataSync();
    bindRemoteSync();

    const initialHash = window.location.hash.replace("#", "");
    showView(HASH_VIEWS[initialHash] || "dashboard", false);
    renderAll();
    restoreAuthenticationSession();
    void refreshBackendHealth();
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

  async function loadMariaDbState() {
    const token = window.TeOBackend.readToken();
    if (!token) return emptyState();

    try {
      const [health, result] = await Promise.all([
        window.TeOBackend.health(backendConfig.apiUrl),
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

  function normalizeState(parsed) {
    const employees = Array.isArray(parsed.employees)
      ? parsed.employees.map(normalizeEmployee).filter(Boolean)
      : [];
    const assignedEmployeeUsernames = new Set();
    employees.forEach((employee) => {
      const normalizedUsername = employee.username.toLocaleLowerCase("de-DE");
      if (!normalizedUsername) return;
      if (assignedEmployeeUsernames.has(normalizedUsername)) {
        employee.username = "";
        return;
      }
      assignedEmployeeUsernames.add(normalizedUsername);
    });
    const trainings = Array.isArray(parsed.trainings)
      ? parsed.trainings.map(normalizeTraining).filter(Boolean)
      : [];
    if ((Number(parsed.version) || 0) < 14) {
      trainings.forEach((training) => {
        if (!training.recurrenceMonths) {
          training.recurrenceMonths = defaultTrainingRecurrenceMonths(training.title);
        }
      });
    }
    assignTrainingSeriesIds(trainings);
    const meetings = Array.isArray(parsed.meetings)
      ? parsed.meetings.map(normalizeMeeting).filter(Boolean)
      : [];
    const appointments = Array.isArray(parsed.appointments)
      ? parsed.appointments.map(normalizeAppointment).filter(Boolean)
      : [];
    const memos = Array.isArray(parsed.memos)
      ? parsed.memos.map(normalizeMemo).filter(Boolean)
      : [];
    const devices = Array.isArray(parsed.devices)
      ? parsed.devices.map(normalizeDevice).filter(Boolean)
      : [];
    if ((Number(parsed.version) || 0) < 19) {
      mergeDefaultDeviceCatalog(devices);
    }
    const validEmployeeIds = new Set(employees.map((employee) => employee.id));
    const validTrainingIds = new Set(trainings.map((training) => training.id));
    const validMeetingIds = new Set(meetings.map((meeting) => meeting.id));
    const validDeviceIds = new Set(devices.map((device) => device.id));

    meetings.forEach((meeting) => {
      meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter((employeeId) =>
        validEmployeeIds.has(employeeId),
      );
    });

    const completions = Array.isArray(parsed.completions)
      ? parsed.completions
          .map(normalizeCompletion)
          .filter(
            (completion) =>
              completion &&
              validEmployeeIds.has(completion.employeeId) &&
              validTrainingIds.has(completion.trainingId),
          )
      : [];
    const meetingAttendances = Array.isArray(parsed.meetingAttendances)
      ? parsed.meetingAttendances
          .map(normalizeMeetingAttendance)
          .filter(
            (attendance) =>
              attendance &&
              validEmployeeIds.has(attendance.employeeId) &&
              validMeetingIds.has(attendance.meetingId),
          )
      : [];
    const vacationEntitlements = Array.isArray(parsed.vacationEntitlements)
      ? parsed.vacationEntitlements
          .map(normalizeVacationEntitlement)
          .filter(
            (entitlement) =>
              entitlement && validEmployeeIds.has(entitlement.employeeId),
          )
      : [];
    const vacationDays = Array.isArray(parsed.vacationDays)
      ? parsed.vacationDays
          .map(normalizeVacationDay)
          .filter(
            (vacationDay) =>
              vacationDay && validEmployeeIds.has(vacationDay.employeeId),
          )
      : [];
    const deviceInstructions = Array.isArray(parsed.deviceInstructions)
      ? parsed.deviceInstructions
          .map(normalizeDeviceInstruction)
          .filter(
            (instruction) =>
              instruction &&
              validDeviceIds.has(instruction.deviceId) &&
              instruction.participants.some((participant) =>
                validEmployeeIds.has(participant.employeeId),
              ),
          )
          .map((instruction) => ({
            ...instruction,
            instructorEmployeeId: validEmployeeIds.has(
              instruction.instructorEmployeeId,
            )
              ? instruction.instructorEmployeeId
              : "",
            participants: instruction.participants.filter((participant) =>
              validEmployeeIds.has(participant.employeeId),
            ),
          }))
      : [];

    const catalogs = normalizeCatalogs(parsed.catalogs, employees);
    memos.forEach((memo) => {
      if (!catalogs.memoCategories.includes(memo.category)) memo.category = "";
    });
    const qualificationIds = new Set(
      catalogs.qualifications.map((qualification) => qualification.id),
    );
    employees.forEach((employee) => {
      catalogs.qualifications.forEach(({ id }) => {
        if (!Object.hasOwn(employee.qualifications, id)) {
          employee.qualifications[id] = false;
        }
      });
      Object.keys(employee.qualifications).forEach((id) => {
        if (!qualificationIds.has(id)) delete employee.qualifications[id];
      });
      Object.keys(employee.qualificationExpiries).forEach((id) => {
        if (!qualificationIds.has(id) || !employee.qualifications[id]) {
          delete employee.qualificationExpiries[id];
        }
      });
    });

    const users = normalizeUsers(parsed.users);
    if ((Number(parsed.version) || 0) < 22) {
      users
        .filter((user) => user.role === "admin")
        .forEach((user) => {
          user.mustChangePassword = true;
        });
    }

    const previousStateVersion = Number(parsed.version) || 0;
    const legacyWeekendNameFallbacks =
      previousStateVersion < 23
        ? { weekend_a: "Oli", weekend_b: "Claudio" }
        : SERVICE_WEEKENDS;
    const requestedWeekendAOwnerId =
      parsed.settings?.serviceWeekends?.weekend_a?.ownerId ||
      parsed.settings?.serviceWeekendOwnerIds?.oli ||
      "";
    const requestedWeekendBOwnerId =
      parsed.settings?.serviceWeekends?.weekend_b?.ownerId ||
      parsed.settings?.serviceWeekendOwnerIds?.claudio ||
      "";
    const serviceWeekends = {
      weekend_a: {
        name: normalizeServiceWeekendName(
          parsed.settings?.serviceWeekends?.weekend_a?.name ||
            parsed.settings?.serviceWeekendNames?.oli,
          legacyWeekendNameFallbacks.weekend_a,
        ),
        ownerId: validEmployeeIds.has(requestedWeekendAOwnerId)
          ? requestedWeekendAOwnerId
          : "",
      },
      weekend_b: {
        name: normalizeServiceWeekendName(
          parsed.settings?.serviceWeekends?.weekend_b?.name ||
            parsed.settings?.serviceWeekendNames?.claudio,
          legacyWeekendNameFallbacks.weekend_b,
        ),
        ownerId:
          validEmployeeIds.has(requestedWeekendBOwnerId) &&
          requestedWeekendBOwnerId !== requestedWeekendAOwnerId
            ? requestedWeekendBOwnerId
            : "",
      },
    };
    Object.entries(serviceWeekends).forEach(([weekend, configuration]) => {
      if (!configuration.ownerId) return;
      const owner = employees.find(
        (employee) => employee.id === configuration.ownerId,
      );
      if (owner) {
        if (
          previousStateVersion < 24 &&
          !LEADERSHIP_QUALIFICATION_IDS.some(
            (qualificationId) => owner.qualifications[qualificationId],
          )
        ) {
          owner.qualifications[
            weekend === "weekend_a"
              ? "stationsleitung"
              : "stellvertretendeStationsleitung"
          ] = true;
        }
        configuration.name = normalizeServiceWeekendName(
          owner.firstName,
          configuration.name,
        );
        owner.serviceWeekend = weekend;
      }
    });

    return {
      version: STATE_VERSION,
      employees,
      trainings,
      completions,
      meetings,
      meetingAttendances,
      appointments,
      memos,
      devices,
      deviceInstructions,
      vacationEntitlements: uniqueVacationEntitlements(vacationEntitlements),
      vacationDays: uniqueVacationDays(vacationDays),
      settings: {
        theme: normalizeTheme(parsed.settings?.theme),
        lastBackupAt: validOptionalTimestamp(parsed.settings?.lastBackupAt),
        backupReminderDays: clampNumber(
          parsed.settings?.backupReminderDays,
          1,
          365,
          DEFAULT_BACKUP_REMINDER_DAYS,
        ),
        maxBackupFileSizeMb: Math.round(
          clampNumber(
            parsed.settings?.maxBackupFileSizeMb,
            MIN_BACKUP_FILE_SIZE_MB,
            MAX_BACKUP_FILE_SIZE_MB,
            DEFAULT_MAX_BACKUP_FILE_SIZE_MB,
          ),
        ),
        // Standardmaessig aus: Ein Klick neben den Dialog schliesst ihn nicht,
        // damit versehentliches Schliessen ausgeschlossen ist.
        closeDialogOnOutsideClick: Boolean(
          parsed.settings?.closeDialogOnOutsideClick,
        ),
        // Fehlt der Schluessel ganz, stammt der Datenbestand aus einer
        // aelteren Fassung und wird mit der amtlichen NRW-Liste vorbelegt.
        // Eine leere Liste bleibt dagegen leer - sie kann bewusst gesetzt sein.
        schoolVacationPeriods: normalizeSchoolVacationPeriods(
          parsed.settings?.schoolVacationPeriods === undefined
            ? NRW_SCHOOL_VACATION_PERIODS
            : parsed.settings.schoolVacationPeriods,
        ),
        meetingAttendanceThreshold: clampNumber(
          parsed.settings?.meetingAttendanceThreshold,
          1,
          100,
          70,
        ),
        vacationBaseDays: clampNumber(
          parsed.settings?.vacationBaseDays,
          1,
          60,
          DEFAULT_VACATION_BASE_DAYS,
        ),
        vacationWeekendAReferenceSaturday: normalizeSaturdayDate(
          parsed.settings?.vacationWeekendAReferenceSaturday ||
            parsed.settings?.vacationOliReferenceSaturday,
        ),
        vacationWeekdayAbsenceLimit: Math.round(
          clampNumber(
            parsed.settings?.vacationWeekdayAbsenceLimit,
            1,
            100,
            DEFAULT_WEEKDAY_ABSENCE_LIMIT,
          ),
        ),
        vacationWeekendAbsenceLimit: Math.round(
          clampNumber(
            parsed.settings?.vacationWeekendAbsenceLimit,
            1,
            100,
            DEFAULT_WEEKEND_ABSENCE_LIMIT,
          ),
        ),
        serviceWeekends,
        deadlineKinds: normalizeDeadlineKinds(parsed.settings?.deadlineKinds),
        deadlineHideOverdue: Boolean(parsed.settings?.deadlineHideOverdue),
      },
      users,
      auditLog: normalizeAuditLog(parsed.auditLog),
      catalogs,
    };
  }

  function normalizeCatalogs(catalogs, employees) {
    const professions = [];
    const addProfession = (value) => {
      const profession = normalizeProfession(value);
      if (
        profession &&
        !professions.some(
          (item) =>
            item.toLocaleLowerCase("de-DE") === profession.toLocaleLowerCase("de-DE"),
        )
      ) {
        professions.push(profession);
      }
    };
    const storedProfessions = Array.isArray(catalogs?.professions)
      ? catalogs.professions
      : DEFAULT_PROFESSIONS;
    storedProfessions.forEach(addProfession);
    employees.forEach((employee) => addProfession(employee.profession));

    const qualificationMap = new Map();
    const storedQualifications = Array.isArray(catalogs?.qualifications)
      ? catalogs.qualifications
      : Object.entries(DEFAULT_QUALIFICATIONS).map(([id, label]) => ({ id, label }));
    storedQualifications.forEach((qualification) => {
      const id = normalizeId(qualification?.id);
      const label = String(qualification?.label || "").trim().slice(0, 100);
      if (id && label && !qualificationMap.has(id)) qualificationMap.set(id, label);
    });
    LEADERSHIP_QUALIFICATION_IDS.forEach((id) => {
      qualificationMap.set(id, DEFAULT_QUALIFICATIONS[id]);
    });
    employees.forEach((employee) => {
      Object.keys(employee.qualifications).forEach((id) => {
        if (!qualificationMap.has(id)) {
          qualificationMap.set(id, DEFAULT_QUALIFICATIONS[id] || id);
        }
      });
    });

    return {
      professions: professions.sort((a, b) => a.localeCompare(b, "de")),
      qualifications: [...qualificationMap].map(([id, label]) => ({ id, label })),
      memoCategories: normalizeMemoCategories(catalogs?.memoCategories),
    };
  }

  function normalizeMemoCategories(values) {
    const source = Array.isArray(values) ? values : DEFAULT_MEMO_CATEGORIES;
    const categories = [];
    source.forEach((value) => {
      const category = String(value || "").trim().slice(0, 60);
      if (
        category &&
        !categories.some(
          (item) =>
            item.toLocaleLowerCase("de-DE") ===
            category.toLocaleLowerCase("de-DE"),
        )
      ) {
        categories.push(category);
      }
    });
    return categories.sort((a, b) => a.localeCompare(b, "de"));
  }

  function initialUsers() {
    return [];
  }

  function normalizeSchoolVacationPeriods(periods) {
    if (!Array.isArray(periods)) return [];
    const seen = new Set();
    return periods
      .map((period) => {
        const start = String(period?.start || "");
        const end = String(period?.end || "");
        const label = String(period?.label || "").trim().slice(0, 60);
        if (!parseLocalDate(start) || !parseLocalDate(end)) return null;
        if (end < start) return null;
        if (!label) return null;
        return { start, end, label };
      })
      .filter((period) => {
        if (!period) return false;
        const key = `${period.start}|${period.end}|${period.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
      .slice(0, MAX_SCHOOL_VACATION_PERIODS);
  }

  function normalizeUsers(users) {
    if (!Array.isArray(users)) return initialUsers();
    const normalized = users.map(normalizeUser).filter(Boolean);
    const normalizedNames = new Set(
      normalized.map((user) => user.username.toLocaleLowerCase("de-DE")),
    );
    if (
      normalizedNames.size !== normalized.length ||
      (normalized.length > 0 &&
        !normalized.some((user) => user.role === "admin"))
    ) {
      return initialUsers();
    }
    return normalized;
  }

  function normalizeUser(user) {
    const id = normalizeId(user?.id);
    const username = String(user?.username || "").trim();
    const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : "";
    const passwordSalt = String(user?.passwordSalt || "");
    const passwordHash = String(user?.passwordHash || "");
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    const protectedRemoteCredentials =
      isMariaDbMode() && !passwordSalt && !passwordHash;
    if (
      !id ||
      !/^[A-Za-z0-9]{4,40}$/.test(username) ||
      !role ||
      (!protectedRemoteCredentials &&
        (!base64Pattern.test(passwordSalt) ||
          !base64Pattern.test(passwordHash)))
    ) {
      return null;
    }

    return {
      id,
      username,
      role,
      passwordSalt,
      passwordHash,
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }

  function normalizeTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "standard";
  }

  function normalizeServiceWeekendName(value, fallback) {
    return String(value || "").trim().slice(0, 50) || fallback;
  }

  function normalizeServiceWeekend(value) {
    const migratedValue =
      { oli: "weekend_a", claudio: "weekend_b" }[value] || value;
    return Object.hasOwn(SERVICE_WEEKENDS, migratedValue)
      ? migratedValue
      : "none";
  }

  function normalizeProfession(value) {
    const profession = String(value || "").trim().slice(0, 100);
    return CARE_PROFESSION_ALIASES.has(
      profession.toLocaleLowerCase("de-DE"),
    )
      ? "Pflegefachkraft"
      : profession;
  }

  function employeeNameSignature(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
  }

  function normalizeEmployee(employee) {
    const id = normalizeId(employee?.id);
    if (!employee || !id) return null;

    const qualifications = {};
    Object.entries(employee.qualifications || {}).forEach(([key, selected]) => {
      const id = normalizeId(key);
      if (id) qualifications[id] = Boolean(selected);
    });
    const qualificationExpiries = {};
    Object.entries(employee.qualificationExpiries || {}).forEach(([key, date]) => {
      const id = normalizeId(key);
      const normalizedDate = normalizeOptionalDate(date);
      if (id && normalizedDate) qualificationExpiries[id] = normalizedDate;
    });

    const employmentStatus = Object.hasOwn(
      EMPLOYMENT_STATUSES,
      employee.employmentStatus,
    )
      ? employee.employmentStatus
      : employee.active === false
        ? "inactive"
        : "active";

    return {
      id,
      firstName: String(employee.firstName || ""),
      lastName: String(employee.lastName || ""),
      username: /^[A-Za-z0-9]{4,40}$/.test(
        String(employee.username || "").trim(),
      )
        ? String(employee.username || "").trim()
        : "",
      birthDate: String(employee.birthDate || ""),
      phone: String(employee.phone || ""),
      email: String(employee.email || ""),
      employmentPercent: clampNumber(employee.employmentPercent, 1, 100, 100),
      profession: normalizeProfession(employee.profession),
      serviceWeekend: normalizeServiceWeekend(employee.serviceWeekend),
      active: employmentStatus !== "inactive",
      employmentStatus,
      qualifications,
      qualificationExpiries,
      createdAt: validTimestamp(employee.createdAt),
      updatedAt: validTimestamp(employee.updatedAt || employee.createdAt),
    };
  }

  function normalizeTraining(training) {
    const id = normalizeId(training?.id);
    if (!training || !id) return null;
    const recurrence = Number(training.recurrenceMonths);
    const targetMinutes = Number(training.targetMinutes);
    const createdAt = validTimestamp(training.createdAt);
    const storedYear = Number(training.year);
    const fallbackYear = new Date(createdAt).getFullYear();

    return {
      id,
      title: String(training.title || ""),
      description: String(training.description || ""),
      year:
        Number.isInteger(storedYear) && storedYear >= 2000 && storedYear <= 2100
          ? storedYear
          : fallbackYear,
      recurrenceMonths: Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null,
      targetMinutes:
        Number.isInteger(targetMinutes) && targetMinutes > 0 ? targetMinutes : null,
      seriesId: normalizeId(training.seriesId) || "",
      createdAt,
      updatedAt: validTimestamp(training.updatedAt || training.createdAt),
    };
  }

  function trainingSeriesSignature(title) {
    return String(title || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/\b(?:19|20)\d{2}\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function generatedTrainingSeriesId(title, fallbackId = "") {
    const signature = trainingSeriesSignature(title) || fallbackId || "fortbildung";
    let hash = 2166136261;
    for (let index = 0; index < signature.length; index += 1) {
      hash ^= signature.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `training-series-${(hash >>> 0).toString(36)}`;
  }

  function assignTrainingSeriesIds(trainings) {
    const seriesBySignature = new Map();
    trainings.forEach((training) => {
      if (!training.recurrenceMonths || !training.seriesId) return;
      const signature = trainingSeriesSignature(training.title);
      if (signature && !seriesBySignature.has(signature)) {
        seriesBySignature.set(signature, training.seriesId);
      }
    });
    trainings.forEach((training) => {
      if (!training.recurrenceMonths) {
        training.seriesId = "";
        return;
      }
      if (training.seriesId) return;
      const signature = trainingSeriesSignature(training.title);
      const seriesId =
        seriesBySignature.get(signature) ||
        generatedTrainingSeriesId(training.title, training.id);
      training.seriesId = seriesId;
      if (signature) seriesBySignature.set(signature, seriesId);
    });
  }

  function defaultTrainingRecurrenceMonths(title) {
    const normalizedTitle = String(title || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "");
    return normalizedTitle.includes("gewaltpravention") ||
      normalizedTitle.includes("gewaltpraevention")
      ? VIOLENCE_PREVENTION_RECURRENCE_MONTHS
      : DEFAULT_TRAINING_RECURRENCE_MONTHS;
  }

  function normalizeCompletion(completion) {
    const id = normalizeId(completion?.id);
    const employeeId = normalizeId(completion?.employeeId);
    const trainingId = normalizeId(completion?.trainingId);
    if (!completion || !id || !employeeId || !trainingId) {
      return null;
    }

    return {
      id,
      employeeId,
      trainingId,
      completedOn: String(completion.completedOn || ""),
      note: String(completion.note || ""),
      createdAt: validTimestamp(completion.createdAt),
    };
  }

  function normalizeMeeting(meeting) {
    const id = normalizeId(meeting?.id);
    if (!meeting || !id) return null;

    return {
      id,
      title: String(meeting.title || "Teamsitzung"),
      date: String(meeting.date || ""),
      time: normalizeTimeValue(meeting.time),
      notes: String(meeting.notes || ""),
      expectedEmployeeIds: Array.isArray(meeting.expectedEmployeeIds)
        ? [...new Set(meeting.expectedEmployeeIds.map(normalizeId).filter(Boolean))]
        : [],
      createdAt: validTimestamp(meeting.createdAt),
      updatedAt: validTimestamp(meeting.updatedAt || meeting.createdAt),
    };
  }

  function normalizeAppointment(appointment) {
    const id = normalizeId(appointment?.id);
    const title = String(appointment?.title || "").trim().slice(0, 120);
    const date = normalizeOptionalDate(appointment?.date);
    if (!appointment || !id || !title || !date) return null;

    const startTime = normalizeTimeValue(appointment.startTime);
    let endTime = normalizeTimeValue(appointment.endTime);
    if (!startTime || (endTime && endTime <= startTime)) endTime = "";

    const category = String(appointment.category || "");

    return {
      id,
      title,
      date,
      startTime,
      endTime,
      // Unbekannte Kategorien werden verworfen, statt den Termin zu verlieren.
      category: Object.hasOwn(APPOINTMENT_CATEGORIES, category) ? category : "",
      location: String(appointment.location || "").trim().slice(0, 160),
      description: String(appointment.description || "").trim().slice(0, 1000),
      pinned: Boolean(appointment.pinned),
      participantList: Boolean(appointment.participantList),
      createdAt: validTimestamp(appointment.createdAt),
      updatedAt: validTimestamp(appointment.updatedAt || appointment.createdAt),
    };
  }

  function normalizeMemo(memo) {
    const id = normalizeId(memo?.id);
    const title = String(memo?.title || "").trim().slice(0, 160);
    if (!memo || !id || !title) return null;

    return {
      id,
      title,
      description: String(memo.description || "").trim().slice(0, 2000),
      date: normalizeOptionalDate(memo.date),
      category: String(memo.category || "").trim().slice(0, 60),
      pinned: Boolean(memo.pinned),
      completed: Boolean(memo.completed),
      visibility: memo.visibility === "private" ? "private" : "all",
      createdByUserId: normalizeId(memo.createdByUserId),
      createdAt: validTimestamp(memo.createdAt),
      updatedAt: validTimestamp(memo.updatedAt || memo.createdAt),
    };
  }

  function normalizeDevice(device) {
    const id = normalizeId(device?.id);
    const productName = String(device?.productName || "").trim().slice(0, 120);
    const manufacturer = String(device?.manufacturer || "").trim().slice(0, 120);
    const category = String(device?.category || "").trim().slice(0, 100);
    if (!id || !productName || !manufacturer || !category) return null;

    return {
      id,
      productName,
      manufacturer,
      category,
      annex1: Boolean(device.annex1),
      currentInventory: device.currentInventory !== false,
      createdAt: validTimestamp(device.createdAt),
      updatedAt: validTimestamp(device.updatedAt || device.createdAt),
    };
  }

  function createDefaultDeviceCatalog() {
    return DEFAULT_DEVICE_CATALOG.map(
      ([manufacturer, productName, category, currentInventory, annex1], index) => ({
        id: `device-catalog-${String(index + 1).padStart(3, "0")}`,
        productName,
        manufacturer,
        category,
        annex1,
        currentInventory,
        createdAt: DEFAULT_DEVICE_CATALOG_TIMESTAMP,
        updatedAt: DEFAULT_DEVICE_CATALOG_TIMESTAMP,
      }),
    );
  }

  function mergeDefaultDeviceCatalog(devices) {
    const signatures = new Set(devices.map(deviceCatalogSignature));
    const usedIds = new Set(devices.map((device) => device.id));
    createDefaultDeviceCatalog().forEach((device) => {
      const signature = deviceCatalogSignature(device);
      if (signatures.has(signature)) return;
      let id = device.id;
      let suffix = 1;
      while (usedIds.has(id)) {
        id = `${device.id}-${suffix}`;
        suffix += 1;
      }
      devices.push({ ...device, id });
      signatures.add(signature);
      usedIds.add(id);
    });
  }

  function deviceCatalogSignature(device) {
    return `${device.manufacturer}::${device.productName}`
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeDeviceInstruction(instruction) {
    const id = normalizeId(instruction?.id);
    const deviceId = normalizeId(instruction?.deviceId);
    const date = normalizeOptionalDate(instruction?.date);
    const instructorType =
      instruction?.instructorType === "employee" ? "employee" : "manufacturer";
    const instructorEmployeeId =
      normalizeId(instruction?.instructorEmployeeId) || "";
    const instructorName = String(instruction?.instructorName || "")
      .trim()
      .slice(0, 120);
    const participants = Array.isArray(instruction?.participants)
      ? [
          ...new Map(
            instruction.participants
              .map((participant) => {
                const employeeId = normalizeId(participant?.employeeId);
                return employeeId
                  ? [
                      employeeId,
                      {
                        employeeId,
                        wasMedicalProductsOfficer: Boolean(
                          participant.wasMedicalProductsOfficer,
                        ),
                      },
                    ]
                  : null;
              })
              .filter(Boolean),
          ).values(),
        ]
      : [];
    if (!id || !deviceId || !date || !participants.length || !instructorName) {
      return null;
    }

    return {
      id,
      deviceId,
      date,
      instructorType,
      instructorEmployeeId,
      instructorName,
      instructorWasMedicalProductsOfficer:
        instructorType === "employee" &&
        Boolean(instruction.instructorWasMedicalProductsOfficer),
      participants,
      createdAt: validTimestamp(instruction.createdAt),
    };
  }

  function normalizeTimeValue(value) {
    const time = String(value || "").trim();
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
  }

  function normalizeMeetingAttendance(attendance) {
    const id = normalizeId(attendance?.id);
    const meetingId = normalizeId(attendance?.meetingId);
    const employeeId = normalizeId(attendance?.employeeId);
    const status = String(attendance?.status || "");
    if (
      !attendance ||
      !id ||
      !meetingId ||
      !employeeId ||
      !Object.hasOwn(ATTENDANCE_STATUSES, status)
    ) {
      return null;
    }

    return {
      id,
      meetingId,
      employeeId,
      status,
      createdAt: validTimestamp(attendance.createdAt),
      updatedAt: validTimestamp(attendance.updatedAt || attendance.createdAt),
    };
  }

  function normalizeVacationEntitlement(entitlement) {
    const employeeId = normalizeId(entitlement?.employeeId);
    const year = Number(entitlement?.year);
    if (
      !employeeId ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return null;
    }
    return {
      employeeId,
      year,
      additionalDays:
        Math.round(clampNumber(entitlement.additionalDays, 0, 30, 0) * 2) / 2,
    };
  }

  function normalizeVacationDay(vacationDay) {
    const id = normalizeId(vacationDay?.id);
    const employeeId = normalizeId(vacationDay?.employeeId);
    const date = normalizeOptionalDate(vacationDay?.date);
    if (!id || !employeeId || !date) return null;
    return {
      id,
      employeeId,
      date,
      type: Object.hasOwn(PLANNER_ENTRY_TYPES, vacationDay.type)
        ? vacationDay.type
        : "vacation",
      createdAt: validTimestamp(vacationDay.createdAt),
      updatedAt: validTimestamp(
        vacationDay.updatedAt || vacationDay.createdAt,
      ),
    };
  }

  function uniqueVacationEntitlements(entitlements) {
    return [
      ...new Map(
        entitlements.map((entitlement) => [
          `${entitlement.employeeId}:${entitlement.year}`,
          entitlement,
        ]),
      ).values(),
    ];
  }

  function uniqueVacationDays(vacationDays) {
    return [
      ...new Map(
        vacationDays.map((vacationDay) => [
          `${vacationDay.employeeId}:${vacationDay.date}`,
          vacationDay,
        ]),
      ).values(),
    ];
  }

  function normalizeId(value) {
    const id = typeof value === "string" ? value : "";
    return /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
  }

  function validTimestamp(value) {
    const timestamp = typeof value === "string" ? value : "";
    return Number.isNaN(Date.parse(timestamp)) ? new Date().toISOString() : timestamp;
  }

  function validOptionalTimestamp(value) {
    if (!value) return "";
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  }

  function normalizeOptionalDate(value) {
    const date = String(value || "");
    return parseLocalDate(date) ? date : "";
  }

  function normalizeSaturdayDate(value) {
    const date = normalizeOptionalDate(value);
    const parsed = parseLocalDate(date);
    return parsed?.getDay() === 6
      ? date
      : DEFAULT_WEEKEND_A_REFERENCE_SATURDAY;
  }

  function normalizeDeadlineKinds(value) {
    if (!Array.isArray(value)) return [...DEADLINE_KINDS];
    return DEADLINE_KINDS.filter((kind) => value.includes(kind));
  }

  function normalizeAuditLog(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry) => {
        const id = normalizeId(entry?.id);
        const timestamp = validOptionalTimestamp(entry?.timestamp);
        const username = String(entry?.username || "").trim().slice(0, 40);
        const action = String(entry?.action || "").trim().slice(0, 240);
        if (!id || !timestamp || !username || !action) return null;
        return { id, timestamp, username, action };
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, MAX_AUDIT_LOG_ENTRIES);
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

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
      } catch (error) {
        console.error("Daten konnten nicht gespeichert werden.", error);
        showToast(
          "Speichern fehlgeschlagen. Der Browserspeicher ist möglicherweise voll.",
          "error",
        );
        return false;
      }
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

  async function commitStateMutation(mutate) {
    const previousState = JSON.parse(JSON.stringify(state));
    mutate();
    appendAuditEntry(describeMutation(previousState, state));

    if (await persistState()) {
      databaseSaveReminderArmed = true;
      renderAll();
      scheduleAutomaticBackup();
      return true;
    }

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

  function appendAuditEntry(action) {
    if (!action) return;
    state.auditLog.unshift({
      id: createId(),
      timestamp: new Date().toISOString(),
      username: currentUser?.username || "System",
      action,
    });
    state.auditLog = state.auditLog.slice(0, MAX_AUDIT_LOG_ENTRIES);
  }

  function describeMutation(before, after) {
    for (const [key, label] of TRACKED_COLLECTIONS) {
      const difference = after[key].length - before[key].length;
      if (difference > 0) return `${label}: ${difference} Eintrag/Einträge hinzugefügt`;
      if (difference < 0) return `${label}: ${Math.abs(difference)} Eintrag/Einträge gelöscht`;
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        return `${label} geändert`;
      }
    }
    if (JSON.stringify(before.catalogs) !== JSON.stringify(after.catalogs)) {
      return "Berufs- oder Qualifikationskatalog geändert";
    }
    if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) {
      return "Anwendungseinstellungen geändert";
    }
    return "Datenbestand aktualisiert";
  }

  function handleInitializationError(error) {
    console.error("Anwendung konnte nicht initialisiert werden.", error);
    const message = document.createElement("div");
    message.className = "noscript-message";
    message.textContent =
      "Die lokale Datenspeicherung konnte nicht gestartet werden. Bitte laden Sie die Seite neu oder verwenden Sie einen aktuellen Browser.";
    document.body.append(message);
  }
