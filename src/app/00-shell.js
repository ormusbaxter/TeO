(() => {
  "use strict";

  const PROJECT_META = window.TeOProjectMeta;
  if (!PROJECT_META) {
    throw new Error("Die TeO-Projektmetadaten konnten nicht geladen werden.");
  }
  const STORAGE_KEY = "intensivteam-personalverwaltung-v1";
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
    nord: "Nord",
    dracula: "Dracula",
    "catppuccin-latte": "Catppuccin Latte",
    "windows-95": "Windows 95",
    cellitinnen: "Cellitinnen",
    "cellitinnen-red": "Cellitinnen Rot",
  };
  const DARK_THEMES = new Set(["dark", "nord", "dracula"]);

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
