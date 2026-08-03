  // Reihenfolge der Hauptnavigation. Sie ist eine persoenliche Vorliebe und
  // gehoert deshalb nicht in den geteilten Datenbestand: Im MariaDB-Modus
  // wuerde sie sonst fuer alle gelten, und ein normales Konto koennte sie
  // wegen der Admin-Vorbehalte an den Einstellungen gar nicht mehr aendern.
  // Sie liegt darum im Browserprofil und ist nicht Teil der Sicherung.
  const SIDEBAR_ORDER_KEY = "teo-sidebar-order-v1";
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
