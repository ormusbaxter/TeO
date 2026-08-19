  function renderAppointments() {
    const today = todayIso();
    const pinnedAppointments = state.appointments
      .filter((appointment) => appointment.pinned)
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

  // Angepinnte Termine bleiben bewusst an jedem Filter vorbei sichtbar; sie
  // sind als wichtig markiert und sollen nicht durch einen Zeitraumfilter
  // verschwinden. Fuer alle uebrigen entscheiden Zeitraum und Suchbegriff.
  function appointmentMatchesFilters(appointment, today) {
    if (appointmentPeriodFilter === "upcoming" && appointment.date < today) return false;
    if (appointmentPeriodFilter === "today" && appointment.date !== today) return false;
    if (appointmentPeriodFilter === "past" && appointment.date >= today) return false;
    if (!appointmentSearchTerm) return true;

    return [
      appointment.title,
      appointment.description,
      appointment.location,
      appointmentCategoryLabel(appointment),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(appointmentSearchTerm);
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
      .filter(
        (appointment) =>
          appointment.pinned || appointmentMatchesFilters(appointment, today),
      )
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
      .filter((appointment) => appointmentMatchesFilters(appointment, today))
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
          title="${escapeHtml(`${appointment.title} · ${details.join(" · ")}`)}"
          aria-label="${escapeHtml(`${appointment.title} bearbeiten. ${details.join(", ")}`)}"
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

    const entry = event.target.closest("[data-appointment-card]");
    if (entry) {
      openAppointmentDialog(entry.dataset.appointmentCard);
      return;
    }

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

  function toggleDeviceMatrixMaximized() {
    setDeviceMatrixMaximized(
      !elements.deviceMatrixWidget.classList.contains("is-maximized"),
    );
  }

  function setDeviceMatrixMaximized(maximized) {
    const active = Boolean(maximized);
    const widget = elements.deviceMatrixWidget;
    if (active && !deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor = document.createComment("device-matrix-widget-anchor");
      widget.parentNode.insertBefore(deviceMatrixWidgetAnchor, widget);
      document.body.append(widget);
    } else if (!active && deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor.parentNode?.insertBefore(widget, deviceMatrixWidgetAnchor);
      deviceMatrixWidgetAnchor.remove();
      deviceMatrixWidgetAnchor = null;
    }
    widget.classList.toggle("is-maximized", active);
    document.body.classList.toggle("is-device-matrix-maximized", active);
    elements.toggleDeviceMatrixMaximizeButton.setAttribute(
      "aria-pressed",
      String(active),
    );
    elements.toggleDeviceMatrixMaximizeButton.title = active
      ? "Einweisungsmatrix verkleinern (Esc)"
      : "Einweisungsmatrix maximieren";
    elements.deviceMatrixMaximizeLabel.textContent = active
      ? "Verkleinern"
      : "Maximieren";
    elements.deviceMatrixMaximizeIcon.setAttribute(
      "href",
      active ? "#icon-minimize" : "#icon-maximize",
    );
  }

  function handleDeviceMatrixMaximizeKeydown(event) {
    if (
      event.key !== "Escape" ||
      !elements.deviceMatrixWidget.classList.contains("is-maximized") ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    event.preventDefault();
    setDeviceMatrixMaximized(false);
    elements.toggleDeviceMatrixMaximizeButton.focus();
  }

  function renderDevices() {
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    const categoryOptions = `
      <option value="all">Alle Kategorien</option>
      ${categories
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
        )
        .join("")}
    `;
    if (
      deviceCategoryFilter !== "all" &&
      !categories.includes(deviceCategoryFilter)
    ) {
      deviceCategoryFilter = "all";
    }
    if (
      deviceManagementCategoryFilter !== "all" &&
      !categories.includes(deviceManagementCategoryFilter)
    ) {
      deviceManagementCategoryFilter = "all";
    }
    elements.deviceCategoryFilter.innerHTML = categoryOptions;
    elements.deviceManagementCategoryFilter.innerHTML = categoryOptions;
    elements.deviceCategoryFilter.value = deviceCategoryFilter;
    elements.deviceManagementCategoryFilter.value =
      deviceManagementCategoryFilter;
    const authorizedEmployees = [
      ...new Map(
        state.devices
          .flatMap((device) => getDeviceAuthorizedEmployees(device.id))
          .map((employee) => [employee.id, employee]),
      ).values(),
    ].sort(sortEmployees);
    const validAuthorizationFilters = new Set([
      "all",
      "assigned",
      "unassigned",
      ...authorizedEmployees.map((employee) => `employee:${employee.id}`),
    ]);
    if (!validAuthorizationFilters.has(deviceManagementAuthorizationFilter)) {
      deviceManagementAuthorizationFilter = "all";
    }
    elements.deviceManagementAuthorizationFilter.innerHTML = `
      <option value="all">Alle Geräte</option>
      <option value="assigned">Mit Einweisungsberechtigten</option>
      <option value="unassigned">Ohne Einweisungsberechtigte</option>
      ${authorizedEmployees
        .map(
          (employee) =>
            `<option value="employee:${employee.id}">${escapeHtml(fullName(employee))}</option>`,
        )
        .join("")}
    `;
    elements.deviceManagementAuthorizationFilter.value =
      deviceManagementAuthorizationFilter;
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceManagementInventoryFilter.value =
      deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;

    const instructedEmployeeIds = new Set(
      state.deviceInstructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    );
    elements.deviceSummary.innerHTML = `
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => device.currentInventory).length,
        "verfügbare Geräte",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => device.currentInventory && device.annex1,
        ).length,
        "aktuelle Geräte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "check",
        state.deviceInstructions.length,
        "dokumentierte Einweisungen",
        "teal",
      )}
      ${renderSummaryChip(
        "check",
        instructedEmployeeIds.size,
        "Mitarbeiter mit Einweisung",
        "teal",
      )}
    `;
    elements.deviceManagementSummary.innerHTML = `
      ${renderSummaryChip("empty", state.devices.length, "Geräte gesamt")}
      ${renderSummaryChip(
        "check",
        state.devices.filter((device) => device.currentInventory).length,
        "aktuell im Bestand",
        "teal",
      )}
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => !device.currentInventory).length,
        "nicht mehr im Bestand",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter((device) => device.annex1).length,
        "Medizinprodukte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => getDeviceAuthorizedEmployees(device.id).length === 0,
        ).length,
        "ohne Einweisungsberechtigte",
        "orange",
      )}
    `;

    const visibleDevices = filteredDevices({
      inventoryFilter: deviceManagementInventoryFilter,
      annexFilter: deviceManagementAnnexFilter,
      categoryFilter: deviceManagementCategoryFilter,
      searchTerm: deviceManagementSearchTerm,
      authorizationFilter: deviceManagementAuthorizationFilter,
    });
    if (!state.devices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Geräte",
            text: "Legen Sie das erste Gerät an, bevor Einweisungen dokumentiert werden.",
            buttonText: "Erstes Gerät anlegen",
            buttonAttribute: "data-empty-add-device",
          })}
        </section>
      `;
      elements.deviceCatalog
        .querySelector("[data-empty-add-device]")
        ?.addEventListener("click", () => openDeviceDialog());
    } else if (!visibleDevices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Keine Geräte für diese Filter",
            text: deviceManagementSearchTerm
              ? "Passen Sie den Suchbegriff oder die Filter an."
              : "Passen Sie die Filter der Geräteverwaltung an.",
            compact: true,
          })}
        </section>
      `;
    } else {
      elements.deviceCatalog.innerHTML = visibleDevices
        .map(renderDeviceCard)
        .join("");
    }

    renderDeviceInstructionMatrix();
    renderDeviceInstructionList();
  }

  function filteredDevices({
    inventoryFilter = deviceInventoryFilter,
    annexFilter = deviceAnnexFilter,
    categoryFilter = deviceCategoryFilter,
    searchTerm = deviceSearchTerm,
    authorizationFilter = "all",
  } = {}) {
    return [...state.devices]
      .filter((device) => {
        if (inventoryFilter === "current" && !device.currentInventory) {
          return false;
        }
        if (inventoryFilter === "former" && device.currentInventory) {
          return false;
        }
        if (annexFilter === "yes" && !device.annex1) return false;
        if (annexFilter === "no" && device.annex1) return false;
        if (categoryFilter !== "all" && device.category !== categoryFilter) {
          return false;
        }
        const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
        if (authorizationFilter === "assigned" && !authorizedEmployees.length) {
          return false;
        }
        if (authorizationFilter === "unassigned" && authorizedEmployees.length) {
          return false;
        }
        if (
          authorizationFilter.startsWith("employee:") &&
          !authorizedEmployees.some(
            (employee) =>
              employee.id === authorizationFilter.slice("employee:".length),
          )
        ) {
          return false;
        }
        if (!searchTerm) return true;
        return `${device.productName} ${device.manufacturer}`
          .toLocaleLowerCase("de-DE")
          .includes(searchTerm);
      })
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      );
  }

  function createDeviceExcelWorkbook(devices = state.devices) {
    const headers = [
      "ID bzw. Nummer",
      "Hersteller",
      "Produktname",
      "Gerätekategorie",
      "Anlage 1",
      "aktuell",
    ];
    const rows = [...devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.id.localeCompare(b.id, "de"),
      )
      .map((device) => [
        device.id,
        device.manufacturer,
        device.productName,
        device.category,
        device.annex1 ? "Ja" : "Nein",
        device.currentInventory ? "Ja" : "Nein",
      ]);
    const escapeXml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    const renderRow = (values, styleId) =>
      `<Row>${values
        .map(
          (value) =>
            `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join("")}</Row>`;
    const rowCount = rows.length + 1;

    return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" />
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#222222" />
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A6A6A6" /></Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#222222" />
   <Interior ss:Color="#E7E6E6" ss:Pattern="Solid" />
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center" ss:WrapText="1" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9" /></Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Geräte">
  <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="${rowCount}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Width="150" />
   <Column ss:Width="120" />
   <Column ss:Width="150" />
   <Column ss:Width="130" />
   <Column ss:Width="70" />
   <Column ss:Width="70" />
   ${renderRow(headers, "Header")}
   ${rows.map((row) => renderRow(row, "Data")).join("\n   ")}
  </Table>
  <AutoFilter x:Range="R1C1:R${rowCount}C6" xmlns="urn:schemas-microsoft-com:office:excel" />
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes />
   <FrozenNoSplit />
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
  }

  function exportDeviceCatalogExcel() {
    const workbook = createDeviceExcelWorkbook(state.devices);
    const date = todayIso();
    downloadTextFile(
      `TeO-Geraetekatalog-${date}.xls`,
      workbook,
      "application/vnd.ms-excel;charset=utf-8",
    );
    showToast(
      `${state.devices.length} Gerät${state.devices.length === 1 ? "" : "e"} wurden nach Excel exportiert.`,
    );
  }

  function renderDeviceCard(device) {
    const instructions = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === device.id,
    );
    const participantCount = new Set(
      instructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    ).size;
    const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
    return `
      <article class="training-card device-card ${
        device.currentInventory ? "" : "is-former"
      }">
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-empty"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(device.productName)}</h2>
              <p>${escapeHtml(device.manufacturer)} · ${escapeHtml(device.category)}</p>
              <span class="training-meta">
                ${device.currentInventory ? "Aktueller Gerätebestand" : "Nicht mehr im Gerätebestand"}
                ·
                ${device.annex1 ? "Medizinprodukt der Anlage 1" : "Kein Medizinprodukt der Anlage 1"}
                · ${participantCount} eingewiesene${participantCount === 1 ? "/r" : ""}
                Mitarbeiter/in${participantCount === 1 ? "" : "nen"}
              </span>
              <div class="device-authorization-summary ${
                authorizedEmployees.length ? "" : "is-missing"
              }">
                <strong>Einweisungsberechtigt</strong>
                <span>
                  ${
                    authorizedEmployees.length
                      ? authorizedEmployees
                          .map(
                            (employee) =>
                              `<span class="device-authorization-person">${escapeHtml(
                                fullName(employee),
                              )}</span>`,
                          )
                          .join("")
                      : "Keine einweisungsberechtigte Person hinterlegt"
                  }
                </span>
              </div>
            </div>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-device-instruction"
              data-id="${device.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Einweisung
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function getDeviceAuthorizedEmployees(deviceId) {
    const authorizedEmployeeIds = new Set(
      state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.instructorType === "manufacturer",
        )
        .flatMap((instruction) =>
          instruction.participants
            .filter((participant) => participant.wasMedicalProductsOfficer)
            .map((participant) => participant.employeeId),
        ),
    );
    return [...authorizedEmployeeIds]
      .map(getEmployee)
      .filter(Boolean)
      .sort(sortEmployees);
  }

  function renderDeviceInstructionMatrix() {
    const devices = filteredDevices();
    const employees = [...state.employees]
      .filter((employee) => {
        if (
          deviceEmployeeStatusFilter === "employed" &&
          employee.employmentStatus === "inactive"
        ) {
          return false;
        }
        if (
          !["all", "employed"].includes(deviceEmployeeStatusFilter) &&
          employee.employmentStatus !== deviceEmployeeStatusFilter
        ) {
          return false;
        }
        return (
          !deviceEmployeeSearchTerm ||
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceEmployeeSearchTerm)
        );
      })
      .sort(sortEmployees);

    if (!state.devices.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Matrix noch nicht verfügbar",
        text: "Nach dem Anlegen eines Geräts erscheint hier die Einweisungsmatrix.",
        compact: true,
      });
      return;
    }
    if (!devices.length || !employees.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Keine Matrixeinträge für diese Filter",
        text: "Passen Sie die Geräte- oder Mitarbeiterfilter an.",
        compact: true,
      });
      return;
    }

    elements.deviceInstructionMatrix.innerHTML = `
      <div
        class="device-matrix-scroll"
        tabindex="0"
        aria-label="Einweisungsmatrix nach Mitarbeiter und Gerät"
      >
        <table class="device-matrix-table">
          <thead>
            <tr>
              <th scope="col">Mitarbeiter</th>
              ${devices
                .map((device) => {
                  const instructionPercentage =
                    getDeviceInstructionPercentage(device.id, employees);
                  return `
                    <th scope="col" title="${escapeHtml(deviceLabel(device))}">
                      <button
                        class="device-matrix-device"
                        type="button"
                        data-device-overview="${device.id}"
                        aria-label="Einweisungsübersicht für ${escapeHtml(deviceLabel(device))} anzeigen"
                      >
                        <span>${escapeHtml(device.manufacturer)}</span>
                        <strong>${escapeHtml(device.productName)}</strong>
                        <small class="completion-progress ${completionProgressTone(
                          instructionPercentage,
                        )}">
                          ${instructionPercentage} % eingewiesen
                        </small>
                      </button>
                    </th>
                  `;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
              .map(
                (employee) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="device-matrix-employee"
                        type="button"
                        data-device-employee-overview="${employee.id}"
                        aria-label="Geräteübersicht für ${escapeHtml(fullName(employee))} anzeigen"
                      >
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        ${
                          employee.qualifications.medizinproduktebeauftragter
                            ? '<small class="device-mpo-status is-qualified">Gerätebeauftragte/r</small>'
                            : ""
                        }
                      </button>
                    </th>
                    ${devices
                      .map((device) =>
                        renderDeviceMatrixCell(employee, device),
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="device-matrix-hint">
        Grün zeigt eine dokumentierte Einweisung. Gold kennzeichnet eine
        Herstellereinweisung als Gerätebeauftragte/r. Gerätenamen und Statusfelder
        öffnen die jeweilige Detailübersicht.
      </p>
    `;
  }

  function filteredDeviceInstructions({
    searchTerm = deviceInstructionSearchTerm,
    sortKey = deviceInstructionSortKey,
  } = {}) {
    const normalizedSearchTerm = String(searchTerm)
      .trim()
      .toLocaleLowerCase("de-DE");
    const nachEingabe = sortKey === "createdAt";

    return [...state.deviceInstructions]
      .filter((instruction) => {
        if (!normalizedSearchTerm) return true;
        const device = getDevice(instruction.deviceId);
        const participantNames = instruction.participants
          .map((participant) => getEmployee(participant.employeeId))
          .filter(Boolean)
          .map(fullName);
        const searchableText = [
          device?.productName,
          device?.manufacturer,
          instruction.instructorName,
          instruction.instructorType === "employee"
            ? "Interne Einweisung"
            : "Herstellereinweisung",
          instruction.date,
          String(instruction.createdAt || "").slice(0, 10),
          ...participantNames,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de-DE");
        return searchableText.includes(normalizedSearchTerm);
      })
      .sort((a, b) =>
        nachEingabe
          ? String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
            b.date.localeCompare(a.date)
          : b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
      );
  }

  function renderDeviceInstructionList() {
    elements.deviceInstructionSort.value = deviceInstructionSortKey;
    // Beide Sortierungen fallen auf das jeweils andere Datum zurueck, damit
    // gleichzeitig erfasste Nachweise eine stabile Reihenfolge behalten.
    const nachEingabe = deviceInstructionSortKey === "createdAt";
    const instructions = filteredDeviceInstructions();
    if (!instructions.length) {
      elements.deviceInstructionList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: state.deviceInstructions.length
              ? "Keine Einweisungen für diesen Filter"
              : "Noch keine Einweisungen dokumentiert",
            text: state.deviceInstructions.length
              ? "Passen Sie den Suchbegriff an."
              : "Gespeicherte Einweisungen erscheinen hier chronologisch.",
            compact: true,
          })}
        </section>
      `;
      return;
    }

    const shown = instructions.slice(0, deviceInstructionLogLimit);
    const remaining = instructions.length - shown.length;
    elements.deviceInstructionList.innerHTML = `
      <div class="device-instruction-log">
        ${shown
          .map((instruction) => {
            const device = getDevice(instruction.deviceId);
            if (!device) return "";
            const participantNames = instruction.participants
              .map((participant) => {
                const employee = getEmployee(participant.employeeId);
                if (!employee) return "";
                return `${fullName(employee)}${
                  participant.wasMedicalProductsOfficer
                    ? " · Gerätebeauftragte/r"
                    : ""
                }`;
              })
              .filter(Boolean);
            return `
              <article class="device-instruction-log-row">
                <time datetime="${instruction.date}">
                  ${formatDate(instruction.date)}
                  ${
                    nachEingabe
                      ? `<small>erfasst ${formatDate(
                          instruction.createdAt.slice(0, 10),
                        )}</small>`
                      : ""
                  }
                </time>
                <div class="device-instruction-log-device">
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}</small>
                </div>
                <div>
                  <strong>${escapeHtml(instruction.instructorName)}</strong>
                  <small>
                    ${
                      instruction.instructorType === "employee"
                        ? "Interne Einweisung"
                        : "Herstellereinweisung"
                    }
                  </small>
                </div>
                <div class="device-instruction-log-participants">
                  <strong>
                    ${instruction.participants.length} Teilnehmer/in${
                      instruction.participants.length === 1 ? "" : "nen"
                    }
                  </strong>
                  <small>${escapeHtml(participantNames.join(", "))}</small>
                </div>
                <div class="device-instruction-log-actions">
                  <button
                    class="icon-button"
                    type="button"
                    data-edit-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} bearbeiten"
                    title="Einweisung bearbeiten"
                  >
                    <svg><use href="#icon-edit"></use></svg>
                  </button>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Einweisung löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
        ${
          remaining
            ? `
              <button
                class="button button-secondary device-instruction-log-more"
                type="button"
                data-show-more-device-instructions
              >
                Weitere ${remaining} Einweisung${remaining === 1 ? "" : "en"} anzeigen
              </button>
            `
            : ""
        }
      </div>
    `;
    limitDeviceInstructionLogHeight();
  }

  function limitDeviceInstructionLogHeight() {
    const log = elements.deviceInstructionList.querySelector(
      ".device-instruction-log",
    );
    if (!log) return;
    log.style.maxHeight = "";
    const rows = [...log.querySelectorAll(".device-instruction-log-row")];
    if (rows.length <= VISIBLE_DEVICE_INSTRUCTION_ROWS || !log.offsetParent) {
      return;
    }
    const lastVisibleRow = rows[VISIBLE_DEVICE_INSTRUCTION_ROWS - 1];
    log.style.maxHeight = `${
      lastVisibleRow.offsetTop + lastVisibleRow.offsetHeight
    }px`;
  }

  function getDeviceInstructionPercentage(deviceId, employees) {
    if (!employees.length) return 0;
    const instructedEmployeeIds =
      deviceInstructionIndex().byDevice.get(deviceId) || EMPTY_EMPLOYEE_IDS;
    const instructedCount = employees.filter((employee) =>
      instructedEmployeeIds.has(employee.id),
    ).length;
    return Math.round((instructedCount / employees.length) * 100);
  }

  // Die Einweisungsmatrix stellt je Zelle dieselbe Frage: Welche Einweisungen
  // hat dieser Mitarbeiter an diesem Geraet? Ohne Index durchsucht jede der
  // Tausenden Zellen den gesamten Bestand samt Teilnehmerlisten. Ein Durchgang
  // beantwortet alle Fragen; der Index haelt, solange die Sammlung dieselbe
  // bleibt - sie wird bei jeder Aenderung neu aufgebaut.
  const EMPTY_EMPLOYEE_IDS = new Set();
  const deviceInstructionIndexCache = {
    instructions: null,
    count: -1,
    value: { byPair: new Map(), byDevice: new Map() },
  };

  function deviceInstructionIndex() {
    const cache = deviceInstructionIndexCache;
    if (
      cache.instructions === state.deviceInstructions &&
      cache.count === state.deviceInstructions.length
    ) {
      return cache.value;
    }

    const byPair = new Map();
    const byDevice = new Map();
    for (const instruction of state.deviceInstructions) {
      let employeeIds = byDevice.get(instruction.deviceId);
      if (!employeeIds) {
        employeeIds = new Set();
        byDevice.set(instruction.deviceId, employeeIds);
      }
      for (const participant of instruction.participants) {
        employeeIds.add(participant.employeeId);
        const key = `${instruction.deviceId}|${participant.employeeId}`;
        const bucket = byPair.get(key);
        if (bucket) bucket.push(instruction);
        else byPair.set(key, [instruction]);
      }
    }
    for (const bucket of byPair.values()) {
      bucket.sort((a, b) => b.date.localeCompare(a.date));
    }

    cache.instructions = state.deviceInstructions;
    cache.count = state.deviceInstructions.length;
    cache.value = { byPair, byDevice };
    return cache.value;
  }

  // Gemeinsam genutzt von der Einweisungsmatrix und der Jahresauswertung der
  // Pflichtfortbildungen, damit beide denselben Farbmassstab verwenden.
  function completionProgressTone(percentage) {
    if (percentage <= 65) return "is-low";
    if (percentage <= 80) return "is-medium";
    return "is-high";
  }

  function renderDeviceMatrixCell(employee, device) {
    const instructions =
      deviceInstructionIndex().byPair.get(`${device.id}|${employee.id}`) || [];
    if (!instructions.length) {
      return `
        <td>
          <span class="device-matrix-status is-missing" aria-label="Keine Einweisung">×</span>
        </td>
      `;
    }
    const latest = instructions[0];
    const hasManufacturerOfficerInstruction = instructions.some(
      (instruction) =>
        instruction.instructorType === "manufacturer" &&
        instruction.participants.some(
          (participant) =>
            participant.employeeId === employee.id &&
            participant.wasMedicalProductsOfficer,
        ),
    );
    return `
      <td>
        <button
          class="device-matrix-status ${
            hasManufacturerOfficerInstruction
              ? "is-manufacturer-officer"
              : "is-complete"
          }"
          type="button"
          data-device-history-employee="${employee.id}"
          data-device-history-device="${device.id}"
          aria-label="${instructions.length} Einweisung${instructions.length === 1 ? "" : "en"} für ${escapeHtml(
            fullName(employee),
          )} in ${escapeHtml(deviceLabel(device))} anzeigen${
            hasManufacturerOfficerInstruction
              ? ", Herstellereinweisung als Gerätebeauftragte/r vorhanden"
              : ""
          }"
        >
          <span>✓</span>
          <small>${formatDate(latest.date)}</small>
          ${instructions.length > 1 ? `<i>${instructions.length}</i>` : ""}
        </button>
      </td>
    `;
  }

  function handleDeviceAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "add-device-instruction") openDeviceInstructionDialog(id);
    if (action === "edit-device") openDeviceDialog(id);
    if (action === "delete-device") requestDeleteDevice(id);
  }

  function handleDeviceMatrixAction(event) {
    const deviceButton = event.target.closest("[data-device-overview]");
    if (deviceButton) {
      openDeviceOverview(deviceButton.dataset.deviceOverview);
      return;
    }
    const employeeButton = event.target.closest(
      "[data-device-employee-overview]",
    );
    if (employeeButton) {
      openDeviceEmployeeOverview(
        employeeButton.dataset.deviceEmployeeOverview,
      );
      return;
    }
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceHistoryAction(event) {
    const button = event.target.closest("[data-delete-device-instruction]");
    if (!button) return;
    requestDeleteDeviceInstruction(button.dataset.deleteDeviceInstruction);
  }

  function handleDeviceEmployeeOverviewAction(event) {
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceInstructionListAction(event) {
    const moreButton = event.target.closest("[data-show-more-device-instructions]");
    if (moreButton) {
      // Die Blickposition im Protokoll bleibt erhalten, sonst spraenge der
      // Kasten beim Nachladen an den Anfang zurueck.
      const log = moreButton.closest(".device-instruction-log");
      const scrollTop = log?.scrollTop || 0;
      deviceInstructionLogLimit += DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
      const refreshed = elements.deviceInstructionList.querySelector(
        ".device-instruction-log",
      );
      if (refreshed) refreshed.scrollTop = scrollTop;
      return;
    }
    const editButton = event.target.closest("[data-edit-device-instruction]");
    if (editButton) {
      openDeviceInstructionDialog(
        null,
        editButton.dataset.editDeviceInstruction,
      );
      return;
    }
    const deleteButton = event.target.closest("[data-delete-device-instruction]");
    if (deleteButton) {
      requestDeleteDeviceInstruction(deleteButton.dataset.deleteDeviceInstruction);
    }
  }

  function openDeviceDialog(deviceId = null) {
    elements.deviceForm.reset();
    document.querySelector("#deviceId").value = "";
    document.querySelector("#deviceCurrentInventory").checked = true;
    ["#deviceProductName", "#deviceManufacturer", "#deviceCategory"].forEach(
      (selector) => document.querySelector(selector).setCustomValidity(""),
    );
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    document.querySelector("#deviceCategoryOptions").innerHTML = categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}"></option>`,
      )
      .join("");

    const device = deviceId ? getDevice(deviceId) : null;
    elements.deviceDialogTitle.textContent = device
      ? "Gerät bearbeiten"
      : "Gerät anlegen";
    elements.deviceSubmitLabel.textContent = device
      ? "Änderungen speichern"
      : "Gerät speichern";
    if (device) {
      document.querySelector("#deviceId").value = device.id;
      document.querySelector("#deviceProductName").value = device.productName;
      document.querySelector("#deviceManufacturer").value = device.manufacturer;
      document.querySelector("#deviceCategory").value = device.category;
      document.querySelector("#deviceAnnex1").value = device.annex1
        ? "yes"
        : "no";
      document.querySelector("#deviceCurrentInventory").checked =
        device.currentInventory;
    }
    elements.deviceDialog.showModal();
    captureCleanForm(elements.deviceForm);
    window.setTimeout(
      () => document.querySelector("#deviceProductName").focus(),
      0,
    );
  }

  async function handleDeviceSubmit(event) {
    event.preventDefault();
    const productName = document.querySelector("#deviceProductName");
    const manufacturer = document.querySelector("#deviceManufacturer");
    const category = document.querySelector("#deviceCategory");
    [
      [productName, "Bitte einen Produktnamen eingeben."],
      [manufacturer, "Bitte einen Hersteller eingeben."],
      [category, "Bitte eine Gerätekategorie eingeben."],
    ].forEach(([input, message]) => {
      input.setCustomValidity(input.value.trim() ? "" : message);
    });
    if (!elements.deviceForm.reportValidity()) return;

    const deviceId = document.querySelector("#deviceId").value;
    const existingDevice = deviceId ? getDevice(deviceId) : null;
    const now = new Date().toISOString();
    const device = {
      id: existingDevice?.id || createId(),
      productName: productName.value.trim(),
      manufacturer: manufacturer.value.trim(),
      category: category.value.trim(),
      annex1: document.querySelector("#deviceAnnex1").value === "yes",
      currentInventory: document.querySelector("#deviceCurrentInventory").checked,
      createdAt: existingDevice?.createdAt || now,
      updatedAt: now,
    };
    const committed = await commitStateMutation(() => {
      if (existingDevice) {
        state.devices = state.devices.map((item) =>
          item.id === device.id ? device : item,
        );
      } else {
        state.devices.push(device);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceForm);
    elements.deviceDialog.close();
    showToast(
      existingDevice ? "Gerät wurde aktualisiert." : "Gerät wurde angelegt.",
    );
  }

  function requestDeleteDevice(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    const instructionCount = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === deviceId,
    ).length;
    requestConfirmation({
      title: "Gerät löschen?",
      message: `„${deviceLabel(device)}“ wird dauerhaft entfernt.${
        instructionCount
          ? ` ${instructionCount} Einweisungsnachweis${
              instructionCount === 1 ? "" : "e"
            } werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Gerät löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.devices = state.devices.filter((item) => item.id !== deviceId);
          state.deviceInstructions = state.deviceInstructions.filter(
            (instruction) => instruction.deviceId !== deviceId,
          );
        });
        if (committed) showToast("Gerät wurde gelöscht.");
      },
    });
  }

  function openDeviceInstructionDialog(deviceId = null, instructionId = null) {
    if (!state.devices.length) {
      showToast("Bitte legen Sie zuerst ein Gerät an.", "error");
      return;
    }
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (instruction) => instruction.id === instructionId,
        )
      : null;
    if (instructionId && !existingInstruction) {
      showToast("Der Einweisungsnachweis wurde nicht gefunden.", "error");
      return;
    }
    elements.deviceInstructionForm.reset();
    deviceParticipantSearchTerm = "";
    deviceParticipantDraft = new Map();
    elements.deviceInstructionId.value = "";
    elements.deviceInstructionDialogTitle.textContent = existingInstruction
      ? "Einweisung bearbeiten"
      : "Einweisung dokumentieren";
    elements.deviceInstructionSubmitLabel.textContent = existingInstruction
      ? "Änderungen speichern"
      : "Einweisung speichern";
    elements.deviceParticipantSearch.value = "";
    elements.deviceParticipantError.textContent = "";
    elements.deviceInstructionDate.setCustomValidity("");
    elements.externalInstructorName.setCustomValidity("");
    elements.employeeInstructor.setCustomValidity("");
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.employeeInstructorMpoConfirmationError.textContent = "";
    // Bewusst kein Vorgabedatum: Einweisungen werden haeufig nachtraeglich
    // erfasst, ein voreingetragenes Heute wuerde leicht uebersehen.
    elements.deviceInstructionDate.value = "";
    elements.deviceInstructionDeviceSearch.value = "";
    elements.deviceInstructionDeviceError.textContent = "";
    deviceInstructionDeviceSearchTerm = "";
    deviceInstructionDeviceDraft = new Set();

    const selectedDeviceId = existingInstruction?.deviceId || deviceId;
    if (selectedDeviceId && getDevice(selectedDeviceId)) {
      deviceInstructionDeviceDraft.add(selectedDeviceId);
    }

    // Beim Bearbeiten gehoert der Nachweis zu genau einem Geraet; das
    // Sammelanlegen gibt es nur beim Neuanlegen.
    const einzelauswahl = Boolean(existingInstruction);
    elements.toggleAllInstructionDevices.hidden = einzelauswahl;
    elements.deviceSelectionHeadingLabel.textContent = einzelauswahl
      ? "Gerät"
      : "Geräte · Mehrfachauswahl möglich";
    elements.employeeInstructor.innerHTML = `
      <option value="">Bitte auswählen</option>
      ${[...state.employees]
        .sort(compareDeviceInstructionEmployees)
        .map(
          (employee) => `
            <option value="${employee.id}">
              ${escapeHtml(deviceInstructionEmployeeOptionLabel(employee))}${
                employee.qualifications.medizinproduktebeauftragter
                  ? " · aktuell Medizinproduktebeauftragte/r"
                  : ""
              }
            </option>
          `,
        )
        .join("")}
    `;
    if (existingInstruction) {
      elements.deviceInstructionId.value = existingInstruction.id;
      elements.deviceInstructionDate.value = existingInstruction.date;
      elements.deviceInstructorType.value = existingInstruction.instructorType;
      if (existingInstruction.instructorType === "employee") {
        elements.employeeInstructor.value =
          existingInstruction.instructorEmployeeId;
        elements.employeeInstructorMpoConfirmation.checked =
          existingInstruction.instructorWasMedicalProductsOfficer;
      } else {
        elements.externalInstructorName.value =
          existingInstruction.instructorName;
      }
      deviceParticipantDraft = new Map(
        existingInstruction.participants.map((participant) => [
          participant.employeeId,
          participant.wasMedicalProductsOfficer,
        ]),
      );
    } else {
      elements.deviceInstructorType.value = "manufacturer";
    }
    updateDeviceInstructorFields();
    renderInstructionDeviceList();
    renderDeviceParticipantList();
    elements.deviceInstructionDialog.showModal();
    // Erst jetzt ist die Liste vermessbar.
    limitInstructionDeviceListHeight();
    captureCleanForm(elements.deviceInstructionForm);
    window.setTimeout(() => elements.deviceInstructionDeviceSearch.focus(), 0);
  }

  function instructionDeviceSingleSelect() {
    return Boolean(elements.deviceInstructionId.value);
  }

  function filteredInstructionDevices() {
    return [...state.devices]
      .filter(
        (device) =>
          !deviceInstructionDeviceSearchTerm ||
          `${device.manufacturer} ${device.productName}`
            .toLocaleLowerCase("de-DE")
            .includes(deviceInstructionDeviceSearchTerm),
      )
      .sort(
        (a, b) =>
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.productName.localeCompare(b.productName, "de"),
      );
  }

  function renderInstructionDeviceList() {
    const devices = filteredInstructionDevices();
    const einzelauswahl = instructionDeviceSingleSelect();
    elements.deviceInstructionDeviceList.innerHTML = devices.length
      ? devices
          .map(
            (device) => `
              <label class="selection-card">
                <input
                  type="${einzelauswahl ? "radio" : "checkbox"}"
                  ${einzelauswahl ? 'name="deviceInstructionDeviceChoice"' : ""}
                  data-instruction-device="${device.id}"
                  ${deviceInstructionDeviceDraft.has(device.id) ? "checked" : ""}
                />
                <span class="device-selection-icon">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span>
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}${
                    device.annex1 ? " · Anlage 1" : ""
                  }${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                </span>
              </label>
            `,
          )
          .join("")
      : '<p class="completion-empty">Keine Geräte für diese Suche gefunden.</p>';
    limitInstructionDeviceListHeight();
    updateInstructionDeviceCount();
  }

  // Fuenf Eintraege bleiben sichtbar. Die Hoehe wird an der ersten
  // ueberzaehligen Karte gemessen, weil lange Geraetenamen umbrechen koennen.
  // Solange der Dialog geschlossen ist, liefern alle Masse 0; die Begrenzung
  // wird dann beim Oeffnen nachgeholt.
  function limitInstructionDeviceListHeight() {
    const list = elements.deviceInstructionDeviceList;
    list.style.maxHeight = "";
    if (!list.offsetParent) return;

    const cards = [...list.querySelectorAll(".selection-card")];
    if (cards.length <= VISIBLE_INSTRUCTION_DEVICES) return;
    // Bis zur Unterkante der letzten sichtbaren Karte, zuzueglich des unteren
    // Innenabstands. Ueber die Oberkante der naechsten Karte gerechnet waere
    // der Rasterabstand doppelt gezaehlt und die fuenfte Karte abgeschnitten.
    // offsetTop/offsetHeight statt getBoundingClientRect: Der Dialog faehrt
    // beim Oeffnen skaliert ein, wodurch gemessene Rechtecke zu klein waeren.
    const letzte = cards[VISIBLE_INSTRUCTION_DEVICES - 1];
    const innenabstand =
      Number.parseFloat(getComputedStyle(list).paddingBottom) || 0;
    list.style.maxHeight = `${
      letzte.offsetTop + letzte.offsetHeight + innenabstand
    }px`;
  }

  function updateInstructionDeviceCount() {
    const selectedCount = deviceInstructionDeviceDraft.size;
    elements.toggleAllInstructionDevices.textContent =
      selectedCount && filteredInstructionDevices().every((device) =>
        deviceInstructionDeviceDraft.has(device.id),
      )
        ? "Sichtbare abwählen"
        : "Sichtbare auswählen";
    if (selectedCount) elements.deviceInstructionDeviceError.textContent = "";
  }

  function handleInstructionDeviceChange(event) {
    const checkbox = event.target.closest("[data-instruction-device]");
    if (!checkbox) return;
    const deviceId = checkbox.dataset.instructionDevice;
    if (instructionDeviceSingleSelect()) {
      deviceInstructionDeviceDraft = new Set([deviceId]);
    } else if (checkbox.checked) {
      deviceInstructionDeviceDraft.add(deviceId);
    } else {
      deviceInstructionDeviceDraft.delete(deviceId);
    }
    updateInstructionDeviceCount();
  }

  function toggleVisibleInstructionDevices() {
    const devices = filteredInstructionDevices();
    const alleGewaehlt = devices.every((device) =>
      deviceInstructionDeviceDraft.has(device.id),
    );
    devices.forEach((device) => {
      if (alleGewaehlt) deviceInstructionDeviceDraft.delete(device.id);
      else deviceInstructionDeviceDraft.add(device.id);
    });
    renderInstructionDeviceList();
  }

  function updateDeviceInstructorFields() {
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorField.hidden = isEmployee;
    elements.employeeInstructorFields.hidden = !isEmployee;
    elements.externalInstructorName.required = !isEmployee;
    elements.employeeInstructor.required = isEmployee;
    if (isEmployee) {
      elements.externalInstructorName.setCustomValidity("");
    } else {
      elements.employeeInstructor.setCustomValidity("");
      elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    }
  }

  function filteredDeviceParticipants() {
    return [...state.employees]
      .filter(
        (employee) =>
          !deviceParticipantSearchTerm ||
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceParticipantSearchTerm),
      )
      .sort(compareDeviceInstructionEmployees);
  }

  function compareDeviceInstructionEmployees(a, b) {
    return (
      a.lastName.localeCompare(b.lastName, "de", { sensitivity: "base" }) ||
      a.firstName.localeCompare(b.firstName, "de", { sensitivity: "base" }) ||
      a.id.localeCompare(b.id)
    );
  }

  function deviceInstructionEmployeeOptionLabel(employee) {
    return [employee.lastName, employee.firstName].filter(Boolean).join(", ");
  }

  function renderDeviceParticipantList() {
    const employees = filteredDeviceParticipants();
    elements.deviceParticipantList.innerHTML = employees.length
      ? employees
          .map((employee) => {
            const selected = deviceParticipantDraft.has(employee.id);
            const wasMpo = deviceParticipantDraft.get(employee.id) || false;
            return `
              <div class="device-participant-row">
                <label class="selection-card">
                  <input
                    type="checkbox"
                    data-device-participant="${employee.id}"
                    ${selected ? "checked" : ""}
                  />
                  ${renderAvatar(employee, true)}
                  <span>
                    <strong>${escapeHtml(fullName(employee))}</strong>
                    <small>${escapeHtml(
                      EMPLOYMENT_STATUSES[employee.employmentStatus] ||
                        employee.employmentStatus,
                    )}</small>
                  </span>
                </label>
                <label class="device-mpo-toggle">
                  <input
                    type="checkbox"
                    data-device-participant-mpo="${employee.id}"
                    ${wasMpo ? "checked" : ""}
                    ${selected ? "" : "disabled"}
                  />
                  <span>MP-Beauftragte/r</span>
                </label>
              </div>
            `;
          })
          .join("")
      : '<p class="completion-empty">Keine Mitarbeiter für diese Suche gefunden.</p>';
    updateDeviceParticipantCount();
  }

  function handleDeviceParticipantChange(event) {
    const participantCheckbox = event.target.closest(
      "[data-device-participant]",
    );
    if (participantCheckbox) {
      const employee = getEmployee(participantCheckbox.dataset.deviceParticipant);
      if (!employee) return;
      if (participantCheckbox.checked) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      } else {
        deviceParticipantDraft.delete(employee.id);
      }
      elements.deviceParticipantError.textContent = "";
      renderDeviceParticipantList();
      return;
    }
    const mpoCheckbox = event.target.closest("[data-device-participant-mpo]");
    if (mpoCheckbox && deviceParticipantDraft.has(mpoCheckbox.dataset.deviceParticipantMpo)) {
      deviceParticipantDraft.set(
        mpoCheckbox.dataset.deviceParticipantMpo,
        mpoCheckbox.checked,
      );
      updateDeviceParticipantCount();
    }
  }

  function toggleVisibleDeviceParticipants() {
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    visibleEmployees.forEach((employee) => {
      if (allSelected) {
        deviceParticipantDraft.delete(employee.id);
      } else if (!deviceParticipantDraft.has(employee.id)) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      }
    });
    renderDeviceParticipantList();
  }

  function updateDeviceParticipantCount() {
    const count = deviceParticipantDraft.size;
    elements.deviceParticipantCount.textContent = `${count} ausgewählt`;
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    elements.toggleAllDeviceParticipants.textContent = allSelected
      ? "Sichtbare abwählen"
      : "Sichtbare auswählen";
  }

  async function handleDeviceInstructionSubmit(event) {
    event.preventDefault();
    const date = elements.deviceInstructionDate.value;
    elements.deviceInstructionDate.setCustomValidity(
      date && date > todayIso()
        ? "Das Einweisungsdatum darf nicht in der Zukunft liegen."
        : "",
    );
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorName.setCustomValidity(
      !isEmployee && !elements.externalInstructorName.value.trim()
        ? "Bitte den Namen des Einweisenden eingeben."
        : "",
    );
    const instructorConfirmationMissing =
      isEmployee && !elements.employeeInstructorMpoConfirmation.checked;
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.employeeInstructorMpoConfirmationError.textContent =
      instructorConfirmationMissing
        ? "Bitte bestätigen Sie den Status zum Einweisungszeitpunkt."
        : "";
    if (!elements.deviceInstructionForm.reportValidity()) return;
    if (instructorConfirmationMissing) {
      elements.employeeInstructorMpoConfirmation
        .closest(".device-instructor-confirmation")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      elements.employeeInstructorMpoConfirmation.focus({ preventScroll: true });
      return;
    }
    if (!deviceInstructionDeviceDraft.size) {
      elements.deviceInstructionDeviceError.textContent =
        "Bitte mindestens ein Gerät auswählen.";
      elements.deviceInstructionDeviceSearch.focus();
      return;
    }
    if (!deviceParticipantDraft.size) {
      elements.deviceParticipantError.textContent =
        "Bitte mindestens einen Einweisungsteilnehmer auswählen.";
      return;
    }
    const instructorEmployee = isEmployee
      ? getEmployee(elements.employeeInstructor.value)
      : null;
    if (isEmployee && !instructorEmployee) {
      elements.employeeInstructor.setCustomValidity(
        "Bitte eine einweisende Person auswählen.",
      );
      elements.employeeInstructor.reportValidity();
      return;
    }
    const instructionId = elements.deviceInstructionId.value;
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (item) => item.id === instructionId,
        )
      : null;
    // Alle ausgewaehlten Geraete erhalten denselben Nachweis - je Geraet ein
    // eigener Datensatz, damit Verlauf und Matrix unveraendert funktionieren.
    const gemeinsameAngaben = {
      date,
      instructorType: isEmployee ? "employee" : "manufacturer",
      instructorEmployeeId: instructorEmployee?.id || "",
      instructorName: instructorEmployee
        ? fullName(instructorEmployee)
        : elements.externalInstructorName.value.trim(),
      instructorWasMedicalProductsOfficer: isEmployee,
      participants: [...deviceParticipantDraft].map(
        ([employeeId, wasMedicalProductsOfficer]) => ({
          employeeId,
          wasMedicalProductsOfficer,
        }),
      ),
    };
    const erstellt = new Date().toISOString();
    const instructions = [...deviceInstructionDeviceDraft].map((deviceId) => ({
      id: existingInstruction?.id || createId(),
      deviceId,
      ...gemeinsameAngaben,
      createdAt: existingInstruction?.createdAt || erstellt,
    }));

    const committed = await commitStateMutation(() => {
      if (existingInstruction) {
        state.deviceInstructions = state.deviceInstructions.map((item) =>
          item.id === instructions[0].id ? instructions[0] : item,
        );
      } else {
        state.deviceInstructions.push(...instructions);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceInstructionForm);
    elements.deviceInstructionDialog.close();
    const teilnehmerzahl = gemeinsameAngaben.participants.length;
    const teilnehmerText = `${teilnehmerzahl} Mitarbeiter/in${
      teilnehmerzahl === 1 ? "" : "nen"
    }`;
    showToast(
      existingInstruction
        ? "Einweisung wurde aktualisiert."
        : instructions.length === 1
          ? `Einweisung wurde für ${teilnehmerText} gespeichert.`
          : `${instructions.length} Einweisungen wurden für ${teilnehmerText} gespeichert.`,
    );
  }

  function getEmployeeDeviceOverview(employeeId) {
    return [...state.devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      )
      .map((device) => {
        const instructions = state.deviceInstructions
          .filter(
            (instruction) =>
              instruction.deviceId === device.id &&
              instruction.participants.some(
                (participant) => participant.employeeId === employeeId,
              ),
          )
          .sort(
            (a, b) =>
              b.date.localeCompare(a.date) ||
              String(b.createdAt || "").localeCompare(
                String(a.createdAt || ""),
              ),
          );
        return {
          device,
          instructions,
          latestInstruction: instructions[0] || null,
          isInstructed: instructions.length > 0,
        };
      });
  }

  function getDeviceEmployeeOverview(deviceId) {
    return [...state.employees].sort(sortEmployees).map((employee) => {
      const instructions = state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.participants.some(
              (participant) => participant.employeeId === employee.id,
            ),
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        );
      return {
        employee,
        instructions,
        latestInstruction: instructions[0] || null,
        isInstructed: instructions.length > 0,
      };
    });
  }

  function filterDeviceEmployeeOverview(
    overview,
    {
      searchTerm = "",
      instructionFilter = "all",
      employmentFilter = "employed",
    } = {},
  ) {
    const normalizedSearch = String(searchTerm)
      .trim()
      .toLocaleLowerCase("de-DE");
    return overview.filter(({ employee, isInstructed }) => {
      if (instructionFilter === "instructed" && !isInstructed) return false;
      if (instructionFilter === "missing" && isInstructed) return false;
      if (
        employmentFilter === "employed" &&
        employee.employmentStatus === "inactive"
      ) {
        return false;
      }
      if (
        !["all", "employed"].includes(employmentFilter) &&
        employee.employmentStatus !== employmentFilter
      ) {
        return false;
      }
      return (
        !normalizedSearch ||
        [fullName(employee), employee.profession]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(normalizedSearch)
      );
    });
  }

  function openDeviceOverview(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    deviceOverviewDeviceId = device.id;
    deviceOverviewInstructionFilter = "all";
    deviceOverviewEmploymentFilter = "employed";
    deviceOverviewSearchTerm = "";
    elements.deviceOverviewSearch.value = "";
    elements.deviceOverviewInstructionFilter.value = "all";
    elements.deviceOverviewEmploymentFilter.value = "employed";
    elements.deviceOverviewTitle.textContent = device.productName;
    elements.deviceOverviewSubtitle.textContent = [
      device.manufacturer,
      device.category,
      device.currentInventory ? "aktueller Bestand" : "nicht mehr im Bestand",
    ].join(" · ");
    renderDeviceOverview();
    if (!elements.deviceOverviewDialog.open) {
      elements.deviceOverviewDialog.showModal();
    }
    window.setTimeout(() => elements.deviceOverviewSearch.focus(), 0);
  }

  function renderDeviceOverview() {
    const device = getDevice(deviceOverviewDeviceId);
    if (!device) return;
    const completeOverview = getDeviceEmployeeOverview(device.id);
    const overview = filterDeviceEmployeeOverview(completeOverview, {
      searchTerm: deviceOverviewSearchTerm,
      instructionFilter: deviceOverviewInstructionFilter,
      employmentFilter: deviceOverviewEmploymentFilter,
    });
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    const missingCount = overview.length - instructedCount;
    elements.deviceOverviewContent.innerHTML = `
      <div class="device-employee-overview-summary" aria-label="Zusammenfassung der gefilterten Mitarbeiter">
        <span><strong>${overview.length}</strong> sichtbar</span>
        <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
        <span class="is-missing"><strong>${missingCount}</strong> nicht eingewiesen</span>
      </div>
      ${
        overview.length
          ? `<div class="device-employee-overview-list">
              ${overview
                .map(({ employee, instructions, latestInstruction, isInstructed }) => {
                  const details = isInstructed
                    ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                    : "Für diese Person ist keine Einweisung dokumentiert.";
                  const content = `
                    ${renderAvatar(employee, true)}
                    <span class="device-employee-overview-device">
                      <strong>${escapeHtml(fullName(employee))}</strong>
                      <small>${escapeHtml(employee.profession)} · ${escapeHtml(employeeStatusLabel(employee))}</small>
                      <small>${details}</small>
                    </span>
                    <span class="status-badge ${isInstructed ? "" : "inactive"}">
                      ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                    </span>
                    ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
                  `;
                  return isInstructed
                    ? `<button
                        class="device-employee-overview-row"
                        type="button"
                        data-device-history-employee="${employee.id}"
                        data-device-history-device="${device.id}"
                        aria-label="Einweisungsverlauf für ${escapeHtml(fullName(employee))} anzeigen"
                      >${content}</button>`
                    : `<article class="device-employee-overview-row is-missing">${content}</article>`;
                })
                .join("")}
            </div>`
          : renderEmptyState({
              title: "Keine Mitarbeiter für diese Filter",
              text: "Ändern Sie die Suche oder die ausgewählten Statusfilter.",
              compact: true,
            })
      }
    `;
  }

  function openDeviceEmployeeOverview(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const overview = getEmployeeDeviceOverview(employeeId);
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    elements.deviceEmployeeOverviewTitle.textContent = fullName(employee);
    elements.deviceEmployeeOverviewSubtitle.textContent = overview.length
      ? `${instructedCount} von ${overview.length} Geräten mit dokumentierter Einweisung`
      : "Keine Geräte angelegt";
    elements.deviceEmployeeOverviewContent.innerHTML = overview.length
      ? `
        <div class="device-employee-overview-summary" aria-label="Zusammenfassung">
          <span><strong>${overview.length}</strong> Geräte gesamt</span>
          <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
          <span class="is-missing"><strong>${overview.length - instructedCount}</strong> nicht eingewiesen</span>
        </div>
        <div class="device-employee-overview-list">
          ${overview
            .map(({ device, instructions, latestInstruction, isInstructed }) => {
              const details = isInstructed
                ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                : "Für dieses Gerät ist keine Einweisung dokumentiert.";
              const content = `
                <span class="device-employee-overview-icon" aria-hidden="true">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span class="device-employee-overview-device">
                  <strong>${escapeHtml(deviceLabel(device))}</strong>
                  <small>${escapeHtml(device.category)}${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                  <small>${details}</small>
                </span>
                <span class="status-badge ${isInstructed ? "" : "inactive"}">
                  ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                </span>
                ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
              `;
              return isInstructed
                ? `
                  <button
                    class="device-employee-overview-row"
                    type="button"
                    data-device-history-employee="${employeeId}"
                    data-device-history-device="${device.id}"
                    aria-label="Einweisungsverlauf für ${escapeHtml(deviceLabel(device))} anzeigen"
                  >${content}</button>
                `
                : `<article class="device-employee-overview-row is-missing">${content}</article>`;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Noch keine Geräte",
          text: "Nach dem Anlegen eines Geräts erscheint hier der Einweisungsstatus.",
          compact: true,
        });
    if (!elements.deviceEmployeeOverviewDialog.open) {
      elements.deviceEmployeeOverviewDialog.showModal();
    }
  }

  function openDeviceInstructionHistory(employeeId, deviceId) {
    const employee = getEmployee(employeeId);
    const device = getDevice(deviceId);
    if (!employee || !device) return;
    const instructions = state.deviceInstructions
      .filter(
        (instruction) =>
          instruction.deviceId === deviceId &&
          instruction.participants.some(
            (participant) => participant.employeeId === employeeId,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    elements.deviceInstructionHistoryTitle.textContent = fullName(employee);
    elements.deviceInstructionHistorySubtitle.textContent = deviceLabel(device);
    elements.deviceInstructionHistoryContent.innerHTML = instructions.length
      ? `
        <div class="device-history-list">
          ${instructions
            .map((instruction) => {
              const participant = instruction.participants.find(
                (item) => item.employeeId === employeeId,
              );
              return `
                <article class="device-history-row">
                  <div>
                    <strong>${formatDate(instruction.date)}</strong>
                    <small>
                      Einweisende Person: ${escapeHtml(instruction.instructorName)}
                      · ${
                        instruction.instructorType === "employee"
                          ? "interne/r Medizinproduktebeauftragte/r"
                          : "von der Herstellerfirma beauftragt"
                      }
                    </small>
                  </div>
                  <span class="status-badge ${
                    participant?.wasMedicalProductsOfficer ? "onboarding" : ""
                  }">
                    ${
                      participant?.wasMedicalProductsOfficer
                        ? "Teilnehmer/in war MP-Beauftragte/r"
                        : "Teilnehmer/in ohne MP-Beauftragtenstatus"
                    }
                  </span>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisungsnachweis vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Nachweis löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Einweisungen",
          text: "Für diese Kombination sind keine Nachweise vorhanden.",
          compact: true,
        });
    applyAccessControl();
    if (!elements.deviceInstructionHistoryDialog.open) {
      elements.deviceInstructionHistoryDialog.showModal();
    }
  }

  function requestDeleteDeviceInstruction(instructionId) {
    const instruction = state.deviceInstructions.find(
      (item) => item.id === instructionId,
    );
    if (!instruction) return;
    requestConfirmation({
      title: "Einweisungsnachweis löschen?",
      message: `Die Einweisung vom ${formatDate(
        instruction.date,
      )} für ${instruction.participants.length} Teilnehmer/in${
        instruction.participants.length === 1 ? "" : "nen"
      } wird dauerhaft gelöscht.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.deviceInstructions = state.deviceInstructions.filter(
            (item) => item.id !== instructionId,
          );
        });
        if (!committed) return;
        if (elements.deviceInstructionHistoryDialog.open) {
          elements.deviceInstructionHistoryDialog.close();
        }
        showToast("Einweisungsnachweis wurde gelöscht.");
      },
    });
  }

  function deviceLabel(device) {
    return `${device.manufacturer} ${device.productName}`.trim();
  }
