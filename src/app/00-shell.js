(() => {
  "use strict";

  const PROJECT_META = window.TeOProjectMeta;
  if (!PROJECT_META) {
    throw new Error("Die TeO-Projektmetadaten konnten nicht geladen werden.");
  }
  const STORAGE_KEY = "intensivteam-personalverwaltung-v1";
  const LOCAL_SAVE_TIMESTAMP_KEY =
    "intensivteam-personalverwaltung-last-save-v1";
  const SESSION_USER_KEY = "intensivteam-session-user-v1";
  const AUTO_BACKUP_CONFIG_KEY = "intensivteam-auto-backup-config-v1";
  const AUTO_BACKUP_DIRECTORY_KEY = "intensivteam-auto-backup-directory-v1";
  const VACATION_VIEW_KEY = "intensivteam-vacation-view-v1";
  const APPOINTMENT_VIEW_KEY = "intensivteam-appointment-view-v1";
  const STATE_VERSION = PROJECT_META.stateVersion;
  const PROJECT_NAME = PROJECT_META.name;
  const PROJECT_VERSION = PROJECT_META.version;
  const BACKUP_FORMAT = PROJECT_META.backupFormat;
  const BACKUP_FORMAT_VERSION = PROJECT_META.backupFormatVersion;
  const MAX_AUDIT_LOG_ENTRIES = 1000;
  // Ein Schritt im Verlauf ist eine Kopie des Datenbestands ohne Protokoll:
  // mit der Demodatenbank (60 Mitarbeiter, rund 1,3 MB als JSON) etwa 2 MB
  // Arbeitsspeicher, zehn Schritte also rund 20 MB.
  const MAX_UNDO_STEPS = 10;
  // Mehr Betroffene merkt sich ein Protokolleintrag nicht; eine Sammelaktion
  // ueber das ganze Team bleibt so klein.
  const MAX_AUDIT_SUBJECTS = 100;
  const EMPLOYEE_HISTORY_VISIBLE_ENTRIES = 25;
  // Felder eines Mitarbeiters, deren Aenderung der Verlauf beim Namen nennt.
  // Zeitstempel fehlen bewusst: Sie aendern sich bei jedem Speichern mit.
  const EMPLOYEE_FIELD_LABELS = Object.freeze({
    firstName: "Vorname",
    lastName: "Nachname",
    username: "Benutzername",
    birthDate: "Geburtsdatum",
    phone: "Telefon",
    email: "E-Mail",
    profession: "Beruf",
    employmentPercent: "Stellenumfang",
    entryDate: "Eintrittsdatum",
    exitDate: "Austrittsdatum",
    employmentChanges: "Änderungen des Stellenumfangs",
    employmentStatus: "Status",
    serviceWeekend: "Dienstwochenende",
    qualifications: "Qualifikationen",
    qualificationExpiries: "Ablaufdaten",
  });
  // Sammlungen, deren Eintraege einem Mitarbeiter zugeordnet sind.
  const EMPLOYEE_RELATED_COLLECTIONS = Object.freeze([
    {
      key: "completions",
      label: "Fortbildungsnachweis",
      recordKey: (record) => record.id,
      employeeIdsOf: (record) => [record.employeeId],
    },
    {
      key: "meetingAttendances",
      label: "Sitzungsteilnahme",
      recordKey: (record) => record.id,
      employeeIdsOf: (record) => [record.employeeId],
    },
    {
      key: "vacationDays",
      label: "Abwesenheitsplanung",
      recordKey: (record) => `${record.employeeId}:${record.date}`,
      employeeIdsOf: (record) => [record.employeeId],
    },
    {
      key: "vacationEntitlements",
      label: "Urlaubsanspruch",
      recordKey: (record) => `${record.employeeId}:${record.year}`,
      employeeIdsOf: (record) => [record.employeeId],
    },
    {
      key: "deviceInstructions",
      label: "Geräteeinweisung",
      recordKey: (record) => record.id,
      employeeIdsOf: (record) => [
        ...(record.participants || []).map((participant) => participant.employeeId),
        ...(record.instructorEmployeeId ? [record.instructorEmployeeId] : []),
      ],
    },
  ]);
  // Alle fachlichen Sammlungen des Datenbestands mit ihrer Bezeichnung im
  // Aenderungsprotokoll. Aus dieser Liste leiten sich der Protokolltext einer
  // Mutation und die Pruefung ab, ob seit der letzten Sicherung etwas geaendert
  // wurde. Das Aenderungsprotokoll selbst, die Einstellungen und die Kataloge
  // gehoeren bewusst nicht dazu, sie werden gesondert ausgewertet.
  //
  // Fehlt hier eine Sammlung, bleibt sie im Protokoll namenlos UND loest keine
  // Sicherungserinnerung aus - der Datenbestand gilt dann faelschlich als
  // gesichert. tests/tracked-collections.test.mjs gleicht die Liste deshalb
  // gegen den Datenvertrag ab, damit eine neue Sammlung nicht vergessen wird.
  const TRACKED_COLLECTIONS = Object.freeze([
    ["employees", "Mitarbeiter"],
    ["trainings", "Pflichtfortbildungen"],
    ["completions", "Fortbildungsnachweise"],
    ["meetings", "Teamsitzungen"],
    ["meetingAttendances", "Sitzungsteilnahmen"],
    ["appointments", "Termine"],
    ["memos", "Memos und ToDos"],
    ["devices", "Geräte"],
    ["deviceInstructions", "Geräteeinweisungen"],
    ["vacationEntitlements", "Urlaubsansprüche"],
    ["vacationDays", "Abwesenheitsplanung"],
    ["users", "Benutzerkonten"],
  ]);
  const TRACKED_COLLECTION_KEYS = Object.freeze(
    TRACKED_COLLECTIONS.map(([collection]) => collection),
  );
  // Benutzerkonten fuehren bewusst keine Zeitstempel - eine Passwortaenderung
  // soll keinen Zeitpunkt hinterlassen. Ob seit der letzten Sicherung an ihnen
  // gearbeitet wurde, verraet stattdessen das Aenderungsprotokoll.
  const COLLECTIONS_WITHOUT_TIMESTAMPS = Object.freeze(["users"]);
  const DEFAULT_BACKUP_REMINDER_DAYS = 14;
  const DEFAULT_MAX_BACKUP_FILE_SIZE_MB = 20;
  const MIN_BACKUP_FILE_SIZE_MB = 1;
  const MAX_BACKUP_FILE_SIZE_MB = 100;
  const BACKUP_VOLUME_WARNING_RATIO = 0.9;
  const AUTO_BACKUP_DELAY_MS = 2000;
  const AUTO_BACKUP_FILENAME = "teo-autosicherung.json";
  const FOREIGN_BACKUP_NOTICE =
    `Ein anderer Arbeitsplatz hat ${AUTO_BACKUP_FILENAME} zwischenzeitlich ` +
    "geschrieben – es wurde nichts überschrieben. Abmelden, TeO neu laden und " +
    "den Startabgleich wiederholen.";
  const DEFAULT_VACATION_BASE_DAYS = 30;
  const DEFAULT_WEEKEND_A_REFERENCE_SATURDAY = "2026-01-03";
  const DEFAULT_WEEKDAY_ABSENCE_LIMIT = 8;
  const DEFAULT_WEEKEND_ABSENCE_LIMIT = 5;
  const DEFAULT_TRAINING_RECURRENCE_MONTHS = 12;
  const VIOLENCE_PREVENTION_RECURRENCE_MONTHS = 60;
  const DEFAULT_MEMO_CATEGORIES = Object.freeze([
    "Allgemein",
    "Aufgabe",
    "Information",
    "Rückfrage",
  ]);
  const DEADLINE_KINDS = Object.freeze([
    "appointment",
    "birthday",
    "training",
    "qualification",
    "employment",
  ]);
  // Fristarten, die es vor „employment“ gab. Wer seine Auswahl schon einmal
  // gespeichert hat, kannte nur diese; eine neu hinzugekommene Art soll dann
  // eingeschaltet erscheinen, statt stillschweigend zu fehlen.
  const LEGACY_DEADLINE_KINDS = Object.freeze([
    "appointment",
    "birthday",
    "training",
    "qualification",
  ]);
  // Dienstjubiläen, die der Fristenmonitor nennt.
  const SERVICE_ANNIVERSARY_YEARS = Object.freeze([10, 20, 25, 30, 40]);
  const PROBATION_MONTHS = 6;
  // So viele Zeilen zeigt die Liste „Als Nächstes“ höchstens.
  const DASHBOARD_TIMELINE_ROWS = 25;
  const DEADLINE_KIND_LABELS = Object.freeze({
    appointment: "Termine",
    birthday: "Geburtstage",
    training: "Fortbildungen",
    qualification: "Qualifikationen",
    employment: "Personal",
  });
  const DEFAULT_DEVICE_CATALOG_TIMESTAMP = "2026-07-26T00:00:00.000Z";
  const DEFAULT_DEVICE_CATALOG = Object.freeze([
    ["Abbot", "ID-Now", "POCT-Gerät", true, false],
    ["Abiomed", "Impella", "Herzunterstützungspumpe", true, true],
    ["Aerogen", "USB-Controller", "Ultraschallvernebler", true, true],
    ["AKS", "Goliath", "Patientenlifter", false, false],
    ["Anandic", "Mistral Air", "Wärmegebläse", true, false],
    ["Arjo", "Sara 3000", "Steh- und Aufrichthilfe", false, false],
    ["Barkey", "Plasmatherm", "Nicht kategorisiert", true, false],
    ["BD", "Arctic Sun 5000", "Nicht kategorisiert", true, true],
    ["Boston Scientific", "EKOS", "Nicht kategorisiert", true, true],
    ["Braun", "Infusomat Space", "Nicht kategorisiert", true, true],
    ["Braun", "Pefusor Space", "Nicht kategorisiert", true, true],
    ["Corpuls", "C3", "Nicht kategorisiert", false, true],
    ["Covidien", "Genius 3", "Ohrthermometer", true, false],
    ["Customed", "EKG-Gerät + Software", "Nicht kategorisiert", true, false],
    [
      "Dahlhausen / TIM",
      "Mirus incl. Lisa & ORS",
      "Nicht kategorisiert",
      true,
      true,
    ],
    [
      "Dedalus",
      "Orbis incl. ICU-Manager, Medication & Flycicle Vision",
      "Nicht kategorisiert",
      true,
      true,
    ],
    ["Dräger", "Aquapor H300", "Nicht kategorisiert", true, true],
    ["Dräger", "Carina", "Nicht kategorisiert", true, true],
    ["Dräger", "M540", "Nicht kategorisiert", true, true],
    ["Dräger", "Oxylog 3000", "Nicht kategorisiert", true, true],
    ["Dräger", "V500", "Nicht kategorisiert", true, true],
    ["Dräger", "V600 / V800", "Nicht kategorisiert", true, true],
    ["Dräger", "Zentrale", "Nicht kategorisiert", true, true],
    ["Eden Medical", "PiCCO2 Monitor", "Nicht kategorisiert", true, true],
    ["Fisher & Paykel", "AirVo 2", "Nicht kategorisiert", true, true],
    ["Fresenius", "5008S + Aqua C uno", "Nicht kategorisiert", true, true],
    ["Fresenius", "Multifiltrate Pro", "Nicht kategorisiert", true, true],
    ["Getinge", "PulsioFlex Monitor", "Nicht kategorisiert", true, true],
    ["Hamilton", "MR1", "Nicht kategorisiert", true, true],
    ["Helmer", "Agitator", "Nicht kategorisiert", true, false],
    ["Hemochron", "Signature Elite", "Nicht kategorisiert", true, false],
    ["Hill Rom", "Progressa", "Therapiebett", true, false],
    ["Hypercom Gematik", "Medline", "Kartenlesegerät", true, false],
    [
      "Instrumentation Laboratory",
      "GEM Premier 5000",
      "Nicht kategorisiert",
      true,
      false,
    ],
    ["KCI", "Acti-VAC", "Nicht kategorisiert", true, false],
    [
      "Kirsch",
      "BL-300",
      "Blutkonserven- und Medikamentenkühlschrank",
      true,
      false,
    ],
    ["Marquet", "Cardiohelp", "ECMO", true, true],
    ["Medela", "Thopaz (+)", "Nicht kategorisiert", true, true],
    ["Medical Econet", "Palmcare Pro", "Pulsoxymeter", true, false],
    ["Medior", "Mobilizer", "Nicht kategorisiert", true, false],
    ["Meiko", "Topline", "Spülanlage", true, false],
    ["Mindray", "PM-60", "Pulsoxymeter", true, false],
    ["Narcotrend", "Compact-M", "Nicht kategorisiert", true, false],
    ["Nova Biomeidical", "StatStrip", "Blutzuckermessgerät", true, false],
    ["NovaLung", "NovaFlow", "ILA", true, true],
    ["Nutricia", "Flocare", "Ernährungspumpe", true, false],
    [
      "Physiocontrol / Stryker",
      "Lifepack 20 / 20e",
      "Nicht kategorisiert",
      true,
      true,
    ],
    [
      "Physiocontrol / Stryker",
      "Lifepak 10",
      "Nicht kategorisiert",
      true,
      true,
    ],
    ["Roche", "Accu-Chek", "BZ-Gerät", true, false],
    ["Roche", "CoaguChek", "Nicht kategorisiert", true, false],
    ["Seca", "Secura 959", "Patientenwaage", true, false],
    ["SLK Medical", "Pain & Therapy", "Nicht kategorisiert", true, false],
    ["Smiths Medical", "CADD", "Nicht kategorisiert", true, true],
    ["Stiegelmeyer", "Krankenhausbett gelb", "Nicht kategorisiert", true, false],
    [
      "Stiegelmeyer",
      "Stiegelmeyer Krankenhausbett braun",
      "Nicht kategorisiert",
      true,
      false,
    ],
    ["Teleflex", "EZ-IO G3", "Intraossärbohrer", true, true],
    ["TriMedika", "Tritemp TR1", "Ohrthermometer", true, false],
    ["Völker", "S962-2 / S 982", "Krankenhausbett", true, false],
    ["Weihmann", "Accuvac Pro", "Nicht kategorisiert", true, false],
    ["Zoll", "X-Series", "Nicht kategorisiert", true, true],
  ]);

  const THEMES = {
    standard: "Standard",
    dark: "Dark Mode",
    "solarized-light": "Solarized Light",
    nord: "Nord",
    dracula: "Dracula",
    "gruvbox-dark": "Gruvbox Dark",
    "tokyo-night": "Tokyo Night",
    "catppuccin-latte": "Catppuccin Latte",
    github: "GitHub",
    "github-dark": "GitHub Dark",
    "windows-95": "Windows 95",
    cellitinnen: "Cellitinnen",
    "cellitinnen-red": "Cellitinnen Rot",
  };
  const DARK_THEMES = new Set([
    "dark",
    "nord",
    "dracula",
    "gruvbox-dark",
    "tokyo-night",
    "github-dark",
  ]);

  // Symbolsaetze. "Standard" sind die eigenen Zeichnungen der Sprite, die
  // uebrigen stammen aus freien Symbolsaetzen (ICON_SET_SYMBOLS). Jeder Satz
  // laesst sich mit jedem Farbthema kombinieren.
  const ICON_SETS = {
    standard: "TeO (Standard)",
    lucide: "Lucide",
    tabler: "Tabler",
    heroicons: "Heroicons",
    phosphor: "Phosphor",
  };

  const PASSWORD_ITERATIONS = 210000;
  const USER_FIRST_NAME_FALLBACKS = {
    becke003: "Oliver",
    botze003: "Elisabeth",
    ferre001: "Claudio",
  };

  const DEFAULT_QUALIFICATIONS = {
    stationsleitung: "Stationsleitung",
    stellvertretendeStationsleitung: "Stellvertretende Stationsleitung",
    fachweiterbildungIA: "Fachweiterbildung I/A",
    praxisanleiter: "Praxisanleiter/in",
    hygienebeauftragter: "Hygienebeauftragte/r",
    wundexperte: "Wundexperte/in",
    demenzexperte: "Demenzexperte/in",
    brandschutzbeauftragter: "Brandschutzbeauftragte/r",
    medizinproduktebeauftragter: "Medizinproduktebeauftragte/r",
  };
  const LEADERSHIP_QUALIFICATION_IDS = Object.freeze([
    "stationsleitung",
    "stellvertretendeStationsleitung",
  ]);

  const DEFAULT_PROFESSIONS = [
    "Pflegefachkraft",
    "Intensivtechnische/r Assistent/in",
    "Pflegefachassistenz",
    "Medizinische/r Fachangestellte/r",
    "Stationsassistenz",
  ];
  const CARE_PROFESSION_ALIASES = new Set([
    "gesundheits- und krankenpfleger/in",
    "3-jährig examiniert",
  ]);
  // Diese Berufsgruppen gehoeren nicht zum Pflegepool, der die Tagesgrenze der
  // Urlaubsplanung traegt. Ihre Abwesenheiten bleiben sichtbar, zaehlen aber
  // nicht gegen die Zahl der gleichzeitig moeglichen Urlaube. Verglichen wird
  // eine normalisierte Schreibweise, damit Varianten wie „Medizinische
  // Fachangestellte“ oder „Med. Fachangestellter“ ebenfalls erkannt werden.
  const ABSENCE_LIMIT_EXEMPT_PROFESSION_PATTERNS = Object.freeze([
    "fachangestellt",
    "mfa",
    "pflegefachassisten",
    "stationsassisten",
  ]);


  // Gruppen der Sortierung „nach Qualifikation“ in der Urlaubsplanung. Die
  // Reihenfolge hier ist die Vorgabe; in den Einstellungen laesst sie sich
  // umstellen. Welche Gruppe ein Mitarbeiter traegt, entscheidet dagegen
  // eine feste Rangfolge (siehe vacationSortGroupOf), damit ein Umsortieren
  // niemanden in eine andere Gruppe verschiebt.
  const VACATION_SORT_GROUPS = Object.freeze({
    stationsleitung: "Stationsleitung",
    stellvertretendeStationsleitung: "Stellv. Stationsleitung",
    fachweiterbildung: "Fachweiterbildung",
    pflegefachkraft: "Pflegefachkraft",
    onboarding: "Aktuell in Einarbeitung",
    ita: "ITA",
    pflegefachassistenz: "Pflegefachassistenz",
    mfa: "MFA",
    stationsassistenz: "Stationsassistenz",
  });
  const DEFAULT_VACATION_SORT_GROUP_ORDER = Object.freeze(
    Object.keys(VACATION_SORT_GROUPS),
  );
  // Bis zu diesem Tag (MM-TT) muss uebertragener Resturlaub genommen sein.
  const DEFAULT_VACATION_CARRY_OVER_EXPIRY = "03-31";
  // Abwesenheiten, die sich in der Regel nicht verschieben lassen. Die
  // Übersicht der Überschneidungen zeigt sie ausgegraut vorn.
  const FIXED_ABSENCE_TYPES = Object.freeze(["school", "external"]);
  const VACATION_SORT_MODES = Object.freeze({
    name: "Nachname (alphabetisch)",
    qualification: "Qualifikation",
  });

  const SERVICE_WEEKENDS = {
    none: "Kein festes Dienstwochenende",
    weekend_a: "Wochenende A",
    weekend_b: "Wochenende B",
  };
  const SERVICE_WEEKEND_KEYS = Object.freeze(["weekend_a", "weekend_b"]);

  // Vorbelegung nach der amtlichen Ferienordnung NRW für die Schuljahre
  // 2024/25 bis 2029/30: https://bass.schule.nrw/19662.htm
  // Massgeblich ist zur Laufzeit settings.schoolVacationPeriods; diese Liste
  // dient nur der Erstbefuellung und dem Wiedereinsetzen in den Einstellungen.
  const NRW_SCHOOL_VACATION_PERIODS = [
    { start: "2024-12-23", end: "2025-01-06", label: "Weihnachtsferien" },
    { start: "2025-04-14", end: "2025-04-26", label: "Osterferien" },
    { start: "2025-06-10", end: "2025-06-10", label: "Pfingstferien" },
    { start: "2025-07-14", end: "2025-08-26", label: "Sommerferien" },
    { start: "2025-10-13", end: "2025-10-25", label: "Herbstferien" },
    { start: "2025-12-22", end: "2026-01-06", label: "Weihnachtsferien" },
    { start: "2026-03-30", end: "2026-04-11", label: "Osterferien" },
    { start: "2026-05-26", end: "2026-05-26", label: "Pfingstferien" },
    { start: "2026-07-20", end: "2026-09-01", label: "Sommerferien" },
    { start: "2026-10-17", end: "2026-10-31", label: "Herbstferien" },
    { start: "2026-12-23", end: "2027-01-06", label: "Weihnachtsferien" },
    { start: "2027-03-22", end: "2027-04-03", label: "Osterferien" },
    { start: "2027-05-18", end: "2027-05-18", label: "Pfingstferien" },
    { start: "2027-07-19", end: "2027-08-31", label: "Sommerferien" },
    { start: "2027-10-23", end: "2027-11-06", label: "Herbstferien" },
    { start: "2027-12-24", end: "2028-01-08", label: "Weihnachtsferien" },
    { start: "2028-04-10", end: "2028-04-22", label: "Osterferien" },
    { start: "2028-07-10", end: "2028-08-22", label: "Sommerferien" },
    { start: "2028-10-23", end: "2028-11-04", label: "Herbstferien" },
    { start: "2028-12-21", end: "2029-01-05", label: "Weihnachtsferien" },
    { start: "2029-03-26", end: "2029-04-07", label: "Osterferien" },
    { start: "2029-05-22", end: "2029-05-22", label: "Pfingstferien" },
    { start: "2029-07-02", end: "2029-08-14", label: "Sommerferien" },
    { start: "2029-10-15", end: "2029-10-27", label: "Herbstferien" },
    { start: "2029-12-20", end: "2030-01-04", label: "Weihnachtsferien" },
    { start: "2030-04-15", end: "2030-04-27", label: "Osterferien" },
  ];
  const MAX_SCHOOL_VACATION_PERIODS = 500;

  // Optionale Terminkategorie. Der leere Schluessel bleibt zulaessig: Termine
  // ohne Kategorie behalten das allgemeine Kalendersymbol.
  const APPOINTMENT_CATEGORIES = Object.freeze({
    geraeteeinweisung: { label: "Geräteeinweisung", icon: "device" },
    teamsitzung: { label: "Teamsitzung", icon: "meeting" },
    meeting: { label: "Meeting", icon: "users" },
    stationsleiterkonferenz: {
      label: "Stationsleiterkonferenz",
      icon: "star",
    },
    begehung: { label: "Begehung", icon: "search" },
    hospitation: { label: "Hospitation", icon: "eye" },
    pruefung: { label: "Prüfung", icon: "clipboard-check" },
    schulung: { label: "Schulung", icon: "training" },
    baumassnahme: { label: "Baumaßnahme", icon: "construction" },
  });
  const APPOINTMENT_CATEGORY_FALLBACK_ICON = "calendar";
  // Wie viele Termine ein Tag im Monatskalender zeigt, bevor der Rest hinter
  // "+n weitere" liegt. Der Wert steckt zusaetzlich in der Regel
  // .appointment-calendar-day-entries li:nth-child(n + 4) im Stylesheet.
  const APPOINTMENT_CALENDAR_ENTRY_LIMIT = 3;

  const EMPLOYMENT_STATUSES = {
    active: "Aktiv",
    onboarding: "In Einarbeitung",
    inactive: "Inaktiv",
  };

  const PLANNER_ENTRY_TYPES = {
    vacation: {
      label: "Urlaub",
      shortLabel: "U",
      isAbsence: true,
      countsVacationEntitlement: true,
    },
    onboardingVacation: {
      label: "Urlaub Einarbeitung",
      shortLabel: "UE",
      isAbsence: false,
      countsVacationEntitlement: true,
    },
    school: {
      label: "Schule / Weiterbildung / Uni",
      shortLabel: "S",
      isAbsence: true,
      countsVacationEntitlement: false,
    },
    unpaid: {
      label: "Unbezahlter Urlaub",
      shortLabel: "uU",
      isAbsence: true,
      countsVacationEntitlement: false,
    },
    nightDuty: {
      label: "Nachtdienst",
      shortLabel: "N",
      isAbsence: false,
      countsVacationEntitlement: false,
    },
    external: {
      label: "Externer Einsatz",
      shortLabel: "E",
      isAbsence: true,
      countsVacationEntitlement: false,
    },
    plannedOff: {
      label: "Frei geplant",
      shortLabel: "×",
      isAbsence: true,
      countsVacationEntitlement: false,
    },
    mandatoryDuty: {
      label: "Verpflichtende Dienstzusage",
      shortLabel: "D",
      isAbsence: false,
      countsVacationEntitlement: false,
    },
  };

  // Tastenbelegung der Planungstabelle. Die Kuerzel in den Feldern sind als
  // Taste und Feldkuerzel sind voneinander unabhaengig, damit alle Eintragsarten
  // eine eindeutige Tastaturzuordnung besitzen.
  const PLANNER_ENTRY_KEYS = Object.freeze({
    u: "vacation",
    a: "onboardingVacation",
    s: "school",
    b: "unpaid",
    n: "nightDuty",
    e: "external",
    f: "plannedOff",
    d: "mandatoryDuty",
  });
  const PLANNER_NAVIGATION_KEYS = Object.freeze([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ]);

  const ATTENDANCE_STATUSES = {
    teilgenommen: { label: "Teilgenommen", tone: "green" },
    urlaub: { label: "Urlaub", tone: "blue" },
    dienst: { label: "Dienst", tone: "purple" },
    krankheit: { label: "Krankheit", tone: "red" },
    schule: { label: "Schule", tone: "teal" },
    entschuldigt: { label: "Entschuldigt", tone: "orange" },
    unentschuldigt: { label: "Unentschuldigt", tone: "dark-red" },
    nicht_zutreffend: { label: "Nicht zutreffend", tone: "muted" },
  };

  const ATTENDANCE_CHART_COLORS = {
    teilgenommen: "#2b9b68",
    urlaub: "#4f8fdf",
    dienst: "#805bad",
    krankheit: "#d2525d",
    schule: "#25a29d",
    entschuldigt: "#dc8a31",
    unentschuldigt: "#9f2731",
    nicht_zutreffend: "#9aa5b1",
    open: "#cdd5dd",
  };

  const VIEW_HASHES = {
    dashboard: "uebersicht",
    employees: "mitarbeiter",
    weekends: "wochenendverteilung",
    vacations: "urlaubsplanung",
    appointments: "terminkalender",
    memos: "memo-todo",
    trainings: "pflichtfortbildungen",
    meetings: "teamsitzungen",
    devices: "geraeteeinweisungen",
    "device-management": "geraeteverwaltung",
    settings: "einstellungen",
    help: "hilfe",
  };

  const HASH_VIEWS = Object.fromEntries(
    Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view]),
  );
