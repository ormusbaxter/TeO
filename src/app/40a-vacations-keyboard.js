  // Reine Koordinatenrechnung. Bewusst ohne DOM, damit die Navigation ohne
  // Browserumgebung pruefbar bleibt.
  function nextPlannerPosition(position, key, bounds) {
    const row = clampPlannerIndex(position.row, bounds.rowCount);
    const column = clampPlannerIndex(position.column, bounds.columnCount);
    switch (key) {
      case "ArrowLeft":
        return { row, column: Math.max(0, column - 1) };
      case "ArrowRight":
        return { row, column: clampPlannerIndex(column + 1, bounds.columnCount) };
      case "ArrowUp":
        return { row: Math.max(0, row - 1), column };
      case "ArrowDown":
        return { row: clampPlannerIndex(row + 1, bounds.rowCount), column };
      case "Home":
        return { row, column: 0 };
      case "End":
        return { row, column: clampPlannerIndex(bounds.columnCount, bounds.columnCount) };
      default:
        return { row, column };
    }
  }

  function clampPlannerIndex(value, count) {
    return Math.min(Math.max(value, 0), Math.max(0, count - 1));
  }

  // Anker und aktuelles Feld spannen ein Rechteck auf, unabhaengig davon, in
  // welche Richtung markiert wurde.
  function plannerSelectionBounds(anchor, focus) {
    return {
      rowStart: Math.min(anchor.row, focus.row),
      rowEnd: Math.max(anchor.row, focus.row),
      columnStart: Math.min(anchor.column, focus.column),
      columnEnd: Math.max(anchor.column, focus.column),
    };
  }

  function plannerSelectionPositions(anchor, focus) {
    const bounds = plannerSelectionBounds(anchor, focus);
    const positions = [];
    for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
      for (
        let column = bounds.columnStart;
        column <= bounds.columnEnd;
        column += 1
      ) {
        positions.push({ row, column });
      }
    }
    return positions;
  }

  function plannerBounds() {
    return {
      rowCount: vacationVisibleEmployeeIds.length,
      columnCount: vacationVisibleDates.length,
    };
  }

  function plannerPositionOf(employeeId, date) {
    const row = vacationVisibleEmployeeIds.indexOf(employeeId);
    const column = vacationVisibleDates.indexOf(date);
    return row < 0 || column < 0 ? null : { row, column };
  }

  function plannerCoordinates(position) {
    return {
      employeeId: vacationVisibleEmployeeIds[position.row],
      date: vacationVisibleDates[position.column],
    };
  }

  function plannerCellButton(position) {
    const { employeeId, date } = plannerCoordinates(position);
    if (!employeeId || !date) return null;
    return elements.vacationPlanner.querySelector(
      `[data-vacation-employee="${employeeId}"][data-vacation-date="${date}"]`,
    );
  }

  function currentPlannerSelection() {
    if (!vacationFocus) return [];
    return plannerSelectionPositions(
      vacationSelectionAnchor || vacationFocus,
      vacationFocus,
    );
  }

  function applyVacationSelectionHighlight() {
    elements.vacationPlanner
      .querySelectorAll(".vacation-day-cell.is-selected")
      .forEach((cell) => cell.classList.remove("is-selected"));
    // Ein einzelnes Feld zeigt der Fokusrahmen an; hervorgehoben wird nur ein
    // wirklich aufgezogener Bereich.
    if (!vacationSelectionAnchor) return;
    currentPlannerSelection().forEach((position) => {
      plannerCellButton(position)?.closest("td")?.classList.add("is-selected");
    });
  }

  function focusVacationCell(position, { keepSelection = false } = {}) {
    const button = plannerCellButton(position);
    if (!button) return;
    vacationFocus = position;
    if (!keepSelection) vacationSelectionAnchor = null;
    button.focus();
    applyVacationSelectionHighlight();
  }

  // Das Neuzeichnen ersetzt die Tabelle vollstaendig, der Fokus faellt dabei
  // auf den Body zurueck. Nur dann wird er zurueckgeholt - liegt er inzwischen
  // im Suchfeld oder in einem Dialog, bleibt er dort.
  function restoreVacationFocus() {
    applyVacationSelectionHighlight();
    if (!vacationFocus) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    plannerCellButton(vacationFocus)?.focus({ preventScroll: true });
  }

  function handleVacationPlannerKeydown(event) {
    const button = event.target.closest(
      "[data-vacation-employee][data-vacation-date]",
    );
    if (!button || event.altKey || event.ctrlKey || event.metaKey) return;
    const position = plannerPositionOf(
      button.dataset.vacationEmployee,
      button.dataset.vacationDate,
    );
    if (!position) return;
    vacationFocus = position;

    if (PLANNER_NAVIGATION_KEYS.includes(event.key)) {
      event.preventDefault();
      if (event.shiftKey && !vacationSelectionAnchor) {
        vacationSelectionAnchor = position;
      }
      focusVacationCell(nextPlannerPosition(position, event.key, plannerBounds()), {
        keepSelection: event.shiftKey,
      });
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      shiftVacationMonth(event.key === "PageUp" ? -1 : 1, position);
      return;
    }

    if (event.key === "Escape" && vacationSelectionAnchor) {
      event.preventDefault();
      vacationSelectionAnchor = null;
      applyVacationSelectionHighlight();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void applyVacationEntryToSelection("");
      return;
    }

    const key = event.key.toLocaleLowerCase("de-DE");
    if (!Object.hasOwn(PLANNER_ENTRY_KEYS, key)) return;
    event.preventDefault();
    void applyVacationEntryToSelection(PLANNER_ENTRY_KEYS[key]);
  }

  function shiftVacationMonth(offset, position) {
    const target = new Date(vacationYear, vacationMonth - 1 + offset, 1, 12);
    vacationYear = target.getFullYear();
    vacationMonth = target.getMonth() + 1;
    saveVacationViewPreference();
    // Der Tag im Monat entspricht dem Spaltenindex; kuerzere Monate werden
    // abgeschnitten.
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const nextPosition = position || vacationFocus || { row: 0, column: 0 };
    vacationFocus = {
      row: nextPosition.row,
      column: Math.min(nextPosition.column, daysInMonth - 1),
    };
    vacationSelectionAnchor = null;
    renderVacationPlanner();
  }

  // Buchstaben weisen zu, statt umzuschalten: Beim Durchtippen einer Reihe
  // waere ein Umschalten bei gleicher Eintragsart unerwartet. Entfernt wird
  // ausschliesslich mit Entf oder Rücktaste.
  async function applyVacationEntryToSelection(entryType) {
    const cells = currentPlannerSelection()
      .map(plannerCoordinates)
      .filter((cell) => cell.employeeId && cell.date);
    if (!cells.length) return;

    // Die Eintragsart der Steuerleiste zieht mit, damit Klick und Taste
    // dieselbe Auswahl verwenden.
    if (entryType) {
      vacationEntryType = entryType;
      elements.vacationEntryType.value = entryType;
    }

    const changed = cells.filter((cell) => {
      const existing = findVacationDay(cell.employeeId, cell.date);
      return entryType ? existing?.type !== entryType : Boolean(existing);
    });
    if (!changed.length) return;

    const now = new Date().toISOString();
    const scrollPosition = captureVacationScrollPosition();
    const committed = await commitStateMutation(() => {
      const removableIds = new Set();
      changed.forEach((cell) => {
        const existing = findVacationDay(cell.employeeId, cell.date);
        if (!entryType) {
          if (existing) removableIds.add(existing.id);
          return;
        }
        if (existing) {
          existing.type = entryType;
          existing.updatedAt = now;
          return;
        }
        state.vacationDays.push({
          id: createId(),
          employeeId: cell.employeeId,
          date: cell.date,
          type: entryType,
          createdAt: now,
          updatedAt: now,
        });
      });
      if (removableIds.size) {
        state.vacationDays = state.vacationDays.filter(
          (vacationDay) => !removableIds.has(vacationDay.id),
        );
      }
    });
    restoreVacationScrollPosition(scrollPosition);
    if (!committed) return;
    warnAboutVacationLimit([...new Set(changed.map((cell) => cell.date))]);
  }

  // Die Urlaubsmatrix befragt denselben Bestand aus drei Richtungen: je Tag
  // fuer die Tagesgrenze, je Mitarbeiter und Tag fuer den Zelleninhalt und je
  // Mitarbeiter fuer den Jahresverbrauch. Ohne Vorsortierung durchsucht jede
  // dieser Fragen den gesamten Bestand; bei einer gefuellten Jahresplanung
  // summiert sich das zu Millionen Vergleichen je Aufbau der Ansicht.
  //
  // Der Zwischenspeicher folgt derselben Regel wie indexById: Er gilt, solange
  // Feld und Laenge unveraendert sind. Eintraege werden ausschliesslich per
  // push ergaenzt oder per filter entfernt, beides faellt dadurch auf.
  const vacationIndexes = new WeakMap();

  // Fadenkreuz: Zeile und Spalte des Tagesfelds unter dem Zeiger oder mit dem
  // Tastaturfokus werden hervorgehoben. Gesetzt wird nur, was sich aendert -
  // beim Ueberstreichen der Tabelle feuert pointerover fuer jedes Feld.
  let vacationCrosshair = { employeeId: "", date: "" };

  function handleVacationCrosshair(event) {
    const cell = event.target.closest?.("[data-vacation-employee][data-vacation-date]");
    if (!cell) {
      // Ueber Kopf, Namen oder Summen bleibt das Kreuz stehen; erst das
      // Verlassen der Tabelle loest es.
      return;
    }
    setVacationCrosshair({
      employeeId: cell.dataset.vacationEmployee,
      date: cell.dataset.vacationDate,
    });
  }

  function setVacationCrosshair(target) {
    const next = target || { employeeId: "", date: "" };
    const planner = elements.vacationPlanner;
    const rowChanged = next.employeeId !== vacationCrosshair.employeeId;
    const columnChanged = next.date !== vacationCrosshair.date;
    // Nach einem Neuaufbau der Tabelle sind die Markierungen weg, der
    // gemerkte Stand aber nicht - dann alles neu setzen.
    const stale = !planner.querySelector(".is-crosshair-row, .is-crosshair-column");
    if (!rowChanged && !columnChanged && !stale) return;

    if (rowChanged || stale) {
      planner
        .querySelectorAll(".is-crosshair-row")
        .forEach((element) => element.classList.remove("is-crosshair-row"));
      if (next.employeeId) {
        planner
          .querySelector(`[data-vacation-employee="${next.employeeId}"]`)
          ?.closest("tr")
          ?.classList.add("is-crosshair-row");
      }
    }
    if (columnChanged || stale) {
      planner
        .querySelectorAll(".is-crosshair-column")
        .forEach((element) => element.classList.remove("is-crosshair-column"));
      if (next.date) {
        planner
          .querySelectorAll(
            `[data-vacation-column-date="${next.date}"], [data-vacation-date="${next.date}"]`,
          )
          .forEach((element) =>
            (element.closest("td") || element).classList.add("is-crosshair-column"),
          );
      }
    }
    vacationCrosshair = next;
  }

