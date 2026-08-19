  // Tastenkuerzel fuer die Arbeit am Schreibtisch. Sie greifen nur, wenn
  // gerade nichts anderes die Tastatur braucht: kein Eingabefeld, kein offener
  // Dialog, keine Anmeldemaske. Zu jedem Kuerzel gehoert die Uebersicht hinter
  // „?“ - ein unentdecktes Kuerzel ist keins.
  const VIEW_SHORTCUTS = {
    u: "dashboard",
    m: "employees",
    w: "weekends",
    p: "vacations",
    t: "appointments",
    o: "memos",
    f: "trainings",
    s: "meetings",
    g: "devices",
    v: "device-management",
    e: "settings",
    h: "help",
  };

  // „g“ leitet einen Ansichtswechsel ein und wartet auf den Buchstaben. Wer
  // sich vertippt oder abgelenkt wird, tippt kurz darauf wieder normal.
  const VIEW_JUMP_TIMEOUT_MS = 1500;
  let viewJumpArmedAt = 0;

  // In der Erfassungsphase, damit der zweite Anschlag nach „g“ vor den
  // Buchstaben des Urlaubsplaners kommt: Dort steht „u“ fuer Urlaub, und ohne
  // diesen Vorrang schriebe „g u“ einen Urlaubstag, statt zur Uebersicht zu
  // wechseln.
  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", handleGlobalShortcut, true);
    elements.openShortcutsButton?.addEventListener("click", openShortcutsDialog);
  }

  function openShortcutsDialog() {
    elements.shortcutsDialog?.showModal();
  }

  function isTextEntry(target) {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );
  }

  // Die Zellen des Urlaubsplaners lesen Buchstaben als Eintragsarten - „u“
  // steht dort fuer Urlaub, „n“ fuer Nachtdienst.
  function isVacationCell(target) {
    return Boolean(
      target instanceof HTMLElement &&
        target.closest("[data-vacation-employee][data-vacation-date]"),
    );
  }

  // Wo einzelne Buchstaben schon vergeben sind, ruhen die Kuerzel.
  function keysBelongToTarget(target) {
    return isTextEntry(target) || isVacationCell(target);
  }

  function shortcutsAvailable(event) {
    if (event.defaultPrevented || event.isComposing) return false;
    if (document.body.classList.contains("is-auth-locked")) return false;
    return !document.querySelector("dialog[open]");
  }

  function handleGlobalShortcut(event) {
    if (!shortcutsAvailable(event)) return;
    const targetOwnsKeys = keysBelongToTarget(event.target);

    // Strg+Z nur ausserhalb von Eingaben: Dort gehoert das Zuruecknehmen dem
    // Browser und seinem Eingabeverlauf, nicht dem Datenbestand.
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
      if (isTextEntry(event.target) || !hasUndoableMutation()) return;
      event.preventDefault();
      void undoLastMutation();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key.toLowerCase();

    // Der zweite Anschlag nach „g“. Er gilt auch dort, wo einzelne Buchstaben
    // sonst vergeben sind - wer „g“ getippt hat, meint einen Ansichtswechsel.
    if (viewJumpArmedAt && event.timeStamp - viewJumpArmedAt <= VIEW_JUMP_TIMEOUT_MS) {
      viewJumpArmedAt = 0;
      const view = VIEW_SHORTCUTS[key];
      if (!view) return;
      event.preventDefault();
      event.stopPropagation();
      showView(view);
      return;
    }
    viewJumpArmedAt = 0;

    if (key === "g" && !isTextEntry(event.target)) {
      viewJumpArmedAt = event.timeStamp;
      event.preventDefault();
      return;
    }

    if (targetOwnsKeys) return;

    if (event.key === "?") {
      event.preventDefault();
      openShortcutsDialog();
      return;
    }

    if (key === "/") {
      const search = activeViewSearchField();
      if (!search) return;
      event.preventDefault();
      search.focus();
      search.select();
      return;
    }

    if (key === "n") {
      // In Einstellungen und Hilfe gibt es nichts anzulegen; dort ruht das
      // Kuerzel, statt einen fremden Dialog aufzuziehen.
      if (elements.mobileCreateButton.hidden) return;
      event.preventDefault();
      openCreateDialogForActiveView();
    }
  }

  // Das erste Suchfeld der gezeigten Ansicht. Ueber die Ansicht gesucht statt
  // ueber eine Liste von Kennungen: So bekommt jede neue Ansicht ihr Kuerzel,
  // ohne dass hier etwas nachgetragen werden muss.
  function activeViewSearchField() {
    const panel = document.querySelector("[data-view-panel].is-active");
    if (!panel) return null;
    return [...panel.querySelectorAll('input[type="search"]')].find(
      (field) => !field.disabled && field.offsetParent !== null,
    );
  }
