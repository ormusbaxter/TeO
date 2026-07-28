  function bindNavigation() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    document.querySelectorAll("[data-go-to]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.goTo));
    });

    document.querySelectorAll("[data-help-target]").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .getElementById(button.dataset.helpTarget)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_VIEWS[hash]) showView(HASH_VIEWS[hash], false);
    });
  }

  function showView(view, updateHash = true) {
    if (!VIEW_HASHES[view]) view = "dashboard";

    document.body.classList.toggle("is-vacation-view", view === "vacations");
    if (view === "dashboard") renderDashboardGreeting();
    elements.mobileCreateButton.hidden = ["settings", "help"].includes(view);

    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
    });

    // Erst jetzt ist das Dashboard vermessbar.
    if (view === "dashboard") limitDeadlineListHeight();

    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const mobileCreateType =
      view === "trainings"
        ? "training"
        : view === "meetings"
          ? "meeting"
          : view === "appointments"
            ? "appointment"
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
  }

  function bindDialogTriggers() {
    elements.mobileCreateButton.addEventListener("click", () => {
      if (elements.mobileCreateButton.dataset.createType === "training") {
        openTrainingDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "meeting") {
        openMeetingDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "appointment") {
        openAppointmentDialog();
      } else if (
        elements.mobileCreateButton.dataset.createType === "device-instruction"
      ) {
        openDeviceInstructionDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "device") {
        openDeviceDialog();
      } else {
        openEmployeeDialog();
      }
    });

    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.addEventListener("change", () => changeTheme(select.value));
    });
    elements.mobileThemeButton.addEventListener("click", () => {
      const themes = Object.keys(THEMES);
      const currentIndex = themes.indexOf(state.settings.theme);
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
    elements.exportDataButton.addEventListener("click", exportDatabase);
    elements.databaseSaveWarningExportButton.addEventListener(
      "click",
      exportDatabase,
    );
    elements.exportEncryptedDataButton.addEventListener("click", exportEncryptedDatabase);
    elements.requestPersistentStorageButton.addEventListener(
      "click",
      requestPersistentBrowserStorage,
    );
    elements.importDataButton.addEventListener("click", () => elements.importDataFile.click());
    elements.importDataFile.addEventListener("change", handleBackupFileSelection);
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
      renderVacationPlanner();
    });
    elements.vacationMonth.addEventListener("change", () => {
      vacationMonth = Number(elements.vacationMonth.value);
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
    elements.employeeForm.addEventListener("submit", handleEmployeeSubmit);
    elements.trainingForm.addEventListener("submit", handleTrainingSubmit);
    elements.completionForm.addEventListener("submit", handleCompletionSubmit);
    elements.meetingForm.addEventListener("submit", handleMeetingSubmit);
    elements.appointmentForm.addEventListener("submit", handleAppointmentSubmit);
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
      employeeSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
      renderEmployees();
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
      completionSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
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
      attendanceSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
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
    elements.deviceInventoryFilter.addEventListener("change", (event) => {
      deviceInventoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceCategoryFilter.addEventListener("change", (event) => {
      deviceCategoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceSearch.addEventListener("input", (event) => {
      deviceSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceInstructionMatrix();
    });
    elements.deviceManagementSearch.addEventListener("input", (event) => {
      deviceManagementSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDevices();
    });
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
    elements.deviceEmployeeStatusFilter.addEventListener("change", (event) => {
      deviceEmployeeStatusFilter = event.target.value;
      renderDeviceInstructionMatrix();
    });
    elements.deviceEmployeeSearch.addEventListener("input", (event) => {
      deviceEmployeeSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceInstructionMatrix();
    });
    elements.deviceParticipantSearch.addEventListener("input", (event) => {
      deviceParticipantSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceParticipantList();
    });
    elements.deviceParticipantList.addEventListener("change", (event) => {
      handleDeviceParticipantChange(event);
    });
    elements.toggleAllDeviceParticipants.addEventListener("click", () => {
      toggleVisibleDeviceParticipants();
    });
  }

  function filterHelpTopics() {
    const query = normalizeHelpSearch(elements.helpSearch.value);
    const sections = [...document.querySelectorAll("[data-help-section]")];
    let visibleCount = 0;
    sections.forEach((section) => {
      const matches =
        !query || normalizeHelpSearch(section.textContent).includes(query);
      section.hidden = !matches;
      if (matches) visibleCount += 1;
      const headingId = section.dataset.helpHeading;
      document
        .querySelector(`[data-help-nav-target="${headingId}"]`)
        ?.toggleAttribute("hidden", !matches);
    });
    elements.helpSearchStatus.textContent = query
      ? `${visibleCount} von ${sections.length} Themen gefunden`
      : `${sections.length} Hilfethemen`;
    elements.clearHelpSearch.hidden = !query;
    elements.helpNoResults.hidden = visibleCount > 0;
  }

  function normalizeHelpSearch(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/\s+/g, " ")
      .trim();
  }

  function bindDelegatedActions() {
    elements.employeeTable.addEventListener("click", handleEmployeeTableAction);
    elements.employeeTable.addEventListener("change", handleEmployeeTableSelection);
    elements.vacationPlanner.addEventListener("click", handleVacationPlannerClick);
    elements.vacationPlanner.addEventListener("change", handleVacationPlannerChange);
    elements.recentEmployees.addEventListener("click", handleRecentEmployeeAction);
    elements.trainingList.addEventListener("click", handleTrainingAction);
    elements.meetingList.addEventListener("click", handleMeetingAction);
    elements.appointmentList.addEventListener("click", handleAppointmentAction);
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
  }

  function bindDialogs() {
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog) requestDialogClose(dialog);
      });
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
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
        elements.deviceInstructionHistoryDialog,
        elements.attendanceDialog,
        elements.meetingStatsDialog,
        elements.accountDialog,
        elements.userManagementDialog,
        elements.catalogManagementDialog,
        elements.employeeDossierDialog,
        elements.vacationEmployeeOverviewDialog,
        elements.weekendOverviewDialog,
        elements.weekendSimulationDialog,
        elements.bulkEditDialog,
        elements.dataQualityDialog,
        elements.auditLogDialog,
        elements.confirmDialog,
      ].filter((dialog) => dialog.open);
      openDialogs.forEach((dialog) => dialog.close());

      state = await loadState();
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      applyTheme(state.settings.theme);
      if (currentUser) {
        const refreshedUser = state.users.find((user) => user.id === currentUser.id);
        if (!refreshedUser) {
          showLoginDialog();
          return;
        }
        currentUser = refreshedUser;
        if (currentUser.mustChangePassword) {
          completeLogin(currentUser);
          showToast("Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.");
          return;
        }
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
      applyTheme(state.settings.theme);
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

  function renderAll() {
    elements.navEmployeeCount.textContent = String(state.employees.length);
    elements.navTrainingCount.textContent = String(state.trainings.length);
    elements.navMeetingCount.textContent = String(state.meetings.length);
    elements.navAppointmentCount.textContent = String(
      state.appointments.filter((appointment) => appointment.date >= todayIso()).length,
    );
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    updateUsernameExportButton();
    renderDashboard();
    renderDeadlineOverview();
    renderEmployees();
    renderWeekendDistribution();
    renderVacationPlanner();
    renderTrainings();
    renderMeetings();
    renderAppointments();
    renderDevices();
    renderSettings();
    renderBackupStatus();
    renderDatabaseSaveWarning();
    filterHelpTopics();
    refreshFormattedDateInputs();
    void renderBrowserStorageStatus();
    applyAccessControl();
    renderSidebarSystemStatus();
  }

  async function changeTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    if (nextTheme === state.settings.theme) {
      applyTheme(nextTheme);
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.theme = nextTheme;
    });
    applyTheme(state.settings.theme);
    if (committed) showToast(`Farbthema „${THEMES[nextTheme]}“ wurde aktiviert.`);
  }

  function applyTheme(theme) {
    const activeTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme === "dark" ? "dark" : "light";
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
    completeLogin(admin);
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

    let passwordMatches = false;
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

    completeLogin(user);
  }

  function completeLogin(user) {
    currentUser = user;
    sessionStorage.setItem(SESSION_USER_KEY, user.id);
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

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
  }

  function showLoginDialog() {
    currentUser = null;
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

    currentUser = state.users.find((user) => user.id === currentUser.id);
    elements.changePasswordDialog.close();
    document.body.classList.remove("is-auth-locked");
    applyAccessControl();
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
    document.body.dataset.userRole = currentUser?.role || "guest";
    document.querySelectorAll("[data-admin-only]").forEach((element) => {
      element.hidden = !admin;
    });
    elements.currentUsername.textContent = currentUser?.username || "Nicht angemeldet";
    elements.currentUserRole.textContent = currentUser
      ? admin
        ? "Administrator"
        : "Normaler Benutzer"
      : "–";
    elements.mobileAccountButton.title = currentUser
      ? `Benutzerkonto: ${currentUser.username}`
      : "Benutzerkonto";
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
        });
        if (!committed) return;
        renderCatalogManagement();
        showToast("Beruf wurde gelöscht.");
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
        });
        if (!committed) return;
        renderCatalogManagement();
        showToast("Zusatzqualifikation wurde gelöscht.");
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
      .map((part) => String(part || 0).padStart(3, "0"))
      .join(".");
  }

  function renderProjectMetadata() {
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${projectBuildNumber()}`;
  }

  function renderSidebarSystemStatus() {
    if (!elements.sidebarSystemStatus) return;
    const localMode = !isMariaDbMode();
    const status = localMode ? "local" : backendConnectionStatus;
    elements.sidebarSystemStatus.classList.toggle("is-local", status === "local");
    elements.sidebarSystemStatus.classList.toggle(
      "is-connected",
      status === "connected",
    );
    elements.sidebarSystemStatus.classList.toggle("is-error", status === "error");

    if (localMode) {
      elements.sidebarConnectionLabel.textContent = "Lokal bereit";
      elements.sidebarBackendLabel.textContent = "Browser · localForage";
      elements.sidebarServerLabel.textContent = "Dieses Browserprofil";
      elements.sidebarRevisionLabel.textContent = "lokal";
      elements.sidebarSchemaLabel.textContent = "IndexedDB";
      elements.sidebarSyncLabel.textContent = "Automatische lokale Speicherung";
      elements.sidebarServerLabel.title = "";
      elements.sidebarSyncLabel.title = "";
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
      const health = await window.TeOBackend.health(backendConfig.apiUrl);
      markBackendConnected({ health });
    } catch (error) {
      markBackendConnectionError(error);
    }
  }
