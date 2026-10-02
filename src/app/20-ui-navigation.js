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
      () => void runAutomaticBackupOnDemand(),
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
    elements.selectStartupBackupDirectoryButton.addEventListener(
      "click",
      () => void selectStartupBackupDirectory(),
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
    elements.carryOverVacationButton.addEventListener(
      "click",
      requestVacationCarryOver,
    );
    elements.vacationCrosshairToggle.addEventListener("change", () => {
      vacationCrosshairEnabled = elements.vacationCrosshairToggle.checked;
      saveVacationViewPreference();
      if (!vacationCrosshairEnabled) setVacationCrosshair(null);
    });
    elements.vacationSortMode.addEventListener("change", () => {
      vacationSortMode = Object.hasOwn(
        VACATION_SORT_MODES,
        elements.vacationSortMode.value,
      )
        ? elements.vacationSortMode.value
        : "name";
      saveVacationViewPreference();
      // Die Zeilen tauschen die Plaetze; ein gemerktes Feld zeigte sonst
      // auf einen anderen Mitarbeiter.
      vacationSelectionAnchor = null;
      renderVacationPlanner();
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
    elements.vacationSortOrderList.addEventListener(
      "click",
      handleVacationSortOrderClick,
    );
    elements.resetVacationSortOrderButton.addEventListener(
      "click",
      resetVacationSortOrder,
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
