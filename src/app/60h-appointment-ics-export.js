  // Termine als Kalenderdatei (iCalendar, RFC 5545) fuer Outlook, Google
  // Kalender oder das Diensthandy. Die UID bleibt je Termin gleich, damit ein
  // erneuter Import den Termin aktualisiert statt ihn zu verdoppeln.
  const ICS_TIME_ZONE = "Europe/Berlin";

  // Outlook verlangt zu jeder TZID eine Zeitzonenbeschreibung in der Datei;
  // die Regeln der EU gelten seit 1996 unveraendert.
  const ICS_TIME_ZONE_BLOCK = [
    "BEGIN:VTIMEZONE",
    `TZID:${ICS_TIME_ZONE}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:MESZ",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:MEZ",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  function exportAppointmentsIcs(appointments) {
    const list = [...appointments].sort(sortAppointments);
    if (!list.length) {
      showToast("Keine Termine zum Exportieren.", "warning");
      return false;
    }
    const filename =
      list.length === 1
        ? `teo-termin_${list[0].date}_${icsFileNamePart(list[0].title)}.ics`
        : `teo-termine_${fileTimestamp(new Date())}.ics`;
    downloadTextFile(filename, appointmentsIcsContent(list), "text/calendar;charset=utf-8");
    showToast(
      list.length === 1
        ? "Der Termin wurde als Kalenderdatei exportiert."
        : `${list.length} Termine wurden als Kalenderdatei exportiert.`,
    );
    return true;
  }

  // Exportiert, was der Terminkalender gerade zeigt: Suche und Zeitraumfilter
  // gelten, angepinnte Termine wie in der Liste immer.
  function exportVisibleAppointmentsIcs() {
    const today = todayIso();
    return exportAppointmentsIcs(
      state.appointments.filter((appointment) => appointmentIsVisible(appointment, today)),
    );
  }

  function appointmentsIcsContent(appointments, now = new Date()) {
    const stamp = icsUtcTimestamp(now);
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//TeO//TeO ${PROJECT_VERSION}//DE`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...(appointments.some((appointment) => appointment.startTime) ? ICS_TIME_ZONE_BLOCK : []),
      ...appointments.flatMap((appointment) => appointmentIcsEvent(appointment, stamp)),
      "END:VCALENDAR",
    ];
    return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
  }

  function appointmentIcsEvent(appointment, stamp) {
    const day = appointment.date.replaceAll("-", "");
    const timing = appointment.startTime
      ? [
          `DTSTART;TZID=${ICS_TIME_ZONE}:${day}T${icsTime(appointment.startTime)}`,
          ...(appointment.endTime
            ? [`DTEND;TZID=${ICS_TIME_ZONE}:${day}T${icsTime(appointment.endTime)}`]
            : []),
        ]
      : [
          // Ganztaegig: Das Ende ist bei Datumswerten der Folgetag, exklusiv.
          `DTSTART;VALUE=DATE:${day}`,
          `DTEND;VALUE=DATE:${addDays(appointment.date, 1).replaceAll("-", "")}`,
        ];
    const category = appointmentCategoryLabel(appointment);
    const lastModified = Date.parse(appointment.updatedAt || "");
    return [
      "BEGIN:VEVENT",
      `UID:${appointment.id}@teo`,
      `DTSTAMP:${stamp}`,
      ...(Number.isFinite(lastModified)
        ? [`LAST-MODIFIED:${icsUtcTimestamp(new Date(lastModified))}`]
        : []),
      ...timing,
      `SUMMARY:${escapeIcsText(appointment.title)}`,
      ...(appointment.location ? [`LOCATION:${escapeIcsText(appointment.location)}`] : []),
      ...(appointment.description
        ? [`DESCRIPTION:${escapeIcsText(appointment.description)}`]
        : []),
      ...(category ? [`CATEGORIES:${escapeIcsText(category)}`] : []),
      ...(appointment.pinned ? ["PRIORITY:1"] : []),
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ];
  }

  function icsTime(time) {
    return `${time.replace(":", "").slice(0, 4)}00`;
  }

  function icsUtcTimestamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function escapeIcsText(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n|\r|\n/g, "\\n");
  }

  // Zeilen ueber 75 Oktette werden umbrochen; die Fortsetzung beginnt mit
  // einem Leerzeichen. Gezaehlt wird in UTF-8, ohne ein Zeichen zu teilen.
  function foldIcsLine(line) {
    const encoder = new TextEncoder();
    const parts = [];
    let current = "";
    let currentBytes = 0;
    for (const character of line) {
      const bytes = encoder.encode(character).length;
      const limit = parts.length ? 74 : 75;
      if (currentBytes + bytes > limit) {
        parts.push(current);
        current = "";
        currentBytes = 0;
      }
      current += character;
      currentBytes += bytes;
    }
    parts.push(current);
    return parts.join("\r\n ");
  }

  function icsFileNamePart(title) {
    return (
      title
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "termin"
    );
  }
