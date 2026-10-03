  function getTrainingStats(training) {
    const activeEmployees = employedActiveEmployees();
    const current = activeEmployees.filter((employee) =>
      isEmployeeCurrentForTraining(employee.id, training),
    ).length;
    const total = activeEmployees.length;
    return {
      current,
      open: Math.max(0, total - current),
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function getEmployeeTrainingStats(employeeId) {
    const obligations = trainingObligations();
    const total = obligations.length;
    const current = obligations.filter((training) =>
      isEmployeeCurrentForTraining(employeeId, training),
    ).length;
    return {
      current,
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function isEmployeeCurrentForTraining(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return false;
    if (!training.recurrenceMonths) return true;
    return addMonths(latest.completedOn, training.recurrenceMonths) >= todayIso();
  }

  function getEmployeeCompletionStatus(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return { kind: "open", label: "Offen" };

    if (!training.recurrenceMonths) {
      return {
        kind: "current",
        label: `absolviert am ${formatDate(latest.completedOn)}`,
      };
    }

    const validUntil = addMonths(latest.completedOn, training.recurrenceMonths);
    if (validUntil >= todayIso()) {
      return {
        kind: "current",
        label: `gültig bis ${formatDate(validUntil)}`,
      };
    }

    return {
      kind: "expired",
      label: `abgelaufen am ${formatDate(validUntil)}`,
    };
  }

  function latestCompletion(employeeId, trainingId) {
    const training = getTraining(trainingId);
    return training
      ? latestCompletionForTraining(employeeId, training)
      : completionsFor(employeeId, `training:${trainingId}`)[0];
  }

  function latestCompletionForTraining(employeeId, training, completedOnOrBefore = "") {
    const completions = completionsFor(employeeId, completionMatchKey(training));
    return completedOnOrBefore
      ? completions.find(
          (completion) => completion.completedOn <= completedOnOrBefore,
        )
      : completions[0];
  }

  // Eine wiederkehrende Fortbildung zaehlt jeden Nachweis ihrer Reihe, eine
  // einmalige nur die eigenen. Beides laesst sich als Schluessel schreiben -
  // damit findet der Index in einem Griff, was completionMatchesTraining
  // sonst fuer jeden Nachweis einzeln entscheidet.
  function completionMatchKey(training) {
    return training.recurrenceMonths && training.seriesId
      ? `series:${training.seriesId}`
      : `training:${training.id}`;
  }

  function completionsFor(employeeId, matchKey) {
    return completionIndex().get(`${employeeId}|${matchKey}`) || [];
  }

  // Die Matrix fragt fuer jede Zelle nach dem letzten Nachweis. Ohne Index
  // durchsucht jede dieser Fragen den gesamten Bestand; bei 70 Mitarbeitern,
  // 14 Fortbildungen und einem mehrjaehrigen Archiv sind das Millionen von
  // Vergleichen je Aufbau. Der Index entsteht in einem Durchgang und haelt,
  // solange Nachweise und Fortbildungen dieselben Sammlungen bleiben - genau
  // wie bei indexById, denn beide werden bei jeder Aenderung neu aufgebaut.
  const completionIndexCache = {
    completions: null,
    completionCount: -1,
    trainings: null,
    trainingCount: -1,
    index: new Map(),
  };

  function completionIndex() {
    const cache = completionIndexCache;
    if (
      cache.completions === state.completions &&
      cache.completionCount === state.completions.length &&
      cache.trainings === state.trainings &&
      cache.trainingCount === state.trainings.length
    ) {
      return cache.index;
    }

    const index = new Map();
    const add = (key, completion) => {
      const bucket = index.get(key);
      if (bucket) bucket.push(completion);
      else index.set(key, [completion]);
    };
    for (const completion of state.completions) {
      add(`${completion.employeeId}|training:${completion.trainingId}`, completion);
      const completedTraining = getTraining(completion.trainingId);
      if (completedTraining?.recurrenceMonths && completedTraining.seriesId) {
        add(
          `${completion.employeeId}|series:${completedTraining.seriesId}`,
          completion,
        );
      }
    }
    for (const bucket of index.values()) bucket.sort(sortCompletionsDescending);

    cache.completions = state.completions;
    cache.completionCount = state.completions.length;
    cache.trainings = state.trainings;
    cache.trainingCount = state.trainings.length;
    cache.index = index;
    return index;
  }

  function sortCompletionsDescending(a, b) {
    return (
      b.completedOn.localeCompare(a.completedOn) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }

  function completionMatchesTraining(completion, training) {
    if (!completion || !training) return false;
    if (!training.recurrenceMonths || !training.seriesId) {
      return completion.trainingId === training.id;
    }
    const completedTraining = getTraining(completion.trainingId);
    return (
      completedTraining?.recurrenceMonths &&
      completedTraining.seriesId === training.seriesId
    );
  }

  function trainingObligations() {
    const obligations = new Map();
    state.trainings.forEach((training) => {
      const key =
        training.recurrenceMonths && training.seriesId
          ? `series:${training.seriesId}`
          : `training:${training.id}`;
      const existing = obligations.get(key);
      if (
        !existing ||
        training.year < existing.year ||
        (training.year === existing.year &&
          training.updatedAt.localeCompare(existing.updatedAt) > 0)
      ) {
        obligations.set(key, training);
      }
    });
    return [...obligations.values()];
  }

  function getMeetingStats(meeting) {
    const records = [
      ...new Map(
        state.meetingAttendances
          .filter((attendance) => attendance.meetingId === meeting.id)
          .map((attendance) => [attendance.employeeId, attendance]),
      ).values(),
    ];
    const expectedEmployeeIds = new Set(meeting.expectedEmployeeIds);
    records.forEach((record) => expectedEmployeeIds.add(record.employeeId));
    const documentedEmployeeIds = new Set(records.map((record) => record.employeeId));
    const validExpectedIds = [...expectedEmployeeIds].filter((employeeId) => {
      const employee = getEmployee(employeeId);
      return (
        employee &&
        (documentedEmployeeIds.has(employeeId) || isEmployedOn(employee, meeting.date))
      );
    });
    const documented = validExpectedIds.filter((employeeId) =>
      documentedEmployeeIds.has(employeeId),
    ).length;
    const total = validExpectedIds.length;
    const notApplicable = records.filter(
      (record) => record.status === "nicht_zutreffend",
    ).length;

    return {
      total,
      documented,
      open: Math.max(0, total - documented),
      notApplicable,
      applicableTotal: Math.max(0, total - notApplicable),
      applicableDocumented: Math.max(0, documented - notApplicable),
      participated: records.filter((record) => record.status === "teilgenommen").length,
      percent: total ? Math.round((documented / total) * 100) : 0,
    };
  }

  function getAnnualMeetingStatistics(year) {
    const meetings = state.meetings
      .filter((meeting) => Number(meeting.date.slice(0, 4)) === year)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const statusCounts = Object.fromEntries(
      Object.keys(ATTENDANCE_STATUSES).map((status) => [status, 0]),
    );
    let totalSlots = 0;
    let documented = 0;
    let open = 0;

    const meetingRows = meetings.map((meeting) => {
      const records = [
        ...new Map(
          state.meetingAttendances
            .filter((attendance) => attendance.meetingId === meeting.id)
            .map((attendance) => [attendance.employeeId, attendance]),
        ).values(),
      ];
      records.forEach((record) => {
        statusCounts[record.status] += 1;
      });
      const stats = getMeetingStats(meeting);
      const applicableRecords = records.filter(
        (record) => record.status !== "nicht_zutreffend",
      );
      const participated = applicableRecords.filter(
        (record) => record.status === "teilgenommen",
      ).length;
      const absent = Math.max(0, stats.applicableDocumented - participated);

      totalSlots += stats.applicableTotal;
      documented += stats.applicableDocumented;
      open += stats.open;

      return {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        participated,
        absent,
        open: stats.open,
      };
    });

    const participated = statusCounts.teilgenommen;
    const absent = Math.max(0, documented - participated);
    const meetingCount = meetings.length;
    const employeeRows = state.employees
      .map((employee) => {
        const expectedMeetingIds = meetings
          .filter((meeting) =>
            isExpectedForMeeting(
              employee,
              meeting,
              state.meetingAttendances.some(
                (attendance) =>
                  attendance.meetingId === meeting.id && attendance.employeeId === employee.id,
              ),
            ),
          )
          .map((meeting) => meeting.id);
        const records = state.meetingAttendances.filter(
          (attendance) =>
            attendance.employeeId === employee.id &&
            expectedMeetingIds.includes(attendance.meetingId),
        );
        const employeeStatusCounts = Object.fromEntries(
          Object.keys(ATTENDANCE_STATUSES).map((status) => [
            status,
            records.filter((record) => record.status === status).length,
          ]),
        );
        const applicableRecords = records.filter(
          (record) => record.status !== "nicht_zutreffend",
        );
        const applicableExpected = Math.max(
          0,
          expectedMeetingIds.length - employeeStatusCounts.nicht_zutreffend,
        );
        return {
          employeeId: employee.id,
          name: fullName(employee),
          expected: applicableExpected,
          documented: applicableRecords.length,
          open: Math.max(0, applicableExpected - applicableRecords.length),
          statusCounts: employeeStatusCounts,
          attendanceRate: percentage(
            employeeStatusCounts.teilgenommen,
            applicableExpected,
          ),
        };
      })
      .filter((employee) => employee.expected > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

    return {
      year,
      meetingCount,
      meetings: meetingRows,
      statusCounts,
      totalSlots,
      documented,
      open,
      participated,
      absent,
      averageParticipated: meetingCount ? participated / meetingCount : 0,
      averageAbsent: meetingCount ? absent / meetingCount : 0,
      attendanceRate: percentage(participated, documented),
      documentationRate: percentage(documented, totalSlots),
      employeeRows,
    };
  }

  function percentage(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  // Das Anlegen eines Intl-Formatierers ist deutlich teurer als seine
  // Anwendung. In den Matrizen entstehen sonst tausende gleichartige
  // Formatierer je Aufbau, deshalb werden sie nach ihren Einstellungen abgelegt
  // und wiederverwendet.
  const numberFormats = new Map();
  const dateFormats = new Map();

  function numberFormat(options) {
    const key = JSON.stringify(options);
    let format = numberFormats.get(key);
    if (!format) {
      format = new Intl.NumberFormat("de-DE", options);
      numberFormats.set(key, format);
    }
    return format;
  }

  function dateFormat(options) {
    const key = JSON.stringify(options);
    let format = dateFormats.get(key);
    if (!format) {
      format = new Intl.DateTimeFormat("de-DE", options);
      dateFormats.set(key, format);
    }
    return format;
  }

  function formatDecimal(value) {
    return numberFormat({
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
