  // Tabellenkomfort: Zeilendichte, Spaltenwahl und Mehrfachauswahl.
  //
  // Alle drei sind persönliche Arbeitsweisen und liegen deshalb im
  // Browserprofil, nicht im geteilten Datenbestand.
  const TABLE_DENSITY_KEY = "teo-table-density-v1";
  const EMPLOYEE_COLUMN_KEY = "teo-employee-columns-v1";
  const EMPLOYEE_COLUMN_ORDER_KEY = "teo-employee-column-order-v1";
  const EMPLOYEE_PINNED_COLUMN_KEY = "teo-employee-pinned-column-v1";
  const EMPLOYEE_COLUMN_WIDTHS_KEY = "teo-employee-column-widths-v1";

  // Name, Auswahl und Aktionen stehen immer; diese fünf sind wählbar.
  const EMPLOYEE_COLUMNS = Object.freeze([
    { key: "profession", label: "Beruf" },
    { key: "employment", label: "Umfang" },
    { key: "qualifications", label: "Qualifikationen" },
    { key: "trainings", label: "Fortbildungen" },
    { key: "status", label: "Status" },
  ]);

  let hiddenEmployeeColumns = new Set();
  let employeeColumnOrder = EMPLOYEE_COLUMNS.map((column) => column.key);
  let pinnedEmployeeColumn = "";
  let employeeColumnWidths = {};
  // Die zuletzt angeklickte Zeile - Ausgangspunkt für die Auswahl mit
  // Umschalttaste.
  let lastEmployeeSelectionIndex = -1;
  let employeeSelectionShiftPressed = false;

  function visibleEmployeeColumns() {
    return employeeColumnOrder
      .map((key) => EMPLOYEE_COLUMNS.find((column) => column.key === key))
      .filter((column) => column && !hiddenEmployeeColumns.has(column.key));
  }

  function bindTableComfort() {
    applyTableDensity(readStoredTableDensity());
    hiddenEmployeeColumns = readStoredHiddenEmployeeColumns();
    readEmployeeGridPreferences();

    elements.tableDensityToggle?.addEventListener("change", (event) => {
      const density = event.target.checked ? "compact" : "comfortable";
      applyTableDensity(density);
      try {
        localStorage.setItem(TABLE_DENSITY_KEY, density);
      } catch (error) {
        console.warn("Die Zeilendichte konnte nicht gespeichert werden.", error);
      }
    });

    elements.openEmployeeColumnsButton?.addEventListener("click", openEmployeeColumnsDialog);
    elements.employeeColumnsList?.addEventListener("change", handleEmployeeColumnChange);
    elements.employeeColumnsList?.addEventListener("click", handleEmployeeColumnOrderAction);

    // Ob die Umschalttaste gedrueckt war, steht nur am Klick - das
    // change-Ereignis der Auswahlkaestchen kennt keine Zusatztasten. Der Klick
    // kommt zuerst, deshalb liegt die Antwort bereit, wenn change eintrifft.
    elements.employeeTable?.addEventListener("click", (event) => {
      if (!event.target.closest("[data-select-employee]")) return;
      employeeSelectionShiftPressed = event.shiftKey;
      // Ein Umschalt-Klick markiert im Browser sonst alles zwischen den beiden
      // Kästchen - gemeint war die Zeilenauswahl, nicht der Text.
      if (event.shiftKey) window.getSelection()?.removeAllRanges();
    });
  }

  function takeEmployeeSelectionShift() {
    const pressed = employeeSelectionShiftPressed;
    employeeSelectionShiftPressed = false;
    return pressed;
  }

  function applyTableDensity(density) {
    const compact = density === "compact";
    document.body.classList.toggle("is-compact-tables", compact);
    if (elements.tableDensityToggle) elements.tableDensityToggle.checked = compact;
  }

  function readStoredTableDensity() {
    try {
      return localStorage.getItem(TABLE_DENSITY_KEY) === "compact" ? "compact" : "comfortable";
    } catch (error) {
      console.warn("Die gespeicherte Zeilendichte ist unlesbar.", error);
      return "comfortable";
    }
  }

  function readStoredHiddenEmployeeColumns() {
    try {
      const stored = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_KEY) || "[]");
      const known = new Set(EMPLOYEE_COLUMNS.map((column) => column.key));
      return new Set((Array.isArray(stored) ? stored : []).filter((key) => known.has(key)));
    } catch (error) {
      console.warn("Die gespeicherte Spaltenwahl ist unlesbar.", error);
      return new Set();
    }
  }

  function openEmployeeColumnsDialog() {
    elements.employeeColumnsList.innerHTML = employeeColumnOrder.map((key) => EMPLOYEE_COLUMNS.find((column) => column.key === key)).filter(Boolean).map(
      (column) => `
        <div class="column-choice-row">
          <label class="checkbox-field">
            <input type="checkbox" data-employee-column="${column.key}" ${hiddenEmployeeColumns.has(column.key) ? "" : "checked"} />
            <span>${escapeHtml(column.label)}</span>
          </label>
          <label class="column-pin-choice" title="Spalte beim horizontalen Scrollen fixieren">
            <input type="radio" name="employeePinnedColumn" data-pin-employee-column="${column.key}" ${pinnedEmployeeColumn === column.key ? "checked" : ""} />
            <span>Fixieren</span>
          </label>
          <span class="column-order-actions">
            <button class="icon-button" type="button" data-move-employee-column="${column.key}" data-direction="up" aria-label="${escapeHtml(column.label)} nach links"><span aria-hidden="true">←</span></button>
            <button class="icon-button" type="button" data-move-employee-column="${column.key}" data-direction="down" aria-label="${escapeHtml(column.label)} nach rechts"><span aria-hidden="true">→</span></button>
          </span>
        </div>
      `,
    ).join("") + `<button class="button button-ghost column-unpin-button" type="button" data-unpin-employee-column>Fixierung aufheben</button>`;
    elements.employeeColumnsDialog.showModal();
  }

  function handleEmployeeColumnChange(event) {
    const checkbox = event.target.closest("[data-employee-column]");
    if (!checkbox) return;
    const key = checkbox.dataset.employeeColumn;

    if (checkbox.checked) hiddenEmployeeColumns.delete(key);
    else hiddenEmployeeColumns.add(key);

    // Ganz ohne Spalte bliebe eine Namensliste - das ist erlaubt, aber die
    // Sortierung muss dann auf den Namen zurückfallen, sonst sortierte die
    // Tabelle nach einer Spalte, die niemand mehr sieht.
    if (hiddenEmployeeColumns.has(employeeSortKey)) employeeSortKey = "name";

    try {
      localStorage.setItem(EMPLOYEE_COLUMN_KEY, JSON.stringify([...hiddenEmployeeColumns]));
    } catch (error) {
      console.warn("Die Spaltenwahl konnte nicht gespeichert werden.", error);
    }
    renderEmployees();
  }

  function readEmployeeGridPreferences() {
    try {
      const storedOrder = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_ORDER_KEY) || "[]");
      const known = EMPLOYEE_COLUMNS.map((column) => column.key);
      if (Array.isArray(storedOrder)) {
        employeeColumnOrder = [...storedOrder.filter((key) => known.includes(key)), ...known.filter((key) => !storedOrder.includes(key))];
      }
      const storedPinned = localStorage.getItem(EMPLOYEE_PINNED_COLUMN_KEY) || "";
      pinnedEmployeeColumn = known.includes(storedPinned) ? storedPinned : "";
      const widths = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_WIDTHS_KEY) || "{}");
      employeeColumnWidths = widths && typeof widths === "object" ? widths : {};
    } catch (error) {
      console.warn("Die Tabellenanordnung konnte nicht gelesen werden.", error);
    }
  }

  function storeEmployeeGridPreferences() {
    try {
      localStorage.setItem(EMPLOYEE_COLUMN_ORDER_KEY, JSON.stringify(employeeColumnOrder));
      localStorage.setItem(EMPLOYEE_PINNED_COLUMN_KEY, pinnedEmployeeColumn);
      localStorage.setItem(EMPLOYEE_COLUMN_WIDTHS_KEY, JSON.stringify(employeeColumnWidths));
    } catch (error) {
      console.warn("Die Tabellenanordnung konnte nicht gespeichert werden.", error);
    }
  }

  function handleEmployeeColumnOrderAction(event) {
    const unpin = event.target.closest("[data-unpin-employee-column]");
    if (unpin) {
      pinnedEmployeeColumn = "";
      storeEmployeeGridPreferences();
      openEmployeeColumnsDialog();
      renderEmployees();
      return;
    }
    const move = event.target.closest("[data-move-employee-column]");
    if (move) {
      const index = employeeColumnOrder.indexOf(move.dataset.moveEmployeeColumn);
      const target = index + (move.dataset.direction === "up" ? -1 : 1);
      if (index >= 0 && target >= 0 && target < employeeColumnOrder.length) {
        [employeeColumnOrder[index], employeeColumnOrder[target]] = [employeeColumnOrder[target], employeeColumnOrder[index]];
        storeEmployeeGridPreferences();
        openEmployeeColumnsDialog();
        renderEmployees();
      }
      return;
    }
    const pin = event.target.closest("[data-pin-employee-column]");
    if (pin) {
      pinnedEmployeeColumn = pin.dataset.pinEmployeeColumn;
      storeEmployeeGridPreferences();
      renderEmployees();
    }
  }

  function employeeColumnStyle(key) {
    const width = Number(employeeColumnWidths[key]);
    return Number.isFinite(width) && width >= 80
      ? dynamicStyle({ "--employee-column-width": `${width}px` })
      : "";
  }

  function setEmployeeColumnWidth(key, width) {
    employeeColumnWidths[key] = Math.max(80, Math.min(520, Math.round(width)));
    storeEmployeeGridPreferences();
  }

  function employeeTableStyle() {
    const nameWidth = Number(employeeColumnWidths.name);
    return Number.isFinite(nameWidth) && nameWidth >= 80
      ? dynamicStyle({ "--employee-name-width": `${nameWidth}px` })
      : "";
  }

  // Umschalt-Klick wählt von der zuletzt angeklickten Zeile bis zur jetzigen -
  // wie in einer Dateiliste. Maßgeblich ist die gezeigte Reihenfolge, nicht die
  // im Datenbestand.
  function applyEmployeeSelectionRange(employeeId, checked) {
    const visible = filteredEmployeesForTable();
    const index = visible.findIndex((employee) => employee.id === employeeId);
    if (index < 0) return false;
    if (lastEmployeeSelectionIndex < 0 || lastEmployeeSelectionIndex >= visible.length) {
      lastEmployeeSelectionIndex = index;
      return false;
    }

    const [from, to] = [lastEmployeeSelectionIndex, index].sort((a, b) => a - b);
    visible.slice(from, to + 1).forEach((employee) => {
      if (checked) selectedEmployeeIds.add(employee.id);
      else selectedEmployeeIds.delete(employee.id);
    });
    lastEmployeeSelectionIndex = index;
    return true;
  }

  function rememberEmployeeSelectionAnchor(employeeId) {
    lastEmployeeSelectionIndex = filteredEmployeesForTable().findIndex(
      (employee) => employee.id === employeeId,
    );
  }
