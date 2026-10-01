  function openTrainingDialog(trainingId = null) {
    elements.trainingForm.reset();
    document.querySelector("#trainingTitle").setCustomValidity("");
    document.querySelector("#trainingId").value = "";
    document.querySelector("#trainingYear").value = String(new Date().getFullYear());
    document.querySelector("#trainingRecurrence").value = String(
      DEFAULT_TRAINING_RECURRENCE_MONTHS,
    );
    trainingRecurrenceManuallyChanged = false;

    const training = trainingId ? getTraining(trainingId) : null;
    elements.trainingDialogTitle.textContent = training
      ? "Pflichtfortbildung bearbeiten"
      : "Pflichtfortbildung anlegen";
    elements.trainingSubmitLabel.textContent = training
      ? "Änderungen speichern"
      : "Fortbildung speichern";

    if (training) {
      document.querySelector("#trainingId").value = training.id;
      document.querySelector("#trainingTitle").value = training.title;
      document.querySelector("#trainingYear").value = String(training.year);
      document.querySelector("#trainingRecurrence").value = training.recurrenceMonths
        ? String(training.recurrenceMonths)
        : "";
      document.querySelector("#trainingDescription").value = training.description;
    }

    elements.trainingDialog.showModal();
    captureCleanForm(elements.trainingForm);
    window.setTimeout(() => document.querySelector("#trainingTitle").focus(), 0);
  }

  async function handleTrainingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#trainingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.trainingForm.reportValidity()) return;

    const trainingId = document.querySelector("#trainingId").value;
    const existingTraining = trainingId ? getTraining(trainingId) : null;
    const now = new Date().toISOString();
    const recurrence = Number(document.querySelector("#trainingRecurrence").value);
    const recurrenceMonths =
      Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null;
    const trainingYear = Number(document.querySelector("#trainingYear").value);
    const matchingSeries = state.trainings.find(
      (item) =>
        item.id !== existingTraining?.id &&
        item.recurrenceMonths &&
        trainingSeriesSignature(item.title) === trainingSeriesSignature(titleInput.value),
    );
    const training = {
      id: existingTraining?.id || createId(),
      title: titleInput.value.trim(),
      year: trainingYear,
      recurrenceMonths,
      targetMinutes: existingTraining?.targetMinutes || null,
      seriesId: recurrenceMonths
        ? existingTraining?.seriesId ||
          matchingSeries?.seriesId ||
          generatedTrainingSeriesId(titleInput.value, existingTraining?.id)
        : "",
      description: document.querySelector("#trainingDescription").value.trim(),
      createdAt: existingTraining?.createdAt || now,
      updatedAt: now,
    };

    const previousDisplayYear = trainingDisplayYear;
    trainingDisplayYear = trainingYear;
    const committed = await commitStateMutation(() => {
      if (existingTraining) {
        state.trainings = state.trainings.map((item) =>
          item.id === training.id ? training : item,
        );
      } else {
        state.trainings.push(training);
      }
    });
    if (!committed) {
      trainingDisplayYear = previousDisplayYear;
      return;
    }

    elements.trainingDialog.close();
    showToast(existingTraining ? "Fortbildung wurde aktualisiert." : "Fortbildung wurde angelegt.");
  }

  function requestDeleteTraining(trainingId) {
    const training = getTraining(trainingId);
    if (!training) return;
    const completionCount = state.completions.filter(
      (completion) => completion.trainingId === trainingId,
    ).length;
    const historyNote = completionCount
      ? ` ${completionCount} erfasste${completionCount === 1 ? "r" : ""} Nachweis${
          completionCount === 1 ? "" : "e"
        } werden ebenfalls gelöscht.`
      : "";

    requestConfirmation({
      title: "Pflichtfortbildung löschen?",
      message: `„${training.title}“ (${training.year}) wird dauerhaft entfernt.${historyNote}`,
      acceptLabel: "Fortbildung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.trainings = state.trainings.filter((item) => item.id !== trainingId);
          state.completions = state.completions.filter(
            (completion) => completion.trainingId !== trainingId,
          );
        }, { undo: "Pflichtfortbildung gelöscht" });
        if (!committed) return;

        showUndoToast("Pflichtfortbildung wurde gelöscht.");
      },
    });
  }

  // date belegt das Datumsfeld eines neuen Termins vor - so legt ein Klick auf
  // einen Tag im Monatskalender den Termin gleich dort an.
  function openAppointmentDialog(appointmentId = null, { date = "" } = {}) {
    renderAppointmentCategoryOptions();
    elements.appointmentForm.reset();
    document.querySelector("#appointmentId").value = "";
    document.querySelector("#appointmentTitle").setCustomValidity("");
    document.querySelector("#appointmentEndTime").setCustomValidity("");
    document.querySelector("#appointmentDate").value =
      parseLocalDate(date) ? date : todayIso();
    elements.appointmentParticipantList.checked = false;
    elements.appointmentPinned.checked = false;

    const appointment = appointmentId ? getAppointment(appointmentId) : null;
    if (appointment) trackWorkspaceRecord("appointment", appointment.id);
    elements.appointmentDialogTitle.textContent = appointment
      ? "Termin bearbeiten"
      : "Termin anlegen";
    elements.appointmentSubmitLabel.textContent = appointment
      ? "Änderungen speichern"
      : "Termin speichern";
    elements.deleteAppointmentButton.hidden = !appointment;

    if (appointment) {
      document.querySelector("#appointmentId").value = appointment.id;
      document.querySelector("#appointmentTitle").value = appointment.title;
      document.querySelector("#appointmentDate").value = appointment.date;
      document.querySelector("#appointmentStartTime").value = appointment.startTime;
      document.querySelector("#appointmentEndTime").value = appointment.endTime;
      elements.appointmentCategory.value = appointment.category || "";
      document.querySelector("#appointmentLocation").value = appointment.location;
      document.querySelector("#appointmentDescription").value = appointment.description;
      elements.appointmentParticipantList.checked = Boolean(appointment.participantList);
      elements.appointmentPinned.checked = Boolean(appointment.pinned);
    }

    elements.appointmentDialog.showModal();
    captureCleanForm(elements.appointmentForm);
    window.setTimeout(() => document.querySelector("#appointmentTitle").focus(), 0);
  }

  function validateAppointmentTimes() {
    const startTime = document.querySelector("#appointmentStartTime").value;
    const endTimeInput = document.querySelector("#appointmentEndTime");
    const endTime = endTimeInput.value;
    endTimeInput.setCustomValidity(
      endTime && !startTime
        ? "Bitte zuerst eine Startzeit angeben."
        : startTime && endTime && endTime <= startTime
          ? "Die Endzeit muss nach der Startzeit liegen."
          : "",
    );
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault();
    const shouldPrint = event.submitter?.value === "print";
    const titleInput = document.querySelector("#appointmentTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte einen Titel eingeben.",
    );
    validateAppointmentTimes();
    if (!elements.appointmentForm.reportValidity()) return;

    const appointmentId = document.querySelector("#appointmentId").value;
    const existingAppointment = appointmentId
      ? getAppointment(appointmentId)
      : null;
    const now = new Date().toISOString();
    const appointment = {
      id: existingAppointment?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#appointmentDate").value,
      startTime: document.querySelector("#appointmentStartTime").value,
      endTime: document.querySelector("#appointmentEndTime").value,
      category: elements.appointmentCategory.value,
      location: document.querySelector("#appointmentLocation").value.trim(),
      description: document.querySelector("#appointmentDescription").value.trim(),
      pinned: elements.appointmentPinned.checked,
      participantList: elements.appointmentParticipantList.checked,
      createdAt: existingAppointment?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingAppointment) {
        state.appointments = state.appointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        );
      } else {
        state.appointments.push(appointment);
      }
    });
    if (!committed) return;

    elements.appointmentDialog.close();
    showToast(
      existingAppointment ? "Termin wurde aktualisiert." : "Termin wurde angelegt.",
    );
    if (shouldPrint) printAppointment(appointment);
  }

  function printAppointment(appointment) {
    const category = appointmentCategoryLabel(appointment);
    const time = formatAppointmentTime(appointment);
    const participantRows = appointment.participantList
      ? `<section class="appointment-print-participants">
          <h2>Teilnehmerliste</h2>
          ${Array.from({ length: 14 }, () => "<span></span>").join("")}
        </section>`
      : "";
    elements.appointmentPrintSurface.innerHTML = `
      <article class="appointment-print-document">
        <header>
          ${category ? `<p class="appointment-print-category">${escapeHtml(category)}</p>` : ""}
          <h1>${escapeHtml(appointment.title)}</h1>
          <p>${formatDate(appointment.date)}</p>
          <p>${escapeHtml(time || " ")}</p>
          <p>${escapeHtml(appointment.location || " ")}</p>
        </header>
        ${participantRows}
      </article>`;
    document.body.classList.add("print-appointment");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-appointment"), 0);
  }

  function requestDeleteAppointmentFromDialog() {
    const appointmentId = document.querySelector("#appointmentId").value;
    if (appointmentId) {
      requestDeleteAppointment(appointmentId, { closeDialog: true });
    }
  }

  function requestDeleteAppointment(
    appointmentId,
    { closeDialog = false } = {},
  ) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;

    requestConfirmation({
      title: "Termin löschen?",
      message: `„${appointment.title}“ am ${formatDate(
        appointment.date,
      )} wird dauerhaft entfernt.`,
      acceptLabel: "Termin löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.appointments = state.appointments.filter(
            (item) => item.id !== appointmentId,
          );
        }, { undo: "Termin gelöscht" });
        if (!committed) return;
        if (closeDialog && elements.appointmentDialog.open) {
          elements.appointmentDialog.close();
        }
        showUndoToast("Termin wurde gelöscht.");
      },
    });
  }
