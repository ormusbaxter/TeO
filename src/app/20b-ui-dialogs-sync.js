  function bindDelegatedActions() {
    elements.employeeTable.addEventListener("click", handleEmployeeTableAction);
    elements.employeeTable.addEventListener("change", handleEmployeeTableSelection);
    elements.vacationPlanner.addEventListener("click", handleVacationPlannerClick);
    elements.vacationPlanner.addEventListener("change", handleVacationPlannerChange);
    elements.vacationPlanner.addEventListener(
      "keydown",
      handleVacationPlannerKeydown,
    );
    elements.employmentChangeList.addEventListener("click", handleEmploymentChangeAction);
    elements.addEmploymentChangeButton.addEventListener("click", addEmploymentChangeRow);
    elements.vacationPlanner.addEventListener("pointerover", handleVacationCrosshair);
    elements.vacationPlanner.addEventListener("focusin", handleVacationCrosshair);
    elements.vacationPlanner.addEventListener("pointerleave", () =>
      setVacationCrosshair(null),
    );
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
    elements.createDataSetButton.addEventListener("click", showSetupDialog);
    elements.openSharedDataSetButton.addEventListener(
      "click",
      () => void openSharedDataSet(),
    );
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
        elements.deviceReinstructionDialog,
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
      clearUndoHistory();
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
      clearUndoHistory();
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
