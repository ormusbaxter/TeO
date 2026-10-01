  function bindForms() {
    elements.backupPasswordForm.addEventListener(
      "submit",
      handleBackupPasswordSubmit,
    );
    elements.backupPasswordDialog.addEventListener(
      "close",
      handleBackupPasswordDialogClose,
    );
    elements.showBackupPassword.addEventListener(
      "change",
      updateBackupPasswordVisibility,
    );
    elements.copyAutomaticBackupRecoveryKey.addEventListener(
      "click",
      copyAutomaticBackupRecoveryKey,
    );
    elements.employeeForm.addEventListener("submit", handleEmployeeSubmit);
    elements.trainingForm.addEventListener("submit", handleTrainingSubmit);
    elements.completionForm.addEventListener("submit", handleCompletionSubmit);
    elements.meetingForm.addEventListener("submit", handleMeetingSubmit);
    elements.appointmentForm.addEventListener("submit", handleAppointmentSubmit);
    elements.deleteAppointmentButton.addEventListener(
      "click",
      requestDeleteAppointmentFromDialog,
    );
    elements.memoForm.addEventListener("submit", handleMemoSubmit);
    elements.memoCategoryForm.addEventListener("submit", addMemoCategory);
    elements.memoCategoryList.addEventListener("click", handleMemoCategoryAction);
    elements.deviceForm.addEventListener("submit", handleDeviceSubmit);
    elements.deviceInstructionForm.addEventListener(
      "submit",
      handleDeviceInstructionSubmit,
    );
    elements.attendanceForm.addEventListener("submit", handleAttendanceSubmit);
    elements.bulkEditForm.addEventListener("submit", handleBulkEditSubmit);

    [
      ["#firstName", "Bitte einen Vornamen eingeben."],
      ["#lastName", "Bitte einen Nachnamen eingeben."],
      ["#profession", "Bitte einen Beruf eingeben."],
      ["#trainingTitle", "Bitte eine Bezeichnung eingeben."],
      ["#meetingTitle", "Bitte eine Bezeichnung eingeben."],
      ["#appointmentTitle", "Bitte einen Titel eingeben."],
      ["#memoTitle", "Bitte einen Titel eingeben."],
      ["#deviceProductName", "Bitte einen Produktnamen eingeben."],
      ["#deviceManufacturer", "Bitte einen Hersteller eingeben."],
      ["#deviceCategory", "Bitte eine Gerätekategorie eingeben."],
    ].forEach(([selector, message]) => {
      const input = document.querySelector(selector);
      input.addEventListener("input", () => {
        input.setCustomValidity(input.value.trim() ? "" : message);
      });
    });

    document.querySelector("#birthDate").addEventListener("input", (event) => {
      event.target.setCustomValidity(
        event.target.value && event.target.value > todayIso()
          ? "Das Geburtsdatum darf nicht in der Zukunft liegen."
          : "",
      );
    });

    elements.completionDate.addEventListener("input", (event) => {
      event.target.setCustomValidity(
        event.target.value && event.target.value > todayIso()
          ? "Das Abschlussdatum darf nicht in der Zukunft liegen."
          : "",
      );
    });

    elements.completionTraining.addEventListener("change", renderCompletionEmployeeList);
    elements.deviceInstructorType.addEventListener(
      "change",
      updateDeviceInstructorFields,
    );
    elements.externalInstructorName.addEventListener("input", () => {
      elements.externalInstructorName.setCustomValidity("");
    });
    elements.employeeInstructor.addEventListener("change", () => {
      elements.employeeInstructor.setCustomValidity("");
    });
    elements.employeeInstructorMpoConfirmation.addEventListener("change", () => {
      elements.employeeInstructorMpoConfirmation.setCustomValidity("");
      elements.employeeInstructorMpoConfirmationError.textContent = "";
    });
    elements.deviceInstructionDate.addEventListener("input", () => {
      elements.deviceInstructionDate.setCustomValidity("");
    });
    document
      .querySelectorAll("#appointmentStartTime, #appointmentEndTime")
      .forEach((input) => input.addEventListener("input", validateAppointmentTimes));

    const trainingTitle = document.querySelector("#trainingTitle");
    const trainingRecurrence = document.querySelector("#trainingRecurrence");
    trainingRecurrence.addEventListener("change", () => {
      trainingRecurrenceManuallyChanged = true;
    });
    trainingTitle.addEventListener("input", () => {
      if (trainingRecurrenceManuallyChanged) return;
      trainingRecurrence.value = String(
        defaultTrainingRecurrenceMonths(trainingTitle.value),
      );
    });
  }

  function bindFilters() {
    elements.helpSearch.addEventListener("input", filterHelpTopics);
    elements.clearHelpSearch.addEventListener("click", () => {
      elements.helpSearch.value = "";
      filterHelpTopics();
      elements.helpSearch.focus();
    });

    elements.employeeSearch.addEventListener("input", (event) => {
      employeeSearchTerm = searchKey(event.target.value);
      renderEmployees();
    });

    elements.appointmentSearch.addEventListener("input", (event) => {
      appointmentSearchTerm = searchKey(event.target.value);
      renderAppointments();
    });

    document.querySelectorAll("[data-appointment-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        appointmentPeriodFilter = button.dataset.appointmentFilter;
        document
          .querySelectorAll("[data-appointment-filter]")
          .forEach((filterButton) => {
            const active = filterButton === button;
            filterButton.classList.toggle("is-active", active);
            filterButton.setAttribute("aria-pressed", String(active));
          });
        renderAppointments();
      });
    });

    document.querySelectorAll("[data-appointment-view]").forEach((button) => {
      button.addEventListener("click", () =>
        setAppointmentViewMode(button.dataset.appointmentView),
      );
    });

    elements.appointmentCalendarPreviousButton.addEventListener("click", () =>
      shiftAppointmentCalendarMonth(-1),
    );
    elements.appointmentCalendarNextButton.addEventListener("click", () =>
      shiftAppointmentCalendarMonth(1),
    );
    elements.appointmentCalendarTodayButton.addEventListener(
      "click",
      showAppointmentCalendarToday,
    );
    elements.appointmentCalendarNote.addEventListener(
      "click",
      handleAppointmentCalendarNoteAction,
    );

    elements.memoSearch.addEventListener("input", (event) => {
      memoSearchTerm = searchKey(event.target.value);
      renderMemos();
    });
    elements.memoCategoryFilter.addEventListener("change", (event) => {
      memoCategoryFilter = event.target.value;
      renderMemos();
    });
    document.querySelectorAll("[data-memo-status]").forEach((button) => {
      button.addEventListener("click", () => {
        memoStatusFilter = button.dataset.memoStatus;
        document.querySelectorAll("[data-memo-status]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderMemos();
      });
    });

    elements.employeeProfessionFilter.addEventListener("change", (event) => {
      employeeProfessionFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.employeeQualificationFilter.addEventListener("change", (event) => {
      employeeQualificationFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.employeeWeekendFilter.addEventListener("change", (event) => {
      employeeWeekendFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.resetEmployeeFilters.addEventListener("click", resetEmployeeFilters);

    document.querySelectorAll("[data-status-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        employeeStatusFilter = button.dataset.statusFilter;
        document.querySelectorAll("[data-status-filter]").forEach((filterButton) => {
          const active = filterButton === button;
          filterButton.classList.toggle("is-active", active);
          filterButton.setAttribute("aria-pressed", String(active));
        });
        renderEmployees();
      });
    });

    elements.completionEmployeeSearch.addEventListener("input", (event) => {
      completionSearchTerm = searchKey(event.target.value);
      renderCompletionEmployeeList();
    });

    elements.completionEmployeeList.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"][data-employee-id]');
      if (!checkbox) return;

      if (checkbox.checked) selectedCompletionEmployeeIds.add(checkbox.dataset.employeeId);
      else selectedCompletionEmployeeIds.delete(checkbox.dataset.employeeId);

      elements.completionEmployeeError.textContent = "";
      updateCompletionSelectionUi();
    });

    elements.toggleAllEmployees.addEventListener("click", () => {
      const visibleEmployees = filteredCompletionEmployees();
      const allSelected =
        visibleEmployees.length > 0 &&
        visibleEmployees.every((employee) => selectedCompletionEmployeeIds.has(employee.id));

      visibleEmployees.forEach((employee) => {
        if (allSelected) selectedCompletionEmployeeIds.delete(employee.id);
        else selectedCompletionEmployeeIds.add(employee.id);
      });

      renderCompletionEmployeeList();
    });

    elements.attendanceSearch.addEventListener("input", (event) => {
      attendanceSearchTerm = searchKey(event.target.value);
      renderAttendanceList();
    });

    elements.attendanceFilter.addEventListener("change", (event) => {
      attendanceStatusFilter = event.target.value;
      renderAttendanceList();
    });

    elements.applyBulkAttendance.addEventListener("click", () => {
      const visibleEmployees = filteredAttendanceEmployees();
      if (visibleEmployees.length === 0) {
        showToast("Für die aktuelle Auswahl sind keine Mitarbeiter sichtbar.", "error");
        return;
      }

      const status = elements.attendanceBulkStatus.value;
      visibleEmployees.forEach((employee) => {
        if (status) attendanceDraft.set(employee.id, status);
        else attendanceDraft.delete(employee.id);
      });
      renderAttendanceList();
      showToast(
        `Status wurde für ${visibleEmployees.length} Mitarbeiter${
          visibleEmployees.length === 1 ? "" : "/innen"
        } übernommen.`,
      );
    });

    elements.attendanceList.addEventListener("change", (event) => {
      const select = event.target.closest("select[data-attendance-employee-id]");
      if (!select) return;
      if (select.value) attendanceDraft.set(select.dataset.attendanceEmployeeId, select.value);
      else attendanceDraft.delete(select.dataset.attendanceEmployeeId);
      updateAttendanceProgress();
      if (attendanceStatusFilter === "all") {
        updateAttendanceRowState(select.closest(".attendance-row"), select.value);
      } else {
        renderAttendanceList();
      }
    });

    elements.deviceAnnexFilter.addEventListener("change", (event) => {
      deviceAnnexFilter = event.target.value;
      renderDevices();
    });
    elements.toggleDeviceMatrixMaximizeButton.addEventListener(
      "click",
      toggleDeviceMatrixMaximized,
    );
    document.addEventListener("keydown", handleDeviceMatrixMaximizeKeydown);
    elements.deviceInventoryFilter.addEventListener("change", (event) => {
      deviceInventoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceCategoryFilter.addEventListener("change", (event) => {
      deviceCategoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceSearch.addEventListener("input", (event) => {
      deviceSearchTerm = searchKey(event.target.value);
      renderDeviceInstructionMatrix();
    });
    elements.deviceManagementSearch.addEventListener("input", (event) => {
      deviceManagementSearchTerm = searchKey(event.target.value);
      renderDevices();
    });
    elements.exportDeviceCatalogExcelButton.addEventListener(
      "click",
      exportDeviceCatalogExcel,
    );
    elements.deviceManagementInventoryFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementInventoryFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceManagementAnnexFilter.addEventListener("change", (event) => {
      deviceManagementAnnexFilter = event.target.value;
      renderDevices();
    });
    elements.deviceManagementCategoryFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementCategoryFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceManagementAuthorizationFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementAuthorizationFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceEmployeeStatusFilter.addEventListener("change", (event) => {
      deviceEmployeeStatusFilter = event.target.value;
      renderDeviceInstructionMatrix();
    });
    elements.deviceEmployeeSearch.addEventListener("input", (event) => {
      deviceEmployeeSearchTerm = searchKey(event.target.value);
      renderDeviceInstructionMatrix();
    });
    elements.deviceOverviewSearch.addEventListener("input", (event) => {
      deviceOverviewSearchTerm = searchKey(event.target.value);
      renderDeviceOverview();
    });
    elements.deviceOverviewInstructionFilter.addEventListener(
      "change",
      (event) => {
        deviceOverviewInstructionFilter = event.target.value;
        renderDeviceOverview();
      },
    );
    elements.deviceOverviewEmploymentFilter.addEventListener(
      "change",
      (event) => {
        deviceOverviewEmploymentFilter = event.target.value;
        renderDeviceOverview();
      },
    );
    elements.deviceParticipantSearch.addEventListener("input", (event) => {
      deviceParticipantSearchTerm = searchKey(event.target.value);
      renderDeviceParticipantList();
    });
    elements.deviceParticipantList.addEventListener("change", (event) => {
      handleDeviceParticipantChange(event);
    });
    elements.toggleAllDeviceParticipants.addEventListener("click", () => {
      toggleVisibleDeviceParticipants();
    });
    elements.deviceInstructionSearch.addEventListener("input", (event) => {
      deviceInstructionSearchTerm = searchKey(event.target.value);
      deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
    });
    elements.deviceInstructionSort.addEventListener("change", (event) => {
      deviceInstructionSortKey =
        event.target.value === "createdAt" ? "createdAt" : "date";
      deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
    });
    elements.deviceInstructionDeviceSearch.addEventListener("input", (event) => {
      deviceInstructionDeviceSearchTerm = searchKey(event.target.value);
      renderInstructionDeviceList();
    });
    elements.deviceInstructionDeviceList.addEventListener("change", (event) => {
      handleInstructionDeviceChange(event);
    });
    elements.toggleAllInstructionDevices.addEventListener("click", () => {
      toggleVisibleInstructionDevices();
    });
  }

  // Das Handbuch steht beim Start in einer Vorlage und gehoert damit noch
  // nicht zum Dokument. Eingehaengt wird es beim ersten Bedarf: beim Wechsel
  // in die Hilfe, bei der ersten Suche und wenn „Was ist neu“ den Abschnitt
  // der laufenden Fassung von dort holt. Die Knoten werden verschoben, nicht
  // kopiert - die Vorlage ist danach leer.
  let helpContentAttached = false;

  function ensureHelpContent() {
    if (helpContentAttached) return;
    helpContentAttached = true;
    const template = elements.helpContentTemplate;
    if (!template?.content || !elements.helpContentHost) return;
    elements.helpContentHost.append(template.content);
  }

  // Wo das Handbuch gerade steht: im Dokument, sobald es eingehaengt ist -
  // sonst in seiner Vorlage. Wer nur darin nachschlaegt, soll es dafuer nicht
  // aufbauen muessen. „Was ist neu“ tut genau das, und zwar beim Start.
  function helpContentRoot() {
    if (helpContentAttached) return document;
    const template = elements.helpContentTemplate;
    return template?.content?.querySelectorAll ? template.content : document;
  }

  // Die Suche verglich bisher bei jedem Tastendruck den Text saemtlicher
  // Abschnitte - rund 130 KB, jedes Mal durch die Normalisierung von
  // searchKey. Das Handbuch aendert sich zur Laufzeit nicht, deshalb entsteht
  // der Suchschluessel je Abschnitt genau einmal.
  let helpTopics = null;

  function helpTopicList() {
    if (helpTopics) return helpTopics;
    ensureHelpContent();
    helpTopics = [...document.querySelectorAll("[data-help-section]")].map(
      (section) => ({
        section,
        navButton: document.querySelector(
          `[data-help-nav-target="${section.dataset.helpHeading}"]`,
        ),
        key: searchKey(section.textContent),
      }),
    );
    return helpTopics;
  }

  function filterHelpTopics() {
    const query = searchKey(elements.helpSearch.value);
    const topics = helpTopicList();
    let visibleCount = 0;
    topics.forEach((topic) => {
      const matches = !query || topic.key.includes(query);
      topic.section.hidden = !matches;
      if (matches) visibleCount += 1;
      topic.navButton?.toggleAttribute("hidden", !matches);
    });
    elements.helpSearchStatus.textContent = query
      ? `${visibleCount} von ${topics.length} Themen gefunden`
      : `${topics.length} Hilfethemen`;
    elements.clearHelpSearch.hidden = !query;
    elements.helpNoResults.hidden = visibleCount > 0;
  }
