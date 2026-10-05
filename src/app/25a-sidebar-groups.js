  // Obermenues der Seitenleiste. Auf Wunsch fasst TeO die Menuepunkte unter
  // Personal, Termine, Fortbildungen und Geraete zusammen; Uebersicht,
  // Einstellungen und Hilfe bleiben fuer sich. Wie Reihenfolge und
  // Einklappen ist das eine Vorliebe des Arbeitsplatzes und liegt im
  // Browserprofil, nicht im geteilten Datenbestand.
  const SIDEBAR_GROUPING_KEY = "teo-sidebar-grouping-v1";
  const SIDEBAR_GROUPS_CLOSED_KEY = "teo-sidebar-groups-closed-v1";
  const SIDEBAR_GROUPS = [
    {
      id: "personnel",
      label: "Personal",
      icon: "icon-users",
      views: ["employees", "weekends", "vacations"],
    },
    {
      id: "schedule",
      label: "Termine",
      icon: "icon-calendar",
      views: ["appointments", "memos"],
    },
    {
      id: "training",
      label: "Fortbildungen",
      icon: "icon-training",
      views: ["trainings", "meetings"],
    },
    {
      id: "devices",
      label: "Geräte",
      icon: "icon-device",
      views: ["devices", "device-management"],
    },
  ];

  function readStoredSidebarGrouping() {
    try {
      return localStorage.getItem(SIDEBAR_GROUPING_KEY) === "1";
    } catch (error) {
      console.warn("Die gespeicherte Menüaufteilung ist unlesbar.", error);
      return false;
    }
  }

  function readClosedSidebarGroups() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SIDEBAR_GROUPS_CLOSED_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn("Die zugeklappten Obermenüs sind unlesbar.", error);
      return new Set();
    }
  }

  function storeClosedSidebarGroups(closed) {
    try {
      if (closed.size) localStorage.setItem(SIDEBAR_GROUPS_CLOSED_KEY, JSON.stringify([...closed]));
      else localStorage.removeItem(SIDEBAR_GROUPS_CLOSED_KEY);
    } catch (error) {
      console.warn("Die zugeklappten Obermenüs konnten nicht gespeichert werden.", error);
    }
  }

  function sidebarGroupElements() {
    if (!elements.mainNav) return [];
    return [...elements.mainNav.querySelectorAll(".nav-group[data-nav-group]")];
  }

  function isSidebarGrouped() {
    return sidebarGroupElements().length > 0;
  }

  // Ein Obermenue steht dort, wo sein erster Eintrag in der Reihenfolge
  // steht. So folgt es der persoenlichen Reihenfolge, ohne eine eigene zu
  // brauchen.
  function applySidebarGroupOrder(order) {
    sidebarGroupElements().forEach((group) => {
      const definition = SIDEBAR_GROUPS.find((entry) => entry.id === group.dataset.navGroup);
      const positions = (definition?.views || [])
        .map((view) => order.indexOf(view))
        .filter((position) => position >= 0);
      group.style.order = String(positions.length ? Math.min(...positions) : order.length);
    });
  }

  function createSidebarGroup(definition, closed) {
    const group = document.createElement("div");
    group.className = "nav-group";
    group.dataset.navGroup = definition.id;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-item nav-group-toggle";
    toggle.dataset.navGroupToggle = definition.id;
    toggle.setAttribute("aria-controls", `navGroupItems-${definition.id}`);
    toggle.innerHTML = `
      <svg><use href="#${definition.icon}"></use></svg>
      <span>${escapeHtml(definition.label)}</span>
      <svg class="nav-group-chevron" aria-hidden="true"><use href="#icon-chevron"></use></svg>
    `;

    const items = document.createElement("div");
    items.className = "nav-group-items";
    items.id = `navGroupItems-${definition.id}`;
    items.setAttribute("role", "group");
    items.setAttribute("aria-label", definition.label);

    group.append(toggle, items);
    setSidebarGroupOpen(group, !closed.has(definition.id));
    return group;
  }

  function setSidebarGroupOpen(group, open) {
    group.classList.toggle("is-open", open);
    group.querySelector(".nav-group-toggle")?.setAttribute("aria-expanded", String(open));
  }

  function groupSidebarItems() {
    if (!elements.mainNav || isSidebarGrouped()) return;
    const closed = readClosedSidebarGroups();
    const items = sidebarNavItems();
    SIDEBAR_GROUPS.forEach((definition) => {
      const members = definition.views
        .map((view) => items.find((item) => item.dataset.view === view))
        .filter(Boolean);
      if (!members.length) return;
      const group = createSidebarGroup(definition, closed);
      // Das Obermenue nimmt im Markup den Platz seines ersten Eintrags ein -
      // die Tabulatorfolge bleibt dadurch dieselbe wie ohne Gruppen.
      elements.mainNav.insertBefore(group, members[0]);
      group.querySelector(".nav-group-items").append(...members);
    });
  }

  function ungroupSidebarItems() {
    sidebarGroupElements().forEach((group) => {
      const members = [...group.querySelectorAll(".nav-item[data-view]")];
      members.forEach((item) => elements.mainNav.insertBefore(item, group));
      group.remove();
    });
  }

  function applySidebarGrouping(grouped) {
    if (grouped) groupSidebarItems();
    else ungroupSidebarItems();
    document.body.classList.toggle("is-sidebar-grouped", grouped);
    if (elements.sidebarGroupingToggle) elements.sidebarGroupingToggle.checked = grouped;
    applySidebarOrder();
    revealActiveSidebarGroup();
    updateSidebarCollapsedLabels();
  }

  function setSidebarGrouping(grouped) {
    try {
      if (grouped) localStorage.setItem(SIDEBAR_GROUPING_KEY, "1");
      else localStorage.removeItem(SIDEBAR_GROUPING_KEY);
    } catch (error) {
      console.warn("Die Menüaufteilung konnte nicht gespeichert werden.", error);
    }
    applySidebarGrouping(grouped);
  }

  function toggleSidebarGroup(group) {
    const open = !group.classList.contains("is-open");
    setSidebarGroupOpen(group, open);
    const closed = readClosedSidebarGroups();
    if (open) closed.delete(group.dataset.navGroup);
    else closed.add(group.dataset.navGroup);
    storeClosedSidebarGroups(closed);
    markActiveSidebarGroup();
  }

  // Ein zugeklapptes Obermenue zeigt an, dass die aktive Ansicht darin liegt.
  function markActiveSidebarGroup() {
    sidebarGroupElements().forEach((group) => {
      const containsActive = Boolean(group.querySelector(".nav-item[data-view].is-active"));
      group
        .querySelector(".nav-group-toggle")
        ?.classList.toggle("has-active-view", containsActive);
    });
  }

  // Wer eine Ansicht aufruft - ueber die Suche, ein Tastenkuerzel oder eine
  // Kachel -, soll ihren Menuepunkt auch sehen. Das Obermenue geht dafuer auf;
  // gemerkt wird das nicht, beim naechsten Start gilt wieder die eigene Wahl.
  function revealActiveSidebarGroup() {
    sidebarGroupElements().forEach((group) => {
      if (group.querySelector(".nav-item[data-view].is-active")) setSidebarGroupOpen(group, true);
    });
    markActiveSidebarGroup();
  }

  function bindSidebarGroups() {
    if (!elements.mainNav) return;
    applySidebarGrouping(readStoredSidebarGrouping());
    elements.sidebarGroupingToggle?.addEventListener("change", (event) => {
      setSidebarGrouping(event.target.checked);
    });
    elements.mainNav.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-nav-group-toggle]");
      if (!toggle) return;
      toggleSidebarGroup(toggle.closest(".nav-group"));
    });
  }
