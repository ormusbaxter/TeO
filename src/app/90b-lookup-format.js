  // Das Nachschlagen ueber die Kennung ist der haeufigste Zugriff der gesamten
  // Anwendung: Ein einziger Aufbau der Urlaubsmatrix fragt zehntausende Male
  // nach einem Mitarbeiter. Als lineare Suche summiert sich das zu Millionen
  // Vergleichen je Klick, deshalb liegt hinter jeder Sammlung eine
  // Zuordnungstabelle.
  //
  // Der Zwischenspeicher haelt sich an zwei Merkmale der Sammlung: an das Feld
  // selbst und an dessen Laenge. Jede Bestandsaenderung faellt dadurch auf,
  // denn sie ersetzt entweder das Feld (map, filter, Neuaufbau des Zustands)
  // oder aendert die Laenge (push). Aenderungen innerhalb eines Datensatzes
  // brauchen keine Erneuerung, weil die Tabelle auf dieselben Objekte zeigt.
  // Diese Aenderungsarten deckt tests/lookup-index.test.mjs ab.
  //
  // Nicht erkennbar waere ein Austausch eines Datensatzes an Ort und Stelle
  // bei gleicher Laenge (etwa state.employees[0] = anderer). So etwas kommt in
  // der Anwendung nicht vor; wer es einfuehrt, muss diese Stelle anpassen.
  const collectionIndexes = new WeakMap();

  function indexById(collection) {
    if (!Array.isArray(collection)) return new Map();
    const cached = collectionIndexes.get(collection);
    if (cached && cached.size === collection.length) return cached.index;
    const index = new Map();
    for (const item of collection) {
      // Bei doppelten Kennungen gewinnt der erste Datensatz, genau wie zuvor
      // bei der Suche mit find().
      if (!index.has(item.id)) index.set(item.id, item);
    }
    collectionIndexes.set(collection, { size: collection.length, index });
    return index;
  }

  function getEmployee(employeeId) {
    return indexById(state.employees).get(employeeId);
  }

  function getTraining(trainingId) {
    return indexById(state.trainings).get(trainingId);
  }

  function getMeeting(meetingId) {
    return indexById(state.meetings).get(meetingId);
  }

  function getAppointment(appointmentId) {
    return indexById(state.appointments).get(appointmentId);
  }

  function getDevice(deviceId) {
    return indexById(state.devices).get(deviceId);
  }

  function recurrenceLabel(training) {
    if (!training.recurrenceMonths) return "Einmalig / ohne Ablauf";
    if (training.recurrenceMonths === 12) return "Jährliche Wiederholung";
    if (training.recurrenceMonths === 24) return "Wiederholung alle 2 Jahre";
    if (training.recurrenceMonths === 36) return "Wiederholung alle 3 Jahre";
    if (training.recurrenceMonths === 60) return "Wiederholung alle 5 Jahre";
    return `Wiederholung alle ${training.recurrenceMonths} Monate`;
  }

  function renderAvatar(employee, small = false) {
    const status = ["active", "onboarding", "inactive"].includes(
      employee.employmentStatus,
    )
      ? employee.employmentStatus
      : employee.active === false
        ? "inactive"
        : "active";
    const employmentPercent = Math.min(
      100,
      Math.max(0, Number(employee.employmentPercent) || 0),
    );
    return `
      <span
        class="avatar avatar-status-${status} ${small ? "avatar-sm" : ""}"
        ${dynamicStyle({ "--avatar-fill": `${employmentPercent}%` })}
        aria-hidden="true"
        title="${escapeHtml(employeeStatusLabel(employee))} · ${employmentPercent} % Beschäftigungsumfang"
      >
        <span class="avatar-initials">${escapeHtml(initials(employee))}</span>
      </span>
    `;
  }

  function fullName(employee) {
    return [employee.lastName, employee.firstName]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  // Angezeigt wird „Nachname, Vorname“; gesucht werden soll trotzdem auch in
  // der gesprochenen Reihenfolge „Vorname Nachname“.
  function employeeSearchText(employee) {
    return `${employee.firstName} ${employee.lastName} ${fullName(employee)}`;
  }

  function initials(employee) {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toLocaleUpperCase("de-DE");
  }

  function sortEmployees(a, b) {
    return (
      a.lastName.localeCompare(b.lastName, "de") ||
      a.firstName.localeCompare(b.firstName, "de")
    );
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function formatStorageSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return "–";
    if (value === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
      Math.floor(Math.log(value) / Math.log(1000)),
      units.length - 1,
    );
    const amount = value / 1000 ** unitIndex;
    const maximumFractionDigits = unitIndex === 0 ? 0 : 1;
    const formattedAmount = numberFormat({ maximumFractionDigits }).format(
      amount,
    );

    return `${formattedAmount} ${units[unitIndex]}`;
  }

  function formatList(values) {
    if (values.length <= 1) return values[0] || "";
    if (values.length === 2) return `${values[0]} und ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
  }

  function todayIso() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addMonths(dateString, monthCount) {
    const date = parseLocalDate(dateString);
    if (!date) return "";
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthCount);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseLocalDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function formatDate(dateString) {
    const date = parseLocalDate(dateString);
    if (!date) return "–";
    return [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getFullYear()).padStart(4, "0"),
    ].join(".");
  }

  function formatDateInputValue(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  }

  // Schnelleingabe im Datumsfeld: „h“ trägt heute ein, „g“ gestern, „m“
  // morgen. Ein Datumsfeld nimmt ohnehin nur Ziffern an - Buchstaben waren
  // dort bisher wirkungslos und stehen deshalb frei zur Verfügung.
  const DATE_INPUT_SHORTCUTS = Object.freeze({ h: 0, g: -1, m: 1 });
  const DATE_INPUT_SHORTCUT_HINT = "Tastatur: h = heute, g = gestern, m = morgen";

  function initializeFormattedDateInputs() {
    refreshFormattedDateInputs();
    document.addEventListener("keydown", handleDateInputShortcut, true);
    document.addEventListener("input", handleFormattedDateInput, true);
    document.addEventListener("change", handleFormattedDateInput, true);
    dateInputObserver = new MutationObserver(() => {
      refreshFormattedDateInputs();
    });
    dateInputObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
  }

  function refreshFormattedDateInputs() {
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      let shell = input.closest(".formatted-date-shell");
      if (!shell) {
        shell = document.createElement("span");
        shell.className = "formatted-date-shell";
        input.before(shell);
        shell.append(input);
        const display = document.createElement("span");
        display.className = "formatted-date-display";
        display.setAttribute("aria-hidden", "true");
        shell.append(display);
        input.classList.add("formatted-date-input");
      }
      // Ein Kürzel, von dem niemand weiß, gibt es nicht: Der Kurzhinweis des
      // Feldes nennt es, sofern das Feld nicht schon einen eigenen trägt.
      if (!input.title) input.title = DATE_INPUT_SHORTCUT_HINT;
      updateFormattedDateInput(input);
    });
  }

  function handleFormattedDateInput(event) {
    if (event.target?.matches?.('input[type="date"]')) {
      updateFormattedDateInput(event.target);
    }
  }

  function handleDateInputShortcut(event) {
    if (event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented) return;
    const input = event.target;
    if (!input?.matches?.('input[type="date"]') || input.readOnly || input.disabled) {
      return;
    }
    const offset = DATE_INPUT_SHORTCUTS[event.key.toLowerCase()];
    if (offset === undefined) return;

    const value = shiftDaysFromToday(offset);
    // Ein Feld mit Grenze - etwa ein Nachweis, der nicht in der Zukunft liegen
    // darf - bleibt unberuehrt, statt einen unzulaessigen Wert zu erhalten.
    if ((input.min && value < input.min) || (input.max && value > input.max)) return;

    event.preventDefault();
    input.value = value;
    // Dieselben Ereignisse wie bei einer Eingabe von Hand: Anzeige, Prüfungen
    // und die Erkennung ungespeicherter Formulare hängen daran.
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function shiftDaysFromToday(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function updateFormattedDateInput(input) {
    const display = input
      .closest(".formatted-date-shell")
      ?.querySelector(".formatted-date-display");
    if (!display) return;
    const formattedValue = formatDateInputValue(input.value);
    const displayValue = formattedValue || "TT.MM.JJJJ";
    if (display.textContent !== displayValue) {
      display.textContent = displayValue;
    }
    display.classList.toggle("is-placeholder", !formattedValue);
  }

  function formatTime(timeString) {
    return normalizeTimeValue(timeString) || "–";
  }

  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return "–";
    const datePart = [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getFullYear()).padStart(4, "0"),
    ].join(".");
    const timePart = [
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
    ].join(":");
    return `${datePart}, ${timePart}`;
  }
