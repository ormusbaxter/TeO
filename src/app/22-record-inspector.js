  // Schnellansicht für Termine, Memos und Geräte - dieselbe Bauform wie die
  // Mitarbeiter-Schnellansicht des Arbeitsplatzes: Ein Klick auf die Karte
  // öffnet rechts eine Übersicht mit den Eckdaten und den drei häufigsten
  // Aktionen, ohne dass ein Dialog die Liste verdeckt.
  //
  // Beschrieben wird je Datenart nur, was sie ausmacht; Aufbau, Auswahl,
  // Hervorhebung und Verlauf sind für alle gleich.
  const inspectedRecords = {};

  function recordInspectorDefinitions() {
    return {
      appointment: {
        view: "appointments",
        inspector: "#appointmentInspector",
        content: "#appointmentInspectorContent",
        container: "#appointmentWorkspace",
        icon: "icon-calendar",
        eyebrow: "Termin",
        find: (id) => state.appointments.find((entry) => entry.id === id),
        title: (appointment) => appointment.title,
        subtitle: (appointment) =>
          [formatDate(appointment.date), formatAppointmentTime(appointment)]
            .filter(Boolean)
            .join(" · "),
        facts: (appointment) => [
          ["Datum", formatDate(appointment.date)],
          ["Uhrzeit", formatAppointmentTime(appointment) || "Ganztägig"],
          ["Ort", appointment.location || "–"],
          ["Kategorie", appointmentCategoryLabel(appointment) || "Ohne Kategorie"],
          ["Wichtig", appointment.pinned ? "Angepinnt" : "Nein"],
          ["Teilnehmerliste", appointment.participantList ? "Ja" : "Nein"],
        ],
        sections: (appointment) => [
          { title: "Beschreibung", text: appointment.description || "Keine Beschreibung hinterlegt." },
        ],
        actions: (appointment) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openAppointmentDialog(appointment.id) },
          {
            label: "Kalender",
            icon: "icon-calendar",
            primary: true,
            run: () => showAppointmentInCalendar(appointment),
          },
        ],
      },
      memo: {
        view: "memos",
        inspector: "#memoInspector",
        content: "#memoInspectorContent",
        container: "#memoWorkspace",
        icon: "icon-memo",
        eyebrow: "Memo / ToDo",
        find: (id) => {
          const memo = getMemo(id);
          return memoVisibleToCurrentUser(memo) ? memo : null;
        },
        title: (memo) => memo.title,
        subtitle: (memo) => [memo.category || "Ohne Kategorie", formatDate(memo.date)].join(" · "),
        facts: (memo) => [
          ["Datum", formatDate(memo.date)],
          ["Kategorie", memo.category || "Ohne Kategorie"],
          ["Sichtbarkeit", memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle"],
          ["Status", memo.completed ? "Erledigt" : "Offen"],
          ["Wichtig", memo.pinned ? "Angepinnt" : "Nein"],
        ],
        sections: (memo) => [
          { title: "Beschreibung", text: memo.description || "Keine Beschreibung hinterlegt." },
        ],
        actions: (memo) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openMemoDialog(memo.id) },
          {
            label: memo.completed ? "Wieder öffnen" : "Erledigt",
            icon: "icon-check",
            primary: true,
            run: () => void toggleMemoCompleted(memo.id),
          },
        ],
      },
      device: {
        view: "device-management",
        inspector: "#deviceInspector",
        content: "#deviceInspectorContent",
        container: "#deviceWorkspace",
        icon: "icon-device",
        eyebrow: "Gerät",
        find: (id) => getDevice(id),
        title: (device) => deviceLabel(device),
        subtitle: (device) => device.category || "Ohne Kategorie",
        facts: (device) => [
          ["Hersteller", device.manufacturer],
          ["Produkt", device.productName],
          ["Kategorie", device.category || "–"],
          ["Anlage 1", device.annex1 ? "Ja" : "Nein"],
          ["Bestand", device.currentInventory ? "Aktuell" : "Nicht mehr im Bestand"],
          [
            "Eingewiesen",
            `${getDeviceInstructionPercentage(device.id, activeEmployeeList())} %`,
          ],
        ],
        sections: (device) => {
          const authorized = getDeviceAuthorizedEmployees(device.id);
          return [
            {
              title: "Einweisungsberechtigt",
              tags: authorized.length ? authorized.map(fullName) : ["Niemand hinterlegt"],
            },
          ];
        },
        actions: (device) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openDeviceDialog(device.id) },
          {
            label: "Übersicht",
            icon: "icon-eye",
            primary: true,
            run: () => openDeviceOverview(device.id),
          },
        ],
      },
    };
  }

  function bindRecordInspectors() {
    for (const [type, definition] of Object.entries(recordInspectorDefinitions())) {
      const container = document.querySelector(definition.container);
      container?.addEventListener("click", (event) => handleRecordCardActivation(type, event));
      container?.addEventListener("keydown", (event) => handleRecordCardActivation(type, event));
      document
        .querySelector(definition.inspector)
        ?.addEventListener("click", (event) => handleRecordInspectorAction(type, event));
    }
  }

  // Die Karte selbst öffnet die Schnellansicht; ihre Schaltflächen behalten
  // ihre Aufgabe. Mit der Tastatur gilt dasselbe über Eingabe und Leertaste.
  function handleRecordCardActivation(type, event) {
    const card = event.target.closest("[data-record-card]");
    if (!card) return;
    // Schaltflächen innerhalb der Karte behalten ihre Aufgabe. Ist die Karte
    // selbst eine Schaltfläche - so wie ein Eintrag im Monatsraster -, zählt
    // sie natürlich weiter als Karte.
    const control = event.target.closest("button, input, a, select, textarea");
    if (control && control !== card) return;
    if (event.type === "keydown") {
      // Eine Schaltfläche löst bei Eingabe und Leertaste selbst einen Klick
      // aus; ein zweiter Weg wäre einer zu viel.
      if (card.tagName === "BUTTON" || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
    }
    // Mit Strg oder Umschalt geht es um die Mehrfachauswahl, nicht um die
    // Schnellansicht.
    if (handleRecordSelectionClick(type, event, card.dataset.recordCard)) return;
    selectRecordInspector(type, card.dataset.recordCard);
  }

  function selectRecordInspector(type, id) {
    const definition = recordInspectorDefinitions()[type];
    if (!definition?.find(id)) return;
    inspectedRecords[type] = id;
    trackWorkspaceRecord(type, id);
    renderRecordInspector(type);
    highlightInspectedRecord(type);
  }

  function closeRecordInspector(type) {
    inspectedRecords[type] = "";
    renderRecordInspector(type);
    highlightInspectedRecord(type);
  }

  // Nach jedem Neuaufbau der Liste: Die Karten sind neu, die Hervorhebung muss
  // wieder gesetzt werden. Ist der Datensatz verschwunden - gelöscht oder
  // weggefiltert -, schließt sich die Schnellansicht.
  function refreshRecordInspector(type) {
    const definition = recordInspectorDefinitions()[type];
    if (!definition) return;
    if (inspectedRecords[type] && !definition.find(inspectedRecords[type])) {
      inspectedRecords[type] = "";
    }
    renderRecordInspector(type);
    highlightInspectedRecord(type);
    refreshRecordSelection(type);
  }

  function highlightInspectedRecord(type) {
    const definition = recordInspectorDefinitions()[type];
    document.querySelectorAll(`${definition.container} [data-record-card]`).forEach((card) => {
      card.classList.toggle("is-inspected", card.dataset.recordCard === inspectedRecords[type]);
    });
  }

  function renderRecordInspector(type) {
    const definition = recordInspectorDefinitions()[type];
    const inspector = document.querySelector(definition.inspector);
    const content = document.querySelector(definition.content);
    const record = inspectedRecords[type] ? definition.find(inspectedRecords[type]) : null;
    if (!inspector || !content) return;
    if (!record) {
      inspector.hidden = true;
      content.innerHTML = "";
      return;
    }

    const favorite = workspaceRecordIsFavorite(type, record.id);
    inspector.hidden = false;
    content.innerHTML = `
      <div class="record-inspector-header">
        <span class="record-inspector-icon"><svg><use href="#${definition.icon}"></use></svg></span>
        <div>
          <p class="eyebrow">${escapeHtml(definition.eyebrow)}</p>
          <h2>${escapeHtml(definition.title(record))}</h2>
          <small>${escapeHtml(definition.subtitle(record))}</small>
        </div>
        <button class="icon-button" type="button" data-inspector-close aria-label="Schnellansicht schließen">
          <svg><use href="#icon-close"></use></svg>
        </button>
      </div>
      <div class="record-inspector-actions">
        <button
          class="button button-secondary"
          type="button"
          data-inspector-favorite
          aria-pressed="${favorite}"
        >
          <svg><use href="#icon-star"></use></svg>${favorite ? "Angeheftet" : "Anheften"}
        </button>
        ${definition
          .actions(record)
          .map(
            (action, index) => `
              <button
                class="button ${action.primary ? "button-primary" : "button-secondary"}"
                type="button"
                data-inspector-action="${index}"
              >
                ${action.icon ? `<svg><use href="#${action.icon}"></use></svg>` : ""}${escapeHtml(action.label)}
              </button>
            `,
          )
          .join("")}
      </div>
      <dl class="record-inspector-facts">
        ${definition
          .facts(record)
          .map(
            ([label, value]) =>
              `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`,
          )
          .join("")}
      </dl>
      ${definition
        .sections(record)
        .map(
          (section) => `
            <section class="record-inspector-section">
              <h3>${escapeHtml(section.title)}</h3>
              ${
                section.tags
                  ? `<div class="qualification-tags">${section.tags
                      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                      .join("")}</div>`
                  : `<p class="record-inspector-text">${escapeHtml(section.text)}</p>`
              }
            </section>
          `,
        )
        .join("")}
    `;
  }

  function handleRecordInspectorAction(type, event) {
    const definition = recordInspectorDefinitions()[type];
    const record = inspectedRecords[type] ? definition.find(inspectedRecords[type]) : null;
    if (!record) return;

    if (event.target.closest("[data-inspector-close]")) {
      closeRecordInspector(type);
      return;
    }
    if (event.target.closest("[data-inspector-favorite]")) {
      toggleWorkspaceFavorite(type, record.id);
      renderRecordInspector(type);
      return;
    }
    const action = event.target.closest("[data-inspector-action]");
    if (action) definition.actions(record)[Number(action.dataset.inspectorAction)]?.run();
  }

  // „Im Kalender“ wechselt in die Monatsansicht und blättert zum Monat des
  // Termins - sonst zeigte der Kalender weiter irgendeinen anderen.
  function showAppointmentInCalendar(appointment) {
    const date = parseLocalDate(appointment.date);
    if (!date) return;
    setAppointmentViewMode("calendar");
    setAppointmentCalendarMonth(date.getFullYear(), date.getMonth() + 1);
  }
