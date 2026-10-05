  function handleEmployeeTableAction(event) {
    const sortButton = event.target.closest("[data-employee-sort]");
    if (sortButton) {
      const nextKey = sortButton.dataset.employeeSort;
      if (employeeSortKey === nextKey) {
        employeeSortDirection = employeeSortDirection === "asc" ? "desc" : "asc";
      } else {
        employeeSortKey = nextKey;
        employeeSortDirection = "asc";
      }
      renderEmployees();
      return;
    }
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "view-employee") openEmployeeDossier(id);
    if (action === "edit-employee") openEmployeeDialog(id);
    if (action === "toggle-employee") toggleEmployee(id);
    if (action === "delete-employee") requestDeleteEmployee(id);
  }

  function handleEmployeeTableSelection(event) {
    const selectAll = event.target.closest("[data-select-all-employees]");
    if (selectAll) {
      visibleEmployeesForSelection().forEach((employee) => {
        if (selectAll.checked) selectedEmployeeIds.add(employee.id);
        else selectedEmployeeIds.delete(employee.id);
      });
      renderEmployees();
      return;
    }
    const checkbox = event.target.closest("[data-select-employee]");
    if (!checkbox) return;
    const employeeId = checkbox.dataset.selectEmployee;
    if (checkbox.checked) selectedEmployeeIds.add(employeeId);
    else selectedEmployeeIds.delete(employeeId);

    // Mit gedrueckter Umschalttaste gilt die Aenderung fuer alles zwischen der
    // zuletzt angeklickten und dieser Zeile - dann muss die Tabelle neu
    // aufgebaut werden, damit die Haken dazwischen mitgehen.
    if (takeEmployeeSelectionShift() && applyEmployeeSelectionRange(employeeId, checkbox.checked)) {
      renderEmployees();
      return;
    }
    rememberEmployeeSelectionAnchor(employeeId);
    updateEmployeeBulkBar();
  }

  function visibleEmployeesForSelection() {
    return [...elements.employeeTable.querySelectorAll("[data-select-employee]")]
      .map((checkbox) => getEmployee(checkbox.dataset.selectEmployee))
      .filter(Boolean);
  }

  function updateEmployeeBulkBar() {
    selectedEmployeeIds = new Set(
      [...selectedEmployeeIds].filter((employeeId) => getEmployee(employeeId)),
    );
    elements.employeeBulkBar.hidden = selectedEmployeeIds.size === 0;
    elements.employeeBulkCount.textContent = `${selectedEmployeeIds.size} ausgewählt`;
  }

  function clearEmployeeSelection() {
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function resetEmployeeFilters() {
    employeeProfessionFilter = "all";
    employeeQualificationFilter = "all";
    employeeWeekendFilter = "all";
    employeeSearchTerm = "";
    elements.employeeSearch.value = "";
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function handleTrainingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "add-completion") openCompletionDialog(id);
    if (action === "edit-training") openTrainingDialog(id);
    if (action === "delete-training") requestDeleteTraining(id);
    if (action === "delete-completion") requestDeleteCompletion(id);
  }

  function handleMeetingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "record-attendance") openAttendanceDialog(id);
    if (action === "edit-meeting") openMeetingDialog(id);
    if (action === "delete-meeting") requestDeleteMeeting(id);
  }

  function handleAppointmentAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (button) {
      if (event.type === "keydown") return;
      const { action, id } = button.dataset;
      if (action === "toggle-appointment-pin") toggleAppointmentPinned(id);
      if (action === "edit-appointment") openAppointmentDialog(id);
      if (action === "delete-appointment") requestDeleteAppointment(id);
      return;
    }

    // Die Karte selbst oeffnet die Schnellansicht (22-record-inspector); zum
    // Bearbeiten fuehrt der Stift auf der Karte.
  }

  async function toggleAppointmentPinned(appointmentId) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;
    const pinned = !appointment.pinned;
    const committed = await commitStateMutation(() => {
      state.appointments = state.appointments.map((item) =>
        item.id === appointmentId
          ? { ...item, pinned, updatedAt: new Date().toISOString() }
          : item,
      );
    });
    if (!committed) return;
    showToast(pinned ? "Termin wurde angepinnt." : "Termin wurde gelöst.");
  }
