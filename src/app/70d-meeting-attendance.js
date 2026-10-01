  function openMeetingDialog(meetingId = null) {
    elements.meetingForm.reset();
    document.querySelector("#meetingTitle").setCustomValidity("");
    document.querySelector("#meetingId").value = "";
    document.querySelector("#meetingTitle").value = "Teamsitzung";
    document.querySelector("#meetingDate").value = todayIso();

    const meeting = meetingId ? getMeeting(meetingId) : null;
    elements.meetingDialogTitle.textContent = meeting
      ? "Teamsitzung bearbeiten"
      : "Teamsitzung anlegen";
    elements.meetingSubmitLabel.textContent = meeting
      ? "Änderungen speichern"
      : "Teamsitzung speichern";

    if (meeting) {
      document.querySelector("#meetingId").value = meeting.id;
      document.querySelector("#meetingTitle").value = meeting.title;
      document.querySelector("#meetingDate").value = meeting.date;
      document.querySelector("#meetingTime").value = meeting.time;
      document.querySelector("#meetingNotes").value = meeting.notes;
    }

    elements.meetingDialog.showModal();
    captureCleanForm(elements.meetingForm);
    window.setTimeout(() => document.querySelector("#meetingTitle").focus(), 0);
  }

  async function handleMeetingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#meetingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.meetingForm.reportValidity()) return;

    const meetingId = document.querySelector("#meetingId").value;
    const existingMeeting = meetingId ? getMeeting(meetingId) : null;
    const now = new Date().toISOString();
    const meeting = {
      id: existingMeeting?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#meetingDate").value,
      time: document.querySelector("#meetingTime").value,
      notes: document.querySelector("#meetingNotes").value.trim(),
      expectedEmployeeIds:
        existingMeeting?.expectedEmployeeIds || activeEmployeeList().map((employee) => employee.id),
      createdAt: existingMeeting?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingMeeting) {
        state.meetings = state.meetings.map((item) => (item.id === meeting.id ? meeting : item));
      } else {
        state.meetings.push(meeting);
      }
    });
    if (!committed) return;

    meetingDisplayYear = Number(meeting.date.slice(0, 4));
    renderMeetings();
    elements.meetingDialog.close();
    showToast(existingMeeting ? "Teamsitzung wurde aktualisiert." : "Teamsitzung wurde angelegt.");

    if (!existingMeeting && meeting.expectedEmployeeIds.length > 0) {
      openAttendanceDialog(meeting.id);
    }
  }

  function requestDeleteMeeting(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;
    const attendanceCount = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    ).length;

    requestConfirmation({
      title: "Teamsitzung löschen?",
      message: `„${meeting.title}“ vom ${formatDate(meeting.date)} wird dauerhaft entfernt.${
        attendanceCount
          ? ` ${attendanceCount} dokumentierte Teilnahmestatus werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Teamsitzung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.meetings = state.meetings.filter((item) => item.id !== meetingId);
          state.meetingAttendances = state.meetingAttendances.filter(
            (attendance) => attendance.meetingId !== meetingId,
          );
        }, { undo: "Teamsitzung gelöscht" });
        if (!committed) return;

        showUndoToast("Teamsitzung wurde gelöscht.");
      },
    });
  }

  function openAttendanceDialog(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    const existingRecords = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    );
    const employeeIds = new Set(meeting.expectedEmployeeIds);
    existingRecords.forEach((record) => employeeIds.add(record.employeeId));
    if (existingRecords.length === 0) {
      activeEmployeeList().forEach((employee) => employeeIds.add(employee.id));
    }

    attendanceEmployeeIds = [...employeeIds].filter((employeeId) => getEmployee(employeeId));
    if (attendanceEmployeeIds.length === 0) {
      showToast("Für diese Sitzung sind keine Mitarbeiter verfügbar.", "error");
      return;
    }

    attendanceDraft = new Map(
      existingRecords.map((record) => [record.employeeId, record.status]),
    );
    attendanceSearchTerm = "";
    attendanceStatusFilter = "all";
    elements.attendanceSearch.value = "";
    elements.attendanceFilter.value = "all";
    elements.attendanceBulkStatus.value = "teilgenommen";
    document.querySelector("#attendanceMeetingId").value = meeting.id;
    elements.attendanceMeetingMeta.textContent = `${formatDate(meeting.date)}${
      meeting.time ? ` · ${formatTime(meeting.time)} Uhr` : ""
    } · ${meeting.title}`;

    renderAttendanceList();
    elements.attendanceDialog.showModal();
    captureCleanForm(elements.attendanceForm);
    window.setTimeout(() => elements.attendanceSearch.focus(), 0);
  }

  function filteredAttendanceEmployees() {
    return attendanceEmployeeIds
      .map(getEmployee)
      .filter(Boolean)
      .filter((employee) => {
        const status = attendanceDraft.get(employee.id) || "";
        if (attendanceStatusFilter === "open" && status) return false;
        if (attendanceStatusFilter === "documented" && !status) return false;
        if (
          attendanceStatusFilter === "absent" &&
          (!status || ["teilgenommen", "nicht_zutreffend"].includes(status))
        ) {
          return false;
        }
        if (!attendanceSearchTerm) return true;
        return searchKey(
          [employeeSearchText(employee), employee.profession].join(" "),
        ).includes(attendanceSearchTerm);
      })
      .sort(sortEmployees);
  }

  function renderAttendanceList() {
    const employees = filteredAttendanceEmployees();
    if (employees.length === 0) {
      elements.attendanceList.innerHTML = renderEmptyState({
        title: "Keine passenden Mitarbeiter",
        text: "Ändern Sie die Suche oder den Anzeigefilter.",
        compact: true,
      });
      updateAttendanceProgress();
      return;
    }

    elements.attendanceList.innerHTML = employees
      .map((employee) => {
        const selectedStatus = attendanceDraft.get(employee.id) || "";
        const statusConfig = ATTENDANCE_STATUSES[selectedStatus];
        return `
          <div class="attendance-row ${
            statusConfig ? `has-status attendance-row-${statusConfig.tone}` : ""
          }">
            <div class="attendance-person">
              ${renderAvatar(employee)}
              <span>
                <strong>${escapeHtml(fullName(employee))}</strong>
                <small>${escapeHtml(employee.profession)} · ${escapeHtml(
                  employeeStatusLabel(employee),
                )}${employee.active ? "" : " seit Erfassung"}</small>
              </span>
            </div>
            <label class="attendance-status-field">
              <span class="sr-only">Teilnahmestatus für ${escapeHtml(fullName(employee))}</span>
              <select
                data-attendance-employee-id="${employee.id}"
                aria-label="Teilnahmestatus für ${escapeHtml(fullName(employee))}"
              >
                <option value="">Noch offen</option>
                ${renderAttendanceStatusOptions(selectedStatus)}
              </select>
            </label>
          </div>
        `;
      })
      .join("");

    updateAttendanceProgress();
  }

  function renderAttendanceStatusOptions(selectedStatus = "") {
    return Object.entries(ATTENDANCE_STATUSES)
      .map(
        ([value, config]) =>
          `<option value="${value}" ${value === selectedStatus ? "selected" : ""}>${escapeHtml(
            config.label,
          )}</option>`,
      )
      .join("");
  }

  function updateAttendanceProgress() {
    const documented = attendanceEmployeeIds.filter((employeeId) =>
      attendanceDraft.has(employeeId),
    ).length;
    const total = attendanceEmployeeIds.length;
    elements.attendanceProgress.textContent = `${documented} von ${total} dokumentiert${
      total - documented > 0 ? ` · ${total - documented} offen` : " · vollständig"
    }`;
  }

  function updateAttendanceRowState(row, status) {
    if (!row) return;
    row.className = "attendance-row";
    const statusConfig = ATTENDANCE_STATUSES[status];
    if (statusConfig) {
      row.classList.add("has-status", `attendance-row-${statusConfig.tone}`);
    }
  }

  async function handleAttendanceSubmit(event) {
    event.preventDefault();
    const meetingId = document.querySelector("#attendanceMeetingId").value;
    const meeting = getMeeting(meetingId);
    if (!meeting) {
      elements.attendanceDialog.close();
      showToast("Die Teamsitzung ist nicht mehr vorhanden.", "error");
      return;
    }

    const existingByEmployee = new Map(
      state.meetingAttendances
        .filter((attendance) => attendance.meetingId === meetingId)
        .map((attendance) => [attendance.employeeId, attendance]),
    );
    const now = new Date().toISOString();
    const nextRecords = attendanceEmployeeIds
      .filter((employeeId) => attendanceDraft.has(employeeId))
      .map((employeeId) => {
        const existing = existingByEmployee.get(employeeId);
        return {
          id: existing?.id || createId(),
          meetingId,
          employeeId,
          status: attendanceDraft.get(employeeId),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
      });

    const committed = await commitStateMutation(() => {
      state.meetingAttendances = state.meetingAttendances
        .filter((attendance) => attendance.meetingId !== meetingId)
        .concat(nextRecords);
      meeting.expectedEmployeeIds = [...attendanceEmployeeIds];
      meeting.updatedAt = now;
    });
    if (!committed) return;

    elements.attendanceDialog.close();
    const openCount = attendanceEmployeeIds.length - nextRecords.length;
    showToast(
      `${nextRecords.length} Teilnahmestatus gespeichert.${
        openCount ? ` ${openCount} sind noch offen.` : " Die Erfassung ist vollständig."
      }`,
    );
  }
