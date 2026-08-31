  function bindNavigation() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    document.querySelectorAll("[data-go-to]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.goTo));
    });

    document.querySelectorAll("[data-settings-section-target]").forEach((button) => {
      button.addEventListener("click", () => {
        showView("settings");
        showSettingsSection(button.dataset.settingsSectionTarget);
      });
    });

    // Das Inhaltsverzeichnis der Hilfe entsteht erst beim Einhaengen des
    // Handbuchs. Der Aufruf wird deshalb am Behaelter abgefangen, der von
    // Anfang an im Dokument steht.
    elements.helpContentHost?.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-help-target]");
      if (!button) return;
      document
        .getElementById(button.dataset.helpTarget)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_VIEWS[hash]) showView(HASH_VIEWS[hash], false);
    });

    window.addEventListener("scroll", requestStickyHeaderUpdate, { passive: true });
    window.addEventListener("resize", requestStickyHeaderUpdate);
    updateStickyHeader();
  }

  // Der Seitenkopf klebt per CSS; ob er eingeklappt ist, entscheidet die
  // Bildlaufhoehe. Gemessen wird die Oberkante der Ansicht, nicht die des
  // Kopfes: Die des Kopfes steht beim Kleben fest, die der Ansicht wandert
  // weiter und bleibt vom Einklappen unberuehrt.
  //
  // Zwischen Einklappen und Aufklappen liegt bewusst die volle Kopfhoehe.
  // Einklappen verkuerzt die Seite; reicht der Inhalt knapp, kappt der Browser
  // die Bildlaufhoehe und schiebt die Ansicht zurueck nach unten. Ohne diesen
  // Abstand faende der Kopf sich sofort wieder aufgeklappt - und das Spiel
  // begaenne von vorn, bei jedem Rad-Tick.
  function updateStickyHeader() {
    stickyHeaderFrame = 0;
    const view = document.querySelector(".view.is-active");
    const header = view?.querySelector(".page-header");
    if (!header) return;
    const styles = window.getComputedStyle(header);
    if (styles.position !== "sticky") {
      header.classList.remove("is-stuck");
      return;
    }
    const offset = Number.parseFloat(styles.top) || 0;
    const viewTop = view.getBoundingClientRect().top;
    if (header.classList.contains("is-stuck")) {
      if (viewTop >= offset - 4) header.classList.remove("is-stuck");
      return;
    }
    if (viewTop <= offset - header.getBoundingClientRect().height) {
      header.classList.add("is-stuck");
    }
  }

  function requestStickyHeaderUpdate() {
    if (stickyHeaderFrame) return;
    stickyHeaderFrame = window.requestAnimationFrame(updateStickyHeader);
  }

  function showView(view, updateHash = true) {
    if (!VIEW_HASHES[view]) view = "dashboard";
    if (view !== "vacations") setVacationPlannerMaximized(false);
    if (view !== "devices") setDeviceMatrixMaximized(false);
    activeView = view;

    document.body.classList.toggle("is-vacation-view", view === "vacations");
    if (view === "help") ensureHelpContent();
    if (view === "dashboard") renderDashboardGreeting();
    elements.mobileCreateButton.hidden = ["settings", "help"].includes(view);

    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
    });

    // Aenderungen, die waehrend der Abwesenheit dieser Ansicht entstanden
    // sind, werden jetzt nachgezogen - noch vor jeder Vermessung, damit das
    // Dashboard seine endgueltige Hoehe misst.
    if (staleViews.has(view)) renderView(view);

    // Erst jetzt ist das Dashboard vermessbar.
    if (view === "dashboard") limitDeadlineListHeight();

    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (view === "settings") showSettingsSection(activeSettingsSection);

    const mobileCreateType =
      view === "trainings"
        ? "training"
        : view === "meetings"
          ? "meeting"
          : view === "appointments"
            ? "appointment"
            : view === "memos"
              ? "memo"
            : view === "devices"
              ? "device-instruction"
              : view === "device-management"
                ? "device"
              : "employee";
    elements.mobileCreateButton.dataset.createType = mobileCreateType;
    elements.mobileCreateButton.querySelector("span").textContent = {
      employee: "Anlegen",
      training: "Fortbildung",
      meeting: "Sitzung",
      appointment: "Termin",
      memo: "Memo / ToDo",
      "device-instruction": "Einweisung",
      device: "Gerät",
    }[mobileCreateType];

    if (updateHash) {
      const nextHash = `#${VIEW_HASHES[view]}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState(null, "", nextHash);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    document
      .querySelectorAll(".page-header.is-stuck")
      .forEach((header) => header.classList.remove("is-stuck"));
    requestStickyHeaderUpdate();
  }

  function showSettingsSection(section = "general") {
    const availableSections = new Set([
      "general",
      "planning",
      "training",
      "master-data",
      "data",
    ]);
    activeSettingsSection = availableSections.has(section) ? section : "general";
    document.querySelectorAll("[data-settings-section]").forEach((panel) => {
      panel.hidden = panel.dataset.settingsSection !== activeSettingsSection;
    });
    document.querySelectorAll("[data-settings-section-target]").forEach((button) => {
      const active = button.dataset.settingsSectionTarget === activeSettingsSection;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // Was „Anlegen“ in der gezeigten Ansicht bedeutet. Der Knopf am unteren
  // Rand und das Tastenkuerzel „n“ gehen denselben Weg.
  function openCreateDialogForActiveView() {
    const type = elements.mobileCreateButton.dataset.createType;
    if (type === "training") openTrainingDialog();
    else if (type === "meeting") openMeetingDialog();
    else if (type === "appointment") openAppointmentDialog();
    else if (type === "memo") openMemoDialog();
    else if (type === "device-instruction") openDeviceInstructionDialog();
    else if (type === "device") openDeviceDialog();
    else openEmployeeDialog();
  }

  function bindDialogTriggers() {
    elements.mobileCreateButton.addEventListener("click", openCreateDialogForActiveView);

    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.addEventListener("change", () => changeTheme(select.value));
    });
    elements.mobileThemeButton.addEventListener("click", () => {
      const themes = Object.keys(THEMES);
      const currentIndex = themes.indexOf(activeThemeKey());
      changeTheme(themes[(currentIndex + 1) % themes.length]);
    });

    document.querySelectorAll("[data-open-employee]").forEach((button) => {
      button.addEventListener("click", () => openEmployeeDialog());
    });

    document.querySelectorAll("[data-open-training]").forEach((button) => {
      button.addEventListener("click", () => openTrainingDialog());
    });

    document.querySelectorAll("[data-open-completion]").forEach((button) => {
      button.addEventListener("click", () => openCompletionDialog());
    });

    document.querySelectorAll("[data-open-meeting]").forEach((button) => {
      button.addEventListener("click", () => openMeetingDialog());
    });

    document.querySelectorAll("[data-open-appointment]").forEach((button) => {
      button.addEventListener("click", () => openAppointmentDialog());
    });
    document.querySelectorAll("[data-open-memo]").forEach((button) => {
      button.addEventListener("click", () => openMemoDialog());
    });
    document.querySelectorAll("[data-open-device]").forEach((button) => {
      button.addEventListener("click", () => openDeviceDialog());
    });
    document
      .querySelectorAll("[data-open-device-instruction]")
      .forEach((button) => {
        button.addEventListener("click", () => openDeviceInstructionDialog());
      });

    elements.copyActiveEmailsButton.addEventListener("click", copyActiveEmployeeEmails);
    elements.copyUsernamesButton.addEventListener(
      "click",
      copyFilteredEmployeeUsernames,
    );
    elements.exportEmployeePhoneListButton.addEventListener(
      "click",
      exportEmployeePhoneList,
    );
    elements.printEmployeePhoneListButton.addEventListener(
      "click",
      printEmployeePhoneList,
    );
    elements.openWeekendSimulationButton.addEventListener(
      "click",
      openWeekendSimulationDialog,
    );
    elements.rerunWeekendSimulationButton.addEventListener(
      "click",
      renderWeekendSimulation,
    );
    elements.applyWeekendSimulationButton.addEventListener(
      "click",
      requestApplyWeekendSimulation,
    );
    elements.openTrainingMatrixButton.addEventListener("click", openTrainingMatrixDialog);
    elements.openTrainingTimeCalculatorButton.addEventListener(
      "click",
      openTrainingTimeCalculator,
    );
    elements.timeSpanList.addEventListener("input", updateTimeSpanTotal);
    elements.creditedTrainingTimeList.addEventListener(
      "input",
      updateCreditedTrainingTimeTotal,
    );
    elements.resetTimeSpansButton.addEventListener("click", () => {
      elements.timeSpanList.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      updateTimeSpanTotal();
    });
    elements.resetCreditedTrainingTimesButton.addEventListener("click", () => {
      elements.creditedTrainingTimeList.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      updateCreditedTrainingTimeTotal();
    });
    elements.trainingDisplayYear.addEventListener("change", () => {
      trainingDisplayYear = Number(elements.trainingDisplayYear.value);
      renderTrainings();
    });
    elements.trainingMatrixYear.addEventListener("change", renderTrainingMatrix);
    elements.exportTrainingMatrixCsvButton.addEventListener(
      "click",
      exportTrainingMatrixCsv,
    );
    elements.printTrainingMatrixButton.addEventListener("click", printTrainingMatrix);
    elements.openMeetingStatsButton.addEventListener("click", openMeetingStatsDialog);
    elements.meetingDisplayYear.addEventListener("change", () => {
      meetingDisplayYear = Number(elements.meetingDisplayYear.value);
      renderMeetings();
    });
    elements.meetingStatsYear.addEventListener("change", renderMeetingStatistics);
    elements.meetingAttendanceThreshold.addEventListener(
      "change",
      updateMeetingAttendanceThreshold,
    );
    elements.exportMeetingStatsCsvButton.addEventListener("click", exportMeetingStatsCsv);
    elements.deadlineHorizon.addEventListener("change", renderDeadlineOverview);
    elements.deadlineFilters.forEach((filter) => {
      filter.addEventListener("change", updateDeadlineFilters);
    });
    elements.deadlineHideOverdue.addEventListener(
      "change",
      updateDeadlineOverdueFilter,
    );
    elements.exportDataButton.addEventListener("click", exportDatabase);
    elements.databaseSaveWarningExportButton.addEventListener(
      "click",
      exportDatabase,
    );
    elements.exportEncryptedDataButton.addEventListener("click", exportEncryptedDatabase);
    elements.selectAutomaticBackupDirectoryButton.addEventListener(
      "click",
      selectAutomaticBackupDirectory,
    );
    elements.runAutomaticBackupButton.addEventListener(
      "click",
      () => void runAutomaticBackup({ force: true, requestPermission: true }),
    );
    elements.removeAutomaticBackupDirectoryButton.addEventListener(
      "click",
      removeAutomaticBackupDirectory,
    );
    elements.automaticBackupEncryption.addEventListener(
      "change",
      renderAutomaticBackupEncryptionControls,
    );
    elements.setAutomaticBackupPasswordButton.addEventListener(
      "click",
      configureAutomaticBackupEncryption,
    );
    elements.saveAutomaticBackupSettingsButton.addEventListener(
      "click",
      saveAutomaticBackupSettings,
    );
    elements.settingsMaxBackupFileSizeMb.addEventListener(
      "input",
      () => renderBackupVolumeMeter(elements.settingsMaxBackupFileSizeMb.value),
    );
    elements.requestPersistentStorageButton.addEventListener(
      "click",
      requestPersistentBrowserStorage,
    );
    elements.importDataButton.addEventListener("click", () => elements.importDataFile.click());
    elements.importDataFile.addEventListener("change", handleBackupFileSelection);
    elements.selectStartupBackupFileButton.addEventListener(
      "click",
      () => elements.startupBackupFile.click(),
    );
    elements.startupBackupFile.addEventListener(
      "change",
      handleStartupBackupFileSelection,
    );
    elements.validateBackupButton.addEventListener(
      "click",
      () => elements.validateBackupFile.click(),
    );
    elements.validateBackupFile.addEventListener("change", handleBackupValidationSelection);
    elements.openAuditLogButton.addEventListener("click", openAuditLogDialog);
    elements.exportAuditLogCsvButton.addEventListener("click", exportAuditLogCsv);
    elements.openWeekendOverviewButton.addEventListener("click", () => showView("weekends"));
    elements.openWeekendPrintButton.addEventListener("click", openWeekendOverviewDialog);
    elements.vacationYear.addEventListener("change", () => {
      vacationYear = Number(elements.vacationYear.value);
      saveVacationViewPreference();
      renderVacationPlanner();
    });
    elements.vacationMonth.addEventListener("change", () => {
      vacationMonth = Number(elements.vacationMonth.value);
      saveVacationViewPreference();
      renderVacationPlanner();
    });
    elements.vacationEntryType.addEventListener("change", () => {
      vacationEntryType = Object.hasOwn(
        PLANNER_ENTRY_TYPES,
        elements.vacationEntryType.value,
      )
        ? elements.vacationEntryType.value
        : "vacation";
    });
    elements.vacationEmployeeSearch.addEventListener("input", () => {
      vacationEmployeeSearchTerm = elements.vacationEmployeeSearch.value;
      renderVacationPlanner();
    });
    elements.openVacationConflictsButton.addEventListener(
      "click",
      openVacationConflictOverview,
    );
    elements.printBlankVacationYearOverviewsButton.addEventListener(
      "click",
      printBlankVacationYearOverviews,
    );
    elements.printBlankVacationMonthPlansButton.addEventListener(
      "click",
      printBlankVacationMonthPlans,
    );
    elements.toggleVacationPlannerMaximizeButton.addEventListener(
      "click",
      toggleVacationPlannerMaximized,
    );
    elements.previousVacationMonthButton.addEventListener("click", () =>
      shiftVacationMonth(-1),
    );
    elements.nextVacationMonthButton.addEventListener("click", () =>
      shiftVacationMonth(1),
    );
    document.addEventListener("keydown", handleVacationPlannerMaximizeKeydown);
    elements.vacationConflictContent.addEventListener("click", (event) => {
      const dateButton = event.target.closest("[data-vacation-conflict-date]");
      if (!dateButton) return;
      const date = dateButton.dataset.vacationConflictDate;
      vacationYear = Number(date.slice(0, 4));
      vacationMonth = Number(date.slice(5, 7));
      saveVacationViewPreference();
      elements.vacationConflictDialog.close();
      renderVacationPlanner();
    });
    elements.printVacationEmployeeOverviewButton.addEventListener(
      "click",
      printVacationEmployeeOverview,
    );
    elements.saveVacationSettingsButton.addEventListener(
      "click",
      saveVacationSettings,
    );
    elements.printWeekendOverviewButton.addEventListener("click", printWeekendOverview);
    elements.openDataQualityButton.addEventListener("click", openDataQualityDialog);
    document.querySelectorAll("[data-open-data-quality]").forEach((button) => {
      button.addEventListener("click", openDataQualityDialog);
    });
    elements.settingsCloseDialogOnOutsideClick.addEventListener(
      "change",
      (event) => {
        void saveCloseDialogOnOutsideClick(event.target.value === "on");
      },
    );
    elements.schoolVacationForm.addEventListener(
      "submit",
      addSchoolVacationPeriod,
    );
    elements.schoolVacationList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-school-vacation]");
      if (button) {
        void deleteSchoolVacationPeriod(
          Number(button.dataset.deleteSchoolVacation),
        );
      }
    });
    elements.restoreOfficialSchoolVacationsButton.addEventListener(
      "click",
      restoreOfficialSchoolVacations,
    );
    elements.saveGeneralSettingsButton.addEventListener(
      "click",
      saveGeneralSettings,
    );
    elements.saveTrainingDurationsButton.addEventListener(
      "click",
      saveTrainingDurations,
    );
    elements.saveWeekendSettingsButton.addEventListener(
      "click",
      saveWeekendSettings,
    );
    elements.settingsWeekendOwnerA.addEventListener(
      "change",
      updateWeekendNamePreviews,
    );
    elements.settingsWeekendOwnerB.addEventListener(
      "change",
      updateWeekendNamePreviews,
    );
    elements.settingsStorageBackend.addEventListener(
      "change",
      renderBackendSelection,
    );
    elements.testBackendConnectionButton.addEventListener(
      "click",
      testBackendConnection,
    );
    elements.applyStorageBackendButton.addEventListener(
      "click",
      applyStorageBackend,
    );
    elements.openBulkEditButton.addEventListener("click", openBulkEditDialog);
    elements.deleteEmployeeSelection?.addEventListener("click", () =>
      deleteEmployees([...selectedEmployeeIds]),
    );
    elements.clearEmployeeSelection.addEventListener("click", clearEmployeeSelection);
    elements.printEmployeeDossierButton.addEventListener("click", printEmployeeDossier);
  }

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


  function bindDelegatedActions() {
    elements.employeeTable.addEventListener("click", handleEmployeeTableAction);
    elements.employeeTable.addEventListener("change", handleEmployeeTableSelection);
    elements.vacationPlanner.addEventListener("click", handleVacationPlannerClick);
    elements.vacationPlanner.addEventListener("change", handleVacationPlannerChange);
    elements.vacationPlanner.addEventListener(
      "keydown",
      handleVacationPlannerKeydown,
    );
    elements.recentEmployees.addEventListener("click", handleRecentEmployeeAction);
    elements.trainingList.addEventListener("click", handleTrainingAction);
    elements.meetingList.addEventListener("click", handleMeetingAction);
    elements.appointmentList.addEventListener("click", handleAppointmentAction);
    elements.appointmentList.addEventListener("keydown", handleAppointmentAction);
    // Im Kalender sind Tage und Eintraege Schaltflaechen; die Tastatur loest
    // sie ohne eigenen keydown-Zweig aus.
    elements.appointmentCalendarGrid.addEventListener(
      "click",
      handleAppointmentCalendarClick,
    );
    elements.memoList.addEventListener("click", handleMemoAction);
    elements.memoList.addEventListener("keydown", handleMemoAction);
    elements.dashboardMemoList.addEventListener("click", handleDashboardMemoAction);
    elements.deviceCatalog.addEventListener("click", handleDeviceAction);
    elements.deviceInstructionMatrix.addEventListener(
      "click",
      handleDeviceMatrixAction,
    );
    elements.deviceInstructionList.addEventListener(
      "click",
      handleDeviceInstructionListAction,
    );
    elements.deviceInstructionHistoryContent.addEventListener(
      "click",
      handleDeviceHistoryAction,
    );
    elements.deviceEmployeeOverviewContent.addEventListener(
      "click",
      handleDeviceEmployeeOverviewAction,
    );
    elements.deviceOverviewContent.addEventListener(
      "click",
      handleDeviceEmployeeOverviewAction,
    );
  }

  function bindDialogs() {
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog) requestDialogClose(dialog);
      });
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("close", () => {
        window.setTimeout(syncNotificationLayer, 0);
      });
      if (dialog.hasAttribute("data-persistent-dialog")) {
        dialog.addEventListener("cancel", (event) => event.preventDefault());
        return;
      }
      dialog.addEventListener("cancel", (event) => {
        if (!dialogHasUnsavedChanges(dialog)) return;
        event.preventDefault();
        requestDialogClose(dialog);
      });
      dialog.addEventListener("click", (event) => {
        // Die Einstellung wird bei jedem Klick gelesen, damit ein Umschalten
        // sofort wirkt und die Dialoge nicht neu verdrahtet werden muessen.
        if (!state.settings.closeDialogOnOutsideClick) return;
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom;
        if (!inside) requestDialogClose(dialog);
      });
    });

    elements.confirmCancel.addEventListener("click", () => {
      confirmCallback = null;
      elements.confirmDialog.close();
    });

    elements.confirmAccept.addEventListener("click", () => {
      const callback = confirmCallback;
      confirmCallback = null;
      elements.confirmDialog.close();
      if (callback) callback();
    });

    elements.confirmDialog.addEventListener("close", () => {
      confirmCallback = null;
    });
  }

  function captureCleanForm(form) {
    if (form) cleanFormSnapshots.set(form, serializeForm(form));
  }

  function markFormClean(form) {
    if (form) cleanFormSnapshots.delete(form);
  }

  function serializeForm(form) {
    return JSON.stringify(
      [...form.querySelectorAll("input, select, textarea")].map((field, index) => [
        field.name || field.id || field.dataset.employeeId || index,
        ["checkbox", "radio"].includes(field.type) ? field.checked : field.value,
      ]),
    );
  }

  function dialogHasUnsavedChanges(dialog) {
    const form = dialog.querySelector("form");
    const snapshot = form ? cleanFormSnapshots.get(form) : undefined;
    return snapshot !== undefined && snapshot !== serializeForm(form);
  }

  function requestDialogClose(dialog) {
    if (!dialogHasUnsavedChanges(dialog)) {
      dialog.close();
      return;
    }
    requestConfirmation({
      title: "Ungespeicherte Änderungen verwerfen?",
      message:
        "In diesem Formular wurden Änderungen vorgenommen. Beim Schließen gehen diese Eingaben verloren.",
      acceptLabel: "Änderungen verwerfen",
      callback: () => {
        markFormClean(dialog.querySelector("form"));
        dialog.close();
      },
    });
  }

  function bindAuthentication() {
    elements.setupForm.addEventListener("submit", handleSetupSubmit);
    elements.loginForm.addEventListener("submit", handleLoginSubmit);
    elements.changePasswordForm.addEventListener("submit", handlePasswordChangeSubmit);
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", logout);
    });
    document.querySelectorAll("[data-open-user-management]").forEach((button) => {
      button.addEventListener("click", openUserManagementDialog);
    });
    elements.mobileAccountButton.addEventListener("click", openAccountDialog);
    elements.createUserForm.addEventListener("submit", handleCreateUserSubmit);
    elements.userManagementList.addEventListener("click", (event) => {
      const resetButton = event.target.closest("[data-reset-user-password]");
      if (resetButton) {
        requestPasswordReset(resetButton.dataset.resetUserPassword);
        return;
      }
      const deleteButton = event.target.closest("[data-delete-user]");
      if (deleteButton) {
        requestDeleteUser(deleteButton.dataset.deleteUser);
        return;
      }
      const saveButton = event.target.closest("[data-save-user-username]");
      if (saveButton) saveUsername(saveButton.dataset.saveUserUsername);
    });
    elements.userManagementList.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        event.target.matches("[data-user-username]")
      ) {
        event.preventDefault();
        saveUsername(event.target.dataset.userUsername);
      }
    });
    elements.copyTemporaryPassword.addEventListener("click", async () => {
      const password = elements.temporaryPasswordValue.value;
      if (!password) return;
      try {
        await navigator.clipboard.writeText(password);
      } catch {
        copyTextWithFallback(password);
      }
      showToast("Temporäres Passwort wurde kopiert.");
    });
  }

  function bindCatalogManagement() {
    document.querySelectorAll(
      "#openCatalogManagementButton, [data-open-catalog-management]",
    ).forEach((button) => {
      button.addEventListener("click", openCatalogManagementDialog);
    });
    elements.addProfessionButton.addEventListener("click", addProfession);
    elements.addQualificationButton.addEventListener("click", addQualification);
    elements.newProfession.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addProfession();
      }
    });
    elements.newQualification.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addQualification();
      }
    });
    elements.professionCatalogList.addEventListener("click", handleProfessionCatalogAction);
    elements.qualificationCatalogList.addEventListener(
      "click",
      handleQualificationCatalogAction,
    );
  }

  function bindDataSync() {
    if (!("BroadcastChannel" in window)) return;

    dataSyncChannel = new window.BroadcastChannel("intensivteam-data-sync-v1");
    dataSyncChannel.addEventListener("message", async (event) => {
      if (event.data?.type !== "state-updated") return;
      if (event.data?.backend && event.data.backend !== backendMode) return;
      const openDialogs = [
        elements.employeeDialog,
        elements.trainingDialog,
        elements.completionDialog,
        elements.trainingMatrixDialog,
        elements.meetingDialog,
        elements.appointmentDialog,
        elements.deviceDialog,
        elements.deviceInstructionDialog,
        elements.deviceEmployeeOverviewDialog,
        elements.deviceOverviewDialog,
        elements.deviceInstructionHistoryDialog,
        elements.attendanceDialog,
        elements.meetingStatsDialog,
        elements.accountDialog,
        elements.userManagementDialog,
        elements.catalogManagementDialog,
        elements.employeeDossierDialog,
        elements.vacationEmployeeOverviewDialog,
        elements.vacationConflictDialog,
        elements.weekendOverviewDialog,
        elements.weekendSimulationDialog,
        elements.bulkEditDialog,
        elements.dataQualityDialog,
        elements.auditLogDialog,
        elements.automaticBackupRecoveryDialog,
        elements.confirmDialog,
      ].filter((dialog) => dialog.open);
      openDialogs.forEach((dialog) => dialog.close());

      state = await loadState();
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      if (currentUser) {
        const refreshedUser = state.users.find((user) => user.id === currentUser.id);
        if (!refreshedUser) {
          showLoginDialog();
          return;
        }
        currentUser = refreshedUser;
        // Erst nach dem Auffrischen des Kontos, damit ein an einem anderen
        // Arbeitsplatz gewaehltes Farbthema uebernommen wird.
        applyTheme(activeThemeKey());
        if (currentUser.mustChangePassword) {
          completeLogin(currentUser);
          showToast("Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.");
          return;
        }
      } else {
        applyTheme(activeThemeKey());
      }
      renderAll();
      showToast(
        openDialogs.length
          ? "Daten wurden aktualisiert. Die offene Eingabe wurde vorsorglich geschlossen."
          : "Daten wurden aus einem anderen Tab aktualisiert.",
      );
    });

    window.addEventListener("beforeunload", () => dataSyncChannel?.close());
  }

  function bindRemoteSync() {
    remoteSyncTimer = window.setInterval(pollMariaDbState, 15000);
    window.addEventListener("beforeunload", () => {
      if (remoteSyncTimer) window.clearInterval(remoteSyncTimer);
    });
  }

  async function pollMariaDbState() {
    if (
      !isMariaDbMode() ||
      !currentUser ||
      document.hidden ||
      !window.TeOBackend.readToken()
    ) {
      return;
    }

    try {
      const result = await window.TeOBackend.load(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      markBackendConnected({ synchronized: true });
      const nextRevision = Number(result.revision) || 0;
      if (nextRevision <= remoteRevision) return;

      if (document.querySelector("dialog[open]")) {
        if (remoteUpdateNoticeRevision !== nextRevision) {
          remoteUpdateNoticeRevision = nextRevision;
          showToast(
            "Auf dem Server liegen neuere Daten vor. Sie werden nach dem Schließen der offenen Eingabe geladen.",
          );
        }
        return;
      }

      state = normalizeState(result.state);
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      remoteRevision = nextRevision;
      remoteUpdateNoticeRevision = 0;
      const refreshedUser = state.users.find(
        (user) => user.id === currentUser.id,
      );
      if (!refreshedUser) {
        window.TeOBackend.writeToken("");
        showLoginDialog();
        return;
      }
      currentUser = refreshedUser;
      applyTheme(activeThemeKey());
      if (currentUser.mustChangePassword) {
        completeLogin(currentUser);
        showToast(
          "Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.",
        );
        return;
      }
      renderAll();
      showToast("Änderungen von einem anderen Arbeitsplatz wurden geladen.");
    } catch (error) {
      if (error.status === 401) {
        markBackendConnected();
        window.TeOBackend.writeToken("");
        showLoginDialog();
      } else {
        markBackendConnectionError(error);
        console.warn("MariaDB-Synchronisierung vorübergehend nicht verfügbar.", error);
      }
    }
  }

  // Welche Renderfunktionen den Inhalt einer Ansicht aufbauen. Die
  // Geraeteliste versorgt beide Geraeteansichten, deshalb steht sie zweimal.
  // Inhalte von Dialogen stehen bewusst nicht hier: Sie werden beim Oeffnen
  // des Dialogs aufgebaut und sind dadurch immer aktuell.
  const VIEW_RENDERERS = {
    dashboard: [renderDashboard, renderDeadlineOverview, renderDashboardMemos, renderDesktopWorkspace],
    employees: [renderEmployees],
    weekends: [renderWeekendDistribution],
    vacations: [renderVacationPlanner],
    appointments: [renderAppointments],
    memos: [renderMemos],
    trainings: [renderTrainings],
    meetings: [renderMeetings],
    devices: [renderDevices],
    "device-management": [renderDevices],
    settings: [renderSettings],
    help: [filterHelpTopics],
  };

  function renderView(view) {
    staleViews.delete(view);
    for (const render of VIEW_RENDERERS[view] || []) render();
  }

  // Eine Aenderung betrifft selten mehr als eine Ansicht, aufgebaut wurden
  // bisher aber alle - auch die verdeckten. Allein Geraeteliste und
  // Urlaubsmatrix kosten zusammen ein halbes Zehntel einer Sekunde, das
  // niemand zu sehen bekommt. Verdeckte Ansichten werden deshalb nur
  // vorgemerkt; showView() holt sie beim Wechsel nach.
  function renderAll() {
    // Nur Mitarbeiter, die tatsaechlich im Dienst stehen. Ausgetretene sollen
    // die Zahl in der Seitenleiste nicht dauerhaft aufblaehen.
    elements.navEmployeeCount.textContent = String(activeEmployeeList().length);
    elements.navTrainingCount.textContent = String(state.trainings.length);
    elements.navMeetingCount.textContent = String(state.meetings.length);
    elements.navAppointmentCount.textContent = String(
      state.appointments.filter((appointment) => appointment.date >= todayIso()).length,
    );
    elements.navMemoCount.textContent = String(
      visibleMemos().filter((memo) => !memo.completed).length,
    );
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    updateUsernameExportButton();
    updateSidebarCollapsedLabels();
    for (const view of Object.keys(VIEW_RENDERERS)) {
      if (view !== activeView) staleViews.add(view);
    }
    renderView(activeView);
    renderBackupStatus();
    renderAutomaticBackupStatus();
    renderDatabaseSaveWarning();
    refreshFormattedDateInputs();
    void renderBrowserStorageStatus();
    scheduleAutomaticBackup();
    applyAccessControl();
    renderSidebarSystemStatus();
  }

  // Das Farbthema gehoert zum Benutzerkonto, nicht zum Datenbestand: Wer sich
  // anmeldet, bringt seine eigene Auswahl mit. state.settings.theme bleibt die
  // gemeinsame Vorgabe - sie gilt vor der Anmeldung und fuer Konten, die noch
  // nie ein eigenes Thema gewaehlt haben.
  function activeThemeKey() {
    return normalizeTheme(currentUser?.theme || state.settings.theme);
  }

  async function changeTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    if (!currentUser) {
      // Ohne Anmeldung gibt es kein Konto, das die Wahl aufbewahren koennte.
      applyTheme(nextTheme);
      showToast(
        "Das Farbthema gilt vorerst nur für diese Sitzung. Nach der Anmeldung wird es für das Benutzerkonto gespeichert.",
      );
      return;
    }
    if (nextTheme === activeThemeKey()) {
      applyTheme(nextTheme);
      return;
    }

    const committed = await commitStateMutation(
      () => {
        const account = state.users.find((user) => user.id === currentUser.id);
        if (account) account.theme = nextTheme;
        currentUser.theme = nextTheme;
      },
      // Eine Anzeigeeinstellung eines einzelnen Kontos ist keine fachliche
      // Aenderung und hat im Änderungsprotokoll nichts verloren.
      { auditAction: "" },
    );
    if (committed) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    applyTheme(activeThemeKey());
    if (committed) {
      showToast(
        `Farbthema „${THEMES[nextTheme]}“ wurde für „${currentUser.username}“ gespeichert.`,
      );
    }
  }

  function applyTheme(theme) {
    const activeTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = DARK_THEMES.has(activeTheme)
      ? "dark"
      : "light";
    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.value = activeTheme;
    });
    elements.mobileThemeButton.setAttribute(
      "aria-label",
      `Farbthema wechseln. Aktuell: ${THEMES[activeTheme]}`,
    );
    elements.mobileThemeButton.title = `Farbthema: ${THEMES[activeTheme]}`;
  }

  function restoreAuthenticationSession() {
    if (!isMariaDbMode() && state.users.length === 0) {
      showSetupDialog();
      return;
    }
    const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
    const user = state.users.find((item) => item.id === sessionUserId);
    if (user && automaticBackupSettings?.encrypted) {
      sessionStorage.removeItem(SESSION_USER_KEY);
      showLoginDialog();
      elements.loginError.textContent =
        "Bitte erneut anmelden, damit TeO den Sicherungsschlüssel entsperren kann.";
      return;
    }
    if (!user) {
      showLoginDialog();
      if (isMariaDbMode() && backendStartupError) {
        elements.loginError.textContent = backendStartupError;
      }
      return;
    }
    completeLogin(user);
  }

  function showSetupDialog() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.setupForm.reset();
    elements.setupError.textContent = "";
    if (!elements.setupDialog.open) elements.setupDialog.showModal();
    window.setTimeout(() => document.querySelector("#setupUsername").focus(), 0);
  }

  async function handleSetupSubmit(event) {
    event.preventDefault();
    if (isMariaDbMode() || state.users.length > 0) {
      elements.setupError.textContent =
        "Die Ersteinrichtung ist für diesen Datenbestand bereits abgeschlossen.";
      return;
    }

    const username = document.querySelector("#setupUsername").value.trim();
    const password = document.querySelector("#setupPassword").value;
    const confirmation = document.querySelector("#setupPasswordConfirmation").value;
    elements.setupError.textContent =
      /^[A-Za-z0-9]{4,40}$/.test(username)
        ? validateNewPassword(password, confirmation)
        : "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.";
    if (elements.setupError.textContent) return;

    let credentials;
    try {
      credentials = await createPasswordCredentials(password);
    } catch (error) {
      console.error("Administratorkonto konnte nicht erstellt werden.", error);
      elements.setupError.textContent =
        "Die sichere Passworterstellung ist in diesem Browser nicht verfügbar.";
      return;
    }

    const admin = {
      id: createId(),
      username,
      role: "admin",
      ...credentials,
      mustChangePassword: false,
    };
    state.users = [admin];
    currentUser = admin;
    appendAuditEntry("Ersteinrichtung abgeschlossen und Administratorkonto angelegt");
    if (!(await persistState())) {
      state.users = [];
      currentUser = null;
      elements.setupError.textContent =
        "Die Ersteinrichtung konnte nicht gespeichert werden.";
      return;
    }
    databaseSaveReminderArmed = true;
    elements.setupDialog.close();
    completeLogin(admin, { requestStartupBackupPermission: true });
    showToast("TeO wurde eingerichtet.");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    elements.loginError.textContent = "";
    const username = document.querySelector("#loginUsername").value.trim();
    const password = document.querySelector("#loginPassword").value;

    if (isMariaDbMode()) {
      try {
        const result = await window.TeOBackend.login(
          backendConfig.apiUrl,
          username,
          password,
        );
        state = normalizeState(result.state);
        databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
        remoteRevision = Number(result.revision) || 0;
        backendStartupError = "";
        markBackendConnected({ synchronized: true });
        window.TeOBackend.writeToken(result.token);
        const remoteUser = state.users.find(
          (item) => item.id === result.user?.id,
        );
        if (!remoteUser) {
          throw new Error("Das angemeldete Benutzerkonto fehlt im Serverdatenbestand.");
        }
        await unlockAutomaticBackupForLogin(remoteUser, password);
        completeLogin(remoteUser);
      } catch (error) {
        console.error("Serveranmeldung fehlgeschlagen.", error);
        if (error.status) markBackendConnected();
        else markBackendConnectionError(error);
        elements.loginError.textContent =
          error.message || "Die Anmeldung am TeO-Server ist fehlgeschlagen.";
        document.querySelector("#loginPassword").value = "";
      }
      return;
    }

    const user = state.users.find(
      (item) => item.username.toLocaleLowerCase("de-DE") === username.toLocaleLowerCase("de-DE"),
    );

    let passwordMatches;
    try {
      passwordMatches = user ? await verifyPassword(password, user) : false;
    } catch (error) {
      console.error("Passwortprüfung nicht verfügbar.", error);
      elements.loginError.textContent =
        "Die sichere Passwortprüfung ist in diesem Browser nicht verfügbar.";
      return;
    }

    if (!user || !passwordMatches) {
      elements.loginError.textContent = "Benutzername oder Passwort ist nicht korrekt.";
      document.querySelector("#loginPassword").value = "";
      return;
    }

    try {
      await unlockAutomaticBackupForLogin(user, password);
    } catch (error) {
      console.warn("Der automatische Sicherungsschlüssel konnte nicht entsperrt werden.", error);
      automaticBackupNotice =
        "Sicherungsschlüssel nicht entsperrt – erneut anmelden oder Wiederherstellungsschlüssel verwenden.";
    }
    completeLogin(user, { requestStartupBackupPermission: true });
  }

  function completeLogin(
    user,
    { requestStartupBackupPermission = false } = {},
  ) {
    currentUser = user;
    sessionStorage.setItem(SESSION_USER_KEY, user.id);
    // Jede Anmeldung bringt das Farbthema des Kontos mit.
    applyTheme(activeThemeKey());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    if (elements.loginDialog.open) elements.loginDialog.close();
    renderAll();

    if (user.mustChangePassword) {
      document.body.classList.add("is-auth-locked");
      elements.changePasswordForm.reset();
      elements.changePasswordError.textContent = "";
      if (!elements.changePasswordDialog.open) elements.changePasswordDialog.showModal();
      window.setTimeout(() => document.querySelector("#newPassword").focus(), 0);
      return;
    }

    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({
        requestPermission: requestStartupBackupPermission,
      });
      return;
    }

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
    scheduleAutomaticBackup();
    // Erst jetzt: Vor der Anmeldung steht die Anwendung noch hinter der
    // Sperre, und ein Hinweis darueber waere im Weg.
    showWhatsNewIfUpdated();
  }

  function showLoginDialog() {
    currentUser = null;
    // Ohne angemeldetes Konto gilt wieder die gemeinsame Vorgabe.
    applyTheme(activeThemeKey());
    clearAutomaticBackupTimer();
    automaticBackupPassword = "";
    startupBackupSynchronized = false;
    startupBackupImportRunning = false;
    backupReminderShown = false;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    applyAccessControl();
    if (!elements.loginDialog.open) elements.loginDialog.showModal();
    window.setTimeout(() => document.querySelector("#loginUsername").focus(), 0);
  }

  function showStartupBackupDialog(status = "") {
    document.body.classList.add("is-auth-locked");
    elements.startupBackupFile.value = "";
    elements.startupBackupStatus.textContent = status;
    elements.selectStartupBackupFileButton.disabled = false;
    if (!elements.startupBackupDialog.open) {
      elements.startupBackupDialog.showModal();
    }
    window.setTimeout(() => elements.selectStartupBackupFileButton.focus(), 0);
  }

  function logout() {
    if (isMariaDbMode()) {
      void window.TeOBackend.logout(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      window.TeOBackend.writeToken("");
    }
    showLoginDialog();
  }

  async function handlePasswordChangeSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
      showLoginDialog();
      return;
    }

    const password = document.querySelector("#newPassword").value;
    const confirmation = document.querySelector("#confirmNewPassword").value;
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      elements.changePasswordError.textContent = validationError;
      return;
    }
    if (await verifyPassword(password, currentUser)) {
      elements.changePasswordError.textContent =
        "Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.";
      return;
    }

    const credentials = await createPasswordCredentials(password);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, ...credentials, mustChangePassword: false }
          : user,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(currentUser.id, password);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte nicht auf das neue Passwort umgestellt werden.", error);
      showToast(
        "Passwort geändert; der automatische Sicherungsschlüssel konnte jedoch nicht aktualisiert werden.",
        "error",
      );
    }
    currentUser = state.users.find((user) => user.id === currentUser.id);
    elements.changePasswordDialog.close();
    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({ requestPermission: true });
    } else {
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
    }
    showToast("Das neue Passwort wurde gespeichert.");
  }

  function validateNewPassword(password, confirmation) {
    if (password !== confirmation) return "Die eingegebenen Passwörter stimmen nicht überein.";
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    if (!/[A-ZÄÖÜ]/.test(password) || !/[a-zäöüß]/.test(password) || !/\d/.test(password)) {
      return "Das Passwort benötigt Groß- und Kleinbuchstaben sowie mindestens eine Zahl.";
    }
    return "";
  }

  async function verifyPassword(password, user) {
    const derivedHash = await derivePasswordHash(
      password,
      user.passwordSalt,
      PASSWORD_ITERATIONS,
    );
    return constantTimeEqual(derivedHash, user.passwordHash);
  }

  async function createPasswordCredentials(password) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const passwordSalt = bytesToBase64(saltBytes);
    return {
      passwordSalt,
      passwordHash: await derivePasswordHash(password, passwordSalt, PASSWORD_ITERATIONS),
    };
  }

  async function derivePasswordHash(password, saltBase64, iterations) {
    if (!crypto.subtle) throw new Error("Web Crypto API nicht verfügbar");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64ToBytes(saltBase64),
        iterations,
      },
      key,
      256,
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function constantTimeEqual(valueA, valueB) {
    if (valueA.length !== valueB.length) return false;
    let difference = 0;
    for (let index = 0; index < valueA.length; index += 1) {
      difference |= valueA.charCodeAt(index) ^ valueB.charCodeAt(index);
    }
    return difference === 0;
  }

  function isAdmin() {
    return currentUser?.role === "admin";
  }

  function requireAdmin() {
    if (isAdmin()) return true;
    showToast("Diese Aktion ist nur für Administratoren verfügbar.", "error");
    return false;
  }

  function applyAccessControl() {
    const admin = isAdmin();
    // Die Rolle am body genuegt: Das Stylesheet blendet die als Verwaltung
    // markierten Elemente aus, solange sie nicht „admin“ lautet. Die Schleife
    // davor lief bei jedem Aufbau einer Ansicht ueber das gesamte Dokument
    // und setzte dabei nur, was die Regel schon entschieden hatte.
    document.body.dataset.userRole = currentUser?.role || "guest";
    elements.currentUsername.textContent = currentUser?.username || "Nicht angemeldet";
    elements.currentUserRole.textContent = currentUser
      ? admin
        ? "Administrator"
        : "Normaler Benutzer"
      : "–";
    elements.mobileAccountButton.title = currentUser
      ? `Benutzerkonto: ${currentUser.username}`
      : "Benutzerkonto";
    updateSidebarFooterSummaries();
    renderDatabaseSaveWarning();
  }

  function openAccountDialog() {
    if (!currentUser) {
      showLoginDialog();
      return;
    }
    elements.accountDialogTitle.textContent = currentUser.username;
    elements.accountDialogRole.textContent = isAdmin()
      ? "Administrator"
      : "Normaler Benutzer";
    applyAccessControl();
    elements.accountDialog.showModal();
  }

  function openUserManagementDialog() {
    if (!requireAdmin()) return;
    if (elements.accountDialog.open) elements.accountDialog.close();
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    elements.createUserForm.reset();
    renderUserManagement();
    elements.userManagementDialog.showModal();
  }

  // Das eigene Konto bleibt ausgenommen, damit sich niemand mitten in der
  // Sitzung selbst aussperrt. Der letzte Administrator bleibt bestehen, weil
  // ein Datenbestand ohne Administrator nicht mehr verwaltbar wäre.
  function userDeletionBlocker(user) {
    if (user.id === currentUser?.id) return "Das eigene Konto kann nicht gelöscht werden.";
    if (
      user.role === "admin" &&
      state.users.filter((item) => item.role === "admin").length <= 1
    ) {
      return "Der letzte Administrator kann nicht gelöscht werden.";
    }
    return "";
  }

  function isUsernameTaken(username, exceptId = "") {
    const normalized = username.toLocaleLowerCase("de-DE");
    return state.users.some(
      (item) =>
        item.id !== exceptId &&
        item.username.toLocaleLowerCase("de-DE") === normalized,
    );
  }

  function renderUserManagement() {
    elements.userManagementList.innerHTML = state.users
      .map((user) => {
        const isSelf = user.id === currentUser?.id;
        const deletionBlocker = userDeletionBlocker(user);
        return `
          <article class="user-management-row">
            <span class="user-management-avatar">${escapeHtml(
              user.username.slice(0, 2).toUpperCase(),
            )}</span>
            <label class="user-management-username">
              <span>Benutzername</span>
              <input
                type="text"
                value="${escapeHtml(user.username)}"
                maxlength="40"
                pattern="[A-Za-z0-9]{4,40}"
                autocomplete="off"
                spellcheck="false"
                data-user-username="${user.id}"
                aria-label="Benutzername für ${escapeHtml(user.username)}"
              />
              <small>${user.role === "admin" ? "Administrator" : "Normaler Benutzer"}${
                isSelf ? " · eigenes Konto" : ""
              }${
                user.mustChangePassword ? " · Passwortänderung erforderlich" : ""
              }</small>
            </label>
            <div class="user-management-actions">
              <button
                class="button button-secondary"
                type="button"
                data-save-user-username="${user.id}"
              >
                <svg><use href="#icon-check"></use></svg>
                Benutzername speichern
              </button>
              ${
                isSelf
                  ? ""
                  : `<button
                    class="button button-secondary"
                    type="button"
                    data-reset-user-password="${user.id}"
                  >Passwort zurücksetzen</button>`
              }
              ${
                deletionBlocker
                  ? `<span class="tag tag-muted" title="${escapeHtml(
                      deletionBlocker,
                    )}">Nicht löschbar</span>`
                  : `<button
                    class="button button-danger"
                    type="button"
                    data-delete-user="${user.id}"
                    aria-label="Konto ${escapeHtml(user.username)} löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                    Löschen
                  </button>`
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function handleCreateUserSubmit(event) {
    event.preventDefault();
    if (!requireAdmin()) return;

    const username = elements.newUserUsername.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      elements.newUserUsername.focus();
      return;
    }
    if (isUsernameTaken(username)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      elements.newUserUsername.focus();
      return;
    }

    const role = elements.newUserRole.value === "admin" ? "admin" : "user";
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const newUser = {
      id: `user-${createId()}`,
      username,
      role,
      ...credentials,
      mustChangePassword: true,
    };

    const committed = await commitStateMutation(() => {
      state.users = [...state.users, newUser];
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(newUser.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das neue Konto nicht hinterlegt werden.", error);
    }
    elements.createUserForm.reset();
    renderUserManagement();
    showTemporaryPassword(username, temporaryPassword);
    showToast(
      `Konto „${username}“ wurde als ${
        role === "admin" ? "Administrator" : "normaler Benutzer"
      } angelegt.`,
    );
  }

  function requestDeleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const blocker = userDeletionBlocker(user);
    if (blocker) {
      showToast(blocker, "error");
      return;
    }
    requestConfirmation({
      title: "Benutzerkonto löschen?",
      message: `Das Konto „${user.username}“ wird dauerhaft entfernt und kann sich danach nicht mehr anmelden. Eine noch offene Serversitzung dieses Kontos endet beim nächsten Serverkontakt. Der fachliche Datenbestand bleibt unverändert.`,
      acceptLabel: "Konto löschen",
      tone: "danger",
      callback: () => deleteUser(user.id),
    });
  }

  async function deleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user || userDeletionBlocker(user)) return;

    const committed = await commitStateMutation(() => {
      state.users = state.users.filter((item) => item.id !== user.id);
    });
    if (!committed) return;

    try {
      await removeAutomaticBackupUserKey(user.id);
    } catch (error) {
      console.warn("Die alte Sicherungsschlüssel-Hülle konnte nicht entfernt werden.", error);
    }
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    renderUserManagement();
    showToast(`Konto „${user.username}“ wurde gelöscht.`);
  }

  function showTemporaryPassword(username, password) {
    elements.temporaryPasswordUsername.textContent = username;
    elements.temporaryPasswordValue.value = password;
    elements.temporaryPasswordResult.hidden = false;
    elements.temporaryPasswordValue.focus();
    elements.temporaryPasswordValue.select();
  }

  async function saveUsername(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    const input = [
      ...elements.userManagementList.querySelectorAll(
        "[data-user-username]",
      ),
    ].find(
      (field) => field.dataset.userUsername === userId,
    );
    if (!user || !input) return;

    const username = input.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      input.focus();
      return;
    }
    if (isUsernameTaken(username, user.id)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      input.focus();
      return;
    }
    if (username === user.username) {
      showToast("Der Benutzername ist bereits aktuell.");
      return;
    }

    const previousUsername = user.username;
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id ? { ...item, username } : item,
      );
    });
    if (!committed) return;

    if (currentUser?.id === user.id) {
      currentUser = state.users.find((item) => item.id === user.id);
      renderAll();
    }
    renderUserManagement();
    showToast(
      `Benutzername „${previousUsername}“ wurde in „${username}“ geändert.`,
    );
  }

  // Das eigene Passwort wird über den Kontodialog geändert, nicht hier
  // zurückgesetzt – sonst wäre die eigene Sitzung sofort änderungspflichtig.
  function resettableUser(userId) {
    return state.users.find(
      (item) => item.id === userId && item.id !== currentUser?.id,
    );
  }

  function requestPasswordReset(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    requestConfirmation({
      title: "Passwort zurücksetzen?",
      message: `Für ${user.username} wird ein zufälliges temporäres Passwort erzeugt. Beim nächsten Login muss ein neues Passwort festgelegt werden.`,
      acceptLabel: "Passwort zurücksetzen",
      tone: "primary",
      callback: () => resetUserPassword(user.id),
    });
  }

  async function resetUserPassword(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id
          ? { ...item, ...credentials, mustChangePassword: true }
          : item,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(user.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das zurückgesetzte Passwort nicht hinterlegt werden.", error);
    }
    renderUserManagement();
    showTemporaryPassword(user.username, temporaryPassword);
    showToast(`Passwort für ${user.username} wurde zurückgesetzt.`);
  }

  function createTemporaryPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const required = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
    ].map((characters) => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return characters[value % characters.length];
    });
    const random = Array.from({ length: 9 }, () => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return alphabet[value % alphabet.length];
    });
    return [...required, ...random]
      .map((character) => ({ character, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
      .sort((a, b) => a.order - b.order)
      .map((item) => item.character)
      .join("");
  }

  function openCatalogManagementDialog() {
    elements.newProfession.value = "";
    elements.newQualification.value = "";
    renderCatalogManagement();
    elements.catalogManagementDialog.showModal();
  }

  function renderCatalogManagement() {
    elements.professionCatalogList.innerHTML = state.catalogs.professions
      .map(
        (profession, index) => `
          <div class="catalog-row" data-profession-index="${index}">
            <input type="text" maxlength="100" value="${escapeHtml(
              profession,
            )}" aria-label="Beruf ${escapeHtml(profession)} bearbeiten" />
            <button class="icon-button" type="button" data-catalog-action="save-profession"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-profession"
              aria-label="${escapeHtml(profession)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        `,
      )
      .join("");
    elements.qualificationCatalogList.innerHTML = state.catalogs.qualifications
      .map(
        (qualification) => {
          const systemQualification =
            LEADERSHIP_QUALIFICATION_IDS.includes(qualification.id);
          return `
          <div class="catalog-row" data-qualification-id="${qualification.id}">
            <input type="text" maxlength="100" value="${escapeHtml(
              qualification.label,
            )}" aria-label="Zusatzqualifikation ${escapeHtml(
              qualification.label,
            )} bearbeiten" ${systemQualification ? "readonly" : ""} />
            ${
              systemQualification
                ? '<span class="field-hint catalog-system-role">Systemrolle</span>'
                : `<button class="icon-button" type="button"
              data-catalog-action="save-qualification"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-qualification"
              aria-label="${escapeHtml(qualification.label)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>`
            }
          </div>
        `;
        },
      )
      .join("");
  }

  async function addProfession() {
    const profession = normalizeProfession(elements.newProfession.value);
    if (!profession) {
      showToast("Bitte eine Berufsbezeichnung eingeben.", "error");
      return;
    }
    if (catalogIncludesLabel(state.catalogs.professions, profession)) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.catalogs.professions.push(profession);
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
    });
    if (!committed) return;
    elements.newProfession.value = "";
    renderCatalogManagement();
    showToast("Beruf wurde hinzugefügt.");
  }

  async function addQualification() {
    const label = elements.newQualification.value.trim();
    if (!label) {
      showToast("Bitte eine Bezeichnung für die Zusatzqualifikation eingeben.", "error");
      return;
    }
    if (
      catalogIncludesLabel(
        state.catalogs.qualifications.map((qualification) => qualification.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }

    const qualification = { id: `qualification-${createId()}`, label };
    const committed = await commitStateMutation(() => {
      state.catalogs.qualifications.push(qualification);
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
      state.employees.forEach((employee) => {
        employee.qualifications[qualification.id] = false;
      });
    });
    if (!committed) return;
    elements.newQualification.value = "";
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde hinzugefügt.");
  }

  function handleProfessionCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-profession-index]");
    if (!button || !row) return;
    const index = Number(row.dataset.professionIndex);
    if (button.dataset.catalogAction === "save-profession") {
      saveProfession(index, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-profession") deleteProfession(index);
  }

  function handleQualificationCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-qualification-id]");
    if (!button || !row) return;
    if (button.dataset.catalogAction === "save-qualification") {
      saveQualification(row.dataset.qualificationId, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-qualification") {
      deleteQualification(row.dataset.qualificationId);
    }
  }

  async function saveProfession(index, nextValue) {
    const previousValue = state.catalogs.professions[index];
    const profession = normalizeProfession(nextValue);
    if (!previousValue || !profession) {
      showToast("Die Berufsbezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      profession.toLocaleLowerCase("de-DE") !==
        previousValue.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(state.catalogs.professions, profession)
    ) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.catalogs.professions[index] = profession;
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
      state.employees.forEach((employee) => {
        if (employee.profession === previousValue) {
          employee.profession = profession;
          employee.updatedAt = now;
        }
      });
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Berufsbezeichnung wurde aktualisiert.");
  }

  function deleteProfession(index) {
    const profession = state.catalogs.professions[index];
    if (!profession) return;
    const assignmentCount = state.employees.filter(
      (employee) => employee.profession === profession,
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Der Beruf ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Beruf löschen?",
      message: `„${profession}“ wird aus dem Berufskatalog entfernt.`,
      acceptLabel: "Beruf löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.professions.splice(index, 1);
        }, { undo: "Beruf gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Beruf wurde gelöscht.");
      },
    });
  }

  async function saveQualification(id, nextValue) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    const label = String(nextValue || "").trim();
    if (
      LEADERSHIP_QUALIFICATION_IDS.includes(id) &&
      label !== DEFAULT_QUALIFICATIONS[id]
    ) {
      showToast(
        "Die Leitungsfunktionen sind feste Systemqualifikationen und können nicht umbenannt werden.",
        "error",
      );
      renderCatalogManagement();
      return;
    }
    if (!qualification || !label) {
      showToast("Die Bezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      label.toLocaleLowerCase("de-DE") !==
        qualification.label.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(
        state.catalogs.qualifications.map((item) => item.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }
    const committed = await commitStateMutation(() => {
      qualification.label = label;
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde aktualisiert.");
  }

  function deleteQualification(id) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    if (!qualification) return;
    if (LEADERSHIP_QUALIFICATION_IDS.includes(id)) {
      showToast(
        "Die Leitungsfunktionen werden für die Dienstwochenendzuweisung benötigt und können nicht gelöscht werden.",
        "error",
      );
      return;
    }
    const assignmentCount = state.employees.filter(
      (employee) => employee.qualifications[id],
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Die Zusatzqualifikation ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Zusatzqualifikation löschen?",
      message: `„${qualification.label}“ wird aus dem Katalog entfernt.`,
      acceptLabel: "Qualifikation löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.qualifications = state.catalogs.qualifications.filter(
            (item) => item.id !== id,
          );
          state.employees.forEach((employee) => {
            delete employee.qualifications[id];
            delete employee.qualificationExpiries[id];
          });
        }, { undo: "Zusatzqualifikation gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Zusatzqualifikation wurde gelöscht.");
      },
    });
  }

  function catalogIncludesLabel(values, candidate) {
    const normalizedCandidate = candidate.toLocaleLowerCase("de-DE");
    return values.some(
      (value) => value.toLocaleLowerCase("de-DE") === normalizedCandidate,
    );
  }

  function renderDashboardGreeting(now = new Date()) {
    const hour = now.getHours();
    const salutation =
      hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
    const firstName = getCurrentUserFirstName();
    elements.dashboardGreeting.textContent = firstName
      ? `${salutation}, ${firstName}!`
      : `${salutation}!`;
  }

  function getCurrentUserFirstName() {
    if (!currentUser?.username) return "";
    const usernameKey = currentUser.username.toLocaleLowerCase("de-DE");
    const linkedEmployee = state.employees.find(
      (employee) =>
        employee.username?.toLocaleLowerCase("de-DE") === usernameKey,
    );
    if (linkedEmployee?.firstName?.trim()) return linkedEmployee.firstName.trim();

    const employeeCode = usernameKey.replace(/\d+$/, "");
    const matchingEmployee = state.employees.find((employee) =>
      normalizeCompactLookupValue(employee.lastName).startsWith(employeeCode),
    );
    return (
      matchingEmployee?.firstName?.trim() ||
      USER_FIRST_NAME_FALLBACKS[usernameKey] ||
      currentUser.username
    );
  }

  function normalizeCompactLookupValue(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "");
  }

  function projectBuildNumber() {
    return [PROJECT_VERSION.major, PROJECT_VERSION.minor, PROJECT_VERSION.patch]
      .map((part) => String(part || 0))
      .join(".");
  }

  function renderProjectMetadata() {
    const buildNumber = projectBuildNumber();
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${buildNumber}`;
    elements.loginProjectVersion.textContent = `Version ${buildNumber}`;
  }

  function renderSidebarSystemStatus() {
    if (!elements.sidebarSystemStatus) return;
    const localMode = !isMariaDbMode();
    const status = localMode ? "local" : backendConnectionStatus;
    const rows = [...elements.sidebarSystemStatus.querySelectorAll("dl > div")];
    const terms = rows.map((row) => row.querySelector("dt"));
    const remoteTerms = ["Backend", "Server", "Revision", "DB-Schema"];
    terms.forEach((term, index) => {
      if (term) term.textContent = remoteTerms[index];
      if (rows[index]) rows[index].hidden = false;
    });
    elements.sidebarSystemStatus.classList.toggle("is-local", status === "local");
    elements.sidebarSystemStatus.classList.toggle(
      "is-connected",
      status === "connected",
    );
    elements.sidebarSystemStatus.classList.toggle("is-error", status === "error");

    if (localMode) {
      elements.sidebarConnectionLabel.textContent = "Lokal bereit";
      if (terms[0]) terms[0].textContent = "Speicherort";
      if (terms[1]) terms[1].textContent = "Zuletzt gespeichert";
      rows.slice(2).forEach((row) => {
        row.hidden = true;
      });
      elements.sidebarBackendLabel.textContent = "Dieses Browserprofil";
      elements.sidebarServerLabel.textContent = localLastSaveAt
        ? formatSidebarStatusDateTime(localLastSaveAt)
        : "Noch nicht erfasst";
      elements.sidebarSyncLabel.textContent =
        "Automatische lokale Speicherung aktiv";
      elements.sidebarServerLabel.title = "";
      elements.sidebarSyncLabel.title = "";
      updateSidebarFooterSummaries();
      return;
    }

    const statusLabels = {
      checking: "Verbindung wird geprüft",
      connected: "MariaDB verbunden",
      warning: "Backend prüfen",
      error: "Server nicht erreichbar",
    };
    elements.sidebarConnectionLabel.textContent =
      statusLabels[status] || "MariaDB konfiguriert";
    elements.sidebarBackendLabel.textContent =
      backendHealth?.storageModel === "relational"
        ? "MariaDB · relational"
        : "MariaDB";
    const serverLabel = backendServerLabel();
    elements.sidebarServerLabel.textContent = serverLabel;
    elements.sidebarServerLabel.title = backendConfig.apiUrl || serverLabel;
    elements.sidebarRevisionLabel.textContent =
      remoteRevision || backendHealth?.revision
        ? String(remoteRevision || backendHealth.revision)
        : "–";
    elements.sidebarSchemaLabel.textContent =
      backendHealth?.databaseSchemaVersion == null
        ? "–"
        : String(backendHealth.databaseSchemaVersion);

    let detail = "Noch kein Serverkontakt";
    if (status === "checking") detail = "Serverstatus wird abgerufen …";
    else if (status === "error") {
      detail = backendConnectionError || "Verbindung fehlgeschlagen";
    } else if (backendLastSyncAt) {
      detail = `Letzter Abgleich ${formatSidebarStatusTime(backendLastSyncAt)}`;
    } else if (backendLastContactAt) {
      detail = `Server geprüft ${formatSidebarStatusTime(backendLastContactAt)}`;
    }
    elements.sidebarSyncLabel.textContent = detail;
    elements.sidebarSyncLabel.title = detail;
    // Eingeklappt bleibt vom Block nur der Punkt - der Kurzhinweis muss den
    // neuen Stand mittragen, auch wenn sonst nichts neu aufgebaut wurde.
    updateSidebarFooterSummaries();
  }

  function backendServerLabel() {
    try {
      return new URL(backendConfig.apiUrl).host;
    } catch {
      return backendConfig.apiUrl || "nicht konfiguriert";
    }
  }

  function formatSidebarStatusTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatSidebarStatusDateTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function markBackendConnected({ health = null, synchronized = false } = {}) {
    if (health) backendHealth = health;
    backendConnectionStatus =
      backendHealth &&
      (backendHealth.storageModel !== "relational" ||
        !Number.isSafeInteger(Number(backendHealth.databaseSchemaVersion)))
        ? "warning"
        : "connected";
    backendConnectionError = "";
    backendLastContactAt = new Date().toISOString();
    if (synchronized) backendLastSyncAt = backendLastContactAt;
    renderSidebarSystemStatus();
  }

  function markBackendConnectionError(error) {
    backendConnectionStatus = "error";
    backendConnectionError =
      error?.message || "Der TeO-Server ist nicht erreichbar.";
    renderSidebarSystemStatus();
  }

  async function refreshBackendHealth() {
    if (!isMariaDbMode()) {
      backendConnectionStatus = "local";
      renderSidebarSystemStatus();
      return;
    }
    backendConnectionStatus = "checking";
    renderSidebarSystemStatus();
    try {
      const health = await window.TeOBackend.health(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      markBackendConnected({ health });
    } catch (error) {
      markBackendConnectionError(error);
    }
  }
