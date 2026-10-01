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
        vacationSortGroupOrder: normalizeVacationSortGroupOrder(
          parsed.settings?.vacationSortGroupOrder,
        ),
        vacationCarryOverExpiry: normalizeCarryOverExpiry(
          parsed.settings?.vacationCarryOverExpiry,
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
