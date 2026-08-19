  // Tabellenkomfort: Zeilendichte, Spaltenwahl und Mehrfachauswahl.
  //
  // Alle drei sind persönliche Arbeitsweisen und liegen deshalb im
  // Browserprofil, nicht im geteilten Datenbestand.
  const TABLE_DENSITY_KEY = "teo-table-density-v1";
  const EMPLOYEE_COLUMN_KEY = "teo-employee-columns-v1";

  // Name, Auswahl und Aktionen stehen immer; diese fünf sind wählbar.
  const EMPLOYEE_COLUMNS = Object.freeze([
    { key: "profession", label: "Beruf" },
    { key: "employment", label: "Umfang" },
    { key: "qualifications", label: "Qualifikationen" },
    { key: "trainings", label: "Fortbildungen" },
    { key: "status", label: "Status" },
  ]);

  let hiddenEmployeeColumns = new Set();
  // Die zuletzt angeklickte Zeile - Ausgangspunkt für die Auswahl mit
  // Umschalttaste.
  let lastEmployeeSelectionIndex = -1;
  let employeeSelectionShiftPressed = false;

  function visibleEmployeeColumns() {
    return EMPLOYEE_COLUMNS.filter((column) => !hiddenEmployeeColumns.has(column.key));
  }

  function bindTableComfort() {
    applyTableDensity(readStoredTableDensity());
    hiddenEmployeeColumns = readStoredHiddenEmployeeColumns();

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

    // Ob die Umschalttaste gedrueckt war, steht nur am Klick - das
    // change-Ereignis der Auswahlkaestchen kennt keine Zusatztasten. Der Klick
    // kommt zuerst, deshalb liegt die Antwort bereit, wenn change eintrifft.
    elements.employeeTable?.addEventListener("click", (event) => {
      if (event.target.closest("[data-select-employee]")) {
        employeeSelectionShiftPressed = event.shiftKey;
      }
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
    elements.employeeColumnsList.innerHTML = EMPLOYEE_COLUMNS.map(
      (column) => `
        <label class="checkbox-field">
          <input
            type="checkbox"
            data-employee-column="${column.key}"
            ${hiddenEmployeeColumns.has(column.key) ? "" : "checked"}
          />
          <span>${escapeHtml(column.label)}</span>
        </label>
      `,
    ).join("");
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
