/* Generiert aus src/app/*.js – Änderungen dort vornehmen. */
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
  ]);
  // So viele Fristen bleiben im Monitor sichtbar, weitere sind scrollbar.
  const VISIBLE_DEADLINE_ROWS = 6;
  const DEADLINE_KIND_LABELS = Object.freeze({
    appointment: "Termine",
    birthday: "Geburtstage",
    training: "Fortbildungen",
    qualification: "Qualifikationen",
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
  ]);

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
    "Pflegefachassistenz",
    "Medizinische/r Fachangestellte/r",
    "Stationsassistenz",
    "Arzt/Ärztin",
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

  let state = emptyState();
  // Sichtbare Ansicht und die Ansichten, deren Inhalt seit der letzten
  // Aenderung veraltet ist. Verdeckte Ansichten werden nicht mitgerendert,
  // sondern erst beim Wechsel dorthin nachgezogen.
  let activeView = "dashboard";
  const staleViews = new Set();
  let dataStore = null;
  let dataSyncChannel = null;
  let backendConfig = { mode: "local", apiUrl: "" };
  let backendMode = "local";
  let remoteRevision = 0;
  let pendingRemoteConflictState = null;
  // Der letzte Schritt, der sich zurücknehmen lässt: der Datenbestand, wie er
  // vor der Änderung aussah, und ihre Bezeichnung für Meldung und Protokoll.
  // Jede weitere Änderung räumt ihn ab - zurück geht es immer nur einen
  // Schritt, und zwar den zuletzt gemeldeten.
  let undoableMutation = null;
  let backendStartupError = "";
  let backendHealth = null;
  let backendConnectionStatus = "local";
  let backendLastContactAt = "";
  let backendLastSyncAt = "";
  let localLastSaveAt = "";
  let backendConnectionError = "";
  let remoteSyncTimer = null;
  let remoteUpdateNoticeRevision = 0;
  let employeeStatusFilter = "all";
  let employeeSearchTerm = "";
  let appointmentPeriodFilter = "all";
  let appointmentSearchTerm = "";
  // Listen- oder Monatsansicht des Terminkalenders samt angezeigtem Monat.
  // Beides ist reine Darstellung und bleibt deshalb im Browser, nicht im
  // gemeinsamen Datenbestand.
  const savedAppointmentView = readAppointmentViewPreference();
  let appointmentViewMode = savedAppointmentView.mode;
  let appointmentCalendarYear = savedAppointmentView.year;
  let appointmentCalendarMonth = savedAppointmentView.month;
  let memoSearchTerm = "";
  let memoCategoryFilter = "all";
  let memoStatusFilter = "open";
  let completionSearchTerm = "";
  let selectedCompletionEmployeeIds = new Set();
  let attendanceSearchTerm = "";
  let attendanceStatusFilter = "all";
  let attendanceDraft = new Map();
  let attendanceEmployeeIds = [];
  let confirmCallback = null;
  let backupPasswordResolver = null;
  let currentUser = null;
  let selectedEmployeeIds = new Set();
  let employeeProfessionFilter = "all";
  let employeeQualificationFilter = "all";
  let employeeWeekendFilter = "all";
  let employeeSortKey = "name";
  let employeeSortDirection = "asc";
  let currentWeekendSimulation = null;
  let trainingRecurrenceManuallyChanged = false;
  let trainingDisplayYear = new Date().getFullYear();
  let meetingDisplayYear = new Date().getFullYear();
  let backupReminderShown = false;
  let databaseSaveReminderArmed = false;
  let automaticBackupSettings = null;
  let automaticBackupDirectoryHandle = null;
  let automaticBackupPassword = "";
  let automaticBackupTimer = null;
  let automaticBackupRunning = false;
  // Zaehlt erfolgreich gespeicherte Aenderungen am Datenbestand. Die
  // automatische Sicherung erkennt daran, ob waehrend des Schreibens eine
  // weitere Aenderung dazugekommen ist. Ein Renderdurchlauf zaehlt bewusst
  // nicht mit - sonst bliebe die Sicherungserinnerung nach einer erfolgreichen
  // Sicherung stehen, nur weil zwischendurch neu gezeichnet wurde.
  let stateMutationSequence = 0;
  let automaticBackupRetryAt = 0;
  let automaticBackupNotice = "";
  let startupBackupSynchronized = false;
  let startupBackupImportRunning = false;
  let browserPersistenceNotice = "";
  // Beim Laden verworfene Benutzerkonten, damit der Verlust nicht unbemerkt
  // bleibt. Wird nach dem Start einmalig gemeldet.
  let discardedUserAccounts = 0;
  let dateInputObserver = null;
  const savedVacationView = readVacationViewPreference();
  let vacationYear = savedVacationView.year;
  let vacationMonth = savedVacationView.month;
  let vacationEntryType = "vacation";
  let vacationEmployeeSearchTerm = "";
  // Tastaturbedienung der Planungstabelle: zuletzt angesteuertes Feld als
  // Zeilen-/Spaltenindex sowie der Ankerpunkt einer mit Umschalt aufgezogenen
  // Bereichsmarkierung. Die beiden Listen halten die aktuell gezeichneten
  // Koordinaten, damit die Navigation zum Namensfilter passt.
  let vacationFocus = null;
  let vacationSelectionAnchor = null;
  let vacationVisibleEmployeeIds = [];
  let vacationVisibleDates = [];
  let vacationPlannerWidgetAnchor = null;
  let deviceMatrixWidgetAnchor = null;
  let deviceInventoryFilter = "current";
  let deviceAnnexFilter = "all";
  let deviceCategoryFilter = "all";
  let deviceSearchTerm = "";
  let deviceManagementSearchTerm = "";
  let deviceManagementInventoryFilter = "current";
  let deviceManagementAnnexFilter = "all";
  let deviceManagementCategoryFilter = "all";
  let deviceManagementAuthorizationFilter = "all";
  let deviceEmployeeStatusFilter = "employed";
  let deviceEmployeeSearchTerm = "";
  let deviceOverviewDeviceId = "";
  let deviceOverviewInstructionFilter = "all";
  let deviceOverviewEmploymentFilter = "employed";
  let deviceOverviewSearchTerm = "";
  let deviceParticipantSearchTerm = "";
  let deviceParticipantDraft = new Map();
  let deviceInstructionSearchTerm = "";
  // Sortierung der erfassten Einweisungen: nach Einweisungsdatum oder danach,
  // wann der Nachweis erfasst wurde.
  let deviceInstructionSortKey = "createdAt";
  const VISIBLE_DEVICE_INSTRUCTION_ROWS = 10;
  // Sichtbar sind zehn Zeilen, der Kasten scrollt. Alles auf einmal
  // aufzubauen kostet bei einem gewachsenen Protokoll mehr als eine
  // Sekunde - der Rest kommt auf Wunsch nach.
  const DEVICE_INSTRUCTION_LOG_PAGE = 50;
  let deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
  // So viele Geraete bleiben in der Auswahl sichtbar, weitere sind scrollbar.
  const VISIBLE_INSTRUCTION_DEVICES = 5;
  // Mehrere Geraete koennen mit denselben Angaben auf einmal dokumentiert
  // werden; beim Bearbeiten bleibt es bei genau einem Geraet.
  let deviceInstructionDeviceDraft = new Set();
  let deviceInstructionDeviceSearchTerm = "";
  const cleanFormSnapshots = new WeakMap();
  let activeSettingsSection = "general";
  let stickyHeaderFrame = 0;

  const elements = {
    navEmployeeCount: document.querySelector("#navEmployeeCount"),
    navTrainingCount: document.querySelector("#navTrainingCount"),
    navMeetingCount: document.querySelector("#navMeetingCount"),
    navAppointmentCount: document.querySelector("#navAppointmentCount"),
    navMemoCount: document.querySelector("#navMemoCount"),
    navDeviceManagementCount: document.querySelector("#navDeviceManagementCount"),
    mobileCreateButton: document.querySelector("#mobileCreateButton"),
    databaseSaveWarning: document.querySelector("#databaseSaveWarning"),
    databaseSaveWarningText: document.querySelector(
      "#databaseSaveWarningText",
    ),
    databaseSaveWarningExportButton: document.querySelector(
      "#databaseSaveWarningExportButton",
    ),
    helpSearch: document.querySelector("#helpSearch"),
    helpSearchStatus: document.querySelector("#helpSearchStatus"),
    clearHelpSearch: document.querySelector("#clearHelpSearch"),
    helpNoResults: document.querySelector("#helpNoResults"),
    helpContentHost: document.querySelector("#helpContentHost"),
    helpContentTemplate: document.querySelector("#helpContentTemplate"),
    mobileThemeButton: document.querySelector("#mobileThemeButton"),
    mobileAccountButton: document.querySelector("#mobileAccountButton"),
    currentUsername: document.querySelector("#currentUsername"),
    currentUserRole: document.querySelector("#currentUserRole"),
    sidebarSystemStatus: document.querySelector("#sidebarSystemStatus"),
    sidebarConnectionLabel: document.querySelector("#sidebarConnectionLabel"),
    sidebarBackendLabel: document.querySelector("#sidebarBackendLabel"),
    sidebarServerLabel: document.querySelector("#sidebarServerLabel"),
    sidebarRevisionLabel: document.querySelector("#sidebarRevisionLabel"),
    sidebarSchemaLabel: document.querySelector("#sidebarSchemaLabel"),
    sidebarSyncLabel: document.querySelector("#sidebarSyncLabel"),
    dashboardTrainingProgress: document.querySelector("#dashboardTrainingProgress"),
    dashboardGreeting: document.querySelector("#dashboardGreeting"),
    projectBuildLabel: document.querySelector("#projectBuildLabel"),
    loginProjectVersion: document.querySelector("#loginProjectVersion"),
    deadlineOverview: document.querySelector("#deadlineOverview"),
    deadlineHorizon: document.querySelector("#deadlineHorizon"),
    deadlineFilters: [...document.querySelectorAll("[data-deadline-filter]")],
    deadlineHideOverdue: document.querySelector("#deadlineHideOverdue"),
    dashboardPriorityGrid: document.querySelector("#dashboardPriorityGrid"),
    dashboardMemoPanel: document.querySelector("#dashboardMemoPanel"),
    dashboardMemoList: document.querySelector("#dashboardMemoList"),
    recentEmployees: document.querySelector("#recentEmployees"),
    employeeTable: document.querySelector("#employeeTable"),
    employeeSearch: document.querySelector("#employeeSearch"),
    copyActiveEmailsButton: document.querySelector("#copyActiveEmailsButton"),
    appointmentCategory: document.querySelector("#appointmentCategory"),
    mainNav: document.querySelector("#mainNav"),
    resetSidebarOrderButton: document.querySelector("#resetSidebarOrderButton"),
    sidebarToggle: document.querySelector("#sidebarToggle"),
    sidebarOrderStatus: document.querySelector("#sidebarOrderStatus"),
    settingsSidebarSubnav: document.querySelector("#settingsSidebarSubnav"),
    copyActiveEmailsLabel: document.querySelector("#copyActiveEmailsLabel"),
    copyUsernamesButton: document.querySelector("#copyUsernamesButton"),
    copyUsernamesLabel: document.querySelector("#copyUsernamesLabel"),
    exportEmployeePhoneListButton: document.querySelector(
      "#exportEmployeePhoneListButton",
    ),
    exportEmployeePhoneListLabel: document.querySelector(
      "#exportEmployeePhoneListLabel",
    ),
    exportDataButton: document.querySelector("#exportDataButton"),
    importDataButton: document.querySelector("#importDataButton"),
    importDataFile: document.querySelector("#importDataFile"),
    validateBackupButton: document.querySelector("#validateBackupButton"),
    validateBackupFile: document.querySelector("#validateBackupFile"),
    exportEncryptedDataButton: document.querySelector("#exportEncryptedDataButton"),
    backupStatus: document.querySelector("#backupStatus"),
    automaticBackupStatus: document.querySelector("#automaticBackupStatus"),
    automaticBackupEncryption: document.querySelector(
      "#automaticBackupEncryption",
    ),
    setAutomaticBackupPasswordButton: document.querySelector(
      "#setAutomaticBackupPasswordButton",
    ),
    saveAutomaticBackupSettingsButton: document.querySelector(
      "#saveAutomaticBackupSettingsButton",
    ),
    selectAutomaticBackupDirectoryButton: document.querySelector(
      "#selectAutomaticBackupDirectoryButton",
    ),
    runAutomaticBackupButton: document.querySelector("#runAutomaticBackupButton"),
    removeAutomaticBackupDirectoryButton: document.querySelector(
      "#removeAutomaticBackupDirectoryButton",
    ),
    browserStorageStatus: document.querySelector("#browserStorageStatus"),
    requestPersistentStorageButton: document.querySelector(
      "#requestPersistentStorageButton",
    ),
    settingsStorageBackend: document.querySelector("#settingsStorageBackend"),
    mariaDbSettingsFields: document.querySelector("#mariaDbSettingsFields"),
    settingsMariaDbApiUrl: document.querySelector("#settingsMariaDbApiUrl"),
    settingsMariaDbPassword: document.querySelector("#settingsMariaDbPassword"),
    settingsMariaDbBootstrapToken: document.querySelector(
      "#settingsMariaDbBootstrapToken",
    ),
    settingsBackendHint: document.querySelector("#settingsBackendHint"),
    settingsBackendStatus: document.querySelector("#settingsBackendStatus"),
    testBackendConnectionButton: document.querySelector(
      "#testBackendConnectionButton",
    ),
    applyStorageBackendButton: document.querySelector(
      "#applyStorageBackendButton",
    ),
    settingsBackupReminderDays: document.querySelector(
      "#settingsBackupReminderDays",
    ),
    settingsMaxBackupFileSizeMb: document.querySelector(
      "#settingsMaxBackupFileSizeMb",
    ),
    backupVolumeMeter: document.querySelector("#backupVolumeMeter"),
    backupVolumeLabel: document.querySelector("#backupVolumeLabel"),
    backupVolumeHint: document.querySelector("#backupVolumeHint"),
    settingsCloseDialogOnOutsideClick: document.querySelector(
      "#settingsCloseDialogOnOutsideClick",
    ),
    schoolVacationCount: document.querySelector("#schoolVacationCount"),
    schoolVacationForm: document.querySelector("#schoolVacationForm"),
    schoolVacationList: document.querySelector("#schoolVacationList"),
    newSchoolVacationStart: document.querySelector("#newSchoolVacationStart"),
    newSchoolVacationEnd: document.querySelector("#newSchoolVacationEnd"),
    newSchoolVacationLabel: document.querySelector("#newSchoolVacationLabel"),
    restoreOfficialSchoolVacationsButton: document.querySelector(
      "#restoreOfficialSchoolVacationsButton",
    ),
    saveGeneralSettingsButton: document.querySelector(
      "#saveGeneralSettingsButton",
    ),
    settingsWeekendNameA: document.querySelector("#settingsWeekendNameA"),
    settingsWeekendOwnerA: document.querySelector("#settingsWeekendOwnerA"),
    settingsWeekendNameB: document.querySelector(
      "#settingsWeekendNameB",
    ),
    settingsWeekendOwnerB: document.querySelector(
      "#settingsWeekendOwnerB",
    ),
    saveWeekendSettingsButton: document.querySelector(
      "#saveWeekendSettingsButton",
    ),
    openAuditLogButton: document.querySelector("#openAuditLogButton"),
    employeeProfessionFilter: document.querySelector("#employeeProfessionFilter"),
    employeeQualificationFilter: document.querySelector("#employeeQualificationFilter"),
    employeeWeekendFilter: document.querySelector("#employeeWeekendFilter"),
    resetEmployeeFilters: document.querySelector("#resetEmployeeFilters"),
    employeeBulkBar: document.querySelector("#employeeBulkBar"),
    employeeBulkCount: document.querySelector("#employeeBulkCount"),
    openBulkEditButton: document.querySelector("#openBulkEditButton"),
    deleteEmployeeSelection: document.querySelector("#deleteEmployeeSelection"),
    clearEmployeeSelection: document.querySelector("#clearEmployeeSelection"),
    openWeekendOverviewButton: document.querySelector("#openWeekendOverviewButton"),
    openWeekendPrintButton: document.querySelector("#openWeekendPrintButton"),
    openWeekendSimulationButton: document.querySelector(
      "#openWeekendSimulationButton",
    ),
    weekendDistributionContent: document.querySelector("#weekendDistributionContent"),
    vacationYear: document.querySelector("#vacationYear"),
    vacationMonth: document.querySelector("#vacationMonth"),
    vacationEntryType: document.querySelector("#vacationEntryType"),
    vacationEmployeeSearch: document.querySelector("#vacationEmployeeSearch"),
    vacationBaseDays: document.querySelector("#vacationBaseDays"),
    vacationWeekdayAbsenceLimit: document.querySelector(
      "#vacationWeekdayAbsenceLimit",
    ),
    vacationWeekendAbsenceLimit: document.querySelector(
      "#vacationWeekendAbsenceLimit",
    ),
    vacationWeekendAReferenceSaturday: document.querySelector(
      "#vacationWeekendAReferenceSaturday",
    ),
    vacationWeekendAReferenceLabel: document.querySelector(
      "#vacationWeekendAReferenceLabel",
    ),
    vacationWeekendALegend: document.querySelector(
      "#vacationWeekendALegend",
    ),
    vacationWeekendBLegend: document.querySelector(
      "#vacationWeekendBLegend",
    ),
    saveVacationSettingsButton: document.querySelector("#saveVacationSettingsButton"),
    openVacationConflictsButton: document.querySelector(
      "#openVacationConflictsButton",
    ),
    printBlankVacationYearOverviewsButton: document.querySelector(
      "#printBlankVacationYearOverviewsButton",
    ),
    vacationBlankYearPrintSurface: document.querySelector(
      "#vacationBlankYearPrintSurface",
    ),
    printBlankVacationMonthPlansButton: document.querySelector(
      "#printBlankVacationMonthPlansButton",
    ),
    vacationBlankMonthPrintSurface: document.querySelector(
      "#vacationBlankMonthPrintSurface",
    ),
    vacationSummary: document.querySelector("#vacationSummary"),
    vacationPlannerWidget: document.querySelector("#vacationPlannerWidget"),
    vacationPlanner: document.querySelector("#vacationPlanner"),
    toggleVacationPlannerMaximizeButton: document.querySelector(
      "#toggleVacationPlannerMaximizeButton",
    ),
    vacationPlannerMaximizeIcon: document.querySelector(
      "#vacationPlannerMaximizeIcon",
    ),
    vacationPlannerMaximizeLabel: document.querySelector(
      "#vacationPlannerMaximizeLabel",
    ),
    previousVacationMonthButton: document.querySelector(
      "#previousVacationMonthButton",
    ),
    nextVacationMonthButton: document.querySelector("#nextVacationMonthButton"),
    openDataQualityButton: document.querySelector("#openDataQualityButton"),
    trainingDisplayYear: document.querySelector("#trainingDisplayYear"),
    trainingSummary: document.querySelector("#trainingSummary"),
    trainingList: document.querySelector("#trainingList"),
    openTrainingTimeCalculatorButton: document.querySelector(
      "#openTrainingTimeCalculatorButton",
    ),
    openTrainingMatrixButton: document.querySelector("#openTrainingMatrixButton"),
    trainingDurationSettings: document.querySelector("#trainingDurationSettings"),
    saveTrainingDurationsButton: document.querySelector(
      "#saveTrainingDurationsButton",
    ),
    meetingSummary: document.querySelector("#meetingSummary"),
    meetingDisplayYear: document.querySelector("#meetingDisplayYear"),
    meetingList: document.querySelector("#meetingList"),
    openMeetingStatsButton: document.querySelector("#openMeetingStatsButton"),
    appointmentSummary: document.querySelector("#appointmentSummary"),
    appointmentList: document.querySelector("#appointmentList"),
    appointmentSearch: document.querySelector("#appointmentSearch"),
    appointmentCalendar: document.querySelector("#appointmentCalendar"),
    appointmentCalendarGrid: document.querySelector("#appointmentCalendarGrid"),
    appointmentCalendarLabel: document.querySelector("#appointmentCalendarLabel"),
    appointmentCalendarNote: document.querySelector("#appointmentCalendarNote"),
    appointmentCalendarPreviousButton: document.querySelector(
      "#appointmentCalendarPreviousButton",
    ),
    appointmentCalendarNextButton: document.querySelector(
      "#appointmentCalendarNextButton",
    ),
    appointmentCalendarTodayButton: document.querySelector(
      "#appointmentCalendarTodayButton",
    ),
    memoSummary: document.querySelector("#memoSummary"),
    memoList: document.querySelector("#memoList"),
    memoSearch: document.querySelector("#memoSearch"),
    memoCategoryFilter: document.querySelector("#memoCategoryFilter"),
    deviceSummary: document.querySelector("#deviceSummary"),
    deviceMatrixWidget: document.querySelector("#deviceMatrixWidget"),
    toggleDeviceMatrixMaximizeButton: document.querySelector(
      "#toggleDeviceMatrixMaximizeButton",
    ),
    deviceMatrixMaximizeIcon: document.querySelector("#deviceMatrixMaximizeIcon"),
    deviceMatrixMaximizeLabel: document.querySelector("#deviceMatrixMaximizeLabel"),
    deviceManagementSummary: document.querySelector("#deviceManagementSummary"),
    deviceCatalog: document.querySelector("#deviceCatalog"),
    exportDeviceCatalogExcelButton: document.querySelector(
      "#exportDeviceCatalogExcelButton",
    ),
    deviceInstructionMatrix: document.querySelector("#deviceInstructionMatrix"),
    deviceInstructionList: document.querySelector("#deviceInstructionList"),
    deviceInstructionSearch: document.querySelector("#deviceInstructionSearch"),
    deviceInventoryFilter: document.querySelector("#deviceInventoryFilter"),
    deviceAnnexFilter: document.querySelector("#deviceAnnexFilter"),
    deviceCategoryFilter: document.querySelector("#deviceCategoryFilter"),
    deviceSearch: document.querySelector("#deviceSearch"),
    deviceManagementSearch: document.querySelector("#deviceManagementSearch"),
    deviceManagementInventoryFilter: document.querySelector(
      "#deviceManagementInventoryFilter",
    ),
    deviceManagementAnnexFilter: document.querySelector(
      "#deviceManagementAnnexFilter",
    ),
    deviceManagementCategoryFilter: document.querySelector(
      "#deviceManagementCategoryFilter",
    ),
    deviceManagementAuthorizationFilter: document.querySelector(
      "#deviceManagementAuthorizationFilter",
    ),
    deviceEmployeeStatusFilter: document.querySelector("#deviceEmployeeStatusFilter"),
    deviceEmployeeSearch: document.querySelector("#deviceEmployeeSearch"),
    employeeDialog: document.querySelector("#employeeDialog"),
    employeeForm: document.querySelector("#employeeForm"),
    employeeDialogTitle: document.querySelector("#employeeDialogTitle"),
    employeeSubmitLabel: document.querySelector("#employeeSubmitLabel"),
    serviceWeekend: document.querySelector("#serviceWeekend"),
    serviceWeekendOwnerHint: document.querySelector(
      "#serviceWeekendOwnerHint",
    ),
    trainingDialog: document.querySelector("#trainingDialog"),
    trainingForm: document.querySelector("#trainingForm"),
    trainingDialogTitle: document.querySelector("#trainingDialogTitle"),
    trainingSubmitLabel: document.querySelector("#trainingSubmitLabel"),
    completionDialog: document.querySelector("#completionDialog"),
    completionForm: document.querySelector("#completionForm"),
    completionTraining: document.querySelector("#completionTraining"),
    completionDate: document.querySelector("#completionDate"),
    completionEmployeeSearch: document.querySelector("#completionEmployeeSearch"),
    completionEmployeeList: document.querySelector("#completionEmployeeList"),
    completionEmployeeError: document.querySelector("#completionEmployeeError"),
    completionSelectionCount: document.querySelector("#completionSelectionCount"),
    toggleAllEmployees: document.querySelector("#toggleAllEmployees"),
    trainingMatrixDialog: document.querySelector("#trainingMatrixDialog"),
    trainingMatrixDialogTitle: document.querySelector("#trainingMatrixDialogTitle"),
    trainingMatrixYear: document.querySelector("#trainingMatrixYear"),
    trainingMatrixSummary: document.querySelector("#trainingMatrixSummary"),
    trainingRateHistoryChart: document.querySelector("#trainingRateHistoryChart"),
    trainingMatrixContent: document.querySelector("#trainingMatrixContent"),
    exportTrainingMatrixCsvButton: document.querySelector(
      "#exportTrainingMatrixCsvButton",
    ),
    printTrainingMatrixButton: document.querySelector("#printTrainingMatrixButton"),
    trainingTimeCalculatorDialog: document.querySelector(
      "#trainingTimeCalculatorDialog",
    ),
    timeSpanList: document.querySelector("#timeSpanList"),
    timeSpanTotalRoundedMinutes: document.querySelector(
      "#timeSpanTotalRoundedMinutes",
    ),
    timeSpanTotalFormatted: document.querySelector("#timeSpanTotalFormatted"),
    resetTimeSpansButton: document.querySelector("#resetTimeSpansButton"),
    creditedTrainingTimeList: document.querySelector("#creditedTrainingTimeList"),
    creditedTrainingTotalMinutes: document.querySelector(
      "#creditedTrainingTotalMinutes",
    ),
    creditedTrainingTotalFormatted: document.querySelector(
      "#creditedTrainingTotalFormatted",
    ),
    resetCreditedTrainingTimesButton: document.querySelector(
      "#resetCreditedTrainingTimesButton",
    ),
    loginDialog: document.querySelector("#loginDialog"),
    loginForm: document.querySelector("#loginForm"),
    loginError: document.querySelector("#loginError"),
    startupBackupDialog: document.querySelector("#startupBackupDialog"),
    startupBackupFile: document.querySelector("#startupBackupFile"),
    selectStartupBackupFileButton: document.querySelector(
      "#selectStartupBackupFileButton",
    ),
    startupBackupStatus: document.querySelector("#startupBackupStatus"),
    setupDialog: document.querySelector("#setupDialog"),
    setupForm: document.querySelector("#setupForm"),
    setupError: document.querySelector("#setupError"),
    changePasswordDialog: document.querySelector("#changePasswordDialog"),
    changePasswordForm: document.querySelector("#changePasswordForm"),
    changePasswordError: document.querySelector("#changePasswordError"),
    accountDialog: document.querySelector("#accountDialog"),
    accountDialogTitle: document.querySelector("#accountDialogTitle"),
    accountDialogRole: document.querySelector("#accountDialogRole"),
    userManagementDialog: document.querySelector("#userManagementDialog"),
    userManagementList: document.querySelector("#userManagementList"),
    createUserForm: document.querySelector("#createUserForm"),
    newUserUsername: document.querySelector("#newUserUsername"),
    newUserRole: document.querySelector("#newUserRole"),
    temporaryPasswordResult: document.querySelector("#temporaryPasswordResult"),
    temporaryPasswordUsername: document.querySelector("#temporaryPasswordUsername"),
    temporaryPasswordValue: document.querySelector("#temporaryPasswordValue"),
    copyTemporaryPassword: document.querySelector("#copyTemporaryPassword"),
    catalogManagementDialog: document.querySelector("#catalogManagementDialog"),
    professionCatalogList: document.querySelector("#professionCatalogList"),
    qualificationCatalogList: document.querySelector("#qualificationCatalogList"),
    newProfession: document.querySelector("#newProfession"),
    newQualification: document.querySelector("#newQualification"),
    addProfessionButton: document.querySelector("#addProfessionButton"),
    addQualificationButton: document.querySelector("#addQualificationButton"),
    memoCategoryForm: document.querySelector("#memoCategoryForm"),
    newMemoCategory: document.querySelector("#newMemoCategory"),
    memoCategoryList: document.querySelector("#memoCategoryList"),
    meetingDialog: document.querySelector("#meetingDialog"),
    meetingForm: document.querySelector("#meetingForm"),
    meetingDialogTitle: document.querySelector("#meetingDialogTitle"),
    meetingSubmitLabel: document.querySelector("#meetingSubmitLabel"),
    appointmentDialog: document.querySelector("#appointmentDialog"),
    appointmentForm: document.querySelector("#appointmentForm"),
    appointmentDialogTitle: document.querySelector("#appointmentDialogTitle"),
    appointmentSubmitLabel: document.querySelector("#appointmentSubmitLabel"),
    deleteAppointmentButton: document.querySelector("#deleteAppointmentButton"),
    appointmentPinned: document.querySelector("#appointmentPinned"),
    appointmentParticipantList: document.querySelector(
      "#appointmentParticipantList",
    ),
    memoDialog: document.querySelector("#memoDialog"),
    memoForm: document.querySelector("#memoForm"),
    memoDialogTitle: document.querySelector("#memoDialogTitle"),
    memoSubmitLabel: document.querySelector("#memoSubmitLabel"),
    memoCategory: document.querySelector("#memoCategory"),
    memoVisibility: document.querySelector("#memoVisibility"),
    memoPinned: document.querySelector("#memoPinned"),
    memoCompleted: document.querySelector("#memoCompleted"),
    deviceDialog: document.querySelector("#deviceDialog"),
    deviceForm: document.querySelector("#deviceForm"),
    deviceDialogTitle: document.querySelector("#deviceDialogTitle"),
    deviceSubmitLabel: document.querySelector("#deviceSubmitLabel"),
    deviceInstructionDialog: document.querySelector("#deviceInstructionDialog"),
    deviceInstructionForm: document.querySelector("#deviceInstructionForm"),
    deviceInstructionDialogTitle: document.querySelector(
      "#deviceInstructionDialogTitle",
    ),
    deviceInstructionId: document.querySelector("#deviceInstructionId"),
    deviceInstructionSubmitLabel: document.querySelector(
      "#deviceInstructionSubmitLabel",
    ),
    deviceInstructionDate: document.querySelector("#deviceInstructionDate"),
    deviceInstructorType: document.querySelector("#deviceInstructorType"),
    externalInstructorField: document.querySelector("#externalInstructorField"),
    externalInstructorName: document.querySelector("#externalInstructorName"),
    employeeInstructorFields: document.querySelector("#employeeInstructorFields"),
    employeeInstructor: document.querySelector("#employeeInstructor"),
    employeeInstructorMpoConfirmation: document.querySelector(
      "#employeeInstructorMpoConfirmation",
    ),
    employeeInstructorMpoConfirmationError: document.querySelector(
      "#employeeInstructorMpoConfirmationError",
    ),
    deviceParticipantSearch: document.querySelector("#deviceParticipantSearch"),
    toggleAllDeviceParticipants: document.querySelector(
      "#toggleAllDeviceParticipants",
    ),
    deviceParticipantList: document.querySelector("#deviceParticipantList"),
    deviceInstructionSort: document.querySelector("#deviceInstructionSort"),
    deviceInstructionDeviceSearch: document.querySelector(
      "#deviceInstructionDeviceSearch",
    ),
    deviceInstructionDeviceList: document.querySelector(
      "#deviceInstructionDeviceList",
    ),
    deviceInstructionDeviceError: document.querySelector(
      "#deviceInstructionDeviceError",
    ),
    deviceSelectionHeadingLabel: document.querySelector(
      "#deviceSelectionHeadingLabel",
    ),
    toggleAllInstructionDevices: document.querySelector(
      "#toggleAllInstructionDevices",
    ),
    deviceParticipantError: document.querySelector("#deviceParticipantError"),
    deviceParticipantCount: document.querySelector("#deviceParticipantCount"),
    deviceInstructionHistoryDialog: document.querySelector(
      "#deviceInstructionHistoryDialog",
    ),
    deviceInstructionHistoryTitle: document.querySelector(
      "#deviceInstructionHistoryTitle",
    ),
    deviceInstructionHistorySubtitle: document.querySelector(
      "#deviceInstructionHistorySubtitle",
    ),
    deviceInstructionHistoryContent: document.querySelector(
      "#deviceInstructionHistoryContent",
    ),
    deviceEmployeeOverviewDialog: document.querySelector(
      "#deviceEmployeeOverviewDialog",
    ),
    deviceEmployeeOverviewTitle: document.querySelector(
      "#deviceEmployeeOverviewTitle",
    ),
    deviceEmployeeOverviewSubtitle: document.querySelector(
      "#deviceEmployeeOverviewSubtitle",
    ),
    deviceEmployeeOverviewContent: document.querySelector(
      "#deviceEmployeeOverviewContent",
    ),
    deviceOverviewDialog: document.querySelector("#deviceOverviewDialog"),
    deviceOverviewTitle: document.querySelector("#deviceOverviewTitle"),
    deviceOverviewSubtitle: document.querySelector("#deviceOverviewSubtitle"),
    deviceOverviewSearch: document.querySelector("#deviceOverviewSearch"),
    deviceOverviewInstructionFilter: document.querySelector(
      "#deviceOverviewInstructionFilter",
    ),
    deviceOverviewEmploymentFilter: document.querySelector(
      "#deviceOverviewEmploymentFilter",
    ),
    deviceOverviewContent: document.querySelector("#deviceOverviewContent"),
    attendanceDialog: document.querySelector("#attendanceDialog"),
    attendanceForm: document.querySelector("#attendanceForm"),
    attendanceMeetingMeta: document.querySelector("#attendanceMeetingMeta"),
    attendanceSearch: document.querySelector("#attendanceSearch"),
    attendanceFilter: document.querySelector("#attendanceFilter"),
    attendanceBulkStatus: document.querySelector("#attendanceBulkStatus"),
    applyBulkAttendance: document.querySelector("#applyBulkAttendance"),
    attendanceList: document.querySelector("#attendanceList"),
    attendanceProgress: document.querySelector("#attendanceProgress"),
    meetingStatsDialog: document.querySelector("#meetingStatsDialog"),
    meetingStatsYear: document.querySelector("#meetingStatsYear"),
    meetingStatsContent: document.querySelector("#meetingStatsContent"),
    meetingAttendanceThreshold: document.querySelector("#meetingAttendanceThreshold"),
    exportMeetingStatsCsvButton: document.querySelector("#exportMeetingStatsCsvButton"),
    employeeDossierDialog: document.querySelector("#employeeDossierDialog"),
    employeeDossierTitle: document.querySelector("#employeeDossierTitle"),
    employeeDossierSubtitle: document.querySelector("#employeeDossierSubtitle"),
    employeeDossierContent: document.querySelector("#employeeDossierContent"),
    printEmployeeDossierButton: document.querySelector("#printEmployeeDossierButton"),
    vacationEmployeeOverviewDialog: document.querySelector(
      "#vacationEmployeeOverviewDialog",
    ),
    vacationEmployeeOverviewTitle: document.querySelector(
      "#vacationEmployeeOverviewTitle",
    ),
    vacationEmployeeOverviewSubtitle: document.querySelector(
      "#vacationEmployeeOverviewSubtitle",
    ),
    vacationEmployeeOverviewContent: document.querySelector(
      "#vacationEmployeeOverviewContent",
    ),
    printVacationEmployeeOverviewButton: document.querySelector(
      "#printVacationEmployeeOverviewButton",
    ),
    vacationConflictDialog: document.querySelector("#vacationConflictDialog"),
    vacationConflictSubtitle: document.querySelector("#vacationConflictSubtitle"),
    vacationConflictContent: document.querySelector("#vacationConflictContent"),
    weekendOverviewDialog: document.querySelector("#weekendOverviewDialog"),
    weekendOverviewContent: document.querySelector("#weekendOverviewContent"),
    printWeekendOverviewButton: document.querySelector("#printWeekendOverviewButton"),
    weekendSimulationDialog: document.querySelector("#weekendSimulationDialog"),
    weekendSimulationContent: document.querySelector("#weekendSimulationContent"),
    rerunWeekendSimulationButton: document.querySelector(
      "#rerunWeekendSimulationButton",
    ),
    applyWeekendSimulationButton: document.querySelector(
      "#applyWeekendSimulationButton",
    ),
    bulkEditDialog: document.querySelector("#bulkEditDialog"),
    bulkEditForm: document.querySelector("#bulkEditForm"),
    bulkEditSubtitle: document.querySelector("#bulkEditSubtitle"),
    bulkActive: document.querySelector("#bulkActive"),
    bulkProfession: document.querySelector("#bulkProfession"),
    bulkServiceWeekend: document.querySelector("#bulkServiceWeekend"),
    bulkQualification: document.querySelector("#bulkQualification"),
    bulkQualificationState: document.querySelector("#bulkQualificationState"),
    dataQualityDialog: document.querySelector("#dataQualityDialog"),
    dataQualityContent: document.querySelector("#dataQualityContent"),
    whatsNewDialog: document.querySelector("#whatsNewDialog"),
    whatsNewSubtitle: document.querySelector("#whatsNewSubtitle"),
    whatsNewVersion: document.querySelector("#whatsNewVersion"),
    whatsNewEntries: document.querySelector("#whatsNewEntries"),
    whatsNewHelpButton: document.querySelector("#whatsNewHelpButton"),
    tableDensityToggle: document.querySelector("#tableDensityToggle"),
    openEmployeeColumnsButton: document.querySelector("#openEmployeeColumnsButton"),
    employeeColumnsDialog: document.querySelector("#employeeColumnsDialog"),
    employeeColumnsList: document.querySelector("#employeeColumnsList"),
    contextMenu: document.querySelector("#contextMenu"),
    commandPalette: document.querySelector("#commandPalette"),
    commandPaletteInput: document.querySelector("#commandPaletteInput"),
    commandPaletteResults: document.querySelector("#commandPaletteResults"),
    openCommandPaletteButton: document.querySelector("#openCommandPaletteButton"),
    shortcutsDialog: document.querySelector("#shortcutsDialog"),
    openShortcutsButton: document.querySelector("#openShortcutsButton"),
    auditLogDialog: document.querySelector("#auditLogDialog"),
    auditLogContent: document.querySelector("#auditLogContent"),
    exportAuditLogCsvButton: document.querySelector("#exportAuditLogCsvButton"),
    confirmDialog: document.querySelector("#confirmDialog"),
    confirmTitle: document.querySelector("#confirmTitle"),
    confirmMessage: document.querySelector("#confirmMessage"),
    confirmAccept: document.querySelector("#confirmAccept"),
    confirmCancel: document.querySelector("#confirmCancel"),
    backupPasswordDialog: document.querySelector("#backupPasswordDialog"),
    backupPasswordForm: document.querySelector("#backupPasswordForm"),
    backupPasswordDialogTitle: document.querySelector("#backupPasswordDialogTitle"),
    backupPasswordDialogDescription: document.querySelector(
      "#backupPasswordDialogDescription",
    ),
    backupPasswordNotice: document.querySelector("#backupPasswordNotice"),
    backupPassword: document.querySelector("#backupPassword"),
    backupPasswordConfirmationField: document.querySelector(
      "#backupPasswordConfirmationField",
    ),
    backupPasswordConfirmation: document.querySelector(
      "#backupPasswordConfirmation",
    ),
    showBackupPassword: document.querySelector("#showBackupPassword"),
    backupPasswordError: document.querySelector("#backupPasswordError"),
    backupPasswordSubmit: document.querySelector("#backupPasswordSubmit"),
    automaticBackupRecoveryDialog: document.querySelector(
      "#automaticBackupRecoveryDialog",
    ),
    automaticBackupRecoveryKey: document.querySelector(
      "#automaticBackupRecoveryKey",
    ),
    copyAutomaticBackupRecoveryKey: document.querySelector(
      "#copyAutomaticBackupRecoveryKey",
    ),
    phoneListPreviewDialog: document.querySelector("#phoneListPreviewDialog"),
    phoneListPreviewSubtitle: document.querySelector("#phoneListPreviewSubtitle"),
    phoneListPreviewContent: document.querySelector("#phoneListPreviewContent"),
    phoneListPrintSurface: document.querySelector("#phoneListPrintSurface"),
    appointmentPrintSurface: document.querySelector("#appointmentPrintSurface"),
    printEmployeePhoneListButton: document.querySelector(
      "#printEmployeePhoneListButton",
    ),
    notificationStack: document.querySelector("#notificationStack"),
    toastRegion: document.querySelector("#toastRegion"),
  };

  initialize().catch(handleInitializationError);

  async function initialize() {
    if (!window.localforage) {
      throw new Error("localForage konnte nicht geladen werden.");
    }
    if (!window.TeOBackend) {
      throw new Error("Die TeO-Backend-Komponente konnte nicht geladen werden.");
    }

    dataStore = window.localforage.createInstance({
      name: "IntensivTeam",
      storeName: "personalverwaltung",
      description: "Lokale Mitarbeiter- und Pflichtfortbildungsverwaltung",
    });
    await dataStore.setDriver([
      window.localforage.INDEXEDDB,
      window.localforage.LOCALSTORAGE,
    ]);
    backendConfig = window.TeOBackend.readConfig();
    backendMode = backendConfig.mode;
    backendConnectionStatus = isMariaDbMode() ? "checking" : "local";
    state = await loadState();
    localLastSaveAt = await loadLocalSaveTimestamp();
    await loadAutomaticBackupConfiguration();
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
    window.addEventListener("beforeunload", handleBeforeUnload);
    initializeFormattedDateInputs();
    applyTheme(activeThemeKey());
    renderProjectMetadata();

    const today = todayIso();
    document.querySelector("#birthDate").max = today;
    elements.completionDate.max = today;
    elements.deviceInstructionDate.max = today;

    bindNavigation();
    bindSidebarOrder();
    bindSidebarCollapse();
    bindKeyboardShortcuts();
    bindCommandPalette();
    bindViewFilterChips();
    bindRecordInspectors();
    bindRecordSelection();
    bindContextMenu();
    bindDragAndDrop();
    bindTableComfort();
    bindDesktopWorkspace();
    bindWhatsNew();
    bindDialogTriggers();
    bindForms();
    bindFilters();
    bindDelegatedActions();
    bindDialogs();
    bindAuthentication();
    bindCatalogManagement();
    bindDataSync();
    bindRemoteSync();

    observeDynamicStyles();
    const initialHash = window.location.hash.replace("#", "");
    showView(HASH_VIEWS[initialHash] || "dashboard", false);
    renderAll();
    // Erst nach dem ersten Aufbau: Vorher stehen in den Auswahlfeldern weder
    // Berufe noch Kategorien, ein gemerkter Wert liefe ins Leere.
    restoreRememberedViewFilters();
    restoreAuthenticationSession();
    if (discardedUserAccounts > 0) {
      showToast(
        `${discardedUserAccounts} Benutzerkonto/-konten waren ungültig oder doppelt vergeben und wurden nicht übernommen.`,
        "warning",
      );
      discardedUserAccounts = 0;
    }
    void refreshBackendHealth();
    registerServiceWorker();
  }

  // Haelt die Anwendung selbst offline verfuegbar. Der Datenbestand liegt
  // ohnehin lokal; ohne Zwischenspeicher laedt bei fehlender Verbindung
  // lediglich die Seite nicht. Beim Oeffnen per Doppelklick (file://) und in
  // unsicheren Kontexten steht die Schnittstelle nicht bereit - dann arbeitet
  // TeO wie bisher ohne Zwischenspeicher weiter.
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn(
        "Der Offlinebetrieb konnte nicht eingerichtet werden.",
        error,
      );
    });
  }

  function emptyState() {
    return {
      version: STATE_VERSION,
      employees: [],
      trainings: [],
      completions: [],
      meetings: [],
      meetingAttendances: [],
      appointments: [],
      memos: [],
      devices: createDefaultDeviceCatalog(),
      deviceInstructions: [],
      vacationEntitlements: [],
      vacationDays: [],
      settings: {
        theme: "standard",
        lastBackupAt: "",
        backupReminderDays: DEFAULT_BACKUP_REMINDER_DAYS,
        maxBackupFileSizeMb: DEFAULT_MAX_BACKUP_FILE_SIZE_MB,
        closeDialogOnOutsideClick: false,
        schoolVacationPeriods: normalizeSchoolVacationPeriods(
          NRW_SCHOOL_VACATION_PERIODS,
        ),
        meetingAttendanceThreshold: 70,
        vacationBaseDays: DEFAULT_VACATION_BASE_DAYS,
        vacationWeekendAReferenceSaturday:
          DEFAULT_WEEKEND_A_REFERENCE_SATURDAY,
        vacationWeekdayAbsenceLimit: DEFAULT_WEEKDAY_ABSENCE_LIMIT,
        vacationWeekendAbsenceLimit: DEFAULT_WEEKEND_ABSENCE_LIMIT,
        serviceWeekends: {
          weekend_a: {
            name: SERVICE_WEEKENDS.weekend_a,
            ownerId: "",
          },
          weekend_b: {
            name: SERVICE_WEEKENDS.weekend_b,
            ownerId: "",
          },
        },
        deadlineKinds: [...DEADLINE_KINDS],
        deadlineHideOverdue: false,
      },
      users: initialUsers(),
      auditLog: [],
      catalogs: {
        professions: [...DEFAULT_PROFESSIONS],
        qualifications: Object.entries(DEFAULT_QUALIFICATIONS).map(([id, label]) => ({
          id,
          label,
        })),
        memoCategories: [...DEFAULT_MEMO_CATEGORIES],
      },
    };
  }

  async function loadState() {
    if (isMariaDbMode()) {
      return loadMariaDbState();
    }

    try {
      let parsed = await dataStore.getItem(STORAGE_KEY);

      if (!parsed) {
        try {
          const legacyRaw = localStorage.getItem(STORAGE_KEY);
          if (legacyRaw) {
            parsed = JSON.parse(legacyRaw);
            await dataStore.setItem(STORAGE_KEY, parsed);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (migrationError) {
          console.warn("Vorhandene localStorage-Daten konnten nicht migriert werden.", migrationError);
        }
      }

      if (!parsed) return emptyState();
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (!parsed || typeof parsed !== "object") return emptyState();

      const normalizedState = normalizeState(parsed);
      if (Number(parsed.version) !== STATE_VERSION) {
        await dataStore.setItem(STORAGE_KEY, normalizedState);
      }
      return normalizedState;
    } catch (error) {
      console.warn("Gespeicherte Daten konnten nicht geladen werden.", error);
      return emptyState();
    }
  }

  function isMariaDbMode() {
    return backendMode === "mariadb";
  }

  async function loadLocalSaveTimestamp() {
    if (isMariaDbMode()) return "";
    try {
      const value = String(
        (await dataStore.getItem(LOCAL_SAVE_TIMESTAMP_KEY)) || "",
      );
      return Number.isFinite(new Date(value).getTime()) ? value : "";
    } catch (error) {
      console.warn(
        "Der Zeitpunkt der letzten lokalen Speicherung konnte nicht geladen werden.",
        error,
      );
      return "";
    }
  }

  async function loadMariaDbState() {
    const token = window.TeOBackend.readToken();
    if (!token) return emptyState();

    try {
      const [health, result] = await Promise.all([
        window.TeOBackend.health(backendConfig.apiUrl, token),
        window.TeOBackend.load(backendConfig.apiUrl, token),
      ]);
      markBackendConnected({ health, synchronized: true });
      remoteRevision = Number(result.revision) || 0;
      backendStartupError = "";
      return normalizeState(result.state);
    } catch (error) {
      console.warn("MariaDB-Datenbestand konnte nicht geladen werden.", error);
      backendStartupError = error.message || "Der TeO-Server ist nicht erreichbar.";
      markBackendConnectionError(error);
      if (error.status === 401) {
        window.TeOBackend.writeToken("");
        sessionStorage.removeItem(SESSION_USER_KEY);
      }
      return emptyState();
    }
  }

  function normalizeState(parsed) {
    const employees = Array.isArray(parsed.employees)
      ? parsed.employees.map(normalizeEmployee).filter(Boolean)
      : [];
    const assignedEmployeeUsernames = new Set();
    employees.forEach((employee) => {
      const normalizedUsername = employee.username.toLocaleLowerCase("de-DE");
      if (!normalizedUsername) return;
      if (assignedEmployeeUsernames.has(normalizedUsername)) {
        employee.username = "";
        return;
      }
      assignedEmployeeUsernames.add(normalizedUsername);
    });
    const trainings = Array.isArray(parsed.trainings)
      ? parsed.trainings.map(normalizeTraining).filter(Boolean)
      : [];
    if ((Number(parsed.version) || 0) < 14) {
      trainings.forEach((training) => {
        if (!training.recurrenceMonths) {
          training.recurrenceMonths = defaultTrainingRecurrenceMonths(training.title);
        }
      });
    }
    assignTrainingSeriesIds(trainings);
    const meetings = Array.isArray(parsed.meetings)
      ? parsed.meetings.map(normalizeMeeting).filter(Boolean)
      : [];
    const appointments = Array.isArray(parsed.appointments)
      ? parsed.appointments.map(normalizeAppointment).filter(Boolean)
      : [];
    const memos = Array.isArray(parsed.memos)
      ? parsed.memos.map(normalizeMemo).filter(Boolean)
      : [];
    const devices = Array.isArray(parsed.devices)
      ? parsed.devices.map(normalizeDevice).filter(Boolean)
      : [];
    if ((Number(parsed.version) || 0) < 19) {
      mergeDefaultDeviceCatalog(devices);
    }
    const validEmployeeIds = new Set(employees.map((employee) => employee.id));
    const validTrainingIds = new Set(trainings.map((training) => training.id));
    const validMeetingIds = new Set(meetings.map((meeting) => meeting.id));
    const validDeviceIds = new Set(devices.map((device) => device.id));

    meetings.forEach((meeting) => {
      meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter((employeeId) =>
        validEmployeeIds.has(employeeId),
      );
    });

    const completions = Array.isArray(parsed.completions)
      ? parsed.completions
          .map(normalizeCompletion)
          .filter(
            (completion) =>
              completion &&
              validEmployeeIds.has(completion.employeeId) &&
              validTrainingIds.has(completion.trainingId),
          )
      : [];
    const meetingAttendances = Array.isArray(parsed.meetingAttendances)
      ? parsed.meetingAttendances
          .map(normalizeMeetingAttendance)
          .filter(
            (attendance) =>
              attendance &&
              validEmployeeIds.has(attendance.employeeId) &&
              validMeetingIds.has(attendance.meetingId),
          )
      : [];
    const vacationEntitlements = Array.isArray(parsed.vacationEntitlements)
      ? parsed.vacationEntitlements
          .map(normalizeVacationEntitlement)
          .filter(
            (entitlement) =>
              entitlement && validEmployeeIds.has(entitlement.employeeId),
          )
      : [];
    const vacationDays = Array.isArray(parsed.vacationDays)
      ? parsed.vacationDays
          .map(normalizeVacationDay)
          .filter(
            (vacationDay) =>
              vacationDay && validEmployeeIds.has(vacationDay.employeeId),
          )
      : [];
    const deviceInstructions = Array.isArray(parsed.deviceInstructions)
      ? parsed.deviceInstructions
          .map(normalizeDeviceInstruction)
          .filter(
            (instruction) =>
              instruction &&
              validDeviceIds.has(instruction.deviceId) &&
              instruction.participants.some((participant) =>
                validEmployeeIds.has(participant.employeeId),
              ),
          )
          .map((instruction) => ({
            ...instruction,
            instructorEmployeeId: validEmployeeIds.has(
              instruction.instructorEmployeeId,
            )
              ? instruction.instructorEmployeeId
              : "",
            participants: instruction.participants.filter((participant) =>
              validEmployeeIds.has(participant.employeeId),
            ),
          }))
      : [];

    const catalogs = normalizeCatalogs(parsed.catalogs, employees);
    memos.forEach((memo) => {
      if (!catalogs.memoCategories.includes(memo.category)) memo.category = "";
    });
    const qualificationIds = new Set(
      catalogs.qualifications.map((qualification) => qualification.id),
    );
    employees.forEach((employee) => {
      catalogs.qualifications.forEach(({ id }) => {
        if (!Object.hasOwn(employee.qualifications, id)) {
          employee.qualifications[id] = false;
        }
      });
      Object.keys(employee.qualifications).forEach((id) => {
        if (!qualificationIds.has(id)) delete employee.qualifications[id];
      });
      Object.keys(employee.qualificationExpiries).forEach((id) => {
        if (!qualificationIds.has(id) || !employee.qualifications[id]) {
          delete employee.qualificationExpiries[id];
        }
      });
    });

    const users = normalizeUsers(parsed.users);
    if ((Number(parsed.version) || 0) < 22) {
      users
        .filter((user) => user.role === "admin")
        .forEach((user) => {
          user.mustChangePassword = true;
        });
    }

    const previousStateVersion = Number(parsed.version) || 0;
    const legacyWeekendNameFallbacks =
      previousStateVersion < 23
        ? { weekend_a: "Oli", weekend_b: "Claudio" }
        : SERVICE_WEEKENDS;
    const requestedWeekendAOwnerId =
      parsed.settings?.serviceWeekends?.weekend_a?.ownerId ||
      parsed.settings?.serviceWeekendOwnerIds?.oli ||
      "";
    const requestedWeekendBOwnerId =
      parsed.settings?.serviceWeekends?.weekend_b?.ownerId ||
      parsed.settings?.serviceWeekendOwnerIds?.claudio ||
      "";
    const serviceWeekends = {
      weekend_a: {
        name: normalizeServiceWeekendName(
          parsed.settings?.serviceWeekends?.weekend_a?.name ||
            parsed.settings?.serviceWeekendNames?.oli,
          legacyWeekendNameFallbacks.weekend_a,
        ),
        ownerId: validEmployeeIds.has(requestedWeekendAOwnerId)
          ? requestedWeekendAOwnerId
          : "",
      },
      weekend_b: {
        name: normalizeServiceWeekendName(
          parsed.settings?.serviceWeekends?.weekend_b?.name ||
            parsed.settings?.serviceWeekendNames?.claudio,
          legacyWeekendNameFallbacks.weekend_b,
        ),
        ownerId:
          validEmployeeIds.has(requestedWeekendBOwnerId) &&
          requestedWeekendBOwnerId !== requestedWeekendAOwnerId
            ? requestedWeekendBOwnerId
            : "",
      },
    };
    Object.entries(serviceWeekends).forEach(([weekend, configuration]) => {
      if (!configuration.ownerId) return;
      const owner = employees.find(
        (employee) => employee.id === configuration.ownerId,
      );
      if (owner) {
        if (
          previousStateVersion < 24 &&
          !LEADERSHIP_QUALIFICATION_IDS.some(
            (qualificationId) => owner.qualifications[qualificationId],
          )
        ) {
          owner.qualifications[
            weekend === "weekend_a"
              ? "stationsleitung"
              : "stellvertretendeStationsleitung"
          ] = true;
        }
        configuration.name = normalizeServiceWeekendName(
          owner.firstName,
          configuration.name,
        );
        owner.serviceWeekend = weekend;
      }
    });

    return {
      version: STATE_VERSION,
      employees,
      trainings,
      completions,
      meetings,
      meetingAttendances,
      appointments,
      memos,
      devices,
      deviceInstructions,
      vacationEntitlements: uniqueVacationEntitlements(vacationEntitlements),
      vacationDays: uniqueVacationDays(vacationDays),
      settings: {
        theme: normalizeTheme(parsed.settings?.theme),
        lastBackupAt: validOptionalTimestamp(parsed.settings?.lastBackupAt),
        backupReminderDays: clampNumber(
          parsed.settings?.backupReminderDays,
          1,
          365,
          DEFAULT_BACKUP_REMINDER_DAYS,
        ),
        maxBackupFileSizeMb: Math.round(
          clampNumber(
            parsed.settings?.maxBackupFileSizeMb,
            MIN_BACKUP_FILE_SIZE_MB,
            MAX_BACKUP_FILE_SIZE_MB,
            DEFAULT_MAX_BACKUP_FILE_SIZE_MB,
          ),
        ),
        // Standardmaessig aus: Ein Klick neben den Dialog schliesst ihn nicht,
        // damit versehentliches Schliessen ausgeschlossen ist.
        closeDialogOnOutsideClick: Boolean(
          parsed.settings?.closeDialogOnOutsideClick,
        ),
        // Fehlt der Schluessel ganz, stammt der Datenbestand aus einer
        // aelteren Fassung und wird mit der amtlichen NRW-Liste vorbelegt.
        // Eine leere Liste bleibt dagegen leer - sie kann bewusst gesetzt sein.
        schoolVacationPeriods: normalizeSchoolVacationPeriods(
          parsed.settings?.schoolVacationPeriods === undefined
            ? NRW_SCHOOL_VACATION_PERIODS
            : parsed.settings.schoolVacationPeriods,
        ),
        meetingAttendanceThreshold: clampNumber(
          parsed.settings?.meetingAttendanceThreshold,
          1,
          100,
          70,
        ),
        vacationBaseDays: clampNumber(
          parsed.settings?.vacationBaseDays,
          1,
          60,
          DEFAULT_VACATION_BASE_DAYS,
        ),
        vacationWeekendAReferenceSaturday: normalizeSaturdayDate(
          parsed.settings?.vacationWeekendAReferenceSaturday ||
            parsed.settings?.vacationOliReferenceSaturday,
        ),
        vacationWeekdayAbsenceLimit: Math.round(
          clampNumber(
            parsed.settings?.vacationWeekdayAbsenceLimit,
            1,
            100,
            DEFAULT_WEEKDAY_ABSENCE_LIMIT,
          ),
        ),
        vacationWeekendAbsenceLimit: Math.round(
          clampNumber(
            parsed.settings?.vacationWeekendAbsenceLimit,
            1,
            100,
            DEFAULT_WEEKEND_ABSENCE_LIMIT,
          ),
        ),
        serviceWeekends,
        deadlineKinds: normalizeDeadlineKinds(parsed.settings?.deadlineKinds),
        deadlineHideOverdue: Boolean(parsed.settings?.deadlineHideOverdue),
      },
      users,
      auditLog: normalizeAuditLog(parsed.auditLog),
      catalogs,
    };
  }

  function normalizeCatalogs(catalogs, employees) {
    const professions = [];
    const addProfession = (value) => {
      const profession = normalizeProfession(value);
      if (
        profession &&
        !professions.some(
          (item) =>
            item.toLocaleLowerCase("de-DE") === profession.toLocaleLowerCase("de-DE"),
        )
      ) {
        professions.push(profession);
      }
    };
    const storedProfessions = Array.isArray(catalogs?.professions)
      ? catalogs.professions
      : DEFAULT_PROFESSIONS;
    storedProfessions.forEach(addProfession);
    employees.forEach((employee) => addProfession(employee.profession));

    const qualificationMap = new Map();
    const storedQualifications = Array.isArray(catalogs?.qualifications)
      ? catalogs.qualifications
      : Object.entries(DEFAULT_QUALIFICATIONS).map(([id, label]) => ({ id, label }));
    storedQualifications.forEach((qualification) => {
      const id = normalizeId(qualification?.id);
      const label = String(qualification?.label || "").trim().slice(0, 100);
      if (id && label && !qualificationMap.has(id)) qualificationMap.set(id, label);
    });
    LEADERSHIP_QUALIFICATION_IDS.forEach((id) => {
      qualificationMap.set(id, DEFAULT_QUALIFICATIONS[id]);
    });
    employees.forEach((employee) => {
      Object.keys(employee.qualifications).forEach((id) => {
        if (!qualificationMap.has(id)) {
          qualificationMap.set(id, DEFAULT_QUALIFICATIONS[id] || id);
        }
      });
    });

    return {
      professions: professions.sort((a, b) => a.localeCompare(b, "de")),
      qualifications: [...qualificationMap].map(([id, label]) => ({ id, label })),
      memoCategories: normalizeMemoCategories(catalogs?.memoCategories),
    };
  }

  function normalizeMemoCategories(values) {
    const source = Array.isArray(values) ? values : DEFAULT_MEMO_CATEGORIES;
    const categories = [];
    source.forEach((value) => {
      const category = String(value || "").trim().slice(0, 60);
      if (
        category &&
        !categories.some(
          (item) =>
            item.toLocaleLowerCase("de-DE") ===
            category.toLocaleLowerCase("de-DE"),
        )
      ) {
        categories.push(category);
      }
    });
    return categories.sort((a, b) => a.localeCompare(b, "de"));
  }

  function initialUsers() {
    return [];
  }

  function normalizeSchoolVacationPeriods(periods) {
    if (!Array.isArray(periods)) return [];
    const seen = new Set();
    return periods
      .map((period) => {
        const start = String(period?.start || "");
        const end = String(period?.end || "");
        const label = String(period?.label || "").trim().slice(0, 60);
        if (!parseLocalDate(start) || !parseLocalDate(end)) return null;
        if (end < start) return null;
        if (!label) return null;
        return { start, end, label };
      })
      .filter((period) => {
        if (!period) return false;
        const key = `${period.start}|${period.end}|${period.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
      .slice(0, MAX_SCHOOL_VACATION_PERIODS);
  }

  // Ein einzelnes beschaedigtes Konto darf nicht alle uebrigen mitreissen:
  // Fruher gab diese Funktion in dem Fall eine leere Liste zurueck, wodurch die
  // Anwendung ohne Hinweis in die Ersteinrichtung zurueckfiel. Ungueltige und
  // doppelt vergebene Konten werden deshalb einzeln verworfen. Nur wenn danach
  // kein Administratorkonto mehr uebrig ist, bleibt der Bestand unbrauchbar -
  // dann ist die Ersteinrichtung tatsaechlich der richtige Weg.
  function normalizeUsers(users) {
    if (!Array.isArray(users)) return initialUsers();
    const seenNames = new Set();
    const normalized = [];
    let discarded = users.length;
    users.map(normalizeUser).forEach((user) => {
      if (!user) return;
      const normalizedName = user.username.toLocaleLowerCase("de-DE");
      if (seenNames.has(normalizedName)) return;
      seenNames.add(normalizedName);
      normalized.push(user);
    });
    discarded -= normalized.length;
    if (!normalized.some((user) => user.role === "admin")) {
      return initialUsers();
    }
    if (discarded > 0) {
      console.warn(
        `${discarded} Benutzerkonto/-konten waren ungültig oder doppelt vergeben und wurden verworfen.`,
      );
      discardedUserAccounts = discarded;
    }
    return normalized;
  }

  function normalizeUser(user) {
    const id = normalizeId(user?.id);
    const username = String(user?.username || "").trim();
    const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : "";
    const passwordSalt = String(user?.passwordSalt || "");
    const passwordHash = String(user?.passwordHash || "");
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    const protectedRemoteCredentials =
      isMariaDbMode() && !passwordSalt && !passwordHash;
    if (
      !id ||
      !/^[A-Za-z0-9]{4,40}$/.test(username) ||
      !role ||
      (!protectedRemoteCredentials &&
        (!base64Pattern.test(passwordSalt) ||
          !base64Pattern.test(passwordHash)))
    ) {
      return null;
    }

    return {
      id,
      username,
      role,
      passwordSalt,
      passwordHash,
      mustChangePassword: Boolean(user.mustChangePassword),
      theme: normalizeUserTheme(user.theme),
    };
  }

  function normalizeTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "standard";
  }

  // Das Farbthema eines Kontos darf leer bleiben. Leer heisst nicht
  // "Standard", sondern "noch keine eigene Wahl getroffen" - dann gilt die
  // gemeinsame Vorgabe aus den Einstellungen.
  function normalizeUserTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "";
  }

  function normalizeServiceWeekendName(value, fallback) {
    return String(value || "").trim().slice(0, 50) || fallback;
  }

  function normalizeServiceWeekend(value) {
    const migratedValue =
      { oli: "weekend_a", claudio: "weekend_b" }[value] || value;
    return Object.hasOwn(SERVICE_WEEKENDS, migratedValue)
      ? migratedValue
      : "none";
  }

  function normalizeProfession(value) {
    const profession = String(value || "").trim().slice(0, 100);
    return CARE_PROFESSION_ALIASES.has(
      profession.toLocaleLowerCase("de-DE"),
    )
      ? "Pflegefachkraft"
      : profession;
  }

  function normalizeEmployee(employee) {
    const id = normalizeId(employee?.id);
    if (!employee || !id) return null;

    const qualifications = {};
    Object.entries(employee.qualifications || {}).forEach(([key, selected]) => {
      const id = normalizeId(key);
      if (id) qualifications[id] = Boolean(selected);
    });
    const qualificationExpiries = {};
    Object.entries(employee.qualificationExpiries || {}).forEach(([key, date]) => {
      const id = normalizeId(key);
      const normalizedDate = normalizeOptionalDate(date);
      if (id && normalizedDate) qualificationExpiries[id] = normalizedDate;
    });

    const employmentStatus = Object.hasOwn(
      EMPLOYMENT_STATUSES,
      employee.employmentStatus,
    )
      ? employee.employmentStatus
      : employee.active === false
        ? "inactive"
        : "active";

    return {
      id,
      firstName: String(employee.firstName || ""),
      lastName: String(employee.lastName || ""),
      username: /^[A-Za-z0-9]{4,40}$/.test(
        String(employee.username || "").trim(),
      )
        ? String(employee.username || "").trim()
        : "",
      birthDate: String(employee.birthDate || ""),
      phone: String(employee.phone || ""),
      email: String(employee.email || ""),
      employmentPercent: clampNumber(employee.employmentPercent, 1, 100, 100),
      profession: normalizeProfession(employee.profession),
      serviceWeekend: normalizeServiceWeekend(employee.serviceWeekend),
      active: employmentStatus !== "inactive",
      employmentStatus,
      qualifications,
      qualificationExpiries,
      createdAt: validTimestamp(employee.createdAt),
      updatedAt: validTimestamp(employee.updatedAt || employee.createdAt),
    };
  }

  function normalizeTraining(training) {
    const id = normalizeId(training?.id);
    if (!training || !id) return null;
    const recurrence = Number(training.recurrenceMonths);
    const targetMinutes = Number(training.targetMinutes);
    const createdAt = validTimestamp(training.createdAt);
    const storedYear = Number(training.year);
    const fallbackYear = new Date(createdAt).getFullYear();

    return {
      id,
      title: String(training.title || ""),
      description: String(training.description || ""),
      year:
        Number.isInteger(storedYear) && storedYear >= 2000 && storedYear <= 2100
          ? storedYear
          : fallbackYear,
      recurrenceMonths: Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null,
      targetMinutes:
        Number.isInteger(targetMinutes) && targetMinutes > 0 ? targetMinutes : null,
      seriesId: normalizeId(training.seriesId) || "",
      createdAt,
      updatedAt: validTimestamp(training.updatedAt || training.createdAt),
    };
  }

  function trainingSeriesSignature(title) {
    return String(title || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/\b(?:19|20)\d{2}\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function generatedTrainingSeriesId(title, fallbackId = "") {
    const signature = trainingSeriesSignature(title) || fallbackId || "fortbildung";
    let hash = 2166136261;
    for (let index = 0; index < signature.length; index += 1) {
      hash ^= signature.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `training-series-${(hash >>> 0).toString(36)}`;
  }

  function assignTrainingSeriesIds(trainings) {
    const seriesBySignature = new Map();
    trainings.forEach((training) => {
      if (!training.recurrenceMonths || !training.seriesId) return;
      const signature = trainingSeriesSignature(training.title);
      if (signature && !seriesBySignature.has(signature)) {
        seriesBySignature.set(signature, training.seriesId);
      }
    });
    trainings.forEach((training) => {
      if (!training.recurrenceMonths) {
        training.seriesId = "";
        return;
      }
      if (training.seriesId) return;
      const signature = trainingSeriesSignature(training.title);
      const seriesId =
        seriesBySignature.get(signature) ||
        generatedTrainingSeriesId(training.title, training.id);
      training.seriesId = seriesId;
      if (signature) seriesBySignature.set(signature, seriesId);
    });
  }

  function defaultTrainingRecurrenceMonths(title) {
    const normalizedTitle = String(title || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "");
    return normalizedTitle.includes("gewaltpravention") ||
      normalizedTitle.includes("gewaltpraevention")
      ? VIOLENCE_PREVENTION_RECURRENCE_MONTHS
      : DEFAULT_TRAINING_RECURRENCE_MONTHS;
  }

  function normalizeCompletion(completion) {
    const id = normalizeId(completion?.id);
    const employeeId = normalizeId(completion?.employeeId);
    const trainingId = normalizeId(completion?.trainingId);
    if (!completion || !id || !employeeId || !trainingId) {
      return null;
    }

    return {
      id,
      employeeId,
      trainingId,
      completedOn: String(completion.completedOn || ""),
      note: String(completion.note || ""),
      createdAt: validTimestamp(completion.createdAt),
    };
  }

  function normalizeMeeting(meeting) {
    const id = normalizeId(meeting?.id);
    if (!meeting || !id) return null;

    return {
      id,
      title: String(meeting.title || "Teamsitzung"),
      date: String(meeting.date || ""),
      time: normalizeTimeValue(meeting.time),
      notes: String(meeting.notes || ""),
      expectedEmployeeIds: Array.isArray(meeting.expectedEmployeeIds)
        ? [...new Set(meeting.expectedEmployeeIds.map(normalizeId).filter(Boolean))]
        : [],
      createdAt: validTimestamp(meeting.createdAt),
      updatedAt: validTimestamp(meeting.updatedAt || meeting.createdAt),
    };
  }

  function normalizeAppointment(appointment) {
    const id = normalizeId(appointment?.id);
    const title = String(appointment?.title || "").trim().slice(0, 120);
    const date = normalizeOptionalDate(appointment?.date);
    if (!appointment || !id || !title || !date) return null;

    const startTime = normalizeTimeValue(appointment.startTime);
    let endTime = normalizeTimeValue(appointment.endTime);
    if (!startTime || (endTime && endTime <= startTime)) endTime = "";

    const category = String(appointment.category || "");

    return {
      id,
      title,
      date,
      startTime,
      endTime,
      // Unbekannte Kategorien werden verworfen, statt den Termin zu verlieren.
      category: Object.hasOwn(APPOINTMENT_CATEGORIES, category) ? category : "",
      location: String(appointment.location || "").trim().slice(0, 160),
      description: String(appointment.description || "").trim().slice(0, 1000),
      pinned: Boolean(appointment.pinned),
      participantList: Boolean(appointment.participantList),
      createdAt: validTimestamp(appointment.createdAt),
      updatedAt: validTimestamp(appointment.updatedAt || appointment.createdAt),
    };
  }

  function normalizeMemo(memo) {
    const id = normalizeId(memo?.id);
    const title = String(memo?.title || "").trim().slice(0, 160);
    if (!memo || !id || !title) return null;

    return {
      id,
      title,
      description: String(memo.description || "").trim().slice(0, 2000),
      date: normalizeOptionalDate(memo.date),
      category: String(memo.category || "").trim().slice(0, 60),
      pinned: Boolean(memo.pinned),
      completed: Boolean(memo.completed),
      visibility: memo.visibility === "private" ? "private" : "all",
      createdByUserId: normalizeId(memo.createdByUserId),
      createdAt: validTimestamp(memo.createdAt),
      updatedAt: validTimestamp(memo.updatedAt || memo.createdAt),
    };
  }

  function normalizeDevice(device) {
    const id = normalizeId(device?.id);
    const productName = String(device?.productName || "").trim().slice(0, 120);
    const manufacturer = String(device?.manufacturer || "").trim().slice(0, 120);
    const category = String(device?.category || "").trim().slice(0, 100);
    if (!id || !productName || !manufacturer || !category) return null;

    return {
      id,
      productName,
      manufacturer,
      category,
      annex1: Boolean(device.annex1),
      currentInventory: device.currentInventory !== false,
      createdAt: validTimestamp(device.createdAt),
      updatedAt: validTimestamp(device.updatedAt || device.createdAt),
    };
  }

  function createDefaultDeviceCatalog() {
    return DEFAULT_DEVICE_CATALOG.map(
      ([manufacturer, productName, category, currentInventory, annex1], index) => ({
        id: `device-catalog-${String(index + 1).padStart(3, "0")}`,
        productName,
        manufacturer,
        category,
        annex1,
        currentInventory,
        createdAt: DEFAULT_DEVICE_CATALOG_TIMESTAMP,
        updatedAt: DEFAULT_DEVICE_CATALOG_TIMESTAMP,
      }),
    );
  }

  function mergeDefaultDeviceCatalog(devices) {
    const signatures = new Set(devices.map(deviceCatalogSignature));
    const usedIds = new Set(devices.map((device) => device.id));
    createDefaultDeviceCatalog().forEach((device) => {
      const signature = deviceCatalogSignature(device);
      if (signatures.has(signature)) return;
      let id = device.id;
      let suffix = 1;
      while (usedIds.has(id)) {
        id = `${device.id}-${suffix}`;
        suffix += 1;
      }
      devices.push({ ...device, id });
      signatures.add(signature);
      usedIds.add(id);
    });
  }

  function deviceCatalogSignature(device) {
    return `${device.manufacturer}::${device.productName}`
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeDeviceInstruction(instruction) {
    const id = normalizeId(instruction?.id);
    const deviceId = normalizeId(instruction?.deviceId);
    const date = normalizeOptionalDate(instruction?.date);
    const instructorType =
      instruction?.instructorType === "employee" ? "employee" : "manufacturer";
    const instructorEmployeeId =
      normalizeId(instruction?.instructorEmployeeId) || "";
    const instructorName = String(instruction?.instructorName || "")
      .trim()
      .slice(0, 120);
    const participants = Array.isArray(instruction?.participants)
      ? [
          ...new Map(
            instruction.participants
              .map((participant) => {
                const employeeId = normalizeId(participant?.employeeId);
                return employeeId
                  ? [
                      employeeId,
                      {
                        employeeId,
                        wasMedicalProductsOfficer: Boolean(
                          participant.wasMedicalProductsOfficer,
                        ),
                      },
                    ]
                  : null;
              })
              .filter(Boolean),
          ).values(),
        ]
      : [];
    if (!id || !deviceId || !date || !participants.length || !instructorName) {
      return null;
    }

    return {
      id,
      deviceId,
      date,
      instructorType,
      instructorEmployeeId,
      instructorName,
      instructorWasMedicalProductsOfficer:
        instructorType === "employee" &&
        Boolean(instruction.instructorWasMedicalProductsOfficer),
      participants,
      createdAt: validTimestamp(instruction.createdAt),
    };
  }

  function normalizeTimeValue(value) {
    const time = String(value || "").trim();
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
  }

  function normalizeMeetingAttendance(attendance) {
    const id = normalizeId(attendance?.id);
    const meetingId = normalizeId(attendance?.meetingId);
    const employeeId = normalizeId(attendance?.employeeId);
    const status = String(attendance?.status || "");
    if (
      !attendance ||
      !id ||
      !meetingId ||
      !employeeId ||
      !Object.hasOwn(ATTENDANCE_STATUSES, status)
    ) {
      return null;
    }

    return {
      id,
      meetingId,
      employeeId,
      status,
      createdAt: validTimestamp(attendance.createdAt),
      updatedAt: validTimestamp(attendance.updatedAt || attendance.createdAt),
    };
  }

  function normalizeVacationEntitlement(entitlement) {
    const employeeId = normalizeId(entitlement?.employeeId);
    const year = Number(entitlement?.year);
    if (
      !employeeId ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return null;
    }
    return {
      employeeId,
      year,
      additionalDays:
        Math.round(clampNumber(entitlement.additionalDays, 0, 30, 0) * 2) / 2,
    };
  }

  function normalizeVacationDay(vacationDay) {
    const id = normalizeId(vacationDay?.id);
    const employeeId = normalizeId(vacationDay?.employeeId);
    const date = normalizeOptionalDate(vacationDay?.date);
    if (!id || !employeeId || !date) return null;
    return {
      id,
      employeeId,
      date,
      type: Object.hasOwn(PLANNER_ENTRY_TYPES, vacationDay.type)
        ? vacationDay.type
        : "vacation",
      createdAt: validTimestamp(vacationDay.createdAt),
      updatedAt: validTimestamp(
        vacationDay.updatedAt || vacationDay.createdAt,
      ),
    };
  }

  function uniqueVacationEntitlements(entitlements) {
    return [
      ...new Map(
        entitlements.map((entitlement) => [
          `${entitlement.employeeId}:${entitlement.year}`,
          entitlement,
        ]),
      ).values(),
    ];
  }

  function uniqueVacationDays(vacationDays) {
    return [
      ...new Map(
        vacationDays.map((vacationDay) => [
          `${vacationDay.employeeId}:${vacationDay.date}`,
          vacationDay,
        ]),
      ).values(),
    ];
  }

  function normalizeId(value) {
    const id = typeof value === "string" ? value : "";
    return /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
  }

  function validTimestamp(value) {
    const timestamp = typeof value === "string" ? value : "";
    return Number.isNaN(Date.parse(timestamp)) ? new Date().toISOString() : timestamp;
  }

  function validOptionalTimestamp(value) {
    if (!value) return "";
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  }

  function normalizeOptionalDate(value) {
    const date = String(value || "");
    return parseLocalDate(date) ? date : "";
  }

  function normalizeSaturdayDate(value) {
    const date = normalizeOptionalDate(value);
    const parsed = parseLocalDate(date);
    return parsed?.getDay() === 6
      ? date
      : DEFAULT_WEEKEND_A_REFERENCE_SATURDAY;
  }

  function normalizeDeadlineKinds(value) {
    if (!Array.isArray(value)) return [...DEADLINE_KINDS];
    return DEADLINE_KINDS.filter((kind) => value.includes(kind));
  }

  function normalizeAuditLog(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry) => {
        const id = normalizeId(entry?.id);
        const timestamp = validOptionalTimestamp(entry?.timestamp);
        const username = String(entry?.username || "").trim().slice(0, 40);
        const action = String(entry?.action || "").trim().slice(0, 240);
        if (!id || !timestamp || !username || !action) return null;
        return { id, timestamp, username, action };
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, MAX_AUDIT_LOG_ENTRIES);
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  async function persistState() {
    if (isMariaDbMode()) {
      const token = window.TeOBackend.readToken();
      if (!token) {
        showToast("Die Serversitzung ist abgelaufen. Bitte erneut anmelden.", "error");
        showLoginDialog();
        return false;
      }

      try {
        const result = await window.TeOBackend.save(
          backendConfig.apiUrl,
          token,
          state,
          remoteRevision,
        );
        remoteRevision = Number(result.revision) || remoteRevision + 1;
        markBackendConnected({ synchronized: true });
        pendingRemoteConflictState = null;
      } catch (error) {
        console.error("MariaDB-Datenbestand konnte nicht gespeichert werden.", error);
        if (error.status) markBackendConnected();
        else markBackendConnectionError(error);
        if (error.code === "revision_conflict" && error.details?.state) {
          remoteRevision = Number(error.details.revision) || remoteRevision;
          pendingRemoteConflictState = normalizeState(error.details.state);
          showToast(
            "Ein anderer Arbeitsplatz hat den Datenbestand verändert. Die aktuellen Serverdaten wurden geladen; bitte die Änderung erneut eingeben.",
            "error",
          );
        } else if (error.status === 401) {
          window.TeOBackend.writeToken("");
          showToast("Die Serversitzung ist abgelaufen. Bitte erneut anmelden.", "error");
          showLoginDialog();
        } else {
          showToast(
            error.message || "Speichern in MariaDB ist fehlgeschlagen.",
            "error",
          );
        }
        return false;
      }
    } else {
      try {
        await dataStore.setItem(STORAGE_KEY, state);
        localLastSaveAt = new Date().toISOString();
      } catch (error) {
        console.error("Daten konnten nicht gespeichert werden.", error);
        showToast(
          "Speichern fehlgeschlagen. Der Browserspeicher ist möglicherweise voll.",
          "error",
        );
        return false;
      }
      try {
        await dataStore.setItem(LOCAL_SAVE_TIMESTAMP_KEY, localLastSaveAt);
      } catch (error) {
        console.warn(
          "Der Zeitpunkt der lokalen Speicherung konnte nicht vorgemerkt werden.",
          error,
        );
      }
      renderSidebarSystemStatus();
    }

    try {
      dataSyncChannel?.postMessage({
        type: "state-updated",
        backend: backendMode,
      });
    } catch (syncError) {
      console.warn("Andere Tabs konnten nicht benachrichtigt werden.", syncError);
    }
    return true;
  }

  // auditAction ersetzt die automatisch ermittelte Beschreibung. Eine leere
  // Zeichenkette laesst den Protokolleintrag ganz weg - fuer Aenderungen, die
  // nur die Anzeige eines einzelnen Kontos betreffen und den fachlichen
  // Datenbestand unberuehrt lassen.
  //
  // undo benennt die Aenderung fuer ein spaeteres Zuruecknehmen („Mitarbeiter
  // gelöscht“). Der Schnappschuss davor entsteht ohnehin fuer den Ruecklauf,
  // ein Schritt zurueck kostet also nur, ihn aufzuheben. Ohne undo verfaellt
  // der zuletzt gemerkte Schritt: Was danach passiert ist, laesst sich nicht
  // mehr ueberspringen.
  async function commitStateMutation(mutate, { auditAction, undo = "" } = {}) {
    // Die Kopie fuer den Ruecklauf entsteht ueber JSON: In Chromium ist der
    // Umweg ueber Text fuer diesen Bestand messbar schneller als
    // structuredClone (6,5 ms gegenueber 11 ms bei 3600 Nachweisen).
    const previousState = JSON.parse(JSON.stringify(state));
    mutate();
    appendAuditEntry(
      auditAction === undefined
        ? describeMutation(previousState, state)
        : auditAction,
    );

    if (await persistState()) {
      stateMutationSequence += 1;
      databaseSaveReminderArmed = true;
      undoableMutation = undo ? { label: undo, state: previousState } : null;
      renderAll();
      scheduleAutomaticBackup();
      return true;
    }

    // Nach einem Ruecklauf auf den eigenen Stand bleibt ein gemerkter Schritt
    // gueltig - der Datenbestand ist derselbe wie zuvor. Hat dagegen der
    // Server einen anderen Stand geschickt, passt der Schnappschuss nicht mehr
    // dazu und wuerde fremde Aenderungen ueberschreiben.
    if (pendingRemoteConflictState) undoableMutation = null;
    state = pendingRemoteConflictState || previousState;
    pendingRemoteConflictState = null;
    if (currentUser) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    if (currentUser?.mustChangePassword) {
      completeLogin(currentUser);
      showToast(
        "Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.",
      );
      return false;
    }
    renderAll();
    return false;
  }

  function hasUndoableMutation() {
    return Boolean(undoableMutation);
  }

  // Nimmt den zuletzt gemeldeten Schritt zurueck. Das Zuruecknehmen ist selbst
  // eine Aenderung: Es wird gespeichert und steht im Protokoll, damit im
  // Nachhinein nachvollziehbar bleibt, was wann verschwand und wiederkam.
  async function undoLastMutation() {
    if (!undoableMutation) {
      showToast("Es ist kein Schritt gemerkt, der sich zurücknehmen lässt.", "warning");
      return false;
    }
    const { label, state: snapshot } = undoableMutation;
    undoableMutation = null;
    const committed = await commitStateMutation(
      () => {
        // Das Protokoll bleibt, wie es ist: Der Schnappschuss kennt den
        // zurueckgenommenen Schritt noch nicht, und ein Protokoll, das die
        // eigene Geschichte loescht, waere keins. Nach dem Zuruecknehmen
        // stehen beide Zeilen darin - die Aenderung und ihre Ruecknahme.
        const auditLog = state.auditLog;
        state = snapshot;
        state.auditLog = auditLog;
        // Der wiederhergestellte Bestand traegt eigene Kontoobjekte; ohne
        // diesen Abgleich zeigte die Oberflaeche weiter auf das alte.
        if (currentUser) {
          currentUser =
            state.users.find((user) => user.id === currentUser.id) || currentUser;
        }
      },
      { auditAction: `Rückgängig gemacht: ${label}` },
    );
    if (committed) showToast(`${label} – wieder hergestellt.`);
    return committed;
  }

  // Gibt die Kennung des angelegten Eintrags zurueck, damit ein Aufrufer ihn
  // gezielt wieder entfernen kann, wenn das Speichern anschliessend scheitert.
  function appendAuditEntry(action) {
    if (!action) return "";
    const id = createId();
    state.auditLog.unshift({
      id,
      timestamp: new Date().toISOString(),
      username: currentUser?.username || "System",
      action,
    });
    state.auditLog = state.auditLog.slice(0, MAX_AUDIT_LOG_ENTRIES);
    return id;
  }

  function describeMutation(before, after) {
    for (const [key, label] of TRACKED_COLLECTIONS) {
      const difference = after[key].length - before[key].length;
      if (difference > 0) return `${label}: ${difference} Eintrag/Einträge hinzugefügt`;
      if (difference < 0) return `${label}: ${Math.abs(difference)} Eintrag/Einträge gelöscht`;
      if (!sameStoredValue(before[key], after[key])) {
        return `${label} geändert`;
      }
    }
    if (!sameStoredValue(before.catalogs, after.catalogs)) {
      return "Berufs- oder Qualifikationskatalog geändert";
    }
    if (!sameStoredValue(before.settings, after.settings)) {
      return "Anwendungseinstellungen geändert";
    }
    return "Datenbestand aktualisiert";
  }

  // Verglichen wurde bisher ueber JSON.stringify: Fuer die Beschreibung einer
  // einzigen Aenderung wurde dabei der halbe Bestand in Text verwandelt, auch
  // die unveraenderten Sammlungen. Der Vergleich laeuft jetzt direkt ueber die
  // Werte, bricht beim ersten Unterschied ab und legt nichts an. Die Reihen-
  // folge der Felder spielt dabei - anders als bei JSON.stringify - keine
  // Rolle; nicht gesetzte Felder gelten wie zuvor als nicht vorhanden.
  function sameStoredValue(before, after) {
    if (before === after) return true;
    if (before === null || after === null) return false;
    if (typeof before !== "object" || typeof after !== "object") return false;

    if (Array.isArray(before) || Array.isArray(after)) {
      if (!Array.isArray(before) || !Array.isArray(after)) return false;
      if (before.length !== after.length) return false;
      for (let position = 0; position < before.length; position += 1) {
        if (!sameStoredValue(before[position], after[position])) return false;
      }
      return true;
    }

    // Ohne Zwischenlisten: Ein Vergleich laeuft ueber Zehntausende Objekte,
    // und je ein Array fuer die Schluesselnamen kostete dort mehr als der
    // Vergleich selbst.
    let beforeCount = 0;
    for (const key in before) {
      if (!Object.hasOwn(before, key) || before[key] === undefined) continue;
      beforeCount += 1;
      if (!sameStoredValue(before[key], after[key])) return false;
    }
    let afterCount = 0;
    for (const key in after) {
      if (Object.hasOwn(after, key) && after[key] !== undefined) afterCount += 1;
    }
    return beforeCount === afterCount;
  }

  function handleInitializationError(error) {
    console.error("Anwendung konnte nicht initialisiert werden.", error);
    const message = document.createElement("div");
    message.className = "noscript-message";
    message.textContent =
      "Die lokale Datenspeicherung konnte nicht gestartet werden. Bitte laden Sie die Seite neu oder verwenden Sie einen aktuellen Browser.";
    document.body.append(message);
  }

  function bindNavigation() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    document.querySelectorAll("[data-go-to]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.goTo));
    });

    document.querySelectorAll("[data-settings-section-target]").forEach((button) => {
      button.addEventListener("click", () => {
        showView("settings");
        showSettingsSection(button.dataset.settingsSectionTarget);
      });
    });

    // Das Inhaltsverzeichnis der Hilfe entsteht erst beim Einhaengen des
    // Handbuchs. Der Aufruf wird deshalb am Behaelter abgefangen, der von
    // Anfang an im Dokument steht.
    elements.helpContentHost?.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-help-target]");
      if (!button) return;
      document
        .getElementById(button.dataset.helpTarget)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_VIEWS[hash]) showView(HASH_VIEWS[hash], false);
    });

    window.addEventListener("scroll", requestStickyHeaderUpdate, { passive: true });
    window.addEventListener("resize", requestStickyHeaderUpdate);
    updateStickyHeader();
  }

  // Der Seitenkopf klebt per CSS; ob er eingeklappt ist, entscheidet die
  // Bildlaufhoehe. Gemessen wird die Oberkante der Ansicht, nicht die des
  // Kopfes: Die des Kopfes steht beim Kleben fest, die der Ansicht wandert
  // weiter und bleibt vom Einklappen unberuehrt.
  //
  // Zwischen Einklappen und Aufklappen liegt bewusst die volle Kopfhoehe.
  // Einklappen verkuerzt die Seite; reicht der Inhalt knapp, kappt der Browser
  // die Bildlaufhoehe und schiebt die Ansicht zurueck nach unten. Ohne diesen
  // Abstand faende der Kopf sich sofort wieder aufgeklappt - und das Spiel
  // begaenne von vorn, bei jedem Rad-Tick.
  function updateStickyHeader() {
    stickyHeaderFrame = 0;
    const view = document.querySelector(".view.is-active");
    const header = view?.querySelector(".page-header");
    if (!header) return;
    const styles = window.getComputedStyle(header);
    if (styles.position !== "sticky") {
      header.classList.remove("is-stuck");
      return;
    }
    const offset = Number.parseFloat(styles.top) || 0;
    const viewTop = view.getBoundingClientRect().top;
    if (header.classList.contains("is-stuck")) {
      if (viewTop >= offset - 4) header.classList.remove("is-stuck");
      return;
    }
    if (viewTop <= offset - header.getBoundingClientRect().height) {
      header.classList.add("is-stuck");
    }
  }

  function requestStickyHeaderUpdate() {
    if (stickyHeaderFrame) return;
    stickyHeaderFrame = window.requestAnimationFrame(updateStickyHeader);
  }

  function showView(view, updateHash = true) {
    if (!VIEW_HASHES[view]) view = "dashboard";
    if (view !== "vacations") setVacationPlannerMaximized(false);
    if (view !== "devices") setDeviceMatrixMaximized(false);
    activeView = view;

    document.body.classList.toggle("is-vacation-view", view === "vacations");
    if (view === "help") ensureHelpContent();
    if (view === "dashboard") renderDashboardGreeting();
    elements.mobileCreateButton.hidden = ["settings", "help"].includes(view);

    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
    });

    // Aenderungen, die waehrend der Abwesenheit dieser Ansicht entstanden
    // sind, werden jetzt nachgezogen - noch vor jeder Vermessung, damit das
    // Dashboard seine endgueltige Hoehe misst.
    if (staleViews.has(view)) renderView(view);

    // Erst jetzt ist das Dashboard vermessbar.
    if (view === "dashboard") limitDeadlineListHeight();

    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (view === "settings") showSettingsSection(activeSettingsSection);

    const mobileCreateType =
      view === "trainings"
        ? "training"
        : view === "meetings"
          ? "meeting"
          : view === "appointments"
            ? "appointment"
            : view === "memos"
              ? "memo"
            : view === "devices"
              ? "device-instruction"
              : view === "device-management"
                ? "device"
              : "employee";
    elements.mobileCreateButton.dataset.createType = mobileCreateType;
    elements.mobileCreateButton.querySelector("span").textContent = {
      employee: "Anlegen",
      training: "Fortbildung",
      meeting: "Sitzung",
      appointment: "Termin",
      memo: "Memo / ToDo",
      "device-instruction": "Einweisung",
      device: "Gerät",
    }[mobileCreateType];

    if (updateHash) {
      const nextHash = `#${VIEW_HASHES[view]}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState(null, "", nextHash);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    document
      .querySelectorAll(".page-header.is-stuck")
      .forEach((header) => header.classList.remove("is-stuck"));
    requestStickyHeaderUpdate();
  }

  function showSettingsSection(section = "general") {
    const availableSections = new Set([
      "general",
      "planning",
      "training",
      "master-data",
      "data",
    ]);
    activeSettingsSection = availableSections.has(section) ? section : "general";
    document.querySelectorAll("[data-settings-section]").forEach((panel) => {
      panel.hidden = panel.dataset.settingsSection !== activeSettingsSection;
    });
    document.querySelectorAll("[data-settings-section-target]").forEach((button) => {
      const active = button.dataset.settingsSectionTarget === activeSettingsSection;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // Was „Anlegen“ in der gezeigten Ansicht bedeutet. Der Knopf am unteren
  // Rand und das Tastenkuerzel „n“ gehen denselben Weg.
  function openCreateDialogForActiveView() {
    const type = elements.mobileCreateButton.dataset.createType;
    if (type === "training") openTrainingDialog();
    else if (type === "meeting") openMeetingDialog();
    else if (type === "appointment") openAppointmentDialog();
    else if (type === "memo") openMemoDialog();
    else if (type === "device-instruction") openDeviceInstructionDialog();
    else if (type === "device") openDeviceDialog();
    else openEmployeeDialog();
  }

  function bindDialogTriggers() {
    elements.mobileCreateButton.addEventListener("click", openCreateDialogForActiveView);

    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.addEventListener("change", () => changeTheme(select.value));
    });
    elements.mobileThemeButton.addEventListener("click", () => {
      const themes = Object.keys(THEMES);
      const currentIndex = themes.indexOf(activeThemeKey());
      changeTheme(themes[(currentIndex + 1) % themes.length]);
    });

    document.querySelectorAll("[data-open-employee]").forEach((button) => {
      button.addEventListener("click", () => openEmployeeDialog());
    });

    document.querySelectorAll("[data-open-training]").forEach((button) => {
      button.addEventListener("click", () => openTrainingDialog());
    });

    document.querySelectorAll("[data-open-completion]").forEach((button) => {
      button.addEventListener("click", () => openCompletionDialog());
    });

    document.querySelectorAll("[data-open-meeting]").forEach((button) => {
      button.addEventListener("click", () => openMeetingDialog());
    });

    document.querySelectorAll("[data-open-appointment]").forEach((button) => {
      button.addEventListener("click", () => openAppointmentDialog());
    });
    document.querySelectorAll("[data-open-memo]").forEach((button) => {
      button.addEventListener("click", () => openMemoDialog());
    });
    document.querySelectorAll("[data-open-device]").forEach((button) => {
      button.addEventListener("click", () => openDeviceDialog());
    });
    document
      .querySelectorAll("[data-open-device-instruction]")
      .forEach((button) => {
        button.addEventListener("click", () => openDeviceInstructionDialog());
      });

    elements.copyActiveEmailsButton.addEventListener("click", copyActiveEmployeeEmails);
    elements.copyUsernamesButton.addEventListener(
      "click",
      copyFilteredEmployeeUsernames,
    );
    elements.exportEmployeePhoneListButton.addEventListener(
      "click",
      exportEmployeePhoneList,
    );
    elements.printEmployeePhoneListButton.addEventListener(
      "click",
      printEmployeePhoneList,
    );
    elements.openWeekendSimulationButton.addEventListener(
      "click",
      openWeekendSimulationDialog,
    );
    elements.rerunWeekendSimulationButton.addEventListener(
      "click",
      renderWeekendSimulation,
    );
    elements.applyWeekendSimulationButton.addEventListener(
      "click",
      requestApplyWeekendSimulation,
    );
    elements.openTrainingMatrixButton.addEventListener("click", openTrainingMatrixDialog);
    elements.openTrainingTimeCalculatorButton.addEventListener(
      "click",
      openTrainingTimeCalculator,
    );
    elements.timeSpanList.addEventListener("input", updateTimeSpanTotal);
    elements.creditedTrainingTimeList.addEventListener(
      "input",
      updateCreditedTrainingTimeTotal,
    );
    elements.resetTimeSpansButton.addEventListener("click", () => {
      elements.timeSpanList.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      updateTimeSpanTotal();
    });
    elements.resetCreditedTrainingTimesButton.addEventListener("click", () => {
      elements.creditedTrainingTimeList.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      updateCreditedTrainingTimeTotal();
    });
    elements.trainingDisplayYear.addEventListener("change", () => {
      trainingDisplayYear = Number(elements.trainingDisplayYear.value);
      renderTrainings();
    });
    elements.trainingMatrixYear.addEventListener("change", renderTrainingMatrix);
    elements.exportTrainingMatrixCsvButton.addEventListener(
      "click",
      exportTrainingMatrixCsv,
    );
    elements.printTrainingMatrixButton.addEventListener("click", printTrainingMatrix);
    elements.openMeetingStatsButton.addEventListener("click", openMeetingStatsDialog);
    elements.meetingDisplayYear.addEventListener("change", () => {
      meetingDisplayYear = Number(elements.meetingDisplayYear.value);
      renderMeetings();
    });
    elements.meetingStatsYear.addEventListener("change", renderMeetingStatistics);
    elements.meetingAttendanceThreshold.addEventListener(
      "change",
      updateMeetingAttendanceThreshold,
    );
    elements.exportMeetingStatsCsvButton.addEventListener("click", exportMeetingStatsCsv);
    elements.deadlineHorizon.addEventListener("change", renderDeadlineOverview);
    elements.deadlineFilters.forEach((filter) => {
      filter.addEventListener("change", updateDeadlineFilters);
    });
    elements.deadlineHideOverdue.addEventListener(
      "change",
      updateDeadlineOverdueFilter,
    );
    elements.exportDataButton.addEventListener("click", exportDatabase);
    elements.databaseSaveWarningExportButton.addEventListener(
      "click",
      exportDatabase,
    );
    elements.exportEncryptedDataButton.addEventListener("click", exportEncryptedDatabase);
    elements.selectAutomaticBackupDirectoryButton.addEventListener(
      "click",
      selectAutomaticBackupDirectory,
    );
    elements.runAutomaticBackupButton.addEventListener(
      "click",
      () => void runAutomaticBackup({ force: true, requestPermission: true }),
    );
    elements.removeAutomaticBackupDirectoryButton.addEventListener(
      "click",
      removeAutomaticBackupDirectory,
    );
    elements.automaticBackupEncryption.addEventListener(
      "change",
      renderAutomaticBackupEncryptionControls,
    );
    elements.setAutomaticBackupPasswordButton.addEventListener(
      "click",
      configureAutomaticBackupEncryption,
    );
    elements.saveAutomaticBackupSettingsButton.addEventListener(
      "click",
      saveAutomaticBackupSettings,
    );
    elements.settingsMaxBackupFileSizeMb.addEventListener(
      "input",
      () => renderBackupVolumeMeter(elements.settingsMaxBackupFileSizeMb.value),
    );
    elements.requestPersistentStorageButton.addEventListener(
      "click",
      requestPersistentBrowserStorage,
    );
    elements.importDataButton.addEventListener("click", () => elements.importDataFile.click());
    elements.importDataFile.addEventListener("change", handleBackupFileSelection);
    elements.selectStartupBackupFileButton.addEventListener(
      "click",
      () => elements.startupBackupFile.click(),
    );
    elements.startupBackupFile.addEventListener(
      "change",
      handleStartupBackupFileSelection,
    );
    elements.validateBackupButton.addEventListener(
      "click",
      () => elements.validateBackupFile.click(),
    );
    elements.validateBackupFile.addEventListener("change", handleBackupValidationSelection);
    elements.openAuditLogButton.addEventListener("click", openAuditLogDialog);
    elements.exportAuditLogCsvButton.addEventListener("click", exportAuditLogCsv);
    elements.openWeekendOverviewButton.addEventListener("click", () => showView("weekends"));
    elements.openWeekendPrintButton.addEventListener("click", openWeekendOverviewDialog);
    elements.vacationYear.addEventListener("change", () => {
      vacationYear = Number(elements.vacationYear.value);
      saveVacationViewPreference();
      renderVacationPlanner();
    });
    elements.vacationMonth.addEventListener("change", () => {
      vacationMonth = Number(elements.vacationMonth.value);
      saveVacationViewPreference();
      renderVacationPlanner();
    });
    elements.vacationEntryType.addEventListener("change", () => {
      vacationEntryType = Object.hasOwn(
        PLANNER_ENTRY_TYPES,
        elements.vacationEntryType.value,
      )
        ? elements.vacationEntryType.value
        : "vacation";
    });
    elements.vacationEmployeeSearch.addEventListener("input", () => {
      vacationEmployeeSearchTerm = elements.vacationEmployeeSearch.value;
      renderVacationPlanner();
    });
    elements.openVacationConflictsButton.addEventListener(
      "click",
      openVacationConflictOverview,
    );
    elements.printBlankVacationYearOverviewsButton.addEventListener(
      "click",
      printBlankVacationYearOverviews,
    );
    elements.printBlankVacationMonthPlansButton.addEventListener(
      "click",
      printBlankVacationMonthPlans,
    );
    elements.toggleVacationPlannerMaximizeButton.addEventListener(
      "click",
      toggleVacationPlannerMaximized,
    );
    elements.previousVacationMonthButton.addEventListener("click", () =>
      shiftVacationMonth(-1),
    );
    elements.nextVacationMonthButton.addEventListener("click", () =>
      shiftVacationMonth(1),
    );
    document.addEventListener("keydown", handleVacationPlannerMaximizeKeydown);
    elements.vacationConflictContent.addEventListener("click", (event) => {
      const dateButton = event.target.closest("[data-vacation-conflict-date]");
      if (!dateButton) return;
      const date = dateButton.dataset.vacationConflictDate;
      vacationYear = Number(date.slice(0, 4));
      vacationMonth = Number(date.slice(5, 7));
      saveVacationViewPreference();
      elements.vacationConflictDialog.close();
      renderVacationPlanner();
    });
    elements.printVacationEmployeeOverviewButton.addEventListener(
      "click",
      printVacationEmployeeOverview,
    );
    elements.saveVacationSettingsButton.addEventListener(
      "click",
      saveVacationSettings,
    );
    elements.printWeekendOverviewButton.addEventListener("click", printWeekendOverview);
    elements.openDataQualityButton.addEventListener("click", openDataQualityDialog);
    document.querySelectorAll("[data-open-data-quality]").forEach((button) => {
      button.addEventListener("click", openDataQualityDialog);
    });
    elements.settingsCloseDialogOnOutsideClick.addEventListener(
      "change",
      (event) => {
        void saveCloseDialogOnOutsideClick(event.target.value === "on");
      },
    );
    elements.schoolVacationForm.addEventListener(
      "submit",
      addSchoolVacationPeriod,
    );
    elements.schoolVacationList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-school-vacation]");
      if (button) {
        void deleteSchoolVacationPeriod(
          Number(button.dataset.deleteSchoolVacation),
        );
      }
    });
    elements.restoreOfficialSchoolVacationsButton.addEventListener(
      "click",
      restoreOfficialSchoolVacations,
    );
    elements.saveGeneralSettingsButton.addEventListener(
      "click",
      saveGeneralSettings,
    );
    elements.saveTrainingDurationsButton.addEventListener(
      "click",
      saveTrainingDurations,
    );
    elements.saveWeekendSettingsButton.addEventListener(
      "click",
      saveWeekendSettings,
    );
    elements.settingsWeekendOwnerA.addEventListener(
      "change",
      updateWeekendNamePreviews,
    );
    elements.settingsWeekendOwnerB.addEventListener(
      "change",
      updateWeekendNamePreviews,
    );
    elements.settingsStorageBackend.addEventListener(
      "change",
      renderBackendSelection,
    );
    elements.testBackendConnectionButton.addEventListener(
      "click",
      testBackendConnection,
    );
    elements.applyStorageBackendButton.addEventListener(
      "click",
      applyStorageBackend,
    );
    elements.openBulkEditButton.addEventListener("click", openBulkEditDialog);
    elements.deleteEmployeeSelection?.addEventListener("click", () =>
      deleteEmployees([...selectedEmployeeIds]),
    );
    elements.clearEmployeeSelection.addEventListener("click", clearEmployeeSelection);
    elements.printEmployeeDossierButton.addEventListener("click", printEmployeeDossier);
  }

  function bindForms() {
    elements.backupPasswordForm.addEventListener(
      "submit",
      handleBackupPasswordSubmit,
    );
    elements.backupPasswordDialog.addEventListener(
      "close",
      handleBackupPasswordDialogClose,
    );
    elements.showBackupPassword.addEventListener(
      "change",
      updateBackupPasswordVisibility,
    );
    elements.copyAutomaticBackupRecoveryKey.addEventListener(
      "click",
      copyAutomaticBackupRecoveryKey,
    );
    elements.employeeForm.addEventListener("submit", handleEmployeeSubmit);
    elements.trainingForm.addEventListener("submit", handleTrainingSubmit);
    elements.completionForm.addEventListener("submit", handleCompletionSubmit);
    elements.meetingForm.addEventListener("submit", handleMeetingSubmit);
    elements.appointmentForm.addEventListener("submit", handleAppointmentSubmit);
    elements.deleteAppointmentButton.addEventListener(
      "click",
      requestDeleteAppointmentFromDialog,
    );
    elements.memoForm.addEventListener("submit", handleMemoSubmit);
    elements.memoCategoryForm.addEventListener("submit", addMemoCategory);
    elements.memoCategoryList.addEventListener("click", handleMemoCategoryAction);
    elements.deviceForm.addEventListener("submit", handleDeviceSubmit);
    elements.deviceInstructionForm.addEventListener(
      "submit",
      handleDeviceInstructionSubmit,
    );
    elements.attendanceForm.addEventListener("submit", handleAttendanceSubmit);
    elements.bulkEditForm.addEventListener("submit", handleBulkEditSubmit);

    [
      ["#firstName", "Bitte einen Vornamen eingeben."],
      ["#lastName", "Bitte einen Nachnamen eingeben."],
      ["#profession", "Bitte einen Beruf eingeben."],
      ["#trainingTitle", "Bitte eine Bezeichnung eingeben."],
      ["#meetingTitle", "Bitte eine Bezeichnung eingeben."],
      ["#appointmentTitle", "Bitte einen Titel eingeben."],
      ["#memoTitle", "Bitte einen Titel eingeben."],
      ["#deviceProductName", "Bitte einen Produktnamen eingeben."],
      ["#deviceManufacturer", "Bitte einen Hersteller eingeben."],
      ["#deviceCategory", "Bitte eine Gerätekategorie eingeben."],
    ].forEach(([selector, message]) => {
      const input = document.querySelector(selector);
      input.addEventListener("input", () => {
        input.setCustomValidity(input.value.trim() ? "" : message);
      });
    });

    document.querySelector("#birthDate").addEventListener("input", (event) => {
      event.target.setCustomValidity(
        event.target.value && event.target.value > todayIso()
          ? "Das Geburtsdatum darf nicht in der Zukunft liegen."
          : "",
      );
    });

    elements.completionDate.addEventListener("input", (event) => {
      event.target.setCustomValidity(
        event.target.value && event.target.value > todayIso()
          ? "Das Abschlussdatum darf nicht in der Zukunft liegen."
          : "",
      );
    });

    elements.completionTraining.addEventListener("change", renderCompletionEmployeeList);
    elements.deviceInstructorType.addEventListener(
      "change",
      updateDeviceInstructorFields,
    );
    elements.externalInstructorName.addEventListener("input", () => {
      elements.externalInstructorName.setCustomValidity("");
    });
    elements.employeeInstructor.addEventListener("change", () => {
      elements.employeeInstructor.setCustomValidity("");
    });
    elements.employeeInstructorMpoConfirmation.addEventListener("change", () => {
      elements.employeeInstructorMpoConfirmation.setCustomValidity("");
      elements.employeeInstructorMpoConfirmationError.textContent = "";
    });
    elements.deviceInstructionDate.addEventListener("input", () => {
      elements.deviceInstructionDate.setCustomValidity("");
    });
    document
      .querySelectorAll("#appointmentStartTime, #appointmentEndTime")
      .forEach((input) => input.addEventListener("input", validateAppointmentTimes));

    const trainingTitle = document.querySelector("#trainingTitle");
    const trainingRecurrence = document.querySelector("#trainingRecurrence");
    trainingRecurrence.addEventListener("change", () => {
      trainingRecurrenceManuallyChanged = true;
    });
    trainingTitle.addEventListener("input", () => {
      if (trainingRecurrenceManuallyChanged) return;
      trainingRecurrence.value = String(
        defaultTrainingRecurrenceMonths(trainingTitle.value),
      );
    });
  }

  function bindFilters() {
    elements.helpSearch.addEventListener("input", filterHelpTopics);
    elements.clearHelpSearch.addEventListener("click", () => {
      elements.helpSearch.value = "";
      filterHelpTopics();
      elements.helpSearch.focus();
    });

    elements.employeeSearch.addEventListener("input", (event) => {
      employeeSearchTerm = searchKey(event.target.value);
      renderEmployees();
    });

    elements.appointmentSearch.addEventListener("input", (event) => {
      appointmentSearchTerm = searchKey(event.target.value);
      renderAppointments();
    });

    document.querySelectorAll("[data-appointment-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        appointmentPeriodFilter = button.dataset.appointmentFilter;
        document
          .querySelectorAll("[data-appointment-filter]")
          .forEach((filterButton) => {
            const active = filterButton === button;
            filterButton.classList.toggle("is-active", active);
            filterButton.setAttribute("aria-pressed", String(active));
          });
        renderAppointments();
      });
    });

    document.querySelectorAll("[data-appointment-view]").forEach((button) => {
      button.addEventListener("click", () =>
        setAppointmentViewMode(button.dataset.appointmentView),
      );
    });

    elements.appointmentCalendarPreviousButton.addEventListener("click", () =>
      shiftAppointmentCalendarMonth(-1),
    );
    elements.appointmentCalendarNextButton.addEventListener("click", () =>
      shiftAppointmentCalendarMonth(1),
    );
    elements.appointmentCalendarTodayButton.addEventListener(
      "click",
      showAppointmentCalendarToday,
    );
    elements.appointmentCalendarNote.addEventListener(
      "click",
      handleAppointmentCalendarNoteAction,
    );

    elements.memoSearch.addEventListener("input", (event) => {
      memoSearchTerm = searchKey(event.target.value);
      renderMemos();
    });
    elements.memoCategoryFilter.addEventListener("change", (event) => {
      memoCategoryFilter = event.target.value;
      renderMemos();
    });
    document.querySelectorAll("[data-memo-status]").forEach((button) => {
      button.addEventListener("click", () => {
        memoStatusFilter = button.dataset.memoStatus;
        document.querySelectorAll("[data-memo-status]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderMemos();
      });
    });

    elements.employeeProfessionFilter.addEventListener("change", (event) => {
      employeeProfessionFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.employeeQualificationFilter.addEventListener("change", (event) => {
      employeeQualificationFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.employeeWeekendFilter.addEventListener("change", (event) => {
      employeeWeekendFilter = event.target.value;
      selectedEmployeeIds.clear();
      renderEmployees();
    });
    elements.resetEmployeeFilters.addEventListener("click", resetEmployeeFilters);

    document.querySelectorAll("[data-status-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        employeeStatusFilter = button.dataset.statusFilter;
        document.querySelectorAll("[data-status-filter]").forEach((filterButton) => {
          const active = filterButton === button;
          filterButton.classList.toggle("is-active", active);
          filterButton.setAttribute("aria-pressed", String(active));
        });
        renderEmployees();
      });
    });

    elements.completionEmployeeSearch.addEventListener("input", (event) => {
      completionSearchTerm = searchKey(event.target.value);
      renderCompletionEmployeeList();
    });

    elements.completionEmployeeList.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"][data-employee-id]');
      if (!checkbox) return;

      if (checkbox.checked) selectedCompletionEmployeeIds.add(checkbox.dataset.employeeId);
      else selectedCompletionEmployeeIds.delete(checkbox.dataset.employeeId);

      elements.completionEmployeeError.textContent = "";
      updateCompletionSelectionUi();
    });

    elements.toggleAllEmployees.addEventListener("click", () => {
      const visibleEmployees = filteredCompletionEmployees();
      const allSelected =
        visibleEmployees.length > 0 &&
        visibleEmployees.every((employee) => selectedCompletionEmployeeIds.has(employee.id));

      visibleEmployees.forEach((employee) => {
        if (allSelected) selectedCompletionEmployeeIds.delete(employee.id);
        else selectedCompletionEmployeeIds.add(employee.id);
      });

      renderCompletionEmployeeList();
    });

    elements.attendanceSearch.addEventListener("input", (event) => {
      attendanceSearchTerm = searchKey(event.target.value);
      renderAttendanceList();
    });

    elements.attendanceFilter.addEventListener("change", (event) => {
      attendanceStatusFilter = event.target.value;
      renderAttendanceList();
    });

    elements.applyBulkAttendance.addEventListener("click", () => {
      const visibleEmployees = filteredAttendanceEmployees();
      if (visibleEmployees.length === 0) {
        showToast("Für die aktuelle Auswahl sind keine Mitarbeiter sichtbar.", "error");
        return;
      }

      const status = elements.attendanceBulkStatus.value;
      visibleEmployees.forEach((employee) => {
        if (status) attendanceDraft.set(employee.id, status);
        else attendanceDraft.delete(employee.id);
      });
      renderAttendanceList();
      showToast(
        `Status wurde für ${visibleEmployees.length} Mitarbeiter${
          visibleEmployees.length === 1 ? "" : "/innen"
        } übernommen.`,
      );
    });

    elements.attendanceList.addEventListener("change", (event) => {
      const select = event.target.closest("select[data-attendance-employee-id]");
      if (!select) return;
      if (select.value) attendanceDraft.set(select.dataset.attendanceEmployeeId, select.value);
      else attendanceDraft.delete(select.dataset.attendanceEmployeeId);
      updateAttendanceProgress();
      if (attendanceStatusFilter === "all") {
        updateAttendanceRowState(select.closest(".attendance-row"), select.value);
      } else {
        renderAttendanceList();
      }
    });

    elements.deviceAnnexFilter.addEventListener("change", (event) => {
      deviceAnnexFilter = event.target.value;
      renderDevices();
    });
    elements.toggleDeviceMatrixMaximizeButton.addEventListener(
      "click",
      toggleDeviceMatrixMaximized,
    );
    document.addEventListener("keydown", handleDeviceMatrixMaximizeKeydown);
    elements.deviceInventoryFilter.addEventListener("change", (event) => {
      deviceInventoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceCategoryFilter.addEventListener("change", (event) => {
      deviceCategoryFilter = event.target.value;
      renderDevices();
    });
    elements.deviceSearch.addEventListener("input", (event) => {
      deviceSearchTerm = searchKey(event.target.value);
      renderDeviceInstructionMatrix();
    });
    elements.deviceManagementSearch.addEventListener("input", (event) => {
      deviceManagementSearchTerm = searchKey(event.target.value);
      renderDevices();
    });
    elements.exportDeviceCatalogExcelButton.addEventListener(
      "click",
      exportDeviceCatalogExcel,
    );
    elements.deviceManagementInventoryFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementInventoryFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceManagementAnnexFilter.addEventListener("change", (event) => {
      deviceManagementAnnexFilter = event.target.value;
      renderDevices();
    });
    elements.deviceManagementCategoryFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementCategoryFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceManagementAuthorizationFilter.addEventListener(
      "change",
      (event) => {
        deviceManagementAuthorizationFilter = event.target.value;
        renderDevices();
      },
    );
    elements.deviceEmployeeStatusFilter.addEventListener("change", (event) => {
      deviceEmployeeStatusFilter = event.target.value;
      renderDeviceInstructionMatrix();
    });
    elements.deviceEmployeeSearch.addEventListener("input", (event) => {
      deviceEmployeeSearchTerm = searchKey(event.target.value);
      renderDeviceInstructionMatrix();
    });
    elements.deviceOverviewSearch.addEventListener("input", (event) => {
      deviceOverviewSearchTerm = searchKey(event.target.value);
      renderDeviceOverview();
    });
    elements.deviceOverviewInstructionFilter.addEventListener(
      "change",
      (event) => {
        deviceOverviewInstructionFilter = event.target.value;
        renderDeviceOverview();
      },
    );
    elements.deviceOverviewEmploymentFilter.addEventListener(
      "change",
      (event) => {
        deviceOverviewEmploymentFilter = event.target.value;
        renderDeviceOverview();
      },
    );
    elements.deviceParticipantSearch.addEventListener("input", (event) => {
      deviceParticipantSearchTerm = searchKey(event.target.value);
      renderDeviceParticipantList();
    });
    elements.deviceParticipantList.addEventListener("change", (event) => {
      handleDeviceParticipantChange(event);
    });
    elements.toggleAllDeviceParticipants.addEventListener("click", () => {
      toggleVisibleDeviceParticipants();
    });
    elements.deviceInstructionSearch.addEventListener("input", (event) => {
      deviceInstructionSearchTerm = searchKey(event.target.value);
      deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
    });
    elements.deviceInstructionSort.addEventListener("change", (event) => {
      deviceInstructionSortKey =
        event.target.value === "createdAt" ? "createdAt" : "date";
      deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
    });
    elements.deviceInstructionDeviceSearch.addEventListener("input", (event) => {
      deviceInstructionDeviceSearchTerm = searchKey(event.target.value);
      renderInstructionDeviceList();
    });
    elements.deviceInstructionDeviceList.addEventListener("change", (event) => {
      handleInstructionDeviceChange(event);
    });
    elements.toggleAllInstructionDevices.addEventListener("click", () => {
      toggleVisibleInstructionDevices();
    });
  }

  // Das Handbuch steht beim Start in einer Vorlage und gehoert damit noch
  // nicht zum Dokument. Eingehaengt wird es beim ersten Bedarf: beim Wechsel
  // in die Hilfe, bei der ersten Suche und wenn „Was ist neu“ den Abschnitt
  // der laufenden Fassung von dort holt. Die Knoten werden verschoben, nicht
  // kopiert - die Vorlage ist danach leer.
  let helpContentAttached = false;

  function ensureHelpContent() {
    if (helpContentAttached) return;
    helpContentAttached = true;
    const template = elements.helpContentTemplate;
    if (!template?.content || !elements.helpContentHost) return;
    elements.helpContentHost.append(template.content);
  }

  // Wo das Handbuch gerade steht: im Dokument, sobald es eingehaengt ist -
  // sonst in seiner Vorlage. Wer nur darin nachschlaegt, soll es dafuer nicht
  // aufbauen muessen. „Was ist neu“ tut genau das, und zwar beim Start.
  function helpContentRoot() {
    if (helpContentAttached) return document;
    const template = elements.helpContentTemplate;
    return template?.content?.querySelectorAll ? template.content : document;
  }

  // Die Suche verglich bisher bei jedem Tastendruck den Text saemtlicher
  // Abschnitte - rund 130 KB, jedes Mal durch die Normalisierung von
  // searchKey. Das Handbuch aendert sich zur Laufzeit nicht, deshalb entsteht
  // der Suchschluessel je Abschnitt genau einmal.
  let helpTopics = null;

  function helpTopicList() {
    if (helpTopics) return helpTopics;
    ensureHelpContent();
    helpTopics = [...document.querySelectorAll("[data-help-section]")].map(
      (section) => ({
        section,
        navButton: document.querySelector(
          `[data-help-nav-target="${section.dataset.helpHeading}"]`,
        ),
        key: searchKey(section.textContent),
      }),
    );
    return helpTopics;
  }

  function filterHelpTopics() {
    const query = searchKey(elements.helpSearch.value);
    const topics = helpTopicList();
    let visibleCount = 0;
    topics.forEach((topic) => {
      const matches = !query || topic.key.includes(query);
      topic.section.hidden = !matches;
      if (matches) visibleCount += 1;
      topic.navButton?.toggleAttribute("hidden", !matches);
    });
    elements.helpSearchStatus.textContent = query
      ? `${visibleCount} von ${topics.length} Themen gefunden`
      : `${topics.length} Hilfethemen`;
    elements.clearHelpSearch.hidden = !query;
    elements.helpNoResults.hidden = visibleCount > 0;
  }


  function bindDelegatedActions() {
    elements.employeeTable.addEventListener("click", handleEmployeeTableAction);
    elements.employeeTable.addEventListener("change", handleEmployeeTableSelection);
    elements.vacationPlanner.addEventListener("click", handleVacationPlannerClick);
    elements.vacationPlanner.addEventListener("change", handleVacationPlannerChange);
    elements.vacationPlanner.addEventListener(
      "keydown",
      handleVacationPlannerKeydown,
    );
    elements.recentEmployees.addEventListener("click", handleRecentEmployeeAction);
    elements.trainingList.addEventListener("click", handleTrainingAction);
    elements.meetingList.addEventListener("click", handleMeetingAction);
    elements.appointmentList.addEventListener("click", handleAppointmentAction);
    elements.appointmentList.addEventListener("keydown", handleAppointmentAction);
    // Im Kalender sind Tage und Eintraege Schaltflaechen; die Tastatur loest
    // sie ohne eigenen keydown-Zweig aus.
    elements.appointmentCalendarGrid.addEventListener(
      "click",
      handleAppointmentCalendarClick,
    );
    elements.memoList.addEventListener("click", handleMemoAction);
    elements.memoList.addEventListener("keydown", handleMemoAction);
    elements.dashboardMemoList.addEventListener("click", handleDashboardMemoAction);
    elements.deviceCatalog.addEventListener("click", handleDeviceAction);
    elements.deviceInstructionMatrix.addEventListener(
      "click",
      handleDeviceMatrixAction,
    );
    elements.deviceInstructionList.addEventListener(
      "click",
      handleDeviceInstructionListAction,
    );
    elements.deviceInstructionHistoryContent.addEventListener(
      "click",
      handleDeviceHistoryAction,
    );
    elements.deviceEmployeeOverviewContent.addEventListener(
      "click",
      handleDeviceEmployeeOverviewAction,
    );
    elements.deviceOverviewContent.addEventListener(
      "click",
      handleDeviceEmployeeOverviewAction,
    );
  }

  function bindDialogs() {
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog) requestDialogClose(dialog);
      });
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("close", () => {
        window.setTimeout(syncNotificationLayer, 0);
      });
      if (dialog.hasAttribute("data-persistent-dialog")) {
        dialog.addEventListener("cancel", (event) => event.preventDefault());
        return;
      }
      dialog.addEventListener("cancel", (event) => {
        if (!dialogHasUnsavedChanges(dialog)) return;
        event.preventDefault();
        requestDialogClose(dialog);
      });
      dialog.addEventListener("click", (event) => {
        // Die Einstellung wird bei jedem Klick gelesen, damit ein Umschalten
        // sofort wirkt und die Dialoge nicht neu verdrahtet werden muessen.
        if (!state.settings.closeDialogOnOutsideClick) return;
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom;
        if (!inside) requestDialogClose(dialog);
      });
    });

    elements.confirmCancel.addEventListener("click", () => {
      confirmCallback = null;
      elements.confirmDialog.close();
    });

    elements.confirmAccept.addEventListener("click", () => {
      const callback = confirmCallback;
      confirmCallback = null;
      elements.confirmDialog.close();
      if (callback) callback();
    });

    elements.confirmDialog.addEventListener("close", () => {
      confirmCallback = null;
    });
  }

  function captureCleanForm(form) {
    if (form) cleanFormSnapshots.set(form, serializeForm(form));
  }

  function markFormClean(form) {
    if (form) cleanFormSnapshots.delete(form);
  }

  function serializeForm(form) {
    return JSON.stringify(
      [...form.querySelectorAll("input, select, textarea")].map((field, index) => [
        field.name || field.id || field.dataset.employeeId || index,
        ["checkbox", "radio"].includes(field.type) ? field.checked : field.value,
      ]),
    );
  }

  function dialogHasUnsavedChanges(dialog) {
    const form = dialog.querySelector("form");
    const snapshot = form ? cleanFormSnapshots.get(form) : undefined;
    return snapshot !== undefined && snapshot !== serializeForm(form);
  }

  function requestDialogClose(dialog) {
    if (!dialogHasUnsavedChanges(dialog)) {
      dialog.close();
      return;
    }
    requestConfirmation({
      title: "Ungespeicherte Änderungen verwerfen?",
      message:
        "In diesem Formular wurden Änderungen vorgenommen. Beim Schließen gehen diese Eingaben verloren.",
      acceptLabel: "Änderungen verwerfen",
      callback: () => {
        markFormClean(dialog.querySelector("form"));
        dialog.close();
      },
    });
  }

  function bindAuthentication() {
    elements.setupForm.addEventListener("submit", handleSetupSubmit);
    elements.loginForm.addEventListener("submit", handleLoginSubmit);
    elements.changePasswordForm.addEventListener("submit", handlePasswordChangeSubmit);
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", logout);
    });
    document.querySelectorAll("[data-open-user-management]").forEach((button) => {
      button.addEventListener("click", openUserManagementDialog);
    });
    elements.mobileAccountButton.addEventListener("click", openAccountDialog);
    elements.createUserForm.addEventListener("submit", handleCreateUserSubmit);
    elements.userManagementList.addEventListener("click", (event) => {
      const resetButton = event.target.closest("[data-reset-user-password]");
      if (resetButton) {
        requestPasswordReset(resetButton.dataset.resetUserPassword);
        return;
      }
      const deleteButton = event.target.closest("[data-delete-user]");
      if (deleteButton) {
        requestDeleteUser(deleteButton.dataset.deleteUser);
        return;
      }
      const saveButton = event.target.closest("[data-save-user-username]");
      if (saveButton) saveUsername(saveButton.dataset.saveUserUsername);
    });
    elements.userManagementList.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        event.target.matches("[data-user-username]")
      ) {
        event.preventDefault();
        saveUsername(event.target.dataset.userUsername);
      }
    });
    elements.copyTemporaryPassword.addEventListener("click", async () => {
      const password = elements.temporaryPasswordValue.value;
      if (!password) return;
      try {
        await navigator.clipboard.writeText(password);
      } catch {
        copyTextWithFallback(password);
      }
      showToast("Temporäres Passwort wurde kopiert.");
    });
  }

  function bindCatalogManagement() {
    document.querySelectorAll(
      "#openCatalogManagementButton, [data-open-catalog-management]",
    ).forEach((button) => {
      button.addEventListener("click", openCatalogManagementDialog);
    });
    elements.addProfessionButton.addEventListener("click", addProfession);
    elements.addQualificationButton.addEventListener("click", addQualification);
    elements.newProfession.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addProfession();
      }
    });
    elements.newQualification.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addQualification();
      }
    });
    elements.professionCatalogList.addEventListener("click", handleProfessionCatalogAction);
    elements.qualificationCatalogList.addEventListener(
      "click",
      handleQualificationCatalogAction,
    );
  }

  function bindDataSync() {
    if (!("BroadcastChannel" in window)) return;

    dataSyncChannel = new window.BroadcastChannel("intensivteam-data-sync-v1");
    dataSyncChannel.addEventListener("message", async (event) => {
      if (event.data?.type !== "state-updated") return;
      if (event.data?.backend && event.data.backend !== backendMode) return;
      const openDialogs = [
        elements.employeeDialog,
        elements.trainingDialog,
        elements.completionDialog,
        elements.trainingMatrixDialog,
        elements.meetingDialog,
        elements.appointmentDialog,
        elements.deviceDialog,
        elements.deviceInstructionDialog,
        elements.deviceEmployeeOverviewDialog,
        elements.deviceOverviewDialog,
        elements.deviceInstructionHistoryDialog,
        elements.attendanceDialog,
        elements.meetingStatsDialog,
        elements.accountDialog,
        elements.userManagementDialog,
        elements.catalogManagementDialog,
        elements.employeeDossierDialog,
        elements.vacationEmployeeOverviewDialog,
        elements.vacationConflictDialog,
        elements.weekendOverviewDialog,
        elements.weekendSimulationDialog,
        elements.bulkEditDialog,
        elements.dataQualityDialog,
        elements.auditLogDialog,
        elements.automaticBackupRecoveryDialog,
        elements.confirmDialog,
      ].filter((dialog) => dialog.open);
      openDialogs.forEach((dialog) => dialog.close());

      state = await loadState();
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      if (currentUser) {
        const refreshedUser = state.users.find((user) => user.id === currentUser.id);
        if (!refreshedUser) {
          showLoginDialog();
          return;
        }
        currentUser = refreshedUser;
        // Erst nach dem Auffrischen des Kontos, damit ein an einem anderen
        // Arbeitsplatz gewaehltes Farbthema uebernommen wird.
        applyTheme(activeThemeKey());
        if (currentUser.mustChangePassword) {
          completeLogin(currentUser);
          showToast("Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.");
          return;
        }
      } else {
        applyTheme(activeThemeKey());
      }
      renderAll();
      showToast(
        openDialogs.length
          ? "Daten wurden aktualisiert. Die offene Eingabe wurde vorsorglich geschlossen."
          : "Daten wurden aus einem anderen Tab aktualisiert.",
      );
    });

    window.addEventListener("beforeunload", () => dataSyncChannel?.close());
  }

  function bindRemoteSync() {
    remoteSyncTimer = window.setInterval(pollMariaDbState, 15000);
    window.addEventListener("beforeunload", () => {
      if (remoteSyncTimer) window.clearInterval(remoteSyncTimer);
    });
  }

  async function pollMariaDbState() {
    if (
      !isMariaDbMode() ||
      !currentUser ||
      document.hidden ||
      !window.TeOBackend.readToken()
    ) {
      return;
    }

    try {
      const result = await window.TeOBackend.load(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      markBackendConnected({ synchronized: true });
      const nextRevision = Number(result.revision) || 0;
      if (nextRevision <= remoteRevision) return;

      if (document.querySelector("dialog[open]")) {
        if (remoteUpdateNoticeRevision !== nextRevision) {
          remoteUpdateNoticeRevision = nextRevision;
          showToast(
            "Auf dem Server liegen neuere Daten vor. Sie werden nach dem Schließen der offenen Eingabe geladen.",
          );
        }
        return;
      }

      state = normalizeState(result.state);
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      remoteRevision = nextRevision;
      remoteUpdateNoticeRevision = 0;
      const refreshedUser = state.users.find(
        (user) => user.id === currentUser.id,
      );
      if (!refreshedUser) {
        window.TeOBackend.writeToken("");
        showLoginDialog();
        return;
      }
      currentUser = refreshedUser;
      applyTheme(activeThemeKey());
      if (currentUser.mustChangePassword) {
        completeLogin(currentUser);
        showToast(
          "Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.",
        );
        return;
      }
      renderAll();
      showToast("Änderungen von einem anderen Arbeitsplatz wurden geladen.");
    } catch (error) {
      if (error.status === 401) {
        markBackendConnected();
        window.TeOBackend.writeToken("");
        showLoginDialog();
      } else {
        markBackendConnectionError(error);
        console.warn("MariaDB-Synchronisierung vorübergehend nicht verfügbar.", error);
      }
    }
  }

  // Welche Renderfunktionen den Inhalt einer Ansicht aufbauen. Die
  // Geraeteliste versorgt beide Geraeteansichten, deshalb steht sie zweimal.
  // Inhalte von Dialogen stehen bewusst nicht hier: Sie werden beim Oeffnen
  // des Dialogs aufgebaut und sind dadurch immer aktuell.
  const VIEW_RENDERERS = {
    dashboard: [renderDashboard, renderDeadlineOverview, renderDashboardMemos, renderDesktopWorkspace],
    employees: [renderEmployees],
    weekends: [renderWeekendDistribution],
    vacations: [renderVacationPlanner],
    appointments: [renderAppointments],
    memos: [renderMemos],
    trainings: [renderTrainings],
    meetings: [renderMeetings],
    devices: [renderDevices],
    "device-management": [renderDevices],
    settings: [renderSettings],
    help: [filterHelpTopics],
  };

  function renderView(view) {
    staleViews.delete(view);
    for (const render of VIEW_RENDERERS[view] || []) render();
  }

  // Eine Aenderung betrifft selten mehr als eine Ansicht, aufgebaut wurden
  // bisher aber alle - auch die verdeckten. Allein Geraeteliste und
  // Urlaubsmatrix kosten zusammen ein halbes Zehntel einer Sekunde, das
  // niemand zu sehen bekommt. Verdeckte Ansichten werden deshalb nur
  // vorgemerkt; showView() holt sie beim Wechsel nach.
  function renderAll() {
    // Nur Mitarbeiter, die tatsaechlich im Dienst stehen. Ausgetretene sollen
    // die Zahl in der Seitenleiste nicht dauerhaft aufblaehen.
    elements.navEmployeeCount.textContent = String(activeEmployeeList().length);
    elements.navTrainingCount.textContent = String(state.trainings.length);
    elements.navMeetingCount.textContent = String(state.meetings.length);
    elements.navAppointmentCount.textContent = String(
      state.appointments.filter((appointment) => appointment.date >= todayIso()).length,
    );
    elements.navMemoCount.textContent = String(
      visibleMemos().filter((memo) => !memo.completed).length,
    );
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    updateUsernameExportButton();
    updateSidebarCollapsedLabels();
    for (const view of Object.keys(VIEW_RENDERERS)) {
      if (view !== activeView) staleViews.add(view);
    }
    renderView(activeView);
    renderBackupStatus();
    renderAutomaticBackupStatus();
    renderDatabaseSaveWarning();
    refreshFormattedDateInputs();
    void renderBrowserStorageStatus();
    scheduleAutomaticBackup();
    applyAccessControl();
    renderSidebarSystemStatus();
  }

  // Das Farbthema gehoert zum Benutzerkonto, nicht zum Datenbestand: Wer sich
  // anmeldet, bringt seine eigene Auswahl mit. state.settings.theme bleibt die
  // gemeinsame Vorgabe - sie gilt vor der Anmeldung und fuer Konten, die noch
  // nie ein eigenes Thema gewaehlt haben.
  function activeThemeKey() {
    return normalizeTheme(currentUser?.theme || state.settings.theme);
  }

  async function changeTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    if (!currentUser) {
      // Ohne Anmeldung gibt es kein Konto, das die Wahl aufbewahren koennte.
      applyTheme(nextTheme);
      showToast(
        "Das Farbthema gilt vorerst nur für diese Sitzung. Nach der Anmeldung wird es für das Benutzerkonto gespeichert.",
      );
      return;
    }
    if (nextTheme === activeThemeKey()) {
      applyTheme(nextTheme);
      return;
    }

    const committed = await commitStateMutation(
      () => {
        const account = state.users.find((user) => user.id === currentUser.id);
        if (account) account.theme = nextTheme;
        currentUser.theme = nextTheme;
      },
      // Eine Anzeigeeinstellung eines einzelnen Kontos ist keine fachliche
      // Aenderung und hat im Änderungsprotokoll nichts verloren.
      { auditAction: "" },
    );
    if (committed) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
    }
    applyTheme(activeThemeKey());
    if (committed) {
      showToast(
        `Farbthema „${THEMES[nextTheme]}“ wurde für „${currentUser.username}“ gespeichert.`,
      );
    }
  }

  function applyTheme(theme) {
    const activeTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = DARK_THEMES.has(activeTheme)
      ? "dark"
      : "light";
    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.value = activeTheme;
    });
    elements.mobileThemeButton.setAttribute(
      "aria-label",
      `Farbthema wechseln. Aktuell: ${THEMES[activeTheme]}`,
    );
    elements.mobileThemeButton.title = `Farbthema: ${THEMES[activeTheme]}`;
  }

  function restoreAuthenticationSession() {
    if (!isMariaDbMode() && state.users.length === 0) {
      showSetupDialog();
      return;
    }
    const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
    const user = state.users.find((item) => item.id === sessionUserId);
    if (user && automaticBackupSettings?.encrypted) {
      sessionStorage.removeItem(SESSION_USER_KEY);
      showLoginDialog();
      elements.loginError.textContent =
        "Bitte erneut anmelden, damit TeO den Sicherungsschlüssel entsperren kann.";
      return;
    }
    if (!user) {
      showLoginDialog();
      if (isMariaDbMode() && backendStartupError) {
        elements.loginError.textContent = backendStartupError;
      }
      return;
    }
    completeLogin(user);
  }

  function showSetupDialog() {
    currentUser = null;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.setupForm.reset();
    elements.setupError.textContent = "";
    if (!elements.setupDialog.open) elements.setupDialog.showModal();
    window.setTimeout(() => document.querySelector("#setupUsername").focus(), 0);
  }

  async function handleSetupSubmit(event) {
    event.preventDefault();
    if (isMariaDbMode() || state.users.length > 0) {
      elements.setupError.textContent =
        "Die Ersteinrichtung ist für diesen Datenbestand bereits abgeschlossen.";
      return;
    }

    const username = document.querySelector("#setupUsername").value.trim();
    const password = document.querySelector("#setupPassword").value;
    const confirmation = document.querySelector("#setupPasswordConfirmation").value;
    elements.setupError.textContent =
      /^[A-Za-z0-9]{4,40}$/.test(username)
        ? validateNewPassword(password, confirmation)
        : "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.";
    if (elements.setupError.textContent) return;

    let credentials;
    try {
      credentials = await createPasswordCredentials(password);
    } catch (error) {
      console.error("Administratorkonto konnte nicht erstellt werden.", error);
      elements.setupError.textContent =
        "Die sichere Passworterstellung ist in diesem Browser nicht verfügbar.";
      return;
    }

    const admin = {
      id: createId(),
      username,
      role: "admin",
      ...credentials,
      mustChangePassword: false,
    };
    state.users = [admin];
    currentUser = admin;
    appendAuditEntry("Ersteinrichtung abgeschlossen und Administratorkonto angelegt");
    if (!(await persistState())) {
      state.users = [];
      currentUser = null;
      elements.setupError.textContent =
        "Die Ersteinrichtung konnte nicht gespeichert werden.";
      return;
    }
    databaseSaveReminderArmed = true;
    elements.setupDialog.close();
    completeLogin(admin, { requestStartupBackupPermission: true });
    showToast("TeO wurde eingerichtet.");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    elements.loginError.textContent = "";
    const username = document.querySelector("#loginUsername").value.trim();
    const password = document.querySelector("#loginPassword").value;

    if (isMariaDbMode()) {
      try {
        const result = await window.TeOBackend.login(
          backendConfig.apiUrl,
          username,
          password,
        );
        state = normalizeState(result.state);
        databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
        remoteRevision = Number(result.revision) || 0;
        backendStartupError = "";
        markBackendConnected({ synchronized: true });
        window.TeOBackend.writeToken(result.token);
        const remoteUser = state.users.find(
          (item) => item.id === result.user?.id,
        );
        if (!remoteUser) {
          throw new Error("Das angemeldete Benutzerkonto fehlt im Serverdatenbestand.");
        }
        await unlockAutomaticBackupForLogin(remoteUser, password);
        completeLogin(remoteUser);
      } catch (error) {
        console.error("Serveranmeldung fehlgeschlagen.", error);
        if (error.status) markBackendConnected();
        else markBackendConnectionError(error);
        elements.loginError.textContent =
          error.message || "Die Anmeldung am TeO-Server ist fehlgeschlagen.";
        document.querySelector("#loginPassword").value = "";
      }
      return;
    }

    const user = state.users.find(
      (item) => item.username.toLocaleLowerCase("de-DE") === username.toLocaleLowerCase("de-DE"),
    );

    let passwordMatches;
    try {
      passwordMatches = user ? await verifyPassword(password, user) : false;
    } catch (error) {
      console.error("Passwortprüfung nicht verfügbar.", error);
      elements.loginError.textContent =
        "Die sichere Passwortprüfung ist in diesem Browser nicht verfügbar.";
      return;
    }

    if (!user || !passwordMatches) {
      elements.loginError.textContent = "Benutzername oder Passwort ist nicht korrekt.";
      document.querySelector("#loginPassword").value = "";
      return;
    }

    try {
      await unlockAutomaticBackupForLogin(user, password);
    } catch (error) {
      console.warn("Der automatische Sicherungsschlüssel konnte nicht entsperrt werden.", error);
      automaticBackupNotice =
        "Sicherungsschlüssel nicht entsperrt – erneut anmelden oder Wiederherstellungsschlüssel verwenden.";
    }
    completeLogin(user, { requestStartupBackupPermission: true });
  }

  function completeLogin(
    user,
    { requestStartupBackupPermission = false } = {},
  ) {
    currentUser = user;
    sessionStorage.setItem(SESSION_USER_KEY, user.id);
    // Jede Anmeldung bringt das Farbthema des Kontos mit.
    applyTheme(activeThemeKey());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    if (elements.loginDialog.open) elements.loginDialog.close();
    renderAll();

    if (user.mustChangePassword) {
      document.body.classList.add("is-auth-locked");
      elements.changePasswordForm.reset();
      elements.changePasswordError.textContent = "";
      if (!elements.changePasswordDialog.open) elements.changePasswordDialog.showModal();
      window.setTimeout(() => document.querySelector("#newPassword").focus(), 0);
      return;
    }

    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({
        requestPermission: requestStartupBackupPermission,
      });
      return;
    }

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
    scheduleAutomaticBackup();
    // Erst jetzt: Vor der Anmeldung steht die Anwendung noch hinter der
    // Sperre, und ein Hinweis darueber waere im Weg.
    showWhatsNewIfUpdated();
  }

  function showLoginDialog() {
    currentUser = null;
    // Ohne angemeldetes Konto gilt wieder die gemeinsame Vorgabe.
    applyTheme(activeThemeKey());
    clearAutomaticBackupTimer();
    automaticBackupPassword = "";
    startupBackupSynchronized = false;
    startupBackupImportRunning = false;
    backupReminderShown = false;
    sessionStorage.removeItem(SESSION_USER_KEY);
    document.body.classList.add("is-auth-locked");
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    elements.loginForm.reset();
    elements.loginError.textContent = "";
    applyAccessControl();
    if (!elements.loginDialog.open) elements.loginDialog.showModal();
    window.setTimeout(() => document.querySelector("#loginUsername").focus(), 0);
  }

  function showStartupBackupDialog(status = "") {
    document.body.classList.add("is-auth-locked");
    elements.startupBackupFile.value = "";
    elements.startupBackupStatus.textContent = status;
    elements.selectStartupBackupFileButton.disabled = false;
    if (!elements.startupBackupDialog.open) {
      elements.startupBackupDialog.showModal();
    }
    window.setTimeout(() => elements.selectStartupBackupFileButton.focus(), 0);
  }

  function logout() {
    if (isMariaDbMode()) {
      void window.TeOBackend.logout(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      window.TeOBackend.writeToken("");
    }
    showLoginDialog();
  }

  async function handlePasswordChangeSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
      showLoginDialog();
      return;
    }

    const password = document.querySelector("#newPassword").value;
    const confirmation = document.querySelector("#confirmNewPassword").value;
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      elements.changePasswordError.textContent = validationError;
      return;
    }
    if (await verifyPassword(password, currentUser)) {
      elements.changePasswordError.textContent =
        "Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.";
      return;
    }

    const credentials = await createPasswordCredentials(password);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, ...credentials, mustChangePassword: false }
          : user,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(currentUser.id, password);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte nicht auf das neue Passwort umgestellt werden.", error);
      showToast(
        "Passwort geändert; der automatische Sicherungsschlüssel konnte jedoch nicht aktualisiert werden.",
        "error",
      );
    }
    currentUser = state.users.find((user) => user.id === currentUser.id);
    elements.changePasswordDialog.close();
    if (!isMariaDbMode() && !startupBackupSynchronized) {
      void synchronizeStartupBackupFromSavedDirectory({ requestPermission: true });
    } else {
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
    }
    showToast("Das neue Passwort wurde gespeichert.");
  }

  function validateNewPassword(password, confirmation) {
    if (password !== confirmation) return "Die eingegebenen Passwörter stimmen nicht überein.";
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    if (!/[A-ZÄÖÜ]/.test(password) || !/[a-zäöüß]/.test(password) || !/\d/.test(password)) {
      return "Das Passwort benötigt Groß- und Kleinbuchstaben sowie mindestens eine Zahl.";
    }
    return "";
  }

  async function verifyPassword(password, user) {
    const derivedHash = await derivePasswordHash(
      password,
      user.passwordSalt,
      PASSWORD_ITERATIONS,
    );
    return constantTimeEqual(derivedHash, user.passwordHash);
  }

  async function createPasswordCredentials(password) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const passwordSalt = bytesToBase64(saltBytes);
    return {
      passwordSalt,
      passwordHash: await derivePasswordHash(password, passwordSalt, PASSWORD_ITERATIONS),
    };
  }

  async function derivePasswordHash(password, saltBase64, iterations) {
    if (!crypto.subtle) throw new Error("Web Crypto API nicht verfügbar");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64ToBytes(saltBase64),
        iterations,
      },
      key,
      256,
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function constantTimeEqual(valueA, valueB) {
    if (valueA.length !== valueB.length) return false;
    let difference = 0;
    for (let index = 0; index < valueA.length; index += 1) {
      difference |= valueA.charCodeAt(index) ^ valueB.charCodeAt(index);
    }
    return difference === 0;
  }

  function isAdmin() {
    return currentUser?.role === "admin";
  }

  function requireAdmin() {
    if (isAdmin()) return true;
    showToast("Diese Aktion ist nur für Administratoren verfügbar.", "error");
    return false;
  }

  function applyAccessControl() {
    const admin = isAdmin();
    // Die Rolle am body genuegt: Das Stylesheet blendet die als Verwaltung
    // markierten Elemente aus, solange sie nicht „admin“ lautet. Die Schleife
    // davor lief bei jedem Aufbau einer Ansicht ueber das gesamte Dokument
    // und setzte dabei nur, was die Regel schon entschieden hatte.
    document.body.dataset.userRole = currentUser?.role || "guest";
    elements.currentUsername.textContent = currentUser?.username || "Nicht angemeldet";
    elements.currentUserRole.textContent = currentUser
      ? admin
        ? "Administrator"
        : "Normaler Benutzer"
      : "–";
    elements.mobileAccountButton.title = currentUser
      ? `Benutzerkonto: ${currentUser.username}`
      : "Benutzerkonto";
    updateSidebarFooterSummaries();
    renderDatabaseSaveWarning();
  }

  function openAccountDialog() {
    if (!currentUser) {
      showLoginDialog();
      return;
    }
    elements.accountDialogTitle.textContent = currentUser.username;
    elements.accountDialogRole.textContent = isAdmin()
      ? "Administrator"
      : "Normaler Benutzer";
    applyAccessControl();
    elements.accountDialog.showModal();
  }

  function openUserManagementDialog() {
    if (!requireAdmin()) return;
    if (elements.accountDialog.open) elements.accountDialog.close();
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    elements.createUserForm.reset();
    renderUserManagement();
    elements.userManagementDialog.showModal();
  }

  // Das eigene Konto bleibt ausgenommen, damit sich niemand mitten in der
  // Sitzung selbst aussperrt. Der letzte Administrator bleibt bestehen, weil
  // ein Datenbestand ohne Administrator nicht mehr verwaltbar wäre.
  function userDeletionBlocker(user) {
    if (user.id === currentUser?.id) return "Das eigene Konto kann nicht gelöscht werden.";
    if (
      user.role === "admin" &&
      state.users.filter((item) => item.role === "admin").length <= 1
    ) {
      return "Der letzte Administrator kann nicht gelöscht werden.";
    }
    return "";
  }

  function isUsernameTaken(username, exceptId = "") {
    const normalized = username.toLocaleLowerCase("de-DE");
    return state.users.some(
      (item) =>
        item.id !== exceptId &&
        item.username.toLocaleLowerCase("de-DE") === normalized,
    );
  }

  function renderUserManagement() {
    elements.userManagementList.innerHTML = state.users
      .map((user) => {
        const isSelf = user.id === currentUser?.id;
        const deletionBlocker = userDeletionBlocker(user);
        return `
          <article class="user-management-row">
            <span class="user-management-avatar">${escapeHtml(
              user.username.slice(0, 2).toUpperCase(),
            )}</span>
            <label class="user-management-username">
              <span>Benutzername</span>
              <input
                type="text"
                value="${escapeHtml(user.username)}"
                maxlength="40"
                pattern="[A-Za-z0-9]{4,40}"
                autocomplete="off"
                spellcheck="false"
                data-user-username="${user.id}"
                aria-label="Benutzername für ${escapeHtml(user.username)}"
              />
              <small>${user.role === "admin" ? "Administrator" : "Normaler Benutzer"}${
                isSelf ? " · eigenes Konto" : ""
              }${
                user.mustChangePassword ? " · Passwortänderung erforderlich" : ""
              }</small>
            </label>
            <div class="user-management-actions">
              <button
                class="button button-secondary"
                type="button"
                data-save-user-username="${user.id}"
              >
                <svg><use href="#icon-check"></use></svg>
                Benutzername speichern
              </button>
              ${
                isSelf
                  ? ""
                  : `<button
                    class="button button-secondary"
                    type="button"
                    data-reset-user-password="${user.id}"
                  >Passwort zurücksetzen</button>`
              }
              ${
                deletionBlocker
                  ? `<span class="tag tag-muted" title="${escapeHtml(
                      deletionBlocker,
                    )}">Nicht löschbar</span>`
                  : `<button
                    class="button button-danger"
                    type="button"
                    data-delete-user="${user.id}"
                    aria-label="Konto ${escapeHtml(user.username)} löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                    Löschen
                  </button>`
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function handleCreateUserSubmit(event) {
    event.preventDefault();
    if (!requireAdmin()) return;

    const username = elements.newUserUsername.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      elements.newUserUsername.focus();
      return;
    }
    if (isUsernameTaken(username)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      elements.newUserUsername.focus();
      return;
    }

    const role = elements.newUserRole.value === "admin" ? "admin" : "user";
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const newUser = {
      id: `user-${createId()}`,
      username,
      role,
      ...credentials,
      mustChangePassword: true,
    };

    const committed = await commitStateMutation(() => {
      state.users = [...state.users, newUser];
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(newUser.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das neue Konto nicht hinterlegt werden.", error);
    }
    elements.createUserForm.reset();
    renderUserManagement();
    showTemporaryPassword(username, temporaryPassword);
    showToast(
      `Konto „${username}“ wurde als ${
        role === "admin" ? "Administrator" : "normaler Benutzer"
      } angelegt.`,
    );
  }

  function requestDeleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const blocker = userDeletionBlocker(user);
    if (blocker) {
      showToast(blocker, "error");
      return;
    }
    requestConfirmation({
      title: "Benutzerkonto löschen?",
      message: `Das Konto „${user.username}“ wird dauerhaft entfernt und kann sich danach nicht mehr anmelden. Eine noch offene Serversitzung dieses Kontos endet beim nächsten Serverkontakt. Der fachliche Datenbestand bleibt unverändert.`,
      acceptLabel: "Konto löschen",
      tone: "danger",
      callback: () => deleteUser(user.id),
    });
  }

  async function deleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user || userDeletionBlocker(user)) return;

    const committed = await commitStateMutation(() => {
      state.users = state.users.filter((item) => item.id !== user.id);
    });
    if (!committed) return;

    try {
      await removeAutomaticBackupUserKey(user.id);
    } catch (error) {
      console.warn("Die alte Sicherungsschlüssel-Hülle konnte nicht entfernt werden.", error);
    }
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    renderUserManagement();
    showToast(`Konto „${user.username}“ wurde gelöscht.`);
  }

  function showTemporaryPassword(username, password) {
    elements.temporaryPasswordUsername.textContent = username;
    elements.temporaryPasswordValue.value = password;
    elements.temporaryPasswordResult.hidden = false;
    elements.temporaryPasswordValue.focus();
    elements.temporaryPasswordValue.select();
  }

  async function saveUsername(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    const input = [
      ...elements.userManagementList.querySelectorAll(
        "[data-user-username]",
      ),
    ].find(
      (field) => field.dataset.userUsername === userId,
    );
    if (!user || !input) return;

    const username = input.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      input.focus();
      return;
    }
    if (isUsernameTaken(username, user.id)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      input.focus();
      return;
    }
    if (username === user.username) {
      showToast("Der Benutzername ist bereits aktuell.");
      return;
    }

    const previousUsername = user.username;
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id ? { ...item, username } : item,
      );
    });
    if (!committed) return;

    if (currentUser?.id === user.id) {
      currentUser = state.users.find((item) => item.id === user.id);
      renderAll();
    }
    renderUserManagement();
    showToast(
      `Benutzername „${previousUsername}“ wurde in „${username}“ geändert.`,
    );
  }

  // Das eigene Passwort wird über den Kontodialog geändert, nicht hier
  // zurückgesetzt – sonst wäre die eigene Sitzung sofort änderungspflichtig.
  function resettableUser(userId) {
    return state.users.find(
      (item) => item.id === userId && item.id !== currentUser?.id,
    );
  }

  function requestPasswordReset(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    requestConfirmation({
      title: "Passwort zurücksetzen?",
      message: `Für ${user.username} wird ein zufälliges temporäres Passwort erzeugt. Beim nächsten Login muss ein neues Passwort festgelegt werden.`,
      acceptLabel: "Passwort zurücksetzen",
      tone: "primary",
      callback: () => resetUserPassword(user.id),
    });
  }

  async function resetUserPassword(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id
          ? { ...item, ...credentials, mustChangePassword: true }
          : item,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(user.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das zurückgesetzte Passwort nicht hinterlegt werden.", error);
    }
    renderUserManagement();
    showTemporaryPassword(user.username, temporaryPassword);
    showToast(`Passwort für ${user.username} wurde zurückgesetzt.`);
  }

  function createTemporaryPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const required = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
    ].map((characters) => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return characters[value % characters.length];
    });
    const random = Array.from({ length: 9 }, () => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return alphabet[value % alphabet.length];
    });
    return [...required, ...random]
      .map((character) => ({ character, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
      .sort((a, b) => a.order - b.order)
      .map((item) => item.character)
      .join("");
  }

  function openCatalogManagementDialog() {
    elements.newProfession.value = "";
    elements.newQualification.value = "";
    renderCatalogManagement();
    elements.catalogManagementDialog.showModal();
  }

  function renderCatalogManagement() {
    elements.professionCatalogList.innerHTML = state.catalogs.professions
      .map(
        (profession, index) => `
          <div class="catalog-row" data-profession-index="${index}">
            <input type="text" maxlength="100" value="${escapeHtml(
              profession,
            )}" aria-label="Beruf ${escapeHtml(profession)} bearbeiten" />
            <button class="icon-button" type="button" data-catalog-action="save-profession"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-profession"
              aria-label="${escapeHtml(profession)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        `,
      )
      .join("");
    elements.qualificationCatalogList.innerHTML = state.catalogs.qualifications
      .map(
        (qualification) => {
          const systemQualification =
            LEADERSHIP_QUALIFICATION_IDS.includes(qualification.id);
          return `
          <div class="catalog-row" data-qualification-id="${qualification.id}">
            <input type="text" maxlength="100" value="${escapeHtml(
              qualification.label,
            )}" aria-label="Zusatzqualifikation ${escapeHtml(
              qualification.label,
            )} bearbeiten" ${systemQualification ? "readonly" : ""} />
            ${
              systemQualification
                ? '<span class="field-hint catalog-system-role">Systemrolle</span>'
                : `<button class="icon-button" type="button"
              data-catalog-action="save-qualification"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-qualification"
              aria-label="${escapeHtml(qualification.label)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>`
            }
          </div>
        `;
        },
      )
      .join("");
  }

  async function addProfession() {
    const profession = normalizeProfession(elements.newProfession.value);
    if (!profession) {
      showToast("Bitte eine Berufsbezeichnung eingeben.", "error");
      return;
    }
    if (catalogIncludesLabel(state.catalogs.professions, profession)) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.catalogs.professions.push(profession);
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
    });
    if (!committed) return;
    elements.newProfession.value = "";
    renderCatalogManagement();
    showToast("Beruf wurde hinzugefügt.");
  }

  async function addQualification() {
    const label = elements.newQualification.value.trim();
    if (!label) {
      showToast("Bitte eine Bezeichnung für die Zusatzqualifikation eingeben.", "error");
      return;
    }
    if (
      catalogIncludesLabel(
        state.catalogs.qualifications.map((qualification) => qualification.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }

    const qualification = { id: `qualification-${createId()}`, label };
    const committed = await commitStateMutation(() => {
      state.catalogs.qualifications.push(qualification);
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
      state.employees.forEach((employee) => {
        employee.qualifications[qualification.id] = false;
      });
    });
    if (!committed) return;
    elements.newQualification.value = "";
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde hinzugefügt.");
  }

  function handleProfessionCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-profession-index]");
    if (!button || !row) return;
    const index = Number(row.dataset.professionIndex);
    if (button.dataset.catalogAction === "save-profession") {
      saveProfession(index, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-profession") deleteProfession(index);
  }

  function handleQualificationCatalogAction(event) {
    const button = event.target.closest("[data-catalog-action]");
    const row = button?.closest("[data-qualification-id]");
    if (!button || !row) return;
    if (button.dataset.catalogAction === "save-qualification") {
      saveQualification(row.dataset.qualificationId, row.querySelector("input").value);
    }
    if (button.dataset.catalogAction === "delete-qualification") {
      deleteQualification(row.dataset.qualificationId);
    }
  }

  async function saveProfession(index, nextValue) {
    const previousValue = state.catalogs.professions[index];
    const profession = normalizeProfession(nextValue);
    if (!previousValue || !profession) {
      showToast("Die Berufsbezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      profession.toLocaleLowerCase("de-DE") !==
        previousValue.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(state.catalogs.professions, profession)
    ) {
      showToast("Dieser Beruf ist bereits im Katalog vorhanden.", "error");
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.catalogs.professions[index] = profession;
      state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
      state.employees.forEach((employee) => {
        if (employee.profession === previousValue) {
          employee.profession = profession;
          employee.updatedAt = now;
        }
      });
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Berufsbezeichnung wurde aktualisiert.");
  }

  function deleteProfession(index) {
    const profession = state.catalogs.professions[index];
    if (!profession) return;
    const assignmentCount = state.employees.filter(
      (employee) => employee.profession === profession,
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Der Beruf ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Beruf löschen?",
      message: `„${profession}“ wird aus dem Berufskatalog entfernt.`,
      acceptLabel: "Beruf löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.professions.splice(index, 1);
        }, { undo: "Beruf gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Beruf wurde gelöscht.");
      },
    });
  }

  async function saveQualification(id, nextValue) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    const label = String(nextValue || "").trim();
    if (
      LEADERSHIP_QUALIFICATION_IDS.includes(id) &&
      label !== DEFAULT_QUALIFICATIONS[id]
    ) {
      showToast(
        "Die Leitungsfunktionen sind feste Systemqualifikationen und können nicht umbenannt werden.",
        "error",
      );
      renderCatalogManagement();
      return;
    }
    if (!qualification || !label) {
      showToast("Die Bezeichnung darf nicht leer sein.", "error");
      return;
    }
    if (
      label.toLocaleLowerCase("de-DE") !==
        qualification.label.toLocaleLowerCase("de-DE") &&
      catalogIncludesLabel(
        state.catalogs.qualifications.map((item) => item.label),
        label,
      )
    ) {
      showToast("Diese Zusatzqualifikation ist bereits vorhanden.", "error");
      return;
    }
    const committed = await commitStateMutation(() => {
      qualification.label = label;
      state.catalogs.qualifications.sort((a, b) => a.label.localeCompare(b.label, "de"));
    });
    if (!committed) return;
    renderCatalogManagement();
    showToast("Zusatzqualifikation wurde aktualisiert.");
  }

  function deleteQualification(id) {
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    if (!qualification) return;
    if (LEADERSHIP_QUALIFICATION_IDS.includes(id)) {
      showToast(
        "Die Leitungsfunktionen werden für die Dienstwochenendzuweisung benötigt und können nicht gelöscht werden.",
        "error",
      );
      return;
    }
    const assignmentCount = state.employees.filter(
      (employee) => employee.qualifications[id],
    ).length;
    if (assignmentCount > 0) {
      showToast(
        `Die Zusatzqualifikation ist noch ${assignmentCount} Mitarbeiter${
          assignmentCount === 1 ? "" : "n"
        } zugeordnet und kann nicht gelöscht werden.`,
        "error",
      );
      return;
    }
    requestConfirmation({
      title: "Zusatzqualifikation löschen?",
      message: `„${qualification.label}“ wird aus dem Katalog entfernt.`,
      acceptLabel: "Qualifikation löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.catalogs.qualifications = state.catalogs.qualifications.filter(
            (item) => item.id !== id,
          );
          state.employees.forEach((employee) => {
            delete employee.qualifications[id];
            delete employee.qualificationExpiries[id];
          });
        }, { undo: "Zusatzqualifikation gelöscht" });
        if (!committed) return;
        renderCatalogManagement();
        showUndoToast("Zusatzqualifikation wurde gelöscht.");
      },
    });
  }

  function catalogIncludesLabel(values, candidate) {
    const normalizedCandidate = candidate.toLocaleLowerCase("de-DE");
    return values.some(
      (value) => value.toLocaleLowerCase("de-DE") === normalizedCandidate,
    );
  }

  function renderDashboardGreeting(now = new Date()) {
    const hour = now.getHours();
    const salutation =
      hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
    const firstName = getCurrentUserFirstName();
    elements.dashboardGreeting.textContent = firstName
      ? `${salutation}, ${firstName}!`
      : `${salutation}!`;
  }

  function getCurrentUserFirstName() {
    if (!currentUser?.username) return "";
    const usernameKey = currentUser.username.toLocaleLowerCase("de-DE");
    const linkedEmployee = state.employees.find(
      (employee) =>
        employee.username?.toLocaleLowerCase("de-DE") === usernameKey,
    );
    if (linkedEmployee?.firstName?.trim()) return linkedEmployee.firstName.trim();

    const employeeCode = usernameKey.replace(/\d+$/, "");
    const matchingEmployee = state.employees.find((employee) =>
      normalizeCompactLookupValue(employee.lastName).startsWith(employeeCode),
    );
    return (
      matchingEmployee?.firstName?.trim() ||
      USER_FIRST_NAME_FALLBACKS[usernameKey] ||
      currentUser.username
    );
  }

  function normalizeCompactLookupValue(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "");
  }

  function projectBuildNumber() {
    return [PROJECT_VERSION.major, PROJECT_VERSION.minor, PROJECT_VERSION.patch]
      .map((part) => String(part || 0))
      .join(".");
  }

  function renderProjectMetadata() {
    const buildNumber = projectBuildNumber();
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${buildNumber}`;
    elements.loginProjectVersion.textContent = `Version ${buildNumber}`;
  }

  function renderSidebarSystemStatus() {
    if (!elements.sidebarSystemStatus) return;
    const localMode = !isMariaDbMode();
    const status = localMode ? "local" : backendConnectionStatus;
    const rows = [...elements.sidebarSystemStatus.querySelectorAll("dl > div")];
    const terms = rows.map((row) => row.querySelector("dt"));
    const remoteTerms = ["Backend", "Server", "Revision", "DB-Schema"];
    terms.forEach((term, index) => {
      if (term) term.textContent = remoteTerms[index];
      if (rows[index]) rows[index].hidden = false;
    });
    elements.sidebarSystemStatus.classList.toggle("is-local", status === "local");
    elements.sidebarSystemStatus.classList.toggle(
      "is-connected",
      status === "connected",
    );
    elements.sidebarSystemStatus.classList.toggle("is-error", status === "error");

    if (localMode) {
      elements.sidebarConnectionLabel.textContent = "Lokal bereit";
      if (terms[0]) terms[0].textContent = "Speicherort";
      if (terms[1]) terms[1].textContent = "Zuletzt gespeichert";
      rows.slice(2).forEach((row) => {
        row.hidden = true;
      });
      elements.sidebarBackendLabel.textContent = "Dieses Browserprofil";
      elements.sidebarServerLabel.textContent = localLastSaveAt
        ? formatSidebarStatusDateTime(localLastSaveAt)
        : "Noch nicht erfasst";
      elements.sidebarSyncLabel.textContent =
        "Automatische lokale Speicherung aktiv";
      elements.sidebarServerLabel.title = "";
      elements.sidebarSyncLabel.title = "";
      updateSidebarFooterSummaries();
      return;
    }

    const statusLabels = {
      checking: "Verbindung wird geprüft",
      connected: "MariaDB verbunden",
      warning: "Backend prüfen",
      error: "Server nicht erreichbar",
    };
    elements.sidebarConnectionLabel.textContent =
      statusLabels[status] || "MariaDB konfiguriert";
    elements.sidebarBackendLabel.textContent =
      backendHealth?.storageModel === "relational"
        ? "MariaDB · relational"
        : "MariaDB";
    const serverLabel = backendServerLabel();
    elements.sidebarServerLabel.textContent = serverLabel;
    elements.sidebarServerLabel.title = backendConfig.apiUrl || serverLabel;
    elements.sidebarRevisionLabel.textContent =
      remoteRevision || backendHealth?.revision
        ? String(remoteRevision || backendHealth.revision)
        : "–";
    elements.sidebarSchemaLabel.textContent =
      backendHealth?.databaseSchemaVersion == null
        ? "–"
        : String(backendHealth.databaseSchemaVersion);

    let detail = "Noch kein Serverkontakt";
    if (status === "checking") detail = "Serverstatus wird abgerufen …";
    else if (status === "error") {
      detail = backendConnectionError || "Verbindung fehlgeschlagen";
    } else if (backendLastSyncAt) {
      detail = `Letzter Abgleich ${formatSidebarStatusTime(backendLastSyncAt)}`;
    } else if (backendLastContactAt) {
      detail = `Server geprüft ${formatSidebarStatusTime(backendLastContactAt)}`;
    }
    elements.sidebarSyncLabel.textContent = detail;
    elements.sidebarSyncLabel.title = detail;
    // Eingeklappt bleibt vom Block nur der Punkt - der Kurzhinweis muss den
    // neuen Stand mittragen, auch wenn sonst nichts neu aufgebaut wurde.
    updateSidebarFooterSummaries();
  }

  function backendServerLabel() {
    try {
      return new URL(backendConfig.apiUrl).host;
    } catch {
      return backendConfig.apiUrl || "nicht konfiguriert";
    }
  }

  function formatSidebarStatusTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatSidebarStatusDateTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function markBackendConnected({ health = null, synchronized = false } = {}) {
    if (health) backendHealth = health;
    backendConnectionStatus =
      backendHealth &&
      (backendHealth.storageModel !== "relational" ||
        !Number.isSafeInteger(Number(backendHealth.databaseSchemaVersion)))
        ? "warning"
        : "connected";
    backendConnectionError = "";
    backendLastContactAt = new Date().toISOString();
    if (synchronized) backendLastSyncAt = backendLastContactAt;
    renderSidebarSystemStatus();
  }

  function markBackendConnectionError(error) {
    backendConnectionStatus = "error";
    backendConnectionError =
      error?.message || "Der TeO-Server ist nicht erreichbar.";
    renderSidebarSystemStatus();
  }

  async function refreshBackendHealth() {
    if (!isMariaDbMode()) {
      backendConnectionStatus = "local";
      renderSidebarSystemStatus();
      return;
    }
    backendConnectionStatus = "checking";
    renderSidebarSystemStatus();
    try {
      const health = await window.TeOBackend.health(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      markBackendConnected({ health });
    } catch (error) {
      markBackendConnectionError(error);
    }
  }

  // Mehrfachauswahl für Karten - Termine, Memos und Geräte.
  //
  // Gewählt wird wie in einer Dateiliste: Strg klickt einzelne Karten hinzu,
  // Umschalt einen Bereich bis zur zuletzt angeklickten. Ein gewöhnlicher
  // Klick bleibt der Schnellansicht vorbehalten und hebt eine bestehende
  // Auswahl auf. Die Sammelaktionen sind zurücknehmbar wie jede andere
  // Änderung auch.
  const selectedRecords = { appointment: new Set(), memo: new Set(), device: new Set() };
  const recordSelectionAnchors = {};

  function recordSelectionDefinitions() {
    return {
      appointment: {
        bar: "#appointmentBulkBar",
        count: "#appointmentBulkCount",
        actions: "#appointmentBulkActions",
        singular: "Termin",
        plural: "Termine",
        // Die Reihenfolge der Karten in der Ansicht bestimmt, was „dazwischen“
        // heißt - nicht die Reihenfolge im Datenbestand.
        visibleIds: () =>
          [...document.querySelectorAll("#appointmentWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          {
            label: "Anpinnen",
            icon: "icon-star",
            run: () => setAppointmentsPinned(ids, true),
          },
          {
            label: "Nicht mehr anpinnen",
            icon: "icon-star",
            run: () => setAppointmentsPinned(ids, false),
          },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteAppointments(ids) },
        ],
      },
      memo: {
        bar: "#memoBulkBar",
        count: "#memoBulkCount",
        actions: "#memoBulkActions",
        singular: "Eintrag",
        plural: "Einträge",
        visibleIds: () =>
          [...document.querySelectorAll("#memoWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          { label: "Erledigt", icon: "icon-check", run: () => setMemosCompleted(ids, true) },
          { label: "Wieder öffnen", icon: "icon-memo", run: () => setMemosCompleted(ids, false) },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteMemos(ids) },
        ],
      },
      device: {
        bar: "#deviceBulkBar",
        count: "#deviceBulkCount",
        actions: "#deviceBulkActions",
        singular: "Gerät",
        plural: "Geräte",
        visibleIds: () =>
          [...document.querySelectorAll("#deviceWorkspace [data-record-card]")].map(
            (card) => card.dataset.recordCard,
          ),
        bulkActions: (ids) => [
          {
            label: "Im Bestand",
            icon: "icon-check",
            run: () => setDevicesInventory(ids, true),
          },
          {
            label: "Nicht mehr im Bestand",
            icon: "icon-empty",
            run: () => setDevicesInventory(ids, false),
          },
          { label: "Löschen", icon: "icon-trash", danger: true, run: () => deleteDevices(ids) },
        ],
      },
    };
  }

  function bindRecordSelection() {
    for (const [type, definition] of Object.entries(recordSelectionDefinitions())) {
      document
        .querySelector(definition.bar)
        ?.addEventListener("click", (event) => handleRecordBulkAction(type, event));
    }
  }

  // Wird aus der Kartenbehandlung der Schnellansicht heraus gefragt: Gehört
  // dieser Klick zur Auswahl statt zur Ansicht?
  function handleRecordSelectionClick(type, event, id) {
    if (!selectedRecords[type]) return false;

    if (event.shiftKey) {
      selectRecordRange(type, id);
      return true;
    }
    if (event.ctrlKey || event.metaKey) {
      toggleRecordSelection(type, id);
      recordSelectionAnchors[type] = id;
      return true;
    }
    // Ein gewöhnlicher Klick räumt eine bestehende Auswahl ab und führt sonst
    // wie bisher in die Schnellansicht.
    if (selectedRecords[type].size) {
      clearRecordSelection(type);
    }
    recordSelectionAnchors[type] = id;
    return false;
  }

  function toggleRecordSelection(type, id) {
    if (selectedRecords[type].has(id)) selectedRecords[type].delete(id);
    else selectedRecords[type].add(id);
    renderRecordSelection(type);
  }

  function selectRecordRange(type, id) {
    const visible = recordSelectionDefinitions()[type].visibleIds();
    const anchor = recordSelectionAnchors[type];
    const from = visible.indexOf(anchor);
    const to = visible.indexOf(id);
    if (from < 0 || to < 0) {
      selectedRecords[type].add(id);
      recordSelectionAnchors[type] = id;
    } else {
      visible
        .slice(Math.min(from, to), Math.max(from, to) + 1)
        .forEach((entry) => selectedRecords[type].add(entry));
    }
    renderRecordSelection(type);
  }

  function clearRecordSelection(type) {
    selectedRecords[type].clear();
    renderRecordSelection(type);
  }

  // Zugriff von aussen - etwa aus dem Kontextmenue - laeuft ueber diese
  // Abfrage statt ueber die Sammlung selbst.
  function selectedRecordIds(type) {
    return [...(selectedRecords[type] || [])];
  }

  function hasRecordSelection() {
    return Object.values(selectedRecords).some((selection) => selection.size > 0);
  }

  function clearAllRecordSelections() {
    Object.keys(selectedRecords).forEach(clearRecordSelection);
  }

  // Nach jedem Neuaufbau der Liste: Was nicht mehr in ihr steht, fällt aus der
  // Auswahl - gelöscht oder weggefiltert. Eine Sammelaktion trifft damit immer
  // genau das, was auch zu sehen ist. Nur hier wird abgeräumt: Beim Auswählen
  // selbst steht die Liste ja unverändert.
  function refreshRecordSelection(type) {
    const visible = new Set(recordSelectionDefinitions()[type].visibleIds());
    [...selectedRecords[type]].forEach((id) => {
      if (!visible.has(id)) selectedRecords[type].delete(id);
    });
    renderRecordSelection(type);
  }

  function renderRecordSelection(type) {
    const definition = recordSelectionDefinitions()[type];
    const bar = document.querySelector(definition.bar);
    const visible = new Set(definition.visibleIds());

    visible.forEach((id) => {
      document
        .querySelectorAll(`[data-record-card="${CSS.escape(id)}"]`)
        .forEach((card) => card.classList.toggle("is-selected", selectedRecords[type].has(id)));
    });

    if (!bar) return;
    const count = selectedRecords[type].size;
    bar.hidden = count === 0;
    document.querySelector(definition.count).textContent = `${count} ${
      count === 1 ? definition.singular : definition.plural
    } ausgewählt`;
    document.querySelector(definition.actions).innerHTML = definition
      .bulkActions([...selectedRecords[type]])
      .map(
        (action, index) => `
          <button
            class="button ${action.danger ? "button-danger" : "button-secondary"} button-compact"
            type="button"
            data-record-bulk="${index}"
          >
            ${action.icon ? `<svg><use href="#${action.icon}"></use></svg>` : ""}${escapeHtml(action.label)}
          </button>
        `,
      )
      .join("");
  }

  function handleRecordBulkAction(type, event) {
    if (event.target.closest("[data-clear-record-selection]")) {
      clearRecordSelection(type);
      return;
    }
    const button = event.target.closest("[data-record-bulk]");
    if (!button) return;
    const ids = [...selectedRecords[type]];
    if (!ids.length) return;
    recordSelectionDefinitions()[type].bulkActions(ids)[Number(button.dataset.recordBulk)]?.run();
  }

  // Die Sammelaktionen selbst. Jede ist eine einzige Änderung - damit steht
  // auch nur ein Schritt im Protokoll und einer zum Zurücknehmen.
  async function setAppointmentsPinned(ids, pinned) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.appointments.forEach((appointment) => {
          if (!ids.includes(appointment.id)) return;
          appointment.pinned = pinned;
          appointment.updatedAt = now;
        });
      },
      { undo: `${ids.length} Termine geändert` },
    );
    if (committed) {
      showUndoToast(`${ids.length} Termine ${pinned ? "angepinnt" : "gelöst"}.`);
    }
  }

  function deleteAppointments(ids) {
    requestConfirmation({
      title: `${ids.length} Termine löschen?`,
      message: `Die ausgewählten Termine werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.`,
      acceptLabel: "Termine löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.appointments = state.appointments.filter(
              (appointment) => !ids.includes(appointment.id),
            );
          },
          { undo: `${ids.length} Termine gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("appointment");
        showUndoToast(`${ids.length} Termine wurden gelöscht.`);
      },
    });
  }

  async function setMemosCompleted(ids, completed) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.memos.forEach((memo) => {
          if (!ids.includes(memo.id) || !memoVisibleToCurrentUser(memo)) return;
          memo.completed = completed;
          memo.updatedAt = now;
        });
      },
      { undo: `${ids.length} Einträge geändert` },
    );
    if (committed) {
      showUndoToast(`${ids.length} Einträge ${completed ? "erledigt" : "wieder geöffnet"}.`);
    }
  }

  function deleteMemos(ids) {
    requestConfirmation({
      title: `${ids.length} Einträge löschen?`,
      message:
        "Die ausgewählten Memos und ToDos werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Einträge löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.memos = state.memos.filter(
              (memo) => !ids.includes(memo.id) || !memoVisibleToCurrentUser(memo),
            );
          },
          { undo: `${ids.length} Einträge gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("memo");
        showUndoToast(`${ids.length} Einträge wurden gelöscht.`);
      },
    });
  }

  async function setDevicesInventory(ids, currentInventory) {
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        state.devices.forEach((device) => {
          if (!ids.includes(device.id)) return;
          device.currentInventory = currentInventory;
          device.updatedAt = now;
        });
      },
      { undo: `${ids.length} Geräte geändert` },
    );
    if (committed) {
      showUndoToast(
        `${ids.length} Geräte ${currentInventory ? "als aktuell" : "als nicht mehr im Bestand"} vermerkt.`,
      );
    }
  }

  function deleteDevices(ids) {
    const instructionCount = state.deviceInstructions.filter((instruction) =>
      ids.includes(instruction.deviceId),
    ).length;
    requestConfirmation({
      title: `${ids.length} Geräte löschen?`,
      message: instructionCount
        ? `Mit den Geräten werden ${instructionCount} Einweisungsnachweise entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.`
        : "Die ausgewählten Geräte werden entfernt. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Geräte löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            state.devices = state.devices.filter((device) => !ids.includes(device.id));
            state.deviceInstructions = state.deviceInstructions.filter(
              (instruction) => !ids.includes(instruction.deviceId),
            );
          },
          { undo: `${ids.length} Geräte gelöscht` },
        );
        if (!committed) return;
        clearRecordSelection("device");
        showUndoToast(`${ids.length} Geräte wurden gelöscht.`);
      },
    });
  }

  // Mehrere Mitarbeiter auf einmal loeschen. Der Umfang entspricht dem
  // einzelnen Loeschen: Nachweise, Sitzungsstatus, Urlaubseintraege und
  // Einweisungen der Betroffenen gehen mit.
  function deleteEmployees(ids) {
    const verantwortliche = ids
      .map(getEmployee)
      .filter((employee) => employee && serviceWeekendOwnerKey(employee.id));
    if (verantwortliche.length) {
      showToast(
        `${verantwortliche
          .map(fullName)
          .join(", ")} ist für ein Dienstwochenende verantwortlich. Bitte zuerst die verantwortliche Person in den Einstellungen ändern.`,
        "error",
      );
      return;
    }

    requestConfirmation({
      title: `${ids.length} Mitarbeiter löschen?`,
      message:
        "Mit den Personen werden ihre Fortbildungsnachweise, Sitzungsstatus, Planungseinträge und Einweisungen gelöscht. Der Schritt lässt sich unmittelbar danach zurücknehmen.",
      acceptLabel: "Mitarbeiter löschen",
      tone: "danger",
      callback: async () => {
        const committed = await commitStateMutation(
          () => {
            const betroffen = new Set(ids);
            state.employees = state.employees.filter((employee) => !betroffen.has(employee.id));
            state.completions = state.completions.filter(
              (completion) => !betroffen.has(completion.employeeId),
            );
            state.meetingAttendances = state.meetingAttendances.filter(
              (attendance) => !betroffen.has(attendance.employeeId),
            );
            state.vacationEntitlements = state.vacationEntitlements.filter(
              (entitlement) => !betroffen.has(entitlement.employeeId),
            );
            state.vacationDays = state.vacationDays.filter(
              (vacationDay) => !betroffen.has(vacationDay.employeeId),
            );
            state.deviceInstructions = state.deviceInstructions
              .map((instruction) => ({
                ...instruction,
                instructorEmployeeId: betroffen.has(instruction.instructorEmployeeId)
                  ? ""
                  : instruction.instructorEmployeeId,
                participants: instruction.participants.filter(
                  (participant) => !betroffen.has(participant.employeeId),
                ),
              }))
              .filter((instruction) => instruction.participants.length);
            state.meetings.forEach((meeting) => {
              meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter(
                (employeeId) => !betroffen.has(employeeId),
              );
            });
          },
          { undo: `${ids.length} Mitarbeiter gelöscht` },
        );
        if (!committed) return;
        clearEmployeeSelection();
        showUndoToast(`${ids.length} Mitarbeiter wurden gelöscht.`);
      },
    });
  }

  // Schnellansicht für Termine, Memos und Geräte - dieselbe Bauform wie die
  // Mitarbeiter-Schnellansicht des Arbeitsplatzes: Ein Klick auf die Karte
  // öffnet rechts eine Übersicht mit den Eckdaten und den drei häufigsten
  // Aktionen, ohne dass ein Dialog die Liste verdeckt.
  //
  // Beschrieben wird je Datenart nur, was sie ausmacht; Aufbau, Auswahl,
  // Hervorhebung und Verlauf sind für alle gleich.
  const inspectedRecords = {};

  function recordInspectorDefinitions() {
    return {
      appointment: {
        view: "appointments",
        inspector: "#appointmentInspector",
        content: "#appointmentInspectorContent",
        container: "#appointmentWorkspace",
        icon: "icon-calendar",
        eyebrow: "Termin",
        find: (id) => state.appointments.find((entry) => entry.id === id),
        title: (appointment) => appointment.title,
        subtitle: (appointment) =>
          [formatDate(appointment.date), formatAppointmentTime(appointment)]
            .filter(Boolean)
            .join(" · "),
        facts: (appointment) => [
          ["Datum", formatDate(appointment.date)],
          ["Uhrzeit", formatAppointmentTime(appointment) || "Ganztägig"],
          ["Ort", appointment.location || "–"],
          ["Kategorie", appointmentCategoryLabel(appointment) || "Ohne Kategorie"],
          ["Wichtig", appointment.pinned ? "Angepinnt" : "Nein"],
          ["Teilnehmerliste", appointment.participantList ? "Ja" : "Nein"],
        ],
        sections: (appointment) => [
          { title: "Beschreibung", text: appointment.description || "Keine Beschreibung hinterlegt." },
        ],
        actions: (appointment) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openAppointmentDialog(appointment.id) },
          {
            label: "Kalender",
            icon: "icon-calendar",
            primary: true,
            run: () => showAppointmentInCalendar(appointment),
          },
        ],
      },
      memo: {
        view: "memos",
        inspector: "#memoInspector",
        content: "#memoInspectorContent",
        container: "#memoWorkspace",
        icon: "icon-memo",
        eyebrow: "Memo / ToDo",
        find: (id) => {
          const memo = getMemo(id);
          return memoVisibleToCurrentUser(memo) ? memo : null;
        },
        title: (memo) => memo.title,
        subtitle: (memo) => [memo.category || "Ohne Kategorie", formatDate(memo.date)].join(" · "),
        facts: (memo) => [
          ["Datum", formatDate(memo.date)],
          ["Kategorie", memo.category || "Ohne Kategorie"],
          ["Sichtbarkeit", memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle"],
          ["Status", memo.completed ? "Erledigt" : "Offen"],
          ["Wichtig", memo.pinned ? "Angepinnt" : "Nein"],
        ],
        sections: (memo) => [
          { title: "Beschreibung", text: memo.description || "Keine Beschreibung hinterlegt." },
        ],
        actions: (memo) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openMemoDialog(memo.id) },
          {
            label: memo.completed ? "Wieder öffnen" : "Erledigt",
            icon: "icon-check",
            primary: true,
            run: () => void toggleMemoCompleted(memo.id),
          },
        ],
      },
      device: {
        view: "device-management",
        inspector: "#deviceInspector",
        content: "#deviceInspectorContent",
        container: "#deviceWorkspace",
        icon: "icon-device",
        eyebrow: "Gerät",
        find: (id) => getDevice(id),
        title: (device) => deviceLabel(device),
        subtitle: (device) => device.category || "Ohne Kategorie",
        facts: (device) => [
          ["Hersteller", device.manufacturer],
          ["Produkt", device.productName],
          ["Kategorie", device.category || "–"],
          ["Anlage 1", device.annex1 ? "Ja" : "Nein"],
          ["Bestand", device.currentInventory ? "Aktuell" : "Nicht mehr im Bestand"],
          [
            "Eingewiesen",
            `${getDeviceInstructionPercentage(device.id, activeEmployeeList())} %`,
          ],
        ],
        sections: (device) => {
          const authorized = getDeviceAuthorizedEmployees(device.id);
          return [
            {
              title: "Einweisungsberechtigt",
              tags: authorized.length ? authorized.map(fullName) : ["Niemand hinterlegt"],
            },
          ];
        },
        actions: (device) => [
          { label: "Bearbeiten", icon: "icon-edit", run: () => openDeviceDialog(device.id) },
          {
            label: "Übersicht",
            icon: "icon-eye",
            primary: true,
            run: () => openDeviceOverview(device.id),
          },
        ],
      },
    };
  }

  function bindRecordInspectors() {
    for (const [type, definition] of Object.entries(recordInspectorDefinitions())) {
      const container = document.querySelector(definition.container);
      container?.addEventListener("click", (event) => handleRecordCardActivation(type, event));
      container?.addEventListener("keydown", (event) => handleRecordCardActivation(type, event));
      document
        .querySelector(definition.inspector)
        ?.addEventListener("click", (event) => handleRecordInspectorAction(type, event));
    }
  }

  // Die Karte selbst öffnet die Schnellansicht; ihre Schaltflächen behalten
  // ihre Aufgabe. Mit der Tastatur gilt dasselbe über Eingabe und Leertaste.
  function handleRecordCardActivation(type, event) {
    const card = event.target.closest("[data-record-card]");
    if (!card) return;
    // Schaltflächen innerhalb der Karte behalten ihre Aufgabe. Ist die Karte
    // selbst eine Schaltfläche - so wie ein Eintrag im Monatsraster -, zählt
    // sie natürlich weiter als Karte.
    const control = event.target.closest("button, input, a, select, textarea");
    if (control && control !== card) return;
    if (event.type === "keydown") {
      // Eine Schaltfläche löst bei Eingabe und Leertaste selbst einen Klick
      // aus; ein zweiter Weg wäre einer zu viel.
      if (card.tagName === "BUTTON" || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
    }
    // Mit Strg oder Umschalt geht es um die Mehrfachauswahl, nicht um die
    // Schnellansicht.
    if (handleRecordSelectionClick(type, event, card.dataset.recordCard)) return;
    selectRecordInspector(type, card.dataset.recordCard);
  }

  function selectRecordInspector(type, id) {
    const definition = recordInspectorDefinitions()[type];
    if (!definition?.find(id)) return;
    inspectedRecords[type] = id;
    trackWorkspaceRecord(type, id);
    renderRecordInspector(type);
    highlightInspectedRecord(type);
  }

  function closeRecordInspector(type) {
    inspectedRecords[type] = "";
    renderRecordInspector(type);
    highlightInspectedRecord(type);
  }

  // Nach jedem Neuaufbau der Liste: Die Karten sind neu, die Hervorhebung muss
  // wieder gesetzt werden. Ist der Datensatz verschwunden - gelöscht oder
  // weggefiltert -, schließt sich die Schnellansicht.
  function refreshRecordInspector(type) {
    const definition = recordInspectorDefinitions()[type];
    if (!definition) return;
    if (inspectedRecords[type] && !definition.find(inspectedRecords[type])) {
      inspectedRecords[type] = "";
    }
    renderRecordInspector(type);
    highlightInspectedRecord(type);
    refreshRecordSelection(type);
  }

  function highlightInspectedRecord(type) {
    const definition = recordInspectorDefinitions()[type];
    document.querySelectorAll(`${definition.container} [data-record-card]`).forEach((card) => {
      card.classList.toggle("is-inspected", card.dataset.recordCard === inspectedRecords[type]);
    });
  }

  function renderRecordInspector(type) {
    const definition = recordInspectorDefinitions()[type];
    const inspector = document.querySelector(definition.inspector);
    const content = document.querySelector(definition.content);
    const record = inspectedRecords[type] ? definition.find(inspectedRecords[type]) : null;
    if (!inspector || !content) return;
    if (!record) {
      inspector.hidden = true;
      content.innerHTML = "";
      return;
    }

    const favorite = workspaceRecordIsFavorite(type, record.id);
    inspector.hidden = false;
    content.innerHTML = `
      <div class="record-inspector-header">
        <span class="record-inspector-icon"><svg><use href="#${definition.icon}"></use></svg></span>
        <div>
          <p class="eyebrow">${escapeHtml(definition.eyebrow)}</p>
          <h2>${escapeHtml(definition.title(record))}</h2>
          <small>${escapeHtml(definition.subtitle(record))}</small>
        </div>
        <button class="icon-button" type="button" data-inspector-close aria-label="Schnellansicht schließen">
          <svg><use href="#icon-close"></use></svg>
        </button>
      </div>
      <div class="record-inspector-actions">
        <button
          class="button button-secondary"
          type="button"
          data-inspector-favorite
          aria-pressed="${favorite}"
        >
          <svg><use href="#icon-star"></use></svg>${favorite ? "Angeheftet" : "Anheften"}
        </button>
        ${definition
          .actions(record)
          .map(
            (action, index) => `
              <button
                class="button ${action.primary ? "button-primary" : "button-secondary"}"
                type="button"
                data-inspector-action="${index}"
              >
                ${action.icon ? `<svg><use href="#${action.icon}"></use></svg>` : ""}${escapeHtml(action.label)}
              </button>
            `,
          )
          .join("")}
      </div>
      <dl class="record-inspector-facts">
        ${definition
          .facts(record)
          .map(
            ([label, value]) =>
              `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`,
          )
          .join("")}
      </dl>
      ${definition
        .sections(record)
        .map(
          (section) => `
            <section class="record-inspector-section">
              <h3>${escapeHtml(section.title)}</h3>
              ${
                section.tags
                  ? `<div class="qualification-tags">${section.tags
                      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                      .join("")}</div>`
                  : `<p class="record-inspector-text">${escapeHtml(section.text)}</p>`
              }
            </section>
          `,
        )
        .join("")}
    `;
  }

  function handleRecordInspectorAction(type, event) {
    const definition = recordInspectorDefinitions()[type];
    const record = inspectedRecords[type] ? definition.find(inspectedRecords[type]) : null;
    if (!record) return;

    if (event.target.closest("[data-inspector-close]")) {
      closeRecordInspector(type);
      return;
    }
    if (event.target.closest("[data-inspector-favorite]")) {
      toggleWorkspaceFavorite(type, record.id);
      renderRecordInspector(type);
      return;
    }
    const action = event.target.closest("[data-inspector-action]");
    if (action) definition.actions(record)[Number(action.dataset.inspectorAction)]?.run();
  }

  // „Im Kalender“ wechselt in die Monatsansicht und blättert zum Monat des
  // Termins - sonst zeigte der Kalender weiter irgendeinen anderen.
  function showAppointmentInCalendar(appointment) {
    const date = parseLocalDate(appointment.date);
    if (!date) return;
    setAppointmentViewMode("calendar");
    setAppointmentCalendarMonth(date.getFullYear(), date.getMonth() + 1);
  }

  // „Was ist neu“ nach einer neuen Fassung.
  //
  // Das Änderungsverzeichnis steckt ohnehin in der Hilfe; dieser Hinweis holt
  // den Abschnitt der laufenden Fassung einmalig nach vorn. Die zuletzt
  // gesehene Fassung liegt im Browserprofil: Sie beschreibt diesen
  // Arbeitsplatz, nicht den Datenbestand - an einem zweiten Rechner soll der
  // Hinweis erneut erscheinen.
  const LAST_SEEN_VERSION_KEY = "teo-last-seen-version-v1";

  function bindWhatsNew() {
    elements.whatsNewHelpButton?.addEventListener("click", () => {
      elements.whatsNewDialog.close();
      showView("help");
      document
        .querySelector("#hilfe-anderungshistorie")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function readLastSeenVersion() {
    try {
      return localStorage.getItem(LAST_SEEN_VERSION_KEY) || "";
    } catch (error) {
      console.warn("Die zuletzt gesehene Fassung ist unlesbar.", error);
      return "";
    }
  }

  function rememberSeenVersion(version) {
    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
    } catch (error) {
      console.warn("Die gesehene Fassung konnte nicht gemerkt werden.", error);
    }
  }

  // Beim ersten Start überhaupt wird nur gemerkt: Wer TeO gerade einrichtet,
  // braucht keine Liste der Änderungen gegenüber einer Fassung, die er nie
  // benutzt hat.
  function showWhatsNewIfUpdated() {
    const version = projectBuildNumber();
    const lastSeen = readLastSeenVersion();
    if (lastSeen === version) return false;

    rememberSeenVersion(version);
    if (!lastSeen) return false;
    return openWhatsNewDialog(version, lastSeen);
  }

  function openWhatsNewDialog(version, lastSeen = "") {
    const section = changelogSectionMarkup(version);
    if (!section || !elements.whatsNewDialog) return false;

    elements.whatsNewVersion.textContent = section.title;
    elements.whatsNewEntries.innerHTML = section.entries;
    elements.whatsNewSubtitle.textContent = lastSeen
      ? `Zuletzt benutzt: Fassung ${lastSeen}. Das hat sich seitdem geändert:`
      : "Das ist in dieser Fassung neu:";
    elements.whatsNewDialog.showModal();
    return true;
  }

  // Der Abschnitt steht schon im Markup der Hilfe - als Überschrift der
  // Fassung und der Aufzählung dahinter. Er wird von dort übernommen, damit es
  // nicht zwei Fassungen desselben Textes gibt.
  function changelogSectionMarkup(version) {
    // Der Hinweis erscheint vor dem ersten Besuch der Hilfe. Gelesen wird
    // deshalb dort, wo das Handbuch gerade liegt - beim Start in seiner
    // Vorlage, die dafuer nicht ins Dokument muss.
    const headings = [...helpContentRoot().querySelectorAll(".help-section h3")];
    const heading = headings.find((item) => item.textContent.trim().startsWith(version));
    const list = heading?.nextElementSibling;
    if (!heading || list?.tagName !== "UL") return null;
    return { title: heading.textContent.trim(), entries: list.innerHTML };
  }

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
      <div class="record-inspector-header">
        ${renderAvatar(employee)}
        <div><p class="eyebrow">Schnellansicht</p><h2>${escapeHtml(fullName(employee))}</h2><small>${escapeHtml(employee.profession || "Beruf nicht angegeben")}</small></div>
        <button class="icon-button" type="button" data-inspector-close aria-label="Schnellansicht schließen"><svg><use href="#icon-close"></use></svg></button>
      </div>
      <div class="record-inspector-actions">
        <button class="button button-secondary" type="button" data-inspector-favorite="${employee.id}" aria-pressed="${favorite}"><svg><use href="#icon-star"></use></svg>${favorite ? "Angeheftet" : "Anheften"}</button>
        <button class="button button-secondary" type="button" data-inspector-edit="${employee.id}"><svg><use href="#icon-edit"></use></svg>Bearbeiten</button>
        <button class="button button-primary" type="button" data-inspector-dossier="${employee.id}">Gesamtakte</button>
      </div>
      <dl class="record-inspector-facts">
        <div><dt>Status</dt><dd>${escapeHtml(employeeStatusLabel(employee))}</dd></div>
        <div><dt>Stellenumfang</dt><dd>${employee.employmentPercent}&thinsp;%</dd></div>
        <div><dt>Dienstwochenende</dt><dd>${escapeHtml(serviceWeekendLabel(employee.serviceWeekend))}</dd></div>
        <div><dt>Fortbildungen</dt><dd>${training.current}/${training.total} aktuell</dd></div>
        <div><dt>Telefon</dt><dd>${escapeHtml(employee.phone || "–")}</dd></div>
        <div><dt>E-Mail</dt><dd>${escapeHtml(employee.email || "–")}</dd></div>
      </dl>
      <section class="record-inspector-section"><h3>Qualifikationen</h3><div class="qualification-tags">${qualifications.length ? qualifications.map((item) => `<span class="tag">${escapeHtml(item.label)}</span>`).join("") : '<span class="tag tag-muted">Keine</span>'}</div></section>
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
      return appointment && { group: "Termine", icon: "icon-calendar", label: appointment.title, hint: formatDate(appointment.date), run: () => { showView("appointments"); selectRecordInspector("appointment", appointment.id); } };
    }
    if (item.type === "memo") {
      const memo = state.memos.find((entry) => entry.id === item.id);
      return memo && memoVisibleToCurrentUser(memo) && { group: "Memo / ToDo", icon: "icon-memo", label: memo.title, hint: formatDate(memo.date), run: () => { showView("memos"); selectRecordInspector("memo", memo.id); } };
    }
    // Geraete kamen mit der Schnellansicht dazu und gehoeren seitdem ebenso in
    // Verlauf und Favoriten.
    if (item.type === "device") {
      const device = getDevice(item.id);
      return device && { group: "Geräte", icon: "icon-device", label: deviceLabel(device), hint: device.category || "", run: () => { showView("device-management"); selectRecordInspector("device", device.id); } };
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
      const rows = [...status.querySelectorAll("dl > div")]
        .filter((row) => !row.hidden)
        .map((row) =>
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

  // Tabellenkomfort: Zeilendichte, Spaltenwahl und Mehrfachauswahl.
  //
  // Alle drei sind persönliche Arbeitsweisen und liegen deshalb im
  // Browserprofil, nicht im geteilten Datenbestand.
  const TABLE_DENSITY_KEY = "teo-table-density-v1";
  const EMPLOYEE_COLUMN_KEY = "teo-employee-columns-v1";
  const EMPLOYEE_COLUMN_ORDER_KEY = "teo-employee-column-order-v1";
  const EMPLOYEE_PINNED_COLUMN_KEY = "teo-employee-pinned-column-v1";
  const EMPLOYEE_COLUMN_WIDTHS_KEY = "teo-employee-column-widths-v1";

  // Name, Auswahl und Aktionen stehen immer; diese fünf sind wählbar.
  const EMPLOYEE_COLUMNS = Object.freeze([
    { key: "profession", label: "Beruf" },
    { key: "employment", label: "Umfang" },
    { key: "qualifications", label: "Qualifikationen" },
    { key: "trainings", label: "Fortbildungen" },
    { key: "status", label: "Status" },
  ]);

  let hiddenEmployeeColumns = new Set();
  let employeeColumnOrder = EMPLOYEE_COLUMNS.map((column) => column.key);
  let pinnedEmployeeColumn = "";
  let employeeColumnWidths = {};
  // Die zuletzt angeklickte Zeile - Ausgangspunkt für die Auswahl mit
  // Umschalttaste.
  let lastEmployeeSelectionIndex = -1;
  let employeeSelectionShiftPressed = false;

  function visibleEmployeeColumns() {
    return employeeColumnOrder
      .map((key) => EMPLOYEE_COLUMNS.find((column) => column.key === key))
      .filter((column) => column && !hiddenEmployeeColumns.has(column.key));
  }

  function bindTableComfort() {
    applyTableDensity(readStoredTableDensity());
    hiddenEmployeeColumns = readStoredHiddenEmployeeColumns();
    readEmployeeGridPreferences();

    elements.tableDensityToggle?.addEventListener("change", (event) => {
      const density = event.target.checked ? "compact" : "comfortable";
      applyTableDensity(density);
      try {
        localStorage.setItem(TABLE_DENSITY_KEY, density);
      } catch (error) {
        console.warn("Die Zeilendichte konnte nicht gespeichert werden.", error);
      }
    });

    elements.openEmployeeColumnsButton?.addEventListener("click", openEmployeeColumnsDialog);
    elements.employeeColumnsList?.addEventListener("change", handleEmployeeColumnChange);
    elements.employeeColumnsList?.addEventListener("click", handleEmployeeColumnOrderAction);

    // Ob die Umschalttaste gedrueckt war, steht nur am Klick - das
    // change-Ereignis der Auswahlkaestchen kennt keine Zusatztasten. Der Klick
    // kommt zuerst, deshalb liegt die Antwort bereit, wenn change eintrifft.
    elements.employeeTable?.addEventListener("click", (event) => {
      if (!event.target.closest("[data-select-employee]")) return;
      employeeSelectionShiftPressed = event.shiftKey;
      // Ein Umschalt-Klick markiert im Browser sonst alles zwischen den beiden
      // Kästchen - gemeint war die Zeilenauswahl, nicht der Text.
      if (event.shiftKey) window.getSelection()?.removeAllRanges();
    });
  }

  function takeEmployeeSelectionShift() {
    const pressed = employeeSelectionShiftPressed;
    employeeSelectionShiftPressed = false;
    return pressed;
  }

  function applyTableDensity(density) {
    const compact = density === "compact";
    document.body.classList.toggle("is-compact-tables", compact);
    if (elements.tableDensityToggle) elements.tableDensityToggle.checked = compact;
  }

  function readStoredTableDensity() {
    try {
      return localStorage.getItem(TABLE_DENSITY_KEY) === "compact" ? "compact" : "comfortable";
    } catch (error) {
      console.warn("Die gespeicherte Zeilendichte ist unlesbar.", error);
      return "comfortable";
    }
  }

  function readStoredHiddenEmployeeColumns() {
    try {
      const stored = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_KEY) || "[]");
      const known = new Set(EMPLOYEE_COLUMNS.map((column) => column.key));
      return new Set((Array.isArray(stored) ? stored : []).filter((key) => known.has(key)));
    } catch (error) {
      console.warn("Die gespeicherte Spaltenwahl ist unlesbar.", error);
      return new Set();
    }
  }

  function openEmployeeColumnsDialog() {
    elements.employeeColumnsList.innerHTML = employeeColumnOrder.map((key) => EMPLOYEE_COLUMNS.find((column) => column.key === key)).filter(Boolean).map(
      (column) => `
        <div class="column-choice-row">
          <label class="checkbox-field">
            <input type="checkbox" data-employee-column="${column.key}" ${hiddenEmployeeColumns.has(column.key) ? "" : "checked"} />
            <span>${escapeHtml(column.label)}</span>
          </label>
          <label class="column-pin-choice" title="Spalte beim horizontalen Scrollen fixieren">
            <input type="radio" name="employeePinnedColumn" data-pin-employee-column="${column.key}" ${pinnedEmployeeColumn === column.key ? "checked" : ""} />
            <span>Fixieren</span>
          </label>
          <span class="column-order-actions">
            <button class="icon-button" type="button" data-move-employee-column="${column.key}" data-direction="up" aria-label="${escapeHtml(column.label)} nach links"><span aria-hidden="true">←</span></button>
            <button class="icon-button" type="button" data-move-employee-column="${column.key}" data-direction="down" aria-label="${escapeHtml(column.label)} nach rechts"><span aria-hidden="true">→</span></button>
          </span>
        </div>
      `,
    ).join("") + `<button class="button button-ghost column-unpin-button" type="button" data-unpin-employee-column>Fixierung aufheben</button>`;
    elements.employeeColumnsDialog.showModal();
  }

  function handleEmployeeColumnChange(event) {
    const checkbox = event.target.closest("[data-employee-column]");
    if (!checkbox) return;
    const key = checkbox.dataset.employeeColumn;

    if (checkbox.checked) hiddenEmployeeColumns.delete(key);
    else hiddenEmployeeColumns.add(key);

    // Ganz ohne Spalte bliebe eine Namensliste - das ist erlaubt, aber die
    // Sortierung muss dann auf den Namen zurückfallen, sonst sortierte die
    // Tabelle nach einer Spalte, die niemand mehr sieht.
    if (hiddenEmployeeColumns.has(employeeSortKey)) employeeSortKey = "name";

    try {
      localStorage.setItem(EMPLOYEE_COLUMN_KEY, JSON.stringify([...hiddenEmployeeColumns]));
    } catch (error) {
      console.warn("Die Spaltenwahl konnte nicht gespeichert werden.", error);
    }
    renderEmployees();
  }

  function readEmployeeGridPreferences() {
    try {
      const storedOrder = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_ORDER_KEY) || "[]");
      const known = EMPLOYEE_COLUMNS.map((column) => column.key);
      if (Array.isArray(storedOrder)) {
        employeeColumnOrder = [...storedOrder.filter((key) => known.includes(key)), ...known.filter((key) => !storedOrder.includes(key))];
      }
      const storedPinned = localStorage.getItem(EMPLOYEE_PINNED_COLUMN_KEY) || "";
      pinnedEmployeeColumn = known.includes(storedPinned) ? storedPinned : "";
      const widths = JSON.parse(localStorage.getItem(EMPLOYEE_COLUMN_WIDTHS_KEY) || "{}");
      employeeColumnWidths = widths && typeof widths === "object" ? widths : {};
    } catch (error) {
      console.warn("Die Tabellenanordnung konnte nicht gelesen werden.", error);
    }
  }

  function storeEmployeeGridPreferences() {
    try {
      localStorage.setItem(EMPLOYEE_COLUMN_ORDER_KEY, JSON.stringify(employeeColumnOrder));
      localStorage.setItem(EMPLOYEE_PINNED_COLUMN_KEY, pinnedEmployeeColumn);
      localStorage.setItem(EMPLOYEE_COLUMN_WIDTHS_KEY, JSON.stringify(employeeColumnWidths));
    } catch (error) {
      console.warn("Die Tabellenanordnung konnte nicht gespeichert werden.", error);
    }
  }

  function handleEmployeeColumnOrderAction(event) {
    const unpin = event.target.closest("[data-unpin-employee-column]");
    if (unpin) {
      pinnedEmployeeColumn = "";
      storeEmployeeGridPreferences();
      openEmployeeColumnsDialog();
      renderEmployees();
      return;
    }
    const move = event.target.closest("[data-move-employee-column]");
    if (move) {
      const index = employeeColumnOrder.indexOf(move.dataset.moveEmployeeColumn);
      const target = index + (move.dataset.direction === "up" ? -1 : 1);
      if (index >= 0 && target >= 0 && target < employeeColumnOrder.length) {
        [employeeColumnOrder[index], employeeColumnOrder[target]] = [employeeColumnOrder[target], employeeColumnOrder[index]];
        storeEmployeeGridPreferences();
        openEmployeeColumnsDialog();
        renderEmployees();
      }
      return;
    }
    const pin = event.target.closest("[data-pin-employee-column]");
    if (pin) {
      pinnedEmployeeColumn = pin.dataset.pinEmployeeColumn;
      storeEmployeeGridPreferences();
      renderEmployees();
    }
  }

  function employeeColumnStyle(key) {
    const width = Number(employeeColumnWidths[key]);
    return Number.isFinite(width) && width >= 80
      ? dynamicStyle({ "--employee-column-width": `${width}px` })
      : "";
  }

  function setEmployeeColumnWidth(key, width) {
    employeeColumnWidths[key] = Math.max(80, Math.min(520, Math.round(width)));
    storeEmployeeGridPreferences();
  }

  function employeeTableStyle() {
    const nameWidth = Number(employeeColumnWidths.name);
    return Number.isFinite(nameWidth) && nameWidth >= 80
      ? dynamicStyle({ "--employee-name-width": `${nameWidth}px` })
      : "";
  }

  // Umschalt-Klick wählt von der zuletzt angeklickten Zeile bis zur jetzigen -
  // wie in einer Dateiliste. Maßgeblich ist die gezeigte Reihenfolge, nicht die
  // im Datenbestand.
  function applyEmployeeSelectionRange(employeeId, checked) {
    const visible = filteredEmployeesForTable();
    const index = visible.findIndex((employee) => employee.id === employeeId);
    if (index < 0) return false;
    if (lastEmployeeSelectionIndex < 0 || lastEmployeeSelectionIndex >= visible.length) {
      lastEmployeeSelectionIndex = index;
      return false;
    }

    const [from, to] = [lastEmployeeSelectionIndex, index].sort((a, b) => a - b);
    visible.slice(from, to + 1).forEach((employee) => {
      if (checked) selectedEmployeeIds.add(employee.id);
      else selectedEmployeeIds.delete(employee.id);
    });
    lastEmployeeSelectionIndex = index;
    return true;
  }

  function rememberEmployeeSelectionAnchor(employeeId) {
    lastEmployeeSelectionIndex = filteredEmployeesForTable().findIndex(
      (employee) => employee.id === employeeId,
    );
  }

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

    // Strg+K oeffnet die Befehlspalette - auch aus einem Eingabefeld heraus,
    // denn sie ist selbst ein Eingabefeld und ersetzt keins.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    // Strg+Z nur ausserhalb von Eingaben: Dort gehoert das Zuruecknehmen dem
    // Browser und seinem Eingabeverlauf, nicht dem Datenbestand.
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
      if (isTextEntry(event.target) || !hasUndoableMutation()) return;
      event.preventDefault();
      void undoLastMutation();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // Esc raeumt eine Mehrfachauswahl ab - dieselbe Taste, die auch einen
    // Dialog schliesst und das Vollbild verlaesst.
    if (event.key === "Escape" && hasRecordSelection()) {
      event.preventDefault();
      clearAllRecordSelections();
      return;
    }

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

  // Die Befehlspalette: ein Feld für alles. Sie findet Ansichten, Aktionen und
  // Datensätze und führt beim Bestätigen aus, was gewählt wurde. Gesucht wird
  // über searchKey - also nachsichtig gegenüber Umlauten, „ß“ und Akzenten.
  const COMMAND_PALETTE_LIMIT = 24;
  const COMMAND_PALETTE_GROUP_LIMIT = 5;

  let commandPaletteMatches = [];
  let commandPaletteIndex = 0;
  // Die Datensätze werden je Änderung einmal aufbereitet, nicht bei jedem
  // Tastendruck: Der Zähler der Änderungen sagt, wann das nötig ist.
  let commandPaletteRecordCache = { sequence: -1, userId: "", records: [] };

  function bindCommandPalette() {
    elements.openCommandPaletteButton?.addEventListener("click", openCommandPalette);
    elements.commandPaletteInput?.addEventListener("input", () => {
      commandPaletteIndex = 0;
      renderCommandPalette();
    });
    elements.commandPaletteInput?.addEventListener("keydown", handleCommandPaletteKeydown);
    elements.commandPaletteResults?.addEventListener("click", (event) => {
      const option = event.target.closest("[data-command-index]");
      if (option) runCommandPaletteEntry(Number(option.dataset.commandIndex));
    });
  }

  function openCommandPalette() {
    if (!elements.commandPalette || elements.commandPalette.open) return;
    elements.commandPaletteInput.value = "";
    commandPaletteIndex = 0;
    renderCommandPalette();
    elements.commandPalette.showModal();
    elements.commandPaletteInput.focus();
  }

  function handleCommandPaletteKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!commandPaletteMatches.length) return;
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const count = commandPaletteMatches.length;
      commandPaletteIndex = (commandPaletteIndex + offset + count) % count;
      renderCommandPalette();
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!commandPaletteMatches.length) return;
      event.preventDefault();
      commandPaletteIndex = event.key === "Home" ? 0 : commandPaletteMatches.length - 1;
      renderCommandPalette();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runCommandPaletteEntry(commandPaletteIndex);
    }
  }

  // Erst schließen, dann ausführen: Was gewählt wurde, öffnet oft selbst einen
  // Dialog, und zwei übereinander wären einer zu viel.
  function runCommandPaletteEntry(index) {
    const entry = commandPaletteMatches[index];
    if (!entry) return;
    trackWorkspaceCommand(entry);
    elements.commandPalette.close();
    entry.run();
  }

  function renderCommandPalette() {
    const query = searchKey(elements.commandPaletteInput.value);
    commandPaletteMatches = matchingCommandPaletteEntries(query);
    if (commandPaletteIndex >= commandPaletteMatches.length) commandPaletteIndex = 0;

    if (!commandPaletteMatches.length) {
      elements.commandPaletteResults.innerHTML = renderEmptyState({
        title: "Nichts gefunden",
        text: "Kein Eintrag, keine Ansicht und keine Aktion passt zu dieser Eingabe.",
        compact: true,
      });
      const preview = document.querySelector("#commandPalettePreview");
      if (preview) preview.textContent = "";
      return;
    }

    let lastGroup = "";
    elements.commandPaletteResults.innerHTML = commandPaletteMatches
      .map((entry, index) => {
        const heading =
          entry.group === lastGroup
            ? ""
            : `<p class="command-palette-group">${escapeHtml(entry.group)}</p>`;
        lastGroup = entry.group;
        const active = index === commandPaletteIndex;
        return `${heading}<button
            class="command-palette-option ${active ? "is-active" : ""}"
            type="button"
            role="option"
            aria-selected="${active}"
            id="commandPaletteOption${index}"
            data-command-index="${index}"
          >
            <svg aria-hidden="true"><use href="#${entry.icon}"></use></svg>
            <span class="command-palette-label">${escapeHtml(entry.label)}</span>
            ${entry.hint ? `<span class="command-palette-hint">${escapeHtml(entry.hint)}</span>` : ""}
          </button>`;
      })
      .join("");

    elements.commandPaletteInput.setAttribute(
      "aria-activedescendant",
      `commandPaletteOption${commandPaletteIndex}`,
    );
    elements.commandPaletteResults
      .querySelector(".command-palette-option.is-active")
      ?.scrollIntoView({ block: "nearest" });
    const activeEntry = commandPaletteMatches[commandPaletteIndex];
    const preview = document.querySelector("#commandPalettePreview");
    if (preview) preview.innerHTML = `<span>${escapeHtml(activeEntry.group)}</span><strong>${escapeHtml(activeEntry.label)}</strong><small>${escapeHtml(activeEntry.hint || "Mit Enter ausführen")}</small>`;
  }

  // Ohne Eingabe stehen Ansichten und Aktionen bereit - die Palette ist dann
  // ein Inhaltsverzeichnis. Datensätze kommen erst mit einem Suchbegriff dazu,
  // sonst wäre die Liste nur lang.
  function matchingCommandPaletteEntries(query) {
    const groups = [workspaceCommandPaletteEntries(), commandPaletteViews(), commandPaletteActions()];
    if (query) groups.push(commandPaletteRecords());

    const matches = [];
    for (const group of groups) {
      const found = new Map();
      for (const entry of group) {
        const rank = commandPaletteRank(entry, query);
        if (rank < 0) continue;
        const bucket = found.get(entry.group);
        if (bucket) bucket.push({ entry, rank });
        else found.set(entry.group, [{ entry, rank }]);
      }
      for (const bucket of found.values()) {
        bucket.sort((a, b) => a.rank - b.rank);
        const limit = query ? COMMAND_PALETTE_GROUP_LIMIT : bucket.length;
        matches.push(...bucket.slice(0, limit).map((item) => item.entry));
      }
    }
    // Ohne Eingabe ist die Liste das Inhaltsverzeichnis und bleibt vollstaendig;
    // eine Suche dagegen wird gekappt, damit die besten Treffer oben stehen
    // und nicht in einer langen Liste untergehen.
    return query ? matches.slice(0, COMMAND_PALETTE_LIMIT) : matches;
  }

  // Ein Treffer am Wortanfang steht vor einem irgendwo in der Mitte, und der
  // Name zählt mehr als der Zusatz dahinter.
  function commandPaletteRank(entry, query) {
    if (!query) return 0;
    const label = entry.searchLabel ?? (entry.searchLabel = searchKey(entry.label));
    if (label.startsWith(query)) return 0;
    if (label.includes(query)) return 1;
    const extra =
      entry.searchExtra ??
      (entry.searchExtra = searchKey(`${entry.hint || ""} ${entry.keywords || ""}`));
    return extra.includes(query) ? 2 : -1;
  }

  function commandPaletteViews() {
    return Object.entries(VIEW_SHORTCUTS).map(([key, view]) => {
      const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
      return {
        group: "Ansichten",
        icon:
          navItem?.querySelector("use")?.getAttribute("href")?.replace("#", "") ||
          "icon-dashboard",
        label: navItem?.querySelector("span")?.textContent.trim() || view,
        hint: `g ${key}`,
        run: () => showView(view),
      };
    });
  }

  function commandPaletteActions() {
    const entries = [
      { label: "Mitarbeiter anlegen", icon: "icon-users", run: () => openEmployeeDialog() },
      { label: "Termin anlegen", icon: "icon-calendar", run: () => openAppointmentDialog() },
      { label: "Memo / ToDo anlegen", icon: "icon-memo", run: () => openMemoDialog() },
      {
        label: "Pflichtfortbildung anlegen",
        icon: "icon-training",
        run: () => openTrainingDialog(),
      },
      {
        label: "Fortbildungsnachweis anlegen",
        icon: "icon-clipboard-check",
        run: () => openCompletionDialog(),
      },
      { label: "Teamsitzung anlegen", icon: "icon-meeting", run: () => openMeetingDialog() },
      {
        label: "Geräteeinweisung anlegen",
        icon: "icon-device",
        run: () => openDeviceInstructionDialog(),
      },
      { label: "Gerät anlegen", icon: "icon-construction", run: () => openDeviceDialog() },
      {
        label: "Sicherung exportieren",
        icon: "icon-download",
        keywords: "Datensicherung Backup speichern",
        run: () => void exportDatabase(),
      },
      {
        label: "Datenqualität prüfen",
        icon: "icon-check",
        keywords: "Plausibilität Auffälligkeiten",
        run: () => openDataQualityDialog(),
      },
      {
        label: "Arbeitsliste: Überfällig",
        icon: "icon-alert",
        keywords: "Dashboard Fristen offen Aufgaben",
        run: () => {
          workQueueFilter = "overdue";
          showView("dashboard");
          renderDesktopWorkspace();
          document.querySelector("#dashboardWorkQueuePanel")?.scrollIntoView({ block: "start" });
        },
      },
      {
        label: "Mitarbeiter: aktuell Beschäftigte",
        icon: "icon-users",
        keywords: "Filter aktiv Einarbeitung",
        run: () => {
          employeeStatusFilter = "employed";
          showView("employees");
          renderEmployees();
        },
      },
      {
        label: "Berufe und Qualifikationen",
        icon: "icon-edit",
        keywords: "Katalog Stammdaten",
        run: () => openCatalogManagementDialog(),
      },
      { label: "Tastenkürzel", icon: "icon-keyboard", run: openShortcutsDialog },
      { label: "Abmelden", icon: "icon-logout", run: () => logout() },
    ];

    if (isAdmin()) {
      entries.push(
        {
          label: "Änderungsprotokoll",
          icon: "icon-clipboard-check",
          keywords: "Audit Nachvollziehbarkeit",
          run: () => openAuditLogDialog(),
        },
        {
          label: "Benutzerverwaltung",
          icon: "icon-lock",
          keywords: "Konten Passwort Rollen",
          run: () => openUserManagementDialog(),
        },
      );
    }

    return entries.map((entry) => ({ group: "Aktionen", hint: "", ...entry }));
  }

  // Ein Datensatz führt dorthin, wo man ihn bearbeitet - und die Ansicht
  // dahinter wechselt mit, damit nach dem Schließen nicht die alte Seite steht.
  function commandPaletteRecords() {
    // Auch das angemeldete Konto zaehlt: Es entscheidet, welche Memos
    // ueberhaupt sichtbar sind.
    if (
      commandPaletteRecordCache.sequence === stateMutationSequence &&
      commandPaletteRecordCache.userId === (currentUser?.id || "")
    ) {
      return commandPaletteRecordCache.records;
    }

    const records = [
      ...state.employees.map((employee) => ({
        group: "Mitarbeiter",
        icon: "icon-users",
        label: fullName(employee),
        hint: employee.profession || "",
        keywords: employee.email || "",
        run: () => {
          showView("employees");
          openEmployeeDossier(employee.id);
        },
      })),
      ...state.appointments.map((appointment) => ({
        group: "Termine",
        icon: "icon-calendar",
        label: appointment.title,
        hint: `${formatDate(appointment.date)}${appointment.location ? ` · ${appointment.location}` : ""}`,
        run: () => {
          showView("appointments");
          selectRecordInspector("appointment", appointment.id);
        },
      })),
      ...state.memos
        .filter((memo) => memoVisibleToCurrentUser(memo))
        .map((memo) => ({
          group: "Memo / ToDo",
          icon: "icon-memo",
          label: memo.title,
          hint: memo.category || formatDate(memo.date),
          run: () => {
            showView("memos");
            selectRecordInspector("memo", memo.id);
          },
        })),
      ...state.trainings.map((training) => ({
        group: "Pflichtfortbildungen",
        icon: "icon-training",
        label: training.title,
        hint: String(training.year || ""),
        run: () => {
          showView("trainings");
          openTrainingDialog(training.id);
        },
      })),
      ...state.meetings.map((meeting) => ({
        group: "Teamsitzungen",
        icon: "icon-meeting",
        label: meeting.title,
        hint: formatDate(meeting.date),
        run: () => {
          showView("meetings");
          openMeetingDialog(meeting.id);
        },
      })),
      ...state.devices.map((device) => ({
        group: "Geräte",
        icon: "icon-device",
        label: deviceLabel(device),
        hint: device.category || "",
        run: () => {
          showView("device-management");
          selectRecordInspector("device", device.id);
        },
      })),
    ];

    commandPaletteRecordCache = {
      sequence: stateMutationSequence,
      userId: currentUser?.id || "",
      records,
    };
    return records;
  }

  function renderDashboard() {
    renderDashboardGreeting();
    renderDashboardTrainingProgress();
    renderRecentEmployees();
  }

  function renderDashboardTrainingProgress() {
    if (state.trainings.length === 0) {
      elements.dashboardTrainingProgress.innerHTML = renderEmptyState({
        title: "Noch keine Pflichtfortbildungen",
        text: "Legen Sie die erste Pflichtfortbildung an, um den Teamfortschritt zu verfolgen.",
        buttonText: "Fortbildung anlegen",
        buttonAttribute: "data-open-training",
        compact: true,
      });
      elements.dashboardTrainingProgress
        .querySelector("[data-open-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    // Alle aktiven Pflichten: trainingObligations fasst Fortbildungsreihen auf
    // ihren aktuellen Jahrgang zusammen, sodass vergangene Jahrgaenge derselben
    // Reihe nicht mehrfach erscheinen.
    const sortedTrainings = trainingObligations()
      .map((training) => ({ training, stats: getTrainingStats(training) }))
      .sort(
        (a, b) =>
          a.stats.percent - b.stats.percent ||
          a.training.title.localeCompare(b.training.title, "de"),
      );

    elements.dashboardTrainingProgress.innerHTML = `
      <div class="progress-list">
        ${sortedTrainings
          .map(({ training, stats }) => {
            const color =
              stats.percent >= 100
                ? "var(--teal-700)"
                : stats.percent >= 60
                  ? "var(--blue-600)"
                  : "var(--orange-700)";
            return `
              <div class="progress-item">
                <div class="progress-name">
                  <strong title="${escapeHtml(training.title)} · ${training.year}">${escapeHtml(
                    training.title,
                  )}</strong>
                  <small>${training.year} · ${recurrenceLabel(training)}</small>
                </div>
                <div
                  class="progress-track"
                  role="progressbar"
                  aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="${stats.percent}"
                >
                  <div
                    class="progress-bar"
                    ${dynamicStyle({ "--progress": `${stats.percent}%`, "--progress-color": color })}
                  ></div>
                </div>
                <span class="progress-value">${stats.percent}&thinsp;%</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderDeadlineOverview() {
    const horizon = Number(elements.deadlineHorizon.value) || 90;
    const activeKinds = new Set(state.settings.deadlineKinds);
    elements.deadlineFilters.forEach((filter) => {
      filter.checked = activeKinds.has(filter.value);
    });
    const hideOverdue = Boolean(state.settings.deadlineHideOverdue);
    elements.deadlineHideOverdue.checked = hideOverdue;
    const deadlines = filterDeadlineItems(
      getDeadlineItems(),
      activeKinds,
      horizon,
      hideOverdue,
    );
    const overdue = deadlines.filter((item) => item.daysUntil < 0);
    const upcoming = deadlines.filter((item) => item.daysUntil >= 0);

    if (deadlines.length === 0) {
      const selectedLabels = DEADLINE_KINDS.filter((kind) =>
        activeKinds.has(kind),
      ).map((kind) => DEADLINE_KIND_LABELS[kind]);
      elements.deadlineOverview.innerHTML = renderEmptyState({
        title: activeKinds.size
          ? `Keine passenden Fristen innerhalb von ${horizon} Tagen`
          : "Keine Kategorien ausgewählt",
        text: activeKinds.size
          ? `Für die Auswahl ${formatList(selectedLabels)} sind innerhalb dieses Zeitraums keine ${
              hideOverdue ? "anstehenden " : ""
            }Einträge vorhanden.`
          : "Wählen Sie mindestens eine Kategorie aus, die im Fristenmonitor angezeigt werden soll.",
        compact: true,
      });
      return;
    }

    // Angepinnte Termine werden nie durch die allgemeine 25-Zeilen-Grenze
    // abgeschnitten. Freie Plaetze werden danach mit regulaeren Fristen gefuellt.
    const pinnedDeadlines = deadlines.filter((item) => item.appointment?.pinned);
    const displayedDeadlines = [
      ...pinnedDeadlines,
      ...deadlines
        .filter((item) => !item.appointment?.pinned)
        .slice(0, Math.max(0, 25 - pinnedDeadlines.length)),
    ];

    elements.deadlineOverview.innerHTML = `
      <div class="deadline-summary">
        <span class="summary-chip summary-orange">
          <strong>${overdue.length}</strong>
          <small>überfällig</small>
        </span>
        <span class="summary-chip">
          <strong>${upcoming.length}</strong>
          <small>demnächst fällig</small>
        </span>
        ${DEADLINE_KINDS.filter((kind) => activeKinds.has(kind))
          .map(
            (kind) => `
              <span class="summary-chip ${kind === "birthday" ? "summary-teal" : ""}">
                <strong>${deadlines.filter((item) => deadlineFilterKind(item) === kind).length}</strong>
                <small>${DEADLINE_KIND_LABELS[kind]}</small>
              </span>
            `,
          )
          .join("")}
      </div>
      <div class="deadline-list">
        ${displayedDeadlines
          .map(
            (item) => `
              <button
                class="deadline-row ${item.appointment?.pinned ? "is-pinned" : ""} ${item.daysUntil < 0 ? "is-overdue" : ""}"
                type="button"
                ${
                  item.kind === "appointment"
                    ? `data-deadline-appointment="${item.appointment.id}"`
                    : `data-deadline-employee="${item.employeeId}"`
                }
              >
                <span>${
                  item.kind === "appointment"
                    ? `<span class="deadline-calendar-icon" ${
                        appointmentCategoryLabel(item.appointment)
                          ? `title="${escapeHtml(appointmentCategoryLabel(item.appointment))}"`
                          : ""
                      }><svg><use href="#icon-${appointmentCategoryIcon(
                        item.appointment,
                      )}"></use></svg></span>`
                    : renderAvatar(item.employee, true)
                }</span>
                <span>
                  <strong>${item.appointment?.pinned ? `<span class="deadline-pin-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>` : ""}${escapeHtml(
                    item.kind === "birthday"
                      ? `${fullName(item.employee)} - ${item.title}`
                      : item.title,
                  )}</strong>
                  <small>${escapeHtml(
                    item.kind === "birthday"
                      ? `Geburtsdatum: ${formatDate(item.employee.birthDate)}`
                      : item.kind === "appointment"
                        ? [
                            item.type,
                            formatAppointmentTime(item.appointment),
                            item.appointment.location,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : `${fullName(item.employee)} · ${item.type}`,
                  )}</small>
                  ${
                    item.kind === "appointment" && item.appointment.description
                      ? `<small
                          class="deadline-description"
                          title="${escapeHtml(item.appointment.description)}"
                        >${escapeHtml(item.appointment.description)}</small>`
                      : ""
                  }
                </span>
                <span>
                  <strong>${formatDate(item.dueDate)}</strong>
                  <small>${deadlineRelativeLabel(item.daysUntil)}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
      ${
        deadlines.length > displayedDeadlines.length
          ? `<p class="field-hint">${deadlines.length - displayedDeadlines.length} weitere Einträge werden in den jeweiligen Übersichten angezeigt.</p>`
          : ""
      }
    `;
    limitDeadlineListHeight();
    elements.deadlineOverview
      .querySelectorAll("[data-deadline-employee]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          openEmployeeDossier(button.dataset.deadlineEmployee),
        );
      });
    elements.deadlineOverview
      .querySelectorAll("[data-deadline-appointment]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          openAppointmentDialog(button.dataset.deadlineAppointment),
        );
      });
  }

  // Die sichtbare Hoehe wird an der ersten ueberzaehligen Zeile gemessen statt
  // aus einer angenommenen Zeilenhoehe gerechnet - Titel koennen umbrechen,
  // und Termine bringen andere Zeilenhoehen mit als Geburtstage.
  function limitDeadlineListHeight() {
    const list = elements.deadlineOverview.querySelector(".deadline-list");
    if (!list) return;
    list.style.maxHeight = "";
    list.scrollTop = 0;

    // Waehrend das Dashboard ausgeblendet ist, liefern alle Masse 0. Die
    // Begrenzung wird dann uebersprungen und von showView nachgeholt, sobald
    // die Ansicht wieder sichtbar ist.
    if (!list.offsetParent) {
      list.classList.remove("is-scrollable");
      return;
    }

    const rows = [...list.querySelectorAll(".deadline-row")];
    if (rows.length <= VISIBLE_DEADLINE_ROWS) {
      list.classList.remove("is-scrollable");
      return;
    }
    const oberkante = list.getBoundingClientRect().top;
    const grenze = rows[VISIBLE_DEADLINE_ROWS].getBoundingClientRect().top;
    list.style.maxHeight = `${Math.round(grenze - oberkante)}px`;
    list.classList.add("is-scrollable");
  }

  async function updateDeadlineFilters() {
    const selectedKinds = elements.deadlineFilters
      .filter((filter) => filter.checked)
      .map((filter) => filter.value)
      .filter((kind) => DEADLINE_KINDS.includes(kind));
    if (
      JSON.stringify(selectedKinds) ===
      JSON.stringify(state.settings.deadlineKinds)
    ) {
      renderDeadlineOverview();
      return;
    }
    await commitStateMutation(() => {
      state.settings.deadlineKinds = selectedKinds;
    });
  }

  async function updateDeadlineOverdueFilter() {
    const hideOverdue = elements.deadlineHideOverdue.checked;
    if (hideOverdue === Boolean(state.settings.deadlineHideOverdue)) {
      renderDeadlineOverview();
      return;
    }
    await commitStateMutation(() => {
      state.settings.deadlineHideOverdue = hideOverdue;
    });
  }

  function filterDeadlineItems(items, activeKinds, horizon, hideOverdue = false) {
    return items
      .filter(
        (item) =>
          (!hideOverdue || item.daysUntil >= 0) &&
          (item.appointment?.pinned ||
            (activeKinds.has(deadlineFilterKind(item)) &&
              item.daysUntil <= horizon)),
      )
      .sort(
        (a, b) =>
          Number(Boolean(b.appointment?.pinned)) -
          Number(Boolean(a.appointment?.pinned)),
      );
  }

  function deadlineFilterKind(item) {
    if (
      item?.kind === "appointment" &&
      ["schulung", "geraeteeinweisung"].includes(item.appointment?.category)
    ) {
      return "training";
    }
    return item?.kind || "";
  }

  function getDeadlineItems() {
    const today = parseLocalDate(todayIso());
    const items = [];
    activeEmployeeList().forEach((employee) => {
      const birthday = getNextBirthday(employee.birthDate, today);
      if (birthday) {
        items.push({
          employeeId: employee.id,
          employee,
          title: `${birthday.age}. Geburtstag`,
          type: "Geburtstag",
          kind: "birthday",
          dueDate: birthday.date,
          daysUntil: daysBetween(today, parseLocalDate(birthday.date)),
        });
      }
      trainingObligations().forEach((training) => {
        const latest = latestCompletion(employee.id, training.id);
        let dueDate = "";
        if (latest && training.recurrenceMonths) {
          dueDate = addMonths(latest.completedOn, training.recurrenceMonths);
        } else if (!latest) {
          dueDate = `${training.year}-12-31`;
        }
        if (dueDate) {
          items.push({
            employeeId: employee.id,
            employee,
            title: training.title,
            type: "Pflichtfortbildung",
            kind: "training",
            dueDate,
            daysUntil: daysBetween(today, parseLocalDate(dueDate)),
          });
        }
      });
      Object.entries(employee.qualificationExpiries || {}).forEach(([id, dueDate]) => {
        if (!employee.qualifications[id] || !parseLocalDate(dueDate)) return;
        items.push({
          employeeId: employee.id,
          employee,
          title: qualificationLabel(id),
          type: "Zusatzqualifikation",
          kind: "qualification",
          dueDate,
          daysUntil: daysBetween(today, parseLocalDate(dueDate)),
        });
      });
    });
    state.appointments.forEach((appointment) => {
      const daysUntil = daysBetween(today, parseLocalDate(appointment.date));
      if (daysUntil < 0 && !appointment.pinned) return;
      items.push({
        employeeId: "",
        employee: null,
        appointment,
        title: appointment.title,
        type: appointmentCategoryLabel(appointment) || "Termin",
        kind: "appointment",
        dueDate: appointment.date,
        daysUntil,
      });
    });
    return items.sort(
      (a, b) =>
        Number(Boolean(b.appointment?.pinned)) -
          Number(Boolean(a.appointment?.pinned)) ||
        a.daysUntil - b.daysUntil ||
        (a.employee && b.employee ? sortEmployees(a.employee, b.employee) : 0) ||
        a.title.localeCompare(b.title, "de"),
    );
  }

  function getNextBirthday(birthDate, referenceDate = parseLocalDate(todayIso())) {
    const birth = parseLocalDate(birthDate);
    if (!birth || !referenceDate) return null;
    const birthMonth = birth.getMonth() + 1;
    const birthDay = birth.getDate();
    let year = referenceDate.getFullYear();
    let date = birthdayDateForYear(year, birthMonth, birthDay);
    if (date < referenceDate) {
      year += 1;
      date = birthdayDateForYear(year, birthMonth, birthDay);
    }
    return {
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-"),
      age: year - birth.getFullYear(),
    };
  }

  function birthdayDateForYear(year, month, day) {
    const adjustedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
    return new Date(year, month - 1, adjustedDay, 12);
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function daysBetween(from, to) {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }

  function deadlineRelativeLabel(days) {
    if (days < 0) return `seit ${Math.abs(days)} Tag${Math.abs(days) === 1 ? "" : "en"} überfällig`;
    if (days === 0) return "heute fällig";
    return `in ${days} Tag${days === 1 ? "" : "en"}`;
  }

  function openEmployeeDossier(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    trackWorkspaceRecord("employee", employeeId);
    const selectedQualifications = state.catalogs.qualifications.filter(
      (qualification) => employee.qualifications[qualification.id],
    );
    const trainings = trainingObligations().sort(
      (a, b) => b.year - a.year || a.title.localeCompare(b.title, "de"),
    );
    const attendances = state.meetingAttendances.filter(
      (attendance) => attendance.employeeId === employee.id,
    );
    const participated = attendances.filter(
      (attendance) => attendance.status === "teilgenommen",
    ).length;
    const expectedMeetings = state.meetings.filter((meeting) => {
      if (!meeting.expectedEmployeeIds.includes(employee.id)) return false;
      return !attendances.some(
        (attendance) =>
          attendance.meetingId === meeting.id &&
          attendance.status === "nicht_zutreffend",
      );
    }).length;

    elements.employeeDossierTitle.textContent = fullName(employee);
    elements.employeeDossierSubtitle.textContent = `${employee.profession} · ${employeeStatusLabel(
      employee,
    )}`;
    elements.employeeDossierDialog.dataset.employeeId = employee.id;
    elements.employeeDossierContent.innerHTML = `
      <div class="dossier-summary-grid">
        ${renderDossierItem("Geburtsdatum", formatDate(employee.birthDate))}
        ${renderDossierItem("Telefon", employee.phone || "–")}
        ${renderDossierItem("E-Mail", employee.email || "–")}
        ${renderDossierItem("Benutzername", employee.username || "–")}
        ${renderDossierItem("Stellenumfang", `${employee.employmentPercent} %`)}
        ${renderDossierItem("Dienstwochenende", serviceWeekendLabel(employee.serviceWeekend))}
        ${renderDossierItem(
          "Sitzungsteilnahme",
          `${percentage(participated, expectedMeetings)} % (${participated}/${expectedMeetings})`,
        )}
      </div>
      <section class="dossier-section">
        <h3>Zusatzqualifikationen</h3>
        ${
          selectedQualifications.length
            ? `<div class="dossier-list">${selectedQualifications
                .map((qualification) => {
                  const expiry = employee.qualificationExpiries[qualification.id];
                  const expired = expiry && expiry < todayIso();
                  return `<div class="dossier-list-row">
                    <strong>${escapeHtml(qualification.label)}</strong>
                    <span class="${expired ? "text-danger" : ""}">${
                      expiry ? `gültig bis ${formatDate(expiry)}` : "ohne Ablaufdatum"
                    }</span>
                  </div>`;
                })
                .join("")}</div>`
            : '<p class="field-hint">Keine Zusatzqualifikationen zugewiesen.</p>'
        }
      </section>
      <section class="dossier-section">
        <h3>Pflichtfortbildungen</h3>
        ${
          trainings.length
            ? `<div class="dossier-list">${trainings
                .map((training) => {
                  const status = getEmployeeCompletionStatus(employee.id, training);
                  return `<div class="dossier-list-row">
                    <strong>${escapeHtml(training.title)} <small>${training.year}</small></strong>
                    <span class="status-badge ${status.kind === "current" ? "" : status.kind}">${escapeHtml(
                      status.label,
                    )}</span>
                  </div>`;
                })
                .join("")}</div>`
            : '<p class="field-hint">Keine Pflichtfortbildungen angelegt.</p>'
        }
      </section>
      <section class="dossier-section">
        <h3>Teamsitzungen</h3>
        <div class="dossier-list">
          ${state.meetings
            .filter((meeting) => meeting.expectedEmployeeIds.includes(employee.id))
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((meeting) => {
              const attendance = attendances.find(
                (item) => item.meetingId === meeting.id,
              );
              return `<div class="dossier-list-row">
                <strong>${formatDate(meeting.date)} · ${escapeHtml(meeting.title)}</strong>
                <span>${escapeHtml(
                  attendance ? ATTENDANCE_STATUSES[attendance.status]?.label : "Noch offen",
                )}</span>
              </div>`;
            })
            .join("") || '<p class="field-hint">Keine erwarteten Teamsitzungen.</p>'}
        </div>
      </section>
    `;
    elements.employeeDossierDialog.showModal();
  }

  function renderDossierItem(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function printEmployeeDossier() {
    document.body.classList.add("print-employee-dossier");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-employee-dossier"), 0);
  }

  function openWeekendOverviewDialog() {
    renderWeekendOverview();
    elements.weekendOverviewDialog.showModal();
  }

  function openWeekendSimulationDialog() {
    renderWeekendSimulation();
    elements.weekendSimulationDialog.showModal();
  }

  function renderWeekendSimulation() {
    const simulation = simulateWeekendDistribution();
    currentWeekendSimulation = simulation;
    if (simulation.employeeCount === 0) {
      elements.weekendSimulationContent.innerHTML = renderEmptyState({
        title: "Keine festen Wochenendzuordnungen",
        text: "Für die Simulation werden aktive Mitarbeiter mit einem bereits fest zugewiesenen Dienstwochenende benötigt.",
        compact: true,
      });
      return;
    }

    const metricRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];
    const changedAssignments = simulation.assignments.filter(
      (assignment) => assignment.changeType !== "unchanged",
    );
    const improvement = Math.max(
      0,
      Math.round(
        ((simulation.currentBalanceScore - simulation.proposedBalanceScore) /
          Math.max(simulation.currentBalanceScore, 0.0001)) *
          100,
      ),
    );

    elements.weekendSimulationContent.innerHTML = `
      <div class="weekend-simulation-summary">
        <article>
          <span>Bestehende Wechsel</span>
          <strong>${simulation.switchedCount}</strong>
          <small>von ${simulation.fixedAssignmentCount} festen Zuordnungen</small>
        </article>
        <article>
          <span>Nicht zugeordnet</span>
          <strong>${simulation.unassignedCount}</strong>
          <small>bleiben ohne festes Wochenende</small>
        </article>
        <article>
          <span>Struktureller Ausgleich</span>
          <strong>${improvement} %</strong>
          <small>Verbesserung der gewichteten Abweichung</small>
        </article>
      </div>

      <section class="panel weekend-simulation-comparison">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ist und Simulation</p>
            <h3>Kennzahlenvergleich</h3>
          </div>
          <span class="weekend-comparison-note">
            VZÄ, Kopfzahl, Einarbeitung und Schlüsselqualifikationen werden gemeinsam gewichtet.
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th rowspan="2">Kennzahl</th>
                <th colspan="2">Aktuell</th>
                <th colspan="2">Simulation</th>
              </tr>
              <tr>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
              </tr>
            </thead>
            <tbody>
              ${metricRows
                .map(
                  ([label, key, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      <td><strong>${formatter(simulation.current.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.current.weekend_b[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_b[key])}</strong></td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-simulation-groups">
        ${SERVICE_WEEKEND_KEYS
          .map((weekend) => {
            const assignments = simulation.assignments.filter(
              (assignment) => assignment.proposedWeekend === weekend,
            );
            return `
              <section class="panel weekend-simulation-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Simulierte Zuordnung</p>
                    <h2>${escapeHtml(serviceWeekendLabel(weekend))}</h2>
                  </div>
                  <strong>${assignments.length} Personen</strong>
                </div>
                <div class="weekend-simulation-list">
                  ${assignments.map(renderWeekendSimulationEmployee).join("")}
                </div>
              </section>
            `;
          })
          .join("")}
      </div>

      <section class="panel weekend-simulation-changes">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Minimale Veränderung</p>
            <h3>Abweichungen von der heutigen Zuordnung</h3>
          </div>
        </div>
        ${
          changedAssignments.length
            ? `<div class="weekend-simulation-change-list">
                ${changedAssignments
                  .map(
                    ({ employee, originalWeekend, proposedWeekend }) => `
                      <div>
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        <span>${escapeHtml(serviceWeekendLabel(originalWeekend))} → ${escapeHtml(
                          serviceWeekendLabel(proposedWeekend),
                        )}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : '<p class="weekend-simulation-no-changes">Die bestehende feste Verteilung ist bereits die beste gefundene Lösung.</p>'
        }
      </section>
    `;
  }

  function requestApplyWeekendSimulation() {
    const simulation = currentWeekendSimulation;
    if (!simulation || simulation.employeeCount === 0) {
      showToast("Es liegt keine übernehmbare Simulation vor.", "error");
      return;
    }
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Mitarbeiterdaten haben sich verändert. Die Simulation wurde neu berechnet.",
        "error",
      );
      return;
    }
    const changedCount = simulation.switchedCount;
    if (changedCount === 0) {
      showToast("Die Simulation enthält keine geänderten Zuordnungen.");
      return;
    }

    requestConfirmation({
      title: "Wochenendverteilung übernehmen?",
      message:
        `${simulation.switchedCount} bestehende Zuordnung${
          simulation.switchedCount === 1 ? "" : "en"
        } werden zwischen den beiden Dienstwochenenden gewechselt. Mitarbeiter ohne festes Wochenende bleiben unberührt. Diese Änderung wird gespeichert.`,
      acceptLabel: "Verteilung übernehmen",
      tone: "primary",
      callback: () => applyWeekendSimulation(simulation),
    });
  }

  async function applyWeekendSimulation(simulation) {
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Ausgangsdaten haben sich geändert. Bitte prüfen Sie die neu berechnete Simulation.",
        "error",
      );
      return;
    }
    const proposedByEmployeeId = new Map(
      simulation.assignments.map((assignment) => [
        assignment.employee.id,
        assignment.proposedWeekend,
      ]),
    );
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.employees.forEach((employee) => {
        const proposedWeekend = proposedByEmployeeId.get(employee.id);
        if (
          !SERVICE_WEEKEND_KEYS.includes(proposedWeekend) ||
          serviceWeekendOwnerKey(employee.id) ||
          employee.serviceWeekend === proposedWeekend
        ) {
          return;
        }
        employee.serviceWeekend = proposedWeekend;
        employee.updatedAt = now;
      });
    });
    if (!committed) return;

    currentWeekendSimulation = null;
    if (elements.weekendSimulationDialog.open) {
      elements.weekendSimulationDialog.close();
    }
    showToast(
      `Die simulierte Verteilung wurde für ${
        simulation.switchedCount
      } Mitarbeiter/innen übernommen.`,
    );
  }

  function weekendSimulationMatchesCurrentState(simulation) {
    const activeEmployees = activeEmployeeList().filter((employee) =>
      SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    );
    if (activeEmployees.length !== simulation.assignments.length) return false;
    const currentById = new Map(
      activeEmployees.map((employee) => [employee.id, employee]),
    );
    return simulation.assignments.every(
      ({ employee, originalWeekend, ownerWeekend }) => {
        const currentEmployee = currentById.get(employee.id);
        if (!currentEmployee) return false;
        const normalizedCurrentWeekend = SERVICE_WEEKEND_KEYS.includes(
          currentEmployee.serviceWeekend,
        )
          ? currentEmployee.serviceWeekend
          : "none";
        const currentOwnerWeekend = serviceWeekendOwnerKey(currentEmployee.id);
        return (
          normalizedCurrentWeekend === originalWeekend &&
          currentOwnerWeekend === ownerWeekend &&
          (!currentOwnerWeekend || currentOwnerWeekend === originalWeekend)
        );
      },
    );
  }

  function simulateWeekendDistribution(employees = activeEmployeeList()) {
    const unassignedCount = employees.filter(
      (employee) => !SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    ).length;
    const candidates = employees
      .filter((employee) =>
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
      )
      .sort(sortEmployees);
    const originalAssignments = new Map(
      candidates.map((employee) => [
        employee.id,
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend)
          ? employee.serviceWeekend
          : "none",
      ]),
    );
    const assignments = new Map();
    candidates.forEach((employee) => {
      const original = originalAssignments.get(employee.id);
      if (original !== "none") assignments.set(employee.id, original);
    });

    let evaluation = evaluateWeekendSimulation(
      candidates,
      assignments,
      originalAssignments,
    );
    for (let iteration = 0; iteration < 100; iteration += 1) {
      let bestAction = null;
      let bestEvaluation = evaluation;

      candidates.forEach((employee) => {
        if (serviceWeekendOwnerKey(employee.id)) return;
        const currentWeekend = assignments.get(employee.id);
        assignments.set(
          employee.id,
          currentWeekend === "weekend_a" ? "weekend_b" : "weekend_a",
        );
        const candidateEvaluation = evaluateWeekendSimulation(
          candidates,
          assignments,
          originalAssignments,
        );
        assignments.set(employee.id, currentWeekend);
        if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
          bestEvaluation = candidateEvaluation;
          bestAction = { type: "move", first: employee.id };
        }
      });

      for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < candidates.length;
          rightIndex += 1
        ) {
          const left = candidates[leftIndex];
          const right = candidates[rightIndex];
          if (
            serviceWeekendOwnerKey(left.id) ||
            serviceWeekendOwnerKey(right.id)
          ) {
            continue;
          }
          const leftWeekend = assignments.get(left.id);
          const rightWeekend = assignments.get(right.id);
          if (leftWeekend === rightWeekend) continue;
          assignments.set(left.id, rightWeekend);
          assignments.set(right.id, leftWeekend);
          const candidateEvaluation = evaluateWeekendSimulation(
            candidates,
            assignments,
            originalAssignments,
          );
          assignments.set(left.id, leftWeekend);
          assignments.set(right.id, rightWeekend);
          if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
            bestEvaluation = candidateEvaluation;
            bestAction = { type: "swap", first: left.id, second: right.id };
          }
        }
      }

      if (!bestAction) break;
      if (bestAction.type === "move") {
        assignments.set(
          bestAction.first,
          assignments.get(bestAction.first) === "weekend_a" ? "weekend_b" : "weekend_a",
        );
      } else {
        const firstWeekend = assignments.get(bestAction.first);
        assignments.set(bestAction.first, assignments.get(bestAction.second));
        assignments.set(bestAction.second, firstWeekend);
      }
      evaluation = bestEvaluation;
    }

    const currentGroups = {
      weekend_a: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_a",
      ),
      weekend_b: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_b",
      ),
    };
    const current = {
      weekend_a: weekendSimulationMetrics(currentGroups.weekend_a),
      weekend_b: weekendSimulationMetrics(currentGroups.weekend_b),
    };
    const resultAssignments = candidates
      .map((employee) => {
        const originalWeekend = originalAssignments.get(employee.id);
        const proposedWeekend = assignments.get(employee.id);
        return {
          employee,
          originalWeekend,
          proposedWeekend,
          ownerWeekend: serviceWeekendOwnerKey(employee.id),
          isWeekendOwner: Boolean(serviceWeekendOwnerKey(employee.id)),
          changeType:
            originalWeekend === proposedWeekend ? "unchanged" : "switched",
        };
      })
      .sort(
        (left, right) =>
          left.proposedWeekend.localeCompare(right.proposedWeekend) ||
          sortEmployees(left.employee, right.employee),
      );

    return {
      employeeCount: candidates.length,
      unassignedCount,
      fixedAssignmentCount: resultAssignments.filter(
        (assignment) => assignment.originalWeekend !== "none",
      ).length,
      switchedCount: resultAssignments.filter(
        (assignment) => assignment.changeType === "switched",
      ).length,
      newAssignmentCount: 0,
      current,
      proposed: evaluation.metrics,
      currentBalanceScore: weekendSimulationBalanceScore(current),
      proposedBalanceScore: evaluation.balanceScore,
      assignments: resultAssignments,
    };
  }

  function evaluateWeekendSimulation(
    employees,
    assignments,
    originalAssignments,
  ) {
    const groups = { weekend_a: [], weekend_b: [] };
    employees.forEach((employee) => {
      const weekend = assignments.get(employee.id);
      if (groups[weekend]) groups[weekend].push(employee);
    });
    const metrics = {
      weekend_a: weekendSimulationMetrics(groups.weekend_a),
      weekend_b: weekendSimulationMetrics(groups.weekend_b),
    };
    const switchedCount = employees.filter((employee) => {
      const original = originalAssignments.get(employee.id);
      return original !== "none" && original !== assignments.get(employee.id);
    }).length;
    const balanceScore = weekendSimulationBalanceScore(metrics);
    return {
      metrics,
      balanceScore,
      switchedCount,
      score: balanceScore + switchedCount * 0.75,
    };
  }

  function weekendSimulationMetrics(employees) {
    const employmentPercent = employees.reduce(
      (sum, employee) => sum + employee.employmentPercent,
      0,
    );
    return {
      headcount: employees.length,
      employmentPercent,
      fte: employmentPercent / 100,
      onboarding: employees.filter(
        (employee) => employee.employmentStatus === "onboarding",
      ).length,
      fachweiterbildung: employees.filter((employee) =>
        hasCurrentQualification(employee, "fachweiterbildungIA"),
      ).length,
      praxisanleiter: employees.filter((employee) =>
        hasCurrentQualification(employee, "praxisanleiter"),
      ).length,
    };
  }

  function weekendSimulationBalanceScore(metrics) {
    const difference = (key) =>
      Math.abs((metrics.weekend_a[key] || 0) - (metrics.weekend_b[key] || 0));
    return (
      difference("headcount") ** 2 +
      difference("fte") ** 2 * 2 +
      difference("onboarding") ** 2 * 1.5 +
      difference("fachweiterbildung") ** 2 * 1.5 +
      difference("praxisanleiter") ** 2 * 1.5
    );
  }

  function renderWeekendSimulationEmployee({
    employee,
    originalWeekend,
    changeType,
    isWeekendOwner,
  }) {
    const changeLabel = {
      unchanged: isWeekendOwner ? "verantwortlich" : "unverändert",
      switched: `von ${serviceWeekendLabel(originalWeekend)}`,
    }[changeType];
    return `
      <div class="weekend-simulation-employee">
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${employee.employmentPercent} % · ${escapeHtml(
              employeeStatusLabel(employee),
            )}</small>
          </span>
        </span>
        <span class="simulation-change-badge is-${changeType}">${escapeHtml(
          changeLabel,
        )}</span>
        <span>${hasCurrentQualification(employee, "fachweiterbildungIA") ? "FWB" : "–"}</span>
        <span>${hasCurrentQualification(employee, "praxisanleiter") ? "PA" : "–"}</span>
      </div>
    `;
  }

  function renderWeekendDistribution() {
    elements.weekendDistributionContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendDistributionContent);
  }

  function renderWeekendOverview() {
    elements.weekendOverviewContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendOverviewContent, true);
  }

  function renderWeekendDistributionMarkup() {
    const distribution = getWeekendDistributionData();
    const keys = ["weekend_a", "weekend_b", "none"];
    const weekendA = distribution.weekend_a.metrics;
    const weekendB = distribution.weekend_b.metrics;
    const comparisonRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Stellenanteil kumuliert", "employmentPercent", (value) => `${value} %`],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];

    return `
      <section class="panel weekend-comparison-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Kumulativer Vergleich</p>
            <h2>Struktur der Dienstwochenenden</h2>
          </div>
          <span class="weekend-comparison-note">
            ${escapeHtml(serviceWeekendLabel("weekend_a"))} ↔ ${escapeHtml(serviceWeekendLabel("weekend_b"))}: ${Math.abs(weekendA.employmentPercent - weekendB.employmentPercent)} %
            Unterschied beim Stellenanteil
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th scope="col">Kennzahl</th>
                ${keys
                  .map(
                    (key) =>
                      `<th scope="col">${escapeHtml(serviceWeekendLabel(key))}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${comparisonRows
                .map(
                  ([label, property, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      ${keys
                        .map((key) => {
                          const metrics = distribution[key].metrics;
                          const share =
                            ["fachweiterbildung", "praxisanleiter", "onboarding"].includes(
                              property,
                            ) && metrics.headcount
                              ? ` <small>(${percentage(
                                  metrics[property],
                                  metrics.headcount,
                                )} %)</small>`
                              : "";
                          return `<td><strong>${escapeHtml(
                            formatter(metrics[property]),
                          )}</strong>${share}</td>`;
                        })
                        .join("")}
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-group-grid weekend-distribution-groups">
        ${keys
          .map((key) => {
            const group = distribution[key];
            return `
              <section class="panel weekend-distribution-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Festes Dienstwochenende</p>
                    <h2>${escapeHtml(serviceWeekendLabel(key))}</h2>
                  </div>
                  <button
                    class="button button-ghost button-compact"
                    type="button"
                    data-filter-weekend="${key}"
                  >
                    In Mitarbeiterliste
                  </button>
                </div>
                <div class="weekend-group-metrics">
                  <span><strong>${group.metrics.headcount}</strong> Personen</span>
                  <span><strong>${group.metrics.employmentPercent} %</strong> Stellenanteil</span>
                  <span><strong>${formatDecimal(group.metrics.fte)}</strong> VZÄ</span>
                </div>
                <div class="weekend-distribution-list">
                  ${
                    group.employees
                      .map((employee) => renderWeekendEmployee(employee))
                      .join("") ||
                    '<p class="field-hint">Keine aktiven Mitarbeiter zugeordnet.</p>'
                  }
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function getWeekendDistributionData() {
    const groups = Object.fromEntries(
      Object.keys(SERVICE_WEEKENDS).map((key) => [key, []]),
    );
    activeEmployeeList()
      .sort(sortEmployees)
      .forEach((employee) => groups[employee.serviceWeekend].push(employee));

    return Object.fromEntries(
      Object.entries(groups).map(([key, employees]) => {
        const employmentPercent = employees.reduce(
          (sum, employee) => sum + employee.employmentPercent,
          0,
        );
        return [
          key,
          {
            employees,
            metrics: {
              headcount: employees.length,
              employmentPercent,
              fte: employmentPercent / 100,
              onboarding: employees.filter(
                (employee) => employee.employmentStatus === "onboarding",
              ).length,
              fachweiterbildung: employees.filter(
                (employee) =>
                  hasCurrentQualification(employee, "fachweiterbildungIA"),
              ).length,
              praxisanleiter: employees.filter(
                (employee) => hasCurrentQualification(employee, "praxisanleiter"),
              ).length,
            },
          },
        ];
      }),
    );
  }

  function renderWeekendEmployee(employee) {
    const fachweiterbildung = getQualificationDisplayState(
      employee,
      "fachweiterbildungIA",
    );
    const praxisanleiter = getQualificationDisplayState(
      employee,
      "praxisanleiter",
    );
    return `
      <button
        class="weekend-distribution-employee"
        type="button"
        data-weekend-employee="${employee.id}"
      >
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${escapeHtml(employeeStatusLabel(employee))}${
              serviceWeekendOwnerKey(employee.id)
                ? " · Verantwortliche Person"
                : ""
            }</small>
          </span>
        </span>
        <strong class="weekend-employment-percent">${employee.employmentPercent} %</strong>
        <span class="weekend-qualification-state ${fachweiterbildung.className}"
          title="Fachweiterbildung I/A: ${fachweiterbildung.title}">
          ${fachweiterbildung.symbol} FWB I/A
        </span>
        <span class="weekend-qualification-state ${praxisanleiter.className}"
          title="Praxisanleiter/in: ${praxisanleiter.title}">
          ${praxisanleiter.symbol} PA
        </span>
      </button>
    `;
  }

  function hasCurrentQualification(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) return false;
    const expiry = employee.qualificationExpiries[qualificationId];
    return !expiry || expiry >= todayIso();
  }

  function getQualificationDisplayState(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) {
      return { symbol: "×", className: "", title: "nicht vorhanden" };
    }
    if (!hasCurrentQualification(employee, qualificationId)) {
      return { symbol: "!", className: "is-expired", title: "abgelaufen" };
    }
    return { symbol: "✓", className: "is-qualified", title: "vorhanden" };
  }

  function bindWeekendDistributionActions(container, closeDialog = false) {
    container
      .querySelectorAll("[data-filter-weekend]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          employeeWeekendFilter = button.dataset.filterWeekend;
          if (closeDialog) elements.weekendOverviewDialog.close();
          showView("employees");
          renderEmployees();
        }),
      );
    container
      .querySelectorAll("[data-weekend-employee]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          openEmployeeDossier(button.dataset.weekendEmployee),
        ),
      );
  }

  function printWeekendOverview() {
    document.body.classList.add("print-weekend-overview");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-weekend-overview"), 0);
  }

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

  function toggleVacationPlannerMaximized() {
    setVacationPlannerMaximized(
      !elements.vacationPlannerWidget.classList.contains("is-maximized"),
    );
  }

  function setVacationPlannerMaximized(maximized) {
    const active = Boolean(maximized);
    const widget = elements.vacationPlannerWidget;
    if (active && !vacationPlannerWidgetAnchor) {
      vacationPlannerWidgetAnchor = document.createComment(
        "vacation-planner-widget-anchor",
      );
      widget.parentNode.insertBefore(vacationPlannerWidgetAnchor, widget);
      document.body.append(widget);
    } else if (!active && vacationPlannerWidgetAnchor) {
      vacationPlannerWidgetAnchor.parentNode?.insertBefore(
        widget,
        vacationPlannerWidgetAnchor,
      );
      vacationPlannerWidgetAnchor.remove();
      vacationPlannerWidgetAnchor = null;
    }
    widget.classList.toggle("is-maximized", active);
    document.body.classList.toggle("is-vacation-planner-maximized", active);
    elements.toggleVacationPlannerMaximizeButton.setAttribute(
      "aria-pressed",
      String(active),
    );
    elements.toggleVacationPlannerMaximizeButton.title = active
      ? "Planungstabelle verkleinern (Esc)"
      : "Planungstabelle maximieren";
    elements.vacationPlannerMaximizeLabel.textContent = active
      ? "Verkleinern"
      : "Maximieren";
    elements.vacationPlannerMaximizeIcon.setAttribute(
      "href",
      active ? "#icon-minimize" : "#icon-maximize",
    );
  }

  function handleVacationPlannerMaximizeKeydown(event) {
    if (
      event.key !== "Escape" ||
      !elements.vacationPlannerWidget.classList.contains("is-maximized") ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    event.preventDefault();
    setVacationPlannerMaximized(false);
    elements.toggleVacationPlannerMaximizeButton.focus();
  }

  function renderVacationPlanner() {
    renderVacationControls();
    const allEmployees = activeEmployeeList().sort(sortEmployees);
    const employees = filterVacationEmployees(allEmployees);
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, index) =>
      [
        vacationYear,
        String(vacationMonth).padStart(2, "0"),
        String(index + 1).padStart(2, "0"),
      ].join("-"),
    );
    vacationVisibleEmployeeIds = employees.map((employee) => employee.id);
    vacationVisibleDates = dates;
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    const selectedMonthLabel = dateFormat({
      month: "long",
      year: "numeric",
    }).format(new Date(vacationYear, vacationMonth - 1, 1, 12));
    const schoolVacationCoverageNote = schoolVacations.size
      ? "Hinterlegte Schulferien sind berücksichtigt; bewegliche Ferientage sind nicht enthalten."
      : "Für dieses Jahr sind keine Schulferien hinterlegt. Sie lassen sich unter Einstellungen → Schulferien ergänzen.";
    const monthEntries = state.vacationDays.filter(
      (vacationDay) =>
        getEmployee(vacationDay.employeeId)?.active &&
        vacationDay.date.startsWith(
          `${vacationYear}-${String(vacationMonth).padStart(2, "0")}-`,
        ),
    );
    const monthAbsenceCount = monthEntries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const monthDutyCount = monthEntries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const capacityDays = dates.filter((date) => {
      const stats = getPlannerDayStats(date, holidays);
      return stats.absenceCount >= stats.limit;
    }).length;
    // Die Kennzahlen beschreiben immer das gesamte Team. Ein Namensfilter
    // schraenkt nur die sichtbaren Zeilen ein, nicht die Auslastung des Monats.
    const totalEntitlement = allEmployees.reduce(
      (sum, employee) => sum + getVacationEntitlement(employee, vacationYear).total,
      0,
    );
    const totalPlanned = allEmployees.reduce(
      (sum, employee) => sum + getPlannedVacationDays(employee.id, vacationYear),
      0,
    );

    elements.vacationSummary.innerHTML = `
      ${renderSummaryChip("calendar", formatVacationNumber(totalEntitlement), "Urlaubsanspruch gesamt")}
      ${renderSummaryChip("check", totalPlanned, "Urlaubstage im Jahr geplant", "teal")}
      ${renderSummaryChip("calendar", monthAbsenceCount, "Abwesenheiten im Monat", "orange")}
      ${renderSummaryChip("users", monthDutyCount, "Dienstzusagen im Monat", "blue")}
      ${renderSummaryChip(
        "alert",
        capacityDays,
        "Tage an oder über Grenze",
        capacityDays ? "orange" : "blue",
      )}
    `;

    if (allEmployees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Aktive Mitarbeiter und Mitarbeiter in Einarbeitung erscheinen hier automatisch.",
        compact: true,
      });
      return;
    }

    if (employees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Kein Mitarbeiter gefunden",
        text: `Zur Suche „${vacationEmployeeSearchTerm}“ gibt es keinen Treffer. Leeren Sie das Suchfeld, um wieder alle ${allEmployees.length} Mitarbeiter zu sehen.`,
        compact: true,
      });
      return;
    }

    elements.vacationPlanner.innerHTML = `
      <div class="vacation-table-note">
        <span class="vacation-note-detail">
          „Urlaub“ und „Urlaub Einarbeitung“ werden vom Jahresanspruch abgezogen.
          Urlaub Einarbeitung und Dienstzusagen zählen nicht gegen die Tagesgrenze
          (${state.settings.vacationWeekdayAbsenceLimit} werktags,
          ${state.settings.vacationWeekendAbsenceLimit} an Wochenenden und Feiertagen).
          Eine Überschreitung bleibt möglich und färbt den Tag rot. Auf einem
          Dienstwochenende gleicht die Zusage eines Mitarbeiters vom jeweils anderen
          festen Wochenende einen Urlaub auf dem eigenen Wochenende aus.
        </span>
        <span class="vacation-note-detail">
          Abwesenheiten von ${escapeHtml(absenceLimitExemptProfessionNote())}
          bleiben sichtbar, zählen aber nicht gegen die Tagesgrenze.
        </span>
        ${renderPlannerKeyboardHint()}
        <span class="vacation-note-detail ${
          schoolVacations.size ? "" : "is-warning"
        }">${schoolVacationCoverageNote}</span>
        ${
          employees.length === allEmployees.length
            ? ""
            : `<span class="vacation-note-detail is-warning">Namensfilter aktiv: ${employees.length} von ${allEmployees.length} Mitarbeitern sichtbar. Die Tagesgrenzen berücksichtigen weiterhin das gesamte Team.</span>`
        }
      </div>
      <div class="vacation-table-scroll">
        <table class="vacation-table">
          <thead>
            <tr>
              <th class="vacation-employee-column" scope="col">${escapeHtml(
                selectedMonthLabel,
              )}</th>
              ${dates
                .map((date) =>
                  renderVacationDayHeader(date, holidays, schoolVacations),
                )
                .join("")}
              <th class="vacation-total-column" scope="col">Basis</th>
              <th class="vacation-total-column" scope="col">Zusatz</th>
              <th class="vacation-total-column" scope="col">Anspruch</th>
              <th class="vacation-total-column" scope="col">Geplant</th>
              <th class="vacation-total-column" scope="col">Rest</th>
            </tr>
          </thead>
          <tbody>
            ${employees
              .map((employee) =>
                renderVacationEmployeeRow(
                  employee,
                  dates,
                  holidays,
                  schoolVacations,
                ),
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    applyAccessControl();
    restoreVacationFocus();
  }

  function renderPlannerKeyboardHint() {
    const shortcuts = Object.entries(PLANNER_ENTRY_KEYS)
      .map(([key, type]) => {
        const definition = PLANNER_ENTRY_TYPES[type];
        return `<span class="vacation-shortcut">
          <kbd>${key.toLocaleUpperCase("de-DE")}</kbd>
          <i class="vacation-shortcut-symbol planner-entry-${type}" aria-hidden="true">${definition.shortLabel}</i>
          <span>${escapeHtml(definition.label)}</span>
        </span>`;
      })
      .join("");
    return `<div class="vacation-keyboard-hint">
      <strong>Tastatur:</strong>
      <span class="vacation-shortcut-list">${shortcuts}</span>
      <span class="vacation-navigation-hint">Pfeiltasten wechseln das Feld · Pos 1/Ende springen an den Monatsrand · Bild auf/ab wechseln den Monat · Umschalt + Pfeil markiert · Entf/Rücktaste löscht</span>
    </div>`;
  }

  function readVacationViewPreference() {
    const fallback = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    };
    try {
      const raw = window.localStorage?.getItem?.(VACATION_VIEW_KEY);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      const year = Number(value?.year);
      const month = Number(value?.month);
      return {
        year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
        month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
      };
    } catch {
      return fallback;
    }
  }

  function saveVacationViewPreference() {
    try {
      window.localStorage?.setItem?.(
        VACATION_VIEW_KEY,
        JSON.stringify({ year: vacationYear, month: vacationMonth }),
      );
    } catch {
      // Die Planung bleibt auch ohne verfügbaren Browserspeicher bedienbar.
    }
  }

  function renderVacationControls() {
    const availableYears = new Set([
      new Date().getFullYear() - 1,
      new Date().getFullYear(),
      new Date().getFullYear() + 1,
      new Date().getFullYear() + 2,
      vacationYear,
      ...state.vacationEntitlements.map((entry) => entry.year),
      ...state.vacationDays.map((entry) => Number(entry.date.slice(0, 4))),
      // Jahre, fuer die Schulferien hinterlegt sind, muessen aufrufbar sein -
      // sonst liessen sich weit vorausgeplante Ferien nie ansehen.
      ...schoolVacationPeriods().flatMap((period) => [
        Number(period.start.slice(0, 4)),
        Number(period.end.slice(0, 4)),
      ]),
    ]);
    elements.vacationYear.innerHTML = [...availableYears]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((a, b) => a - b)
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");
    elements.vacationYear.value = String(vacationYear);
    elements.vacationMonth.value = String(vacationMonth);
    elements.vacationEntryType.value = vacationEntryType;
    renderVacationSettingsControls();
    elements.vacationWeekendALegend.textContent =
      serviceWeekendLabel("weekend_a");
    elements.vacationWeekendBLegend.textContent =
      serviceWeekendLabel("weekend_b");
  }

  function renderVacationSettingsControls() {
    elements.vacationBaseDays.value = String(state.settings.vacationBaseDays);
    elements.vacationWeekdayAbsenceLimit.value = String(
      state.settings.vacationWeekdayAbsenceLimit,
    );
    elements.vacationWeekendAbsenceLimit.value = String(
      state.settings.vacationWeekendAbsenceLimit,
    );
    elements.vacationWeekendAReferenceSaturday.value =
      state.settings.vacationWeekendAReferenceSaturday;
    elements.vacationWeekendAReferenceLabel.textContent =
      `Referenzsamstag ${serviceWeekendLabel("weekend_a")}`;
  }

  function renderVacationDayHeader(date, holidays, schoolVacations) {
    const day = parseLocalDate(date);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const stats = getPlannerDayStats(date, holidays);
    const weekday = dateFormat({ weekday: "short" })
      .format(day)
      .replace(".", "");
    const capacityClass = stats.isOverLimit
      ? "is-over-limit"
      : stats.isAtLimit
        ? "is-at-limit"
        : "";
    const title = [
      metadata.title,
      stats.compensatedAbsenceCount
        ? `${stats.effectiveAbsenceCount} wirksame Abwesenheiten von maximal ${stats.limit} (${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} durch fremde Dienstzusage ausgeglichen)`
        : `${stats.effectiveAbsenceCount} von maximal ${stats.limit} abwesend`,
      stats.dutyCount
        ? `${stats.dutyCount} verpflichtende Dienstzusage${
            stats.dutyCount === 1 ? "" : "n"
          }`
        : "",
      stats.exemptAbsenceCount
        ? `${stats.exemptAbsenceCount} Abwesenheit${
            stats.exemptAbsenceCount === 1 ? "" : "en"
          } ohne Anrechnung auf die Tagesgrenze`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `
      <th
        class="vacation-day-column ${metadata.className} ${capacityClass}"
        scope="col"
        title="${escapeHtml(title)}"
      >
        <strong>${day.getDate()}</strong>
        <small>${escapeHtml(weekday)}</small>
        <span class="vacation-capacity" aria-label="${stats.effectiveAbsenceCount} wirksame Abwesenheiten von ${stats.limit}">
          ${stats.effectiveAbsenceCount}/${stats.limit}
        </span>
        ${
          stats.compensatedAbsenceCount
            ? `<span class="vacation-offset-count" aria-label="${stats.compensatedAbsenceCount} Abwesenheiten ausgeglichen">−${stats.compensatedAbsenceCount}</span>`
            : ""
        }
        ${
          stats.dutyCount
            ? `<span class="vacation-duty-count" aria-label="${stats.dutyCount} Dienstzusagen">D${stats.dutyCount}</span>`
            : ""
        }
        ${metadata.holiday ? '<span class="vacation-holiday-dot" aria-hidden="true"></span>' : ""}
        ${
          metadata.schoolVacation
            ? '<span class="vacation-school-vacation-dot" aria-hidden="true"></span>'
            : ""
        }
      </th>
    `;
  }

  function filterVacationEmployees(employees) {
    const searchTerm = searchKey(vacationEmployeeSearchTerm);
    if (!searchTerm) return employees;
    return employees.filter((employee) =>
      searchKey(
        [
          fullName(employee),
          employee.lastName,
          employee.firstName,
          employee.username,
        ].join(" "),
      ).includes(searchTerm),
    );
  }

  // Der Beschaeftigungsgrad bleibt in der Mitarbeiterzeile stehen; statt des
  // Beschaeftigungsstatus interessiert bei der Urlaubsplanung das feste
  // Dienstwochenende. „Kein festes Dienstwochenende“ waere in der schmalen
  // Spalte zu lang und wird deshalb gekuerzt.
  function vacationServiceWeekendLabel(employee) {
    return employee.serviceWeekend === "none"
      ? "Kein festes WE"
      : serviceWeekendLabel(employee.serviceWeekend);
  }

  // Faellt der Geburtstag auf den 29. Februar, wird er in Nicht-Schaltjahren
  // wie im Fristenmonitor am 28. Februar gefuehrt.
  function employeeBirthdayAt(employee, date) {
    const birth = parseLocalDate(employee.birthDate);
    if (!birth) return null;
    const year = Number(date.slice(0, 4));
    const observed = birthdayDateForYear(year, birth.getMonth() + 1, birth.getDate());
    if (localDateToIso(observed) !== date) return null;
    return { age: year - birth.getFullYear() };
  }

  function renderVacationEmployeeRow(employee, dates, holidays, schoolVacations) {
    const entitlement = getVacationEntitlement(employee, vacationYear);
    const planned = getPlannedVacationDays(employee.id, vacationYear);
    const remaining = entitlement.total - planned;
    const plannedEntries = new Map(
      state.vacationDays
        .filter((vacationDay) => vacationDay.employeeId === employee.id)
        .map((vacationDay) => [vacationDay.date, vacationDay]),
    );
    return `
      <tr class="${employee.active ? "" : "is-inactive"}">
        <th
          class="vacation-employee-column vacation-employee-weekend-${employee.serviceWeekend}"
          scope="row"
          title="${escapeHtml(
            [
              serviceWeekendLabel(employee.serviceWeekend),
              employeeStatusLabel(employee),
              `${employee.employmentPercent} %`,
            ].join(" · "),
          )}"
        >
          <span class="vacation-employee">
            ${renderAvatar(employee, true)}
            <span>
              <button
                class="vacation-employee-link"
                type="button"
                data-vacation-employee-overview="${employee.id}"
                aria-label="Jahresabwesenheiten von ${escapeHtml(fullName(employee))} öffnen"
              >${escapeHtml(fullName(employee))}</button>
              <small>${escapeHtml(
                vacationServiceWeekendLabel(employee),
              )} · ${employee.employmentPercent} %</small>
            </span>
          </span>
        </th>
        ${dates
          .map((date) => {
            const metadata = getVacationDayMetadata(
              date,
              holidays,
              schoolVacations,
            );
            const dayStats = getPlannerDayStats(date, holidays);
            const entry = plannedEntries.get(date);
            const entryType = entry
              ? PLANNER_ENTRY_TYPES[entry.type]
              : null;
            const ownWeekend =
              metadata.weekendGroup &&
              employee.serviceWeekend === metadata.weekendGroup;
            const birthday = employeeBirthdayAt(employee, date);
            const birthdayNote = birthday
              ? `${birthday.age}. Geburtstag`
              : "";
            return `
              <td class="vacation-day-cell ${metadata.className} ${
                dayStats.isOverLimit ? "is-over-limit" : ""
              } ${
                ownWeekend ? "is-own-weekend" : ""
              } ${birthday ? "is-birthday" : ""}">
                <button
                  type="button"
                  data-vacation-employee="${employee.id}"
                  data-vacation-date="${date}"
                  aria-pressed="${Boolean(entry)}"
                  aria-label="${escapeHtml(
                    [
                      `${fullName(employee)}: ${
                        entryType
                          ? `${entryType.label} am ${formatDate(date)}`
                          : `Eintrag am ${formatDate(date)} anlegen`
                      }`,
                      birthdayNote,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  )}"
                  title="${escapeHtml(
                    [entryType?.label, birthdayNote, metadata.title]
                      .filter(Boolean)
                      .join(" · "),
                  )}"
                  class="${entry ? `planner-entry-${entry.type}` : ""}"
                >${entryType?.shortLabel || ""}</button>
                ${
                  birthday
                    ? '<span class="vacation-birthday-marker" aria-hidden="true"></span>'
                    : ""
                }
              </td>
            `;
          })
          .join("")}
        <td class="vacation-total-column">${formatVacationNumber(entitlement.base)}</td>
        <td class="vacation-total-column">
          <input
            class="vacation-additional-input"
            type="number"
            min="0"
            max="30"
            step="0.5"
            value="${entitlement.additional}"
            data-vacation-additional-employee="${employee.id}"
            aria-label="Zusatzurlaub ${escapeHtml(fullName(employee))}"
          />
        </td>
        <td class="vacation-total-column"><strong>${formatVacationNumber(entitlement.total)}</strong></td>
        <td class="vacation-total-column">${planned}</td>
        <td class="vacation-total-column ${
          remaining < 0 ? "vacation-negative" : ""
        }"><strong>${formatVacationNumber(remaining)}</strong></td>
      </tr>
    `;
  }

  // Reine Koordinatenrechnung. Bewusst ohne DOM, damit die Navigation ohne
  // Browserumgebung pruefbar bleibt.
  function nextPlannerPosition(position, key, bounds) {
    const row = clampPlannerIndex(position.row, bounds.rowCount);
    const column = clampPlannerIndex(position.column, bounds.columnCount);
    switch (key) {
      case "ArrowLeft":
        return { row, column: Math.max(0, column - 1) };
      case "ArrowRight":
        return { row, column: clampPlannerIndex(column + 1, bounds.columnCount) };
      case "ArrowUp":
        return { row: Math.max(0, row - 1), column };
      case "ArrowDown":
        return { row: clampPlannerIndex(row + 1, bounds.rowCount), column };
      case "Home":
        return { row, column: 0 };
      case "End":
        return { row, column: clampPlannerIndex(bounds.columnCount, bounds.columnCount) };
      default:
        return { row, column };
    }
  }

  function clampPlannerIndex(value, count) {
    return Math.min(Math.max(value, 0), Math.max(0, count - 1));
  }

  // Anker und aktuelles Feld spannen ein Rechteck auf, unabhaengig davon, in
  // welche Richtung markiert wurde.
  function plannerSelectionBounds(anchor, focus) {
    return {
      rowStart: Math.min(anchor.row, focus.row),
      rowEnd: Math.max(anchor.row, focus.row),
      columnStart: Math.min(anchor.column, focus.column),
      columnEnd: Math.max(anchor.column, focus.column),
    };
  }

  function plannerSelectionPositions(anchor, focus) {
    const bounds = plannerSelectionBounds(anchor, focus);
    const positions = [];
    for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
      for (
        let column = bounds.columnStart;
        column <= bounds.columnEnd;
        column += 1
      ) {
        positions.push({ row, column });
      }
    }
    return positions;
  }

  function plannerBounds() {
    return {
      rowCount: vacationVisibleEmployeeIds.length,
      columnCount: vacationVisibleDates.length,
    };
  }

  function plannerPositionOf(employeeId, date) {
    const row = vacationVisibleEmployeeIds.indexOf(employeeId);
    const column = vacationVisibleDates.indexOf(date);
    return row < 0 || column < 0 ? null : { row, column };
  }

  function plannerCoordinates(position) {
    return {
      employeeId: vacationVisibleEmployeeIds[position.row],
      date: vacationVisibleDates[position.column],
    };
  }

  function plannerCellButton(position) {
    const { employeeId, date } = plannerCoordinates(position);
    if (!employeeId || !date) return null;
    return elements.vacationPlanner.querySelector(
      `[data-vacation-employee="${employeeId}"][data-vacation-date="${date}"]`,
    );
  }

  function currentPlannerSelection() {
    if (!vacationFocus) return [];
    return plannerSelectionPositions(
      vacationSelectionAnchor || vacationFocus,
      vacationFocus,
    );
  }

  function applyVacationSelectionHighlight() {
    elements.vacationPlanner
      .querySelectorAll(".vacation-day-cell.is-selected")
      .forEach((cell) => cell.classList.remove("is-selected"));
    // Ein einzelnes Feld zeigt der Fokusrahmen an; hervorgehoben wird nur ein
    // wirklich aufgezogener Bereich.
    if (!vacationSelectionAnchor) return;
    currentPlannerSelection().forEach((position) => {
      plannerCellButton(position)?.closest("td")?.classList.add("is-selected");
    });
  }

  function focusVacationCell(position, { keepSelection = false } = {}) {
    const button = plannerCellButton(position);
    if (!button) return;
    vacationFocus = position;
    if (!keepSelection) vacationSelectionAnchor = null;
    button.focus();
    applyVacationSelectionHighlight();
  }

  // Das Neuzeichnen ersetzt die Tabelle vollstaendig, der Fokus faellt dabei
  // auf den Body zurueck. Nur dann wird er zurueckgeholt - liegt er inzwischen
  // im Suchfeld oder in einem Dialog, bleibt er dort.
  function restoreVacationFocus() {
    applyVacationSelectionHighlight();
    if (!vacationFocus) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    plannerCellButton(vacationFocus)?.focus({ preventScroll: true });
  }

  function handleVacationPlannerKeydown(event) {
    const button = event.target.closest(
      "[data-vacation-employee][data-vacation-date]",
    );
    if (!button || event.altKey || event.ctrlKey || event.metaKey) return;
    const position = plannerPositionOf(
      button.dataset.vacationEmployee,
      button.dataset.vacationDate,
    );
    if (!position) return;
    vacationFocus = position;

    if (PLANNER_NAVIGATION_KEYS.includes(event.key)) {
      event.preventDefault();
      if (event.shiftKey && !vacationSelectionAnchor) {
        vacationSelectionAnchor = position;
      }
      focusVacationCell(nextPlannerPosition(position, event.key, plannerBounds()), {
        keepSelection: event.shiftKey,
      });
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      shiftVacationMonth(event.key === "PageUp" ? -1 : 1, position);
      return;
    }

    if (event.key === "Escape" && vacationSelectionAnchor) {
      event.preventDefault();
      vacationSelectionAnchor = null;
      applyVacationSelectionHighlight();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void applyVacationEntryToSelection("");
      return;
    }

    const key = event.key.toLocaleLowerCase("de-DE");
    if (!Object.hasOwn(PLANNER_ENTRY_KEYS, key)) return;
    event.preventDefault();
    void applyVacationEntryToSelection(PLANNER_ENTRY_KEYS[key]);
  }

  function shiftVacationMonth(offset, position) {
    const target = new Date(vacationYear, vacationMonth - 1 + offset, 1, 12);
    vacationYear = target.getFullYear();
    vacationMonth = target.getMonth() + 1;
    saveVacationViewPreference();
    // Der Tag im Monat entspricht dem Spaltenindex; kuerzere Monate werden
    // abgeschnitten.
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const nextPosition = position || vacationFocus || { row: 0, column: 0 };
    vacationFocus = {
      row: nextPosition.row,
      column: Math.min(nextPosition.column, daysInMonth - 1),
    };
    vacationSelectionAnchor = null;
    renderVacationPlanner();
  }

  // Buchstaben weisen zu, statt umzuschalten: Beim Durchtippen einer Reihe
  // waere ein Umschalten bei gleicher Eintragsart unerwartet. Entfernt wird
  // ausschliesslich mit Entf oder Rücktaste.
  async function applyVacationEntryToSelection(entryType) {
    const cells = currentPlannerSelection()
      .map(plannerCoordinates)
      .filter((cell) => cell.employeeId && cell.date);
    if (!cells.length) return;

    // Die Eintragsart der Steuerleiste zieht mit, damit Klick und Taste
    // dieselbe Auswahl verwenden.
    if (entryType) {
      vacationEntryType = entryType;
      elements.vacationEntryType.value = entryType;
    }

    const changed = cells.filter((cell) => {
      const existing = findVacationDay(cell.employeeId, cell.date);
      return entryType ? existing?.type !== entryType : Boolean(existing);
    });
    if (!changed.length) return;

    const now = new Date().toISOString();
    const scrollPosition = captureVacationScrollPosition();
    const committed = await commitStateMutation(() => {
      const removableIds = new Set();
      changed.forEach((cell) => {
        const existing = findVacationDay(cell.employeeId, cell.date);
        if (!entryType) {
          if (existing) removableIds.add(existing.id);
          return;
        }
        if (existing) {
          existing.type = entryType;
          existing.updatedAt = now;
          return;
        }
        state.vacationDays.push({
          id: createId(),
          employeeId: cell.employeeId,
          date: cell.date,
          type: entryType,
          createdAt: now,
          updatedAt: now,
        });
      });
      if (removableIds.size) {
        state.vacationDays = state.vacationDays.filter(
          (vacationDay) => !removableIds.has(vacationDay.id),
        );
      }
    });
    restoreVacationScrollPosition(scrollPosition);
    if (!committed) return;
    warnAboutVacationLimit([...new Set(changed.map((cell) => cell.date))]);
  }

  // Die Urlaubsmatrix befragt denselben Bestand aus drei Richtungen: je Tag
  // fuer die Tagesgrenze, je Mitarbeiter und Tag fuer den Zelleninhalt und je
  // Mitarbeiter fuer den Jahresverbrauch. Ohne Vorsortierung durchsucht jede
  // dieser Fragen den gesamten Bestand; bei einer gefuellten Jahresplanung
  // summiert sich das zu Millionen Vergleichen je Aufbau der Ansicht.
  //
  // Der Zwischenspeicher folgt derselben Regel wie indexById: Er gilt, solange
  // Feld und Laenge unveraendert sind. Eintraege werden ausschliesslich per
  // push ergaenzt oder per filter entfernt, beides faellt dadurch auf.
  const vacationIndexes = new WeakMap();

  function vacationIndex() {
    const collection = state.vacationDays;
    const cached = vacationIndexes.get(collection);
    if (cached && cached.size === collection.length) return cached.index;
    const byDate = new Map();
    const byEmployee = new Map();
    const byEmployeeAndDate = new Map();
    for (const entry of collection) {
      const dayEntries = byDate.get(entry.date);
      if (dayEntries) dayEntries.push(entry);
      else byDate.set(entry.date, [entry]);

      const employeeEntries = byEmployee.get(entry.employeeId);
      if (employeeEntries) employeeEntries.push(entry);
      else byEmployee.set(entry.employeeId, [entry]);

      // Doppelte Eintraege zu einem Tag sind nicht vorgesehen; sollte es sie
      // doch geben, gewinnt der erste - wie zuvor bei der Suche mit find().
      const key = `${entry.employeeId}|${entry.date}`;
      if (!byEmployeeAndDate.has(key)) byEmployeeAndDate.set(key, entry);
    }
    const index = { byDate, byEmployee, byEmployeeAndDate };
    vacationIndexes.set(collection, { size: collection.length, index });
    return index;
  }

  function vacationDaysOn(date) {
    return vacationIndex().byDate.get(date) || [];
  }

  function vacationDaysOf(employeeId) {
    return vacationIndex().byEmployee.get(employeeId) || [];
  }

  function findVacationDay(employeeId, date) {
    return vacationIndex().byEmployeeAndDate.get(`${employeeId}|${date}`);
  }

  // Eine Bereichseingabe kann viele Tage auf einmal ueberplanen. Einzelne
  // Meldungen wuerden den Bildschirm fluten, deshalb eine Sammelmeldung.
  function warnAboutVacationLimit(dates) {
    const overLimitDates = dates
      .filter((date) => getPlannerDayStats(date).isOverLimit)
      .sort((a, b) => a.localeCompare(b));
    if (!overLimitDates.length) return;

    if (overLimitDates.length > 1) {
      showToast(
        `Warnung: An ${overLimitDates.length} Tagen ist die Abwesenheitsgrenze überschritten, zuerst am ${formatDate(overLimitDates[0])}.`,
        "error",
      );
      return;
    }

    const stats = getPlannerDayStats(overLimitDates[0]);
    const compensationNote = stats.compensatedAbsenceCount
      ? ` (${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} ausgeglichen)`
      : "";
    showToast(
      `Warnung: Am ${formatDate(overLimitDates[0])} bestehen ${stats.effectiveAbsenceCount} wirksame Abwesenheiten${compensationNote}, vorgesehen sind maximal ${stats.limit}.`,
      "error",
    );
  }

  function absenceLimitExemptProfessionNote() {
    const professions = [
      ...new Set(
        activeEmployeeList()
          .map((employee) => employee.profession)
          .filter(isAbsenceLimitExemptProfession),
      ),
    ].sort((a, b) => a.localeCompare(b, "de"));
    return professions.length
      ? professions.join(", ")
      : "Medizinischen Fachangestellten, Pflegefachassistenz und Stationsassistenz";
  }

  // Sammelt alle Tage des Planungsjahres, an denen die Tagesgrenze
  // ueberschritten ist, und nennt die dabei beteiligten Mitarbeiter.
  function collectVacationConflicts(year) {
    const holidaysByYear = new Map();
    const dates = [
      ...new Set(
        state.vacationDays
          .filter((entry) => Number(entry.date.slice(0, 4)) === year)
          .map((entry) => entry.date),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return dates
      .map((date) => {
        const entryYear = Number(date.slice(0, 4));
        if (!holidaysByYear.has(entryYear)) {
          holidaysByYear.set(entryYear, getNrwHolidays(entryYear));
        }
        const stats = getPlannerDayStats(date, holidaysByYear.get(entryYear));
        if (!stats.isOverLimit) return null;
        const participants = state.vacationDays
          .filter((entry) => entry.date === date)
          .map((entry) => ({ entry, employee: getEmployee(entry.employeeId) }))
          .filter(
            ({ entry, employee }) =>
              employee?.active && PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
          )
          .sort((a, b) => sortEmployees(a.employee, b.employee));
        return { date, stats, participants };
      })
      .filter(Boolean);
  }

  function openVacationConflictOverview() {
    const conflicts = collectVacationConflicts(vacationYear);
    elements.vacationConflictSubtitle.textContent = conflicts.length
      ? `${conflicts.length} überplante Tage im Jahr ${vacationYear}`
      : `Keine überplanten Tage im Jahr ${vacationYear}`;

    elements.vacationConflictContent.innerHTML = conflicts.length
      ? `
        <p class="vacation-conflict-note">
          Aufgeführt sind alle Tage, an denen die wirksamen Abwesenheiten über
          der Tagesgrenze liegen. Abwesenheiten von
          ${escapeHtml(absenceLimitExemptProfessionNote())} sind darin nicht
          enthalten. Ein Klick auf einen Tag öffnet den zugehörigen Monat.
        </p>
        <div class="vacation-conflict-list">
          ${conflicts.map(renderVacationConflictRow).join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Überschneidungen",
          text: `Im Jahr ${vacationYear} bleibt jeder Tag innerhalb der hinterlegten Tagesgrenzen.`,
          compact: true,
        });
    elements.vacationConflictDialog.showModal();
  }

  function renderVacationConflictRow({ date, stats, participants }) {
    const weekday = dateFormat({ weekday: "long" }).format(parseLocalDate(date));
    const metadata = getVacationDayMetadata(date);
    return `
      <article class="vacation-conflict-row">
        <header>
          <button
            class="vacation-conflict-date"
            type="button"
            data-vacation-conflict-date="${date}"
          >${escapeHtml(`${weekday}, ${formatDate(date)}`)}</button>
          <span class="vacation-conflict-count">
            ${stats.effectiveAbsenceCount} von ${stats.limit} abwesend
          </span>
        </header>
        <p class="vacation-conflict-context">
          ${escapeHtml(
            [
              metadata.holiday,
              metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
              metadata.weekendGroup
                ? `Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
                : "",
              stats.compensatedAbsenceCount
                ? `${stats.absenceCount} eingetragen, ${stats.compensatedAbsenceCount} durch fremde Dienstzusage ausgeglichen`
                : "",
              stats.exemptAbsenceCount
                ? `${stats.exemptAbsenceCount} nicht angerechnete Abwesenheit${
                    stats.exemptAbsenceCount === 1 ? "" : "en"
                  }`
                : "",
            ]
              .filter(Boolean)
              .join(" · "),
          )}
        </p>
        <ul class="vacation-conflict-participants">
          ${participants
            .map(
              ({ entry, employee }) => `
                <li class="${
                  countsTowardsAbsenceLimit(employee) ? "" : "is-exempt"
                }">
                  <strong>${escapeHtml(fullName(employee))}</strong>
                  <span>${escapeHtml(
                    [
                      PLANNER_ENTRY_TYPES[entry.type].label,
                      employee.profession,
                      vacationServiceWeekendLabel(employee),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  )}</span>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
    `;
  }

  function openVacationEmployeeOverview(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;

    const entries = state.vacationDays
      .filter(
        (entry) =>
          entry.employeeId === employeeId &&
          Number(entry.date.slice(0, 4)) === vacationYear,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    const plannedVacationCount = entries.filter(
      (entry) =>
        PLANNER_ENTRY_TYPES[entry.type]?.countsVacationEntitlement,
    ).length;
    const countedAbsenceCount = entries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;

    elements.vacationEmployeeOverviewTitle.textContent =
      `${fullName(employee)} · ${vacationYear}`;
    elements.vacationEmployeeOverviewSubtitle.textContent =
      `${employeeStatusLabel(employee)} · ${employee.employmentPercent} % · ${serviceWeekendLabel(employee.serviceWeekend)}`;

    elements.vacationEmployeeOverviewContent.innerHTML = `
      <div class="dossier-summary-grid vacation-overview-summary">
        ${renderDossierItem("Planungseinträge", entries.length)}
        ${renderDossierItem("Urlaubstage", plannedVacationCount)}
        ${renderDossierItem("Zählende Abwesenheiten", countedAbsenceCount)}
        ${renderDossierItem("Dienstzusagen", dutyCount)}
      </div>
      <div class="vacation-year-legend" aria-label="Legende der Jahresübersicht">
        ${Object.entries(PLANNER_ENTRY_TYPES)
          .map(
            ([type, definition]) => `
              <span>
                <i class="vacation-year-entry planner-entry-${type}">${definition.shortLabel}</i>
                ${escapeHtml(definition.label)}
              </span>
            `,
          )
          .join("")}
        <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
        <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
      </div>
      ${renderVacationYearMatrix(entries, employee)}
    `;
    elements.vacationEmployeeOverviewDialog.showModal();
  }

  // Die Jahresmatrix ist breiter als hoch und wird deshalb quer gedruckt.
  function printVacationEmployeeOverview() {
    if (!elements.vacationEmployeeOverviewDialog.open) return;
    document.body.classList.add("print-vacation-overview");
    window.print();
    window.setTimeout(
      () => document.body.classList.remove("print-vacation-overview"),
      0,
    );
  }

  function vacationEmployeesForBlankYearPrint() {
    return state.employees
      .filter((employee) =>
        ["active", "onboarding"].includes(employee.employmentStatus),
      )
      .sort(sortEmployees);
  }

  function printBlankVacationYearOverviews() {
    const employees = vacationEmployeesForBlankYearPrint();
    if (!employees.length) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter vorhanden.",
        "error",
      );
      return;
    }

    elements.vacationBlankYearPrintSurface.innerHTML = employees
      .map(renderBlankVacationYearPrintDocument)
      .join("");
    document.body.classList.add("print-vacation-blank-year");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-vacation-blank-year");
      elements.vacationBlankYearPrintSurface.innerHTML = "";
    }, 0);
  }

  function renderBlankVacationYearPrintDocument(employee) {
    return `
      <article class="vacation-blank-year-document">
        <header class="vacation-blank-year-header">
          <div>
            <p>Leere Jahresübersicht</p>
            <h1>${escapeHtml(fullName(employee))}</h1>
          </div>
          <div class="vacation-blank-year-meta">
            <strong>${vacationYear}</strong>
            <span>${escapeHtml(
              [
                employeeStatusLabel(employee),
                `${employee.employmentPercent} %`,
                serviceWeekendLabel(employee.serviceWeekend),
              ].join(" · "),
            )}</span>
          </div>
        </header>
        <div class="vacation-blank-year-legend" aria-label="Legende">
          <span><i class="vacation-blank-holiday-swatch"></i> Feiertag NRW</span>
          <span><i class="vacation-blank-school-vacation-swatch"></i> Schulferien NRW</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
          <span><i class="vacation-blank-own-weekend-swatch"></i> Eigenes Dienstwochenende</span>
        </div>
        ${renderVacationYearMatrix([], employee)}
        <footer>
          <span>Urlaubsplanung ${vacationYear}</span>
          <span>Stand ${formatDate(todayIso())}</span>
        </footer>
      </article>
    `;
  }

  // Leere Monatsplanungen zum Ausfuellen von Hand: je Monat ein Blatt, darauf
  // alle aktiven Mitarbeiter alphabetisch untereinander und die Tage des
  // Monats als Spalten. Das Gegenstueck zu den leeren Jahresuebersichten, die
  // je Mitarbeiter ein Blatt fuellen - dieselben Beschaeftigten, dieselben
  // Kalendermerkmale, nur andersherum aufgeteilt.
  //
  // Gedruckt wird das ganze Jahr. Wer nur einen Monat braucht, waehlt im
  // Druckdialog die Seite aus; zwoelf Blaetter neu aufzubauen ist billiger als
  // eine zweite Bedienung dafuer.
  function printBlankVacationMonthPlans() {
    const employees = vacationEmployeesForBlankYearPrint();
    if (!employees.length) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter vorhanden.",
        "error",
      );
      return;
    }

    // Feiertage und Schulferien gelten fuer alle zwoelf Blaetter; einmal
    // ermittelt genuegt.
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    elements.vacationBlankMonthPrintSurface.innerHTML = Array.from(
      { length: 12 },
      (_, index) =>
        renderBlankVacationMonthPrintDocument(
          index + 1,
          employees,
          holidays,
          schoolVacations,
        ),
    ).join("");
    document.body.classList.add("print-vacation-blank-month");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-vacation-blank-month");
      elements.vacationBlankMonthPrintSurface.innerHTML = "";
    }, 0);
  }

  function renderBlankVacationMonthPrintDocument(
    month,
    employees,
    holidays,
    schoolVacations,
  ) {
    const monthLabel = dateFormat({ month: "long", year: "numeric" }).format(
      new Date(vacationYear, month - 1, 1, 12),
    );
    const daysInMonth = new Date(vacationYear, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return `
      <article class="vacation-blank-month-document">
        <header class="vacation-blank-month-header">
          <div>
            <p>Leere Monatsplanung</p>
            <h1>${escapeHtml(monthLabel)}</h1>
          </div>
          <div class="vacation-blank-month-meta">
            <strong>${employees.length}</strong>
            <span>Mitarbeiter</span>
          </div>
        </header>
        <div class="vacation-blank-year-legend" aria-label="Legende">
          <span><i class="vacation-blank-holiday-swatch"></i> Feiertag NRW</span>
          <span><i class="vacation-blank-school-vacation-swatch"></i> Schulferien NRW</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_a"></i> ${escapeHtml(serviceWeekendLabel("weekend_a"))}</span>
          <span><i class="vacation-year-weekend-swatch is-weekend_b"></i> ${escapeHtml(serviceWeekendLabel("weekend_b"))}</span>
          <span><i class="vacation-blank-own-weekend-swatch"></i> Eigenes Dienstwochenende</span>
        </div>
        <table class="vacation-blank-month-table">
          <thead>
            <tr>
              <th class="vacation-blank-month-name-column" scope="col">Mitarbeiter</th>
              ${days
                .map((day) =>
                  renderBlankVacationMonthDayHeader(
                    month,
                    day,
                    holidays,
                    schoolVacations,
                  ),
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
              .map((employee) =>
                renderBlankVacationMonthRow(
                  month,
                  days,
                  employee,
                  holidays,
                  schoolVacations,
                ),
              )
              .join("")}
          </tbody>
        </table>
        <footer>
          <span>Urlaubsplanung ${vacationYear}</span>
          <span>Stand ${formatDate(todayIso())}</span>
        </footer>
      </article>
    `;
  }

  function renderBlankVacationMonthDayHeader(
    month,
    day,
    holidays,
    schoolVacations,
  ) {
    const date = blankVacationMonthDate(month, day);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const weekday = dateFormat({ weekday: "short" }).format(parseLocalDate(date));
    return `
      <th class="${metadata.className}" scope="col" title="${escapeHtml(metadata.title)}">
        <span class="vacation-blank-month-day">${day}</span>
        <span class="vacation-blank-month-weekday">${escapeHtml(weekday)}</span>
      </th>
    `;
  }

  function renderBlankVacationMonthRow(
    month,
    days,
    employee,
    holidays,
    schoolVacations,
  ) {
    return `
      <tr>
        <th class="vacation-blank-month-name-column" scope="row">
          <strong>${escapeHtml(fullName(employee))}</strong>
          <small>${escapeHtml(
            [
              `${employee.employmentPercent} %`,
              serviceWeekendLabel(employee.serviceWeekend),
            ].join(" · "),
          )}</small>
        </th>
        ${days
          .map((day) => {
            const date = blankVacationMonthDate(month, day);
            const metadata = getVacationDayMetadata(
              date,
              holidays,
              schoolVacations,
            );
            // Das eigene Dienstwochenende hebt sich hervor - beim Ausfuellen
            // von Hand ist das die Angabe, auf die es ankommt.
            const ownWeekend =
              metadata.weekendGroup === employee.serviceWeekend
                ? "is-own-weekend"
                : "";
            return `<td class="${metadata.className} ${ownWeekend}"></td>`;
          })
          .join("")}
      </tr>
    `;
  }

  function blankVacationMonthDate(month, day) {
    return [
      vacationYear,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  function renderVacationYearMatrix(entries, employee) {
    const entriesByDate = new Map(
      entries.map((entry) => [entry.date, entry]),
    );
    const days = Array.from({ length: 31 }, (_, index) => index + 1);
    return `
      <div class="vacation-year-matrix-scroll">
        <table class="vacation-year-matrix">
          <thead>
            <tr>
              <th class="vacation-year-month-column" scope="col">Monat</th>
              ${days.map((day) => `<th scope="col">${day}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 12 }, (_, index) =>
              renderVacationYearMonthRow(
                index + 1,
                days,
                entriesByDate,
                employee,
              ),
            ).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderVacationYearMonthRow(month, days, entriesByDate, employee) {
    const monthLabel = dateFormat({ month: "long" }).format(
      new Date(vacationYear, month - 1, 1, 12),
    );
    const daysInMonth = new Date(vacationYear, month, 0).getDate();
    return `
      <tr>
        <th class="vacation-year-month-column" scope="row">${escapeHtml(monthLabel)}</th>
        ${days
          .map((day) =>
            renderVacationYearDayCell(
              month,
              day,
              daysInMonth,
              entriesByDate,
              employee,
            ),
          )
          .join("")}
      </tr>
    `;
  }

  function renderVacationYearDayCell(
    month,
    day,
    daysInMonth,
    entriesByDate,
    employee,
  ) {
    if (day > daysInMonth) {
      return '<td class="is-unavailable" aria-label="Dieser Kalendertag existiert nicht"></td>';
    }
    const date = [
      vacationYear,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
    const entry = entriesByDate.get(date);
    const entryType = entry ? PLANNER_ENTRY_TYPES[entry.type] : null;
    const metadata = getVacationDayMetadata(date);
    const parsedDate = parseLocalDate(date);
    const weekday = dateFormat({ weekday: "long" }).format(parsedDate);
    const details = [
      formatDate(date),
      weekday,
      entryType?.label,
      metadata.holiday,
      metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
      metadata.weekendGroup
        ? employee.serviceWeekend === metadata.weekendGroup
          ? `Eigenes Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
          : `Dienstwochenende ${serviceWeekendLabel(metadata.weekendGroup)}`
        : "",
    ].filter(Boolean);
    return `
      <td
        class="${metadata.className} ${
          metadata.weekendGroup === employee.serviceWeekend
            ? "is-own-weekend"
            : ""
        } ${entry ? "has-entry" : ""}"
        title="${escapeHtml(details.join(" · "))}"
        aria-label="${escapeHtml(details.join(", "))}"
      >
        ${
          entry
            ? `<span class="vacation-year-entry planner-entry-${entry.type}">${entryType.shortLabel}</span>`
            : ""
        }
      </td>
    `;
  }

  // ACHTUNG, bewusste Vereinfachung: Der Grundanspruch wird linear zum
  // Stellenumfang gekuerzt. Das Bundesurlaubsgesetz bemisst ihn dagegen nach
  // der Zahl der ARBEITSTAGE PRO WOCHE. Wer 50 Prozent auf fuenf kuerzere Tage
  // verteilt, hat weiterhin Anspruch auf die vollen 30 Tage; wer 50 Prozent
  // auf zweieinhalb Tage verteilt, auf 15.
  //
  // Fuer die Station stimmt die Rechnung, solange Teilzeit immer auch weniger
  // Arbeitstage bedeutet. Kommt Teilzeit bei voller Fuenftagewoche vor, rechnet
  // TeO systematisch zu wenig - dann muessen die Arbeitstage pro Woche am
  // Mitarbeitenden erfasst und hier statt employmentPercent verwendet werden.
  //
  // Ebenfalls nicht abgebildet: die Zwoelftelung nach Paragraf 5 BUrlG bei Ein-
  // oder Austritt im laufenden Jahr. Die Funktion kennt nur volle Kalenderjahre.
  function getVacationEntitlement(employee, year) {
    const base =
      Math.round(
        state.settings.vacationBaseDays * (employee.employmentPercent / 100) * 2,
      ) / 2;
    const stored = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employee.id && entry.year === year,
    );
    const additional = stored?.additionalDays || 0;
    return { base, additional, total: base + additional };
  }

  function getPlannedVacationDays(employeeId, year) {
    return vacationDaysOf(employeeId).filter(
      (vacationDay) =>
        Number(vacationDay.date.slice(0, 4)) === year &&
        PLANNER_ENTRY_TYPES[vacationDay.type]?.countsVacationEntitlement,
    ).length;
  }

  function getPlannerDayStats(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
  ) {
    const entries = vacationDaysOn(date).filter(
      (entry) => getEmployee(entry.employeeId)?.active,
    );
    // Berufsgruppen ausserhalb des Pflegepools bleiben aus jeder Berechnung der
    // Tagesgrenze heraus - auch aus dem Ausgleich am Dienstwochenende.
    const limitEntries = entries.filter((entry) =>
      countsTowardsAbsenceLimit(getEmployee(entry.employeeId)),
    );
    const absenceCount = limitEntries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const exemptAbsenceCount =
      entries.filter((entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence)
        .length - absenceCount;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const parsed = parseLocalDate(date);
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const ownWeekendVacationCount = weekendGroup
      ? limitEntries.filter((entry) => {
          if (entry.type !== "vacation") return false;
          return getEmployee(entry.employeeId)?.serviceWeekend === weekendGroup;
        }).length
      : 0;
    const foreignWeekendDutyCount = weekendGroup
      ? limitEntries.filter((entry) => {
          if (entry.type !== "mandatoryDuty") return false;
          const serviceWeekend = getEmployee(entry.employeeId)?.serviceWeekend;
          return (
            SERVICE_WEEKEND_KEYS.includes(serviceWeekend) &&
            serviceWeekend !== weekendGroup
          );
        }).length
      : 0;
    const compensatedAbsenceCount = Math.min(
      ownWeekendVacationCount,
      foreignWeekendDutyCount,
    );
    const effectiveAbsenceCount = Math.max(
      0,
      absenceCount - compensatedAbsenceCount,
    );
    const usesWeekendLimit =
      Boolean(holidays.get(date)) ||
      Boolean(parsed && [0, 6].includes(parsed.getDay()));
    const limit = usesWeekendLimit
      ? state.settings.vacationWeekendAbsenceLimit
      : state.settings.vacationWeekdayAbsenceLimit;
    return {
      absenceCount,
      exemptAbsenceCount,
      effectiveAbsenceCount,
      dutyCount,
      ownWeekendVacationCount,
      foreignWeekendDutyCount,
      compensatedAbsenceCount,
      weekendGroup,
      limit,
      usesWeekendLimit,
      isAtLimit: effectiveAbsenceCount === limit,
      isOverLimit: effectiveAbsenceCount > limit,
    };
  }

  function formatVacationNumber(value) {
    return numberFormat({
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  async function handleVacationPlannerClick(event) {
    const employeeOverviewButton = event.target.closest(
      "[data-vacation-employee-overview]",
    );
    if (employeeOverviewButton) {
      openVacationEmployeeOverview(
        employeeOverviewButton.dataset.vacationEmployeeOverview,
      );
      return;
    }

    const button = event.target.closest(
      "[data-vacation-employee][data-vacation-date]",
    );
    if (!button) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = button.dataset.vacationEmployee;
    const date = button.dataset.vacationDate;
    // Ein Klick setzt den Ausgangspunkt der Tastaturnavigation und beendet
    // eine bestehende Bereichsmarkierung.
    const clickedPosition = plannerPositionOf(employeeId, date);
    if (clickedPosition) {
      vacationFocus = clickedPosition;
      vacationSelectionAnchor = null;
    }
    const existing = findVacationDay(employeeId, date);
    const selectedType = Object.hasOwn(
      PLANNER_ENTRY_TYPES,
      vacationEntryType,
    )
      ? vacationEntryType
      : "vacation";
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      if (existing?.type === selectedType) {
        state.vacationDays = state.vacationDays.filter(
          (vacationDay) => vacationDay.id !== existing.id,
        );
      } else if (existing) {
        existing.type = selectedType;
        existing.updatedAt = now;
      } else {
        state.vacationDays.push({
          id: createId(),
          employeeId,
          date,
          type: selectedType,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
    restoreVacationScrollPosition(scrollPosition);
    if (!committed) return;
    warnAboutVacationLimit([date]);
  }

  async function handleVacationPlannerChange(event) {
    const input = event.target.closest("[data-vacation-additional-employee]");
    if (!input) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = input.dataset.vacationAdditionalEmployee;
    const additionalDays =
      Math.round(clampNumber(input.value, 0, 30, 0) * 2) / 2;
    const existing = state.vacationEntitlements.find(
      (entry) => entry.employeeId === employeeId && entry.year === vacationYear,
    );
    await commitStateMutation(() => {
      if (existing) {
        existing.additionalDays = additionalDays;
      } else {
        state.vacationEntitlements.push({
          employeeId,
          year: vacationYear,
          additionalDays,
        });
      }
    });
    restoreVacationScrollPosition(scrollPosition);
  }

  function captureVacationScrollPosition() {
    const container = elements.vacationPlanner.querySelector(
      ".vacation-table-scroll",
    );
    return {
      left: container?.scrollLeft || 0,
      top: container?.scrollTop || 0,
    };
  }

  function restoreVacationScrollPosition(position) {
    const container = elements.vacationPlanner.querySelector(
      ".vacation-table-scroll",
    );
    if (!container) return;
    container.scrollLeft = position.left;
    container.scrollTop = position.top;
  }

  function schoolVacationPeriods() {
    return state.settings.schoolVacationPeriods || [];
  }

  function renderSchoolVacationSettings() {
    const periods = schoolVacationPeriods();
    elements.schoolVacationCount.textContent = periods.length
      ? `${periods.length} ${
          periods.length === 1 ? "Zeitraum" : "Zeiträume"
        } hinterlegt · bis ${formatDate(periods[periods.length - 1].end)}`
      : "Keine Zeiträume hinterlegt";

    elements.schoolVacationList.innerHTML = periods.length
      ? periods
          .map(
            (period, index) => `
              <article class="school-vacation-row">
                <div>
                  <strong>${escapeHtml(period.label)}</strong>
                  <small>${formatDate(period.start)} – ${formatDate(period.end)}</small>
                </div>
                <button
                  class="icon-button danger"
                  type="button"
                  data-delete-school-vacation="${index}"
                  aria-label="${escapeHtml(
                    `${period.label} vom ${formatDate(period.start)} bis ${formatDate(period.end)} entfernen`,
                  )}"
                  title="Zeitraum entfernen"
                >
                  <svg><use href="#icon-trash"></use></svg>
                </button>
              </article>
            `,
          )
          .join("")
      : renderEmptyState({
          title: "Keine Schulferien hinterlegt",
          text: "Ergänzen Sie Zeiträume oder setzen Sie die amtliche NRW-Liste ein.",
          compact: true,
        });
  }

  async function addSchoolVacationPeriod(event) {
    event.preventDefault();
    if (!requireAdmin()) return;

    const start = elements.newSchoolVacationStart.value;
    const end = elements.newSchoolVacationEnd.value;
    const label = elements.newSchoolVacationLabel.value.trim();

    if (!parseLocalDate(start) || !parseLocalDate(end)) {
      showToast("Bitte Beginn und Ende als vollständiges Datum angeben.", "error");
      return;
    }
    if (end < start) {
      showToast("Das Ende darf nicht vor dem Beginn liegen.", "error");
      elements.newSchoolVacationEnd.focus();
      return;
    }
    if (!label) {
      showToast("Bitte eine Bezeichnung angeben, etwa „Sommerferien“.", "error");
      elements.newSchoolVacationLabel.focus();
      return;
    }
    if (schoolVacationPeriods().length >= MAX_SCHOOL_VACATION_PERIODS) {
      showToast(
        `Es sind höchstens ${MAX_SCHOOL_VACATION_PERIODS} Zeiträume möglich.`,
        "error",
      );
      return;
    }
    if (
      schoolVacationPeriods().some(
        (period) =>
          period.start === start && period.end === end && period.label === label,
      )
    ) {
      showToast("Dieser Zeitraum ist bereits hinterlegt.", "error");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = sortSchoolVacationPeriods([
        ...schoolVacationPeriods(),
        { start, end, label: label.slice(0, 60) },
      ]);
    });
    if (!committed) return;

    elements.schoolVacationForm.reset();
    renderSchoolVacationSettings();
    showToast(`„${label}“ wurde hinterlegt.`);
  }

  async function deleteSchoolVacationPeriod(index) {
    if (!requireAdmin()) return;
    const period = schoolVacationPeriods()[index];
    if (!period) return;

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = schoolVacationPeriods().filter(
        (_, position) => position !== index,
      );
    });
    if (!committed) return;

    renderSchoolVacationSettings();
    showToast(`„${period.label}“ wurde entfernt.`);
  }

  async function restoreOfficialSchoolVacations() {
    if (!requireAdmin()) return;
    const vorhandene = new Set(
      schoolVacationPeriods().map(
        (period) => `${period.start}|${period.end}|${period.label}`,
      ),
    );
    const fehlende = NRW_SCHOOL_VACATION_PERIODS.filter(
      (period) => !vorhandene.has(`${period.start}|${period.end}|${period.label}`),
    );
    if (fehlende.length === 0) {
      showToast("Alle amtlichen NRW-Termine sind bereits hinterlegt.");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.schoolVacationPeriods = sortSchoolVacationPeriods([
        ...schoolVacationPeriods(),
        ...fehlende,
      ]).slice(0, MAX_SCHOOL_VACATION_PERIODS);
    });
    if (!committed) return;

    renderSchoolVacationSettings();
    showToast(
      `${fehlende.length} amtliche NRW-Zeiträume wurden ergänzt. Eigene Einträge blieben erhalten.`,
    );
  }

  function sortSchoolVacationPeriods(periods) {
    return [...periods].sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
    );
  }

  async function saveVacationSettings() {
    const baseDays =
      Math.round(clampNumber(elements.vacationBaseDays.value, 1, 60, 30) * 2) /
      2;
    const weekdayAbsenceLimit = Math.round(
      clampNumber(
        elements.vacationWeekdayAbsenceLimit.value,
        1,
        100,
        DEFAULT_WEEKDAY_ABSENCE_LIMIT,
      ),
    );
    const weekendAbsenceLimit = Math.round(
      clampNumber(
        elements.vacationWeekendAbsenceLimit.value,
        1,
        100,
        DEFAULT_WEEKEND_ABSENCE_LIMIT,
      ),
    );
    const referenceDate = elements.vacationWeekendAReferenceSaturday.value;
    const parsedReference = parseLocalDate(referenceDate);
    if (!parsedReference || parsedReference.getDay() !== 6) {
      showToast(
        `Die Referenz für „${serviceWeekendLabel("weekend_a")}“ muss ein Samstag sein.`,
        "error",
      );
      elements.vacationWeekendAReferenceSaturday.focus();
      return;
    }
    const committed = await commitStateMutation(() => {
      state.settings.vacationBaseDays = baseDays;
      state.settings.vacationWeekendAReferenceSaturday = referenceDate;
      state.settings.vacationWeekdayAbsenceLimit = weekdayAbsenceLimit;
      state.settings.vacationWeekendAbsenceLimit = weekendAbsenceLimit;
    });
    if (committed) showToast("Planungseinstellungen wurden gespeichert.");
  }

  function getVacationDayMetadata(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
    schoolVacations = getNrwSchoolVacations(Number(date.slice(0, 4))),
  ) {
    const parsed = parseLocalDate(date);
    const holiday = holidays.get(date) || "";
    const schoolVacation = schoolVacations.get(date) || "";
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const classNames = [];
    if (weekendGroup) classNames.push(`vacation-weekend-${weekendGroup}`);
    if (holiday) classNames.push("vacation-holiday");
    if (schoolVacation) classNames.push("vacation-school-vacation");
    const titleParts = [
      holiday,
      schoolVacation ? `${schoolVacation} NRW` : "",
      weekendGroup
        ? `Dienstwochenende ${serviceWeekendLabel(weekendGroup)}`
        : "",
    ].filter(Boolean);
    return {
      weekendGroup,
      holiday,
      schoolVacation,
      className: classNames.join(" "),
      title: titleParts.length ? titleParts.join(" · ") : formatDate(date),
    };
  }

  function getWeekendRotationForDate(date) {
    const parsed = parseLocalDate(date);
    const reference = parseLocalDate(state.settings.vacationWeekendAReferenceSaturday);
    if (!parsed || !reference) return "";
    const saturday = new Date(parsed);
    if (saturday.getDay() === 0) saturday.setDate(saturday.getDate() - 1);
    if (saturday.getDay() !== 6) return "";
    const weekDifference = Math.round(
      (saturday.getTime() - reference.getTime()) / (7 * 86400000),
    );
    return ((weekDifference % 2) + 2) % 2 === 0 ? "weekend_a" : "weekend_b";
  }

  function getNrwHolidays(year) {
    const holidays = new Map([
      [`${year}-01-01`, "Neujahr"],
      [`${year}-05-01`, "Tag der Arbeit"],
      [`${year}-10-03`, "Tag der Deutschen Einheit"],
      [`${year}-11-01`, "Allerheiligen"],
      [`${year}-12-25`, "1. Weihnachtstag"],
      [`${year}-12-26`, "2. Weihnachtstag"],
    ]);
    const easterSunday = getEasterSunday(year);
    [
      [-2, "Karfreitag"],
      [1, "Ostermontag"],
      [39, "Christi Himmelfahrt"],
      [50, "Pfingstmontag"],
      [60, "Fronleichnam"],
    ].forEach(([offset, label]) => {
      const date = new Date(easterSunday);
      date.setDate(date.getDate() + offset);
      holidays.set(localDateToIso(date), label);
    });
    return holidays;
  }

  function getNrwSchoolVacations(year) {
    const vacationDays = new Map();
    schoolVacationPeriods().forEach((period) => {
      const date = parseLocalDate(period.start);
      const end = parseLocalDate(period.end);
      while (date && end && date <= end) {
        if (date.getFullYear() === year) {
          vacationDays.set(localDateToIso(date), period.label);
        }
        date.setDate(date.getDate() + 1);
      }
    });
    return vacationDays;
  }

  function getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day, 12);
  }

  function localDateToIso(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  // Ziehen mit der Maus - die Geste, die in beiden Rastern bisher fehlte.
  //
  // Urlaubsplanung: über mehrere Felder ziehen trägt die gewählte Art in alle
  // ein, so wie es Umschalt + Pfeiltaste über die Tastatur längst tut.
  // Terminkalender: einen Termin auf einen anderen Tag ziehen verschiebt ihn.
  //
  // Beides läuft über Zeigerereignisse wie das Sortieren der Seitenleiste.
  // Erst jenseits einer kleinen Schwelle gilt es als Ziehen; darunter bleibt
  // es ein Klick und behält seine bisherige Bedeutung.
  const DRAG_THRESHOLD = 6;

  let plannerDrag = null;
  let appointmentDrag = null;

  function bindDragAndDrop() {
    elements.vacationPlanner?.addEventListener("pointerdown", beginPlannerDrag);
    elements.appointmentCalendarGrid?.addEventListener("pointerdown", beginAppointmentDrag);
  }

  // ---------------------------------------------------------------- Planung

  function beginPlannerDrag(event) {
    if (event.button !== 0) return;
    const cell = event.target.closest("[data-vacation-employee][data-vacation-date]");
    if (!cell) return;
    const start = plannerPositionOf(
      cell.dataset.vacationEmployee,
      cell.dataset.vacationDate,
    );
    if (!start) return;

    plannerDrag = { start, x: event.clientX, y: event.clientY, active: false, applied: false };
    document.addEventListener("pointermove", movePlannerDrag);
    document.addEventListener("pointerup", finishPlannerDrag, { once: true });
  }

  function movePlannerDrag(event) {
    if (!plannerDrag) return;
    if (
      !plannerDrag.active &&
      Math.abs(event.clientX - plannerDrag.x) < DRAG_THRESHOLD &&
      Math.abs(event.clientY - plannerDrag.y) < DRAG_THRESHOLD
    ) {
      return;
    }

    const cell = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-vacation-employee][data-vacation-date]");
    const position = cell
      ? plannerPositionOf(cell.dataset.vacationEmployee, cell.dataset.vacationDate)
      : null;
    if (!position) return;

    plannerDrag.active = true;
    document.body.classList.add("is-dragging-planner");
    // Der aufgezogene Bereich ist derselbe wie bei Umschalt + Pfeiltaste -
    // Ausgangspunkt und aktuelles Feld spannen ihn auf.
    vacationSelectionAnchor = plannerDrag.start;
    vacationFocus = position;
    applyVacationSelectionHighlight();
  }

  async function finishPlannerDrag() {
    document.removeEventListener("pointermove", movePlannerDrag);
    document.body.classList.remove("is-dragging-planner");
    const drag = plannerDrag;
    plannerDrag = null;
    if (!drag?.active) return;

    // Der Klick nach dem Loslassen wuerde sonst zusaetzlich ein einzelnes Feld
    // umschalten.
    suppressNextClick(elements.vacationPlanner);
    await applyVacationEntryToSelection(vacationEntryType || "vacation");
  }

  // ---------------------------------------------------------------- Termine

  function beginAppointmentDrag(event) {
    if (event.button !== 0) return;
    const entry = event.target.closest("[data-appointment-card]");
    if (!entry) return;
    const appointment = getAppointment(entry.dataset.appointmentCard);
    if (!appointment) return;

    appointmentDrag = {
      id: appointment.id,
      from: appointment.date,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    document.addEventListener("pointermove", moveAppointmentDrag);
    document.addEventListener("pointerup", finishAppointmentDrag, { once: true });
  }

  function moveAppointmentDrag(event) {
    if (!appointmentDrag) return;
    if (
      !appointmentDrag.active &&
      Math.abs(event.clientX - appointmentDrag.x) < DRAG_THRESHOLD &&
      Math.abs(event.clientY - appointmentDrag.y) < DRAG_THRESHOLD
    ) {
      return;
    }
    appointmentDrag.active = true;
    document.body.classList.add("is-dragging-appointment");

    const day = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-calendar-day]");
    elements.appointmentCalendarGrid
      .querySelectorAll(".is-drop-target")
      .forEach((element) => element.classList.remove("is-drop-target"));
    if (day && day.dataset.calendarDay !== appointmentDrag.from) {
      day.classList.add("is-drop-target");
      appointmentDrag.to = day.dataset.calendarDay;
    } else {
      appointmentDrag.to = "";
    }
  }

  async function finishAppointmentDrag() {
    document.removeEventListener("pointermove", moveAppointmentDrag);
    document.body.classList.remove("is-dragging-appointment");
    elements.appointmentCalendarGrid
      ?.querySelectorAll(".is-drop-target")
      .forEach((element) => element.classList.remove("is-drop-target"));
    const drag = appointmentDrag;
    appointmentDrag = null;
    if (!drag?.active) return;

    // Ohne diesen Riegel oeffnete das Loslassen anschliessend die
    // Schnellansicht des gezogenen Termins.
    suppressNextClick(elements.appointmentCalendarGrid);
    if (!drag.to || drag.to === drag.from) return;
    await moveAppointmentToDate(drag.id, drag.to);
  }

  async function moveAppointmentToDate(appointmentId, date) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;
    const now = new Date().toISOString();
    const committed = await commitStateMutation(
      () => {
        const target = state.appointments.find((entry) => entry.id === appointmentId);
        if (!target) return;
        target.date = date;
        target.updatedAt = now;
      },
      { undo: "Termin verschoben" },
    );
    if (committed) {
      showUndoToast(`„${appointment.title}“ liegt jetzt am ${formatDate(date)}.`);
    }
  }

  // Ein Zeigerdruck endet immer mit einem Klick. Nach einem Ziehen war der
  // aber nicht gemeint - dieser Riegel faengt genau den einen ab.
  function suppressNextClick(element) {
    element?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true, once: true });
  }

  function openBulkEditDialog() {
    if (selectedEmployeeIds.size === 0) return;
    elements.bulkEditForm.reset();
    elements.bulkEditSubtitle.textContent = `${selectedEmployeeIds.size} Mitarbeiter werden gemeinsam bearbeitet.`;
    elements.bulkProfession.innerHTML = [
      '<option value="">Nicht ändern</option>',
      ...state.catalogs.professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    elements.bulkQualification.innerHTML = [
      '<option value="">Keine auswählen</option>',
      ...state.catalogs.qualifications.map(
        (qualification) =>
          `<option value="${qualification.id}">${escapeHtml(qualification.label)}</option>`,
      ),
    ].join("");
    elements.bulkServiceWeekend.innerHTML = serviceWeekendOptionsMarkup({
      includeUnchanged: true,
    });
    elements.bulkEditDialog.showModal();
    captureCleanForm(elements.bulkEditForm);
  }

  async function handleBulkEditSubmit(event) {
    event.preventDefault();
    if (selectedEmployeeIds.size === 0) return;
    const active = elements.bulkActive.value;
    const profession = elements.bulkProfession.value;
    const weekend = elements.bulkServiceWeekend.value;
    const qualificationId = elements.bulkQualification.value;
    const qualificationState = elements.bulkQualificationState.value;
    if (!active && !profession && !weekend && !(qualificationId && qualificationState)) {
      showToast("Bitte mindestens eine Änderung auswählen.", "error");
      return;
    }
    if (weekend) {
      const protectedEmployees = [...selectedEmployeeIds]
        .map(getEmployee)
        .filter(
          (employee) =>
            employee &&
            serviceWeekendOwnerKey(employee.id) &&
            serviceWeekendOwnerKey(employee.id) !== weekend,
        );
      if (protectedEmployees.length) {
        showToast(
          `${protectedEmployees
            .map(fullName)
            .join(
              ", ",
            )} kann als verantwortliche Person nicht in ein anderes Dienstwochenende verschoben werden.`,
          "error",
        );
        return;
      }
    }
    if (
      qualificationState === "remove" &&
      LEADERSHIP_QUALIFICATION_IDS.includes(qualificationId)
    ) {
      const protectedEmployees = [...selectedEmployeeIds]
        .map(getEmployee)
        .filter(
          (employee) =>
            employee &&
            serviceWeekendOwnerKey(employee.id) &&
            !LEADERSHIP_QUALIFICATION_IDS.some(
              (id) =>
                id !== qualificationId && employee.qualifications[id],
            ),
        );
      if (protectedEmployees.length) {
        showToast(
          `Die Leitungsfunktion von ${protectedEmployees
            .map(fullName)
            .join(
              ", ",
            )} kann erst nach Änderung der Dienstwochenendzuweisung entfernt werden.`,
          "error",
        );
        return;
      }
    }
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.employees.forEach((employee) => {
        if (!selectedEmployeeIds.has(employee.id)) return;
        if (active) {
          employee.employmentStatus = active;
          employee.active = active !== "inactive";
        }
        if (profession) employee.profession = profession;
        if (weekend) employee.serviceWeekend = weekend;
        if (qualificationId && qualificationState) {
          employee.qualifications[qualificationId] = qualificationState === "add";
          if (qualificationState === "remove") {
            delete employee.qualificationExpiries[qualificationId];
          }
        }
        employee.updatedAt = now;
      });
    }, { undo: `Massenänderung an ${selectedEmployeeIds.size} Mitarbeitern` });
    if (!committed) return;
    markFormClean(elements.bulkEditForm);
    elements.bulkEditDialog.close();
    const changedCount = selectedEmployeeIds.size;
    selectedEmployeeIds.clear();
    showUndoToast(`${changedCount} Mitarbeiter wurden aktualisiert.`);
  }

  function openDataQualityDialog() {
    const issues = getDataQualityIssues();
    elements.dataQualityContent.innerHTML = issues.length
      ? `<div class="quality-issue-list">${issues
          .map(
            (issue) => `
              <button
                class="quality-issue ${issue.severity === "high" ? "is-high" : ""}"
                type="button"
                data-quality-employee="${issue.employeeId}"
              >
                <span class="status-badge ${issue.severity === "high" ? "expired" : "open"}">
                  ${issue.severity === "high" ? "Prüfen" : "Hinweis"}
                </span>
                <span>
                  <strong>${escapeHtml(issue.title)}</strong>
                  <small>${escapeHtml(issue.detail)}</small>
                </span>
              </button>
            `,
          )
          .join("")}</div>`
      : renderEmptyState({
          title: "Keine Auffälligkeiten gefunden",
          text: "Die automatischen Plausibilitätsprüfungen melden aktuell keine Probleme.",
          compact: true,
        });
    elements.dataQualityContent
      .querySelectorAll("[data-quality-employee]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          elements.dataQualityDialog.close();
          openEmployeeDialog(button.dataset.qualityEmployee);
        }),
      );
    elements.dataQualityDialog.showModal();
  }

  function getDataQualityIssues() {
    const issues = [];
    state.employees.forEach((employee, index) => {
      const normalizedEmail = employee.email.trim().toLocaleLowerCase("de-DE");
      if (employee.active && !employee.email && !employee.phone) {
        issues.push({
          employeeId: employee.id,
          severity: "low",
          title: `${fullName(employee)} ohne Kontaktdaten`,
          detail: "Weder E-Mail-Adresse noch Telefonnummer sind hinterlegt.",
        });
      }
      if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        issues.push({
          employeeId: employee.id,
          severity: "high",
          title: `${fullName(employee)} mit auffälliger E-Mail-Adresse`,
          detail: employee.email,
        });
      }
      if (employee.phone && !/^[+\d][\d\s()/.-]{5,}$/.test(employee.phone)) {
        issues.push({
          employeeId: employee.id,
          severity: "low",
          title: `${fullName(employee)} mit auffälliger Telefonnummer`,
          detail: employee.phone,
        });
      }
      state.employees.slice(index + 1).forEach((other) => {
        const sameName =
          fullName(employee).toLocaleLowerCase("de-DE") ===
          fullName(other).toLocaleLowerCase("de-DE");
        const sameBirthDate =
          employee.birthDate && employee.birthDate === other.birthDate;
        const sameEmail =
          normalizedEmail &&
          normalizedEmail === other.email.trim().toLocaleLowerCase("de-DE");
        if ((sameName && sameBirthDate) || sameEmail) {
          issues.push({
            employeeId: employee.id,
            severity: "high",
            title: `Mögliche Dublette: ${fullName(employee)}`,
            detail: `Ähnlichkeit mit ${fullName(other)} (${sameEmail ? "gleiche E-Mail" : "Name und Geburtsdatum"})`,
          });
        }
      });
    });
    return issues;
  }

  function openAuditLogDialog() {
    if (!requireAdmin()) return;
    elements.auditLogContent.innerHTML = state.auditLog.length
      ? `<div class="audit-list">${state.auditLog
          .map(
            (entry) => `
              <div class="audit-row">
                <span>${formatDateTime(entry.timestamp)}</span>
                <strong>${escapeHtml(entry.username)}</strong>
                <span>${escapeHtml(entry.action)}</span>
              </div>
            `,
          )
          .join("")}</div>`
      : renderEmptyState({
          title: "Noch keine Änderungen protokolliert",
          text: "Neue Änderungen werden ab dieser Anwendungsversion lokal aufgezeichnet.",
          compact: true,
        });
    elements.auditLogDialog.showModal();
  }

  function exportAuditLogCsv() {
    if (!requireAdmin() || state.auditLog.length === 0) {
      showToast("Das Änderungsprotokoll enthält noch keine Einträge.", "error");
      return;
    }
    downloadCsv(
      `teo-aenderungsprotokoll_${todayIso()}.csv`,
      ["Zeitpunkt", "Benutzer", "Änderung"],
      state.auditLog.map((entry) => [
        formatDateTime(entry.timestamp),
        entry.username,
        entry.action,
      ]),
    );
  }

  function renderRecentEmployees() {
    const employees = [...state.employees]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 4);

    if (employees.length === 0) {
      elements.recentEmployees.innerHTML = renderEmptyState({
        title: "Das Team ist noch leer",
        text: "Nach dem ersten Eintrag erscheinen die zuletzt bearbeiteten Mitarbeiter hier.",
        compact: true,
      });
      return;
    }

    elements.recentEmployees.innerHTML = `
      <div class="employee-strip">
        ${employees
          .map(
            (employee) => `
              <button
                class="employee-mini"
                type="button"
                data-edit-recent-employee="${employee.id}"
                aria-label="${escapeHtml(fullName(employee))} bearbeiten"
              >
                ${renderAvatar(employee)}
                <span>
                  <strong>${escapeHtml(fullName(employee))}</strong>
                  <small>${escapeHtml(
                    employee.profession || "Beruf nicht angegeben",
                  )} · ${escapeHtml(employeeStatusLabel(employee))}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderEmployees() {
    renderEmployeeFilterOptions();
    renderViewFilterChips("employees");
    const filtered = filteredEmployeesForTable();
    updateEmailExportButton();
    updateUsernameExportButton();
    updatePhoneListExportButton();

    updateEmployeeBulkBar();

    if (state.employees.length === 0) {
      elements.employeeTable.innerHTML = renderEmptyState({
        title: "Noch keine Mitarbeiter angelegt",
        text: "Erfassen Sie Stammdaten, Beschäftigungsumfang und Zusatzqualifikationen.",
        buttonText: "Ersten Mitarbeiter anlegen",
        buttonAttribute: "data-empty-add-employee",
      });
      elements.employeeTable
        .querySelector("[data-empty-add-employee]")
        ?.addEventListener("click", () => openEmployeeDialog());
      return;
    }

    if (filtered.length === 0) {
      elements.employeeTable.innerHTML = renderEmptyState({
        title: "Keine passenden Mitarbeiter",
        text: "Ändern Sie den Suchbegriff oder den ausgewählten Statusfilter.",
        compact: true,
      });
      return;
    }

    elements.employeeTable.innerHTML = `
      <div class="table-scroll">
        <table class="data-table employee-table"${employeeTableStyle()}>
          <thead>
            <tr>
              <th class="selection-column">
                <input
                  type="checkbox"
                  data-select-all-employees
                  aria-label="Alle sichtbaren Mitarbeiter auswählen"
                  ${filtered.every((employee) => selectedEmployeeIds.has(employee.id)) ? "checked" : ""}
                />
              </th>
              ${renderEmployeeSortHeader("name", "Mitarbeiter")}
              ${visibleEmployeeColumns()
                .map((column) => renderEmployeeSortHeader(column.key, column.label))
                .join("")}
              <th><span class="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(renderEmployeeRow).join("")}
          </tbody>
        </table>
      </div>
    `;
    renderEmployeeInspector();
  }

  function filteredEmployeesForTable() {
    return [...state.employees]
      .filter((employee) => {
        if (
          employeeStatusFilter !== "all" &&
          (employeeStatusFilter === "employed"
            ? employee.employmentStatus === "inactive"
            : employee.employmentStatus !== employeeStatusFilter)
        ) {
          return false;
        }
        if (
          employeeProfessionFilter !== "all" &&
          employee.profession !== employeeProfessionFilter
        ) {
          return false;
        }
        if (
          employeeQualificationFilter === "none" &&
          selectedQualificationCount(employee) > 0
        ) {
          return false;
        }
        if (
          !["all", "none"].includes(employeeQualificationFilter) &&
          !employee.qualifications[employeeQualificationFilter]
        ) {
          return false;
        }
        if (
          employeeWeekendFilter !== "all" &&
          employee.serviceWeekend !== employeeWeekendFilter
        ) {
          return false;
        }
        if (!employeeSearchTerm) return true;

        const haystack = searchKey(
          [employee.firstName, employee.lastName].join(" "),
        );
        return haystack.includes(employeeSearchTerm);
      })
      .sort(compareEmployeesForTable);
  }

  function renderEmployeeRow(employee) {
    const selectedQualifications = Object.entries(employee.qualifications)
      .filter(([, selected]) => selected)
      .map(([key]) => qualificationLabel(key));
    const trainingStats = getEmployeeTrainingStats(employee.id);
    const cells = employeeRowCells(employee, { selectedQualifications, trainingStats });

    return `
      <tr data-employee-row="${employee.id}" tabindex="0" class="${employeeInspectorId === employee.id ? "is-inspected" : ""}">
        <td class="selection-column">
          <input
            type="checkbox"
            data-select-employee="${employee.id}"
            aria-label="${escapeHtml(fullName(employee))} auswählen"
            ${selectedEmployeeIds.has(employee.id) ? "checked" : ""}
          />
        </td>
        <td data-column="name"${employeeColumnStyle("name")}>
          <div class="employee-cell">
            ${renderAvatar(employee)}
            <div>
              <strong>${escapeHtml(fullName(employee))}</strong>
              <small>${escapeHtml(
                [
                  employee.username
                    ? `Benutzername: ${employee.username}`
                    : "",
                  employee.email || employee.phone || "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Keine Kontaktdaten",
              )}</small>
            </div>
          </div>
        </td>
        ${visibleEmployeeColumns()
          .map((column) => cells[column.key])
          .join("")}
        <td>
          <div class="table-actions">
            <button
              class="icon-button"
              type="button"
              data-action="view-employee"
              data-id="${employee.id}"
              aria-label="Übersicht für ${escapeHtml(fullName(employee))} öffnen"
              title="Mitarbeiterakte"
            >
              <svg><use href="#icon-more"></use></svg>
            </button>
            <span>
            <button
              class="icon-button"
              type="button"
              data-action="edit-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="toggle-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} ${
                employee.active ? "deaktivieren" : "aktivieren"
              }"
              title="${employee.active ? "Deaktivieren" : "Aktivieren"}"
            >
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-employee"
              data-id="${employee.id}"
              aria-label="${escapeHtml(fullName(employee))} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
            </span>
          </div>
        </td>
      </tr>
    `;
  }

  // Die wählbaren Spalten der Mitarbeitertabelle. Name, Auswahl und Aktionen
  // stehen immer; alles dazwischen lässt sich abwählen.
  function employeeRowCells(employee, { selectedQualifications, trainingStats }) {
    return {
      profession: `
        <td data-column="profession" class="${pinnedEmployeeColumn === "profession" ? "is-pinned-column" : ""}"${employeeColumnStyle("profession")}>
          <span class="profession-cell">
            <strong>${escapeHtml(employee.profession)}</strong>
            <small>Dienstwochenende: ${escapeHtml(
              serviceWeekendLabel(employee.serviceWeekend),
            )}</small>
          </span>
        </td>
      `,
      employment: `
        <td data-column="employment" class="${pinnedEmployeeColumn === "employment" ? "is-pinned-column" : ""}"${employeeColumnStyle("employment")}><strong>${employee.employmentPercent}&thinsp;%</strong></td>
      `,
      qualifications: `
        <td data-column="qualifications" class="${pinnedEmployeeColumn === "qualifications" ? "is-pinned-column" : ""}"${employeeColumnStyle("qualifications")}>
          <div class="qualification-tags">
            ${
              selectedQualifications.length
                ? selectedQualifications
                    .slice(0, 2)
                    .map((qualification) => `<span class="tag">${escapeHtml(qualification)}</span>`)
                    .join("") +
                  (selectedQualifications.length > 2
                    ? `<span class="tag tag-muted">+${selectedQualifications.length - 2}</span>`
                    : "")
                : '<span class="tag tag-muted">Keine</span>'
            }
          </div>
        </td>
      `,
      trainings: `
        <td data-column="trainings" class="${pinnedEmployeeColumn === "trainings" ? "is-pinned-column" : ""}"${employeeColumnStyle("trainings")}>
          <div class="table-progress">
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(fullName(employee))}: ${trainingStats.percent} Prozent der Pflichtfortbildungen aktuell"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${trainingStats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${trainingStats.percent}%` })}></div>
            </div>
            <span>${trainingStats.current}/${trainingStats.total}</span>
          </div>
        </td>
      `,
      status: `
        <td data-column="status" class="${pinnedEmployeeColumn === "status" ? "is-pinned-column" : ""}"${employeeColumnStyle("status")}>
          <span class="status-badge ${
            employee.employmentStatus === "inactive"
              ? "inactive"
              : employee.employmentStatus === "onboarding"
                ? "onboarding"
                : ""
          }">
            ${escapeHtml(employeeStatusLabel(employee))}
          </span>
        </td>
      `,
    };
  }

  function renderEmployeeSortHeader(key, label) {
    const active = employeeSortKey === key;
    const direction = active ? (employeeSortDirection === "asc" ? "▲" : "▼") : "";
    return `
      <th data-column="${key}" class="${pinnedEmployeeColumn === key ? "is-pinned-column" : ""}"${employeeColumnStyle(key)}>
        <button
          class="table-sort-button ${active ? "is-active" : ""}"
          type="button"
          data-employee-sort="${key}"
          aria-label="${escapeHtml(label)} sortieren"
        >
          ${escapeHtml(label)} <span aria-hidden="true">${direction}</span>
        </button>
        <span class="column-resize-handle" data-resize-employee-column="${key}" aria-hidden="true"></span>
      </th>
    `;
  }

  function compareEmployeesForTable(a, b) {
    const direction = employeeSortDirection === "asc" ? 1 : -1;
    const values = {
      name: () => sortEmployees(a, b),
      profession: () => a.profession.localeCompare(b.profession, "de"),
      employment: () => a.employmentPercent - b.employmentPercent,
      qualifications: () =>
        selectedQualificationCount(a) - selectedQualificationCount(b),
      trainings: () =>
        getEmployeeTrainingStats(a.id).percent - getEmployeeTrainingStats(b.id).percent,
      status: () =>
        employmentStatusOrder(a.employmentStatus) -
        employmentStatusOrder(b.employmentStatus),
    };
    return direction * (values[employeeSortKey]?.() || sortEmployees(a, b));
  }

  function selectedQualificationCount(employee) {
    return Object.values(employee.qualifications).filter(Boolean).length;
  }

  function renderEmployeeFilterOptions() {
    const professionValue = employeeProfessionFilter;
    elements.employeeProfessionFilter.innerHTML = [
      '<option value="all">Alle Berufe</option>',
      ...state.catalogs.professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    elements.employeeProfessionFilter.value = state.catalogs.professions.includes(
      professionValue,
    )
      ? professionValue
      : "all";
    employeeProfessionFilter = elements.employeeProfessionFilter.value;

    const qualificationValue = employeeQualificationFilter;
    elements.employeeQualificationFilter.innerHTML = [
      '<option value="all">Alle Qualifikationen</option>',
      '<option value="none">Keine Qualifikation</option>',
      ...state.catalogs.qualifications.map(
        (qualification) =>
          `<option value="${qualification.id}">${escapeHtml(qualification.label)}</option>`,
      ),
    ].join("");
    elements.employeeQualificationFilter.value =
      qualificationValue === "none" ||
      state.catalogs.qualifications.some(
        (qualification) => qualification.id === qualificationValue,
      )
      ? qualificationValue
      : "all";
    employeeQualificationFilter = elements.employeeQualificationFilter.value;
    elements.employeeWeekendFilter.innerHTML = [
      '<option value="all">Alle Dienstwochenenden</option>',
      serviceWeekendOptionsMarkup(),
    ].join("");
    elements.employeeWeekendFilter.value = [
      "all",
      "none",
      ...SERVICE_WEEKEND_KEYS,
    ].includes(employeeWeekendFilter)
      ? employeeWeekendFilter
      : "all";
    employeeWeekendFilter = elements.employeeWeekendFilter.value;
  }

  function renderTrainings() {
    const availableYears = getTrainingDisplayYears();
    if (!availableYears.includes(trainingDisplayYear)) {
      trainingDisplayYear = new Date().getFullYear();
    }
    elements.trainingDisplayYear.innerHTML = availableYears
      .map(
        (year) =>
          `<option value="${year}" ${year === trainingDisplayYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");

    const displayedTrainings = trainingObligations().filter(
      (training) => training.year <= trainingDisplayYear,
    );
    const activeCount = activeEmployeeList().length;
    const totalAssignments = activeCount * displayedTrainings.length;
    const currentAssignments = displayedTrainings.reduce(
      (sum, training) => sum + getTrainingStats(training).current,
      0,
    );
    const openAssignments = Math.max(0, totalAssignments - currentAssignments);

    elements.trainingSummary.innerHTML = `
      ${renderSummaryChip("training", displayedTrainings.length, `im Katalog ${trainingDisplayYear}`)}
      ${renderSummaryChip("check", currentAssignments, "aktuelle Nachweise", "teal")}
      ${renderSummaryChip("alert", openAssignments, "offene Nachweise", "orange")}
    `;
    elements.openTrainingMatrixButton.disabled = state.trainings.length === 0;

    if (state.trainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Pflichtfortbildungen",
            text: "Legen Sie eine Fortbildung an und erfassen Sie anschließend die absolvierten Nachweise aktiver Mitarbeiter.",
            buttonText: "Erste Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    if (displayedTrainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: `Bis ${trainingDisplayYear} keine Pflichtfortbildungen`,
            text: "Wählen Sie ein späteres Jahr oder ergänzen Sie den Fortbildungskatalog.",
            buttonText: "Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    elements.trainingList.innerHTML = groupTrainingsByYear(displayedTrainings)
      .map(
        ([year, trainings]) => `
          <section class="training-year-group" aria-labelledby="trainingYear${year}">
            <div class="training-year-header">
              <div>
                <p class="eyebrow">Im Katalog seit</p>
                <h2 id="trainingYear${year}">${year}</h2>
              </div>
              <span>${trainings.length} Fortbildung${trainings.length === 1 ? "" : "en"}</span>
            </div>
            <div class="training-year-items">
              ${trainings.map(renderTrainingCard).join("")}
            </div>
          </section>
        `,
      )
      .join("");
  }

  function getTrainingDisplayYears() {
    return [
      ...new Set([
        new Date().getFullYear(),
        ...state.trainings.map((training) => Number(training.year)),
      ]),
    ]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((yearA, yearB) => yearB - yearA);
  }

  function formatMinutesAsHoursAndMinutes(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function formatSecondsAsMinutesAndSeconds(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatSecondsAsRoundedMinutes(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const roundedMinutes = Math.round(safeSeconds / 60);
    return `${roundedMinutes} Minute${roundedMinutes === 1 ? "" : "n"}`;
  }

  function openTrainingTimeCalculator() {
    elements.timeSpanList.innerHTML = Array.from({ length: 20 }, (_, index) => `
      <div class="time-span-row">
        <span>${index + 1}.</span>
        <label>
          <span class="sr-only">Minuten der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-minutes placeholder="0" />
          <small>Min.</small>
        </label>
        <span aria-hidden="true">:</span>
        <label>
          <span class="sr-only">Sekunden der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-seconds placeholder="00" />
          <small>Sek.</small>
        </label>
      </div>
    `).join("");

    const configuredTrainings = state.trainings
      .filter((training) => Number.isInteger(training.targetMinutes) && training.targetMinutes > 0)
      .sort(
        (trainingA, trainingB) =>
          trainingA.title.localeCompare(trainingB.title, "de") ||
          trainingB.year - trainingA.year,
      );
    elements.creditedTrainingTimeList.innerHTML = configuredTrainings.length
      ? configuredTrainings
          .map(
            (training) => `
              <label class="credited-training-time-row">
                <span>
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</small>
                </span>
                <span class="input-suffix">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-credited-training-minutes
                    data-training-id="${training.id}"
                    aria-label="Anrechenbare Minuten für ${escapeHtml(training.title)}"
                  />
                  <span>Min.</span>
                </span>
              </label>
            `,
          )
          .join("")
      : `<div class="time-calculator-empty">
          <strong>Keine Soll-Zeiten hinterlegt</strong>
          <p>Unter Einstellungen → Pflichtfortbildungen können Sie Soll-Zeiten in Minuten eintragen.</p>
        </div>`;

    updateTimeSpanTotal();
    updateCreditedTrainingTimeTotal();
    elements.trainingTimeCalculatorDialog.showModal();
    window.setTimeout(() => elements.timeSpanList.querySelector("input")?.focus(), 0);
  }

  function updateTimeSpanTotal() {
    const rows = [...elements.timeSpanList.querySelectorAll(".time-span-row")];
    const totalSeconds = rows.reduce((sum, row) => {
      const minutes = Math.max(
        0,
        Number(row.querySelector("[data-time-minutes]").value) || 0,
      );
      const seconds = Math.max(
        0,
        Number(row.querySelector("[data-time-seconds]").value) || 0,
      );
      return sum + Math.round(minutes * 60 + seconds);
    }, 0);
    elements.timeSpanTotalRoundedMinutes.textContent =
      formatSecondsAsRoundedMinutes(totalSeconds);
    elements.timeSpanTotalFormatted.value = formatSecondsAsMinutesAndSeconds(totalSeconds);
  }

  function updateCreditedTrainingTimeTotal() {
    const totalMinutes = [...elements.creditedTrainingTimeList.querySelectorAll(
      "[data-credited-training-minutes]",
    )].reduce((sum, input) => {
      const minutes = Math.max(0, Math.round(Number(input.value) || 0));
      return sum + minutes;
    }, 0);
    elements.creditedTrainingTotalMinutes.textContent = `${totalMinutes} Minute${totalMinutes === 1 ? "" : "n"}`;
    elements.creditedTrainingTotalFormatted.value = formatMinutesAsHoursAndMinutes(totalMinutes);
  }

  function groupTrainingsByYear(trainings = state.trainings) {
    const groups = new Map();
    trainings.forEach((training) => {
      if (!groups.has(training.year)) groups.set(training.year, []);
      groups.get(training.year).push(training);
    });

    return [...groups.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, trainings]) => [
        year,
        trainings.sort((a, b) => a.title.localeCompare(b.title, "de")),
      ]);
  }

  function openTrainingMatrixDialog() {
    const years = getTrainingEvaluationYears();
    if (years.length === 0) {
      showToast("Für die Auswertung sind noch keine Pflichtfortbildungen vorhanden.", "error");
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = years.includes(currentYear) ? currentYear : years[0];
    elements.trainingMatrixYear.innerHTML = years
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");
    renderTrainingRateHistory(years);
    renderTrainingMatrix();
    elements.trainingMatrixDialog.showModal();
  }

  function renderTrainingRateHistory(years = getTrainingEvaluationYears()) {
    const annualRates = [...years]
      .sort((yearA, yearB) => yearA - yearB)
      .map((year) => ({ year, rate: getAnnualTrainingMatrix(year).completionRate }));
    elements.trainingRateHistoryChart.innerHTML = annualRates.length
      ? `<div class="training-rate-chart" role="img" aria-label="${escapeHtml(
          annualRates.map(({ year, rate }) => `${year}: ${rate} Prozent`).join(", "),
        )}">
          ${annualRates
            .map(
              ({ year, rate }) => `
                <div class="training-rate-bar-row">
                  <strong>${year}</strong>
                  <div class="training-rate-bar-track" aria-hidden="true">
                    <span${dynamicStyle({ "--training-rate": `${rate}%` })}></span>
                  </div>
                  <span>${rate}&thinsp;%</span>
                </div>
              `,
            )
            .join("")}
        </div>`
      : '<p class="training-rate-chart-empty">Noch keine Jahresdaten vorhanden.</p>';
  }

  function renderTrainingMatrix() {
    const year = Number(elements.trainingMatrixYear.value);
    const matrix = getAnnualTrainingMatrix(year);
    elements.trainingMatrixDialogTitle.textContent = `Status der Pflichtfortbildungen · ${year}`;
    elements.trainingMatrixSummary.innerHTML = `
      <strong>${matrix.completedAssignments} von ${matrix.totalAssignments}</strong>
      <span>Pflichten zum Jahresende erfüllt · ${matrix.completionRate}&thinsp;%</span>
    `;

    if (matrix.employees.length === 0) {
      elements.trainingMatrixContent.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Für die Jahresauswertung wird mindestens ein aktiver Mitarbeiter benötigt.",
        compact: true,
      });
      return;
    }

    elements.trainingMatrixContent.innerHTML = `
      <div
        class="training-matrix-horizontal-scroll"
        tabindex="0"
        aria-label="Fortbildungsspalten horizontal scrollen"
      >
        <div class="training-matrix-horizontal-spacer"></div>
      </div>
      <div class="training-matrix-scroll" tabindex="0" aria-label="Fortbildungsmatrix ${year}">
        <table class="training-matrix-table">
          <thead>
            <tr>
              <th scope="col">Aktive Mitarbeiter</th>
              ${matrix.trainingColumns
                .map(
                  ({ training, completedCount, completionRate }) => `
                    <th scope="col" title="${escapeHtml(training.title)}">
                      <span>${escapeHtml(training.title)}</span>
                      <small
                        class="completion-progress ${completionProgressTone(completionRate)}"
                        title="${completedCount} von ${matrix.employees.length} aktiven Mitarbeitern erfüllen diese Pflicht zum Jahresende"
                      >
                        ${completionRate}&thinsp;% erfüllt
                      </small>
                    </th>
                  `,
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${matrix.rows
              .map(
                (row) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="training-matrix-employee-link"
                        type="button"
                        data-training-matrix-employee="${row.employee.id}"
                        title="Mitarbeiter-Akte von ${escapeHtml(fullName(row.employee))} öffnen"
                      >${escapeHtml(fullName(row.employee))}</button>
                    </th>
                    ${row.statuses
                      .map(
                        ({ training, completed }) => `
                          <td>
                            <span
                              class="matrix-status ${completed ? "matrix-complete" : "matrix-open"}"
                              role="img"
                              aria-label="${escapeHtml(
                                `${fullName(row.employee)}: ${training.title} ${
                                  completed ? "für das Auswertungsjahr erfüllt" : "offen"
                                }`,
                              )}"
                              title="${
                                completed
                                  ? "Für das Auswertungsjahr erfüllt"
                                  : "Zum Jahresende offen"
                              }"
                            >${completed ? "✓" : "×"}</span>
                          </td>
                        `,
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    elements.trainingMatrixContent
      .querySelectorAll("[data-training-matrix-employee]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          elements.trainingMatrixDialog.close();
          openEmployeeDossier(button.dataset.trainingMatrixEmployee);
        }),
      );
    bindTrainingMatrixScrollers();
  }

  function bindTrainingMatrixScrollers() {
    const horizontalScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-horizontal-scroll",
    );
    const matrixScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-scroll",
    );
    const spacer = horizontalScroll?.querySelector(
      ".training-matrix-horizontal-spacer",
    );
    if (!horizontalScroll || !matrixScroll || !spacer) return;

    let syncing = false;
    const synchronize = (source, target) => {
      if (syncing) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };
    horizontalScroll.addEventListener("scroll", () =>
      synchronize(horizontalScroll, matrixScroll),
    );
    matrixScroll.addEventListener("scroll", () =>
      synchronize(matrixScroll, horizontalScroll),
    );

    window.requestAnimationFrame(() => {
      spacer.style.width = `${matrixScroll.scrollWidth}px`;
      horizontalScroll.hidden =
        matrixScroll.scrollWidth <= matrixScroll.clientWidth + 1;
      horizontalScroll.scrollLeft = matrixScroll.scrollLeft;
    });
  }

  function printTrainingMatrix() {
    if (!elements.trainingMatrixDialog.open) return;
    window.print();
  }

  function exportTrainingMatrixCsv() {
    const year = Number(elements.trainingMatrixYear.value);
    const matrix = getAnnualTrainingMatrix(year);
    if (!matrix.employees.length || !matrix.trainings.length) {
      showToast("Für dieses Jahr sind keine auswertbaren Fortbildungsdaten vorhanden.", "error");
      return;
    }

    downloadCsv(
      `teo-pflichtfortbildungen_${year}.csv`,
      ["Mitarbeiter", ...matrix.trainings.map((training) => training.title)],
      matrix.rows.map((row) => [
        fullName(row.employee),
        ...row.statuses.map(({ completed }) => (completed ? "Erfüllt" : "Offen")),
      ]),
    );
  }

  function getAnnualTrainingMatrix(year) {
    const referenceDate = `${year}-12-31`;
    const trainings = trainingObligations()
      .filter((training) => training.year <= year)
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    const employees = [...activeEmployeeList()].sort(sortEmployees);
    let completedAssignments = 0;
    const completedPerTraining = trainings.map(() => 0);
    const rows = employees.map((employee) => ({
      employee,
      statuses: trainings.map((training, trainingIndex) => {
        const latest = latestCompletionForTraining(
          employee.id,
          training,
          referenceDate,
        );
        const completed = Boolean(
          latest &&
            (!training.recurrenceMonths ||
              addMonths(latest.completedOn, training.recurrenceMonths) >= referenceDate),
        );
        if (completed) {
          completedAssignments += 1;
          completedPerTraining[trainingIndex] += 1;
        }
        return { training, completed, completion: latest || null };
      }),
    }));
    const totalAssignments = employees.length * trainings.length;

    return {
      year,
      trainings,
      // Je Fortbildung, wie viele der aktiven Mitarbeiter sie zum Jahresende
      // erfuellt haben - Grundlage fuer den Komplettierungsgrad in der Spalte.
      trainingColumns: trainings.map((training, trainingIndex) => ({
        training,
        completedCount: completedPerTraining[trainingIndex],
        completionRate: percentage(completedPerTraining[trainingIndex], employees.length),
      })),
      employees,
      rows,
      completedAssignments,
      totalAssignments,
      completionRate: percentage(completedAssignments, totalAssignments),
    };
  }

  function getTrainingEvaluationYears() {
    const currentYear = new Date().getFullYear();
    const trainingYears = state.trainings
      .map((training) => Number(training.year))
      .filter(Number.isInteger);
    const completionYears = [];
    state.completions.forEach((completion) => {
      const completionYear = Number(completion.completedOn.slice(0, 4));
      if (Number.isInteger(completionYear)) completionYears.push(completionYear);
    });
    const firstYear = trainingYears.length
      ? Math.min(...trainingYears)
      : completionYears.length
        ? Math.min(...completionYears)
        : currentYear;
    const lastYear = Math.max(currentYear, ...trainingYears, ...completionYears);
    const years = new Set();
    for (let year = firstYear; year <= lastYear; year += 1) years.add(year);
    return [...years].sort((a, b) => b - a);
  }

  function renderSummaryChip(icon, value, label, tone = "blue") {
    const tones = {
      teal: "summary-chip-icon-teal",
      orange: "summary-chip-icon-orange",
      blue: "",
    };

    return `
      <article class="summary-chip">
        <span class="summary-chip-icon ${tones[tone] || ""}">
          <svg><use href="#icon-${icon}"></use></svg>
        </span>
        <span>
          <strong>${value}</strong>
          <small>${label}</small>
        </span>
      </article>
    `;
  }

  function renderTrainingCard(training) {
    const stats = getTrainingStats(training);
    const activeCount = activeEmployeeList().length;
    const history = state.completions
      .filter((completion) => completionMatchesTraining(completion, training))
      .sort(
        (a, b) =>
          b.completedOn.localeCompare(a.completedOn) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );

    return `
      <article class="training-card">
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-training"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(training.title)}</h2>
              <p>${escapeHtml(training.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${recurrenceLabel(training)}
              </span>
              ${
                training.targetMinutes
                  ? `<span class="training-meta"><svg><use href="#icon-chart"></use></svg>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</span>`
                  : ""
              }
            </div>
          </div>
          <div class="training-progress-block">
            <strong>
              <span>Aktueller Stand</span>
              <span>${activeCount ? `${stats.current} von ${activeCount}` : "Kein aktives Personal"}</span>
            </strong>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${stats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${stats.percent}%` })}></div>
            </div>
            <small>${stats.open} Nachweis${stats.open === 1 ? "" : "e"} offen</small>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-completion"
              data-id="${training.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Abschluss
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <details class="training-card-details">
          <summary>${history.length} erfasste${history.length === 1 ? "r" : ""} Nachweis${
            history.length === 1 ? "" : "e"
          }${training.recurrenceMonths ? " in dieser Fortbildungsreihe" : ""}</summary>
          <div class="completion-history">
            ${
              history.length
                ? history.map((completion) => renderCompletionRow(completion, training)).join("")
                : '<p class="completion-empty">Für diese Fortbildung wurde noch kein Abschluss erfasst.</p>'
            }
          </div>
        </details>
      </article>
    `;
  }

  function renderCompletionRow(completion, training) {
    const employee = getEmployee(completion.employeeId);
    if (!employee) return "";

    const validity = training.recurrenceMonths
      ? `gültig bis ${formatDate(addMonths(completion.completedOn, training.recurrenceMonths))}`
      : "ohne Ablauf";

    return `
      <div class="completion-row">
        <div class="completion-person">
          ${renderAvatar(employee, true)}
          <strong>${escapeHtml(fullName(employee))}</strong>
        </div>
        <span>${formatDate(completion.completedOn)}</span>
        <span title="${escapeHtml(completion.note || validity)}">${escapeHtml(
          completion.note || validity,
        )}</span>
        <button
          class="icon-button danger"
          type="button"
          data-action="delete-completion"
          data-id="${completion.id}"
          aria-label="Nachweis von ${escapeHtml(fullName(employee))} löschen"
          title="Nachweis löschen"
        >
          <svg><use href="#icon-trash"></use></svg>
        </button>
      </div>
    `;
  }

  function memoVisibleToCurrentUser(memo, user = currentUser) {
    return Boolean(
      memo &&
        (memo.visibility === "all" ||
          (user?.id && memo.createdByUserId === user.id)),
    );
  }

  function visibleMemos() {
    return state.memos.filter((memo) => memoVisibleToCurrentUser(memo));
  }

  function sortMemos(a, b) {
    return (
      Number(b.pinned) - Number(a.pinned) ||
      Number(a.completed) - Number(b.completed) ||
      Number(!a.date) - Number(!b.date) ||
      String(a.date).localeCompare(String(b.date)) ||
      String(b.updatedAt).localeCompare(String(a.updatedAt)) ||
      a.title.localeCompare(b.title, "de")
    );
  }

  function filteredMemos() {
    return visibleMemos()
      .filter((memo) => {
        if (memoStatusFilter === "open" && memo.completed) return false;
        if (memoStatusFilter === "completed" && !memo.completed) return false;
        if (memoCategoryFilter !== "all" && memo.category !== memoCategoryFilter) {
          return false;
        }
        if (!memoSearchTerm) return true;
        return searchKey(
          `${memo.title} ${memo.description} ${memo.category}`,
        ).includes(memoSearchTerm);
      })
      .sort(sortMemos);
  }

  function renderMemoCategoryOptions() {
    elements.memoCategory.innerHTML = [
      '<option value="">Ohne Kategorie</option>',
      ...state.catalogs.memoCategories.map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      ),
    ].join("");
    elements.memoCategoryFilter.innerHTML = [
      '<option value="all">Alle Kategorien</option>',
      '<option value="">Ohne Kategorie</option>',
      ...state.catalogs.memoCategories.map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      ),
    ].join("");
    if (
      memoCategoryFilter !== "all" &&
      memoCategoryFilter !== "" &&
      !state.catalogs.memoCategories.includes(memoCategoryFilter)
    ) {
      memoCategoryFilter = "all";
    }
    elements.memoCategoryFilter.value = memoCategoryFilter;
  }

  function renderMemos() {
    renderMemosView();
    refreshRecordInspector("memo");
  }

  function renderMemosView() {
    renderMemoCategoryOptions();
    renderViewFilterChips("memos");
    const allVisible = visibleMemos();
    const memos = filteredMemos();
    elements.memoSummary.innerHTML = `
      ${renderSummaryChip("empty", allVisible.length, "sichtbare Einträge")}
      ${renderSummaryChip("check", allVisible.filter((memo) => !memo.completed).length, "offen", "teal")}
      ${renderSummaryChip("alert", allVisible.filter((memo) => memo.pinned && !memo.completed).length, "wichtig", "orange")}
      ${renderSummaryChip("lock", allVisible.filter((memo) => memo.visibility === "private").length, "nur in meiner Ansicht")}
    `;

    if (!allVisible.length) {
      elements.memoList.innerHTML = `<section class="panel">${renderEmptyState({
        title: "Noch keine Memos oder ToDos",
        text: "Legen Sie eine persönliche Notiz oder eine gemeinsame Aufgabe an.",
        buttonText: "Ersten Eintrag anlegen",
        buttonAttribute: "data-empty-add-memo",
      })}</section>`;
      elements.memoList
        .querySelector("[data-empty-add-memo]")
        ?.addEventListener("click", () => openMemoDialog());
      return;
    }
    if (!memos.length) {
      elements.memoList.innerHTML = `<section class="panel">${renderEmptyState({
        title: "Keine passenden Einträge",
        text: "Passen Sie Suche, Kategorie oder Statusfilter an.",
        compact: true,
      })}</section>`;
      return;
    }
    elements.memoList.innerHTML = memos.map(renderMemoCard).join("");
  }

  function memoDatePresentation(memo) {
    if (!memo.date) return { date: "Ohne Datum", relative: "Keine Fälligkeit" };
    const days = daysBetween(parseLocalDate(todayIso()), parseLocalDate(memo.date));
    return {
      date: formatDate(memo.date),
      relative: appointmentRelativeLabel(days),
      overdue: days < 0 && !memo.completed,
    };
  }

  function memoCreatorLabel(memo) {
    return (
      state.users.find((user) => user.id === memo.createdByUserId)?.username ||
      "Ehemaliges Konto"
    );
  }

  function renderMemoCard(memo) {
    const date = memoDatePresentation(memo);
    const meta = [
      memo.category || "Ohne Kategorie",
      memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle",
      `Erstellt von ${memoCreatorLabel(memo)}`,
    ];
    return `
      <article class="meeting-card memo-card ${memo.pinned ? "is-pinned" : ""} ${memo.completed ? "is-completed" : ""}" data-memo-card="${memo.id}" data-record-card="${memo.id}" tabindex="0" aria-label="${escapeHtml(memo.title)} öffnen">
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon memo-icon"><svg><use href="#icon-memo"></use></svg></span>
            <div>
              <h2>${memo.pinned ? '<span class="appointment-pinned-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>' : ""}${escapeHtml(memo.title)}${memo.completed ? ' <span class="memo-completed-badge">Erledigt</span>' : ""}</h2>
              <p>${escapeHtml(memo.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">${escapeHtml(meta.join(" · "))}</span>
            </div>
          </div>
          <div class="appointment-date-status ${date.overdue ? "is-overdue" : ""}"><strong>${escapeHtml(date.date)}</strong><span>${escapeHtml(date.relative)}</span></div>
          <div class="training-actions">
            <button class="icon-button memo-complete-button ${memo.completed ? "is-active" : ""}" type="button" data-action="toggle-memo-completed" data-id="${memo.id}" aria-label="${memo.completed ? "Wieder öffnen" : "Als erledigt markieren"}" title="${memo.completed ? "Wieder öffnen" : "Als erledigt markieren"}"><svg><use href="#icon-check"></use></svg></button>
            <button class="icon-button appointment-pin-button ${memo.pinned ? "is-active" : ""}" type="button" data-action="toggle-memo-pin" data-id="${memo.id}" aria-label="${memo.pinned ? "Nicht mehr anpinnen" : "Anpinnen"}" aria-pressed="${String(memo.pinned)}" title="${memo.pinned ? "Nicht mehr anpinnen" : "Anpinnen"}"><span class="important-notification-icon" aria-hidden="true"></span></button>
            <button class="icon-button" type="button" data-action="edit-memo" data-id="${memo.id}" aria-label="Bearbeiten" title="Bearbeiten"><svg><use href="#icon-edit"></use></svg></button>
            <button class="icon-button danger" type="button" data-action="delete-memo" data-id="${memo.id}" aria-label="Löschen" title="Löschen"><svg><use href="#icon-trash"></use></svg></button>
          </div>
        </div>
      </article>`;
  }

  function renderDashboardMemos() {
    const memos = visibleMemos().filter((memo) => !memo.completed).sort(sortMemos);
    const visible = memos.length > 0;
    elements.dashboardMemoPanel.hidden = !visible;
    elements.dashboardPriorityGrid.classList.toggle("has-memos", visible);
    if (!visible) {
      elements.dashboardMemoList.innerHTML = "";
      return;
    }
    elements.dashboardMemoList.innerHTML = `
      <div class="dashboard-memo-list">
        ${memos
          .slice(0, 6)
          .map((memo) => {
            const date = memoDatePresentation(memo);
            return `<button class="dashboard-memo-row ${memo.pinned ? "is-pinned" : ""}" type="button" data-dashboard-memo="${memo.id}">
              <span class="memo-dashboard-icon">${memo.pinned ? '<span class="important-notification-icon" aria-hidden="true"></span>' : '<svg><use href="#icon-memo"></use></svg>'}</span>
              <span><strong>${escapeHtml(memo.title)}</strong><small>${escapeHtml([memo.category || "Ohne Kategorie", memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle"].join(" · "))}</small></span>
              <span><strong>${escapeHtml(date.date)}</strong><small>${escapeHtml(date.relative)}</small></span>
            </button>`;
          })
          .join("")}
      </div>
      ${memos.length > 6 ? `<p class="field-hint dashboard-memo-more">${memos.length - 6} weitere offene Einträge</p>` : ""}`;
  }

  function handleDashboardMemoAction(event) {
    const button = event.target.closest("[data-dashboard-memo]");
    if (button) openMemoDialog(button.dataset.dashboardMemo);
  }

  function handleMemoAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (button) {
      if (event.type === "keydown") return;
      const { action, id } = button.dataset;
      if (action === "toggle-memo-completed") void toggleMemoCompleted(id);
      if (action === "toggle-memo-pin") void toggleMemoPinned(id);
      if (action === "edit-memo") openMemoDialog(id);
      if (action === "delete-memo") requestDeleteMemo(id);
      return;
    }
    // Die Karte selbst oeffnet die Schnellansicht (siehe 22-record-inspector).
  }

  function getMemo(memoId) {
    return state.memos.find((memo) => memo.id === memoId);
  }

  function openMemoDialog(memoId = null) {
    const memo = memoId ? getMemo(memoId) : null;
    if (memo && !memoVisibleToCurrentUser(memo)) return;
    if (memo) trackWorkspaceRecord("memo", memo.id);
    renderMemoCategoryOptions();
    elements.memoForm.reset();
    document.querySelector("#memoId").value = "";
    document.querySelector("#memoTitle").setCustomValidity("");
    elements.memoVisibility.value = "all";
    elements.memoPinned.checked = false;
    elements.memoCompleted.checked = false;
    elements.memoDialogTitle.textContent = memo ? "Memo / ToDo bearbeiten" : "Memo / ToDo anlegen";
    elements.memoSubmitLabel.textContent = memo ? "Änderungen speichern" : "Memo / ToDo speichern";
    if (memo) {
      document.querySelector("#memoId").value = memo.id;
      document.querySelector("#memoTitle").value = memo.title;
      document.querySelector("#memoDate").value = memo.date;
      document.querySelector("#memoDescription").value = memo.description;
      elements.memoCategory.value = memo.category;
      elements.memoVisibility.value = memo.visibility;
      elements.memoPinned.checked = memo.pinned;
      elements.memoCompleted.checked = memo.completed;
    }
    elements.memoDialog.showModal();
    captureCleanForm(elements.memoForm);
    window.setTimeout(() => document.querySelector("#memoTitle").focus(), 0);
  }

  async function handleMemoSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#memoTitle");
    titleInput.setCustomValidity(titleInput.value.trim() ? "" : "Bitte einen Titel eingeben.");
    if (!elements.memoForm.reportValidity()) return;
    const memoId = document.querySelector("#memoId").value;
    const existing = memoId ? getMemo(memoId) : null;
    if (existing && !memoVisibleToCurrentUser(existing)) return;
    const now = new Date().toISOString();
    const memo = {
      id: existing?.id || createId(),
      title: titleInput.value.trim(),
      description: document.querySelector("#memoDescription").value.trim(),
      date: document.querySelector("#memoDate").value,
      category: elements.memoCategory.value,
      pinned: elements.memoPinned.checked,
      completed: elements.memoCompleted.checked,
      visibility: elements.memoVisibility.value === "private" ? "private" : "all",
      createdByUserId: existing?.createdByUserId || currentUser.id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const committed = await commitStateMutation(() => {
      if (existing) {
        state.memos = state.memos.map((item) => (item.id === memo.id ? memo : item));
      } else {
        state.memos.push(memo);
      }
    });
    if (!committed) return;
    elements.memoDialog.close();
    showToast(existing ? "Memo / ToDo wurde aktualisiert." : "Memo / ToDo wurde angelegt.");
  }

  async function toggleMemoPinned(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    const pinned = !memo.pinned;
    const committed = await commitStateMutation(() => {
      state.memos = state.memos.map((item) =>
        item.id === memoId ? { ...item, pinned, updatedAt: new Date().toISOString() } : item,
      );
    });
    if (committed) showToast(pinned ? "Memo / ToDo wurde angepinnt." : "Memo / ToDo wurde gelöst.");
  }

  async function toggleMemoCompleted(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    const completed = !memo.completed;
    const committed = await commitStateMutation(() => {
      state.memos = state.memos.map((item) =>
        item.id === memoId ? { ...item, completed, updatedAt: new Date().toISOString() } : item,
      );
    });
    if (committed) showToast(completed ? "Memo / ToDo wurde erledigt." : "Memo / ToDo wurde wieder geöffnet.");
  }

  function requestDeleteMemo(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    requestConfirmation({
      title: "Memo / ToDo löschen?",
      message: `„${memo.title}“ wird dauerhaft gelöscht.`,
      acceptLabel: "Eintrag löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.memos = state.memos.filter((item) => item.id !== memoId);
        }, { undo: "Memo / ToDo gelöscht" });
        if (committed) showUndoToast("Memo / ToDo wurde gelöscht.");
      },
    });
  }

  function renderMemoCategorySettings() {
    elements.memoCategoryList.innerHTML = state.catalogs.memoCategories.length
      ? state.catalogs.memoCategories.map((category, index) => `
          <div class="catalog-row" data-memo-category-index="${index}">
            <input type="text" maxlength="60" value="${escapeHtml(category)}" aria-label="Kategorie ${escapeHtml(category)} bearbeiten" />
            <button class="icon-button" type="button" data-memo-category-action="save" aria-label="Änderung speichern" title="Änderung speichern"><svg><use href="#icon-check"></use></svg></button>
            <button class="icon-button danger" type="button" data-memo-category-action="delete" aria-label="${escapeHtml(category)} löschen" title="Löschen"><svg><use href="#icon-trash"></use></svg></button>
          </div>`).join("")
      : '<p class="settings-empty-copy">Noch keine Kategorien angelegt.</p>';
  }

  async function addMemoCategory(event) {
    event.preventDefault();
    const category = elements.newMemoCategory.value.trim();
    if (!category) return;
    if (catalogIncludesLabel(state.catalogs.memoCategories, category)) {
      showToast("Diese Memo-/ToDo-Kategorie ist bereits vorhanden.", "error");
      return;
    }
    const committed = await commitStateMutation(() => {
      state.catalogs.memoCategories.push(category);
      state.catalogs.memoCategories.sort((a, b) => a.localeCompare(b, "de"));
    });
    if (!committed) return;
    elements.newMemoCategory.value = "";
    renderMemoCategorySettings();
    showToast("Memo-/ToDo-Kategorie wurde hinzugefügt.");
  }

  function handleMemoCategoryAction(event) {
    const button = event.target.closest("[data-memo-category-action]");
    const row = button?.closest("[data-memo-category-index]");
    if (!button || !row) return;
    const index = Number(row.dataset.memoCategoryIndex);
    if (button.dataset.memoCategoryAction === "save") {
      void saveMemoCategory(index, row.querySelector("input").value);
    } else {
      deleteMemoCategory(index);
    }
  }

  async function saveMemoCategory(index, nextValue) {
    const previous = state.catalogs.memoCategories[index];
    const category = String(nextValue || "").trim().slice(0, 60);
    if (!previous || !category) {
      showToast("Die Kategorie darf nicht leer sein.", "error");
      return;
    }
    if (previous.toLocaleLowerCase("de-DE") !== category.toLocaleLowerCase("de-DE") && catalogIncludesLabel(state.catalogs.memoCategories, category)) {
      showToast("Diese Memo-/ToDo-Kategorie ist bereits vorhanden.", "error");
      return;
    }
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.catalogs.memoCategories[index] = category;
      state.catalogs.memoCategories.sort((a, b) => a.localeCompare(b, "de"));
      state.memos = state.memos.map((memo) => memo.category === previous ? { ...memo, category, updatedAt: now } : memo);
    });
    if (!committed) return;
    renderMemoCategorySettings();
    showToast("Memo-/ToDo-Kategorie wurde aktualisiert.");
  }

  function deleteMemoCategory(index) {
    const category = state.catalogs.memoCategories[index];
    if (!category) return;
    const assignments = state.memos.filter((memo) => memo.category === category).length;
    requestConfirmation({
      title: "Memo-/ToDo-Kategorie löschen?",
      message: assignments ? `„${category}“ wird gelöscht und bei ${assignments} Eintrag${assignments === 1 ? "" : "en"} entfernt.` : `„${category}“ wird aus dem Katalog entfernt.`,
      acceptLabel: "Kategorie löschen",
      callback: async () => {
        const now = new Date().toISOString();
        const committed = await commitStateMutation(() => {
          state.catalogs.memoCategories.splice(index, 1);
          state.memos = state.memos.map((memo) => memo.category === category ? { ...memo, category: "", updatedAt: now } : memo);
        }, { undo: "Memo-/ToDo-Kategorie gelöscht" });
        if (!committed) return;
        renderMemoCategorySettings();
        showUndoToast("Memo-/ToDo-Kategorie wurde gelöscht.");
      },
    });
  }

  // Der Aufbau hat mehrere Ausgaenge; die Schnellansicht wird deshalb aussen
  // aufgefrischt, wenn die Liste in jedem Fall neu steht.
  function renderAppointments() {
    renderAppointmentsView();
    refreshRecordInspector("appointment");
  }

  function renderAppointmentsView() {
    renderViewFilterChips("appointments");
    const today = todayIso();
    const pinnedAppointments = state.appointments
      .filter(
        (appointment) => appointment.pinned && appointmentMatchesSearch(appointment),
      )
      .sort(sortAppointments);
    const matchingAppointments = state.appointments.filter(
      (appointment) =>
        !appointment.pinned && appointmentMatchesFilters(appointment, today),
    );
    const visibleAppointments = [...pinnedAppointments, ...matchingAppointments];
    const upcoming = [...matchingAppointments]
      .filter((appointment) => appointment.date >= today)
      .sort(sortAppointments);
    const past = [...matchingAppointments]
      .filter((appointment) => appointment.date < today)
      .sort((a, b) => sortAppointments(b, a));
    const visibleUpcomingCount = visibleAppointments.filter(
      (appointment) => appointment.date >= today,
    ).length;
    const todayCount = visibleAppointments.filter(
      (appointment) => appointment.date === today,
    ).length;

    elements.appointmentSummary.innerHTML = `
      ${renderSummaryChip("calendar", state.appointments.length, "Termine gesamt")}
      ${renderSummaryChip("alert", visibleUpcomingCount, "anstehende Termine", "orange")}
      ${renderSummaryChip("check", todayCount, "Termine heute", "teal")}
    `;

    renderAppointmentViewControls();
    if (appointmentViewMode === "calendar") {
      renderAppointmentCalendar(today);
      return;
    }

    if (state.appointments.length === 0) {
      elements.appointmentList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Termine",
            text: "Legen Sie den ersten Termin an. Anstehende Termine erscheinen automatisch im Fristenmonitor.",
            buttonText: "Ersten Termin anlegen",
            buttonAttribute: "data-empty-add-appointment",
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-empty-add-appointment]")
        ?.addEventListener("click", () => openAppointmentDialog());
      return;
    }

    if (visibleAppointments.length === 0) {
      elements.appointmentList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Keine passenden Termine",
            text: "Ändern Sie den Suchbegriff oder den ausgewählten Zeitraumfilter.",
            buttonText: "Filter zurücksetzen",
            buttonAttribute: "data-reset-appointment-filters",
            compact: true,
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-reset-appointment-filters]")
        ?.addEventListener("click", resetAppointmentFilters);
      return;
    }

    elements.appointmentList.innerHTML = `
      ${
        pinnedAppointments.length
          ? `<section class="appointment-group appointment-group-pinned">
              <h2 class="appointment-group-title"><span class="important-notification-icon" aria-hidden="true"></span>Angepinnte Termine</h2>
              ${pinnedAppointments.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
      ${
        upcoming.length
          ? `<section class="appointment-group">
              <h2 class="appointment-group-title">Anstehende Termine</h2>
              ${upcoming.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
      ${
        past.length
          ? `<section class="appointment-group appointment-group-past">
              <h2 class="appointment-group-title">Vergangene Termine</h2>
              ${past.map(renderAppointmentCard).join("")}
            </section>`
          : ""
      }
    `;
  }

  // Angepinnte Termine bleiben bewusst am Zeitraumfilter vorbei sichtbar; sie
  // sind als wichtig markiert und sollen nicht verschwinden, weil gerade nur
  // anstehende Termine gezeigt werden. Ein Suchbegriff ist etwas anderes: Wer
  // sucht, will genau die passenden Termine sehen - ein angepinnter Termin,
  // der stehen bleibt, sieht aus wie ein Treffer und laesst die Suche
  // wirkungslos erscheinen.
  function appointmentMatchesPeriod(appointment, today) {
    if (appointmentPeriodFilter === "upcoming" && appointment.date < today) return false;
    if (appointmentPeriodFilter === "today" && appointment.date !== today) return false;
    if (appointmentPeriodFilter === "past" && appointment.date >= today) return false;
    return true;
  }

  function appointmentMatchesSearch(appointment) {
    if (!appointmentSearchTerm) return true;

    return searchKey(
      [
        appointment.title,
        appointment.description,
        appointment.location,
        appointmentCategoryLabel(appointment),
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(appointmentSearchTerm);
  }

  function appointmentMatchesFilters(appointment, today) {
    return (
      appointmentMatchesPeriod(appointment, today) &&
      appointmentMatchesSearch(appointment)
    );
  }

  function appointmentIsVisible(appointment, today) {
    return appointment.pinned
      ? appointmentMatchesSearch(appointment)
      : appointmentMatchesFilters(appointment, today);
  }

  function renderAppointmentViewControls() {
    document.querySelectorAll("[data-appointment-view]").forEach((button) => {
      const active = button.dataset.appointmentView === appointmentViewMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const calendarActive = appointmentViewMode === "calendar";
    elements.appointmentList.hidden = calendarActive;
    elements.appointmentCalendar.hidden = !calendarActive;
  }

  function setAppointmentViewMode(mode) {
    appointmentViewMode = mode === "calendar" ? "calendar" : "list";
    saveAppointmentViewPreference();
    renderAppointments();
  }

  function readAppointmentViewPreference() {
    const now = new Date();
    const fallback = {
      mode: "list",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
    try {
      const raw = window.localStorage?.getItem?.(APPOINTMENT_VIEW_KEY);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      const year = Number(value?.year);
      const month = Number(value?.month);
      return {
        mode: value?.mode === "calendar" ? "calendar" : "list",
        year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
        month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
      };
    } catch {
      return fallback;
    }
  }

  function saveAppointmentViewPreference() {
    try {
      window.localStorage?.setItem?.(
        APPOINTMENT_VIEW_KEY,
        JSON.stringify({
          mode: appointmentViewMode,
          year: appointmentCalendarYear,
          month: appointmentCalendarMonth,
        }),
      );
    } catch {
      // Der Terminkalender bleibt auch ohne Browserspeicher bedienbar; dann
      // startet er beim naechsten Aufruf wieder in der Listenansicht.
    }
  }

  function shiftAppointmentCalendarMonth(offset) {
    const shifted = new Date(
      appointmentCalendarYear,
      appointmentCalendarMonth - 1 + offset,
      1,
      12,
    );
    setAppointmentCalendarMonth(shifted.getFullYear(), shifted.getMonth() + 1);
  }

  function showAppointmentCalendarToday() {
    const now = new Date();
    setAppointmentCalendarMonth(now.getFullYear(), now.getMonth() + 1);
  }

  function setAppointmentCalendarMonth(year, month) {
    appointmentCalendarYear = year;
    appointmentCalendarMonth = month;
    saveAppointmentViewPreference();
    renderAppointments();
  }

  function renderAppointmentCalendar(today) {
    const firstOfMonth = new Date(
      appointmentCalendarYear,
      appointmentCalendarMonth - 1,
      1,
      12,
    );
    const monthLabel = dateFormat({ month: "long", year: "numeric" }).format(
      firstOfMonth,
    );
    elements.appointmentCalendarLabel.textContent = monthLabel;

    // Die Randtage stammen aus den Nachbarmonaten und koennen im Januar oder
    // Dezember in ein anderes Jahr fallen.
    const holidays = new Map([
      ...getNrwHolidays(appointmentCalendarYear - 1),
      ...getNrwHolidays(appointmentCalendarYear),
      ...getNrwHolidays(appointmentCalendarYear + 1),
    ]);
    const appointmentsByDate = new Map();
    state.appointments
      .filter((appointment) => appointmentIsVisible(appointment, today))
      .sort(sortAppointments)
      .forEach((appointment) => {
        const entries = appointmentsByDate.get(appointment.date) || [];
        entries.push(appointment);
        appointmentsByDate.set(appointment.date, entries);
      });

    let monthCount = 0;
    const cells = appointmentCalendarDates(
      appointmentCalendarYear,
      appointmentCalendarMonth,
    ).map((iso) => {
      const date = parseLocalDate(iso);
      const entries = appointmentsByDate.get(iso) || [];
      const inMonth = date.getMonth() === appointmentCalendarMonth - 1;
      if (inMonth) monthCount += entries.length;
      return renderAppointmentCalendarDay({
        date,
        iso,
        entries,
        inMonth,
        isToday: iso === today,
        holidayName: holidays.get(iso) || "",
      });
    });
    elements.appointmentCalendarGrid.innerHTML = cells.join("");
    elements.appointmentCalendarNote.innerHTML = appointmentSearchTerm
      ? renderAppointmentCalendarSearchNote(monthLabel, today)
      : monthCount
        ? `${monthCount} ${monthCount === 1 ? "Termin" : "Termine"} im ${monthLabel}. Auf einen Tag klicken, um einen Termin anzulegen, auf einen Eintrag, um ihn zu bearbeiten.`
        : `Im ${monthLabel} ist kein Termin eingetragen. Auf einen Tag klicken, um einen anzulegen.`;
  }

  // Das Monatsraster zeigt einen Monat, die Suche gilt aber dem gesamten
  // Bestand: Ein Treffer im Dezember ist im August nicht zu sehen, und ohne
  // Hinweis sieht es aus, als fände die Suche nichts. Die Zeile unter dem
  // Raster zaehlt deshalb alle Treffer und fuehrt zum naechsten ausserhalb
  // des gezeigten Monats.
  function handleAppointmentCalendarNoteAction(event) {
    const jumpButton = event.target.closest("[data-appointment-search-jump]");
    if (jumpButton) {
      const [year, month] = jumpButton.dataset.appointmentSearchJump
        .split("-")
        .map(Number);
      setAppointmentCalendarMonth(year, month);
      return;
    }
    if (event.target.closest("[data-clear-appointment-search]")) {
      appointmentSearchTerm = "";
      elements.appointmentSearch.value = "";
      renderAppointments();
    }
  }

  function appointmentSearchMatches(today) {
    return state.appointments
      .filter((appointment) => appointmentIsVisible(appointment, today))
      .sort(sortAppointments);
  }

  function renderAppointmentCalendarSearchNote(monthLabel, today) {
    const matches = appointmentSearchMatches(today);
    const monthPrefix = `${appointmentCalendarYear}-${String(
      appointmentCalendarMonth,
    ).padStart(2, "0")}`;
    const inMonth = matches.filter((appointment) =>
      appointment.date.startsWith(monthPrefix),
    );
    const outside = matches.filter(
      (appointment) => !appointment.date.startsWith(monthPrefix),
    );

    if (!matches.length) {
      return `Kein Termin passt zur Suche. <button class="appointment-calendar-note-action" type="button" data-clear-appointment-search>Suche zurücksetzen</button>`;
    }

    const found = `${inMonth.length || "Kein"} Treffer im ${monthLabel}`;
    if (!outside.length) {
      return `${found}. Auf einen Eintrag klicken, um ihn zu bearbeiten.`;
    }

    // Der naechste Treffer ist der, dessen Datum dem gezeigten Monat am
    // naechsten liegt - vorwaerts wie rueckwaerts.
    const reference = Date.parse(`${monthPrefix}-15T12:00:00.000Z`);
    const nearest = outside.reduce((closest, appointment) =>
      Math.abs(Date.parse(`${appointment.date}T12:00:00.000Z`) - reference) <
      Math.abs(Date.parse(`${closest.date}T12:00:00.000Z`) - reference)
        ? appointment
        : closest,
    );
    const elsewhere =
      outside.length === 1
        ? "1 weiterer in einem anderen Monat"
        : `${outside.length} weitere in anderen Monaten`;
    return `${found}, ${elsewhere}. <button class="appointment-calendar-note-action" type="button" data-appointment-search-jump="${
      nearest.date
    }">Zum Treffer am ${formatDate(nearest.date)}</button>`;
  }

  // Alle Tage, die das Monatsraster zeigt: der Monat selbst, davor die Tage
  // bis zum Wochenbeginn und dahinter der Rest der letzten Woche. Die Woche
  // beginnt am Montag; getDay() zaehlt ab Sonntag, daher der Versatz um sechs
  // Tage.
  function appointmentCalendarDates(year, month) {
    const leadingDays = (new Date(year, month - 1, 1, 12).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    return Array.from({ length: cellCount }, (_, index) =>
      localDateToIso(new Date(year, month - 1, index + 1 - leadingDays, 12)),
    );
  }

  function renderAppointmentCalendarDay({
    date,
    iso,
    entries,
    inMonth,
    isToday,
    holidayName,
  }) {
    const weekend = [0, 6].includes(date.getDay());
    const hiddenCount = Math.max(
      entries.length - APPOINTMENT_CALENDAR_ENTRY_LIMIT,
      0,
    );
    const moreLabel = `+${hiddenCount} weitere`;
    const dayLabel = dateFormat({
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    const classes = [
      "appointment-calendar-day",
      inMonth ? "" : "is-outside",
      isToday ? "is-today" : "",
      weekend ? "is-weekend" : "",
      holidayName ? "is-holiday" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div class="${classes}" data-calendar-day="${iso}">
        <div class="appointment-calendar-day-head">
          <button
            class="appointment-calendar-day-number"
            type="button"
            aria-label="Termin am ${escapeHtml(dayLabel)} anlegen"
            title="Termin am ${escapeHtml(dayLabel)} anlegen"
          >
            ${date.getDate()}
          </button>
          ${
            holidayName
              ? `<span class="appointment-calendar-day-note" title="${escapeHtml(holidayName)}">${escapeHtml(holidayName)}</span>`
              : ""
          }
        </div>
        ${
          entries.length
            ? `<ul class="appointment-calendar-day-entries">
                ${entries.map(renderAppointmentCalendarEntry).join("")}
              </ul>`
            : ""
        }
        ${
          hiddenCount
            ? `<button
                class="appointment-calendar-more"
                type="button"
                data-calendar-expand="${iso}"
                data-more-label="${escapeHtml(moreLabel)}"
                aria-expanded="false"
              >${escapeHtml(moreLabel)}</button>`
            : ""
        }
      </div>
    `;
  }

  function renderAppointmentCalendarEntry(appointment) {
    const timeLabel = appointment.startTime ? formatTime(appointment.startTime) : "";
    const category = appointmentCategoryLabel(appointment);
    const details = [
      formatAppointmentTime(appointment) || "ganztägig",
      category,
      appointment.location,
    ].filter(Boolean);
    return `
      <li>
        <button
          class="appointment-calendar-entry ${appointment.pinned ? "is-pinned" : ""}"
          type="button"
          data-appointment-card="${appointment.id}"
          data-record-card="${appointment.id}"
          title="${escapeHtml(`${appointment.title} · ${details.join(" · ")}`)}"
          aria-label="${escapeHtml(`${appointment.title} öffnen. ${details.join(", ")}`)}"
        >
          <span class="appointment-calendar-entry-icon">
            <svg><use href="#icon-${appointmentCategoryIcon(appointment)}"></use></svg>
          </span>
          ${
            timeLabel
              ? `<span class="appointment-calendar-entry-time">${escapeHtml(timeLabel)}</span>`
              : ""
          }
          <span class="appointment-calendar-entry-title">${escapeHtml(appointment.title)}</span>
          ${
            appointment.pinned
              ? '<span class="important-notification-icon" aria-hidden="true"></span>'
              : ""
          }
        </button>
      </li>
    `;
  }

  // Ein Klick auf einen Eintrag oeffnet ihn, ein Klick auf den freien Bereich
  // eines Tages legt einen neuen Termin fuer genau diesen Tag an.
  function handleAppointmentCalendarClick(event) {
    const expandButton = event.target.closest("[data-calendar-expand]");
    if (expandButton) {
      const day = expandButton.closest("[data-calendar-day]");
      const expanded = day.classList.toggle("is-expanded");
      expandButton.setAttribute("aria-expanded", String(expanded));
      expandButton.textContent = expanded
        ? "Weniger anzeigen"
        : expandButton.dataset.moreLabel;
      return;
    }

    // Ein Eintrag im Raster oeffnet die Schnellansicht (22-record-inspector),
    // nicht mehr den Dialog.
    if (event.target.closest("[data-appointment-card]")) return;

    const day = event.target.closest("[data-calendar-day]");
    if (day) openAppointmentDialog(null, { date: day.dataset.calendarDay });
  }

  function resetAppointmentFilters() {
    appointmentPeriodFilter = "all";
    appointmentSearchTerm = "";
    elements.appointmentSearch.value = "";
    document.querySelectorAll("[data-appointment-filter]").forEach((button) => {
      const active = button.dataset.appointmentFilter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderAppointments();
    elements.appointmentSearch.focus();
  }

  function appointmentCategoryIcon(appointment) {
    return (
      APPOINTMENT_CATEGORIES[appointment?.category]?.icon ||
      APPOINTMENT_CATEGORY_FALLBACK_ICON
    );
  }

  function appointmentCategoryLabel(appointment) {
    return APPOINTMENT_CATEGORIES[appointment?.category]?.label || "";
  }

  function renderAppointmentCategoryOptions() {
    if (!elements.appointmentCategory) return;
    elements.appointmentCategory.innerHTML = [
      '<option value="">Ohne Kategorie</option>',
      ...Object.entries(APPOINTMENT_CATEGORIES).map(
        ([key, { label }]) =>
          `<option value="${key}">${escapeHtml(label)}</option>`,
      ),
    ].join("");
  }

  function sortAppointments(a, b) {
    return (
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title, "de")
    );
  }

  function renderAppointmentCard(appointment) {
    const daysUntil = daysBetween(
      parseLocalDate(todayIso()),
      parseLocalDate(appointment.date),
    );
    const timeLabel = formatAppointmentTime(appointment);
    const kategorie = appointmentCategoryLabel(appointment);
    const meta = [
      formatDate(appointment.date),
      timeLabel,
      appointment.location,
    ].filter(Boolean);
    return `
      <article
        class="meeting-card appointment-card ${appointment.pinned ? "is-pinned" : ""} ${daysUntil < 0 ? "is-past" : ""}"
        data-appointment-card="${appointment.id}"
        data-record-card="${appointment.id}"
        tabindex="0"
        aria-label="Termindetails zu ${escapeHtml(appointment.title)} öffnen"
      >
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span
              class="training-icon appointment-icon"
              ${kategorie ? `title="${escapeHtml(kategorie)}"` : ""}
            >
              <svg><use href="#icon-${appointmentCategoryIcon(appointment)}"></use></svg>
            </span>
            <div>
              <h2>${appointment.pinned ? `<span class="appointment-pinned-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>` : ""}${escapeHtml(appointment.title)}${
                kategorie
                  ? ` <span class="appointment-category-tag">${escapeHtml(kategorie)}</span>`
                  : ""
              }</h2>
              <p>${escapeHtml(appointment.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${escapeHtml(meta.join(" · "))}
              </span>
            </div>
          </div>
          <div class="appointment-date-status">
            <strong>${formatDate(appointment.date)}</strong>
            <span>${escapeHtml(appointmentRelativeLabel(daysUntil))}</span>
          </div>
          <div class="training-actions">
            <button
              class="icon-button appointment-pin-button ${appointment.pinned ? "is-active" : ""}"
              type="button"
              data-action="toggle-appointment-pin"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} ${appointment.pinned ? "lösen" : "anpinnen"}"
              aria-pressed="${String(Boolean(appointment.pinned))}"
              title="${appointment.pinned ? "Nicht mehr anpinnen" : "Termin anpinnen"}"
            >
              <span class="important-notification-icon" aria-hidden="true"></span>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-appointment"
              data-id="${appointment.id}"
              aria-label="${escapeHtml(appointment.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function formatAppointmentTime(appointment) {
    if (appointment.startTime && appointment.endTime) {
      return `${formatTime(appointment.startTime)}–${formatTime(
        appointment.endTime,
      )} Uhr`;
    }
    return appointment.startTime ? `ab ${formatTime(appointment.startTime)} Uhr` : "";
  }

  function appointmentRelativeLabel(daysUntil) {
    if (daysUntil === 0) return "Heute";
    if (daysUntil === 1) return "Morgen";
    if (daysUntil > 1) return `In ${daysUntil} Tagen`;
    if (daysUntil === -1) return "Gestern";
    return `Vor ${Math.abs(daysUntil)} Tagen`;
  }

  function toggleDeviceMatrixMaximized() {
    setDeviceMatrixMaximized(
      !elements.deviceMatrixWidget.classList.contains("is-maximized"),
    );
  }

  function setDeviceMatrixMaximized(maximized) {
    const active = Boolean(maximized);
    const widget = elements.deviceMatrixWidget;
    if (active && !deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor = document.createComment("device-matrix-widget-anchor");
      widget.parentNode.insertBefore(deviceMatrixWidgetAnchor, widget);
      document.body.append(widget);
    } else if (!active && deviceMatrixWidgetAnchor) {
      deviceMatrixWidgetAnchor.parentNode?.insertBefore(widget, deviceMatrixWidgetAnchor);
      deviceMatrixWidgetAnchor.remove();
      deviceMatrixWidgetAnchor = null;
    }
    widget.classList.toggle("is-maximized", active);
    document.body.classList.toggle("is-device-matrix-maximized", active);
    elements.toggleDeviceMatrixMaximizeButton.setAttribute(
      "aria-pressed",
      String(active),
    );
    elements.toggleDeviceMatrixMaximizeButton.title = active
      ? "Einweisungsmatrix verkleinern (Esc)"
      : "Einweisungsmatrix maximieren";
    elements.deviceMatrixMaximizeLabel.textContent = active
      ? "Verkleinern"
      : "Maximieren";
    elements.deviceMatrixMaximizeIcon.setAttribute(
      "href",
      active ? "#icon-minimize" : "#icon-maximize",
    );
  }

  function handleDeviceMatrixMaximizeKeydown(event) {
    if (
      event.key !== "Escape" ||
      !elements.deviceMatrixWidget.classList.contains("is-maximized") ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    event.preventDefault();
    setDeviceMatrixMaximized(false);
    elements.toggleDeviceMatrixMaximizeButton.focus();
  }

  function renderDevices() {
    renderViewFilterChips("devices");
    renderViewFilterChips("device-management");
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    const categoryOptions = `
      <option value="all">Alle Kategorien</option>
      ${categories
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
        )
        .join("")}
    `;
    if (
      deviceCategoryFilter !== "all" &&
      !categories.includes(deviceCategoryFilter)
    ) {
      deviceCategoryFilter = "all";
    }
    if (
      deviceManagementCategoryFilter !== "all" &&
      !categories.includes(deviceManagementCategoryFilter)
    ) {
      deviceManagementCategoryFilter = "all";
    }
    elements.deviceCategoryFilter.innerHTML = categoryOptions;
    elements.deviceManagementCategoryFilter.innerHTML = categoryOptions;
    elements.deviceCategoryFilter.value = deviceCategoryFilter;
    elements.deviceManagementCategoryFilter.value =
      deviceManagementCategoryFilter;
    const authorizedEmployees = [
      ...new Map(
        state.devices
          .flatMap((device) => getDeviceAuthorizedEmployees(device.id))
          .map((employee) => [employee.id, employee]),
      ).values(),
    ].sort(sortEmployees);
    const validAuthorizationFilters = new Set([
      "all",
      "assigned",
      "unassigned",
      ...authorizedEmployees.map((employee) => `employee:${employee.id}`),
    ]);
    if (!validAuthorizationFilters.has(deviceManagementAuthorizationFilter)) {
      deviceManagementAuthorizationFilter = "all";
    }
    elements.deviceManagementAuthorizationFilter.innerHTML = `
      <option value="all">Alle Geräte</option>
      <option value="assigned">Mit Einweisungsberechtigten</option>
      <option value="unassigned">Ohne Einweisungsberechtigte</option>
      ${authorizedEmployees
        .map(
          (employee) =>
            `<option value="employee:${employee.id}">${escapeHtml(fullName(employee))}</option>`,
        )
        .join("")}
    `;
    elements.deviceManagementAuthorizationFilter.value =
      deviceManagementAuthorizationFilter;
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceManagementInventoryFilter.value =
      deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;

    const instructedEmployeeIds = new Set(
      state.deviceInstructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    );
    elements.deviceSummary.innerHTML = `
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => device.currentInventory).length,
        "verfügbare Geräte",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => device.currentInventory && device.annex1,
        ).length,
        "aktuelle Geräte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "check",
        state.deviceInstructions.length,
        "dokumentierte Einweisungen",
        "teal",
      )}
      ${renderSummaryChip(
        "check",
        instructedEmployeeIds.size,
        "Mitarbeiter mit Einweisung",
        "teal",
      )}
    `;
    elements.deviceManagementSummary.innerHTML = `
      ${renderSummaryChip("empty", state.devices.length, "Geräte gesamt")}
      ${renderSummaryChip(
        "check",
        state.devices.filter((device) => device.currentInventory).length,
        "aktuell im Bestand",
        "teal",
      )}
      ${renderSummaryChip(
        "empty",
        state.devices.filter((device) => !device.currentInventory).length,
        "nicht mehr im Bestand",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter((device) => device.annex1).length,
        "Medizinprodukte der Anlage 1",
        "orange",
      )}
      ${renderSummaryChip(
        "alert",
        state.devices.filter(
          (device) => getDeviceAuthorizedEmployees(device.id).length === 0,
        ).length,
        "ohne Einweisungsberechtigte",
        "orange",
      )}
    `;

    const visibleDevices = filteredDevices({
      inventoryFilter: deviceManagementInventoryFilter,
      annexFilter: deviceManagementAnnexFilter,
      categoryFilter: deviceManagementCategoryFilter,
      searchTerm: deviceManagementSearchTerm,
      authorizationFilter: deviceManagementAuthorizationFilter,
    });
    if (!state.devices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Geräte",
            text: "Legen Sie das erste Gerät an, bevor Einweisungen dokumentiert werden.",
            buttonText: "Erstes Gerät anlegen",
            buttonAttribute: "data-empty-add-device",
          })}
        </section>
      `;
      elements.deviceCatalog
        .querySelector("[data-empty-add-device]")
        ?.addEventListener("click", () => openDeviceDialog());
    } else if (!visibleDevices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Keine Geräte für diese Filter",
            text: deviceManagementSearchTerm
              ? "Passen Sie den Suchbegriff oder die Filter an."
              : "Passen Sie die Filter der Geräteverwaltung an.",
            compact: true,
          })}
        </section>
      `;
    } else {
      elements.deviceCatalog.innerHTML = visibleDevices
        .map(renderDeviceCard)
        .join("");
    }

    renderDeviceInstructionMatrix();
    renderDeviceInstructionList();
    refreshRecordInspector("device");
  }

  function filteredDevices({
    inventoryFilter = deviceInventoryFilter,
    annexFilter = deviceAnnexFilter,
    categoryFilter = deviceCategoryFilter,
    searchTerm = deviceSearchTerm,
    authorizationFilter = "all",
  } = {}) {
    return [...state.devices]
      .filter((device) => {
        if (inventoryFilter === "current" && !device.currentInventory) {
          return false;
        }
        if (inventoryFilter === "former" && device.currentInventory) {
          return false;
        }
        if (annexFilter === "yes" && !device.annex1) return false;
        if (annexFilter === "no" && device.annex1) return false;
        if (categoryFilter !== "all" && device.category !== categoryFilter) {
          return false;
        }
        // Die Berechtigten je Geraet zu ermitteln kostet einen Durchgang
        // durch alle Einweisungen. Gefragt wird danach nur, wenn auch
        // danach gefiltert wird - sonst zahlte jeder Aufbau der Geraeteliste
        // und der Matrix einen Durchgang je Geraet, ohne dass das Ergebnis
        // jemanden interessiert.
        if (authorizationFilter !== "all") {
          const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
          if (authorizationFilter === "assigned" && !authorizedEmployees.length) {
            return false;
          }
          if (authorizationFilter === "unassigned" && authorizedEmployees.length) {
            return false;
          }
          if (
            authorizationFilter.startsWith("employee:") &&
            !authorizedEmployees.some(
              (employee) =>
                employee.id === authorizationFilter.slice("employee:".length),
            )
          ) {
            return false;
          }
        }
        const normalizedSearchTerm = searchKey(searchTerm);
        if (!normalizedSearchTerm) return true;
        return searchKey(
          `${device.productName} ${device.manufacturer}`,
        ).includes(normalizedSearchTerm);
      })
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      );
  }

  function createDeviceExcelWorkbook(devices = state.devices) {
    const headers = [
      "ID bzw. Nummer",
      "Hersteller",
      "Produktname",
      "Gerätekategorie",
      "Anlage 1",
      "aktuell",
    ];
    const rows = [...devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.id.localeCompare(b.id, "de"),
      )
      .map((device) => [
        device.id,
        device.manufacturer,
        device.productName,
        device.category,
        device.annex1 ? "Ja" : "Nein",
        device.currentInventory ? "Ja" : "Nein",
      ]);
    const escapeXml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    const renderRow = (values, styleId) =>
      `<Row>${values
        .map(
          (value) =>
            `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join("")}</Row>`;
    const rowCount = rows.length + 1;

    return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" />
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#222222" />
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A6A6A6" /></Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#222222" />
   <Interior ss:Color="#E7E6E6" ss:Pattern="Solid" />
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center" ss:WrapText="1" />
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9" /></Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Geräte">
  <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="${rowCount}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Width="150" />
   <Column ss:Width="120" />
   <Column ss:Width="150" />
   <Column ss:Width="130" />
   <Column ss:Width="70" />
   <Column ss:Width="70" />
   ${renderRow(headers, "Header")}
   ${rows.map((row) => renderRow(row, "Data")).join("\n   ")}
  </Table>
  <AutoFilter x:Range="R1C1:R${rowCount}C6" xmlns="urn:schemas-microsoft-com:office:excel" />
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes />
   <FrozenNoSplit />
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
  }

  function exportDeviceCatalogExcel() {
    const workbook = createDeviceExcelWorkbook(state.devices);
    const date = todayIso();
    downloadTextFile(
      `TeO-Geraetekatalog-${date}.xls`,
      workbook,
      "application/vnd.ms-excel;charset=utf-8",
    );
    showToast(
      `${state.devices.length} Gerät${state.devices.length === 1 ? "" : "e"} wurden nach Excel exportiert.`,
    );
  }

  function renderDeviceCard(device) {
    const instructions = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === device.id,
    );
    const participantCount = new Set(
      instructions.flatMap((instruction) =>
        instruction.participants.map((participant) => participant.employeeId),
      ),
    ).size;
    const authorizedEmployees = getDeviceAuthorizedEmployees(device.id);
    return `
      <article
        class="training-card device-card ${device.currentInventory ? "" : "is-former"}"
        data-record-card="${device.id}"
        tabindex="0"
        aria-label="Schnellansicht zu ${escapeHtml(deviceLabel(device))} öffnen"
      >
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-empty"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(device.productName)}</h2>
              <p>${escapeHtml(device.manufacturer)} · ${escapeHtml(device.category)}</p>
              <span class="training-meta">
                ${device.currentInventory ? "Aktueller Gerätebestand" : "Nicht mehr im Gerätebestand"}
                ·
                ${device.annex1 ? "Medizinprodukt der Anlage 1" : "Kein Medizinprodukt der Anlage 1"}
                · ${participantCount} eingewiesene${participantCount === 1 ? "/r" : ""}
                Mitarbeiter/in${participantCount === 1 ? "" : "nen"}
              </span>
              <div class="device-authorization-summary ${
                authorizedEmployees.length ? "" : "is-missing"
              }">
                <strong>Einweisungsberechtigt</strong>
                <span>
                  ${
                    authorizedEmployees.length
                      ? authorizedEmployees
                          .map(
                            (employee) =>
                              `<span class="device-authorization-person">${escapeHtml(
                                fullName(employee),
                              )}</span>`,
                          )
                          .join("")
                      : "Keine einweisungsberechtigte Person hinterlegt"
                  }
                </span>
              </div>
            </div>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-device-instruction"
              data-id="${device.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Einweisung
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-device"
              data-id="${device.id}"
              aria-label="${escapeHtml(device.productName)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function getDeviceAuthorizedEmployees(deviceId) {
    const authorizedEmployeeIds = new Set(
      state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.instructorType === "manufacturer",
        )
        .flatMap((instruction) =>
          instruction.participants
            .filter((participant) => participant.wasMedicalProductsOfficer)
            .map((participant) => participant.employeeId),
        ),
    );
    return [...authorizedEmployeeIds]
      .map(getEmployee)
      .filter(Boolean)
      .sort(sortEmployees);
  }

  function renderDeviceInstructionMatrix() {
    const devices = filteredDevices();
    const employees = [...state.employees]
      .filter((employee) => {
        if (
          deviceEmployeeStatusFilter === "employed" &&
          employee.employmentStatus === "inactive"
        ) {
          return false;
        }
        if (
          !["all", "employed"].includes(deviceEmployeeStatusFilter) &&
          employee.employmentStatus !== deviceEmployeeStatusFilter
        ) {
          return false;
        }
        return (
          !deviceEmployeeSearchTerm ||
          searchKey(fullName(employee)).includes(deviceEmployeeSearchTerm)
        );
      })
      .sort(sortEmployees);

    if (!state.devices.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Matrix noch nicht verfügbar",
        text: "Nach dem Anlegen eines Geräts erscheint hier die Einweisungsmatrix.",
        compact: true,
      });
      return;
    }
    if (!devices.length || !employees.length) {
      elements.deviceInstructionMatrix.innerHTML = renderEmptyState({
        title: "Keine Matrixeinträge für diese Filter",
        text: "Passen Sie die Geräte- oder Mitarbeiterfilter an.",
        compact: true,
      });
      return;
    }

    elements.deviceInstructionMatrix.innerHTML = `
      <div
        class="device-matrix-scroll"
        tabindex="0"
        aria-label="Einweisungsmatrix nach Mitarbeiter und Gerät"
      >
        <table class="device-matrix-table">
          <thead>
            <tr>
              <th scope="col">Mitarbeiter</th>
              ${devices
                .map((device) => {
                  const instructionPercentage =
                    getDeviceInstructionPercentage(device.id, employees);
                  return `
                    <th scope="col" title="${escapeHtml(deviceLabel(device))}">
                      <button
                        class="device-matrix-device"
                        type="button"
                        data-device-overview="${device.id}"
                        aria-label="Einweisungsübersicht für ${escapeHtml(deviceLabel(device))} anzeigen"
                      >
                        <span>${escapeHtml(device.manufacturer)}</span>
                        <strong>${escapeHtml(device.productName)}</strong>
                        <small class="completion-progress ${completionProgressTone(
                          instructionPercentage,
                        )}">
                          ${instructionPercentage} % eingewiesen
                        </small>
                      </button>
                    </th>
                  `;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
              .map(
                (employee) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="device-matrix-employee"
                        type="button"
                        data-device-employee-overview="${employee.id}"
                        aria-label="Geräteübersicht für ${escapeHtml(fullName(employee))} anzeigen"
                      >
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        ${
                          employee.qualifications.medizinproduktebeauftragter
                            ? '<small class="device-mpo-status is-qualified">Gerätebeauftragte/r</small>'
                            : ""
                        }
                      </button>
                    </th>
                    ${devices
                      .map((device) =>
                        renderDeviceMatrixCell(employee, device),
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="device-matrix-hint">
        Grün zeigt eine dokumentierte Einweisung. Gold kennzeichnet eine
        Herstellereinweisung als Gerätebeauftragte/r. Gerätenamen und Statusfelder
        öffnen die jeweilige Detailübersicht.
      </p>
    `;
  }

  function filteredDeviceInstructions({
    searchTerm = deviceInstructionSearchTerm,
    sortKey = deviceInstructionSortKey,
  } = {}) {
    const normalizedSearchTerm = searchKey(searchTerm);
    const nachEingabe = sortKey === "createdAt";

    return [...state.deviceInstructions]
      .filter((instruction) => {
        if (!normalizedSearchTerm) return true;
        const device = getDevice(instruction.deviceId);
        const participantNames = instruction.participants
          .map((participant) => getEmployee(participant.employeeId))
          .filter(Boolean)
          .map(fullName);
        const searchableText = searchKey(
          [
            device?.productName,
            device?.manufacturer,
            instruction.instructorName,
            instruction.instructorType === "employee"
              ? "Interne Einweisung"
              : "Herstellereinweisung",
            instruction.date,
            String(instruction.createdAt || "").slice(0, 10),
            ...participantNames,
          ]
            .filter(Boolean)
            .join(" "),
        );
        return searchableText.includes(normalizedSearchTerm);
      })
      .sort((a, b) =>
        nachEingabe
          ? String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
            b.date.localeCompare(a.date)
          : b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
      );
  }

  function renderDeviceInstructionList() {
    elements.deviceInstructionSort.value = deviceInstructionSortKey;
    // Beide Sortierungen fallen auf das jeweils andere Datum zurueck, damit
    // gleichzeitig erfasste Nachweise eine stabile Reihenfolge behalten.
    const nachEingabe = deviceInstructionSortKey === "createdAt";
    const instructions = filteredDeviceInstructions();
    if (!instructions.length) {
      elements.deviceInstructionList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: state.deviceInstructions.length
              ? "Keine Einweisungen für diesen Filter"
              : "Noch keine Einweisungen dokumentiert",
            text: state.deviceInstructions.length
              ? "Passen Sie den Suchbegriff an."
              : "Gespeicherte Einweisungen erscheinen hier chronologisch.",
            compact: true,
          })}
        </section>
      `;
      return;
    }

    const shown = instructions.slice(0, deviceInstructionLogLimit);
    const remaining = instructions.length - shown.length;
    elements.deviceInstructionList.innerHTML = `
      <div class="device-instruction-log">
        ${shown
          .map((instruction) => {
            const device = getDevice(instruction.deviceId);
            if (!device) return "";
            const participantNames = instruction.participants
              .map((participant) => {
                const employee = getEmployee(participant.employeeId);
                if (!employee) return "";
                return `${fullName(employee)}${
                  participant.wasMedicalProductsOfficer
                    ? " · Gerätebeauftragte/r"
                    : ""
                }`;
              })
              .filter(Boolean);
            return `
              <article class="device-instruction-log-row">
                <time datetime="${instruction.date}">
                  ${formatDate(instruction.date)}
                  ${
                    nachEingabe
                      ? `<small>erfasst ${formatDate(
                          instruction.createdAt.slice(0, 10),
                        )}</small>`
                      : ""
                  }
                </time>
                <div class="device-instruction-log-device">
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}</small>
                </div>
                <div>
                  <strong>${escapeHtml(instruction.instructorName)}</strong>
                  <small>
                    ${
                      instruction.instructorType === "employee"
                        ? "Interne Einweisung"
                        : "Herstellereinweisung"
                    }
                  </small>
                </div>
                <div class="device-instruction-log-participants">
                  <strong>
                    ${instruction.participants.length} Teilnehmer/in${
                      instruction.participants.length === 1 ? "" : "nen"
                    }
                  </strong>
                  <small>${escapeHtml(participantNames.join(", "))}</small>
                </div>
                <div class="device-instruction-log-actions">
                  <button
                    class="icon-button"
                    type="button"
                    data-edit-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} bearbeiten"
                    title="Einweisung bearbeiten"
                  >
                    <svg><use href="#icon-edit"></use></svg>
                  </button>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisung vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Einweisung löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
        ${
          remaining
            ? `
              <button
                class="button button-secondary device-instruction-log-more"
                type="button"
                data-show-more-device-instructions
              >
                Weitere ${remaining} Einweisung${remaining === 1 ? "" : "en"} anzeigen
              </button>
            `
            : ""
        }
      </div>
    `;
    limitDeviceInstructionLogHeight();
  }

  function limitDeviceInstructionLogHeight() {
    const log = elements.deviceInstructionList.querySelector(
      ".device-instruction-log",
    );
    if (!log) return;
    log.style.maxHeight = "";
    const rows = [...log.querySelectorAll(".device-instruction-log-row")];
    if (rows.length <= VISIBLE_DEVICE_INSTRUCTION_ROWS || !log.offsetParent) {
      return;
    }
    const lastVisibleRow = rows[VISIBLE_DEVICE_INSTRUCTION_ROWS - 1];
    log.style.maxHeight = `${
      lastVisibleRow.offsetTop + lastVisibleRow.offsetHeight
    }px`;
  }

  function getDeviceInstructionPercentage(deviceId, employees) {
    if (!employees.length) return 0;
    const instructedEmployeeIds =
      deviceInstructionIndex().byDevice.get(deviceId) || EMPTY_EMPLOYEE_IDS;
    const instructedCount = employees.filter((employee) =>
      instructedEmployeeIds.has(employee.id),
    ).length;
    return Math.round((instructedCount / employees.length) * 100);
  }

  // Die Einweisungsmatrix stellt je Zelle dieselbe Frage: Welche Einweisungen
  // hat dieser Mitarbeiter an diesem Geraet? Ohne Index durchsucht jede der
  // Tausenden Zellen den gesamten Bestand samt Teilnehmerlisten. Ein Durchgang
  // beantwortet alle Fragen; der Index haelt, solange die Sammlung dieselbe
  // bleibt - sie wird bei jeder Aenderung neu aufgebaut.
  const EMPTY_EMPLOYEE_IDS = new Set();
  const deviceInstructionIndexCache = {
    instructions: null,
    count: -1,
    value: { byPair: new Map(), byDevice: new Map() },
  };

  function deviceInstructionIndex() {
    const cache = deviceInstructionIndexCache;
    if (
      cache.instructions === state.deviceInstructions &&
      cache.count === state.deviceInstructions.length
    ) {
      return cache.value;
    }

    const byPair = new Map();
    const byDevice = new Map();
    for (const instruction of state.deviceInstructions) {
      let employeeIds = byDevice.get(instruction.deviceId);
      if (!employeeIds) {
        employeeIds = new Set();
        byDevice.set(instruction.deviceId, employeeIds);
      }
      for (const participant of instruction.participants) {
        employeeIds.add(participant.employeeId);
        const key = `${instruction.deviceId}|${participant.employeeId}`;
        const bucket = byPair.get(key);
        if (bucket) bucket.push(instruction);
        else byPair.set(key, [instruction]);
      }
    }
    for (const bucket of byPair.values()) {
      bucket.sort((a, b) => b.date.localeCompare(a.date));
    }

    cache.instructions = state.deviceInstructions;
    cache.count = state.deviceInstructions.length;
    cache.value = { byPair, byDevice };
    return cache.value;
  }

  // Gemeinsam genutzt von der Einweisungsmatrix und der Jahresauswertung der
  // Pflichtfortbildungen, damit beide denselben Farbmassstab verwenden.
  function completionProgressTone(percentage) {
    if (percentage <= 65) return "is-low";
    if (percentage <= 80) return "is-medium";
    return "is-high";
  }

  function renderDeviceMatrixCell(employee, device) {
    const instructions =
      deviceInstructionIndex().byPair.get(`${device.id}|${employee.id}`) || [];
    if (!instructions.length) {
      return `
        <td>
          <span class="device-matrix-status is-missing" aria-label="Keine Einweisung">×</span>
        </td>
      `;
    }
    const latest = instructions[0];
    const hasManufacturerOfficerInstruction = instructions.some(
      (instruction) =>
        instruction.instructorType === "manufacturer" &&
        instruction.participants.some(
          (participant) =>
            participant.employeeId === employee.id &&
            participant.wasMedicalProductsOfficer,
        ),
    );
    return `
      <td>
        <button
          class="device-matrix-status ${
            hasManufacturerOfficerInstruction
              ? "is-manufacturer-officer"
              : "is-complete"
          }"
          type="button"
          data-device-history-employee="${employee.id}"
          data-device-history-device="${device.id}"
          aria-label="${instructions.length} Einweisung${instructions.length === 1 ? "" : "en"} für ${escapeHtml(
            fullName(employee),
          )} in ${escapeHtml(deviceLabel(device))} anzeigen${
            hasManufacturerOfficerInstruction
              ? ", Herstellereinweisung als Gerätebeauftragte/r vorhanden"
              : ""
          }"
        >
          <span>✓</span>
          <small>${formatDate(latest.date)}</small>
          ${instructions.length > 1 ? `<i>${instructions.length}</i>` : ""}
        </button>
      </td>
    `;
  }

  function handleDeviceAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "add-device-instruction") openDeviceInstructionDialog(id);
    if (action === "edit-device") openDeviceDialog(id);
    if (action === "delete-device") requestDeleteDevice(id);
  }

  function handleDeviceMatrixAction(event) {
    const deviceButton = event.target.closest("[data-device-overview]");
    if (deviceButton) {
      openDeviceOverview(deviceButton.dataset.deviceOverview);
      return;
    }
    const employeeButton = event.target.closest(
      "[data-device-employee-overview]",
    );
    if (employeeButton) {
      openDeviceEmployeeOverview(
        employeeButton.dataset.deviceEmployeeOverview,
      );
      return;
    }
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceHistoryAction(event) {
    const button = event.target.closest("[data-delete-device-instruction]");
    if (!button) return;
    requestDeleteDeviceInstruction(button.dataset.deleteDeviceInstruction);
  }

  function handleDeviceEmployeeOverviewAction(event) {
    const button = event.target.closest(
      "[data-device-history-employee][data-device-history-device]",
    );
    if (!button) return;
    openDeviceInstructionHistory(
      button.dataset.deviceHistoryEmployee,
      button.dataset.deviceHistoryDevice,
    );
  }

  function handleDeviceInstructionListAction(event) {
    const moreButton = event.target.closest("[data-show-more-device-instructions]");
    if (moreButton) {
      // Die Blickposition im Protokoll bleibt erhalten, sonst spraenge der
      // Kasten beim Nachladen an den Anfang zurueck.
      const log = moreButton.closest(".device-instruction-log");
      const scrollTop = log?.scrollTop || 0;
      deviceInstructionLogLimit += DEVICE_INSTRUCTION_LOG_PAGE;
      renderDeviceInstructionList();
      const refreshed = elements.deviceInstructionList.querySelector(
        ".device-instruction-log",
      );
      if (refreshed) refreshed.scrollTop = scrollTop;
      return;
    }
    const editButton = event.target.closest("[data-edit-device-instruction]");
    if (editButton) {
      openDeviceInstructionDialog(
        null,
        editButton.dataset.editDeviceInstruction,
      );
      return;
    }
    const deleteButton = event.target.closest("[data-delete-device-instruction]");
    if (deleteButton) {
      requestDeleteDeviceInstruction(deleteButton.dataset.deleteDeviceInstruction);
    }
  }

  function openDeviceDialog(deviceId = null) {
    elements.deviceForm.reset();
    document.querySelector("#deviceId").value = "";
    document.querySelector("#deviceCurrentInventory").checked = true;
    ["#deviceProductName", "#deviceManufacturer", "#deviceCategory"].forEach(
      (selector) => document.querySelector(selector).setCustomValidity(""),
    );
    const categories = [
      ...new Set(state.devices.map((device) => device.category)),
    ].sort((a, b) => a.localeCompare(b, "de"));
    document.querySelector("#deviceCategoryOptions").innerHTML = categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}"></option>`,
      )
      .join("");

    const device = deviceId ? getDevice(deviceId) : null;
    elements.deviceDialogTitle.textContent = device
      ? "Gerät bearbeiten"
      : "Gerät anlegen";
    elements.deviceSubmitLabel.textContent = device
      ? "Änderungen speichern"
      : "Gerät speichern";
    if (device) {
      document.querySelector("#deviceId").value = device.id;
      document.querySelector("#deviceProductName").value = device.productName;
      document.querySelector("#deviceManufacturer").value = device.manufacturer;
      document.querySelector("#deviceCategory").value = device.category;
      document.querySelector("#deviceAnnex1").value = device.annex1
        ? "yes"
        : "no";
      document.querySelector("#deviceCurrentInventory").checked =
        device.currentInventory;
    }
    elements.deviceDialog.showModal();
    captureCleanForm(elements.deviceForm);
    window.setTimeout(
      () => document.querySelector("#deviceProductName").focus(),
      0,
    );
  }

  async function handleDeviceSubmit(event) {
    event.preventDefault();
    const productName = document.querySelector("#deviceProductName");
    const manufacturer = document.querySelector("#deviceManufacturer");
    const category = document.querySelector("#deviceCategory");
    [
      [productName, "Bitte einen Produktnamen eingeben."],
      [manufacturer, "Bitte einen Hersteller eingeben."],
      [category, "Bitte eine Gerätekategorie eingeben."],
    ].forEach(([input, message]) => {
      input.setCustomValidity(input.value.trim() ? "" : message);
    });
    if (!elements.deviceForm.reportValidity()) return;

    const deviceId = document.querySelector("#deviceId").value;
    const existingDevice = deviceId ? getDevice(deviceId) : null;
    const now = new Date().toISOString();
    const device = {
      id: existingDevice?.id || createId(),
      productName: productName.value.trim(),
      manufacturer: manufacturer.value.trim(),
      category: category.value.trim(),
      annex1: document.querySelector("#deviceAnnex1").value === "yes",
      currentInventory: document.querySelector("#deviceCurrentInventory").checked,
      createdAt: existingDevice?.createdAt || now,
      updatedAt: now,
    };
    const committed = await commitStateMutation(() => {
      if (existingDevice) {
        state.devices = state.devices.map((item) =>
          item.id === device.id ? device : item,
        );
      } else {
        state.devices.push(device);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceForm);
    elements.deviceDialog.close();
    showToast(
      existingDevice ? "Gerät wurde aktualisiert." : "Gerät wurde angelegt.",
    );
  }

  function requestDeleteDevice(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    const instructionCount = state.deviceInstructions.filter(
      (instruction) => instruction.deviceId === deviceId,
    ).length;
    requestConfirmation({
      title: "Gerät löschen?",
      message: `„${deviceLabel(device)}“ wird dauerhaft entfernt.${
        instructionCount
          ? ` ${instructionCount} Einweisungsnachweis${
              instructionCount === 1 ? "" : "e"
            } werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Gerät löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.devices = state.devices.filter((item) => item.id !== deviceId);
          state.deviceInstructions = state.deviceInstructions.filter(
            (instruction) => instruction.deviceId !== deviceId,
          );
        }, { undo: "Gerät gelöscht" });
        if (committed) showUndoToast("Gerät wurde gelöscht.");
      },
    });
  }

  function openDeviceInstructionDialog(deviceId = null, instructionId = null) {
    if (!state.devices.length) {
      showToast("Bitte legen Sie zuerst ein Gerät an.", "error");
      return;
    }
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (instruction) => instruction.id === instructionId,
        )
      : null;
    if (instructionId && !existingInstruction) {
      showToast("Der Einweisungsnachweis wurde nicht gefunden.", "error");
      return;
    }
    elements.deviceInstructionForm.reset();
    deviceParticipantSearchTerm = "";
    deviceParticipantDraft = new Map();
    elements.deviceInstructionId.value = "";
    elements.deviceInstructionDialogTitle.textContent = existingInstruction
      ? "Einweisung bearbeiten"
      : "Einweisung dokumentieren";
    elements.deviceInstructionSubmitLabel.textContent = existingInstruction
      ? "Änderungen speichern"
      : "Einweisung speichern";
    elements.deviceParticipantSearch.value = "";
    elements.deviceParticipantError.textContent = "";
    elements.deviceInstructionDate.setCustomValidity("");
    elements.externalInstructorName.setCustomValidity("");
    elements.employeeInstructor.setCustomValidity("");
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.employeeInstructorMpoConfirmationError.textContent = "";
    // Bewusst kein Vorgabedatum: Einweisungen werden haeufig nachtraeglich
    // erfasst, ein voreingetragenes Heute wuerde leicht uebersehen.
    elements.deviceInstructionDate.value = "";
    elements.deviceInstructionDeviceSearch.value = "";
    elements.deviceInstructionDeviceError.textContent = "";
    deviceInstructionDeviceSearchTerm = "";
    deviceInstructionDeviceDraft = new Set();

    const selectedDeviceId = existingInstruction?.deviceId || deviceId;
    if (selectedDeviceId && getDevice(selectedDeviceId)) {
      deviceInstructionDeviceDraft.add(selectedDeviceId);
    }

    // Beim Bearbeiten gehoert der Nachweis zu genau einem Geraet; das
    // Sammelanlegen gibt es nur beim Neuanlegen.
    const einzelauswahl = Boolean(existingInstruction);
    elements.toggleAllInstructionDevices.hidden = einzelauswahl;
    elements.deviceSelectionHeadingLabel.textContent = einzelauswahl
      ? "Gerät"
      : "Geräte · Mehrfachauswahl möglich";
    elements.employeeInstructor.innerHTML = `
      <option value="">Bitte auswählen</option>
      ${[...state.employees]
        .sort(compareDeviceInstructionEmployees)
        .map(
          (employee) => `
            <option value="${employee.id}">
              ${escapeHtml(deviceInstructionEmployeeOptionLabel(employee))}${
                employee.qualifications.medizinproduktebeauftragter
                  ? " · aktuell Medizinproduktebeauftragte/r"
                  : ""
              }
            </option>
          `,
        )
        .join("")}
    `;
    if (existingInstruction) {
      elements.deviceInstructionId.value = existingInstruction.id;
      elements.deviceInstructionDate.value = existingInstruction.date;
      elements.deviceInstructorType.value = existingInstruction.instructorType;
      if (existingInstruction.instructorType === "employee") {
        elements.employeeInstructor.value =
          existingInstruction.instructorEmployeeId;
        elements.employeeInstructorMpoConfirmation.checked =
          existingInstruction.instructorWasMedicalProductsOfficer;
      } else {
        elements.externalInstructorName.value =
          existingInstruction.instructorName;
      }
      deviceParticipantDraft = new Map(
        existingInstruction.participants.map((participant) => [
          participant.employeeId,
          participant.wasMedicalProductsOfficer,
        ]),
      );
    } else {
      elements.deviceInstructorType.value = "manufacturer";
    }
    updateDeviceInstructorFields();
    renderInstructionDeviceList();
    renderDeviceParticipantList();
    elements.deviceInstructionDialog.showModal();
    // Erst jetzt ist die Liste vermessbar.
    limitInstructionDeviceListHeight();
    captureCleanForm(elements.deviceInstructionForm);
    window.setTimeout(() => elements.deviceInstructionDeviceSearch.focus(), 0);
  }

  function instructionDeviceSingleSelect() {
    return Boolean(elements.deviceInstructionId.value);
  }

  function filteredInstructionDevices() {
    return [...state.devices]
      .filter(
        (device) =>
          !deviceInstructionDeviceSearchTerm ||
          searchKey(`${device.manufacturer} ${device.productName}`).includes(
            deviceInstructionDeviceSearchTerm,
          ),
      )
      .sort(
        (a, b) =>
          a.manufacturer.localeCompare(b.manufacturer, "de") ||
          a.productName.localeCompare(b.productName, "de"),
      );
  }

  function renderInstructionDeviceList() {
    const devices = filteredInstructionDevices();
    const einzelauswahl = instructionDeviceSingleSelect();
    elements.deviceInstructionDeviceList.innerHTML = devices.length
      ? devices
          .map(
            (device) => `
              <label class="selection-card">
                <input
                  type="${einzelauswahl ? "radio" : "checkbox"}"
                  ${einzelauswahl ? 'name="deviceInstructionDeviceChoice"' : ""}
                  data-instruction-device="${device.id}"
                  ${deviceInstructionDeviceDraft.has(device.id) ? "checked" : ""}
                />
                <span class="device-selection-icon">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span>
                  <strong>${escapeHtml(device.productName)}</strong>
                  <small>${escapeHtml(device.manufacturer)}${
                    device.annex1 ? " · Anlage 1" : ""
                  }${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                </span>
              </label>
            `,
          )
          .join("")
      : '<p class="completion-empty">Keine Geräte für diese Suche gefunden.</p>';
    limitInstructionDeviceListHeight();
    updateInstructionDeviceCount();
  }

  // Fuenf Eintraege bleiben sichtbar. Die Hoehe wird an der ersten
  // ueberzaehligen Karte gemessen, weil lange Geraetenamen umbrechen koennen.
  // Solange der Dialog geschlossen ist, liefern alle Masse 0; die Begrenzung
  // wird dann beim Oeffnen nachgeholt.
  function limitInstructionDeviceListHeight() {
    const list = elements.deviceInstructionDeviceList;
    list.style.maxHeight = "";
    if (!list.offsetParent) return;

    const cards = [...list.querySelectorAll(".selection-card")];
    if (cards.length <= VISIBLE_INSTRUCTION_DEVICES) return;
    // Bis zur Unterkante der letzten sichtbaren Karte, zuzueglich des unteren
    // Innenabstands. Ueber die Oberkante der naechsten Karte gerechnet waere
    // der Rasterabstand doppelt gezaehlt und die fuenfte Karte abgeschnitten.
    // offsetTop/offsetHeight statt getBoundingClientRect: Der Dialog faehrt
    // beim Oeffnen skaliert ein, wodurch gemessene Rechtecke zu klein waeren.
    const letzte = cards[VISIBLE_INSTRUCTION_DEVICES - 1];
    const innenabstand =
      Number.parseFloat(getComputedStyle(list).paddingBottom) || 0;
    list.style.maxHeight = `${
      letzte.offsetTop + letzte.offsetHeight + innenabstand
    }px`;
  }

  function updateInstructionDeviceCount() {
    const selectedCount = deviceInstructionDeviceDraft.size;
    elements.toggleAllInstructionDevices.textContent =
      selectedCount && filteredInstructionDevices().every((device) =>
        deviceInstructionDeviceDraft.has(device.id),
      )
        ? "Sichtbare abwählen"
        : "Sichtbare auswählen";
    if (selectedCount) elements.deviceInstructionDeviceError.textContent = "";
  }

  function handleInstructionDeviceChange(event) {
    const checkbox = event.target.closest("[data-instruction-device]");
    if (!checkbox) return;
    const deviceId = checkbox.dataset.instructionDevice;
    if (instructionDeviceSingleSelect()) {
      deviceInstructionDeviceDraft = new Set([deviceId]);
    } else if (checkbox.checked) {
      deviceInstructionDeviceDraft.add(deviceId);
    } else {
      deviceInstructionDeviceDraft.delete(deviceId);
    }
    updateInstructionDeviceCount();
  }

  function toggleVisibleInstructionDevices() {
    const devices = filteredInstructionDevices();
    const alleGewaehlt = devices.every((device) =>
      deviceInstructionDeviceDraft.has(device.id),
    );
    devices.forEach((device) => {
      if (alleGewaehlt) deviceInstructionDeviceDraft.delete(device.id);
      else deviceInstructionDeviceDraft.add(device.id);
    });
    renderInstructionDeviceList();
  }

  function updateDeviceInstructorFields() {
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorField.hidden = isEmployee;
    elements.employeeInstructorFields.hidden = !isEmployee;
    elements.externalInstructorName.required = !isEmployee;
    elements.employeeInstructor.required = isEmployee;
    if (isEmployee) {
      elements.externalInstructorName.setCustomValidity("");
    } else {
      elements.employeeInstructor.setCustomValidity("");
      elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    }
  }

  function filteredDeviceParticipants() {
    return [...state.employees]
      .filter(
        (employee) =>
          !deviceParticipantSearchTerm ||
          searchKey(fullName(employee)).includes(deviceParticipantSearchTerm),
      )
      .sort(compareDeviceInstructionEmployees);
  }

  function compareDeviceInstructionEmployees(a, b) {
    return (
      a.lastName.localeCompare(b.lastName, "de", { sensitivity: "base" }) ||
      a.firstName.localeCompare(b.firstName, "de", { sensitivity: "base" }) ||
      a.id.localeCompare(b.id)
    );
  }

  function deviceInstructionEmployeeOptionLabel(employee) {
    return [employee.lastName, employee.firstName].filter(Boolean).join(", ");
  }

  function renderDeviceParticipantList() {
    const employees = filteredDeviceParticipants();
    elements.deviceParticipantList.innerHTML = employees.length
      ? employees
          .map((employee) => {
            const selected = deviceParticipantDraft.has(employee.id);
            const wasMpo = deviceParticipantDraft.get(employee.id) || false;
            return `
              <div class="device-participant-row">
                <label class="selection-card">
                  <input
                    type="checkbox"
                    data-device-participant="${employee.id}"
                    ${selected ? "checked" : ""}
                  />
                  ${renderAvatar(employee, true)}
                  <span>
                    <strong>${escapeHtml(fullName(employee))}</strong>
                    <small>${escapeHtml(
                      EMPLOYMENT_STATUSES[employee.employmentStatus] ||
                        employee.employmentStatus,
                    )}</small>
                  </span>
                </label>
                <label class="device-mpo-toggle">
                  <input
                    type="checkbox"
                    data-device-participant-mpo="${employee.id}"
                    ${wasMpo ? "checked" : ""}
                    ${selected ? "" : "disabled"}
                  />
                  <span>MP-Beauftragte/r</span>
                </label>
              </div>
            `;
          })
          .join("")
      : '<p class="completion-empty">Keine Mitarbeiter für diese Suche gefunden.</p>';
    updateDeviceParticipantCount();
  }

  function handleDeviceParticipantChange(event) {
    const participantCheckbox = event.target.closest(
      "[data-device-participant]",
    );
    if (participantCheckbox) {
      const employee = getEmployee(participantCheckbox.dataset.deviceParticipant);
      if (!employee) return;
      if (participantCheckbox.checked) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      } else {
        deviceParticipantDraft.delete(employee.id);
      }
      elements.deviceParticipantError.textContent = "";
      renderDeviceParticipantList();
      return;
    }
    const mpoCheckbox = event.target.closest("[data-device-participant-mpo]");
    if (mpoCheckbox && deviceParticipantDraft.has(mpoCheckbox.dataset.deviceParticipantMpo)) {
      deviceParticipantDraft.set(
        mpoCheckbox.dataset.deviceParticipantMpo,
        mpoCheckbox.checked,
      );
      updateDeviceParticipantCount();
    }
  }

  function toggleVisibleDeviceParticipants() {
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    visibleEmployees.forEach((employee) => {
      if (allSelected) {
        deviceParticipantDraft.delete(employee.id);
      } else if (!deviceParticipantDraft.has(employee.id)) {
        deviceParticipantDraft.set(
          employee.id,
          Boolean(employee.qualifications.medizinproduktebeauftragter),
        );
      }
    });
    renderDeviceParticipantList();
  }

  function updateDeviceParticipantCount() {
    const count = deviceParticipantDraft.size;
    elements.deviceParticipantCount.textContent = `${count} ausgewählt`;
    const visibleEmployees = filteredDeviceParticipants();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) =>
        deviceParticipantDraft.has(employee.id),
      );
    elements.toggleAllDeviceParticipants.textContent = allSelected
      ? "Sichtbare abwählen"
      : "Sichtbare auswählen";
  }

  async function handleDeviceInstructionSubmit(event) {
    event.preventDefault();
    const date = elements.deviceInstructionDate.value;
    elements.deviceInstructionDate.setCustomValidity(
      date && date > todayIso()
        ? "Das Einweisungsdatum darf nicht in der Zukunft liegen."
        : "",
    );
    const isEmployee = elements.deviceInstructorType.value === "employee";
    elements.externalInstructorName.setCustomValidity(
      !isEmployee && !elements.externalInstructorName.value.trim()
        ? "Bitte den Namen des Einweisenden eingeben."
        : "",
    );
    const instructorConfirmationMissing =
      isEmployee && !elements.employeeInstructorMpoConfirmation.checked;
    elements.employeeInstructorMpoConfirmation.setCustomValidity("");
    elements.employeeInstructorMpoConfirmationError.textContent =
      instructorConfirmationMissing
        ? "Bitte bestätigen Sie den Status zum Einweisungszeitpunkt."
        : "";
    if (!elements.deviceInstructionForm.reportValidity()) return;
    if (instructorConfirmationMissing) {
      elements.employeeInstructorMpoConfirmation
        .closest(".device-instructor-confirmation")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      elements.employeeInstructorMpoConfirmation.focus({ preventScroll: true });
      return;
    }
    if (!deviceInstructionDeviceDraft.size) {
      elements.deviceInstructionDeviceError.textContent =
        "Bitte mindestens ein Gerät auswählen.";
      elements.deviceInstructionDeviceSearch.focus();
      return;
    }
    if (!deviceParticipantDraft.size) {
      elements.deviceParticipantError.textContent =
        "Bitte mindestens einen Einweisungsteilnehmer auswählen.";
      return;
    }
    const instructorEmployee = isEmployee
      ? getEmployee(elements.employeeInstructor.value)
      : null;
    if (isEmployee && !instructorEmployee) {
      elements.employeeInstructor.setCustomValidity(
        "Bitte eine einweisende Person auswählen.",
      );
      elements.employeeInstructor.reportValidity();
      return;
    }
    const instructionId = elements.deviceInstructionId.value;
    const existingInstruction = instructionId
      ? state.deviceInstructions.find(
          (item) => item.id === instructionId,
        )
      : null;
    // Alle ausgewaehlten Geraete erhalten denselben Nachweis - je Geraet ein
    // eigener Datensatz, damit Verlauf und Matrix unveraendert funktionieren.
    const gemeinsameAngaben = {
      date,
      instructorType: isEmployee ? "employee" : "manufacturer",
      instructorEmployeeId: instructorEmployee?.id || "",
      instructorName: instructorEmployee
        ? fullName(instructorEmployee)
        : elements.externalInstructorName.value.trim(),
      instructorWasMedicalProductsOfficer: isEmployee,
      participants: [...deviceParticipantDraft].map(
        ([employeeId, wasMedicalProductsOfficer]) => ({
          employeeId,
          wasMedicalProductsOfficer,
        }),
      ),
    };
    const erstellt = new Date().toISOString();
    const instructions = [...deviceInstructionDeviceDraft].map((deviceId) => ({
      id: existingInstruction?.id || createId(),
      deviceId,
      ...gemeinsameAngaben,
      createdAt: existingInstruction?.createdAt || erstellt,
    }));

    const committed = await commitStateMutation(() => {
      if (existingInstruction) {
        state.deviceInstructions = state.deviceInstructions.map((item) =>
          item.id === instructions[0].id ? instructions[0] : item,
        );
      } else {
        state.deviceInstructions.push(...instructions);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceInstructionForm);
    elements.deviceInstructionDialog.close();
    const teilnehmerzahl = gemeinsameAngaben.participants.length;
    const teilnehmerText = `${teilnehmerzahl} Mitarbeiter/in${
      teilnehmerzahl === 1 ? "" : "nen"
    }`;
    showToast(
      existingInstruction
        ? "Einweisung wurde aktualisiert."
        : instructions.length === 1
          ? `Einweisung wurde für ${teilnehmerText} gespeichert.`
          : `${instructions.length} Einweisungen wurden für ${teilnehmerText} gespeichert.`,
    );
  }

  function getEmployeeDeviceOverview(employeeId) {
    return [...state.devices]
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      )
      .map((device) => {
        const instructions = state.deviceInstructions
          .filter(
            (instruction) =>
              instruction.deviceId === device.id &&
              instruction.participants.some(
                (participant) => participant.employeeId === employeeId,
              ),
          )
          .sort(
            (a, b) =>
              b.date.localeCompare(a.date) ||
              String(b.createdAt || "").localeCompare(
                String(a.createdAt || ""),
              ),
          );
        return {
          device,
          instructions,
          latestInstruction: instructions[0] || null,
          isInstructed: instructions.length > 0,
        };
      });
  }

  function getDeviceEmployeeOverview(deviceId) {
    return [...state.employees].sort(sortEmployees).map((employee) => {
      const instructions = state.deviceInstructions
        .filter(
          (instruction) =>
            instruction.deviceId === deviceId &&
            instruction.participants.some(
              (participant) => participant.employeeId === employee.id,
            ),
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        );
      return {
        employee,
        instructions,
        latestInstruction: instructions[0] || null,
        isInstructed: instructions.length > 0,
      };
    });
  }

  function filterDeviceEmployeeOverview(
    overview,
    {
      searchTerm = "",
      instructionFilter = "all",
      employmentFilter = "employed",
    } = {},
  ) {
    const normalizedSearch = searchKey(searchTerm);
    return overview.filter(({ employee, isInstructed }) => {
      if (instructionFilter === "instructed" && !isInstructed) return false;
      if (instructionFilter === "missing" && isInstructed) return false;
      if (
        employmentFilter === "employed" &&
        employee.employmentStatus === "inactive"
      ) {
        return false;
      }
      if (
        !["all", "employed"].includes(employmentFilter) &&
        employee.employmentStatus !== employmentFilter
      ) {
        return false;
      }
      return (
        !normalizedSearch ||
        searchKey(
          [fullName(employee), employee.profession].filter(Boolean).join(" "),
        ).includes(normalizedSearch)
      );
    });
  }

  function openDeviceOverview(deviceId) {
    const device = getDevice(deviceId);
    if (!device) return;
    deviceOverviewDeviceId = device.id;
    deviceOverviewInstructionFilter = "all";
    deviceOverviewEmploymentFilter = "employed";
    deviceOverviewSearchTerm = "";
    elements.deviceOverviewSearch.value = "";
    elements.deviceOverviewInstructionFilter.value = "all";
    elements.deviceOverviewEmploymentFilter.value = "employed";
    elements.deviceOverviewTitle.textContent = device.productName;
    elements.deviceOverviewSubtitle.textContent = [
      device.manufacturer,
      device.category,
      device.currentInventory ? "aktueller Bestand" : "nicht mehr im Bestand",
    ].join(" · ");
    renderDeviceOverview();
    if (!elements.deviceOverviewDialog.open) {
      elements.deviceOverviewDialog.showModal();
    }
    window.setTimeout(() => elements.deviceOverviewSearch.focus(), 0);
  }

  function renderDeviceOverview() {
    const device = getDevice(deviceOverviewDeviceId);
    if (!device) return;
    const completeOverview = getDeviceEmployeeOverview(device.id);
    const overview = filterDeviceEmployeeOverview(completeOverview, {
      searchTerm: deviceOverviewSearchTerm,
      instructionFilter: deviceOverviewInstructionFilter,
      employmentFilter: deviceOverviewEmploymentFilter,
    });
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    const missingCount = overview.length - instructedCount;
    elements.deviceOverviewContent.innerHTML = `
      <div class="device-employee-overview-summary" aria-label="Zusammenfassung der gefilterten Mitarbeiter">
        <span><strong>${overview.length}</strong> sichtbar</span>
        <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
        <span class="is-missing"><strong>${missingCount}</strong> nicht eingewiesen</span>
      </div>
      ${
        overview.length
          ? `<div class="device-employee-overview-list">
              ${overview
                .map(({ employee, instructions, latestInstruction, isInstructed }) => {
                  const details = isInstructed
                    ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                    : "Für diese Person ist keine Einweisung dokumentiert.";
                  const content = `
                    ${renderAvatar(employee, true)}
                    <span class="device-employee-overview-device">
                      <strong>${escapeHtml(fullName(employee))}</strong>
                      <small>${escapeHtml(employee.profession)} · ${escapeHtml(employeeStatusLabel(employee))}</small>
                      <small>${details}</small>
                    </span>
                    <span class="status-badge ${isInstructed ? "" : "inactive"}">
                      ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                    </span>
                    ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
                  `;
                  return isInstructed
                    ? `<button
                        class="device-employee-overview-row"
                        type="button"
                        data-device-history-employee="${employee.id}"
                        data-device-history-device="${device.id}"
                        aria-label="Einweisungsverlauf für ${escapeHtml(fullName(employee))} anzeigen"
                      >${content}</button>`
                    : `<article class="device-employee-overview-row is-missing">${content}</article>`;
                })
                .join("")}
            </div>`
          : renderEmptyState({
              title: "Keine Mitarbeiter für diese Filter",
              text: "Ändern Sie die Suche oder die ausgewählten Statusfilter.",
              compact: true,
            })
      }
    `;
  }

  function openDeviceEmployeeOverview(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const overview = getEmployeeDeviceOverview(employeeId);
    const instructedCount = overview.filter((item) => item.isInstructed).length;
    elements.deviceEmployeeOverviewTitle.textContent = fullName(employee);
    elements.deviceEmployeeOverviewSubtitle.textContent = overview.length
      ? `${instructedCount} von ${overview.length} Geräten mit dokumentierter Einweisung`
      : "Keine Geräte angelegt";
    elements.deviceEmployeeOverviewContent.innerHTML = overview.length
      ? `
        <div class="device-employee-overview-summary" aria-label="Zusammenfassung">
          <span><strong>${overview.length}</strong> Geräte gesamt</span>
          <span class="is-complete"><strong>${instructedCount}</strong> eingewiesen</span>
          <span class="is-missing"><strong>${overview.length - instructedCount}</strong> nicht eingewiesen</span>
        </div>
        <div class="device-employee-overview-list">
          ${overview
            .map(({ device, instructions, latestInstruction, isInstructed }) => {
              const details = isInstructed
                ? `Zuletzt am ${formatDate(latestInstruction.date)} · Einweisende Person: ${escapeHtml(latestInstruction.instructorName)}`
                : "Für dieses Gerät ist keine Einweisung dokumentiert.";
              const content = `
                <span class="device-employee-overview-icon" aria-hidden="true">
                  <svg><use href="#icon-device"></use></svg>
                </span>
                <span class="device-employee-overview-device">
                  <strong>${escapeHtml(deviceLabel(device))}</strong>
                  <small>${escapeHtml(device.category)}${device.currentInventory ? "" : " · nicht mehr im Bestand"}</small>
                  <small>${details}</small>
                </span>
                <span class="status-badge ${isInstructed ? "" : "inactive"}">
                  ${isInstructed ? "Eingewiesen" : "Nicht eingewiesen"}
                </span>
                ${instructions.length > 1 ? `<span class="device-employee-overview-count">${instructions.length} Nachweise</span>` : ""}
              `;
              return isInstructed
                ? `
                  <button
                    class="device-employee-overview-row"
                    type="button"
                    data-device-history-employee="${employeeId}"
                    data-device-history-device="${device.id}"
                    aria-label="Einweisungsverlauf für ${escapeHtml(deviceLabel(device))} anzeigen"
                  >${content}</button>
                `
                : `<article class="device-employee-overview-row is-missing">${content}</article>`;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Noch keine Geräte",
          text: "Nach dem Anlegen eines Geräts erscheint hier der Einweisungsstatus.",
          compact: true,
        });
    if (!elements.deviceEmployeeOverviewDialog.open) {
      elements.deviceEmployeeOverviewDialog.showModal();
    }
  }

  function openDeviceInstructionHistory(employeeId, deviceId) {
    const employee = getEmployee(employeeId);
    const device = getDevice(deviceId);
    if (!employee || !device) return;
    const instructions = state.deviceInstructions
      .filter(
        (instruction) =>
          instruction.deviceId === deviceId &&
          instruction.participants.some(
            (participant) => participant.employeeId === employeeId,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    elements.deviceInstructionHistoryTitle.textContent = fullName(employee);
    elements.deviceInstructionHistorySubtitle.textContent = deviceLabel(device);
    elements.deviceInstructionHistoryContent.innerHTML = instructions.length
      ? `
        <div class="device-history-list">
          ${instructions
            .map((instruction) => {
              const participant = instruction.participants.find(
                (item) => item.employeeId === employeeId,
              );
              return `
                <article class="device-history-row">
                  <div>
                    <strong>${formatDate(instruction.date)}</strong>
                    <small>
                      Einweisende Person: ${escapeHtml(instruction.instructorName)}
                      · ${
                        instruction.instructorType === "employee"
                          ? "interne/r Medizinproduktebeauftragte/r"
                          : "von der Herstellerfirma beauftragt"
                      }
                    </small>
                  </div>
                  <span class="status-badge ${
                    participant?.wasMedicalProductsOfficer ? "onboarding" : ""
                  }">
                    ${
                      participant?.wasMedicalProductsOfficer
                        ? "Teilnehmer/in war MP-Beauftragte/r"
                        : "Teilnehmer/in ohne MP-Beauftragtenstatus"
                    }
                  </span>
                  <button
                    class="icon-button danger"
                    type="button"
                    data-delete-device-instruction="${instruction.id}"
                    aria-label="Einweisungsnachweis vom ${formatDate(
                      instruction.date,
                    )} löschen"
                    title="Nachweis löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Einweisungen",
          text: "Für diese Kombination sind keine Nachweise vorhanden.",
          compact: true,
        });
    applyAccessControl();
    if (!elements.deviceInstructionHistoryDialog.open) {
      elements.deviceInstructionHistoryDialog.showModal();
    }
  }

  function requestDeleteDeviceInstruction(instructionId) {
    const instruction = state.deviceInstructions.find(
      (item) => item.id === instructionId,
    );
    if (!instruction) return;
    requestConfirmation({
      title: "Einweisungsnachweis löschen?",
      message: `Die Einweisung vom ${formatDate(
        instruction.date,
      )} für ${instruction.participants.length} Teilnehmer/in${
        instruction.participants.length === 1 ? "" : "nen"
      } wird dauerhaft gelöscht.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.deviceInstructions = state.deviceInstructions.filter(
            (item) => item.id !== instructionId,
          );
        }, { undo: "Einweisungsnachweis gelöscht" });
        if (!committed) return;
        if (elements.deviceInstructionHistoryDialog.open) {
          elements.deviceInstructionHistoryDialog.close();
        }
        showUndoToast("Einweisungsnachweis wurde gelöscht.");
      },
    });
  }

  function deviceLabel(device) {
    return `${device.manufacturer} ${device.productName}`.trim();
  }

  function renderMeetings() {
    const availableYears = getMeetingDisplayYears();
    if (!availableYears.includes(meetingDisplayYear)) {
      meetingDisplayYear = new Date().getFullYear();
    }
    elements.meetingDisplayYear.innerHTML = availableYears
      .map(
        (year) =>
          `<option value="${year}" ${year === meetingDisplayYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");

    const displayedMeetings = meetingsForDisplayYear();
    const meetingStats = displayedMeetings.map((meeting) => getMeetingStats(meeting));
    const completedMeetings = meetingStats.filter(
      (stats) => stats.total > 0 && stats.documented === stats.total,
    ).length;
    const openEntries = meetingStats.reduce((sum, stats) => sum + stats.open, 0);

    elements.meetingSummary.innerHTML = `
      ${renderSummaryChip("meeting", displayedMeetings.length, `Teamsitzungen ${meetingDisplayYear}`)}
      ${renderSummaryChip("check", completedMeetings, "vollständig dokumentiert", "teal")}
      ${renderSummaryChip("alert", openEntries, "Teilnahmestatus offen", "orange")}
    `;
    elements.openMeetingStatsButton.disabled = state.meetings.length === 0;

    if (state.meetings.length === 0) {
      elements.meetingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Teamsitzungen",
            text: "Legen Sie die erste Sitzung an. Anschließend kann der Status des gesamten aktiven Teams gesammelt erfasst werden.",
            buttonText: "Erste Teamsitzung anlegen",
            buttonAttribute: "data-empty-add-meeting",
          })}
        </section>
      `;
      elements.meetingList
        .querySelector("[data-empty-add-meeting]")
        ?.addEventListener("click", () => openMeetingDialog());
      return;
    }

    if (displayedMeetings.length === 0) {
      elements.meetingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: `Keine Teamsitzungen ${meetingDisplayYear}`,
            text: "Wählen Sie ein anderes Jahr oder legen Sie eine Teamsitzung an.",
            buttonText: "Teamsitzung anlegen",
            buttonAttribute: "data-empty-add-meeting",
          })}
        </section>
      `;
      elements.meetingList
        .querySelector("[data-empty-add-meeting]")
        ?.addEventListener("click", () => openMeetingDialog());
      return;
    }

    elements.meetingList.innerHTML = displayedMeetings
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt),
      )
      .map(renderMeetingCard)
      .join("");
  }

  function getMeetingDisplayYears() {
    return [
      ...new Set([
        new Date().getFullYear(),
        ...state.meetings.map((meeting) => Number(meeting.date.slice(0, 4))),
      ]),
    ]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((yearA, yearB) => yearB - yearA);
  }

  function meetingsForDisplayYear(year = meetingDisplayYear) {
    return state.meetings.filter(
      (meeting) => Number(meeting.date.slice(0, 4)) === Number(year),
    );
  }

  function renderMeetingCard(meeting) {
    const stats = getMeetingStats(meeting);
    const records = state.meetingAttendances
      .filter((attendance) => attendance.meetingId === meeting.id)
      .sort((a, b) => {
        const employeeA = getEmployee(a.employeeId);
        const employeeB = getEmployee(b.employeeId);
        if (!employeeA || !employeeB) return 0;
        return sortEmployees(employeeA, employeeB);
      });
    const breakdown = Object.keys(ATTENDANCE_STATUSES)
      .map((status) => ({
        status,
        count: records.filter((record) => record.status === status).length,
      }))
      .filter((item) => item.count > 0);

    return `
      <article class="meeting-card">
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon meeting-icon">
              <svg><use href="#icon-meeting"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(meeting.title)}</h2>
              <p>${escapeHtml(meeting.notes || "Keine Bemerkung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${formatDate(meeting.date)}${meeting.time ? ` · ${formatTime(meeting.time)} Uhr` : ""}
              </span>
            </div>
          </div>
          <div class="meeting-progress-block">
            <div class="meeting-progress-label">
              <strong>${stats.documented} von ${stats.total} dokumentiert</strong>
              <span>${stats.percent}&thinsp;%</span>
            </div>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(meeting.title)}: ${stats.percent} Prozent dokumentiert"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${stats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${stats.percent}%` })}></div>
            </div>
            <div class="meeting-breakdown">
              ${
                breakdown.length
                  ? breakdown
                      .map(
                        ({ status, count }) =>
                          `<span class="attendance-badge attendance-${ATTENDANCE_STATUSES[status].tone}">${count} ${escapeHtml(
                            ATTENDANCE_STATUSES[status].label,
                          )}</span>`,
                      )
                      .join("")
                  : '<span class="attendance-badge attendance-muted">Noch keine Erfassung</span>'
              }
            </div>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="record-attendance"
              data-id="${meeting.id}"
            >
              <svg><use href="#icon-users"></use></svg>
              Teilnahme erfassen
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-meeting"
              data-id="${meeting.id}"
              aria-label="${escapeHtml(meeting.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-meeting"
              data-id="${meeting.id}"
              aria-label="${escapeHtml(meeting.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <details class="training-card-details">
          <summary>${records.length} dokumentierte${records.length === 1 ? "r" : ""} Status${
            records.length === 1 ? "" : ""
          }</summary>
          <div class="meeting-attendance-history">
            ${
              records.length
                ? records.map(renderMeetingAttendanceHistoryRow).join("")
                : '<p class="completion-empty">Die Teilnahme wurde noch nicht dokumentiert.</p>'
            }
          </div>
        </details>
      </article>
    `;
  }

  function renderMeetingAttendanceHistoryRow(attendance) {
    const employee = getEmployee(attendance.employeeId);
    const status = ATTENDANCE_STATUSES[attendance.status];
    if (!employee || !status) return "";

    return `
      <div class="meeting-history-row">
        <div class="completion-person">
          ${renderAvatar(employee, true)}
          <strong>${escapeHtml(fullName(employee))}</strong>
          ${
            employee.employmentStatus === "active"
              ? ""
              : `<span class="tag tag-muted">${escapeHtml(
                  employeeStatusLabel(employee),
                )}</span>`
          }
        </div>
        <span class="attendance-badge attendance-${status.tone}">${escapeHtml(status.label)}</span>
      </div>
    `;
  }

  function openMeetingStatsDialog() {
    const years = [...new Set(
      state.meetings
        .map((meeting) => Number(meeting.date.slice(0, 4)))
        .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100),
    )].sort((a, b) => b - a);

    if (years.length === 0) {
      showToast("Für die Auswertung sind noch keine Teamsitzungen vorhanden.", "error");
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = years.includes(currentYear) ? currentYear : years[0];
    elements.meetingStatsYear.innerHTML = years
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");
    elements.meetingAttendanceThreshold.value = String(
      state.settings.meetingAttendanceThreshold,
    );
    renderMeetingStatistics();
    elements.meetingStatsDialog.showModal();
  }

  function renderMeetingStatistics() {
    const year = Number(elements.meetingStatsYear.value);
    const statistics = getAnnualMeetingStatistics(year);

    if (statistics.meetingCount === 0) {
      elements.meetingStatsContent.innerHTML = renderEmptyState({
        title: "Keine Teamsitzungen in diesem Jahr",
        text: "Wählen Sie ein anderes Auswertungsjahr.",
        compact: true,
      });
      return;
    }

    const chartSegments = [
      ...Object.entries(ATTENDANCE_STATUSES)
        .filter(([status]) => status !== "nicht_zutreffend")
        .map(([status, config]) => ({
          key: status,
          label: config.label,
          count: statistics.statusCounts[status],
          color: ATTENDANCE_CHART_COLORS[status],
        })),
      {
        key: "open",
        label: "Noch offen",
        count: statistics.open,
        color: ATTENDANCE_CHART_COLORS.open,
      },
    ].filter((segment) => segment.count > 0);
    let chartPosition = 0;
    const chartStops = chartSegments
      .map((segment) => {
        const start = chartPosition;
        chartPosition += statistics.totalSlots
          ? (segment.count / statistics.totalSlots) * 100
          : 0;
        return `${segment.color} ${start.toFixed(2)}% ${chartPosition.toFixed(2)}%`;
      })
      .join(", ");
    const chartDescription = chartSegments
      .map((segment) => `${segment.label}: ${segment.count}`)
      .join(", ") || "Keine erwarteten Personenplätze";
    const chartBackground = chartStops
      ? `conic-gradient(${chartStops})`
      : "var(--slate-100)";

    elements.meetingStatsContent.innerHTML = `
      <div class="meeting-stat-cards">
        ${renderMeetingStatCard("Teamsitzungen", statistics.meetingCount, `${year}`)}
        ${renderMeetingStatCard(
          "Ø Teilnahmen",
          formatDecimal(statistics.averageParticipated),
          "pro Sitzung",
        )}
        ${renderMeetingStatCard(
          "Ø Abwesenheiten",
          formatDecimal(statistics.averageAbsent),
          "pro Sitzung",
        )}
        ${renderMeetingStatCard(
          "Teilnahmequote",
          `${statistics.attendanceRate} %`,
          "der dokumentierten Status",
        )}
        ${renderMeetingStatCard(
          "Dokumentationsstand",
          `${statistics.documentationRate} %`,
          `${statistics.documented} von ${statistics.totalSlots} Status`,
        )}
      </div>

      <section class="meeting-chart-section" aria-labelledby="meetingChartTitle">
        <div class="meeting-chart-copy">
          <p class="eyebrow">Verteilung aller Personenplätze</p>
          <h3 id="meetingChartTitle">Teilnahmen und Abwesenheitsgründe</h3>
          <p>
            Grundlage sind ${statistics.totalSlots} erwartete Personenplätze aus
            ${statistics.meetingCount} Sitzung${statistics.meetingCount === 1 ? "" : "en"}.
          </p>
        </div>
        <div class="meeting-chart-layout">
          <div
            class="meeting-pie-chart"
            role="img"
            aria-label="${escapeHtml(chartDescription)}"
            ${dynamicStyle({ "--chart-segments": chartBackground })}
          >
            <span>
              <strong>${statistics.participated}</strong>
              Teilnahmen
            </span>
          </div>
          <div class="meeting-chart-legend">
            ${
              chartSegments.length
                ? chartSegments
                    .map(
                      (segment) => `
                  <div class="meeting-legend-item">
                    <span
                      class="meeting-legend-color"
                      ${dynamicStyle({ "--legend-color": segment.color })}
                      aria-hidden="true"
                    ></span>
                    <span>${escapeHtml(segment.label)}</span>
                    <strong>${segment.count}</strong>
                    <small>${percentage(segment.count, statistics.totalSlots)} %</small>
                  </div>
                `,
                    )
                    .join("")
                : '<p class="meeting-chart-empty">Für diese Sitzungen waren keine Mitarbeiter hinterlegt.</p>'
            }
          </div>
        </div>
      </section>

      <section class="meeting-stat-table-section" aria-labelledby="meetingStatTableTitle">
        <h3 id="meetingStatTableTitle">Sitzungen im Jahresvergleich</h3>
        <div class="meeting-stat-table-wrap">
          <table class="meeting-stat-table">
            <thead>
              <tr>
                <th scope="col">Datum</th>
                <th scope="col">Teamsitzung</th>
                <th scope="col">Teilgenommen</th>
                <th scope="col">Abwesend</th>
                <th scope="col">Offen</th>
              </tr>
            </thead>
            <tbody>
              ${statistics.meetings
                .map(
                  (meeting) => `
                    <tr>
                      <td>${formatDate(meeting.date)}</td>
                      <td>${escapeHtml(meeting.title)}</td>
                      <td>${meeting.participated}</td>
                      <td>${meeting.absent}</td>
                      <td>${meeting.open}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="meeting-stat-table-section" aria-labelledby="employeeMeetingStatTitle">
        <h3 id="employeeMeetingStatTitle">Teilnahme je Mitarbeiter</h3>
        <p class="field-hint">
          Markiert werden Quoten unter ${state.settings.meetingAttendanceThreshold} %.
        </p>
        <div class="meeting-stat-table-wrap">
          <table class="meeting-stat-table employee-meeting-stat-table">
            <thead>
              <tr>
                <th scope="col">Mitarbeiter</th>
                <th scope="col">Erwartet</th>
                <th scope="col">Teilgenommen</th>
                <th scope="col">Urlaub</th>
                <th scope="col">Dienst</th>
                <th scope="col">Krankheit</th>
                <th scope="col">Schule</th>
                <th scope="col">Entschuldigt</th>
                <th scope="col">Unentschuldigt</th>
                <th scope="col">Nicht zutreffend</th>
                <th scope="col">Quote</th>
              </tr>
            </thead>
            <tbody>
              ${statistics.employeeRows
                .map(
                  (employee) => `
                    <tr class="${
                      employee.expected > 0 &&
                      employee.attendanceRate < state.settings.meetingAttendanceThreshold
                        ? "is-below-threshold"
                        : ""
                    }">
                      <td>${escapeHtml(employee.name)}</td>
                      <td>${employee.expected}</td>
                      <td>${employee.statusCounts.teilgenommen}</td>
                      <td>${employee.statusCounts.urlaub}</td>
                      <td>${employee.statusCounts.dienst}</td>
                      <td>${employee.statusCounts.krankheit}</td>
                      <td>${employee.statusCounts.schule}</td>
                      <td>${employee.statusCounts.entschuldigt}</td>
                      <td>${employee.statusCounts.unentschuldigt}</td>
                      <td>${employee.statusCounts.nicht_zutreffend}</td>
                      <td><strong>${employee.attendanceRate} %</strong></td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  async function updateMeetingAttendanceThreshold() {
    const threshold = clampNumber(
      elements.meetingAttendanceThreshold.value,
      1,
      100,
      70,
    );
    if (threshold === state.settings.meetingAttendanceThreshold) return;
    const committed = await commitStateMutation(() => {
      state.settings.meetingAttendanceThreshold = threshold;
    });
    if (committed) renderMeetingStatistics();
  }

  function exportMeetingStatsCsv() {
    const year = Number(elements.meetingStatsYear.value);
    const statistics = getAnnualMeetingStatistics(year);
    if (!statistics.employeeRows.length) {
      showToast("Für dieses Jahr sind keine Mitarbeiterdaten vorhanden.", "error");
      return;
    }
    downloadCsv(
      `teo-teamsitzungen_${year}.csv`,
      [
        "Mitarbeiter",
        "Erwartet",
        "Teilgenommen",
        "Urlaub",
        "Dienst",
        "Krankheit",
        "Schule",
        "Entschuldigt",
        "Unentschuldigt",
        "Nicht zutreffend",
        "Offen",
        "Teilnahmequote",
      ],
      statistics.employeeRows.map((employee) => [
        employee.name,
        employee.expected,
        employee.statusCounts.teilgenommen,
        employee.statusCounts.urlaub,
        employee.statusCounts.dienst,
        employee.statusCounts.krankheit,
        employee.statusCounts.schule,
        employee.statusCounts.entschuldigt,
        employee.statusCounts.unentschuldigt,
        employee.statusCounts.nicht_zutreffend,
        employee.open,
        `${employee.attendanceRate} %`,
      ]),
    );
  }

  function renderMeetingStatCard(label, value, detail) {
    return `
      <div class="meeting-stat-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
    `;
  }

  function renderEmptyState({ title, text, buttonText, buttonAttribute, compact = false }) {
    return `
      <div class="empty-state ${compact ? "compact" : ""}">
        <span class="empty-icon"><svg><use href="#icon-empty"></use></svg></span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
        ${
          buttonText
            ? `<button class="button button-primary" type="button" ${buttonAttribute}>${escapeHtml(
                buttonText,
              )}</button>`
            : ""
        }
      </div>
    `;
  }

  function handleEmployeeTableAction(event) {
    const sortButton = event.target.closest("[data-employee-sort]");
    if (sortButton) {
      const nextKey = sortButton.dataset.employeeSort;
      if (employeeSortKey === nextKey) {
        employeeSortDirection = employeeSortDirection === "asc" ? "desc" : "asc";
      } else {
        employeeSortKey = nextKey;
        employeeSortDirection = "asc";
      }
      renderEmployees();
      return;
    }
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "view-employee") openEmployeeDossier(id);
    if (action === "edit-employee") openEmployeeDialog(id);
    if (action === "toggle-employee") toggleEmployee(id);
    if (action === "delete-employee") requestDeleteEmployee(id);
  }

  function handleEmployeeTableSelection(event) {
    const selectAll = event.target.closest("[data-select-all-employees]");
    if (selectAll) {
      visibleEmployeesForSelection().forEach((employee) => {
        if (selectAll.checked) selectedEmployeeIds.add(employee.id);
        else selectedEmployeeIds.delete(employee.id);
      });
      renderEmployees();
      return;
    }
    const checkbox = event.target.closest("[data-select-employee]");
    if (!checkbox) return;
    const employeeId = checkbox.dataset.selectEmployee;
    if (checkbox.checked) selectedEmployeeIds.add(employeeId);
    else selectedEmployeeIds.delete(employeeId);

    // Mit gedrueckter Umschalttaste gilt die Aenderung fuer alles zwischen der
    // zuletzt angeklickten und dieser Zeile - dann muss die Tabelle neu
    // aufgebaut werden, damit die Haken dazwischen mitgehen.
    if (takeEmployeeSelectionShift() && applyEmployeeSelectionRange(employeeId, checkbox.checked)) {
      renderEmployees();
      return;
    }
    rememberEmployeeSelectionAnchor(employeeId);
    updateEmployeeBulkBar();
  }

  function visibleEmployeesForSelection() {
    return [...elements.employeeTable.querySelectorAll("[data-select-employee]")]
      .map((checkbox) => getEmployee(checkbox.dataset.selectEmployee))
      .filter(Boolean);
  }

  function updateEmployeeBulkBar() {
    selectedEmployeeIds = new Set(
      [...selectedEmployeeIds].filter((employeeId) => getEmployee(employeeId)),
    );
    elements.employeeBulkBar.hidden = selectedEmployeeIds.size === 0;
    elements.employeeBulkCount.textContent = `${selectedEmployeeIds.size} ausgewählt`;
  }

  function clearEmployeeSelection() {
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function resetEmployeeFilters() {
    employeeProfessionFilter = "all";
    employeeQualificationFilter = "all";
    employeeWeekendFilter = "all";
    employeeSearchTerm = "";
    elements.employeeSearch.value = "";
    selectedEmployeeIds.clear();
    renderEmployees();
  }

  function handleRecentEmployeeAction(event) {
    const button = event.target.closest("[data-edit-recent-employee]");
    if (button) openEmployeeDialog(button.dataset.editRecentEmployee);
  }

  function handleTrainingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "add-completion") openCompletionDialog(id);
    if (action === "edit-training") openTrainingDialog(id);
    if (action === "delete-training") requestDeleteTraining(id);
    if (action === "delete-completion") requestDeleteCompletion(id);
  }

  function handleMeetingAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "record-attendance") openAttendanceDialog(id);
    if (action === "edit-meeting") openMeetingDialog(id);
    if (action === "delete-meeting") requestDeleteMeeting(id);
  }

  function handleAppointmentAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (button) {
      if (event.type === "keydown") return;
      const { action, id } = button.dataset;
      if (action === "toggle-appointment-pin") toggleAppointmentPinned(id);
      if (action === "edit-appointment") openAppointmentDialog(id);
      if (action === "delete-appointment") requestDeleteAppointment(id);
      return;
    }

    // Die Karte selbst oeffnet die Schnellansicht (22-record-inspector); zum
    // Bearbeiten fuehrt der Stift auf der Karte.
  }

  async function toggleAppointmentPinned(appointmentId) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;
    const pinned = !appointment.pinned;
    const committed = await commitStateMutation(() => {
      state.appointments = state.appointments.map((item) =>
        item.id === appointmentId
          ? { ...item, pinned, updatedAt: new Date().toISOString() }
          : item,
      );
    });
    if (!committed) return;
    showToast(pinned ? "Termin wurde angepinnt." : "Termin wurde gelöst.");
  }

  function openEmployeeDialog(employeeId = null) {
    elements.employeeForm.reset();
    [
      "#firstName",
      "#lastName",
      "#profession",
      "#birthDate",
      "#employeeUsername",
    ].forEach((selector) => {
      document.querySelector(selector).setCustomValidity("");
    });
    document.querySelector("#employeeId").value = "";
    document.querySelector("#employmentPercent").value = "100";
    document.querySelector("#employeeStatus").value = "active";

    const employee = employeeId ? getEmployee(employeeId) : null;
    if (employee) trackWorkspaceRecord("employee", employee.id);
    renderEmployeeCatalogFields(employee);
    elements.employeeDialogTitle.textContent = employee ? "Mitarbeiter bearbeiten" : "Mitarbeiter anlegen";
    elements.employeeSubmitLabel.textContent = employee ? "Änderungen speichern" : "Mitarbeiter speichern";

    if (employee) {
      document.querySelector("#employeeId").value = employee.id;
      document.querySelector("#firstName").value = employee.firstName;
      document.querySelector("#lastName").value = employee.lastName;
      document.querySelector("#employeeUsername").value =
        employee.username || "";
      document.querySelector("#birthDate").value = employee.birthDate;
      document.querySelector("#phone").value = employee.phone;
      document.querySelector("#email").value = employee.email;
      document.querySelector("#profession").value = employee.profession;
      document.querySelector("#serviceWeekend").value = employee.serviceWeekend;
      document.querySelector("#employmentPercent").value = String(employee.employmentPercent);
      document.querySelector("#employeeStatus").value = employee.employmentStatus;

      document.querySelectorAll('input[name="qualification"]').forEach((checkbox) => {
        checkbox.checked = Boolean(employee.qualifications[checkbox.value]);
      });
    }

    elements.employeeDialog.showModal();
    captureCleanForm(elements.employeeForm);
    window.setTimeout(() => document.querySelector("#firstName").focus(), 0);
  }

  function renderEmployeeCatalogFields(employee = null) {
    const professions = [...state.catalogs.professions];
    if (
      employee?.profession &&
      !professions.some(
        (profession) =>
          profession.toLocaleLowerCase("de-DE") ===
          employee.profession.toLocaleLowerCase("de-DE"),
      )
    ) {
      professions.push(employee.profession);
      professions.sort((left, right) => left.localeCompare(right, "de"));
    }
    const professionSelect = document.querySelector("#profession");
    professionSelect.innerHTML = [
      '<option value="">Beruf auswählen</option>',
      ...professions.map(
        (profession) =>
          `<option value="${escapeHtml(profession)}">${escapeHtml(profession)}</option>`,
      ),
    ].join("");
    professionSelect.value = employee?.profession || "";

    const ownerWeekend = serviceWeekendOwnerKey(employee?.id);
    elements.serviceWeekend.innerHTML = serviceWeekendOptionsMarkup();
    elements.serviceWeekend.value =
      ownerWeekend || employee?.serviceWeekend || "none";
    elements.serviceWeekend.disabled = Boolean(ownerWeekend);
    elements.serviceWeekendOwnerHint.hidden = !ownerWeekend;
    elements.serviceWeekendOwnerHint.textContent = ownerWeekend
      ? `Als verantwortliche Person fest mit „${serviceWeekendLabel(
          ownerWeekend,
        )}“ verbunden.`
      : "";

    document.querySelector("#qualificationFields").innerHTML = state.catalogs.qualifications
      .map(
        (qualification) => `
          <div class="qualification-expiry-row">
            <label class="check-card">
              <input
                type="checkbox"
                name="qualification"
                value="${qualification.id}"
                ${employee?.qualifications?.[qualification.id] ? "checked" : ""}
              />
              <span class="check-box"><svg><use href="#icon-check"></use></svg></span>
              <span>${escapeHtml(qualification.label)}</span>
            </label>
            <label class="qualification-expiry-field">
              <span>Gültig bis (optional)</span>
              <input
                type="date"
                name="qualification-expiry"
                data-qualification-expiry="${qualification.id}"
                value="${escapeHtml(employee?.qualificationExpiries?.[qualification.id] || "")}"
              />
            </label>
          </div>
        `,
      )
      .join("");
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();

    const birthDate = document.querySelector("#birthDate");
    const firstNameInput = document.querySelector("#firstName");
    const lastNameInput = document.querySelector("#lastName");
    const professionInput = document.querySelector("#profession");
    const usernameInput = document.querySelector("#employeeUsername");

    birthDate.setCustomValidity(
      birthDate.value && birthDate.value > todayIso()
        ? "Das Geburtsdatum darf nicht in der Zukunft liegen."
        : "",
    );
    firstNameInput.setCustomValidity(
      firstNameInput.value.trim() ? "" : "Bitte einen Vornamen eingeben.",
    );
    lastNameInput.setCustomValidity(
      lastNameInput.value.trim() ? "" : "Bitte einen Nachnamen eingeben.",
    );
    professionInput.setCustomValidity(
      professionInput.value.trim() ? "" : "Bitte einen Beruf eingeben.",
    );
    const username = usernameInput.value.trim();
    const editingEmployeeId = document.querySelector("#employeeId").value;
    const duplicateUsername = username
      ? state.employees.some(
          (employee) =>
            employee.id !== editingEmployeeId &&
            employee.username?.toLocaleLowerCase("de-DE") ===
              username.toLocaleLowerCase("de-DE"),
        )
      : false;
    usernameInput.setCustomValidity(
      username && !/^[A-Za-z0-9]{4,40}$/.test(username)
        ? "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen."
        : duplicateUsername
          ? "Dieser Benutzername ist bereits einem anderen Mitarbeiter zugewiesen."
          : "",
    );
    if (!elements.employeeForm.reportValidity()) return;

    const employeeId = document.querySelector("#employeeId").value;
    const existingEmployee = employeeId ? getEmployee(employeeId) : null;
    const now = new Date().toISOString();
    const qualifications = {};
    const qualificationExpiries = {};
    state.catalogs.qualifications.forEach(({ id: key }) => {
      qualifications[key] = Boolean(
        document.querySelector(`input[name="qualification"][value="${key}"]`)?.checked,
      );
      const expiry = document.querySelector(
        `[data-qualification-expiry="${key}"]`,
      )?.value;
      if (qualifications[key] && expiry) qualificationExpiries[key] = expiry;
    });
    const ownerWeekend = serviceWeekendOwnerKey(existingEmployee?.id);
    if (
      ownerWeekend &&
      !LEADERSHIP_QUALIFICATION_IDS.some(
        (qualificationId) => qualifications[qualificationId],
      )
    ) {
      showToast(
        "Die verantwortliche Person muss Stationsleitung oder stellvertretende Stationsleitung bleiben. Bitte zuerst die Dienstwochenendzuweisung ändern.",
        "error",
      );
      return;
    }

    const employee = {
      id: existingEmployee?.id || createId(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      username,
      birthDate: birthDate.value,
      phone: document.querySelector("#phone").value.trim(),
      email: document.querySelector("#email").value.trim(),
      employmentPercent: clampNumber(
        document.querySelector("#employmentPercent").value,
        1,
        100,
        100,
      ),
      profession: normalizeProfession(professionInput.value),
      serviceWeekend:
        ownerWeekend ||
        document.querySelector("#serviceWeekend").value,
      employmentStatus: document.querySelector("#employeeStatus").value,
      active: document.querySelector("#employeeStatus").value !== "inactive",
      qualifications,
      qualificationExpiries,
      createdAt: existingEmployee?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingEmployee) {
        state.employees = state.employees.map((item) =>
          item.id === employee.id ? employee : item,
        );
        if (ownerWeekend) {
          state.settings.serviceWeekends[ownerWeekend].name =
            employee.firstName.slice(0, 50);
        }
      } else {
        state.employees.push(employee);
      }
      if (
        !state.catalogs.professions.some(
          (profession) =>
            profession.toLocaleLowerCase("de-DE") ===
            employee.profession.toLocaleLowerCase("de-DE"),
        )
      ) {
        state.catalogs.professions.push(employee.profession);
        state.catalogs.professions.sort((a, b) => a.localeCompare(b, "de"));
      }
    });
    if (!committed) return;

    elements.employeeDialog.close();
    showToast(existingEmployee ? "Mitarbeiter wurde aktualisiert." : "Mitarbeiter wurde angelegt.");
  }

  async function toggleEmployee(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;

    const employeeName = fullName(employee);
    const nextActiveState = !employee.active;
    const committed = await commitStateMutation(() => {
      employee.active = nextActiveState;
      employee.employmentStatus = nextActiveState ? "active" : "inactive";
      employee.updatedAt = new Date().toISOString();
    });
    if (!committed) return;

    showToast(`${employeeName} ist jetzt ${nextActiveState ? "aktiv" : "inaktiv"}.`);
  }

  function requestDeleteEmployee(employeeId) {
    const employee = getEmployee(employeeId);
    if (!employee) return;
    const ownerWeekend = serviceWeekendOwnerKey(employeeId);
    if (ownerWeekend) {
      showToast(
        `${fullName(employee)} ist für „${serviceWeekendLabel(
          ownerWeekend,
        )}“ verantwortlich. Bitte zuerst die verantwortliche Person in den Einstellungen ändern.`,
        "error",
      );
      return;
    }
    const completionCount = state.completions.filter(
      (completion) => completion.employeeId === employeeId,
    ).length;
    const attendanceCount = state.meetingAttendances.filter(
      (attendance) => attendance.employeeId === employeeId,
    ).length;
    const vacationDayCount = state.vacationDays.filter(
      (vacationDay) => vacationDay.employeeId === employeeId,
    ).length;
    const deviceInstructionCount = state.deviceInstructions.filter(
      (instruction) =>
        instruction.participants.some(
          (participant) => participant.employeeId === employeeId,
        ),
    ).length;
    const historyParts = [];
    if (completionCount) {
      historyParts.push(
        `${completionCount} Fortbildungsnachweis${completionCount === 1 ? "" : "e"}`,
      );
    }
    if (attendanceCount) {
      historyParts.push(`${attendanceCount} Sitzungsstatus`);
    }
    if (vacationDayCount) {
      historyParts.push(
        vacationDayCount === 1
          ? "1 Planungseintrag"
          : `${vacationDayCount} Planungseinträge`,
      );
    }
    if (deviceInstructionCount) {
      historyParts.push(
        `${deviceInstructionCount} Geräteeinweisungsnachweis${
          deviceInstructionCount === 1 ? "" : "e"
        }`,
      );
    }
    const historyNote = historyParts.length
      ? ` Dabei werden auch ${historyParts.join(" und ")} gelöscht.`
      : "";

    requestConfirmation({
      title: "Mitarbeiter löschen?",
      message: `${fullName(
        employee,
      )} wird dauerhaft aus der Verwaltung entfernt.${historyNote} Für ausgeschiedene Mitarbeiter ist „Inaktiv“ meist die bessere Wahl.`,
      acceptLabel: "Mitarbeiter löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.employees = state.employees.filter((item) => item.id !== employeeId);
          state.completions = state.completions.filter(
            (completion) => completion.employeeId !== employeeId,
          );
          state.meetingAttendances = state.meetingAttendances.filter(
            (attendance) => attendance.employeeId !== employeeId,
          );
          state.vacationEntitlements = state.vacationEntitlements.filter(
            (entitlement) => entitlement.employeeId !== employeeId,
          );
          state.vacationDays = state.vacationDays.filter(
            (vacationDay) => vacationDay.employeeId !== employeeId,
          );
          state.deviceInstructions = state.deviceInstructions
            .map((instruction) => ({
              ...instruction,
              instructorEmployeeId:
                instruction.instructorEmployeeId === employeeId
                  ? ""
                  : instruction.instructorEmployeeId,
              participants: instruction.participants.filter(
                (participant) => participant.employeeId !== employeeId,
              ),
            }))
            .filter((instruction) => instruction.participants.length);
          state.meetings.forEach((meeting) => {
            meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter(
              (expectedEmployeeId) => expectedEmployeeId !== employeeId,
            );
          });
        }, { undo: "Mitarbeiter gelöscht" });
        if (!committed) return;

        showUndoToast("Mitarbeiter wurde gelöscht.");
      },
    });
  }

  function openTrainingDialog(trainingId = null) {
    elements.trainingForm.reset();
    document.querySelector("#trainingTitle").setCustomValidity("");
    document.querySelector("#trainingId").value = "";
    document.querySelector("#trainingYear").value = String(new Date().getFullYear());
    document.querySelector("#trainingRecurrence").value = String(
      DEFAULT_TRAINING_RECURRENCE_MONTHS,
    );
    trainingRecurrenceManuallyChanged = false;

    const training = trainingId ? getTraining(trainingId) : null;
    elements.trainingDialogTitle.textContent = training
      ? "Pflichtfortbildung bearbeiten"
      : "Pflichtfortbildung anlegen";
    elements.trainingSubmitLabel.textContent = training
      ? "Änderungen speichern"
      : "Fortbildung speichern";

    if (training) {
      document.querySelector("#trainingId").value = training.id;
      document.querySelector("#trainingTitle").value = training.title;
      document.querySelector("#trainingYear").value = String(training.year);
      document.querySelector("#trainingRecurrence").value = training.recurrenceMonths
        ? String(training.recurrenceMonths)
        : "";
      document.querySelector("#trainingDescription").value = training.description;
    }

    elements.trainingDialog.showModal();
    captureCleanForm(elements.trainingForm);
    window.setTimeout(() => document.querySelector("#trainingTitle").focus(), 0);
  }

  async function handleTrainingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#trainingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.trainingForm.reportValidity()) return;

    const trainingId = document.querySelector("#trainingId").value;
    const existingTraining = trainingId ? getTraining(trainingId) : null;
    const now = new Date().toISOString();
    const recurrence = Number(document.querySelector("#trainingRecurrence").value);
    const recurrenceMonths =
      Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null;
    const trainingYear = Number(document.querySelector("#trainingYear").value);
    const matchingSeries = state.trainings.find(
      (item) =>
        item.id !== existingTraining?.id &&
        item.recurrenceMonths &&
        trainingSeriesSignature(item.title) === trainingSeriesSignature(titleInput.value),
    );
    const training = {
      id: existingTraining?.id || createId(),
      title: titleInput.value.trim(),
      year: trainingYear,
      recurrenceMonths,
      targetMinutes: existingTraining?.targetMinutes || null,
      seriesId: recurrenceMonths
        ? existingTraining?.seriesId ||
          matchingSeries?.seriesId ||
          generatedTrainingSeriesId(titleInput.value, existingTraining?.id)
        : "",
      description: document.querySelector("#trainingDescription").value.trim(),
      createdAt: existingTraining?.createdAt || now,
      updatedAt: now,
    };

    const previousDisplayYear = trainingDisplayYear;
    trainingDisplayYear = trainingYear;
    const committed = await commitStateMutation(() => {
      if (existingTraining) {
        state.trainings = state.trainings.map((item) =>
          item.id === training.id ? training : item,
        );
      } else {
        state.trainings.push(training);
      }
    });
    if (!committed) {
      trainingDisplayYear = previousDisplayYear;
      return;
    }

    elements.trainingDialog.close();
    showToast(existingTraining ? "Fortbildung wurde aktualisiert." : "Fortbildung wurde angelegt.");
  }

  function requestDeleteTraining(trainingId) {
    const training = getTraining(trainingId);
    if (!training) return;
    const completionCount = state.completions.filter(
      (completion) => completion.trainingId === trainingId,
    ).length;
    const historyNote = completionCount
      ? ` ${completionCount} erfasste${completionCount === 1 ? "r" : ""} Nachweis${
          completionCount === 1 ? "" : "e"
        } werden ebenfalls gelöscht.`
      : "";

    requestConfirmation({
      title: "Pflichtfortbildung löschen?",
      message: `„${training.title}“ (${training.year}) wird dauerhaft entfernt.${historyNote}`,
      acceptLabel: "Fortbildung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.trainings = state.trainings.filter((item) => item.id !== trainingId);
          state.completions = state.completions.filter(
            (completion) => completion.trainingId !== trainingId,
          );
        }, { undo: "Pflichtfortbildung gelöscht" });
        if (!committed) return;

        showUndoToast("Pflichtfortbildung wurde gelöscht.");
      },
    });
  }

  // date belegt das Datumsfeld eines neuen Termins vor - so legt ein Klick auf
  // einen Tag im Monatskalender den Termin gleich dort an.
  function openAppointmentDialog(appointmentId = null, { date = "" } = {}) {
    renderAppointmentCategoryOptions();
    elements.appointmentForm.reset();
    document.querySelector("#appointmentId").value = "";
    document.querySelector("#appointmentTitle").setCustomValidity("");
    document.querySelector("#appointmentEndTime").setCustomValidity("");
    document.querySelector("#appointmentDate").value =
      parseLocalDate(date) ? date : todayIso();
    elements.appointmentParticipantList.checked = false;
    elements.appointmentPinned.checked = false;

    const appointment = appointmentId ? getAppointment(appointmentId) : null;
    if (appointment) trackWorkspaceRecord("appointment", appointment.id);
    elements.appointmentDialogTitle.textContent = appointment
      ? "Termin bearbeiten"
      : "Termin anlegen";
    elements.appointmentSubmitLabel.textContent = appointment
      ? "Änderungen speichern"
      : "Termin speichern";
    elements.deleteAppointmentButton.hidden = !appointment;

    if (appointment) {
      document.querySelector("#appointmentId").value = appointment.id;
      document.querySelector("#appointmentTitle").value = appointment.title;
      document.querySelector("#appointmentDate").value = appointment.date;
      document.querySelector("#appointmentStartTime").value = appointment.startTime;
      document.querySelector("#appointmentEndTime").value = appointment.endTime;
      elements.appointmentCategory.value = appointment.category || "";
      document.querySelector("#appointmentLocation").value = appointment.location;
      document.querySelector("#appointmentDescription").value = appointment.description;
      elements.appointmentParticipantList.checked = Boolean(appointment.participantList);
      elements.appointmentPinned.checked = Boolean(appointment.pinned);
    }

    elements.appointmentDialog.showModal();
    captureCleanForm(elements.appointmentForm);
    window.setTimeout(() => document.querySelector("#appointmentTitle").focus(), 0);
  }

  function validateAppointmentTimes() {
    const startTime = document.querySelector("#appointmentStartTime").value;
    const endTimeInput = document.querySelector("#appointmentEndTime");
    const endTime = endTimeInput.value;
    endTimeInput.setCustomValidity(
      endTime && !startTime
        ? "Bitte zuerst eine Startzeit angeben."
        : startTime && endTime && endTime <= startTime
          ? "Die Endzeit muss nach der Startzeit liegen."
          : "",
    );
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault();
    const shouldPrint = event.submitter?.value === "print";
    const titleInput = document.querySelector("#appointmentTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte einen Titel eingeben.",
    );
    validateAppointmentTimes();
    if (!elements.appointmentForm.reportValidity()) return;

    const appointmentId = document.querySelector("#appointmentId").value;
    const existingAppointment = appointmentId
      ? getAppointment(appointmentId)
      : null;
    const now = new Date().toISOString();
    const appointment = {
      id: existingAppointment?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#appointmentDate").value,
      startTime: document.querySelector("#appointmentStartTime").value,
      endTime: document.querySelector("#appointmentEndTime").value,
      category: elements.appointmentCategory.value,
      location: document.querySelector("#appointmentLocation").value.trim(),
      description: document.querySelector("#appointmentDescription").value.trim(),
      pinned: elements.appointmentPinned.checked,
      participantList: elements.appointmentParticipantList.checked,
      createdAt: existingAppointment?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingAppointment) {
        state.appointments = state.appointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        );
      } else {
        state.appointments.push(appointment);
      }
    });
    if (!committed) return;

    elements.appointmentDialog.close();
    showToast(
      existingAppointment ? "Termin wurde aktualisiert." : "Termin wurde angelegt.",
    );
    if (shouldPrint) printAppointment(appointment);
  }

  function printAppointment(appointment) {
    const category = appointmentCategoryLabel(appointment);
    const time = formatAppointmentTime(appointment);
    const participantRows = appointment.participantList
      ? `<section class="appointment-print-participants">
          <h2>Teilnehmerliste</h2>
          ${Array.from({ length: 14 }, () => "<span></span>").join("")}
        </section>`
      : "";
    elements.appointmentPrintSurface.innerHTML = `
      <article class="appointment-print-document">
        <header>
          ${category ? `<p class="appointment-print-category">${escapeHtml(category)}</p>` : ""}
          <h1>${escapeHtml(appointment.title)}</h1>
          <p>${formatDate(appointment.date)}</p>
          <p>${escapeHtml(time || " ")}</p>
          <p>${escapeHtml(appointment.location || " ")}</p>
        </header>
        ${participantRows}
      </article>`;
    document.body.classList.add("print-appointment");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-appointment"), 0);
  }

  function requestDeleteAppointmentFromDialog() {
    const appointmentId = document.querySelector("#appointmentId").value;
    if (appointmentId) {
      requestDeleteAppointment(appointmentId, { closeDialog: true });
    }
  }

  function requestDeleteAppointment(
    appointmentId,
    { closeDialog = false } = {},
  ) {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return;

    requestConfirmation({
      title: "Termin löschen?",
      message: `„${appointment.title}“ am ${formatDate(
        appointment.date,
      )} wird dauerhaft entfernt.`,
      acceptLabel: "Termin löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.appointments = state.appointments.filter(
            (item) => item.id !== appointmentId,
          );
        }, { undo: "Termin gelöscht" });
        if (!committed) return;
        if (closeDialog && elements.appointmentDialog.open) {
          elements.appointmentDialog.close();
        }
        showUndoToast("Termin wurde gelöscht.");
      },
    });
  }

  function openMeetingDialog(meetingId = null) {
    elements.meetingForm.reset();
    document.querySelector("#meetingTitle").setCustomValidity("");
    document.querySelector("#meetingId").value = "";
    document.querySelector("#meetingTitle").value = "Teamsitzung";
    document.querySelector("#meetingDate").value = todayIso();

    const meeting = meetingId ? getMeeting(meetingId) : null;
    elements.meetingDialogTitle.textContent = meeting
      ? "Teamsitzung bearbeiten"
      : "Teamsitzung anlegen";
    elements.meetingSubmitLabel.textContent = meeting
      ? "Änderungen speichern"
      : "Teamsitzung speichern";

    if (meeting) {
      document.querySelector("#meetingId").value = meeting.id;
      document.querySelector("#meetingTitle").value = meeting.title;
      document.querySelector("#meetingDate").value = meeting.date;
      document.querySelector("#meetingTime").value = meeting.time;
      document.querySelector("#meetingNotes").value = meeting.notes;
    }

    elements.meetingDialog.showModal();
    captureCleanForm(elements.meetingForm);
    window.setTimeout(() => document.querySelector("#meetingTitle").focus(), 0);
  }

  async function handleMeetingSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#meetingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.meetingForm.reportValidity()) return;

    const meetingId = document.querySelector("#meetingId").value;
    const existingMeeting = meetingId ? getMeeting(meetingId) : null;
    const now = new Date().toISOString();
    const meeting = {
      id: existingMeeting?.id || createId(),
      title: titleInput.value.trim(),
      date: document.querySelector("#meetingDate").value,
      time: document.querySelector("#meetingTime").value,
      notes: document.querySelector("#meetingNotes").value.trim(),
      expectedEmployeeIds:
        existingMeeting?.expectedEmployeeIds || activeEmployeeList().map((employee) => employee.id),
      createdAt: existingMeeting?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingMeeting) {
        state.meetings = state.meetings.map((item) => (item.id === meeting.id ? meeting : item));
      } else {
        state.meetings.push(meeting);
      }
    });
    if (!committed) return;

    meetingDisplayYear = Number(meeting.date.slice(0, 4));
    renderMeetings();
    elements.meetingDialog.close();
    showToast(existingMeeting ? "Teamsitzung wurde aktualisiert." : "Teamsitzung wurde angelegt.");

    if (!existingMeeting && meeting.expectedEmployeeIds.length > 0) {
      openAttendanceDialog(meeting.id);
    }
  }

  function requestDeleteMeeting(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;
    const attendanceCount = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    ).length;

    requestConfirmation({
      title: "Teamsitzung löschen?",
      message: `„${meeting.title}“ vom ${formatDate(meeting.date)} wird dauerhaft entfernt.${
        attendanceCount
          ? ` ${attendanceCount} dokumentierte Teilnahmestatus werden ebenfalls gelöscht.`
          : ""
      }`,
      acceptLabel: "Teamsitzung löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.meetings = state.meetings.filter((item) => item.id !== meetingId);
          state.meetingAttendances = state.meetingAttendances.filter(
            (attendance) => attendance.meetingId !== meetingId,
          );
        }, { undo: "Teamsitzung gelöscht" });
        if (!committed) return;

        showUndoToast("Teamsitzung wurde gelöscht.");
      },
    });
  }

  function openAttendanceDialog(meetingId) {
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    const existingRecords = state.meetingAttendances.filter(
      (attendance) => attendance.meetingId === meetingId,
    );
    const employeeIds = new Set(meeting.expectedEmployeeIds);
    existingRecords.forEach((record) => employeeIds.add(record.employeeId));
    if (existingRecords.length === 0) {
      activeEmployeeList().forEach((employee) => employeeIds.add(employee.id));
    }

    attendanceEmployeeIds = [...employeeIds].filter((employeeId) => getEmployee(employeeId));
    if (attendanceEmployeeIds.length === 0) {
      showToast("Für diese Sitzung sind keine Mitarbeiter verfügbar.", "error");
      return;
    }

    attendanceDraft = new Map(
      existingRecords.map((record) => [record.employeeId, record.status]),
    );
    attendanceSearchTerm = "";
    attendanceStatusFilter = "all";
    elements.attendanceSearch.value = "";
    elements.attendanceFilter.value = "all";
    elements.attendanceBulkStatus.value = "teilgenommen";
    document.querySelector("#attendanceMeetingId").value = meeting.id;
    elements.attendanceMeetingMeta.textContent = `${formatDate(meeting.date)}${
      meeting.time ? ` · ${formatTime(meeting.time)} Uhr` : ""
    } · ${meeting.title}`;

    renderAttendanceList();
    elements.attendanceDialog.showModal();
    captureCleanForm(elements.attendanceForm);
    window.setTimeout(() => elements.attendanceSearch.focus(), 0);
  }

  function filteredAttendanceEmployees() {
    return attendanceEmployeeIds
      .map(getEmployee)
      .filter(Boolean)
      .filter((employee) => {
        const status = attendanceDraft.get(employee.id) || "";
        if (attendanceStatusFilter === "open" && status) return false;
        if (attendanceStatusFilter === "documented" && !status) return false;
        if (
          attendanceStatusFilter === "absent" &&
          (!status || ["teilgenommen", "nicht_zutreffend"].includes(status))
        ) {
          return false;
        }
        if (!attendanceSearchTerm) return true;
        return searchKey(
          [employee.firstName, employee.lastName, employee.profession].join(" "),
        ).includes(attendanceSearchTerm);
      })
      .sort(sortEmployees);
  }

  function renderAttendanceList() {
    const employees = filteredAttendanceEmployees();
    if (employees.length === 0) {
      elements.attendanceList.innerHTML = renderEmptyState({
        title: "Keine passenden Mitarbeiter",
        text: "Ändern Sie die Suche oder den Anzeigefilter.",
        compact: true,
      });
      updateAttendanceProgress();
      return;
    }

    elements.attendanceList.innerHTML = employees
      .map((employee) => {
        const selectedStatus = attendanceDraft.get(employee.id) || "";
        const statusConfig = ATTENDANCE_STATUSES[selectedStatus];
        return `
          <div class="attendance-row ${
            statusConfig ? `has-status attendance-row-${statusConfig.tone}` : ""
          }">
            <div class="attendance-person">
              ${renderAvatar(employee)}
              <span>
                <strong>${escapeHtml(fullName(employee))}</strong>
                <small>${escapeHtml(employee.profession)} · ${escapeHtml(
                  employeeStatusLabel(employee),
                )}${employee.active ? "" : " seit Erfassung"}</small>
              </span>
            </div>
            <label class="attendance-status-field">
              <span class="sr-only">Teilnahmestatus für ${escapeHtml(fullName(employee))}</span>
              <select
                data-attendance-employee-id="${employee.id}"
                aria-label="Teilnahmestatus für ${escapeHtml(fullName(employee))}"
              >
                <option value="">Noch offen</option>
                ${renderAttendanceStatusOptions(selectedStatus)}
              </select>
            </label>
          </div>
        `;
      })
      .join("");

    updateAttendanceProgress();
  }

  function renderAttendanceStatusOptions(selectedStatus = "") {
    return Object.entries(ATTENDANCE_STATUSES)
      .map(
        ([value, config]) =>
          `<option value="${value}" ${value === selectedStatus ? "selected" : ""}>${escapeHtml(
            config.label,
          )}</option>`,
      )
      .join("");
  }

  function updateAttendanceProgress() {
    const documented = attendanceEmployeeIds.filter((employeeId) =>
      attendanceDraft.has(employeeId),
    ).length;
    const total = attendanceEmployeeIds.length;
    elements.attendanceProgress.textContent = `${documented} von ${total} dokumentiert${
      total - documented > 0 ? ` · ${total - documented} offen` : " · vollständig"
    }`;
  }

  function updateAttendanceRowState(row, status) {
    if (!row) return;
    row.className = "attendance-row";
    const statusConfig = ATTENDANCE_STATUSES[status];
    if (statusConfig) {
      row.classList.add("has-status", `attendance-row-${statusConfig.tone}`);
    }
  }

  async function handleAttendanceSubmit(event) {
    event.preventDefault();
    const meetingId = document.querySelector("#attendanceMeetingId").value;
    const meeting = getMeeting(meetingId);
    if (!meeting) {
      elements.attendanceDialog.close();
      showToast("Die Teamsitzung ist nicht mehr vorhanden.", "error");
      return;
    }

    const existingByEmployee = new Map(
      state.meetingAttendances
        .filter((attendance) => attendance.meetingId === meetingId)
        .map((attendance) => [attendance.employeeId, attendance]),
    );
    const now = new Date().toISOString();
    const nextRecords = attendanceEmployeeIds
      .filter((employeeId) => attendanceDraft.has(employeeId))
      .map((employeeId) => {
        const existing = existingByEmployee.get(employeeId);
        return {
          id: existing?.id || createId(),
          meetingId,
          employeeId,
          status: attendanceDraft.get(employeeId),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
      });

    const committed = await commitStateMutation(() => {
      state.meetingAttendances = state.meetingAttendances
        .filter((attendance) => attendance.meetingId !== meetingId)
        .concat(nextRecords);
      meeting.expectedEmployeeIds = [...attendanceEmployeeIds];
      meeting.updatedAt = now;
    });
    if (!committed) return;

    elements.attendanceDialog.close();
    const openCount = attendanceEmployeeIds.length - nextRecords.length;
    showToast(
      `${nextRecords.length} Teilnahmestatus gespeichert.${
        openCount ? ` ${openCount} sind noch offen.` : " Die Erfassung ist vollständig."
      }`,
    );
  }

  function openCompletionDialog(trainingId = null) {
    if (state.trainings.length === 0) {
      showView("trainings");
      showToast("Legen Sie zuerst eine Pflichtfortbildung an.", "error");
      return;
    }

    if (activeEmployeeList().length === 0) {
      showView("employees");
      showToast("Für einen Abschluss wird mindestens ein aktiver Mitarbeiter benötigt.", "error");
      return;
    }

    elements.completionForm.reset();
    selectedCompletionEmployeeIds = new Set();
    completionSearchTerm = "";
    elements.completionEmployeeSearch.value = "";
    elements.completionEmployeeError.textContent = "";
    elements.completionDate.setCustomValidity("");
    elements.completionDate.value = todayIso();

    elements.completionTraining.innerHTML = groupTrainingsByYear(trainingObligations())
      .map(
        ([year, trainings]) => `
          <optgroup label="Im Katalog seit ${year}">
            ${trainings
              .map(
                (training) =>
                  `<option value="${training.id}" ${
                    training.id === trainingId ? "selected" : ""
                  }>${escapeHtml(training.title)}</option>`,
              )
              .join("")}
          </optgroup>
        `,
      )
      .join("");

    renderCompletionEmployeeList();
    elements.completionDialog.showModal();
    captureCleanForm(elements.completionForm);
    window.setTimeout(() => elements.completionTraining.focus(), 0);
  }

  function renderCompletionEmployeeList() {
    const employees = filteredCompletionEmployees();
    const training = getTraining(elements.completionTraining.value);

    if (employees.length === 0) {
      elements.completionEmployeeList.innerHTML = `
        <div class="empty-state compact">
          <p>Keine aktiven Mitarbeiter passen zur Suche.</p>
        </div>
      `;
      updateCompletionSelectionUi();
      return;
    }

    elements.completionEmployeeList.innerHTML = employees
      .map((employee) => {
        const status = training
          ? getEmployeeCompletionStatus(employee.id, training)
          : { label: "Kein Status" };
        return `
          <label class="selection-card">
            <input
              type="checkbox"
              data-employee-id="${employee.id}"
              ${selectedCompletionEmployeeIds.has(employee.id) ? "checked" : ""}
            />
            ${renderAvatar(employee, true)}
            <span>
              <strong>${escapeHtml(fullName(employee))}</strong>
              <small>${escapeHtml(employee.profession)} · ${escapeHtml(status.label)}</small>
            </span>
          </label>
        `;
      })
      .join("");

    updateCompletionSelectionUi();
  }

  function filteredCompletionEmployees() {
    return activeEmployeeList()
      .filter((employee) => {
        if (!completionSearchTerm) return true;
        return searchKey(
          [employee.firstName, employee.lastName, employee.profession].join(" "),
        ).includes(completionSearchTerm);
      })
      .sort(sortEmployees);
  }

  function updateCompletionSelectionUi() {
    const count = selectedCompletionEmployeeIds.size;
    elements.completionSelectionCount.textContent = `${count} ausgewählt`;

    const visibleEmployees = filteredCompletionEmployees();
    const allSelected =
      visibleEmployees.length > 0 &&
      visibleEmployees.every((employee) => selectedCompletionEmployeeIds.has(employee.id));
    elements.toggleAllEmployees.textContent = allSelected ? "Auswahl aufheben" : "Alle auswählen";
  }

  async function handleCompletionSubmit(event) {
    event.preventDefault();

    elements.completionDate.setCustomValidity(
      elements.completionDate.value && elements.completionDate.value > todayIso()
        ? "Das Abschlussdatum darf nicht in der Zukunft liegen."
        : "",
    );
    if (!elements.completionForm.reportValidity()) return;

    if (selectedCompletionEmployeeIds.size === 0) {
      elements.completionEmployeeError.textContent = "Bitte mindestens einen Mitarbeiter auswählen.";
      elements.completionEmployeeList.scrollIntoView({ block: "nearest" });
      return;
    }

    const trainingId = elements.completionTraining.value;
    const completedOn = elements.completionDate.value;
    const note = document.querySelector("#completionNote").value.trim();
    const now = new Date().toISOString();
    let addedCount = 0;
    let duplicateCount = 0;
    let inactiveCount = 0;
    const newCompletions = [];

    selectedCompletionEmployeeIds.forEach((employeeId) => {
      const employeeIsActive = state.employees.some(
        (employee) => employee.id === employeeId && employee.active,
      );
      if (!employeeIsActive) {
        inactiveCount += 1;
        return;
      }

      const duplicate = state.completions.some(
        (completion) =>
          completion.employeeId === employeeId &&
          completion.trainingId === trainingId &&
          completion.completedOn === completedOn,
      );
      if (duplicate) {
        duplicateCount += 1;
        return;
      }

      newCompletions.push({
        id: createId(),
        employeeId,
        trainingId,
        completedOn,
        note,
        createdAt: now,
      });
      addedCount += 1;
    });

    if (addedCount > 0) {
      const committed = await commitStateMutation(() => {
        state.completions.push(...newCompletions);
      });
      if (!committed) return;

      elements.completionDialog.close();
      const duplicateNote = duplicateCount
        ? ` ${duplicateCount} bereits vorhandene${duplicateCount === 1 ? "r" : ""} Nachweis${
            duplicateCount === 1 ? "" : "e"
          } wurde${duplicateCount === 1 ? "" : "n"} übersprungen.`
        : "";
      showToast(
        `${addedCount} Nachweis${addedCount === 1 ? "" : "e"} gespeichert.${duplicateNote}`,
      );
    } else {
      showToast(
        inactiveCount
          ? "Die ausgewählten Mitarbeiter sind nicht mehr aktiv."
          : "Diese Nachweise sind für das gewählte Datum bereits vorhanden.",
        "error",
      );
    }
  }

  function requestDeleteCompletion(completionId) {
    const completion = state.completions.find((item) => item.id === completionId);
    if (!completion) return;
    const employee = getEmployee(completion.employeeId);
    const training = getTraining(completion.trainingId);

    requestConfirmation({
      title: "Nachweis löschen?",
      message: `Der Abschluss „${training?.title || "Fortbildung"}“ von ${
        employee ? fullName(employee) : "diesem Mitarbeiter"
      } am ${formatDate(completion.completedOn)} wird entfernt.`,
      acceptLabel: "Nachweis löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.completions = state.completions.filter((item) => item.id !== completionId);
        }, { undo: "Fortbildungsnachweis gelöscht" });
        if (!committed) return;

        showUndoToast("Fortbildungsnachweis wurde gelöscht.");
      },
    });
  }

  function requestConfirmation({ title, message, acceptLabel, callback, tone = "danger" }) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmAccept.textContent = acceptLabel;
    elements.confirmAccept.classList.toggle("button-danger", tone === "danger");
    elements.confirmAccept.classList.toggle("button-primary", tone === "primary");
    confirmCallback = callback;
    elements.confirmDialog.showModal();
    window.setTimeout(() => elements.confirmCancel.focus(), 0);
  }

  function normalizeAutomaticBackupSettings(value = {}) {
    const parsedLastBackupAt = Date.parse(value.lastBackupAt);
    const parsedLastBackupSizeBytes = Number(value.lastBackupSizeBytes);
    const keyFingerprint = String(value.keyFingerprint || "").slice(0, 200);
    const keyEnvelopes = Object.fromEntries(
      Object.entries(value.keyEnvelopes || {})
        .filter(
          ([userId, envelope]) =>
            String(userId).length > 0 &&
            envelope &&
            envelope.format === `${BACKUP_FORMAT}-verschluesselt` &&
            typeof envelope.salt === "string" &&
            typeof envelope.iv === "string" &&
            typeof envelope.ciphertext === "string",
        )
        .slice(0, 500),
    );
    return {
      enabled: Boolean(value.enabled),
      encrypted: Boolean(value.encrypted && keyFingerprint),
      keyFingerprint,
      keyEnvelopes,
      lastBackupAt: Number.isFinite(parsedLastBackupAt)
        ? new Date(parsedLastBackupAt).toISOString()
        : "",
      lastBackupSizeBytes:
        Number.isSafeInteger(parsedLastBackupSizeBytes) &&
        parsedLastBackupSizeBytes >= 0
          ? parsedLastBackupSizeBytes
          : 0,
      directoryName: String(value.directoryName || "").trim().slice(0, 200),
    };
  }

  async function loadAutomaticBackupConfiguration() {
    automaticBackupSettings = normalizeAutomaticBackupSettings();
    try {
      const [savedSettings, savedHandle] = await Promise.all([
        dataStore.getItem(AUTO_BACKUP_CONFIG_KEY),
        dataStore.getItem(AUTO_BACKUP_DIRECTORY_KEY),
      ]);
      automaticBackupSettings = normalizeAutomaticBackupSettings(savedSettings);
      automaticBackupDirectoryHandle =
        savedHandle?.kind === "directory" ? savedHandle : null;
      if (!automaticBackupDirectoryHandle) {
        automaticBackupSettings.enabled = false;
      } else {
        automaticBackupSettings.directoryName =
          automaticBackupDirectoryHandle.name ||
          automaticBackupSettings.directoryName;
      }
    } catch (error) {
      console.warn(
        "Die Konfiguration der automatischen Sicherung konnte nicht geladen werden.",
        error,
      );
      automaticBackupDirectoryHandle = null;
      automaticBackupSettings.enabled = false;
      automaticBackupNotice =
        "Die gespeicherte Ordnerverknüpfung konnte nicht geladen werden.";
    }
  }

  async function persistAutomaticBackupConfiguration() {
    await dataStore.setItem(AUTO_BACKUP_CONFIG_KEY, automaticBackupSettings);
  }

  async function selectAutomaticBackupDirectory() {
    if (typeof window.showDirectoryPicker !== "function") {
      automaticBackupNotice =
        "Dieser Browser unterstützt keine direkte Ordnerfreigabe. Verwenden Sie Chrome oder Edge über HTTPS beziehungsweise localhost.";
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "error");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({
        id: "teo-automatic-backup",
        mode: "readwrite",
      });
      await dataStore.setItem(AUTO_BACKUP_DIRECTORY_KEY, handle);
      automaticBackupDirectoryHandle = handle;
      automaticBackupSettings = normalizeAutomaticBackupSettings({
        ...automaticBackupSettings,
        enabled: true,
        directoryName: handle.name,
      });
      automaticBackupNotice = "";
      await persistAutomaticBackupConfiguration();
      renderAutomaticBackupStatus();
      await runAutomaticBackup({ force: true, requestPermission: true });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Der Sicherungsordner konnte nicht gespeichert werden.", error);
      automaticBackupNotice =
        "Der Sicherungsordner konnte nicht verknüpft werden.";
      renderAutomaticBackupStatus();
      showToast(automaticBackupNotice, "error");
    }
  }

  async function removeAutomaticBackupDirectory() {
    clearAutomaticBackupTimer();
    automaticBackupDirectoryHandle = null;
    automaticBackupPassword = "";
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      enabled: false,
      directoryName: "",
    });
    try {
      await Promise.all([
        dataStore.removeItem(AUTO_BACKUP_DIRECTORY_KEY),
        persistAutomaticBackupConfiguration(),
      ]);
      automaticBackupNotice = "";
      renderAutomaticBackupStatus();
      showToast(
        "Die Ordnerverknüpfung wurde entfernt. Vorhandene Sicherungsdateien bleiben erhalten.",
      );
    } catch (error) {
      console.error("Die Ordnerverknüpfung konnte nicht entfernt werden.", error);
      showToast("Die Ordnerverknüpfung konnte nicht entfernt werden.", "error");
    }
  }

  async function saveAutomaticBackupSettings() {
    const encrypted = elements.automaticBackupEncryption.checked;
    if (encrypted && !automaticBackupPassword) {
      const configured = await configureAutomaticBackupEncryption({
        persist: false,
      });
      if (!configured) {
        renderAutomaticBackupStatus();
        return;
      }
    }
    if (!encrypted) automaticBackupPassword = "";
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      enabled: Boolean(automaticBackupDirectoryHandle),
      encrypted,
    });
    try {
      await persistAutomaticBackupConfiguration();
      automaticBackupNotice = "";
      scheduleAutomaticBackup();
      renderAutomaticBackupStatus();
      showToast("Die Einstellungen der automatischen Sicherung wurden gespeichert.");
    } catch (error) {
      console.error("Die Sicherungseinstellungen konnten nicht gespeichert werden.", error);
      showToast("Die Sicherungseinstellungen konnten nicht gespeichert werden.", "error");
    }
  }

  async function configureAutomaticBackupEncryption({ persist = true } = {}) {
    if (automaticBackupSettings.encrypted) {
      if (!automaticBackupPassword) {
        automaticBackupPassword = await requestAutomaticBackupRecoveryKey();
      }
      if (!automaticBackupPassword) return false;
      showAutomaticBackupRecoveryKey();
      renderAutomaticBackupStatus();
      return true;
    }

    const loginPassword = await requestVerifiedAutomaticBackupLoginPassword();
    if (!loginPassword) return false;
    automaticBackupPassword = generateAutomaticBackupRecoveryKey();
    const keyFingerprint = await automaticBackupKeyFingerprint(
      automaticBackupPassword,
    );
    const keyEnvelope = await encryptBackup(
      automaticBackupPassword,
      loginPassword,
    );
    automaticBackupNotice = "";
    elements.automaticBackupEncryption.checked = true;
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      encrypted: true,
      keyFingerprint,
      keyEnvelopes: {
        [currentUser.id]: keyEnvelope,
      },
    });
    if (persist) {
      try {
        await persistAutomaticBackupConfiguration();
      } catch (error) {
        console.error(
          "Die Einstellung zur automatischen Verschlüsselung konnte nicht gespeichert werden.",
          error,
        );
        showToast("Die Verschlüsselungseinstellung konnte nicht gespeichert werden.", "error");
        return false;
      }
      scheduleAutomaticBackup();
      showToast("Die automatische Login-Verschlüsselung wurde eingerichtet.");
    }
    renderAutomaticBackupStatus();
    showAutomaticBackupRecoveryKey();
    return true;
  }

  async function requestVerifiedAutomaticBackupLoginPassword() {
    let errorMessage = "";
    while (true) {
      const password = await requestBackupPassword({
        mode: "automatic",
        errorMessage,
      });
      if (!password) return null;
      if (await verifyAutomaticBackupLoginPassword(password)) return password;
      errorMessage = "Das eingegebene Login-Passwort ist nicht korrekt.";
    }
  }

  async function verifyAutomaticBackupLoginPassword(password) {
    if (!currentUser) return false;
    if (!isMariaDbMode()) return verifyPassword(password, currentUser);
    try {
      const previousToken = window.TeOBackend.readToken();
      const result = await window.TeOBackend.login(
        backendConfig.apiUrl,
        currentUser.username,
        password,
      );
      window.TeOBackend.writeToken(result.token);
      if (previousToken && previousToken !== result.token) {
        void window.TeOBackend.logout(backendConfig.apiUrl, previousToken);
      }
      return true;
    } catch {
      return false;
    }
  }

  function generateAutomaticBackupRecoveryKey() {
    return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  }

  async function automaticBackupKeyFingerprint(key) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(key),
    );
    return bytesToBase64(new Uint8Array(digest));
  }

  async function registerAutomaticBackupUserKey(userId, loginPassword) {
    if (
      !automaticBackupSettings?.encrypted ||
      !automaticBackupPassword ||
      !userId ||
      !loginPassword
    ) {
      return false;
    }
    const keyEnvelope = await encryptBackup(
      automaticBackupPassword,
      loginPassword,
    );
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      keyEnvelopes: {
        ...automaticBackupSettings.keyEnvelopes,
        [userId]: keyEnvelope,
      },
    });
    await persistAutomaticBackupConfiguration();
    return true;
  }

  async function removeAutomaticBackupUserKey(userId) {
    if (!automaticBackupSettings?.keyEnvelopes?.[userId]) return false;
    const keyEnvelopes = { ...automaticBackupSettings.keyEnvelopes };
    delete keyEnvelopes[userId];
    automaticBackupSettings = normalizeAutomaticBackupSettings({
      ...automaticBackupSettings,
      keyEnvelopes,
    });
    await persistAutomaticBackupConfiguration();
    return true;
  }

  async function unlockAutomaticBackupForLogin(user, loginPassword) {
    if (!automaticBackupSettings?.encrypted) return true;
    const envelope = automaticBackupSettings.keyEnvelopes?.[user.id];
    if (envelope) {
      try {
        const key = await decryptBackup(envelope, loginPassword);
        if (
          (await automaticBackupKeyFingerprint(key)) ===
          automaticBackupSettings.keyFingerprint
        ) {
          automaticBackupPassword = key;
          automaticBackupNotice = "";
          return true;
        }
      } catch {
        // Ein altes Passwort oder eine fehlende Hülle wird über den
        // Wiederherstellungsschlüssel repariert.
      }
    }
    const recoveryKey = await requestAutomaticBackupRecoveryKey();
    if (!recoveryKey) return false;
    automaticBackupPassword = recoveryKey;
    await registerAutomaticBackupUserKey(user.id, loginPassword);
    automaticBackupNotice = "";
    return true;
  }

  async function requestAutomaticBackupRecoveryKey() {
    let errorMessage = "";
    while (true) {
      const key = (
        await requestBackupPassword({ mode: "recovery", errorMessage })
      )?.trim();
      if (!key) return null;
      if (
        (await automaticBackupKeyFingerprint(key)) ===
        automaticBackupSettings.keyFingerprint
      ) {
        return key;
      }
      errorMessage = "Der Wiederherstellungsschlüssel ist nicht korrekt.";
    }
  }

  function showAutomaticBackupRecoveryKey() {
    if (!automaticBackupPassword) return;
    elements.automaticBackupRecoveryKey.value = automaticBackupPassword;
    if (!elements.automaticBackupRecoveryDialog.open) {
      elements.automaticBackupRecoveryDialog.showModal();
    }
    elements.automaticBackupRecoveryKey.focus();
    elements.automaticBackupRecoveryKey.select();
  }

  async function copyAutomaticBackupRecoveryKey() {
    const key = elements.automaticBackupRecoveryKey.value;
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      copyTextWithFallback(key);
    }
    showToast("Wiederherstellungsschlüssel wurde kopiert.");
  }

  function renderAutomaticBackupEncryptionControls() {
    elements.setAutomaticBackupPasswordButton.hidden =
      !elements.automaticBackupEncryption.checked;
    elements.setAutomaticBackupPasswordButton.textContent =
      automaticBackupSettings?.encrypted
        ? automaticBackupPassword
          ? "Wiederherstellungsschlüssel anzeigen"
          : "Wiederherstellungsschlüssel eingeben"
        : "Login-Verschlüsselung einrichten";
  }

  function renderAutomaticBackupStatus() {
    if (!automaticBackupSettings) return;
    elements.automaticBackupEncryption.checked =
      automaticBackupSettings.encrypted;
    renderAutomaticBackupEncryptionControls();
    const supported = typeof window.showDirectoryPicker === "function";
    const connected = Boolean(
      automaticBackupSettings.enabled && automaticBackupDirectoryHandle,
    );
    elements.selectAutomaticBackupDirectoryButton.disabled = !supported;
    const encryptionReady =
      !automaticBackupSettings.encrypted || Boolean(automaticBackupPassword);
    elements.runAutomaticBackupButton.disabled =
      !connected || !encryptionReady || automaticBackupRunning;
    elements.removeAutomaticBackupDirectoryButton.hidden = !automaticBackupDirectoryHandle;
    elements.saveAutomaticBackupSettingsButton.disabled = !supported;

    if (!supported) {
      elements.automaticBackupStatus.textContent =
        "Nicht unterstützt – Chrome oder Edge über HTTPS beziehungsweise localhost verwenden.";
      return;
    }
    if (automaticBackupRunning) {
      elements.automaticBackupStatus.textContent = "Datensicherung wird geschrieben …";
      return;
    }
    if (automaticBackupNotice) {
      elements.automaticBackupStatus.textContent = automaticBackupNotice;
      return;
    }
    if (!connected) {
      elements.automaticBackupStatus.textContent =
        "Noch kein Sicherungsordner ausgewählt.";
      return;
    }
    if (!encryptionReady) {
      elements.automaticBackupStatus.textContent =
        `Ordner: ${automaticBackupSettings.directoryName} · Verschlüsselung aktiv – ` +
        "erneut anmelden oder Wiederherstellungsschlüssel eingeben.";
      return;
    }
    const lastBackup = automaticBackupSettings.lastBackupAt
      ? ` · zuletzt ${formatDateTime(automaticBackupSettings.lastBackupAt)}`
      : " · noch keine automatische Sicherung";
    elements.automaticBackupStatus.textContent =
      `Ordner: ${automaticBackupSettings.directoryName}` +
      `${automaticBackupSettings.encrypted ? " · verschlüsselt" : ""}` +
      lastBackup;
  }

  function clearAutomaticBackupTimer() {
    if (automaticBackupTimer) window.clearTimeout(automaticBackupTimer);
    automaticBackupTimer = null;
  }

  function scheduleAutomaticBackup() {
    clearAutomaticBackupTimer();
    if (
      !currentUser ||
      currentUser.mustChangePassword ||
      !databaseSaveReminderArmed ||
      !automaticBackupSettings?.enabled ||
      !automaticBackupDirectoryHandle ||
      (automaticBackupSettings.encrypted && !automaticBackupPassword)
    ) {
      return;
    }
    const delay = automaticBackupScheduleDelay();
    automaticBackupTimer = window.setTimeout(() => {
      automaticBackupTimer = null;
      void runAutomaticBackup();
    }, Math.min(delay, 2147483647));
  }

  function automaticBackupScheduleDelay(now = Date.now()) {
    const retryDelay = Math.max(0, automaticBackupRetryAt - now);
    return Math.max(AUTO_BACKUP_DELAY_MS, retryDelay);
  }

  async function automaticBackupPermissionGranted(requestPermission = false) {
    const handle = automaticBackupDirectoryHandle;
    if (!handle) return false;
    const descriptor = { mode: "readwrite" };
    if (typeof handle.queryPermission !== "function") return true;
    let permission = await handle.queryPermission(descriptor);
    if (
      permission !== "granted" &&
      requestPermission &&
      typeof handle.requestPermission === "function"
    ) {
      permission = await handle.requestPermission(descriptor);
    }
    return permission === "granted";
  }

  async function runAutomaticBackup({
    force = false,
    requestPermission = false,
  } = {}) {
    const execute = () =>
      performAutomaticBackup({ force, requestPermission });
    if (typeof navigator.locks?.request === "function") {
      return navigator.locks.request("teo-automatic-backup", execute);
    }
    return execute();
  }

  async function performAutomaticBackup({
    force = false,
    requestPermission = false,
  } = {}) {
    if (automaticBackupRunning) return false;
    if (!automaticBackupDirectoryHandle) {
      showToast("Bitte wählen Sie zuerst einen Sicherungsordner aus.", "error");
      return false;
    }
    if (automaticBackupSettings.encrypted && !automaticBackupPassword) {
      automaticBackupNotice =
        "Verschlüsselung aktiv – Passwort für diese Sitzung festlegen.";
      renderAutomaticBackupStatus();
      return false;
    }
    // Merkt sich den Aenderungsstand zu Beginn der Sicherung. Kommt waehrend
    // des Schreibens eine weitere Aenderung dazu, bleibt die Erinnerung an die
    // naechste Sicherung bestehen.
    const mutationSequence = stateMutationSequence;
    if (force) {
      automaticBackupRetryAt = 0;
    } else {
      try {
        const storedSettings = normalizeAutomaticBackupSettings(
          await dataStore.getItem(AUTO_BACKUP_CONFIG_KEY),
        );
        if (
          (Date.parse(storedSettings.lastBackupAt) || 0) >
          (Date.parse(automaticBackupSettings.lastBackupAt) || 0)
        ) {
          automaticBackupSettings.lastBackupAt = storedSettings.lastBackupAt;
        }
      } catch (error) {
        console.warn("Der Sicherungszeitpunkt konnte nicht abgeglichen werden.", error);
      }
      if (!databaseSaveReminderArmed) {
        scheduleAutomaticBackup();
        return false;
      }
    }

    let permissionGranted = false;
    try {
      permissionGranted = await automaticBackupPermissionGranted(requestPermission);
    } catch (error) {
      console.warn("Die Ordnerberechtigung konnte nicht geprüft werden.", error);
    }
    if (!permissionGranted) {
      automaticBackupRetryAt = Date.now() + 60 * 60 * 1000;
      automaticBackupNotice =
        "Ordnerzugriff muss erneut bestätigt werden – „Jetzt automatisch sichern“ wählen.";
      renderAutomaticBackupStatus();
      if (requestPermission) showToast(automaticBackupNotice, "error");
      scheduleAutomaticBackup();
      return false;
    }

    automaticBackupRunning = true;
    automaticBackupNotice = "";
    renderAutomaticBackupStatus();
    try {
      const exportedAt = new Date();
      const exportedState = JSON.parse(JSON.stringify(state));
      exportedState.settings.lastBackupAt = exportedAt.toISOString();
      const backup = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        appVersion: STATE_VERSION,
        exportedAt: exportedAt.toISOString(),
        data: exportedState,
      };
      let fileContent = JSON.stringify(backup, null, 2);
      if (automaticBackupSettings.encrypted) {
        fileContent = JSON.stringify(
          await encryptBackup(fileContent, automaticBackupPassword),
          null,
          2,
        );
      }
      const volume = assessBackupContent(fileContent);
      if (volume.exceeded) {
        const error = new Error(backupVolumeMessage(volume));
        error.code = "backup_volume_exceeded";
        throw error;
      }
      await writeAutomaticBackupFile(
        automaticBackupDirectoryHandle,
        AUTO_BACKUP_FILENAME,
        fileContent,
      );

      // Die Datei liegt geschrieben vor, der Zeitstempel muss aber auch in den
      // Datenbestand. Scheitert das, darf der lokale Stand nicht so tun, als
      // waere gesichert worden - und der vom Server geladene Konfliktstand darf
      // nicht bis zur naechsten Mutation unbeachtet liegen bleiben, sonst
      // verwirft er dort eine Eingabe ohne erkennbaren Zusammenhang.
      const previousLastBackupAt = state.settings.lastBackupAt;
      state.settings.lastBackupAt = exportedAt.toISOString();
      const auditEntryId = appendAuditEntry(
        automaticBackupSettings.encrypted
          ? "Verschlüsselte automatische Datensicherung exportiert"
          : "Automatische Datensicherung exportiert",
      );
      if (!(await persistState())) {
        if (pendingRemoteConflictState) {
          state = pendingRemoteConflictState;
          pendingRemoteConflictState = null;
        } else {
          state.settings.lastBackupAt = previousLastBackupAt;
          state.auditLog = state.auditLog.filter(
            (entry) => entry.id !== auditEntryId,
          );
        }
        const error = new Error(
          "Die Sicherungsdatei wurde geschrieben, der Sicherungszeitpunkt konnte aber nicht gespeichert werden.",
        );
        error.code = "backup_timestamp_not_persisted";
        throw error;
      }
      automaticBackupSettings.lastBackupAt = exportedAt.toISOString();
      automaticBackupSettings.lastBackupSizeBytes = volume.sizeBytes;
      await persistAutomaticBackupConfiguration();
      automaticBackupRetryAt = 0;
      automaticBackupNotice = "";
      databaseSaveReminderArmed = stateMutationSequence !== mutationSequence;
      renderAll();
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : `Automatische Datensicherung „${AUTO_BACKUP_FILENAME}“ wurde aktualisiert.`,
        volume.warning ? "warning" : undefined,
      );
      return true;
    } catch (error) {
      console.error("Die automatische Datensicherung ist fehlgeschlagen.", error);
      automaticBackupRetryAt = Date.now() + 60 * 60 * 1000;
      automaticBackupNotice = [
        "backup_volume_exceeded",
        "backup_timestamp_not_persisted",
      ].includes(error?.code)
        ? error.message
        : "Automatische Sicherung fehlgeschlagen – Ordnerzugriff und freien Speicher prüfen.";
      showToast(automaticBackupNotice, "error");
      return false;
    } finally {
      automaticBackupRunning = false;
      renderAutomaticBackupStatus();
      scheduleAutomaticBackup();
    }
  }

  async function writeAutomaticBackupFile(directoryHandle, filename, content) {
    const fileHandle = await directoryHandle.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(content);
      await writable.close();
    } catch (error) {
      await writable.abort?.();
      throw error;
    }
  }

  function configuredBackupMaxBytes(settings = state?.settings) {
    const configuredMb = Number(settings?.maxBackupFileSizeMb);
    const maxMb =
      Number.isInteger(configuredMb) &&
      configuredMb >= MIN_BACKUP_FILE_SIZE_MB &&
      configuredMb <= MAX_BACKUP_FILE_SIZE_MB
        ? configuredMb
        : DEFAULT_MAX_BACKUP_FILE_SIZE_MB;
    return maxMb * 1024 * 1024;
  }

  function backupVolumeAssessment(sizeBytes, settings = state?.settings) {
    const bytes = Math.max(0, Number(sizeBytes) || 0);
    const maxBytes = configuredBackupMaxBytes(settings);
    const ratio = maxBytes ? bytes / maxBytes : 0;
    return {
      sizeBytes: bytes,
      maxBytes,
      usagePercent: Math.round(ratio * 100),
      warning: ratio >= BACKUP_VOLUME_WARNING_RATIO,
      exceeded: bytes > maxBytes,
    };
  }

  function backupVolumeMessage(assessment) {
    return assessment.exceeded
      ? `Die Sicherungsdatei ist ${formatStorageSize(assessment.sizeBytes)} groß und überschreitet das eingestellte Maximum von ${formatStorageSize(assessment.maxBytes)}.`
      : `Die Sicherungsdatei nutzt ${assessment.usagePercent} % des eingestellten Volumens (${formatStorageSize(assessment.sizeBytes)} von ${formatStorageSize(assessment.maxBytes)}).`;
  }

  function assessBackupContent(fileContent) {
    return backupVolumeAssessment(
      new TextEncoder().encode(fileContent).byteLength,
    );
  }

  function estimatedCurrentBackupSizeBytes() {
    const exportedAt = new Date().toISOString();
    return assessBackupContent(
      JSON.stringify(
        {
          format: BACKUP_FORMAT,
          formatVersion: BACKUP_FORMAT_VERSION,
          appVersion: STATE_VERSION,
          exportedAt,
          data: {
            ...state,
            settings: { ...state.settings, lastBackupAt: exportedAt },
          },
        },
        null,
        2,
      ),
    ).sizeBytes;
  }

  function formatBackupMegabytes(bytes) {
    const megabytes = Math.max(0, Number(bytes) || 0) / (1024 * 1024);
    return numberFormat({
      minimumFractionDigits: megabytes > 0 && megabytes < 1 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(megabytes);
  }

  function renderBackupVolumeMeter(configuredMaxMb = state.settings.maxBackupFileSizeMb) {
    const parsedMaxMb = Number(configuredMaxMb);
    const maxBackupFileSizeMb =
      Number.isInteger(parsedMaxMb) &&
      parsedMaxMb >= MIN_BACKUP_FILE_SIZE_MB &&
      parsedMaxMb <= MAX_BACKUP_FILE_SIZE_MB
        ? parsedMaxMb
        : state.settings.maxBackupFileSizeMb;
    const sizeBytes =
      automaticBackupSettings?.lastBackupSizeBytes ||
      estimatedCurrentBackupSizeBytes();
    const assessment = backupVolumeAssessment(sizeBytes, {
      maxBackupFileSizeMb,
    });
    const percent = Math.min(
      100,
      assessment.maxBytes ? (assessment.sizeBytes / assessment.maxBytes) * 100 : 0,
    );

    elements.backupVolumeMeter.style.setProperty(
      "--backup-volume-percent",
      `${percent}%`,
    );
    elements.backupVolumeMeter.classList.toggle("is-warning", assessment.warning);
    elements.backupVolumeMeter.classList.toggle("is-exceeded", assessment.exceeded);
    elements.backupVolumeMeter.setAttribute(
      "aria-valuenow",
      String(Math.min(100, assessment.usagePercent)),
    );
    elements.backupVolumeMeter.setAttribute("aria-valuemax", "100");
    elements.backupVolumeLabel.textContent =
      `${formatBackupMegabytes(assessment.sizeBytes)} von ${maxBackupFileSizeMb} MB`;
    elements.backupVolumeHint.textContent = assessment.exceeded
      ? "Grenzwert überschritten – maximale Sicherungsgröße erhöhen."
      : assessment.warning
        ? `Volumenwarnung: ${assessment.usagePercent} % der Grenze erreicht.`
        : `Warnung ab ${formatBackupMegabytes(assessment.maxBytes * BACKUP_VOLUME_WARNING_RATIO)} MB (90 %).`;
  }

  async function rememberBackupVolume(sizeBytes) {
    automaticBackupSettings.lastBackupSizeBytes = Math.max(
      0,
      Math.round(Number(sizeBytes) || 0),
    );
    try {
      await persistAutomaticBackupConfiguration();
    } catch (error) {
      console.warn("Das zuletzt gemessene Sicherungsvolumen konnte nicht gespeichert werden.", error);
    }
  }

  async function exportDatabase() {
    await createAndDownloadBackup();
  }

  async function exportEncryptedDatabase() {
    const password = await requestBackupPassword({ mode: "export" });
    if (!password) return;
    try {
      await createAndDownloadBackup({ encrypted: true, password });
    } catch (error) {
      console.error("Verschlüsselte Sicherung fehlgeschlagen.", error);
      showToast(
        "Die verschlüsselte Sicherung wird von diesem Browser nicht unterstützt.",
        "error",
      );
    }
  }

  function requestBackupPassword({ mode, errorMessage = "" }) {
    const exporting = mode === "export";
    const automatic = mode === "automatic";
    const recovery = mode === "recovery";
    elements.backupPasswordForm.reset();
    elements.backupPasswordDialog.dataset.mode = mode;
    elements.backupPasswordDialogTitle.textContent = automatic
      ? "Login-Verschlüsselung einrichten"
      : recovery
        ? "Wiederherstellungsschlüssel eingeben"
      : exporting
        ? "Sicherung verschlüsseln"
        : "Sicherung entschlüsseln";
    elements.backupPasswordDialogDescription.textContent = automatic
      ? "Bestätigen Sie Ihr aktuelles Login-Passwort. TeO verwendet es zum geschützten Hinterlegen des gemeinsamen Sicherungsschlüssels."
      : recovery
        ? "Dieses Konto benötigt einmalig den Wiederherstellungsschlüssel der automatischen Sicherung."
      : exporting
        ? "Schützen Sie den vollständigen Datenbestand mit einem eigenen Passwort."
        : "Diese Sicherungsdatei ist verschlüsselt. Geben Sie das zugehörige Passwort ein.";
    elements.backupPasswordNotice.textContent = automatic
      ? "Das Login-Passwort wird nicht gespeichert. Bei späteren Anmeldungen entsperrt es den Sicherungsschlüssel automatisch."
      : recovery
        ? "Nach erfolgreicher Eingabe wird der Sicherungsschlüssel mit Ihrem Login-Passwort geschützt."
      : exporting
        ? "Das Passwort wird nicht gespeichert und kann nicht wiederhergestellt werden. Bewahren Sie es getrennt von der Sicherungsdatei auf."
        : "Das Passwort wird ausschließlich zur Entschlüsselung dieser Datei verwendet und nicht gespeichert.";
    elements.backupPasswordConfirmationField.hidden = !exporting;
    elements.backupPasswordConfirmation.required = exporting;
    elements.backupPassword.minLength = exporting ? 8 : 1;
    elements.backupPassword.autocomplete = automatic
      ? "current-password"
      : exporting
      ? "new-password"
      : "current-password";
    elements.backupPasswordSubmit.textContent = automatic
      ? "Login bestätigen"
      : recovery
        ? "Schlüssel übernehmen"
      : exporting
        ? "Verschlüsselt exportieren"
        : "Sicherung entsperren";
    elements.backupPasswordError.textContent = errorMessage;
    updateBackupPasswordVisibility();

    return new Promise((resolve) => {
      backupPasswordResolver = resolve;
      elements.backupPasswordDialog.showModal();
      window.setTimeout(() => elements.backupPassword.focus(), 0);
    });
  }

  function handleBackupPasswordSubmit(event) {
    event.preventDefault();
    const mode = elements.backupPasswordDialog.dataset.mode;
    const encrypting = mode === "export";
    const password = elements.backupPassword.value;
    if (encrypting && password.length < 8) {
      elements.backupPasswordError.textContent =
        "Das Sicherungspasswort muss mindestens 8 Zeichen lang sein.";
      elements.backupPassword.focus();
      return;
    }
    if (
      encrypting &&
      password !== elements.backupPasswordConfirmation.value
    ) {
      elements.backupPasswordError.textContent =
        "Die eingegebenen Passwörter stimmen nicht überein.";
      elements.backupPasswordConfirmation.focus();
      return;
    }
    settleBackupPasswordDialog(password);
  }

  function updateBackupPasswordVisibility() {
    const inputType = elements.showBackupPassword.checked ? "text" : "password";
    elements.backupPassword.type = inputType;
    elements.backupPasswordConfirmation.type = inputType;
  }

  function settleBackupPasswordDialog(password) {
    const resolver = backupPasswordResolver;
    backupPasswordResolver = null;
    if (elements.backupPasswordDialog.open) {
      elements.backupPasswordDialog.close();
    }
    resolver?.(password);
  }

  function handleBackupPasswordDialogClose() {
    if (!backupPasswordResolver) return;
    const resolver = backupPasswordResolver;
    backupPasswordResolver = null;
    resolver(null);
  }

  async function createAndDownloadBackup({
    encrypted = false,
    password = "",
    prefix = "datensicherung",
    silent = false,
  } = {}) {
    const exportedAt = new Date();
    const exportedState = JSON.parse(JSON.stringify(state));
    exportedState.settings.lastBackupAt = exportedAt.toISOString();
    const backup = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: STATE_VERSION,
      exportedAt: exportedAt.toISOString(),
      data: exportedState,
    };
    let fileContent = JSON.stringify(backup, null, 2);
    if (encrypted) {
      fileContent = JSON.stringify(await encryptBackup(fileContent, password), null, 2);
    }
    const volume = assessBackupContent(fileContent);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return false;
    }
    downloadTextFile(
      `teo-${prefix}_${fileTimestamp(exportedAt)}${
        encrypted ? ".verschluesselt" : ""
      }.json`,
      fileContent,
      "application/json;charset=utf-8",
    );
    await rememberBackupVolume(volume.sizeBytes);
    state.settings.lastBackupAt = exportedAt.toISOString();
    appendAuditEntry(
      encrypted
        ? "Verschlüsselte Datensicherung exportiert"
        : "Datensicherung exportiert",
    );
    await persistState();
    databaseSaveReminderArmed = false;
    renderAll();
    if (!silent) {
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : encrypted
            ? "Die verschlüsselte Datensicherung wurde exportiert."
            : "Die vollständige Datensicherung wurde exportiert.",
        volume.warning ? "warning" : undefined,
      );
    }
    return true;
  }

  function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  }

  function fileTimestamp(date) {
    return date
      .toISOString()
      .replace("T", "_")
      .replaceAll(":", "-")
      .slice(0, 19);
  }

  async function encryptBackup(plainText, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plainText),
    );
    return {
      format: `${BACKUP_FORMAT}-verschluesselt`,
      formatVersion: 1,
      algorithm: "AES-GCM",
      keyDerivation: "PBKDF2-SHA-256",
      iterations: 250000,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };
  }

  async function decryptBackup(envelope, password) {
    try {
      const salt = base64ToBytes(envelope.salt);
      const iv = base64ToBytes(envelope.iv);
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
      );
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: Number(envelope.iterations) || 250000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        base64ToBytes(envelope.ciphertext),
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error(
        "Die Sicherung konnte nicht entschlüsselt werden. Bitte Passwort prüfen.",
      );
    }
  }

  async function readBackupFile(file) {
    const fileContent = await file.text();
    let envelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
    }
    if (envelope?.format === `${BACKUP_FORMAT}-verschluesselt`) {
      if (automaticBackupPassword) {
        try {
          return parseBackup(
            await decryptBackup(envelope, automaticBackupPassword),
          );
        } catch {
          // Manuelle Sicherungen können ein anderes Passwort verwenden.
        }
      }
      let errorMessage = "";
      while (true) {
        const password = await requestBackupPassword({
          mode: "import",
          errorMessage,
        });
        if (!password) return null;
        let decryptedContent;
        try {
          decryptedContent = await decryptBackup(envelope, password);
        } catch (error) {
          errorMessage =
            error.message ||
            "Die Sicherung konnte nicht entschlüsselt werden. Bitte Passwort prüfen.";
          continue;
        }
        return parseBackup(decryptedContent);
      }
    }
    return parseBackup(fileContent);
  }

  async function handleBackupFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return;
    }
    if (volume.warning) showToast(backupVolumeMessage(volume), "warning");

    let importedState;
    try {
      importedState = await readBackupFile(file);
      if (!importedState) return;
    } catch (error) {
      console.warn("Sicherungsdatei konnte nicht geprüft werden.", error);
      showToast(error.message || "Die Sicherungsdatei ist ungültig.", "error");
      return;
    }

    const counts = [
      `${importedState.employees.length} Mitarbeiter`,
      `${importedState.trainings.length} Fortbildungen`,
      `${importedState.completions.length} Nachweise`,
      `${importedState.meetings.length} Teamsitzungen`,
      `${importedState.meetingAttendances.length} Teilnahmestatus`,
      `${importedState.appointments.length} Termine`,
      `${importedState.devices.length} Geräte`,
      `${importedState.deviceInstructions.length} Geräteeinweisungen`,
    ].join(", ");
    const accountNote = state.users.length
      ? "Die bestehenden Benutzerkonten bleiben unverändert erhalten."
      : "Da noch kein Benutzerkonto vorhanden ist, werden die Konten aus der Sicherung übernommen.";

    requestConfirmation({
      title: "Datensicherung importieren?",
      message: `Die aktuellen Daten werden vollständig durch diese Sicherung ersetzt: ${counts}. ${accountNote} Dieser Vorgang kann nur mit einer zuvor exportierten Sicherung rückgängig gemacht werden.`,
      acceptLabel: "Daten importieren",
      tone: "primary",
      callback: async () => {
        const recoveryBackupCreated = await createAndDownloadBackup({
          prefix: "vor-import",
          silent: true,
        });
        if (!recoveryBackupCreated) return;
        await importDatabase(importedState);
      },
    });
  }

  async function handleBackupValidationSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      showToast(backupVolumeMessage(volume), "error");
      return;
    }
    if (volume.warning) showToast(backupVolumeMessage(volume), "warning");
    try {
      const checkedState = await readBackupFile(file);
      if (!checkedState) return;
      showToast(
        `Sicherung gültig: ${checkedState.employees.length} Mitarbeiter, ${checkedState.trainings.length} Fortbildungen, ${checkedState.meetings.length} Teamsitzungen, ${checkedState.appointments.length} Termine und ${checkedState.devices.length} Geräte.`,
      );
    } catch (error) {
      showToast(error.message || "Die Sicherungsdatei ist ungültig.", "error");
    }
  }

  function startupBackupIsOlder(
    importedState,
    currentBackupSettings = automaticBackupSettings,
  ) {
    const importedAt = Date.parse(importedState?.settings?.lastBackupAt);
    const currentAt = Date.parse(currentBackupSettings?.lastBackupAt);
    if (!Number.isFinite(currentAt)) return false;
    return !Number.isFinite(importedAt) || importedAt < currentAt;
  }

  async function findStartupBackupFileInSavedDirectory(
    directoryHandle = automaticBackupDirectoryHandle,
    requestPermission = false,
  ) {
    if (!directoryHandle) return { status: "directory-missing" };

    try {
      if (typeof directoryHandle.queryPermission === "function") {
        const descriptor = { mode: "read" };
        let permission = await directoryHandle.queryPermission(descriptor);
        if (
          permission !== "granted" &&
          requestPermission &&
          typeof directoryHandle.requestPermission === "function"
        ) {
          permission = await directoryHandle.requestPermission(descriptor);
        }
        if (permission !== "granted") {
          return { status: "permission-required" };
        }
      }
      const fileHandle = await directoryHandle.getFileHandle(
        AUTO_BACKUP_FILENAME,
        { create: false },
      );
      return { status: "found", file: await fileHandle.getFile() };
    } catch (error) {
      if (error?.name === "NotFoundError") return { status: "file-missing" };
      console.warn(
        "Die Sicherungsdatei konnte am gespeicherten Ort nicht gelesen werden.",
        error,
      );
      return { status: "read-failed" };
    }
  }

  function startupBackupFallbackMessage(status) {
    if (status === "permission-required") {
      return "Der zuletzt verwendete Sicherungsordner muss erneut freigegeben werden. Bitte wählen Sie teo-autosicherung.json aus.";
    }
    if (status === "file-missing") {
      return "Im zuletzt verwendeten Sicherungsordner wurde teo-autosicherung.json nicht gefunden. Bitte wählen Sie die Datei aus.";
    }
    if (status === "read-failed") {
      return "Der zuletzt verwendete Sicherungsordner konnte nicht gelesen werden. Bitte wählen Sie teo-autosicherung.json aus.";
    }
    return "";
  }

  async function synchronizeStartupBackupFromSavedDirectory({
    requestPermission = false,
  } = {}) {
    document.body.classList.add("is-auth-locked");
    const located = await findStartupBackupFileInSavedDirectory(
      automaticBackupDirectoryHandle,
      requestPermission,
    );
    if (!currentUser || startupBackupSynchronized) return false;

    if (located.status !== "found") {
      showStartupBackupDialog(startupBackupFallbackMessage(located.status));
      return false;
    }

    elements.startupBackupStatus.textContent =
      "Gespeicherte Sicherungsdatei wird automatisch geladen …";
    const synchronized = await synchronizeStartupBackupFile(located.file);
    if (!synchronized && currentUser && !startupBackupSynchronized) {
      showStartupBackupDialog(elements.startupBackupStatus.textContent);
    }
    return synchronized;
  }

  async function handleStartupBackupFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await synchronizeStartupBackupFile(file);
  }

  async function synchronizeStartupBackupFile(file) {
    if (!file || startupBackupImportRunning) return false;

    if (file.name.toLocaleLowerCase("de-DE") !== AUTO_BACKUP_FILENAME) {
      elements.startupBackupStatus.textContent =
        `Bitte wählen Sie die Datei „${AUTO_BACKUP_FILENAME}“ aus.`;
      return false;
    }
    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      elements.startupBackupStatus.textContent = backupVolumeMessage(volume);
      return false;
    }

    startupBackupImportRunning = true;
    elements.selectStartupBackupFileButton.disabled = true;
    elements.startupBackupStatus.textContent = "Sicherungsdatei wird geprüft …";
    try {
      const importedState = await readBackupFile(file);
      if (!importedState) {
        elements.startupBackupStatus.textContent =
          "Der Startabgleich wurde nicht abgeschlossen.";
        return false;
      }
      if (startupBackupIsOlder(importedState)) {
        elements.startupBackupStatus.textContent =
          "Diese Sicherungsdatei ist älter als der zuletzt lokal gesicherte Datenstand. Bitte wählen Sie die aktuelle Datei aus.";
        return false;
      }
      elements.startupBackupStatus.textContent = "Datenbestand wird übernommen …";
      if (!(await importDatabase(importedState))) {
        elements.startupBackupStatus.textContent =
          "Der Datenbestand konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
        return false;
      }

      startupBackupSynchronized = true;
      await rememberBackupVolume(volume.sizeBytes);
      renderBackupVolumeMeter();
      if (elements.startupBackupDialog.open) elements.startupBackupDialog.close();
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
      scheduleAutomaticBackup();
      // Der zweite Weg in die freigeschaltete Anwendung - completeLogin endet
      // hier vorzeitig, weil erst der Datenbestand geladen werden musste.
      showWhatsNewIfUpdated();
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : "Der aktuelle Datenbestand wurde aus teo-autosicherung.json geladen.",
        volume.warning ? "warning" : undefined,
      );
      return true;
    } catch (error) {
      console.warn("Startabgleich konnte nicht abgeschlossen werden.", error);
      elements.startupBackupStatus.textContent =
        error.message || "Die Sicherungsdatei ist ungültig.";
      return false;
    } finally {
      startupBackupImportRunning = false;
      elements.selectStartupBackupFileButton.disabled = false;
    }
  }

  function renderSettings() {
    elements.settingsBackupReminderDays.value = String(
      state.settings.backupReminderDays,
    );
    elements.settingsMaxBackupFileSizeMb.value = String(
      state.settings.maxBackupFileSizeMb,
    );
    renderBackupVolumeMeter();
    elements.settingsCloseDialogOnOutsideClick.value = state.settings
      .closeDialogOnOutsideClick
      ? "on"
      : "off";
    renderTrainingDurationSettings();
    renderMemoCategorySettings();
    renderSchoolVacationSettings();
    renderVacationSettingsControls();
    elements.settingsStorageBackend.value = backendMode;
    elements.settingsMariaDbApiUrl.value =
      backendConfig.apiUrl ||
      (/^https?:$/.test(window.location.protocol)
        ? window.location.origin
        : "");
    elements.settingsMariaDbPassword.value = "";
    elements.settingsMariaDbBootstrapToken.value = "";
    elements.settingsBackendStatus.classList.toggle(
      "is-remote",
      isMariaDbMode(),
    );
    elements.settingsBackendStatus.classList.remove("is-error");
    elements.settingsBackendStatus.innerHTML = isMariaDbMode()
      ? `<i></i> MariaDB verbunden · Revision ${remoteRevision}`
      : "<i></i> Lokal verbunden";
    renderWeekendSettings();
    renderBackendSelection();
  }

  function renderTrainingDurationSettings() {
    const trainings = [...state.trainings].sort(
      (trainingA, trainingB) =>
        trainingA.title.localeCompare(trainingB.title, "de") ||
        trainingB.year - trainingA.year,
    );
    elements.trainingDurationSettings.innerHTML = trainings.length
      ? trainings
          .map(
            (training) => `
              <label class="training-duration-setting-row">
                <span>
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>Im Katalog seit ${training.year}</small>
                </span>
                <span class="input-suffix">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    value="${training.targetMinutes || ""}"
                    placeholder="Optional"
                    data-training-duration="${training.id}"
                    aria-label="Soll-Zeit für ${escapeHtml(training.title)} in Minuten"
                  />
                  <span>Min.</span>
                </span>
              </label>
            `,
          )
          .join("")
      : `<p class="settings-empty-copy">Legen Sie zuerst eine Pflichtfortbildung an.</p>`;
    elements.saveTrainingDurationsButton.disabled = trainings.length === 0;
  }

  async function saveTrainingDurations() {
    const inputs = [...elements.trainingDurationSettings.querySelectorAll(
      "[data-training-duration]",
    )];
    const invalidInput = inputs.find(
      (input) =>
        input.value.trim() &&
        (!Number.isInteger(Number(input.value)) || Number(input.value) < 1),
    );
    if (invalidInput) {
      invalidInput.setCustomValidity("Bitte ganze Minuten ab 1 eingeben oder das Feld leer lassen.");
      invalidInput.reportValidity();
      invalidInput.setCustomValidity("");
      return;
    }

    const targetMinutesById = new Map(
      inputs.map((input) => [
        input.dataset.trainingDuration,
        input.value.trim() ? Number(input.value) : null,
      ]),
    );
    const changed = state.trainings.some(
      (training) =>
        (training.targetMinutes || null) !== targetMinutesById.get(training.id),
    );
    if (!changed) {
      showToast("Die Soll-Zeiten sind bereits aktuell.");
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.trainings = state.trainings.map((training) => ({
        ...training,
        targetMinutes: targetMinutesById.get(training.id),
        updatedAt:
          (training.targetMinutes || null) === targetMinutesById.get(training.id)
            ? training.updatedAt
            : now,
      }));
    });
    if (committed) showToast("Soll-Zeiten wurden gespeichert.");
  }

  function renderWeekendSettings() {
    const configurationA = state.settings.serviceWeekends.weekend_a;
    const configurationB = state.settings.serviceWeekends.weekend_b;
    elements.settingsWeekendNameA.value = configurationA.name;
    elements.settingsWeekendNameB.value = configurationB.name;

    const selectedOwnerIds = new Set([
      configurationA.ownerId,
      configurationB.ownerId,
    ]);
    const ownerOptions = state.employees
      .filter(
        (employee) =>
          (employee.employmentStatus !== "inactive" &&
            isWeekendLeadership(employee)) ||
          selectedOwnerIds.has(employee.id),
      )
      .sort(sortEmployees)
      .map(
        (employee) =>
          `<option value="${escapeHtml(employee.id)}">${escapeHtml(
            fullName(employee),
          )}${
            employee.employmentStatus === "inactive" ? " (inaktiv)" : ""
          }${
            !isWeekendLeadership(employee)
              ? " (keine Leitungsfunktion)"
              : ""
          }</option>`,
      )
      .join("");
    const options =
      '<option value="">Person auswählen</option>' + ownerOptions;
    elements.settingsWeekendOwnerA.innerHTML = options;
    elements.settingsWeekendOwnerB.innerHTML = options;
    elements.settingsWeekendOwnerA.value = configurationA.ownerId;
    elements.settingsWeekendOwnerB.value = configurationB.ownerId;
    updateWeekendNamePreviews();
  }

  function updateWeekendNamePreviews() {
    const ownerA = getEmployee(elements.settingsWeekendOwnerA.value);
    const ownerB = getEmployee(elements.settingsWeekendOwnerB.value);
    elements.settingsWeekendNameA.value = ownerA?.firstName || "";
    elements.settingsWeekendNameB.value = ownerB?.firstName || "";
  }

  async function saveWeekendSettings() {
    const ownerA = elements.settingsWeekendOwnerA.value;
    const ownerB = elements.settingsWeekendOwnerB.value;
    if (!ownerA || !ownerB) {
      showToast(
        "Bitte jedem Dienstwochenende eine verantwortliche Person zuweisen.",
        "error",
      );
      (!ownerA
        ? elements.settingsWeekendOwnerA
        : elements.settingsWeekendOwnerB
      ).focus();
      return;
    }
    if (ownerA === ownerB) {
      showToast(
        "Die beiden Dienstwochenenden benötigen unterschiedliche verantwortliche Personen.",
        "error",
      );
      elements.settingsWeekendOwnerB.focus();
      return;
    }
    const ownerEmployeeA = getEmployee(ownerA);
    const ownerEmployeeB = getEmployee(ownerB);
    if (!ownerEmployeeA || !ownerEmployeeB) {
      showToast("Eine ausgewählte Person ist nicht mehr vorhanden.", "error");
      renderWeekendSettings();
      return;
    }
    if (
      !isWeekendLeadership(ownerEmployeeA) ||
      !isWeekendLeadership(ownerEmployeeB)
    ) {
      showToast(
        "Als Verantwortliche können nur Stationsleitungen oder stellvertretende Stationsleitungen ausgewählt werden.",
        "error",
      );
      return;
    }

    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.settings.serviceWeekends = {
        weekend_a: {
          name: ownerEmployeeA.firstName.slice(0, 50),
          ownerId: ownerA,
        },
        weekend_b: {
          name: ownerEmployeeB.firstName.slice(0, 50),
          ownerId: ownerB,
        },
      };
      [
        ["weekend_a", ownerA],
        ["weekend_b", ownerB],
      ].forEach(([weekend, ownerId]) => {
        const owner = state.employees.find(
          (employee) => employee.id === ownerId,
        );
        if (owner && owner.serviceWeekend !== weekend) {
          owner.serviceWeekend = weekend;
          owner.updatedAt = now;
        }
      });
    });
    if (committed) {
      showToast("Dienstwochenenden und Verantwortliche wurden gespeichert.");
    }
  }

  function renderBackendSelection() {
    const selectedBackend = elements.settingsStorageBackend.value;
    const mariaDbSelected = selectedBackend === "mariadb";
    elements.mariaDbSettingsFields.hidden = !mariaDbSelected;
    elements.testBackendConnectionButton.hidden = !mariaDbSelected;
    elements.applyStorageBackendButton.hidden =
      selectedBackend === "local" && !isMariaDbMode();
    elements.applyStorageBackendButton.textContent =
      selectedBackend === "local"
        ? "Lokalen Modus aktivieren"
        : isMariaDbMode()
          ? "MariaDB neu verbinden"
          : "MariaDB aktivieren";
    elements.settingsBackendHint.textContent = mariaDbSelected
      ? "Beim ersten Verbinden wird der aktuelle lokale Datenbestand nach MariaDB übertragen. Enthält der Server bereits Daten, werden diese nach erfolgreicher Anmeldung geladen."
      : isMariaDbMode()
        ? "Beim Wechsel in den lokalen Modus wird der aktuelle Serverdatenbestand als lokale Kopie gespeichert."
        : "Die Daten werden ausschließlich in diesem Browserprofil gespeichert.";
  }

  async function testBackendConnection() {
    if (!requireAdmin()) return;
    const apiUrl = window.TeOBackend.normalizeApiUrl(
      elements.settingsMariaDbApiUrl.value,
    );
    if (!apiUrl) {
      showToast("Bitte die Adresse des TeO-Servers eingeben.", "error");
      elements.settingsMariaDbApiUrl.focus();
      return;
    }

    setBackendButtonsBusy(true);
    try {
      // Ohne angemeldete Sitzung meldet der Server nur seine Erreichbarkeit.
      // Die Datenrevision erscheint deshalb erst, wenn bereits eine Sitzung
      // besteht - der Verbindungstest selbst kommt ohne sie aus.
      const health = await window.TeOBackend.health(
        apiUrl,
        apiUrl === backendConfig.apiUrl ? window.TeOBackend.readToken() : "",
      );
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnected({ health });
      }
      elements.settingsBackendStatus.classList.remove("is-error");
      elements.settingsBackendStatus.innerHTML =
        health.initialized === undefined
          ? "<i></i> Server erreichbar"
          : health.initialized
            ? `<i></i> Server erreichbar · Datenrevision ${health.revision}`
            : "<i></i> Server erreichbar · noch nicht eingerichtet";
      showToast("Verbindung zum TeO-Server wurde erfolgreich geprüft.");
    } catch (error) {
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnectionError(error);
      }
      elements.settingsBackendStatus.classList.add("is-error");
      elements.settingsBackendStatus.innerHTML =
        "<i></i> Server nicht erreichbar";
      showToast(error.message || "Verbindungstest fehlgeschlagen.", "error");
    } finally {
      setBackendButtonsBusy(false);
    }
  }

  async function applyStorageBackend() {
    if (!requireAdmin()) return;
    const selectedBackend = elements.settingsStorageBackend.value;
    if (selectedBackend === "local") {
      if (!isMariaDbMode()) return;
      requestConfirmation({
        title: "In den lokalen Modus wechseln?",
        message:
          "Der aktuelle MariaDB-Datenbestand wird als lokale Kopie in diesem Browser gespeichert. Weitere Änderungen werden anschließend nicht mehr mit dem Server geteilt.",
        acceptLabel: "Lokal weiterarbeiten",
        callback: switchToLocalBackend,
      });
      return;
    }

    const apiUrl = window.TeOBackend.normalizeApiUrl(
      elements.settingsMariaDbApiUrl.value,
    );
    const password = elements.settingsMariaDbPassword.value;
    if (!apiUrl) {
      showToast("Bitte die Adresse des TeO-Servers eingeben.", "error");
      elements.settingsMariaDbApiUrl.focus();
      return;
    }
    if (!password) {
      showToast("Bitte das aktuelle Administratorpasswort eingeben.", "error");
      elements.settingsMariaDbPassword.focus();
      return;
    }

    setBackendButtonsBusy(true);
    try {
      // Ob der Server bereits einen Datenbestand hat, sagt er selbst: Die
      // Anmeldung antwortet auf einer leeren Datenbank mit "not_initialized".
      // Deshalb erst anmelden und nur im Bedarfsfall einrichten - so verlangt
      // der Weg den Einrichtungsschluessel nur dort, wo er wirklich noetig
      // ist, und der Server muss den Einrichtungsstand nicht offenlegen.
      const bootstrapToken = elements.settingsMariaDbBootstrapToken.value.trim();
      let initialized = true;
      let result;
      try {
        result = await window.TeOBackend.login(
          apiUrl,
          currentUser.username,
          password,
        );
      } catch (error) {
        if (error?.code !== "not_initialized") throw error;
        initialized = false;
        result = await window.TeOBackend.bootstrap(
          apiUrl,
          state,
          currentUser.username,
          password,
          bootstrapToken,
        );
      }

      await dataStore.setItem(STORAGE_KEY, state);
      backendConfig = window.TeOBackend.writeConfig({
        mode: "mariadb",
        apiUrl,
      });
      backendMode = "mariadb";
      remoteRevision = Number(result.revision) || 1;
      window.TeOBackend.writeToken(result.token);
      // Revision und Schemastand liefert der Server erst der angemeldeten
      // Sitzung, deshalb erst jetzt abfragen. Bleibt die Auskunft aus, gilt
      // die Verbindung trotzdem als hergestellt.
      const health = await window.TeOBackend
        .health(apiUrl, result.token)
        .catch(() => null);
      markBackendConnected(
        health ? { health, synchronized: true } : { synchronized: true },
      );
      state = normalizeState(result.state);
      databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
      backendStartupError = "";
      const remoteUser = state.users.find(
        (user) => user.id === result.user?.id,
      );
      if (!remoteUser) {
        throw new Error("Das Administratorkonto fehlt im MariaDB-Datenbestand.");
      }
      elements.settingsMariaDbPassword.value = "";
      elements.settingsMariaDbBootstrapToken.value = "";
      // completeLogin setzt das Farbthema des Kontos.
      completeLogin(remoteUser);
      showView("settings", false);
      showToast(
        initialized
          ? "MariaDB wurde verbunden und der Serverdatenbestand geladen."
          : "MariaDB wurde eingerichtet und der lokale Datenbestand übertragen.",
      );
    } catch (error) {
      console.error("MariaDB konnte nicht aktiviert werden.", error);
      showToast(error.message || "MariaDB konnte nicht aktiviert werden.", "error");
    } finally {
      setBackendButtonsBusy(false);
    }
  }

  async function switchToLocalBackend() {
    setBackendButtonsBusy(true);
    try {
      await dataStore.setItem(STORAGE_KEY, state);
      await window.TeOBackend.logout(
        backendConfig.apiUrl,
        window.TeOBackend.readToken(),
      );
      window.TeOBackend.writeToken("");
      window.TeOBackend.writeConfig({ mode: "local", apiUrl: "" });
      sessionStorage.removeItem(SESSION_USER_KEY);
      window.location.reload();
    } catch (error) {
      console.error("Lokaler Modus konnte nicht aktiviert werden.", error);
      showToast(
        "Die lokale Kopie konnte nicht gespeichert werden. Der Backendwechsel wurde abgebrochen.",
        "error",
      );
      setBackendButtonsBusy(false);
    }
  }

  function setBackendButtonsBusy(busy) {
    elements.testBackendConnectionButton.disabled = busy;
    elements.applyStorageBackendButton.disabled = busy;
    elements.settingsStorageBackend.disabled = busy;
  }

  async function saveCloseDialogOnOutsideClick(aktiviert) {
    if (!requireAdmin()) {
      renderSettings();
      return;
    }
    if (aktiviert === state.settings.closeDialogOnOutsideClick) return;

    const committed = await commitStateMutation(() => {
      state.settings.closeDialogOnOutsideClick = aktiviert;
    });
    if (!committed) {
      renderSettings();
      return;
    }
    showToast(
      aktiviert
        ? "Ein Klick neben einen Dialog schließt ihn wieder."
        : "Dialoge bleiben bei einem Klick daneben geöffnet.",
    );
  }

  async function saveGeneralSettings() {
    if (!requireAdmin()) return;

    const previousMaxBackupFileSizeMb = state.settings.maxBackupFileSizeMb;
    const backupReminderDays = Number(
      elements.settingsBackupReminderDays.value,
    );
    const maxBackupFileSizeMb = Number(
      elements.settingsMaxBackupFileSizeMb.value,
    );
    if (
      !Number.isInteger(backupReminderDays) ||
      backupReminderDays < 1 ||
      backupReminderDays > 365
    ) {
      showToast(
        "Bitte für die Sicherungserinnerung einen Wert zwischen 1 und 365 Tagen eingeben.",
        "error",
      );
      elements.settingsBackupReminderDays.focus();
      return;
    }

    if (
      !Number.isInteger(maxBackupFileSizeMb) ||
      maxBackupFileSizeMb < MIN_BACKUP_FILE_SIZE_MB ||
      maxBackupFileSizeMb > MAX_BACKUP_FILE_SIZE_MB
    ) {
      showToast(
        `Bitte für die maximale Sicherungsgröße einen Wert zwischen ${MIN_BACKUP_FILE_SIZE_MB} und ${MAX_BACKUP_FILE_SIZE_MB} MB eingeben.`,
        "error",
      );
      elements.settingsMaxBackupFileSizeMb.focus();
      return;
    }

    if (
      backupReminderDays === state.settings.backupReminderDays &&
      maxBackupFileSizeMb === state.settings.maxBackupFileSizeMb
    ) {
      showToast("Die Einstellungen sind bereits aktuell.");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.backupReminderDays = backupReminderDays;
      state.settings.maxBackupFileSizeMb = maxBackupFileSizeMb;
    });
    if (committed) {
      if (maxBackupFileSizeMb !== previousMaxBackupFileSizeMb) {
        automaticBackupRetryAt = 0;
        scheduleAutomaticBackup();
      }
      showToast("Einstellungen wurden gespeichert.");
    }
  }

  function renderBackupStatus() {
    const lastBackupAt = state.settings.lastBackupAt;
    if (!lastBackupAt) {
      elements.backupStatus.textContent =
        "Noch keine Sicherung dokumentiert – bitte zeitnah exportieren.";
      elements.backupStatus.classList.add("is-warning");
      if (!backupReminderShown) {
        backupReminderShown = true;
        showToast("Es wurde noch keine Datensicherung dokumentiert.", "error");
      }
      return;
    }
    const ageDays = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(lastBackupAt)) / 86400000),
    );
    const overdue = ageDays >= state.settings.backupReminderDays;
    elements.backupStatus.textContent = `Letzte Sicherung: ${formatDateTime(
      lastBackupAt,
    )} (${ageDays === 0 ? "heute" : `vor ${ageDays} Tagen`})${
      overdue ? " – neue Sicherung empfohlen" : ""
    }`;
    elements.backupStatus.classList.toggle("is-warning", overdue);
    if (overdue && !backupReminderShown) {
      backupReminderShown = true;
      showToast(
        `Die letzte Datensicherung liegt ${ageDays} Tage zurück. Bitte eine neue Sicherung exportieren.`,
        "error",
      );
    }
  }

  function renderDatabaseSaveWarning() {
    const visible = Boolean(currentUser && databaseSaveReminderArmed);
    elements.databaseSaveWarning.hidden = !visible;
    if (visible) {
      elements.databaseSaveWarningText.textContent =
        "Änderungen wurden automatisch gespeichert, aber noch nicht als Datensicherung exportiert.";
    }
    // Die Warnung teilt sich die oberste Ebene mit den Meldungen: erscheint sie
    // als einzige, muss das Popover geoeffnet werden, verschwindet sie als
    // letzte, wieder geschlossen.
    if (visible) {
      syncNotificationLayer();
      return;
    }
    if (
      !elements.toastRegion.childElementCount &&
      typeof elements.notificationStack.hidePopover === "function" &&
      elements.notificationStack.matches(":popover-open")
    ) {
      elements.notificationStack.hidePopover();
    }
  }

  async function renderBrowserStorageStatus() {
    if (isMariaDbMode()) {
      elements.browserStorageStatus.textContent =
        `Zentraler Datenspeicher: MariaDB über ${backendConfig.apiUrl} · Revision ${remoteRevision}.`;
      elements.requestPersistentStorageButton.hidden = true;
      return;
    }

    const browserStorage = navigator.storage;
    const persistSupported = typeof browserStorage?.persist === "function";

    if (typeof browserStorage?.estimate !== "function") {
      elements.browserStorageStatus.textContent =
        "Speicherinformationen werden von diesem Browser nicht unterstützt.";
      elements.requestPersistentStorageButton.hidden = true;
      return;
    }

    elements.browserStorageStatus.textContent = "Browserspeicher wird ermittelt …";

    try {
      const [estimate, persistent] = await Promise.all([
        browserStorage.estimate(),
        typeof browserStorage.persisted === "function"
          ? browserStorage.persisted()
          : Promise.resolve(false),
      ]);
      const usage = formatStorageSize(estimate.usage || 0);
      const quota = estimate.quota
        ? `von geschätzt ${formatStorageSize(estimate.quota)}`
        : "bei unbekanntem Kontingent";
      const persistenceLabel = persistent
        ? "dauerhaft geschützt"
        : browserPersistenceNotice || "Best-Effort-Speicher";

      elements.browserStorageStatus.textContent =
        `Browserspeicher: ${usage} ${quota} verwendet · ${persistenceLabel}.`;
      elements.requestPersistentStorageButton.hidden =
        persistent || !persistSupported;
      elements.requestPersistentStorageButton.disabled = false;
    } catch (error) {
      console.warn("Browserspeicher konnte nicht ermittelt werden.", error);
      elements.browserStorageStatus.textContent =
        "Browserspeicher konnte nicht ermittelt werden.";
      elements.requestPersistentStorageButton.hidden = !persistSupported;
      elements.requestPersistentStorageButton.disabled = false;
    }
  }

  async function requestPersistentBrowserStorage() {
    const browserStorage = navigator.storage;
    if (typeof browserStorage?.persist !== "function") {
      showToast(
        "Dauerhafter Browserspeicher wird von diesem Browser nicht unterstützt.",
        "error",
      );
      await renderBrowserStorageStatus();
      return;
    }

    elements.requestPersistentStorageButton.disabled = true;
    try {
      const granted = await browserStorage.persist();
      if (granted) {
        browserPersistenceNotice = "";
        await renderBrowserStorageStatus();
        showToast("Dauerhafter Browserspeicher wurde aktiviert.");
      } else {
        browserPersistenceNotice = persistentStorageDenialExplanation();
        await renderBrowserStorageStatus();
        showToast(browserPersistenceNotice, "warning");
      }
    } catch (error) {
      console.warn(
        "Dauerhafter Browserspeicher konnte nicht angefordert werden.",
        error,
      );
      elements.requestPersistentStorageButton.disabled = false;
      showToast(
        "Dauerhafter Browserspeicher konnte nicht angefordert werden.",
        "error",
      );
      await renderBrowserStorageStatus();
    }
  }

  function persistentStorageDenialExplanation() {
    if (!window.isSecureContext) {
      return "Nicht dauerhaft geschützt: Bitte TeO über HTTPS oder localhost aufrufen.";
    }
    return "Nicht dauerhaft geschützt: Der Browser hat automatisch entschieden und keine Freigabe erteilt.";
  }

  function parseBackup(fileContent) {
    let backup;
    try {
      backup = JSON.parse(fileContent);
    } catch {
      throw new Error("Die ausgewählte Datei enthält kein gültiges JSON.");
    }

    if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
      throw new Error("Die ausgewählte Datei ist keine gültige TeO-Sicherung.");
    }
    if (backup.format !== BACKUP_FORMAT || backup.formatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error("Das Format dieser Sicherungsdatei wird nicht unterstützt.");
    }
    if (Number(backup.appVersion) > STATE_VERSION) {
      throw new Error("Die Sicherung stammt aus einer neueren Anwendungsversion.");
    }

    const importedData = backup.data;
    const collections = [
      "employees",
      "trainings",
      "completions",
      "meetings",
      "meetingAttendances",
    ];
    if (Number(backup.appVersion) >= 15) collections.push("appointments");
    if (Number(backup.appVersion) >= 17) {
      collections.push("devices", "deviceInstructions");
    }
    if (Number(backup.appVersion) >= 25) collections.push("memos");
    const vacationCollections = ["vacationEntitlements", "vacationDays"];
    if (
      !importedData ||
      typeof importedData !== "object" ||
      collections.some((collection) => !Array.isArray(importedData[collection])) ||
      (Number(backup.appVersion) >= 5 && !Array.isArray(importedData.users)) ||
      (Number(backup.appVersion) >= 6 &&
        (!importedData.catalogs ||
          !Array.isArray(importedData.catalogs.professions) ||
          !Array.isArray(importedData.catalogs.qualifications))) ||
      (Number(backup.appVersion) >= 25 &&
        !Array.isArray(importedData.catalogs?.memoCategories)) ||
      (Number(backup.appVersion) >= 7 && !Array.isArray(importedData.auditLog)) ||
      (Number(backup.appVersion) >= 9 &&
        vacationCollections.some(
          (collection) => !Array.isArray(importedData[collection]),
        )) ||
      (Number(backup.appVersion) >= 10 &&
        importedData.vacationDays.some(
          (entry) => !Object.hasOwn(PLANNER_ENTRY_TYPES, entry?.type),
        ))
    ) {
      throw new Error("Die Sicherungsdatei ist unvollständig oder beschädigt.");
    }

    const normalizedState = normalizeState(importedData);
    if (
      collections.some(
        (collection) => normalizedState[collection].length !== importedData[collection].length,
      ) ||
      (Array.isArray(importedData.users) &&
        normalizedState.users.length !== importedData.users.length) ||
      (Number(backup.appVersion) >= 6 &&
        (normalizedState.catalogs.professions.length !==
          importedData.catalogs.professions.length ||
          normalizedState.catalogs.qualifications.length !==
            importedData.catalogs.qualifications.length)) ||
      (Number(backup.appVersion) >= 25 &&
        normalizedState.catalogs.memoCategories.length !==
          importedData.catalogs.memoCategories.length) ||
      (Number(backup.appVersion) >= 7 &&
        normalizedState.auditLog.length !==
          Math.min(importedData.auditLog.length, MAX_AUDIT_LOG_ENTRIES)) ||
      (Number(backup.appVersion) >= 9 &&
        vacationCollections.some(
          (collection) =>
            normalizedState[collection].length !== importedData[collection].length,
        ))
    ) {
      throw new Error("Die Sicherungsdatei enthält beschädigte oder unvollständige Datensätze.");
    }

    const validation = window.TeOStateSchema?.validateStateShape(normalizedState, {
      maxBytes: configuredBackupMaxBytes(),
      requireAdmin: normalizedState.users.length > 0,
      maxAuditEntries: MAX_AUDIT_LOG_ENTRIES,
    });
    if (!validation?.valid) {
      throw new Error(
        `Die Sicherungsdatei ist ungültig: ${
          validation?.issues?.[0] || "Datenprüfung nicht verfügbar."
        }`,
      );
    }

    return normalizedState;
  }

  async function importDatabase(importedState) {
    const previousState = state;
    // Benutzerkonten sind bewusst nicht Teil des Imports: Der Import ersetzt den
    // fachlichen Datenbestand, die Anmeldung bleibt davon unberührt. Nur auf einem
    // System ohne jedes Konto werden die Konten aus der Sicherung übernommen,
    // damit eine Wiederherstellung von Grund auf möglich bleibt.
    const preservedUsers = Array.isArray(previousState?.users)
      ? previousState.users
      : [];
    const usersFromBackup = preservedUsers.length === 0;
    if (!usersFromBackup) {
      importedState.users = preservedUsers;
    }
    state = importedState;
    if (!(await persistState())) {
      state = previousState;
      renderAll();
      return false;
    }
    stateMutationSequence += 1;
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);

    resetListFilters();
    selectedCompletionEmployeeIds.clear();
    selectedEmployeeIds.clear();
    attendanceDraft.clear();
    currentUser = state.users.find((user) => user.id === currentUser?.id) || null;
    if (!currentUser) {
      showLoginDialog();
      return false;
    }
    // Nach dem Auffrischen des Kontos, damit das Farbthema aus der Sicherung
    // greift.
    applyTheme(activeThemeKey());
    renderAll();
    showToast(
      usersFromBackup
        ? "Die Datensicherung wurde einschließlich der Benutzerkonten importiert."
        : "Die Datensicherung wurde importiert. Die Benutzerkonten sind unverändert.",
    );
    return true;
  }

  function getTrainingStats(training) {
    const activeEmployees = activeEmployeeList();
    const current = activeEmployees.filter((employee) =>
      isEmployeeCurrentForTraining(employee.id, training),
    ).length;
    const total = activeEmployees.length;
    return {
      current,
      open: Math.max(0, total - current),
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function getEmployeeTrainingStats(employeeId) {
    const obligations = trainingObligations();
    const total = obligations.length;
    const current = obligations.filter((training) =>
      isEmployeeCurrentForTraining(employeeId, training),
    ).length;
    return {
      current,
      total,
      percent: total ? Math.round((current / total) * 100) : 0,
    };
  }

  function isEmployeeCurrentForTraining(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return false;
    if (!training.recurrenceMonths) return true;
    return addMonths(latest.completedOn, training.recurrenceMonths) >= todayIso();
  }

  function getEmployeeCompletionStatus(employeeId, training) {
    const latest = latestCompletion(employeeId, training.id);
    if (!latest) return { kind: "open", label: "Offen" };

    if (!training.recurrenceMonths) {
      return {
        kind: "current",
        label: `absolviert am ${formatDate(latest.completedOn)}`,
      };
    }

    const validUntil = addMonths(latest.completedOn, training.recurrenceMonths);
    if (validUntil >= todayIso()) {
      return {
        kind: "current",
        label: `gültig bis ${formatDate(validUntil)}`,
      };
    }

    return {
      kind: "expired",
      label: `abgelaufen am ${formatDate(validUntil)}`,
    };
  }

  function latestCompletion(employeeId, trainingId) {
    const training = getTraining(trainingId);
    return training
      ? latestCompletionForTraining(employeeId, training)
      : completionsFor(employeeId, `training:${trainingId}`)[0];
  }

  function latestCompletionForTraining(employeeId, training, completedOnOrBefore = "") {
    const completions = completionsFor(employeeId, completionMatchKey(training));
    return completedOnOrBefore
      ? completions.find(
          (completion) => completion.completedOn <= completedOnOrBefore,
        )
      : completions[0];
  }

  // Eine wiederkehrende Fortbildung zaehlt jeden Nachweis ihrer Reihe, eine
  // einmalige nur die eigenen. Beides laesst sich als Schluessel schreiben -
  // damit findet der Index in einem Griff, was completionMatchesTraining
  // sonst fuer jeden Nachweis einzeln entscheidet.
  function completionMatchKey(training) {
    return training.recurrenceMonths && training.seriesId
      ? `series:${training.seriesId}`
      : `training:${training.id}`;
  }

  function completionsFor(employeeId, matchKey) {
    return completionIndex().get(`${employeeId}|${matchKey}`) || [];
  }

  // Die Matrix fragt fuer jede Zelle nach dem letzten Nachweis. Ohne Index
  // durchsucht jede dieser Fragen den gesamten Bestand; bei 70 Mitarbeitern,
  // 14 Fortbildungen und einem mehrjaehrigen Archiv sind das Millionen von
  // Vergleichen je Aufbau. Der Index entsteht in einem Durchgang und haelt,
  // solange Nachweise und Fortbildungen dieselben Sammlungen bleiben - genau
  // wie bei indexById, denn beide werden bei jeder Aenderung neu aufgebaut.
  const completionIndexCache = {
    completions: null,
    completionCount: -1,
    trainings: null,
    trainingCount: -1,
    index: new Map(),
  };

  function completionIndex() {
    const cache = completionIndexCache;
    if (
      cache.completions === state.completions &&
      cache.completionCount === state.completions.length &&
      cache.trainings === state.trainings &&
      cache.trainingCount === state.trainings.length
    ) {
      return cache.index;
    }

    const index = new Map();
    const add = (key, completion) => {
      const bucket = index.get(key);
      if (bucket) bucket.push(completion);
      else index.set(key, [completion]);
    };
    for (const completion of state.completions) {
      add(`${completion.employeeId}|training:${completion.trainingId}`, completion);
      const completedTraining = getTraining(completion.trainingId);
      if (completedTraining?.recurrenceMonths && completedTraining.seriesId) {
        add(
          `${completion.employeeId}|series:${completedTraining.seriesId}`,
          completion,
        );
      }
    }
    for (const bucket of index.values()) bucket.sort(sortCompletionsDescending);

    cache.completions = state.completions;
    cache.completionCount = state.completions.length;
    cache.trainings = state.trainings;
    cache.trainingCount = state.trainings.length;
    cache.index = index;
    return index;
  }

  function sortCompletionsDescending(a, b) {
    return (
      b.completedOn.localeCompare(a.completedOn) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }

  function completionMatchesTraining(completion, training) {
    if (!completion || !training) return false;
    if (!training.recurrenceMonths || !training.seriesId) {
      return completion.trainingId === training.id;
    }
    const completedTraining = getTraining(completion.trainingId);
    return (
      completedTraining?.recurrenceMonths &&
      completedTraining.seriesId === training.seriesId
    );
  }

  function trainingObligations() {
    const obligations = new Map();
    state.trainings.forEach((training) => {
      const key =
        training.recurrenceMonths && training.seriesId
          ? `series:${training.seriesId}`
          : `training:${training.id}`;
      const existing = obligations.get(key);
      if (
        !existing ||
        training.year < existing.year ||
        (training.year === existing.year &&
          training.updatedAt.localeCompare(existing.updatedAt) > 0)
      ) {
        obligations.set(key, training);
      }
    });
    return [...obligations.values()];
  }

  function getMeetingStats(meeting) {
    const records = [
      ...new Map(
        state.meetingAttendances
          .filter((attendance) => attendance.meetingId === meeting.id)
          .map((attendance) => [attendance.employeeId, attendance]),
      ).values(),
    ];
    const expectedEmployeeIds = new Set(meeting.expectedEmployeeIds);
    records.forEach((record) => expectedEmployeeIds.add(record.employeeId));
    const validExpectedIds = [...expectedEmployeeIds].filter((employeeId) =>
      getEmployee(employeeId),
    );
    const documentedEmployeeIds = new Set(records.map((record) => record.employeeId));
    const documented = validExpectedIds.filter((employeeId) =>
      documentedEmployeeIds.has(employeeId),
    ).length;
    const total = validExpectedIds.length;
    const notApplicable = records.filter(
      (record) => record.status === "nicht_zutreffend",
    ).length;

    return {
      total,
      documented,
      open: Math.max(0, total - documented),
      notApplicable,
      applicableTotal: Math.max(0, total - notApplicable),
      applicableDocumented: Math.max(0, documented - notApplicable),
      participated: records.filter((record) => record.status === "teilgenommen").length,
      percent: total ? Math.round((documented / total) * 100) : 0,
    };
  }

  function getAnnualMeetingStatistics(year) {
    const meetings = state.meetings
      .filter((meeting) => Number(meeting.date.slice(0, 4)) === year)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const statusCounts = Object.fromEntries(
      Object.keys(ATTENDANCE_STATUSES).map((status) => [status, 0]),
    );
    let totalSlots = 0;
    let documented = 0;
    let open = 0;

    const meetingRows = meetings.map((meeting) => {
      const records = [
        ...new Map(
          state.meetingAttendances
            .filter((attendance) => attendance.meetingId === meeting.id)
            .map((attendance) => [attendance.employeeId, attendance]),
        ).values(),
      ];
      records.forEach((record) => {
        statusCounts[record.status] += 1;
      });
      const stats = getMeetingStats(meeting);
      const applicableRecords = records.filter(
        (record) => record.status !== "nicht_zutreffend",
      );
      const participated = applicableRecords.filter(
        (record) => record.status === "teilgenommen",
      ).length;
      const absent = Math.max(0, stats.applicableDocumented - participated);

      totalSlots += stats.applicableTotal;
      documented += stats.applicableDocumented;
      open += stats.open;

      return {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        participated,
        absent,
        open: stats.open,
      };
    });

    const participated = statusCounts.teilgenommen;
    const absent = Math.max(0, documented - participated);
    const meetingCount = meetings.length;
    const employeeRows = state.employees
      .map((employee) => {
        const expectedMeetingIds = meetings
          .filter((meeting) => meeting.expectedEmployeeIds.includes(employee.id))
          .map((meeting) => meeting.id);
        const records = state.meetingAttendances.filter(
          (attendance) =>
            attendance.employeeId === employee.id &&
            expectedMeetingIds.includes(attendance.meetingId),
        );
        const employeeStatusCounts = Object.fromEntries(
          Object.keys(ATTENDANCE_STATUSES).map((status) => [
            status,
            records.filter((record) => record.status === status).length,
          ]),
        );
        const applicableRecords = records.filter(
          (record) => record.status !== "nicht_zutreffend",
        );
        const applicableExpected = Math.max(
          0,
          expectedMeetingIds.length - employeeStatusCounts.nicht_zutreffend,
        );
        return {
          employeeId: employee.id,
          name: fullName(employee),
          expected: applicableExpected,
          documented: applicableRecords.length,
          open: Math.max(0, applicableExpected - applicableRecords.length),
          statusCounts: employeeStatusCounts,
          attendanceRate: percentage(
            employeeStatusCounts.teilgenommen,
            applicableExpected,
          ),
        };
      })
      .filter((employee) => employee.expected > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

    return {
      year,
      meetingCount,
      meetings: meetingRows,
      statusCounts,
      totalSlots,
      documented,
      open,
      participated,
      absent,
      averageParticipated: meetingCount ? participated / meetingCount : 0,
      averageAbsent: meetingCount ? absent / meetingCount : 0,
      attendanceRate: percentage(participated, documented),
      documentationRate: percentage(documented, totalSlots),
      employeeRows,
    };
  }

  function percentage(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  // Das Anlegen eines Intl-Formatierers ist deutlich teurer als seine
  // Anwendung. In den Matrizen entstehen sonst tausende gleichartige
  // Formatierer je Aufbau, deshalb werden sie nach ihren Einstellungen abgelegt
  // und wiederverwendet.
  const numberFormats = new Map();
  const dateFormats = new Map();

  function numberFormat(options) {
    const key = JSON.stringify(options);
    let format = numberFormats.get(key);
    if (!format) {
      format = new Intl.NumberFormat("de-DE", options);
      numberFormats.set(key, format);
    }
    return format;
  }

  function dateFormat(options) {
    const key = JSON.stringify(options);
    let format = dateFormats.get(key);
    if (!format) {
      format = new Intl.DateTimeFormat("de-DE", options);
      dateFormats.set(key, format);
    }
    return format;
  }

  function formatDecimal(value) {
    return numberFormat({
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  function activeEmployeeList() {
    return state.employees.filter((employee) => employee.active);
  }

  function qualificationLabel(id) {
    return (
      state.catalogs.qualifications.find((qualification) => qualification.id === id)?.label ||
      DEFAULT_QUALIFICATIONS[id] ||
      id
    );
  }

  function serviceWeekendLabel(value) {
    if (value === "none") return SERVICE_WEEKENDS.none;
    return (
      state.settings?.serviceWeekends?.[value]?.name ||
      SERVICE_WEEKENDS[value] ||
      SERVICE_WEEKENDS.none
    );
  }

  // Die Tagesgrenze der Urlaubsplanung beschreibt den Pflegepool, der sich
  // gegenseitig vertritt. Medizinische Fachangestellte, Pflegefachassistenz
  // und Stationsassistenz gehoeren nicht dazu; ihre Abwesenheiten bleiben
  // sichtbar, belegen aber keinen der gleichzeitig moeglichen Urlaube.
  function countsTowardsAbsenceLimit(employee) {
    return !isAbsenceLimitExemptProfession(employee?.profession);
  }

  function isAbsenceLimitExemptProfession(profession) {
    const signature = professionSignature(profession);
    if (!signature) return false;
    return ABSENCE_LIMIT_EXEMPT_PROFESSION_PATTERNS.some((pattern) =>
      signature.includes(pattern),
    );
  }

  // Die Normalisierung laeuft je Urlaubseintrag, obwohl es nur eine Handvoll
  // Berufsbezeichnungen gibt. Da die Umwandlung allein vom Text abhaengt, ist
  // ihr Ergebnis dauerhaft ablegbar.
  const professionSignatures = new Map();

  function professionSignature(value) {
    const text = String(value || "");
    let signature = professionSignatures.get(text);
    if (signature === undefined) {
      signature = text
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("de-DE")
        .replace(/[^a-z]/g, "");
      professionSignatures.set(text, signature);
    }
    return signature;
  }

  function serviceWeekendOwnerKey(employeeId) {
    if (!employeeId) return "";
    return (
      SERVICE_WEEKEND_KEYS.find(
        (weekend) =>
          state.settings?.serviceWeekends?.[weekend]?.ownerId === employeeId,
      ) || ""
    );
  }

  function isWeekendLeadership(employee) {
    return Boolean(
      employee &&
        LEADERSHIP_QUALIFICATION_IDS.some(
          (qualificationId) => employee.qualifications?.[qualificationId],
        ),
    );
  }

  function serviceWeekendOptionsMarkup({
    includeUnchanged = false,
    includeNone = true,
  } = {}) {
    return [
      includeUnchanged ? '<option value="">Nicht ändern</option>' : "",
      includeNone
        ? `<option value="none">${escapeHtml(SERVICE_WEEKENDS.none)}</option>`
        : "",
      ...SERVICE_WEEKEND_KEYS.map(
        (weekend) =>
          `<option value="${weekend}">${escapeHtml(
            serviceWeekendLabel(weekend),
          )}</option>`,
      ),
    ].join("");
  }

  function handleBeforeUnload(event) {
    if (!databaseSaveReminderArmed) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function shouldRemindBeforeUnload(candidateState = state) {
    if (!candidateState || typeof candidateState !== "object") return false;
    const collections = TRACKED_COLLECTION_KEYS;
    const containsData = collections.some(
      (collection) => candidateState[collection]?.length,
    );
    if (!containsData) return false;

    const lastBackupTimestamp = Date.parse(
      candidateState.settings?.lastBackupAt || "",
    );
    if (!Number.isFinite(lastBackupTimestamp)) return true;

    const hasLaterAuditChange = (candidateState.auditLog || []).some(
      (entry) =>
        Date.parse(entry?.timestamp || "") > lastBackupTimestamp &&
        !/Datensicherung exportiert/i.test(String(entry?.action || "")),
    );
    if (hasLaterAuditChange) return true;

    return collections
      .filter(
        (collection) => !COLLECTIONS_WITHOUT_TIMESTAMPS.includes(collection),
      )
      .some((collection) =>
        (candidateState[collection] || []).some((entry) =>
          ["updatedAt", "createdAt"].some(
            (property) =>
              Date.parse(entry?.[property] || "") > lastBackupTimestamp,
          ),
        ),
      );
  }

  // Nach einem Import beschreiben die zuvor gesetzten Filter einen anderen
  // Datenbestand: Eine Namenssuche, eine Kategorie oder ein Bestandsfilter
  // laesst Listen dann leer wirken, obwohl die Daten vollstaendig vorliegen.
  // Deshalb gehen alle Listenfilter gemeinsam auf ihre Voreinstellung zurueck.
  // Sortierungen bleiben bewusst erhalten, sie verbergen keine Datensaetze.
  //
  // tools/check.mjs prueft, dass jede Filter- und Suchvariable hier vorkommt,
  // damit ein spaeter ergaenzter Filter nicht vergessen wird.
  function resetListFilters() {
    workQueueFilter = "all";
    employeeStatusFilter = "all";
    employeeSearchTerm = "";
    employeeProfessionFilter = "all";
    employeeQualificationFilter = "all";
    employeeWeekendFilter = "all";
    elements.employeeSearch.value = "";
    elements.employeeProfessionFilter.value = employeeProfessionFilter;
    elements.employeeQualificationFilter.value = employeeQualificationFilter;
    elements.employeeWeekendFilter.value = employeeWeekendFilter;

    appointmentPeriodFilter = "all";
    appointmentSearchTerm = "";
    elements.appointmentSearch.value = "";

    memoSearchTerm = "";
    memoCategoryFilter = "all";
    memoStatusFilter = "open";
    elements.memoSearch.value = "";
    elements.memoCategoryFilter.value = memoCategoryFilter;

    completionSearchTerm = "";
    elements.completionEmployeeSearch.value = "";

    attendanceSearchTerm = "";
    attendanceStatusFilter = "all";
    elements.attendanceSearch.value = "";
    elements.attendanceFilter.value = attendanceStatusFilter;

    vacationEmployeeSearchTerm = "";
    elements.vacationEmployeeSearch.value = "";

    deviceInventoryFilter = "current";
    deviceAnnexFilter = "all";
    deviceCategoryFilter = "all";
    deviceSearchTerm = "";
    elements.deviceInventoryFilter.value = deviceInventoryFilter;
    elements.deviceAnnexFilter.value = deviceAnnexFilter;
    elements.deviceCategoryFilter.value = deviceCategoryFilter;
    elements.deviceSearch.value = "";

    deviceManagementSearchTerm = "";
    deviceManagementInventoryFilter = "current";
    deviceManagementAnnexFilter = "all";
    deviceManagementCategoryFilter = "all";
    deviceManagementAuthorizationFilter = "all";
    elements.deviceManagementSearch.value = "";
    elements.deviceManagementInventoryFilter.value = deviceManagementInventoryFilter;
    elements.deviceManagementAnnexFilter.value = deviceManagementAnnexFilter;
    elements.deviceManagementCategoryFilter.value = deviceManagementCategoryFilter;
    elements.deviceManagementAuthorizationFilter.value =
      deviceManagementAuthorizationFilter;

    deviceEmployeeStatusFilter = "employed";
    deviceEmployeeSearchTerm = "";
    elements.deviceEmployeeStatusFilter.value = deviceEmployeeStatusFilter;
    elements.deviceEmployeeSearch.value = "";

    deviceOverviewInstructionFilter = "all";
    deviceOverviewEmploymentFilter = "employed";
    deviceOverviewSearchTerm = "";
    elements.deviceOverviewInstructionFilter.value = deviceOverviewInstructionFilter;
    elements.deviceOverviewEmploymentFilter.value = deviceOverviewEmploymentFilter;
    elements.deviceOverviewSearch.value = "";

    deviceParticipantSearchTerm = "";
    deviceInstructionSearchTerm = "";
    deviceInstructionLogLimit = DEVICE_INSTRUCTION_LOG_PAGE;
    deviceInstructionDeviceSearchTerm = "";
    elements.deviceParticipantSearch.value = "";
    elements.deviceInstructionSearch.value = "";
    elements.deviceInstructionDeviceSearch.value = "";
  }

  function employeeStatusLabel(employee) {
    return EMPLOYMENT_STATUSES[employee?.employmentStatus] || EMPLOYMENT_STATUSES.active;
  }

  function employmentStatusOrder(status) {
    return { active: 0, onboarding: 1, inactive: 2 }[status] ?? 3;
  }

  function getFilteredEmployeeEmailAddresses() {
    const seenAddresses = new Set();

    return filteredEmployeesForTable()
      .map((employee) => employee.email.trim())
      .filter((email) => {
        if (!email) return false;
        const normalizedEmail = email.toLocaleLowerCase("de-DE");
        if (seenAddresses.has(normalizedEmail)) return false;
        seenAddresses.add(normalizedEmail);
        return true;
      });
  }

  function getFilteredEmployeeUsernames() {
    const seenUsernames = new Set();

    return filteredEmployeesForTable()
      .map((employee) => employee.username.trim())
      .filter((username) => {
        if (!username) return false;
        const normalizedUsername = username.toLocaleLowerCase("de-DE");
        if (seenUsernames.has(normalizedUsername)) return false;
        seenUsernames.add(normalizedUsername);
        return true;
      });
  }

  function updateEmailExportButton() {
    const emailCount = getFilteredEmployeeEmailAddresses().length;
    elements.copyActiveEmailsLabel.textContent = emailCount
      ? `E-Mails kopieren (${emailCount})`
      : "E-Mails kopieren";
    elements.copyActiveEmailsButton.setAttribute(
      "aria-label",
      emailCount
        ? `${emailCount} E-Mail-Adressen der aktuell gefilterten Mitarbeiter kopieren`
        : "E-Mail-Adressen der aktuell gefilterten Mitarbeiter kopieren",
    );
  }

  function updateUsernameExportButton() {
    const usernameCount = getFilteredEmployeeUsernames().length;
    elements.copyUsernamesLabel.textContent = usernameCount
      ? `Benutzernamen kopieren (${usernameCount})`
      : "Benutzernamen kopieren";
    elements.copyUsernamesButton.setAttribute(
      "aria-label",
      usernameCount
        ? `${usernameCount} Benutzernamen der aktuell gefilterten Mitarbeiter kopieren`
        : "Benutzernamen der aktuell gefilterten Mitarbeiter kopieren",
    );
  }

  // Die Telefonliste haengt bewusst nicht an den Tabellenfiltern: Sie wird
  // ausgehaengt und soll jede Person enthalten, die im Dienst erreichbar ist.
  // Das sind alle aktiven und alle in Einarbeitung befindlichen Mitarbeiter.
  const PHONE_LIST_EMPLOYMENT_STATUSES = ["active", "onboarding"];

  function employeesForPhoneList() {
    return state.employees.filter((employee) =>
      PHONE_LIST_EMPLOYMENT_STATUSES.includes(employee.employmentStatus),
    );
  }

  function getFilteredEmployeePhoneListRows() {
    return employeesForPhoneList()
      .sort(sortEmployees)
      .map((employee) => [fullName(employee), employee.phone]);
  }

  function updatePhoneListExportButton() {
    const employeeCount = getFilteredEmployeePhoneListRows().length;
    elements.exportEmployeePhoneListLabel.textContent = employeeCount
      ? `Telefonliste drucken (${employeeCount})`
      : "Telefonliste drucken";
    elements.exportEmployeePhoneListButton.setAttribute(
      "aria-label",
      employeeCount
        ? `Telefonliste für ${employeeCount} aktive und einzuarbeitende Mitarbeiter drucken`
        : "Telefonliste der aktiven und einzuarbeitenden Mitarbeiter drucken",
    );
  }

  function splitPhoneListIntoColumns(rows) {
    const columnCount = rows.length > 72 ? 3 : rows.length > 28 ? 2 : 1;
    const rowsPerColumn = Math.ceil(rows.length / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
      rows.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn),
    ).filter((column) => column.length > 0);
  }

  function buildEmployeePhoneListPrintHtml(rows) {
    const columns = splitPhoneListIntoColumns(rows);
    const maximumRows = Math.max(...columns.map((column) => column.length));
    const fontSize = maximumRows > 32 ? "9pt" : maximumRows > 28 ? "10pt" : "10.5pt";
    const cellPadding =
      maximumRows > 32
        ? "1.1mm"
        : maximumRows > 30
          ? "1.65mm"
          : maximumRows > 28
            ? "2mm"
            : "2.5mm";
    const tables = columns
      .map(
        (column) => `
          <table>
            <thead><tr><th>Name</th><th>Nummer</th></tr></thead>
            <tbody>
              ${column
                .map(
                  ([name, phone]) => `
                    <tr>
                      <td>${escapeHtml(name)}</td>
                      <td>${escapeHtml(phone || "")}</td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>`,
      )
      .join("");
    return `
      <article
        class="phone-list-document"
        ${dynamicStyle({ "--phone-columns": columns.length, "--phone-font-size": fontSize, "--phone-cell-padding": cellPadding })}
      >
        <header class="phone-list-document-header">
          <h1>Telefonliste</h1>
          <span>${rows.length} Mitarbeiter · Stand ${formatDate(todayIso())}</span>
        </header>
        <div class="phone-list-document-grid">${tables}</div>
      </article>`;
  }

  function exportEmployeePhoneList() {
    const rows = getFilteredEmployeePhoneListRows();
    if (rows.length === 0) {
      showToast(
        "Es sind keine aktiven oder einzuarbeitenden Mitarbeiter erfasst.",
        "error",
      );
      return;
    }
    const previewMarkup = buildEmployeePhoneListPrintHtml(rows);
    elements.phoneListPreviewContent.innerHTML = previewMarkup;
    elements.phoneListPrintSurface.innerHTML = previewMarkup;
    elements.phoneListPreviewSubtitle.textContent =
      `${rows.length} aktive und einzuarbeitende Mitarbeiter · DIN A4 Hochformat`;
    elements.phoneListPreviewDialog.showModal();
  }

  function printEmployeePhoneList() {
    if (!elements.phoneListPreviewDialog.open) return;
    document.body.classList.add("print-phone-list");
    window.print();
    window.setTimeout(
      () => document.body.classList.remove("print-phone-list"),
      0,
    );
  }

  async function copyListToClipboard(values, { successMessage, errorLogLabel }) {
    const exportText = values.join(";");
    const message = successMessage(values.length);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextWithFallback(exportText);
      }
      showToast(message);
    } catch (error) {
      try {
        copyTextWithFallback(exportText);
        showToast(message);
      } catch (fallbackError) {
        console.error(errorLogLabel, error, fallbackError);
        showToast(
          "Die Zwischenablage ist nicht verfügbar. Bitte prüfen Sie die Browserberechtigung.",
          "error",
        );
      }
    }
  }

  async function copyActiveEmployeeEmails() {
    const emailAddresses = getFilteredEmployeeEmailAddresses();
    if (emailAddresses.length === 0) {
      showToast(
        "Für die aktuell gefilterten Mitarbeiter sind keine E-Mail-Adressen hinterlegt.",
        "error",
      );
      return;
    }

    await copyListToClipboard(emailAddresses, {
      successMessage: (count) =>
        `${count} E-Mail-Adresse${
          count === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      errorLogLabel: "E-Mail-Adressen konnten nicht kopiert werden.",
    });
  }

  async function copyFilteredEmployeeUsernames() {
    const usernames = getFilteredEmployeeUsernames();
    if (usernames.length === 0) {
      showToast(
        "Für die aktuell gefilterten Mitarbeiter sind keine Benutzernamen hinterlegt.",
        "error",
      );
      return;
    }

    await copyListToClipboard(usernames, {
      successMessage: (count) =>
        `${count} Benutzername${
          count === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      errorLogLabel: "Benutzernamen konnten nicht kopiert werden.",
    });
  }

  function copyTextWithFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.setAttribute("aria-hidden", "true");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    let copied;
    try {
      copied = document.execCommand("copy");
    } finally {
      textArea.remove();
    }
    if (!copied) throw new Error("Fallback-Kopiervorgang wurde vom Browser abgelehnt.");
  }

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
    return `${employee.firstName} ${employee.lastName}`.trim();
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

  function downloadCsv(filename, headers, rows) {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const content = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\r\n");
    downloadTextFile(filename, content, "text/csv;charset=utf-8");
    showToast("CSV-Datei wurde exportiert.");
  }

  // Dynamische CSS-Werte - Fortschrittsbalken, Diagrammsegmente,
  // Spaltenzahlen - kommen aus dem Datenbestand und koennen deshalb nicht im
  // Stylesheet stehen. Statt sie als style-Attribut auszugeben (was
  // style-src-attr 'unsafe-inline' in der CSP erzwingt), wandern sie als
  // data-teo-style in das Markup und werden nach dem Einfuegen per
  // setProperty gesetzt.
  //
  // Erlaubt sind ausschliesslich Custom Properties (--name). Damit kann ueber
  // diesen Weg keine beliebige CSS-Deklaration in die Seite gelangen.
  function dynamicStyle(properties) {
    const declarations = Object.entries(properties)
      .filter(([name, value]) => /^--[a-z0-9-]+$/i.test(name) && value !== "")
      .map(([name, value]) => `${name}:${String(value).replaceAll(";", "")}`)
      .join(";");
    return declarations ? ` data-teo-style="${escapeHtml(declarations)}"` : "";
  }

  function applyDynamicStyles(root) {
    if (!root?.querySelectorAll) return;
    const targets =
      root.matches?.("[data-teo-style]") === true
        ? [root, ...root.querySelectorAll("[data-teo-style]")]
        : [...root.querySelectorAll("[data-teo-style]")];
    targets.forEach((element) => {
      element.dataset.teoStyle.split(";").forEach((declaration) => {
        const separator = declaration.indexOf(":");
        if (separator < 1) return;
        const name = declaration.slice(0, separator).trim();
        if (!/^--[a-z0-9-]+$/i.test(name)) return;
        element.style.setProperty(name, declaration.slice(separator + 1).trim());
      });
      delete element.dataset.teoStyle;
    });
  }

  // Ein einzelner Beobachter statt eines Aufrufs hinter jeder der ueber
  // hundert innerHTML-Zuweisungen: So greift der Mechanismus auch in
  // Renderpfaden, die spaeter dazukommen. Der Rueckruf laeuft als Microtask
  // noch vor dem Zeichnen, die Werte sind also nie kurzzeitig ungesetzt.
  function observeDynamicStyles() {
    applyDynamicStyles(document.body);
    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) applyDynamicStyles(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Jede Suche in TeO vergleicht ueber diesen Schluessel. Er macht sie
  // nachsichtig: Gross- und Kleinschreibung, Akzente und Umlaute spielen keine
  // Rolle, "ae", "oe" und "ue" gelten wie ä, ö und ü, und ß, s und ss sind
  // untereinander austauschbar - "Strasse", "Strase" und "Straße" finden
  // einander. Der Preis ist bekannt: "Klasse" findet auch "Klase". Ein
  // Suchfeld darf grosszuegig sein, ein Vergleich von Benutzernamen nicht -
  // dort bleibt es beim genauen Vergleich.
  function searchKey(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/ß/g, "ss")
      .replace(/ae/g, "a")
      .replace(/oe/g, "o")
      .replace(/ue/g, "u")
      .replace(/ss/g, "s")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hasVisibleNotification() {
    return Boolean(
      elements.toastRegion.childElementCount ||
        !elements.databaseSaveWarning.hidden,
    );
  }

  function syncNotificationLayer() {
    const stack = elements.notificationStack;
    const popoverOpen =
      typeof stack.hidePopover === "function" && stack.matches(":popover-open");

    // Ein bereits geoeffnetes Popover kann in der Top-Layer-Reihenfolge hinter
    // einem spaeter geoeffneten Dialog liegen. Vor jeder Meldung kurz schliessen
    // und neu oeffnen, damit die Ebene ueber Dialog und Backdrop einsortiert wird.
    if (popoverOpen) stack.hidePopover();
    if (stack.parentElement !== document.body) {
      document.body.append(stack);
    }
    if (
      hasVisibleNotification() &&
      typeof stack.showPopover === "function" &&
      !stack.matches(":popover-open")
    ) {
      try {
        stack.showPopover();
      } catch (error) {
        console.warn("Die Statusmeldung konnte nicht in die oberste Ebene gehoben werden.", error);
      }
    }
  }

  // action haengt einen Knopf an die Meldung („Rückgängig“). Eine Meldung mit
  // Knopf bleibt laenger stehen - sie will nicht nur gelesen, sondern noch
  // getroffen werden - und verschwindet, sobald der Knopf gedrueckt wurde.
  function showToast(message, type = "success", { action = null } = {}) {
    const toast = document.createElement("div");
    // Die Art steht als Klasse am Element; die Farben dazu kommen aus den
    // Farbmarken, damit jedes Farbschema eigene setzen kann.
    toast.className = `toast is-${type === "error" || type === "warning" ? type : "success"}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">
        <svg><use href="#icon-${type === "success" ? "check" : "alert"}"></use></svg>
      </span>
      <span class="toast-text"></span>
    `;
    toast.querySelector(".toast-text").textContent = message;

    if (action) {
      const button = document.createElement("button");
      button.className = "toast-action";
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        toast.remove();
        syncNotificationLayer();
        action.onSelect();
      });
      toast.append(button);
    }

    elements.toastRegion.append(toast);
    syncNotificationLayer();
    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => {
        toast.remove();
        if (
          !hasVisibleNotification() &&
          typeof elements.notificationStack.hidePopover === "function" &&
          elements.notificationStack.matches(":popover-open")
        ) {
          elements.notificationStack.hidePopover();
        }
      }, 190);
    }, action ? 9000 : 3400);
  }

  // Meldet eine Aenderung und bietet im selben Atemzug an, sie zurueckzunehmen.
  function showUndoToast(message) {
    showToast(message, "success", {
      action: {
        label: "Rückgängig",
        onSelect: () => {
          void undoLastMutation();
        },
      },
    });
  }
})();
