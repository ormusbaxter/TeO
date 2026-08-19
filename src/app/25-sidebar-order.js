  // Reihenfolge der Hauptnavigation. Sie ist eine persoenliche Vorliebe und
  // gehoert deshalb nicht in den geteilten Datenbestand: Im MariaDB-Modus
  // wuerde sie sonst fuer alle gelten, und ein normales Konto koennte sie
  // wegen der Admin-Vorbehalte an den Einstellungen gar nicht mehr aendern.
  // Sie liegt darum im Browserprofil und ist nicht Teil der Sicherung.
  const SIDEBAR_ORDER_KEY = "teo-sidebar-order-v1";
  // Auch der eingeklappte Zustand ist eine persoenliche Vorliebe und liegt
  // deshalb im Browserprofil, nicht im geteilten Datenbestand.
  const SIDEBAR_COLLAPSE_KEY = "teo-sidebar-collapsed-v1";
  const DRAG_THRESHOLD_PX = 6;

  let sidebarDragState = null;
  let suppressNextNavClick = false;

  function sidebarNavItems() {
    if (!elements.mainNav) return [];
    return [...elements.mainNav.querySelectorAll(".nav-item[data-view]")];
  }

  function defaultSidebarOrder() {
    return sidebarNavItems().map((item) => item.dataset.view);
  }

  function readStoredSidebarOrder() {
    try {
      const raw = localStorage.getItem(SIDEBAR_ORDER_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((view) => typeof view === "string") : [];
    } catch (error) {
      console.warn("Die gespeicherte Navigationsreihenfolge ist unlesbar.", error);
      return [];
    }
  }

  // Gespeicherte Reihenfolge und tatsaechlich vorhandene Eintraege koennen
  // auseinanderlaufen, etwa nach einer neuen Programmversion. Bekannte
  // Eintraege behalten ihre Position, entfallene werden verworfen, neue
  // haengen sich in ihrer Standardreihenfolge hinten an.
  function mergeSidebarOrder(gespeichert, vorhanden) {
    const gesehen = new Set();
    const uebernommen = (Array.isArray(gespeichert) ? gespeichert : []).filter(
      (view) => {
        if (!vorhanden.includes(view) || gesehen.has(view)) return false;
        gesehen.add(view);
        return true;
      },
    );
    return [...uebernommen, ...vorhanden.filter((view) => !gesehen.has(view))];
  }

  function resolveSidebarOrder() {
    return mergeSidebarOrder(readStoredSidebarOrder(), defaultSidebarOrder());
  }

  function hasCustomSidebarOrder() {
    const standard = defaultSidebarOrder();
    const aktuell = resolveSidebarOrder();
    return aktuell.some((view, index) => view !== standard[index]);
  }

  function applySidebarOrder(order = resolveSidebarOrder()) {
    sidebarNavItems().forEach((item) => {
      const position = order.indexOf(item.dataset.view);
      item.style.order = String(position < 0 ? order.length : position);
    });
    if (elements.settingsSidebarSubnav) {
      const settingsPosition = order.indexOf("settings");
      elements.settingsSidebarSubnav.style.order = String(
        settingsPosition < 0 ? order.length : settingsPosition,
      );
    }
    if (elements.resetSidebarOrderButton) {
      elements.resetSidebarOrderButton.hidden = !hasCustomSidebarOrder();
    }
  }

  function persistSidebarOrder(order) {
    try {
      if (order.join("|") === defaultSidebarOrder().join("|")) {
        localStorage.removeItem(SIDEBAR_ORDER_KEY);
      } else {
        localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(order));
      }
    } catch (error) {
      console.warn("Die Navigationsreihenfolge konnte nicht gespeichert werden.", error);
      showToast(
        "Die Reihenfolge konnte nicht dauerhaft gespeichert werden.",
        "error",
      );
    }
    applySidebarOrder(order);
  }

  function announceSidebarOrder(item, order) {
    if (!elements.sidebarOrderStatus) return;
    const label = item.querySelector("span")?.textContent.trim() || item.dataset.view;
    elements.sidebarOrderStatus.textContent =
      `${label} steht jetzt an Position ${order.indexOf(item.dataset.view) + 1} von ${order.length}.`;
  }

  function moveSidebarItem(view, richtung) {
    const order = resolveSidebarOrder();
    const index = order.indexOf(view);
    const ziel = index + richtung;
    if (index < 0 || ziel < 0 || ziel >= order.length) return false;
    order.splice(ziel, 0, ...order.splice(index, 1));
    persistSidebarOrder(order);
    return true;
  }

  function resetSidebarOrder() {
    persistSidebarOrder(defaultSidebarOrder());
    if (elements.sidebarOrderStatus) {
      elements.sidebarOrderStatus.textContent =
        "Die ursprüngliche Reihenfolge der Navigation ist wiederhergestellt.";
    }
    showToast("Die ursprüngliche Reihenfolge wurde wiederhergestellt.");
  }

  // Zielposition aus der Zeigerhoehe: Der gezogene Eintrag landet vor dem
  // ersten Eintrag, dessen Mitte unterhalb des Zeigers liegt.
  function sidebarDropIndex(clientY, gezogen) {
    const andere = sidebarNavItems()
      .filter((item) => item !== gezogen)
      .sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
      );
    let index = andere.length;
    for (let position = 0; position < andere.length; position += 1) {
      const box = andere[position].getBoundingClientRect();
      if (clientY < box.top + box.height / 2) {
        index = position;
        break;
      }
    }
    const order = andere.map((item) => item.dataset.view);
    order.splice(index, 0, gezogen.dataset.view);
    return order;
  }

  function beginSidebarDrag(event) {
    const item = event.target.closest(".nav-item[data-view]");
    if (!item || event.button !== 0 || !elements.mainNav.contains(item)) return;
    sidebarDragState = {
      item,
      startY: event.clientY,
      pointerId: event.pointerId,
      aktiv: false,
      order: resolveSidebarOrder(),
    };
  }

  function updateSidebarDrag(event) {
    if (!sidebarDragState || event.pointerId !== sidebarDragState.pointerId) return;
    const { item } = sidebarDragState;

    if (!sidebarDragState.aktiv) {
      // Erst ab einer Mindestbewegung wird gezogen - sonst bliebe kein
      // gewoehnlicher Klick zum Wechseln der Ansicht mehr moeglich.
      if (Math.abs(event.clientY - sidebarDragState.startY) < DRAG_THRESHOLD_PX) return;
      sidebarDragState.aktiv = true;
      item.classList.add("is-dragging");
      elements.mainNav.classList.add("is-reordering");
      item.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    sidebarDragState.order = sidebarDropIndex(event.clientY, item);
    applySidebarOrder(sidebarDragState.order);
  }

  function endSidebarDrag(event) {
    if (!sidebarDragState || event.pointerId !== sidebarDragState.pointerId) return;
    const { item, aktiv, order } = sidebarDragState;
    sidebarDragState = null;
    item.classList.remove("is-dragging");
    elements.mainNav.classList.remove("is-reordering");
    if (!aktiv) return;

    suppressNextNavClick = true;
    persistSidebarOrder(order);
    announceSidebarOrder(item, order);
  }

  function cancelSidebarDrag() {
    if (!sidebarDragState) return;
    const { item, aktiv } = sidebarDragState;
    sidebarDragState = null;
    item.classList.remove("is-dragging");
    elements.mainNav.classList.remove("is-reordering");
    if (aktiv) {
      suppressNextNavClick = true;
      applySidebarOrder();
    }
  }

  function handleSidebarOrderKeydown(event) {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const item = event.target.closest(".nav-item[data-view]");
    if (!item) return;
    event.preventDefault();
    if (moveSidebarItem(item.dataset.view, event.key === "ArrowUp" ? -1 : 1)) {
      item.focus();
      announceSidebarOrder(item, resolveSidebarOrder());
    }
  }

  function applySidebarCollapsed(collapsed) {
    document.body.classList.toggle("is-sidebar-collapsed", collapsed);
    const toggle = elements.sidebarToggle;
    if (toggle) {
      const label = collapsed ? "Navigation ausklappen" : "Navigation einklappen";
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.title = label;
      const description = toggle.querySelector(".sr-only");
      if (description) description.textContent = label;
    }

    updateSidebarCollapsedLabels(collapsed);
  }

  // Eingeklappt bleibt vom Eintrag nur das Symbol. Die Beschriftung steht
  // weiter im Markup - Vorleseprogramme lesen sie, und beim Zeigen nennt sie
  // der Kurzhinweis, zusammen mit dem Zaehler. Der Zaehler aendert sich mit
  // dem Datenbestand, deshalb ruft renderAll() diese Auffrischung mit.
  function updateSidebarCollapsedLabels(
    collapsed = document.body.classList.contains("is-sidebar-collapsed"),
  ) {
    sidebarNavItems().forEach((item) => {
      if (!collapsed) {
        item.removeAttribute("title");
        return;
      }
      const label = item.querySelector("span")?.textContent.trim() || "";
      const count = item.querySelector(".nav-count")?.textContent.trim() || "";
      if (label) item.title = count ? `${label} (${count})` : label;
    });

    updateSidebarFooterSummaries(collapsed);
  }

  // Konto, Systemstatus und Namenszug am Fuß der Seitenleiste schrumpfen
  // eingeklappt auf ihr Symbol. Der Kurzhinweis trägt dann, was sonst
  // danebenstünde - je Angabe eine Zeile, damit er lesbar bleibt.
  function updateSidebarFooterSummaries(
    collapsed = document.body.classList.contains("is-sidebar-collapsed"),
  ) {
    setSidebarSummary(document.querySelector(".user-session"), collapsed, () => {
      const name = elements.currentUsername?.textContent.trim() || "";
      const role = elements.currentUserRole?.textContent.trim() || "";
      return [name && `Angemeldet: ${name}`, role && role !== "–" ? role : ""]
        .filter(Boolean)
        .join("\n");
    });

    setSidebarSummary(elements.sidebarSystemStatus, collapsed, () => {
      const status = elements.sidebarSystemStatus;
      const headline = status.querySelector(".sidebar-system-status-header strong");
      const rows = [...status.querySelectorAll("dl > div")].map((row) =>
        [
          row.querySelector("dt")?.textContent.trim(),
          row.querySelector("dd")?.textContent.trim(),
        ]
          .filter(Boolean)
          .join(": "),
      );
      return [headline?.textContent.trim(), ...rows, status.querySelector("small")?.textContent.trim()]
        .filter(Boolean)
        .join("\n");
    });

    setSidebarSummary(document.querySelector(".sidebar-note"), collapsed, () =>
      [
        elements.projectBuildLabel?.textContent.trim(),
        document.querySelector(".sidebar-note p")?.textContent.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  function setSidebarSummary(element, collapsed, summary) {
    if (!element) return;
    if (!collapsed) {
      element.removeAttribute("title");
      return;
    }
    const text = summary();
    if (text) element.title = text;
    else element.removeAttribute("title");
  }

  function readStoredSidebarCollapsed() {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
    } catch (error) {
      console.warn("Der gespeicherte Zustand der Seitenleiste ist unlesbar.", error);
      return false;
    }
  }

  function toggleSidebarCollapsed() {
    const collapsed = !document.body.classList.contains("is-sidebar-collapsed");
    applySidebarCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch (error) {
      console.warn("Der Zustand der Seitenleiste konnte nicht gespeichert werden.", error);
    }
  }

  function bindSidebarCollapse() {
    applySidebarCollapsed(readStoredSidebarCollapsed());
    elements.sidebarToggle?.addEventListener("click", toggleSidebarCollapsed);
  }

  function bindSidebarOrder() {
    if (!elements.mainNav) return;
    applySidebarOrder();

    elements.mainNav.addEventListener("pointerdown", beginSidebarDrag);
    elements.mainNav.addEventListener("pointermove", updateSidebarDrag);
    elements.mainNav.addEventListener("pointerup", endSidebarDrag);
    elements.mainNav.addEventListener("pointercancel", cancelSidebarDrag);
    elements.mainNav.addEventListener("keydown", handleSidebarOrderKeydown);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") cancelSidebarDrag();
    });

    // Der Klick nach einem Ziehen darf die Ansicht nicht wechseln. Die Sperre
    // liegt in der Erfassungsphase, damit sie vor bindNavigation greift.
    elements.mainNav.addEventListener(
      "click",
      (event) => {
        if (!suppressNextNavClick) return;
        suppressNextNavClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );

    elements.resetSidebarOrderButton?.addEventListener("click", resetSidebarOrder);
  }
