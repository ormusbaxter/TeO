  function openCompletionDialog(trainingId = null) {
    if (state.trainings.length === 0) {
      showView("trainings");
      showToast("Legen Sie zuerst eine Pflichtfortbildung an.", "error");
      return;
    }

    if (activeEmployeeList().length === 0) {
      showView("employees");
      showToast("Für einen Abschluss wird mindestens ein aktiver Mitarbeiter benötigt.", "error");
      return;
    }

    elements.completionForm.reset();
    selectedCompletionEmployeeIds = new Set();
    completionSearchTerm = "";
    elements.completionEmployeeSearch.value = "";
    elements.completionEmployeeError.textContent = "";
    elements.completionDate.setCustomValidity("");
    elements.completionDate.value = todayIso();

    elements.completionTraining.innerHTML = groupTrainingsByYear(trainingObligations())
      .map(
        ([year, trainings]) => `
          <optgroup label="Im Katalog seit ${year}">
            ${trainings
              .map(
                (training) =>
                  `<option value="${training.id}" ${
                    training.id === trainingId ? "selected" : ""
                  }>${escapeHtml(training.title)}</option>`,
              )
              .join("")}
          </optgroup>
        `,
      )
      .join("");

    renderCompletionEmployeeList();
    elements.completionDialog.showModal();
    captureCleanForm(elements.completionForm);
    window.setTimeout(() => elements.completionTraining.focus(), 0);
  }

  function renderCompletionEmployeeList() {
    const employees = filteredCompletionEmployees();
    const training = getTraining(elements.completionTraining.value);

    if (employees.length === 0) {
      elements.completionEmployeeList.innerHTML = `
        <div class="empty-state compact">
          <p>Keine aktiven Mitarbeiter passen zur Suche.</p>
        </div>
      `;
      updateCompletionSelectionUi();
      return;
    }

    elements.completionEmployeeList.innerHTML = employees
      .map((employee) => {
        const status = training
          ? getEmployeeCompletionStatus(employee.id, training)
          : { label: "Kein Status" };
        return `
          <label class="selection-card">
            <input
              type="checkbox"
              data-employee-id="${employee.id}"
              ${selectedCompletionEmployeeIds.has(employee.id) ? "checked" : ""}
            />
            ${renderAvatar(employee, true)}
            <span>
              <strong>${escapeHtml(fullName(employee))}</strong>
              <small>${escapeHtml(employee.profession)} · ${escapeHtml(status.label)}</small>
            </span>
          </label>
        `;
      })
      .join("");

    updateCompletionSelectionUi();
  }

  function filteredCompletionEmployees() {
    return activeEmployeeList()
      .filter((employee) => {
        if (!completionSearchTerm) return true;
        return searchKey(
          [employeeSearchText(employee), employee.profession].join(" "),
        ).includes(completionSearchTerm);
      })
      .sort(sortEmployees);
  }

  function updateCompletionSelectionUi() {
    const count = selectedCompletionEmployeeIds.size;
    elements.completionSelectionCount.textContent = `${count} ausgewählt`;

    const visibleEmployees = filteredCompletionEmployees();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) => selectedCompletionEmployeeIds.has(employee.id));
    elements.toggleAllEmployees.textContent = allSelected ? "Auswahl aufheben" : "Alle auswählen";
  }

  async function handleCompletionSubmit(event) {
    event.preventDefault();

    elements.completionDate.setCustomValidity(
      elements.completionDate.value && elements.completionDate.value > todayIso()
        ? "Das Abschlussdatum darf nicht in der Zukunft liegen."
        : "",
    );
    if (!elements.completionForm.reportValidity()) return;

    if (selectedCompletionEmployeeIds.size === 0) {
      elements.completionEmployeeError.textContent = "Bitte mindestens einen Mitarbeiter auswählen.";
      elements.completionEmployeeList.scrollIntoView({ block: "nearest" });
      return;
    }

    const trainingId = elements.completionTraining.value;
    const completedOn = elements.completionDate.value;
    const note = document.querySelector("#completionNote").value.trim();
    const now = new Date().toISOString();
    let addedCount = 0;
    let duplicateCount = 0;
    let inactiveCount = 0;
    const newCompletions = [];

    selectedCompletionEmployeeIds.forEach((employeeId) => {
      const employeeIsActive = state.employees.some(
        (employee) => employee.id === employeeId && employee.active,
      );
      if (!employeeIsActive) {
        inactiveCount += 1;
        return;
      }

      const duplicate = state.completions.some(
        (completion) =>
          completion.employeeId === employeeId &&
          completion.trainingId === trainingId &&
          completion.completedOn === completedOn,
      );
      if (duplicate) {
        duplicateCount += 1;
        return;
      }

      newCompletions.push({
        id: createId(),
        employeeId,
        trainingId,
        completedOn,
        note,
        createdAt: now,
      });
      addedCount += 1;
    });

    if (addedCount > 0) {
      const committed = await commitStateMutation(() => {
        state.completions.push(...newCompletions);
      });
      if (!committed) return;

      elements.completionDialog.close();
      const duplicateNote = duplicateCount
        ? ` ${duplicateCount} bereits vorhandene${duplicateCount === 1 ? "r" : ""} Nachweis${
            duplicateCount === 1 ? "" : "e"
          } wurde${duplicateCount === 1 ? "" : "n"} übersprungen.`
        : "";
      showToast(
        `${addedCount} Nachweis${addedCount === 1 ? "" : "e"} gespeichert.${duplicateNote}`,
      );
    } else {
      showToast(
        inactiveCount
          ? "Die ausgewählten Mitarbeiter sind nicht mehr aktiv."
          : "Diese Nachweise sind für das gewählte Datum bereits vorhanden.",
        "error",
      );
    }
  }

  function requestDeleteCompletion(completionId) {
    const completion = state.completions.find((item) => item.id === completionId);
    if (!completion) return;
    const employee = getEmployee(completion.employeeId);
    const training = getTraining(completion.trainingId);

    requestConfirmation({
      title: "Nachweis löschen?",
      message: `Der Abschluss „${training?.title || "Fortbildung"}“ von ${
        employee ? fullName(employee) : "diesem Mitarbeiter"
      } am ${formatDate(completion.completedOn)} wird entfernt.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.completions = state.completions.filter((item) => item.id !== completionId);
        }, { undo: "Fortbildungsnachweis gelöscht" });
        if (!committed) return;

        showUndoToast("Fortbildungsnachweis wurde gelöscht.");
      },
    });
  }
