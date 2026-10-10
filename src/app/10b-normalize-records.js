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

  // Ein einzelnes beschaedigtes Konto darf nicht alle uebrigen mitreissen:
  // Fruher gab diese Funktion in dem Fall eine leere Liste zurueck, wodurch die
  // Anwendung ohne Hinweis in die Ersteinrichtung zurueckfiel. Ungueltige und
  // doppelt vergebene Konten werden deshalb einzeln verworfen. Nur wenn danach
  // kein Administratorkonto mehr uebrig ist, bleibt der Bestand unbrauchbar -
  // dann ist die Ersteinrichtung tatsaechlich der richtige Weg.
  function normalizeUsers(users) {
    if (!Array.isArray(users)) return initialUsers();
    const seenNames = new Set();
    const normalized = [];
    let discarded = users.length;
    users.map(normalizeUser).forEach((user) => {
      if (!user) return;
      const normalizedName = user.username.toLocaleLowerCase("de-DE");
      if (seenNames.has(normalizedName)) return;
      seenNames.add(normalizedName);
      normalized.push(user);
    });
    discarded -= normalized.length;
    if (!normalized.some((user) => user.role === "admin")) {
      return initialUsers();
    }
    if (discarded > 0) {
      console.warn(
        `${discarded} Benutzerkonto/-konten waren ungültig oder doppelt vergeben und wurden verworfen.`,
      );
      discardedUserAccounts = discarded;
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
      theme: normalizeUserTheme(user.theme),
      iconSet: normalizeUserIconSet(user.iconSet),
    };
  }

  function normalizeTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "standard";
  }

  // Das Farbthema eines Kontos darf leer bleiben. Leer heisst nicht
  // "Standard", sondern "noch keine eigene Wahl getroffen" - dann gilt die
  // gemeinsame Vorgabe aus den Einstellungen.
  function normalizeUserTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "";
  }

  function normalizeIconSet(iconSet) {
    return Object.hasOwn(ICON_SETS, iconSet) ? iconSet : "standard";
  }

  // Wie beim Farbthema: leer heisst "noch keine eigene Wahl getroffen".
  function normalizeUserIconSet(iconSet) {
    return Object.hasOwn(ICON_SETS, iconSet) ? iconSet : "";
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

  // Bekannte Gruppen behalten ihre gespeicherte Position, unbekannte und
  // doppelte entfallen, fehlende haengen sich in der Vorgabereihenfolge an -
  // so bringt eine spaetere Fassung neue Gruppen mit, ohne die eigene
  // Reihenfolge zu verwerfen.
  function normalizeVacationSortGroupOrder(value) {
    const kept = [];
    (Array.isArray(value) ? value : []).forEach((key) => {
      if (Object.hasOwn(VACATION_SORT_GROUPS, key) && !kept.includes(key)) {
        kept.push(key);
      }
    });
    return [
      ...kept,
      ...DEFAULT_VACATION_SORT_GROUP_ORDER.filter((key) => !kept.includes(key)),
    ];
  }

  // Stichtag im Format MM-TT, gueltig in jedem Jahr - der 29. Februar
  // faellt deshalb heraus.
  function normalizeCarryOverExpiry(value) {
    const text = String(value || "");
    const match = /^(\d{2})-(\d{2})$/.exec(text);
    if (!match) return DEFAULT_VACATION_CARRY_OVER_EXPIRY;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const probe = new Date(2001, month - 1, day, 12);
    return probe.getMonth() === month - 1 && probe.getDate() === day
      ? text
      : DEFAULT_VACATION_CARRY_OVER_EXPIRY;
  }

  function normalizeProfession(value) {
    const profession = String(value || "").trim().slice(0, 100);
    return CARE_PROFESSION_ALIASES.has(
      profession.toLocaleLowerCase("de-DE"),
    )
      ? "Pflegefachkraft"
      : profession;
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
      ...normalizeEmploymentPeriod(employee),
      employmentChanges: normalizeEmploymentChanges(employee.employmentChanges),
      nameChanges: normalizeNameChanges(employee.nameChanges),
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

  // Ein Austritt vor dem Eintritt ist ein Tippfehler; dann gilt nur der
  // Eintritt, statt den Mitarbeiter aus jedem Zeitraum zu verbannen.
  function normalizeEmploymentPeriod(employee) {
    const entryDate = normalizeOptionalDate(employee.entryDate);
    const exitDate = normalizeOptionalDate(employee.exitDate);
    return {
      entryDate,
      exitDate: entryDate && exitDate && exitDate < entryDate ? "" : exitDate,
    };
  }

  // Je Stichtag höchstens eine Änderung, aufsteigend sortiert.
  function normalizeEmploymentChanges(changes) {
    const byDate = new Map();
    (Array.isArray(changes) ? changes : []).forEach((change) => {
      const from = normalizeOptionalDate(change?.from);
      const percent = Number(change?.percent);
      if (from && Number.isFinite(percent)) {
        byDate.set(from, { from, percent: clampNumber(Math.round(percent), 1, 100, 100) });
      }
    });
    return [...byDate.values()]
      .sort((a, b) => a.from.localeCompare(b.from))
      .slice(0, 50);
  }

  // Eine Namensänderung hält den Namen fest, der bis zum Stichtag galt; der
  // aktuelle Name steht weiter in firstName/lastName. Je Stichtag höchstens
  // ein Eintrag, aufsteigend sortiert.
  function normalizeNameChanges(changes) {
    const byDate = new Map();
    (Array.isArray(changes) ? changes : []).forEach((change) => {
      const date = normalizeOptionalDate(change?.date);
      const firstName = String(change?.firstName || "").trim().slice(0, 80);
      const lastName = String(change?.lastName || "").trim().slice(0, 80);
      if (date && (firstName || lastName)) {
        byDate.set(date, {
          date,
          firstName,
          lastName,
          reason: String(change?.reason || "").trim().slice(0, 120),
        });
      }
    });
    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20);
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
      instructionResets: normalizeDeviceInstructionResets(
        device.instructionResets,
      ),
      createdAt: validTimestamp(device.createdAt),
      updatedAt: validTimestamp(device.updatedAt || device.createdAt),
    };
  }

  // Eine angeordnete Neueinweisung erklaert alle Einweisungen in das Geraet
  // vor ihrem Stichtag fuer nichtig. Die Liste bleibt als Verlauf erhalten;
  // maßgeblich ist der spaeteste Stichtag.
  function normalizeDeviceInstructionResets(resets) {
    if (!Array.isArray(resets)) return [];
    const seen = new Set();
    return resets
      .map((reset) => {
        const id = normalizeId(reset?.id);
        const effectiveDate = normalizeOptionalDate(reset?.effectiveDate);
        const reason = String(reset?.reason || "").trim().slice(0, 200);
        if (!id || !effectiveDate || !reason || seen.has(id)) return null;
        seen.add(id);
        return {
          id,
          effectiveDate,
          reason,
          createdAt: validTimestamp(reset.createdAt),
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.effectiveDate.localeCompare(b.effectiveDate) ||
          a.createdAt.localeCompare(b.createdAt),
      );
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
        instructionResets: [],
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
      carryOverDays:
        Math.round(clampNumber(entitlement.carryOverDays, 0, 60, 0) * 2) / 2,
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

  function normalizeDeadlineKinds(value, seenKinds) {
    if (!Array.isArray(value)) return [...DEADLINE_KINDS];
    const known = Array.isArray(seenKinds) ? seenKinds : LEGACY_DEADLINE_KINDS;
    return DEADLINE_KINDS.filter((kind) => value.includes(kind) || !known.includes(kind));
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
        const subjects = (Array.isArray(entry.subjects) ? entry.subjects : [])
          .map((subject) => ({
            employeeId: normalizeId(subject?.employeeId),
            change: String(subject?.change || "").trim().slice(0, 240),
          }))
          .filter((subject) => subject.employeeId && subject.change)
          .slice(0, MAX_AUDIT_SUBJECTS);
        return {
          id,
          timestamp,
          username,
          action,
          ...(subjects.length ? { subjects } : {}),
        };
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
