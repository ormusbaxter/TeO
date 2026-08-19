  // Ziehen mit der Maus - die Geste, die in beiden Rastern bisher fehlte.
  //
  // Urlaubsplanung: über mehrere Felder ziehen trägt die gewählte Art in alle
  // ein, so wie es Umschalt + Pfeiltaste über die Tastatur längst tut.
  // Terminkalender: einen Termin auf einen anderen Tag ziehen verschiebt ihn.
  //
  // Beides läuft über Zeigerereignisse wie das Sortieren der Seitenleiste.
  // Erst jenseits einer kleinen Schwelle gilt es als Ziehen; darunter bleibt
  // es ein Klick und behält seine bisherige Bedeutung.
  const DRAG_THRESHOLD = 6;

  let plannerDrag = null;
  let appointmentDrag = null;

  function bindDragAndDrop() {
    elements.vacationPlanner?.addEventListener("pointerdown", beginPlannerDrag);
    elements.appointmentCalendarGrid?.addEventListener("pointerdown", beginAppointmentDrag);
  }

  // ---------------------------------------------------------------- Planung

  function beginPlannerDrag(event) {
    if (event.button !== 0) return;
    const cell = event.target.closest("[data-vacation-employee][data-vacation-date]");
    if (!cell) return;
    const start = plannerPositionOf(
      cell.dataset.vacationEmployee,
      cell.dataset.vacationDate,
    );
    if (!start) return;

    plannerDrag = { start, x: event.clientX, y: event.clientY, active: false, applied: false };
    document.addEventListener("pointermove", movePlannerDrag);
    document.addEventListener("pointerup", finishPlannerDrag, { once: true });
  }

  function movePlannerDrag(event) {
    if (!plannerDrag) return;
    if (
      !plannerDrag.active &&
      Math.abs(event.clientX - plannerDrag.x) < DRAG_THRESHOLD &&
      Math.abs(event.clientY - plannerDrag.y) < DRAG_THRESHOLD
    ) {
      return;
    }

    const cell = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-vacation-employee][data-vacation-date]");
    const position = cell
      ? plannerPositionOf(cell.dataset.vacationEmployee, cell.dataset.vacationDate)
      : null;
    if (!position) return;

    plannerDrag.active = true;
    document.body.classList.add("is-dragging-planner");
    // Der aufgezogene Bereich ist derselbe wie bei Umschalt + Pfeiltaste -
    // Ausgangspunkt und aktuelles Feld spannen ihn auf.
    vacationSelectionAnchor = plannerDrag.start;
    vacationFocus = position;
    applyVacationSelectionHighlight();
  }

  async function finishPlannerDrag() {
    document.removeEventListener("pointermove", movePlannerDrag);
    document.body.classList.remove("is-dragging-planner");
    const drag = plannerDrag;
    plannerDrag = null;
    if (!drag?.active) return;

    // Der Klick nach dem Loslassen wuerde sonst zusaetzlich ein einzelnes Feld
    // umschalten.
    suppressNextClick(elements.vacationPlanner);
    await applyVacationEntryToSelection(vacationEntryType || "vacation");
  }

  // ---------------------------------------------------------------- Termine

  function beginAppointmentDrag(event) {
    if (event.button !== 0) return;
    const entry = event.target.closest("[data-appointment-card]");
    if (!entry) return;
    const appointment = getAppointment(entry.dataset.appointmentCard);
    if (!appointment) return;

    appointmentDrag = {
      id: appointment.id,
      from: appointment.date,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    document.addEventListener("pointermove", moveAppointmentDrag);
    document.addEventListener("pointerup", finishAppointmentDrag, { once: true });
  }

  function moveAppointmentDrag(event) {
    if (!appointmentDrag) return;
    if (
      !appointmentDrag.active &&
      Math.abs(event.clientX - appointmentDrag.x) < DRAG_THRESHOLD &&
      Math.abs(event.clientY - appointmentDrag.y) < DRAG_THRESHOLD
    ) {
      return;
    }
    appointmentDrag.active = true;
    document.body.classList.add("is-dragging-appointment");

    const day = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-calendar-day]");
    elements.appointmentCalendarGrid
      .querySelectorAll(".is-drop-target")
      .forEach((element) => element.classList.remove("is-drop-target"));
    if (day && day.dataset.calendarDay !== appointmentDrag.from) {
      day.classList.add("is-drop-target");
      appointmentDrag.to = day.dataset.calendarDay;
    } else {
      appointmentDrag.to = "";
    }
  }

  async function finishAppointmentDrag() {
    document.removeEventListener("pointermove", moveAppointmentDrag);
    document.body.classList.remove("is-dragging-appointment");
    elements.appointmentCalendarGrid
      ?.querySelectorAll(".is-drop-target")
      .forEach((element) => element.classList.remove("is-drop-target"));
    const drag = appointmentDrag;
    appointmentDrag = null;
    if (!drag?.active) return;

    // Ohne diesen Riegel oeffnete das Loslassen anschliessend die
    // Schnellansicht des gezogenen Termins.
    suppressNextClick(elements.appointmentCalendarGrid);
    if (!drag.to || drag.to === drag.from) return;
    await moveAppointmentToDate(drag.id, drag.to);
  }

  async function moveAppointmentToDate(appointmentId, date) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        const target = state.appointments.find((entry) => entry.id === appointmentId);
        if (!target) return;
        target.date = date;
        target.updatedAt = now;
      },
      { undo: "Termin verschoben" },
    );
    if (committed) {
      showUndoToast(`„${appointment.title}“ liegt jetzt am ${formatDate(date)}.`);
    }
  }

  // Ein Zeigerdruck endet immer mit einem Klick. Nach einem Ziehen war der
  // aber nicht gemeint - dieser Riegel faengt genau den einen ab.
  function suppressNextClick(element) {
    element?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true, once: true });
  }
