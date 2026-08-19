  // Persoenlicher Desktop-Arbeitsplatz: Schnellansicht, Arbeitsliste,
  // Verlauf/Favoriten und das anpassbare Dashboard bleiben lokal im Profil.
  const WORKSPACE_HISTORY_KEY = "teo-workspace-history-v1";
  const WORKSPACE_FAVORITES_KEY = "teo-workspace-favorites-v1";
  const WORKSPACE_COMMANDS_KEY = "teo-workspace-commands-v1";
  const DASHBOARD_LAYOUT_KEY = "teo-dashboard-layout-v1";
  const DASHBOARD_WIDGETS = Object.freeze([
    { key: "work-queue", label: "Arbeitsliste" },
    { key: "deadlines", label: "Fristen und offene Memos" },
    { key: "overview", label: "Fortbildungen und Schnellzugriff" },
    { key: "recent", label: "Zuletzt bearbeitete Mitarbeiter" },
  ]);

  let employeeInspectorId = "";
  let workspaceHistory = readWorkspaceList(WORKSPACE_HISTORY_KEY);
  let workspaceFavorites = readWorkspaceList(WORKSPACE_FAVORITES_KEY);
  let workspaceCommandHistory = readWorkspaceCommands();
  let dashboardLayout = readDashboardLayout();
  let workQueueFilter = "all";

  function bindDesktopWorkspace() {
    document.querySelector("#openDashboardLayoutButton")?.addEventListener("click", openDashboardLayoutDialog);
    document.querySelector("#resetDashboardLayoutButton")?.addEventListener("click", resetDashboardLayout);
    document.querySelector("#dashboardLayoutList")?.addEventListener("click", handleDashboardLayoutAction);
    document.querySelector("#dashboardLayoutList")?.addEventListener("change", handleDashboardLayoutVisibility);
    document.querySelector("#dashboardWorkQueuePanel")?.addEventListener("click", handleWorkQueueAction);
    elements.employeeTable?.addEventListener("click", handleEmployeeWorkspaceClick);
    elements.employeeTable?.addEventListener("keydown", handleEmployeeWorkspaceKeydown);
    document.querySelector("#employeeInspector")?.addEventListener("click", handleEmployeeInspectorAction);
    elements.employeeTable?.addEventListener("pointerdown", beginEmployeeColumnResize);

    document.addEventListener("click", (event) => {
      const menu = document.querySelector("#employeeMoreActions");
      if (menu?.open && !menu.contains(event.target)) menu.removeAttribute("open");
      if (event.target.closest("#employeeMoreActions button")) menu?.removeAttribute("open");
    });
    applyDashboardLayout();
  }

  function renderDesktopWorkspace() {
    applyDashboardLayout();
    renderDashboardWorkQueue();
  }

  function handleEmployeeWorkspaceClick(event) {
    if (event.target.closest("button, input, a, .column-resize-handle")) return;
    const row = event.target.closest("[data-employee-row]");
    if (row) selectEmployeeInspector(row.dataset.employeeRow);
  }

  function handleEmployeeWorkspaceKeydown(event) {
    const row = event.target.closest("[data-employee-row]");
    if (!row) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectEmployeeInspector(row.dataset.employeeRow);
      return;
    }
    if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const rows = [...elements.employeeTable.querySelectorAll("[data-employee-row]")];
    const index = rows.indexOf(row);
    rows[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
  }

  function selectEmployeeInspector(employeeId) {
    if (!getEmployee(employeeId)) return;
    employeeInspectorId = employeeId;
    trackWorkspaceRecord("employee", employeeId);
    renderEmployees();
    renderEmployeeInspector();
  }

  function renderEmployeeInspector() {
    const inspector = document.querySelector("#employeeInspector");
    const content = document.querySelector("#employeeInspectorContent");
    const employee = getEmployee(employeeInspectorId);
    if (!inspector || !content || !employee) {
      if (inspector) inspector.hidden = true;
      return;
    }
    const training = getEmployeeTrainingStats(employee.id);
    const qualifications = state.catalogs.qualifications.filter((item) => employee.qualifications[item.id]);
    const favorite = workspaceRecordIsFavorite("employee", employee.id);
    inspector.hidden = false;
    content.innerHTML = `
      <div class="employee-inspector-header">
        ${renderAvatar(employee)}
        <div><p class="eyebrow">Schnellansicht</p><h2>${escapeHtml(fullName(employee))}</h2><small>${escapeHtml(employee.profession || "Beruf nicht angegeben")}</small></div>
        <button class="icon-button" type="button" data-inspector-close aria-label="Schnellansicht schließen"><svg><use href="#icon-close"></use></svg></button>
      </div>
      <div class="employee-inspector-actions">
        <button class="button button-secondary" type="button" data-inspector-favorite="${employee.id}" aria-pressed="${favorite}"><svg><use href="#icon-star"></use></svg>${favorite ? "Angeheftet" : "Anheften"}</button>
        <button class="button button-secondary" type="button" data-inspector-edit="${employee.id}"><svg><use href="#icon-edit"></use></svg>Bearbeiten</button>
        <button class="button button-primary" type="button" data-inspector-dossier="${employee.id}">Gesamtakte</button>
      </div>
      <dl class="employee-inspector-facts">
        <div><dt>Status</dt><dd>${escapeHtml(employeeStatusLabel(employee))}</dd></div>
        <div><dt>Stellenumfang</dt><dd>${employee.employmentPercent}&thinsp;%</dd></div>
        <div><dt>Dienstwochenende</dt><dd>${escapeHtml(serviceWeekendLabel(employee.serviceWeekend))}</dd></div>
        <div><dt>Fortbildungen</dt><dd>${training.current}/${training.total} aktuell</dd></div>
        <div><dt>Telefon</dt><dd>${escapeHtml(employee.phone || "–")}</dd></div>
        <div><dt>E-Mail</dt><dd>${escapeHtml(employee.email || "–")}</dd></div>
      </dl>
      <section class="employee-inspector-section"><h3>Qualifikationen</h3><div class="qualification-tags">${qualifications.length ? qualifications.map((item) => `<span class="tag">${escapeHtml(item.label)}</span>`).join("") : '<span class="tag tag-muted">Keine</span>'}</div></section>
    `;
  }

  function handleEmployeeInspectorAction(event) {
    if (event.target.closest("[data-inspector-close]")) {
      employeeInspectorId = "";
      document.querySelector("#employeeInspector").hidden = true;
      renderEmployees();
      return;
    }
    const favorite = event.target.closest("[data-inspector-favorite]");
    if (favorite) {
      toggleWorkspaceFavorite("employee", favorite.dataset.inspectorFavorite);
      renderEmployeeInspector();
      return;
    }
    const edit = event.target.closest("[data-inspector-edit]");
    if (edit) openEmployeeDialog(edit.dataset.inspectorEdit);
    const dossier = event.target.closest("[data-inspector-dossier]");
    if (dossier) openEmployeeDossier(dossier.dataset.inspectorDossier);
  }

  function beginEmployeeColumnResize(event) {
    const handle = event.target.closest("[data-resize-employee-column]");
    if (!handle) return;
    event.preventDefault();
    const header = handle.closest("th");
    const key = handle.dataset.resizeEmployeeColumn;
    const startX = event.clientX;
    const startWidth = header.getBoundingClientRect().width;
    document.body.classList.add("is-resizing-column");
    const move = (moveEvent) => {
      const width = Math.max(80, Math.min(520, startWidth + moveEvent.clientX - startX));
      elements.employeeTable.querySelectorAll(`[data-column="${key}"]`).forEach((cell) => cell.style.setProperty("--employee-column-width", `${width}px`));
      if (key === "name") elements.employeeTable.querySelector(".employee-table")?.style.setProperty("--employee-name-width", `${width}px`);
    };
    const finish = (upEvent) => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.body.classList.remove("is-resizing-column");
      setEmployeeColumnWidth(key, startWidth + upEvent.clientX - startX);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", finish, { once: true });
  }

  function renderDashboardWorkQueue() {
    const target = document.querySelector("#dashboardWorkQueue");
    if (!target) return;
    const deadlineItems = getDeadlineItems().filter((item) => item.daysUntil <= 30).map((item) => ({
      type: item.kind === "appointment" ? "appointment" : "employee",
      id: item.kind === "appointment" ? item.appointment.id : item.employeeId,
      title: item.kind === "birthday" ? `${fullName(item.employee)} · ${item.title}` : item.title,
      detail: item.kind === "appointment" ? item.type : `${fullName(item.employee)} · ${item.type}`,
      daysUntil: item.daysUntil,
      date: item.dueDate,
      icon: item.kind === "appointment" ? "icon-calendar" : "icon-alert",
    }));
    const memoItems = visibleMemos().filter((memo) => !memo.completed).map((memo) => {
      const dueDate = parseLocalDate(memo.date);
      const daysUntil = dueDate ? daysBetween(parseLocalDate(todayIso()), dueDate) : 365;
      return { type: "memo", id: memo.id, title: memo.title, detail: memo.category || "Memo / ToDo", daysUntil, date: memo.date, icon: "icon-memo" };
    });
    const qualityItems = getDataQualityIssues().filter((issue) => issue.severity === "high").map((issue) => ({
      type: "employee-edit", id: issue.employeeId, title: issue.title, detail: issue.detail, daysUntil: -1, date: "", icon: "icon-alert",
    }));
    let items = [...qualityItems, ...memoItems, ...deadlineItems].sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, "de"));
    if (workQueueFilter === "overdue") items = items.filter((item) => item.daysUntil < 0);
    if (workQueueFilter === "week") items = items.filter((item) => item.daysUntil >= 0 && item.daysUntil <= 7);
    target.innerHTML = items.length ? `<div class="work-queue-list">${items.slice(0, 12).map((item) => `
      <button class="work-queue-row ${item.daysUntil < 0 ? "is-overdue" : ""}" type="button" data-work-type="${item.type}" data-work-id="${item.id}">
        <span class="work-queue-icon"><svg><use href="#${item.icon}"></use></svg></span>
        <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span>
        <span><strong>${item.date ? formatDate(item.date) : "Prüfen"}</strong><small>${item.date ? deadlineRelativeLabel(item.daysUntil) : "Datenqualität"}</small></span>
      </button>`).join("")}</div>${items.length > 12 ? `<p class="field-hint">${items.length - 12} weitere Einträge</p>` : ""}` : renderEmptyState({ title: "Alles im grünen Bereich", text: "Für diesen Filter gibt es aktuell nichts zu bearbeiten.", compact: true });
  }

  function handleWorkQueueAction(event) {
    const filter = event.target.closest("[data-work-queue-filter]");
    if (filter) {
      workQueueFilter = filter.dataset.workQueueFilter;
      document.querySelectorAll("[data-work-queue-filter]").forEach((button) => {
        const active = button === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      renderDashboardWorkQueue();
      return;
    }
    const row = event.target.closest("[data-work-type]");
    if (!row) return;
    const { workType, workId } = row.dataset;
    if (workType === "employee") { showView("employees"); selectEmployeeInspector(workId); }
    if (workType === "employee-edit") { showView("employees"); openEmployeeDialog(workId); }
    if (workType === "appointment") { showView("appointments"); openAppointmentDialog(workId); }
    if (workType === "memo") { showView("memos"); openMemoDialog(workId); }
  }

  function readWorkspaceList(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter((item) => item && item.type && item.id).slice(0, 20) : [];
    } catch { return []; }
  }

  function storeWorkspaceList(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (error) { console.warn("Der persönliche Verlauf konnte nicht gespeichert werden.", error); }
  }

  function trackWorkspaceRecord(type, id) {
    workspaceHistory = [{ type, id, openedAt: new Date().toISOString() }, ...workspaceHistory.filter((item) => item.type !== type || item.id !== id)].slice(0, 12);
    storeWorkspaceList(WORKSPACE_HISTORY_KEY, workspaceHistory);
  }

  function workspaceRecordIsFavorite(type, id) {
    return workspaceFavorites.some((item) => item.type === type && item.id === id);
  }

  function toggleWorkspaceFavorite(type, id) {
    if (workspaceRecordIsFavorite(type, id)) workspaceFavorites = workspaceFavorites.filter((item) => item.type !== type || item.id !== id);
    else workspaceFavorites = [{ type, id }, ...workspaceFavorites].slice(0, 20);
    storeWorkspaceList(WORKSPACE_FAVORITES_KEY, workspaceFavorites);
  }

  function resolveWorkspaceRecord(item) {
    if (item.type === "employee") {
      const employee = getEmployee(item.id);
      return employee && { group: "Mitarbeiter", icon: "icon-users", label: fullName(employee), hint: employee.profession || "", run: () => { showView("employees"); selectEmployeeInspector(employee.id); } };
    }
    if (item.type === "appointment") {
      const appointment = state.appointments.find((entry) => entry.id === item.id);
      return appointment && { group: "Termine", icon: "icon-calendar", label: appointment.title, hint: formatDate(appointment.date), run: () => { showView("appointments"); openAppointmentDialog(appointment.id); } };
    }
    if (item.type === "memo") {
      const memo = state.memos.find((entry) => entry.id === item.id);
      return memo && memoVisibleToCurrentUser(memo) && { group: "Memo / ToDo", icon: "icon-memo", label: memo.title, hint: formatDate(memo.date), run: () => { showView("memos"); openMemoDialog(memo.id); } };
    }
    return null;
  }

  function workspaceCommandPaletteEntries() {
    const favorites = workspaceFavorites.map(resolveWorkspaceRecord).filter(Boolean).map((item) => ({ ...item, group: "Favoriten" }));
    const recent = workspaceHistory.map(resolveWorkspaceRecord).filter(Boolean).filter((item) => !favorites.some((favorite) => favorite.label === item.label)).slice(0, 5).map((item) => ({ ...item, group: "Zuletzt geöffnet" }));
    const recentCommands = workspaceRecentCommandEntries();
    return [...favorites, ...recent, ...recentCommands];
  }

  function readWorkspaceCommands() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WORKSPACE_COMMANDS_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter((label) => typeof label === "string").slice(0, 6) : [];
    } catch { return []; }
  }

  function trackWorkspaceCommand(entry) {
    if (!entry?.label) return;
    workspaceCommandHistory = [entry.label, ...workspaceCommandHistory.filter((label) => label !== entry.label)].slice(0, 6);
    try { localStorage.setItem(WORKSPACE_COMMANDS_KEY, JSON.stringify(workspaceCommandHistory)); } catch (error) { console.warn("Die letzten Befehle konnten nicht gespeichert werden.", error); }
  }

  function workspaceRecentCommandEntries() {
    if (!workspaceCommandHistory.length) return [];
    const candidates = [...commandPaletteViews(), ...commandPaletteActions()];
    return workspaceCommandHistory
      .map((label) => candidates.find((entry) => entry.label === label))
      .filter(Boolean)
      .map((entry) => ({ ...entry, group: "Letzte Befehle" }));
  }

  function readDashboardLayout() {
    const defaults = DASHBOARD_WIDGETS.map((widget) => ({ key: widget.key, visible: true }));
    try {
      const parsed = JSON.parse(localStorage.getItem(DASHBOARD_LAYOUT_KEY) || "[]");
      if (!Array.isArray(parsed)) return defaults;
      return [...parsed.filter((item) => DASHBOARD_WIDGETS.some((widget) => widget.key === item.key)).map((item) => ({ key: item.key, visible: item.visible !== false })), ...defaults.filter((item) => !parsed.some((stored) => stored.key === item.key))];
    } catch { return defaults; }
  }

  function storeDashboardLayout() {
    try { localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(dashboardLayout)); } catch (error) { console.warn("Die Dashboard-Anordnung konnte nicht gespeichert werden.", error); }
  }

  function applyDashboardLayout() {
    const view = document.querySelector("#dashboardView");
    if (!view) return;
    dashboardLayout.forEach((item) => {
      const widget = view.querySelector(`[data-dashboard-widget="${item.key}"]`);
      if (!widget) return;
      widget.hidden = !item.visible;
      view.appendChild(widget);
    });
  }

  function openDashboardLayoutDialog() {
    renderDashboardLayoutList();
    document.querySelector("#dashboardLayoutDialog")?.showModal();
  }

  function renderDashboardLayoutList() {
    const target = document.querySelector("#dashboardLayoutList");
    if (!target) return;
    target.innerHTML = dashboardLayout.map((item) => {
      const widget = DASHBOARD_WIDGETS.find((entry) => entry.key === item.key);
      return `<div class="dashboard-layout-row"><label class="checkbox-field"><input type="checkbox" data-dashboard-widget-visible="${item.key}" ${item.visible ? "checked" : ""} /><span>${escapeHtml(widget.label)}</span></label><span><button class="icon-button" type="button" data-move-dashboard-widget="${item.key}" data-direction="up" aria-label="Nach oben">↑</button><button class="icon-button" type="button" data-move-dashboard-widget="${item.key}" data-direction="down" aria-label="Nach unten">↓</button></span></div>`;
    }).join("");
  }

  function handleDashboardLayoutAction(event) {
    const button = event.target.closest("[data-move-dashboard-widget]");
    if (!button) return;
    const index = dashboardLayout.findIndex((item) => item.key === button.dataset.moveDashboardWidget);
    const target = index + (button.dataset.direction === "up" ? -1 : 1);
    if (index < 0 || target < 0 || target >= dashboardLayout.length) return;
    [dashboardLayout[index], dashboardLayout[target]] = [dashboardLayout[target], dashboardLayout[index]];
    storeDashboardLayout(); applyDashboardLayout(); renderDashboardLayoutList();
  }

  function handleDashboardLayoutVisibility(event) {
    const checkbox = event.target.closest("[data-dashboard-widget-visible]");
    if (!checkbox) return;
    const item = dashboardLayout.find((entry) => entry.key === checkbox.dataset.dashboardWidgetVisible);
    if (item) item.visible = checkbox.checked;
    storeDashboardLayout(); applyDashboardLayout();
  }

  function resetDashboardLayout() {
    dashboardLayout = DASHBOARD_WIDGETS.map((widget) => ({ key: widget.key, visible: true }));
    storeDashboardLayout(); applyDashboardLayout(); renderDashboardLayoutList();
  }
