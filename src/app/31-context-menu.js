  // Kontextmenü der rechten Maustaste - für Mitarbeiterzeilen und für die
  // Karten der Termine, Memos und Geräte.
  //
  // Es zeigt, was mit genau diesem Eintrag geht; ist er Teil einer Auswahl,
  // stehen stattdessen die Sammelaktionen darin. Damit hat die Auswahl neben
  // der Leiste einen zweiten, näherliegenden Weg.
  let contextMenuItems = [];

  function bindContextMenu() {
    document.addEventListener("contextmenu", handleContextMenuRequest);
    // pointerdown statt click: Auch ein Rechtsklick daneben schliesst das
    // offene Menue, und er tut es, bevor das neue aufgebaut wird.
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#contextMenu")) closeContextMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || elements.contextMenu?.hidden !== false) return;
      // Vorrang vor allem anderen, was Esc sonst tut - das Menue liegt obenauf.
      event.preventDefault();
      event.stopPropagation();
      closeContextMenu();
    }, true);
    document.addEventListener("scroll", closeContextMenu, true);
    elements.contextMenu?.addEventListener("click", handleContextMenuChoice);
  }

  function handleContextMenuRequest(event) {
    closeContextMenu();
    if (document.querySelector("dialog[open]")) return;
    const items = contextMenuItemsFor(event.target);
    if (!items.length) return;
    event.preventDefault();
    openContextMenu(items, event);
  }

  function contextMenuItemsFor(target) {
    const row = target.closest?.("[data-employee-row]");
    if (row) return employeeContextMenuItems(row.dataset.employeeRow);

    const card = target.closest?.("[data-record-card]");
    if (!card) return [];
    const type = recordTypeOfCard(card);
    return type ? recordContextMenuItems(type, card.dataset.recordCard) : [];
  }

  // Die Karte allein sagt nicht, um welche Datenart es geht - der Bereich, in
  // dem sie steht, schon.
  function recordTypeOfCard(card) {
    return (
      Object.entries(recordInspectorDefinitions()).find(([, definition]) =>
        card.closest(definition.container),
      )?.[0] || ""
    );
  }

  function employeeContextMenuItems(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return [];
    if (selectedEmployeeIds.size > 1 && selectedEmployeeIds.has(employeeId)) {
      return [
        { label: `${selectedEmployeeIds.size} Mitarbeiter bearbeiten`, icon: "icon-edit", run: openBulkEditDialog },
        {
          label: `${selectedEmployeeIds.size} Mitarbeiter löschen`,
          icon: "icon-trash",
          danger: true,
          run: () => deleteEmployees([...selectedEmployeeIds]),
        },
        { label: "Auswahl aufheben", icon: "icon-close", run: clearEmployeeSelection },
      ];
    }
    return [
      { label: "Schnellansicht", icon: "icon-eye", run: () => selectEmployeeInspector(employeeId) },
      { label: "Bearbeiten", icon: "icon-edit", run: () => openEmployeeDialog(employeeId) },
      { label: "Gesamtakte", icon: "icon-clipboard-check", run: () => openEmployeeDossier(employeeId) },
      { label: "Löschen", icon: "icon-trash", danger: true, run: () => requestDeleteEmployee(employeeId) },
    ];
  }

  function recordContextMenuItems(type, id) {
    const definition = recordInspectorDefinitions()[type];
    const record = definition.find(id);
    if (!record) return [];

    const selection = selectedRecordIds(type);
    if (selection.length > 1 && selection.includes(id)) {
      return [
        ...recordSelectionDefinitions()[type].bulkActions(selection),
        { label: "Auswahl aufheben", icon: "icon-close", run: () => clearRecordSelection(type) },
      ];
    }

    return [
      { label: "Schnellansicht", icon: "icon-eye", run: () => selectRecordInspector(type, id) },
      ...definition.actions(record),
      {
        label: selection.includes(id) ? "Aus Auswahl entfernen" : "Zur Auswahl hinzufügen",
        icon: "icon-check",
        run: () => toggleRecordSelection(type, id),
      },
    ];
  }

  function openContextMenu(items, event) {
    contextMenuItems = items;
    const menu = elements.contextMenu;
    menu.innerHTML = items
      .map(
        (item, index) => `
          <button
            class="context-menu-item ${item.danger ? "is-danger" : ""}"
            type="button"
            role="menuitem"
            data-context-index="${index}"
          >
            ${item.icon ? `<svg><use href="#${item.icon}"></use></svg>` : ""}
            <span>${escapeHtml(item.label)}</span>
          </button>
        `,
      )
      .join("");
    menu.hidden = false;
    placeContextMenu(event.clientX, event.clientY);
    menu.querySelector("button")?.focus();
  }

  // Das Menü öffnet am Zeiger und bleibt dabei im Bild - an den unteren oder
  // rechten Rand gedrängt klappt es nach innen.
  function placeContextMenu(x, y) {
    const menu = elements.contextMenu;
    const { width, height } = menu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - width - 8);
    const top = Math.min(y, window.innerHeight - height - 8);
    menu.style.setProperty("--context-menu-left", `${Math.max(8, left)}px`);
    menu.style.setProperty("--context-menu-top", `${Math.max(8, top)}px`);
  }

  function closeContextMenu() {
    if (!elements.contextMenu || elements.contextMenu.hidden) return;
    elements.contextMenu.hidden = true;
    elements.contextMenu.innerHTML = "";
    contextMenuItems = [];
  }

  function handleContextMenuChoice(event) {
    const button = event.target.closest("[data-context-index]");
    if (!button) return;
    const item = contextMenuItems[Number(button.dataset.contextIndex)];
    closeContextMenu();
    item?.run();
  }
