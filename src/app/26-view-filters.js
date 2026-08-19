  // Aktive Filter als Chips - und die Möglichkeit, eine Einstellung zu merken.
  //
  // Die Chips sind bewusst nur eine Sicht auf die vorhandenen Bedienelemente:
  // Sie lesen ihre Beschriftung aus Schaltfläche, Auswahlfeld oder Suchfeld und
  // setzen zum Entfernen genau dort den Standardwert - mit demselben Ereignis,
  // das auch eine Bedienung von Hand auslöst. So gibt es keinen zweiten Ort,
  // an dem Filterzustände gepflegt werden müssten.
  const VIEW_FILTER_KEY = "teo-view-filters-v1";

  function viewFilterControls() {
    return {
      employees: [
        { kind: "search", element: elements.employeeSearch, label: "Suche" },
        { kind: "segmented", attribute: "data-status-filter", label: "Status", fallback: "all" },
        { kind: "select", element: elements.employeeProfessionFilter, label: "Beruf" },
        {
          kind: "select",
          element: elements.employeeQualificationFilter,
          label: "Qualifikation",
        },
        { kind: "select", element: elements.employeeWeekendFilter, label: "Dienstwochenende" },
      ],
      appointments: [
        { kind: "search", element: elements.appointmentSearch, label: "Suche" },
        {
          kind: "segmented",
          attribute: "data-appointment-filter",
          label: "Zeitraum",
          fallback: "all",
        },
      ],
      memos: [
        { kind: "search", element: elements.memoSearch, label: "Suche" },
        { kind: "select", element: elements.memoCategoryFilter, label: "Kategorie" },
        {
          kind: "segmented",
          attribute: "data-memo-status",
          label: "Status",
          fallback: "open",
        },
      ],
      devices: [
        { kind: "search", element: elements.deviceSearch, label: "Suche" },
        {
          kind: "select",
          element: elements.deviceInventoryFilter,
          label: "Gerätebestand",
          fallback: "current",
        },
        { kind: "select", element: elements.deviceAnnexFilter, label: "Anlage 1" },
        { kind: "select", element: elements.deviceCategoryFilter, label: "Gerätekategorie" },
        {
          kind: "select",
          element: elements.deviceEmployeeStatusFilter,
          label: "Mitarbeiterstatus",
          fallback: "employed",
        },
        { kind: "search", element: elements.deviceEmployeeSearch, label: "Mitarbeiter" },
      ],
      "device-management": [
        { kind: "search", element: elements.deviceManagementSearch, label: "Suche" },
        {
          kind: "select",
          element: elements.deviceManagementInventoryFilter,
          label: "Gerätebestand",
          fallback: "current",
        },
        { kind: "select", element: elements.deviceManagementAnnexFilter, label: "Anlage 1" },
        {
          kind: "select",
          element: elements.deviceManagementCategoryFilter,
          label: "Gerätekategorie",
        },
        {
          kind: "select",
          element: elements.deviceManagementAuthorizationFilter,
          label: "Einweisungsberechtigung",
        },
      ],
    };
  }

  // Der Standardwert eines Filters: das, was „kein Filter“ bedeutet.
  function viewFilterFallback(control) {
    return control.fallback || "all";
  }

  function viewFilterValue(control) {
    if (control.kind === "segmented") {
      return (
        document.querySelector(`[${control.attribute}].is-active`)?.getAttribute(control.attribute) ||
        viewFilterFallback(control)
      );
    }
    return control.element?.value ?? "";
  }

  // Was der Chip zeigt: bei Auswahlfeldern die gewählte Zeile, bei
  // Schaltflächen ihre Beschriftung, bei der Suche das Eingetippte.
  function viewFilterDisplay(control) {
    if (control.kind === "search") return control.element?.value.trim() || "";
    if (control.kind === "segmented") {
      const active = document.querySelector(`[${control.attribute}].is-active`);
      if (!active || active.getAttribute(control.attribute) === viewFilterFallback(control)) {
        return "";
      }
      return active.textContent.trim();
    }
    const select = control.element;
    if (!select || select.value === viewFilterFallback(control)) return "";
    return select.selectedOptions[0]?.textContent.trim() || select.value;
  }

  // Zurücksetzen heißt: das Bedienelement auf den Standard stellen und das
  // Ereignis auslösen, auf das die Ansicht ohnehin hört.
  function clearViewFilter(control) {
    if (control.kind === "segmented") {
      document
        .querySelector(`[${control.attribute}="${viewFilterFallback(control)}"]`)
        ?.click();
      return;
    }
    if (!control.element) return;
    if (control.kind === "search") {
      control.element.value = "";
      control.element.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    control.element.value = viewFilterFallback(control);
    control.element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applyViewFilterValue(control, value) {
    if (control.kind === "segmented") {
      document.querySelector(`[${control.attribute}="${value}"]`)?.click();
      return;
    }
    if (!control.element) return;
    if (control.kind === "select" && !control.element.querySelector(`option[value="${value}"]`)) {
      // Ein Beruf oder eine Kategorie kann inzwischen entfallen sein.
      return;
    }
    control.element.value = value;
    control.element.dispatchEvent(
      new Event(control.kind === "search" ? "input" : "change", { bubbles: true }),
    );
  }

  function renderViewFilterChips(view) {
    const container = document.querySelector(`[data-filter-chips="${view}"]`);
    const controls = viewFilterControls()[view];
    if (!container || !controls) return;

    const active = controls
      .map((control, index) => ({ control, index, display: viewFilterDisplay(control) }))
      .filter((entry) => entry.display);
    const remembered = Boolean(storedViewFilters()[view]);

    container.hidden = !active.length && !remembered;
    if (container.hidden) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <span class="filter-chip-label">${active.length ? "Aktive Filter" : "Keine Filter aktiv"}</span>
      ${active
        .map(
          (entry) => `
            <button
              class="filter-chip"
              type="button"
              data-clear-filter="${entry.index}"
              title="${escapeHtml(`${entry.control.label}-Filter entfernen`)}"
            >
              <span>${escapeHtml(entry.control.label)}: <strong>${escapeHtml(entry.display)}</strong></span>
              <svg aria-hidden="true"><use href="#icon-close"></use></svg>
            </button>
          `,
        )
        .join("")}
      <button class="filter-chip-remember" type="button" data-remember-filters>
        <svg aria-hidden="true"><use href="#icon-${remembered ? "trash" : "star"}"></use></svg>
        ${remembered ? "Gemerkte Ansicht aufheben" : "Ansicht merken"}
      </button>
    `;
  }

  function handleViewFilterChipClick(event) {
    const container = event.target.closest("[data-filter-chips]");
    if (!container) return;
    const view = container.dataset.filterChips;
    const controls = viewFilterControls()[view];
    if (!controls) return;

    const chip = event.target.closest("[data-clear-filter]");
    if (chip) {
      clearViewFilter(controls[Number(chip.dataset.clearFilter)]);
      renderViewFilterChips(view);
      return;
    }

    if (event.target.closest("[data-remember-filters]")) toggleRememberedView(view, controls);
  }

  function storedViewFilters() {
    try {
      const stored = JSON.parse(localStorage.getItem(VIEW_FILTER_KEY) || "{}");
      return stored && typeof stored === "object" ? stored : {};
    } catch (error) {
      console.warn("Die gemerkten Ansichten sind unlesbar.", error);
      return {};
    }
  }

  function writeStoredViewFilters(value) {
    try {
      localStorage.setItem(VIEW_FILTER_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn("Die gemerkte Ansicht konnte nicht gespeichert werden.", error);
    }
  }

  // Gemerkt wird im Browserprofil, nicht im Datenbestand: Ein Filter ist eine
  // persönliche Arbeitsweise und geht andere Arbeitsplätze nichts an.
  function toggleRememberedView(view, controls) {
    const stored = storedViewFilters();
    if (stored[view]) {
      delete stored[view];
      writeStoredViewFilters(stored);
      showToast("Die gemerkte Ansicht wurde aufgehoben.");
    } else {
      stored[view] = controls.map((control) => viewFilterValue(control));
      writeStoredViewFilters(stored);
      showToast("Diese Ansicht wird beim nächsten Start wiederhergestellt.");
    }
    renderViewFilterChips(view);
  }

  // Beim Start: Erst nachdem die Ansichten einmal aufgebaut sind, stehen in den
  // Auswahlfeldern die Berufe und Kategorien - vorher ginge ein gemerkter Wert
  // ins Leere.
  function restoreRememberedViewFilters() {
    const stored = storedViewFilters();
    const controls = viewFilterControls();
    for (const [view, values] of Object.entries(stored)) {
      if (!Array.isArray(values) || !controls[view]) continue;
      controls[view].forEach((control, index) => {
        const value = values[index];
        if (value === undefined || value === viewFilterValue(control)) return;
        applyViewFilterValue(control, value);
      });
      renderViewFilterChips(view);
    }
  }

  function bindViewFilterChips() {
    document.querySelectorAll("[data-filter-chips]").forEach((container) => {
      container.addEventListener("click", handleViewFilterChipClick);
    });
  }
