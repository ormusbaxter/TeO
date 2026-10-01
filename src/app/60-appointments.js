  // Der Aufbau hat mehrere Ausgaenge; die Schnellansicht wird deshalb aussen
  // aufgefrischt, wenn die Liste in jedem Fall neu steht.
  function renderAppointments() {
    renderAppointmentsView();
    refreshRecordInspector("appointment");
  }

  function renderAppointmentsView() {
    renderViewFilterChips("appointments");
    const today = todayIso();
    const pinnedAppointments = state.appointments
      .filter(
        (appointment) => appointment.pinned && appointmentMatchesSearch(appointment),
      )
      .sort(sortAppointments);
    const matchingAppointments = state.appointments.filter(
      (appointment) =>
        !appointment.pinned && appointmentMatchesFilters(appointment, today),
    );
    const visibleAppointments = [...pinnedAppointments, ...matchingAppointments];
    const upcoming = [...matchingAppointments]
      .filter((appointment) => appointment.date >= today)
      .sort(sortAppointments);
    const past = [...matchingAppointments]
      .filter((appointment) => appointment.date < today)
      .sort((a, b) => sortAppointments(b, a));
    const visibleUpcomingCount = visibleAppointments.filter(
      (appointment) => appointment.date >= today,
    ).length;
    const todayCount = visibleAppointments.filter(
      (appointment) => appointment.date === today,
    ).length;

    elements.appointmentSummary.innerHTML = `
      ${renderSummaryChip("calendar", state.appointments.length, "Termine gesamt")}
      ${renderSummaryChip("alert", visibleUpcomingCount, "anstehende Termine", "orange")}
      ${renderSummaryChip("check", todayCount, "Termine heute", "teal")}
    `;

    renderAppointmentViewControls();
    if (appointmentViewMode === "calendar") {
      renderAppointmentCalendar(today);
      return;
    }

    if (state.appointments.length === 0) {
      elements.appointmentList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Termine",
            text: "Legen Sie den ersten Termin an. Anstehende Termine erscheinen automatisch im Fristenmonitor.",
            buttonText: "Ersten Termin anlegen",
            buttonAttribute: "data-empty-add-appointment",
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-empty-add-appointment]")
        ?.addEventListener("click", () => openAppointmentDialog());
      return;
    }

    if (visibleAppointments.length === 0) {
      elements.appointmentList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Keine passenden Termine",
            text: "Ändern Sie den Suchbegriff oder den ausgewählten Zeitraumfilter.",
            buttonText: "Filter zurücksetzen",
            buttonAttribute: "data-reset-appointment-filters",
            compact: true,
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-reset-appointment-filters]")
        ?.addEventListener("click", resetAppointmentFilters);
      return;
    }

    elements.appointmentList.innerHTML = `
      ${
        pinnedAppointments.length
          ? `<section class="appointment-group appointment-group-pinned">
              <h2 class="appointment-group-title"><span class="important-notification-icon" aria-hidden="true"></span>Angepinnte Termine</h2>
              ${pinnedAppointments.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
      ${
        upcoming.length
          ? `<section class="appointment-group">
              <h2 class="appointment-group-title">Anstehende Termine</h2>
              ${upcoming.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
      ${
        past.length
          ? `<section class="appointment-group appointment-group-past">
              <h2 class="appointment-group-title">Vergangene Termine</h2>
              ${past.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
    `;
  }

  // Angepinnte Termine bleiben bewusst am Zeitraumfilter vorbei sichtbar; sie
  // sind als wichtig markiert und sollen nicht verschwinden, weil gerade nur
  // anstehende Termine gezeigt werden. Ein Suchbegriff ist etwas anderes: Wer
  // sucht, will genau die passenden Termine sehen - ein angepinnter Termin,
  // der stehen bleibt, sieht aus wie ein Treffer und laesst die Suche
  // wirkungslos erscheinen.
  function appointmentMatchesPeriod(appointment, today) {
    if (appointmentPeriodFilter === "upcoming" && appointment.date < today) return false;
    if (appointmentPeriodFilter === "today" && appointment.date !== today) return false;
    if (appointmentPeriodFilter === "past" && appointment.date >= today) return false;
    return true;
  }

  function appointmentMatchesSearch(appointment) {
    if (!appointmentSearchTerm) return true;

    return searchKey(
      [
        appointment.title,
        appointment.description,
        appointment.location,
        appointmentCategoryLabel(appointment),
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(appointmentSearchTerm);
  }

  function appointmentMatchesFilters(appointment, today) {
    return (
      appointmentMatchesPeriod(appointment, today) &&
      appointmentMatchesSearch(appointment)
    );
  }

  function appointmentIsVisible(appointment, today) {
    return appointment.pinned
      ? appointmentMatchesSearch(appointment)
      : appointmentMatchesFilters(appointment, today);
  }

  function renderAppointmentViewControls() {
    document.querySelectorAll("[data-appointment-view]").forEach((button) => {
      const active = button.dataset.appointmentView === appointmentViewMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const calendarActive = appointmentViewMode === "calendar";
    elements.appointmentList.hidden = calendarActive;
    elements.appointmentCalendar.hidden = !calendarActive;
  }

  function setAppointmentViewMode(mode) {
    appointmentViewMode = mode === "calendar" ? "calendar" : "list";
    saveAppointmentViewPreference();
    renderAppointments();
  }

  function readAppointmentViewPreference() {
    const now = new Date();
    const fallback = {
      mode: "list",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
    try {
      const raw = window.localStorage?.getItem?.(APPOINTMENT_VIEW_KEY);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      const year = Number(value?.year);
      const month = Number(value?.month);
      return {
        mode: value?.mode === "calendar" ? "calendar" : "list",
        year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
        month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
      };
    } catch {
      return fallback;
    }
  }

  function saveAppointmentViewPreference() {
    try {
      window.localStorage?.setItem?.(
        APPOINTMENT_VIEW_KEY,
        JSON.stringify({
          mode: appointmentViewMode,
          year: appointmentCalendarYear,
          month: appointmentCalendarMonth,
        }),
      );
    } catch {
      // Der Terminkalender bleibt auch ohne Browserspeicher bedienbar; dann
      // startet er beim naechsten Aufruf wieder in der Listenansicht.
    }
  }

  function shiftAppointmentCalendarMonth(offset) {
    const shifted = new Date(
      appointmentCalendarYear,
      appointmentCalendarMonth - 1 + offset,
      1,
      12,
    );
    setAppointmentCalendarMonth(shifted.getFullYear(), shifted.getMonth() + 1);
  }

  function showAppointmentCalendarToday() {
    const now = new Date();
    setAppointmentCalendarMonth(now.getFullYear(), now.getMonth() + 1);
  }

  function setAppointmentCalendarMonth(year, month) {
    appointmentCalendarYear = year;
    appointmentCalendarMonth = month;
    saveAppointmentViewPreference();
    renderAppointments();
  }

  function renderAppointmentCalendar(today) {
    const firstOfMonth = new Date(
      appointmentCalendarYear,
      appointmentCalendarMonth - 1,
      1,
      12,
    );
    const monthLabel = dateFormat({ month: "long", year: "numeric" }).format(
      firstOfMonth,
    );
    elements.appointmentCalendarLabel.textContent = monthLabel;

    // Die Randtage stammen aus den Nachbarmonaten und koennen im Januar oder
    // Dezember in ein anderes Jahr fallen.
    const holidays = new Map([
      ...getNrwHolidays(appointmentCalendarYear - 1),
      ...getNrwHolidays(appointmentCalendarYear),
      ...getNrwHolidays(appointmentCalendarYear + 1),
    ]);
    const appointmentsByDate = new Map();
    state.appointments
      .filter((appointment) => appointmentIsVisible(appointment, today))
      .sort(sortAppointments)
      .forEach((appointment) => {
        const entries = appointmentsByDate.get(appointment.date) || [];
        entries.push(appointment);
        appointmentsByDate.set(appointment.date, entries);
      });

    let monthCount = 0;
    const cells = appointmentCalendarDates(
      appointmentCalendarYear,
      appointmentCalendarMonth,
    ).map((iso) => {
      const date = parseLocalDate(iso);
      const entries = appointmentsByDate.get(iso) || [];
      const inMonth = date.getMonth() === appointmentCalendarMonth - 1;
      if (inMonth) monthCount += entries.length;
      return renderAppointmentCalendarDay({
        date,
        iso,
        entries,
        inMonth,
        isToday: iso === today,
        holidayName: holidays.get(iso) || "",
      });
    });
    elements.appointmentCalendarGrid.innerHTML = cells.join("");
    elements.appointmentCalendarNote.innerHTML = appointmentSearchTerm
      ? renderAppointmentCalendarSearchNote(monthLabel, today)
      : monthCount
        ? `${monthCount} ${monthCount === 1 ? "Termin" : "Termine"} im ${monthLabel}. Auf einen Tag klicken, um einen Termin anzulegen, auf einen Eintrag, um ihn zu bearbeiten.`
        : `Im ${monthLabel} ist kein Termin eingetragen. Auf einen Tag klicken, um einen anzulegen.`;
  }

  // Das Monatsraster zeigt einen Monat, die Suche gilt aber dem gesamten
  // Bestand: Ein Treffer im Dezember ist im August nicht zu sehen, und ohne
  // Hinweis sieht es aus, als fände die Suche nichts. Die Zeile unter dem
  // Raster zaehlt deshalb alle Treffer und fuehrt zum naechsten ausserhalb
  // des gezeigten Monats.
  function handleAppointmentCalendarNoteAction(event) {
    const jumpButton = event.target.closest("[data-appointment-search-jump]");
    if (jumpButton) {
      const [year, month] = jumpButton.dataset.appointmentSearchJump
        .split("-")
        .map(Number);
      setAppointmentCalendarMonth(year, month);
      return;
    }
    if (event.target.closest("[data-clear-appointment-search]")) {
      appointmentSearchTerm = "";
      elements.appointmentSearch.value = "";
      renderAppointments();
    }
  }

  function appointmentSearchMatches(today) {
    return state.appointments
      .filter((appointment) => appointmentIsVisible(appointment, today))
      .sort(sortAppointments);
  }

  function renderAppointmentCalendarSearchNote(monthLabel, today) {
    const matches = appointmentSearchMatches(today);
    const monthPrefix = `${appointmentCalendarYear}-${String(
      appointmentCalendarMonth,
    ).padStart(2, "0")}`;
    const inMonth = matches.filter((appointment) =>
      appointment.date.startsWith(monthPrefix),
    );
    const outside = matches.filter(
      (appointment) => !appointment.date.startsWith(monthPrefix),
    );

    if (!matches.length) {
      return `Kein Termin passt zur Suche. <button class="appointment-calendar-note-action" type="button" data-clear-appointment-search>Suche zurücksetzen</button>`;
    }

    const found = `${inMonth.length || "Kein"} Treffer im ${monthLabel}`;
    if (!outside.length) {
      return `${found}. Auf einen Eintrag klicken, um ihn zu bearbeiten.`;
    }

    // Der naechste Treffer ist der, dessen Datum dem gezeigten Monat am
    // naechsten liegt - vorwaerts wie rueckwaerts.
    const reference = Date.parse(`${monthPrefix}-15T12:00:00.000Z`);
    const nearest = outside.reduce((closest, appointment) =>
      Math.abs(Date.parse(`${appointment.date}T12:00:00.000Z`) - reference) <
      Math.abs(Date.parse(`${closest.date}T12:00:00.000Z`) - reference)
        ? appointment
        : closest,
    );
    const elsewhere =
      outside.length === 1
        ? "1 weiterer in einem anderen Monat"
        : `${outside.length} weitere in anderen Monaten`;
    return `${found}, ${elsewhere}. <button class="appointment-calendar-note-action" type="button" data-appointment-search-jump="${
      nearest.date
    }">Zum Treffer am ${formatDate(nearest.date)}</button>`;
  }

  // Alle Tage, die das Monatsraster zeigt: der Monat selbst, davor die Tage
  // bis zum Wochenbeginn und dahinter der Rest der letzten Woche. Die Woche
  // beginnt am Montag; getDay() zaehlt ab Sonntag, daher der Versatz um sechs
  // Tage.
  function appointmentCalendarDates(year, month) {
    const leadingDays = (new Date(year, month - 1, 1, 12).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    return Array.from({ length: cellCount }, (_, index) =>
      localDateToIso(new Date(year, month - 1, index + 1 - leadingDays, 12)),
    );
  }

  function renderAppointmentCalendarDay({
    date,
    iso,
    entries,
    inMonth,
    isToday,
    holidayName,
  }) {
    const weekend = [0, 6].includes(date.getDay());
    const hiddenCount = Math.max(
      entries.length - APPOINTMENT_CALENDAR_ENTRY_LIMIT,
      0,
    );
    const moreLabel = `+${hiddenCount} weitere`;
    const dayLabel = dateFormat({
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    const classes = [
      "appointment-calendar-day",
      inMonth ? "" : "is-outside",
      isToday ? "is-today" : "",
      weekend ? "is-weekend" : "",
      holidayName ? "is-holiday" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div class="${classes}" data-calendar-day="${iso}">
        <div class="appointment-calendar-day-head">
          <button
            class="appointment-calendar-day-number"
            type="button"
            aria-label="Termin am ${escapeHtml(dayLabel)} anlegen"
            title="Termin am ${escapeHtml(dayLabel)} anlegen"
          >
            ${date.getDate()}
          </button>
          ${
            holidayName
              ? `<span class="appointment-calendar-day-note" title="${escapeHtml(holidayName)}">${escapeHtml(holidayName)}</span>`
              : ""
          }
        </div>
        ${
          entries.length
            ? `<ul class="appointment-calendar-day-entries">
                ${entries.map(renderAppointmentCalendarEntry).join("")}
              </ul>`
            : ""
        }
        ${
          hiddenCount
            ? `<button
                class="appointment-calendar-more"
                type="button"
                data-calendar-expand="${iso}"
                data-more-label="${escapeHtml(moreLabel)}"
                aria-expanded="false"
              >${escapeHtml(moreLabel)}</button>`
            : ""
        }
      </div>
    `;
  }

  function renderAppointmentCalendarEntry(appointment) {
    const timeLabel = appointment.startTime ? formatTime(appointment.startTime) : "";
    const category = appointmentCategoryLabel(appointment);
    const details = [
      formatAppointmentTime(appointment) || "ganztägig",
      category,
      appointment.location,
    ].filter(Boolean);
    return `
      <li>
        <button
          class="appointment-calendar-entry ${appointment.pinned ? "is-pinned" : ""}"
          type="button"
          data-appointment-card="${appointment.id}"
          data-record-card="${appointment.id}"
          title="${escapeHtml(`${appointment.title} · ${details.join(" · ")}`)}"
          aria-label="${escapeHtml(`${appointment.title} öffnen. ${details.join(", ")}`)}"
        >
          <span class="appointment-calendar-entry-icon">
            <svg><use href="#icon-${appointmentCategoryIcon(appointment)}"></use></svg>
          </span>
          ${
            timeLabel
              ? `<span class="appointment-calendar-entry-time">${escapeHtml(timeLabel)}</span>`
              : ""
          }
          <span class="appointment-calendar-entry-title">${escapeHtml(appointment.title)}</span>
          ${
            appointment.pinned
              ? '<span class="important-notification-icon" aria-hidden="true"></span>'
              : ""
          }
        </button>
      </li>
    `;
  }

  // Ein Klick auf einen Eintrag oeffnet ihn, ein Klick auf den freien Bereich
  // eines Tages legt einen neuen Termin fuer genau diesen Tag an.
  function handleAppointmentCalendarClick(event) {
    const expandButton = event.target.closest("[data-calendar-expand]");
    if (expandButton) {
      const day = expandButton.closest("[data-calendar-day]");
      const expanded = day.classList.toggle("is-expanded");
      expandButton.setAttribute("aria-expanded", String(expanded));
      expandButton.textContent = expanded
        ? "Weniger anzeigen"
        : expandButton.dataset.moreLabel;
      return;
    }

    // Ein Eintrag im Raster oeffnet die Schnellansicht (22-record-inspector),
    // nicht mehr den Dialog.
    if (event.target.closest("[data-appointment-card]")) return;

    const day = event.target.closest("[data-calendar-day]");
    if (day) openAppointmentDialog(null, { date: day.dataset.calendarDay });
  }

  function resetAppointmentFilters() {
    appointmentPeriodFilter = "all";
    appointmentSearchTerm = "";
    elements.appointmentSearch.value = "";
    document.querySelectorAll("[data-appointment-filter]").forEach((button) => {
      const active = button.dataset.appointmentFilter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderAppointments();
    elements.appointmentSearch.focus();
  }

  function appointmentCategoryIcon(appointment) {
    return (
      APPOINTMENT_CATEGORIES[appointment?.category]?.icon ||
      APPOINTMENT_CATEGORY_FALLBACK_ICON
    );
  }

  function appointmentCategoryLabel(appointment) {
    return APPOINTMENT_CATEGORIES[appointment?.category]?.label || "";
  }

  function renderAppointmentCategoryOptions() {
    if (!elements.appointmentCategory) return;
    elements.appointmentCategory.innerHTML = [
      '<option value="">Ohne Kategorie</option>',
      ...Object.entries(APPOINTMENT_CATEGORIES).map(
        ([key, { label }]) =>
          `<option value="${key}">${escapeHtml(label)}</option>`,
      ),
    ].join("");
  }

  function sortAppointments(a, b) {
    return (
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title, "de")
    );
  }

  function renderAppointmentCard(appointment) {
    const daysUntil = daysBetween(
      parseLocalDate(todayIso()),
      parseLocalDate(appointment.date),
    );
    const timeLabel = formatAppointmentTime(appointment);
    const kategorie = appointmentCategoryLabel(appointment);
    const meta = [
      formatDate(appointment.date),
      timeLabel,
      appointment.location,
    ].filter(Boolean);
    return `
      <article
        class="meeting-card appointment-card ${appointment.pinned ? "is-pinned" : ""} ${daysUntil < 0 ? "is-past" : ""}"
        data-appointment-card="${appointment.id}"
        data-record-card="${appointment.id}"
        tabindex="0"
        aria-label="Termindetails zu ${escapeHtml(appointment.title)} öffnen"
      >
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span
              class="training-icon appointment-icon"
              ${kategorie ? `title="${escapeHtml(kategorie)}"` : ""}
            >
              <svg><use href="#icon-${appointmentCategoryIcon(appointment)}"></use></svg>
            </span>
            <div>
              <h2>${appointment.pinned ? `<span class="appointment-pinned-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>` : ""}${escapeHtml(appointment.title)}${
                kategorie
                  ? ` <span class="appointment-category-tag">${escapeHtml(kategorie)}</span>`
                  : ""
              }</h2>
              <p>${escapeHtml(appointment.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${escapeHtml(meta.join(" · "))}
              </span>
            </div>
          </div>
          <div class="appointment-date-status">
            <strong>${formatDate(appointment.date)}</strong>
            <span>${escapeHtml(appointmentRelativeLabel(daysUntil))}</span>
          </div>
          <div class="training-actions">
            <button
              class="icon-button appointment-pin-button ${appointment.pinned ? "is-active" : ""}"
              type="button"
              data-action="toggle-appointment-pin"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} ${appointment.pinned ? "lösen" : "anpinnen"}"
              aria-pressed="${String(Boolean(appointment.pinned))}"
              title="${appointment.pinned ? "Nicht mehr anpinnen" : "Termin anpinnen"}"
            >
              <span class="important-notification-icon" aria-hidden="true"></span>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function formatAppointmentTime(appointment) {
    if (appointment.startTime && appointment.endTime) {
      return `${formatTime(appointment.startTime)}–${formatTime(
        appointment.endTime,
      )} Uhr`;
    }
    return appointment.startTime ? `ab ${formatTime(appointment.startTime)} Uhr` : "";
  }

  function appointmentRelativeLabel(daysUntil) {
    if (daysUntil === 0) return "Heute";
    if (daysUntil === 1) return "Morgen";
    if (daysUntil > 1) return `In ${daysUntil} Tagen`;
    if (daysUntil === -1) return "Gestern";
    return `Vor ${Math.abs(daysUntil)} Tagen`;
  }
