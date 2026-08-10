/* Generiert aus src/app/*.js – Änderungen dort vornehmen. */
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
  const STATE_VERSION = PROJECT_META.stateVersion;
  const PROJECT_NAME = PROJECT_META.name;
  const PROJECT_VERSION = PROJECT_META.version;
  const BACKUP_FORMAT = PROJECT_META.backupFormat;
  const BACKUP_FORMAT_VERSION = PROJECT_META.backupFormatVersion;
  const MAX_AUDIT_LOG_ENTRIES = 1000;
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
    cellitinnen: "Cellitinnen",
    "cellitinnen-red": "Cellitinnen Rot",
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
  let automaticBackupRequestSequence = 0;
  let automaticBackupRetryAt = 0;
  let automaticBackupNotice = "";
  let startupBackupSynchronized = false;
  let startupBackupImportRunning = false;
  let browserPersistenceNotice = "";
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
  let deviceParticipantSearchTerm = "";
  let deviceParticipantDraft = new Map();
  // Sortierung der erfassten Einweisungen: nach Einweisungsdatum oder danach,
  // wann der Nachweis erfasst wurde.
  let deviceInstructionSortKey = "date";
  // So viele Geraete bleiben in der Auswahl sichtbar, weitere sind scrollbar.
  const VISIBLE_INSTRUCTION_DEVICES = 5;
  // Mehrere Geraete koennen mit denselben Angaben auf einmal dokumentiert
  // werden; beim Bearbeiten bleibt es bei genau einem Geraet.
  let deviceInstructionDeviceDraft = new Set();
  let deviceInstructionDeviceSearchTerm = "";
  const cleanFormSnapshots = new WeakMap();
  let activeSettingsSection = "general";

  const elements = {
    navEmployeeCount: document.querySelector("#navEmployeeCount"),
    navTrainingCount: document.querySelector("#navTrainingCount"),
    navMeetingCount: document.querySelector("#navMeetingCount"),
    navAppointmentCount: document.querySelector("#navAppointmentCount"),
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
    recentEmployees: document.querySelector("#recentEmployees"),
    employeeTable: document.querySelector("#employeeTable"),
    employeeSearch: document.querySelector("#employeeSearch"),
    copyActiveEmailsButton: document.querySelector("#copyActiveEmailsButton"),
    appointmentCategory: document.querySelector("#appointmentCategory"),
    mainNav: document.querySelector("#mainNav"),
    resetSidebarOrderButton: document.querySelector("#resetSidebarOrderButton"),
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
    openCatalogManagementButton: document.querySelector("#openCatalogManagementButton"),
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
    backupVolumeBar: document.querySelector("#backupVolumeBar"),
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
    deviceSummary: document.querySelector("#deviceSummary"),
    deviceMatrixWidget: document.querySelector("#deviceMatrixWidget"),
    toggleDeviceMatrixMaximizeButton: document.querySelector(
      "#toggleDeviceMatrixMaximizeButton",
    ),
    deviceMatrixMaximizeIcon: document.querySelector("#deviceMatrixMaximizeIcon"),
    deviceMatrixMaximizeLabel: document.querySelector("#deviceMatrixMaximizeLabel"),
    deviceManagementSummary: document.querySelector("#deviceManagementSummary"),
    deviceCatalog: document.querySelector("#deviceCatalog"),
    deviceInstructionMatrix: document.querySelector("#deviceInstructionMatrix"),
    deviceInstructionList: document.querySelector("#deviceInstructionList"),
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
    meetingDialog: document.querySelector("#meetingDialog"),
    meetingForm: document.querySelector("#meetingForm"),
    meetingDialogTitle: document.querySelector("#meetingDialogTitle"),
    meetingSubmitLabel: document.querySelector("#meetingSubmitLabel"),
    appointmentDialog: document.querySelector("#appointmentDialog"),
    appointmentForm: document.querySelector("#appointmentForm"),
    appointmentDialogTitle: document.querySelector("#appointmentDialogTitle"),
    appointmentSubmitLabel: document.querySelector("#appointmentSubmitLabel"),
    appointmentParticipantList: document.querySelector(
      "#appointmentParticipantList",
    ),
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
    await loadAutomaticBackupConfiguration();
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);
    window.addEventListener("beforeunload", handleBeforeUnload);
    initializeFormattedDateInputs();
    applyTheme(state.settings.theme);
    renderProjectMetadata();

    const today = todayIso();
    document.querySelector("#birthDate").max = today;
    elements.completionDate.max = today;
    elements.deviceInstructionDate.max = today;

    bindNavigation();
    bindSidebarOrder();
    bindDialogTriggers();
    bindForms();
    bindFilters();
    bindDelegatedActions();
    bindDialogs();
    bindAuthentication();
    bindCatalogManagement();
    bindDataSync();
    bindRemoteSync();

    const initialHash = window.location.hash.replace("#", "");
    showView(HASH_VIEWS[initialHash] || "dashboard", false);
    renderAll();
    restoreAuthenticationSession();
    void refreshBackendHealth();
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

  async function loadMariaDbState() {
    const token = window.TeOBackend.readToken();
    if (!token) return emptyState();

    try {
      const [health, result] = await Promise.all([
        window.TeOBackend.health(backendConfig.apiUrl),
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
    };
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

  function normalizeUsers(users) {
    if (!Array.isArray(users)) return initialUsers();
    const normalized = users.map(normalizeUser).filter(Boolean);
    const normalizedNames = new Set(
      normalized.map((user) => user.username.toLocaleLowerCase("de-DE")),
    );
    if (
      normalizedNames.size !== normalized.length ||
      (normalized.length > 0 &&
        !normalized.some((user) => user.role === "admin"))
    ) {
      return initialUsers();
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
    };
  }

  function normalizeTheme(theme) {
    return Object.hasOwn(THEMES, theme) ? theme : "standard";
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

  function employeeNameSignature(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/gi, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
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
      participantList: Boolean(appointment.participantList),
      createdAt: validTimestamp(appointment.createdAt),
      updatedAt: validTimestamp(appointment.updatedAt || appointment.createdAt),
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
      } catch (error) {
        console.error("Daten konnten nicht gespeichert werden.", error);
        showToast(
          "Speichern fehlgeschlagen. Der Browserspeicher ist möglicherweise voll.",
          "error",
        );
        return false;
      }
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

  async function commitStateMutation(mutate) {
    const previousState = JSON.parse(JSON.stringify(state));
    mutate();
    appendAuditEntry(describeMutation(previousState, state));

    if (await persistState()) {
      databaseSaveReminderArmed = true;
      renderAll();
      scheduleAutomaticBackup();
      return true;
    }

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

  function appendAuditEntry(action) {
    if (!action) return;
    state.auditLog.unshift({
      id: createId(),
      timestamp: new Date().toISOString(),
      username: currentUser?.username || "System",
      action,
    });
    state.auditLog = state.auditLog.slice(0, MAX_AUDIT_LOG_ENTRIES);
  }

  function describeMutation(before, after) {
    const collections = [
      ["employees", "Mitarbeiter"],
      ["trainings", "Pflichtfortbildungen"],
      ["completions", "Fortbildungsnachweise"],
      ["meetings", "Teamsitzungen"],
      ["meetingAttendances", "Sitzungsteilnahmen"],
      ["appointments", "Termine"],
      ["devices", "Geräte"],
      ["deviceInstructions", "Geräteeinweisungen"],
      ["vacationEntitlements", "Urlaubsansprüche"],
      ["vacationDays", "Abwesenheitsplanung"],
      ["users", "Benutzerkonten"],
    ];
    for (const [key, label] of collections) {
      const difference = after[key].length - before[key].length;
      if (difference > 0) return `${label}: ${difference} Eintrag/Einträge hinzugefügt`;
      if (difference < 0) return `${label}: ${Math.abs(difference)} Eintrag/Einträge gelöscht`;
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        return `${label} geändert`;
      }
    }
    if (JSON.stringify(before.catalogs) !== JSON.stringify(after.catalogs)) {
      return "Berufs- oder Qualifikationskatalog geändert";
    }
    if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) {
      return "Anwendungseinstellungen geändert";
    }
    return "Datenbestand aktualisiert";
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

    document.querySelectorAll("[data-help-target]").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .getElementById(button.dataset.helpTarget)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_VIEWS[hash]) showView(HASH_VIEWS[hash], false);
    });
  }

  function showView(view, updateHash = true) {
    if (!VIEW_HASHES[view]) view = "dashboard";
    if (view !== "vacations") setVacationPlannerMaximized(false);
    if (view !== "devices") setDeviceMatrixMaximized(false);
    activeView = view;

    document.body.classList.toggle("is-vacation-view", view === "vacations");
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

  function bindDialogTriggers() {
    elements.mobileCreateButton.addEventListener("click", () => {
      if (elements.mobileCreateButton.dataset.createType === "training") {
        openTrainingDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "meeting") {
        openMeetingDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "appointment") {
        openAppointmentDialog();
      } else if (
        elements.mobileCreateButton.dataset.createType === "device-instruction"
      ) {
        openDeviceInstructionDialog();
      } else if (elements.mobileCreateButton.dataset.createType === "device") {
        openDeviceDialog();
      } else {
        openEmployeeDialog();
      }
    });

    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.addEventListener("change", () => changeTheme(select.value));
    });
    elements.mobileThemeButton.addEventListener("click", () => {
      const themes = Object.keys(THEMES);
      const currentIndex = themes.indexOf(state.settings.theme);
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
      employeeSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
      renderEmployees();
    });

    elements.appointmentSearch.addEventListener("input", (event) => {
      appointmentSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
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
      completionSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
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
      attendanceSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
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
      deviceSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceInstructionMatrix();
    });
    elements.deviceManagementSearch.addEventListener("input", (event) => {
      deviceManagementSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDevices();
    });
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
      deviceEmployeeSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceInstructionMatrix();
    });
    elements.deviceParticipantSearch.addEventListener("input", (event) => {
      deviceParticipantSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderDeviceParticipantList();
    });
    elements.deviceParticipantList.addEventListener("change", (event) => {
      handleDeviceParticipantChange(event);
    });
    elements.toggleAllDeviceParticipants.addEventListener("click", () => {
      toggleVisibleDeviceParticipants();
    });
    elements.deviceInstructionSort.addEventListener("change", (event) => {
      deviceInstructionSortKey =
        event.target.value === "createdAt" ? "createdAt" : "date";
      renderDeviceInstructionList();
    });
    elements.deviceInstructionDeviceSearch.addEventListener("input", (event) => {
      deviceInstructionDeviceSearchTerm = event.target.value
        .trim()
        .toLocaleLowerCase("de-DE");
      renderInstructionDeviceList();
    });
    elements.deviceInstructionDeviceList.addEventListener("change", (event) => {
      handleInstructionDeviceChange(event);
    });
    elements.toggleAllInstructionDevices.addEventListener("click", () => {
      toggleVisibleInstructionDevices();
    });
  }

  function filterHelpTopics() {
    const query = normalizeHelpSearch(elements.helpSearch.value);
    const sections = [...document.querySelectorAll("[data-help-section]")];
    let visibleCount = 0;
    sections.forEach((section) => {
      const matches =
        !query || normalizeHelpSearch(section.textContent).includes(query);
      section.hidden = !matches;
      if (matches) visibleCount += 1;
      const headingId = section.dataset.helpHeading;
      document
        .querySelector(`[data-help-nav-target="${headingId}"]`)
        ?.toggleAttribute("hidden", !matches);
    });
    elements.helpSearchStatus.textContent = query
      ? `${visibleCount} von ${sections.length} Themen gefunden`
      : `${sections.length} Hilfethemen`;
    elements.clearHelpSearch.hidden = !query;
    elements.helpNoResults.hidden = visibleCount > 0;
  }

  function normalizeHelpSearch(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/\s+/g, " ")
      .trim();
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
  }

  function bindDialogs() {
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog) requestDialogClose(dialog);
      });
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
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
      applyTheme(state.settings.theme);
      if (currentUser) {
        const refreshedUser = state.users.find((user) => user.id === currentUser.id);
        if (!refreshedUser) {
          showLoginDialog();
          return;
        }
        currentUser = refreshedUser;
        if (currentUser.mustChangePassword) {
          completeLogin(currentUser);
          showToast("Das Passwort wurde zurückgesetzt. Bitte legen Sie ein neues Passwort fest.");
          return;
        }
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
      applyTheme(state.settings.theme);
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
    dashboard: [renderDashboard, renderDeadlineOverview],
    employees: [renderEmployees],
    weekends: [renderWeekendDistribution],
    vacations: [renderVacationPlanner],
    appointments: [renderAppointments],
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
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    updateUsernameExportButton();
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

  async function changeTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    if (nextTheme === state.settings.theme) {
      applyTheme(nextTheme);
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.theme = nextTheme;
    });
    applyTheme(state.settings.theme);
    if (committed) showToast(`Farbthema „${THEMES[nextTheme]}“ wurde aktiviert.`);
  }

  function applyTheme(theme) {
    const activeTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme === "dark" ? "dark" : "light";
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
    completeLogin(admin);
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

    let passwordMatches = false;
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
    completeLogin(user);
  }

  function completeLogin(user) {
    currentUser = user;
    sessionStorage.setItem(SESSION_USER_KEY, user.id);
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
      showStartupBackupDialog();
      return;
    }

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
    scheduleAutomaticBackup();
  }

  function showLoginDialog() {
    currentUser = null;
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

  function showStartupBackupDialog() {
    document.body.classList.add("is-auth-locked");
    elements.startupBackupFile.value = "";
    elements.startupBackupStatus.textContent = "";
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
      showStartupBackupDialog();
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
    document.body.dataset.userRole = currentUser?.role || "guest";
    document.querySelectorAll("[data-admin-only]").forEach((element) => {
      element.hidden = !admin;
    });
    elements.currentUsername.textContent = currentUser?.username || "Nicht angemeldet";
    elements.currentUserRole.textContent = currentUser
      ? admin
        ? "Administrator"
        : "Normaler Benutzer"
      : "–";
    elements.mobileAccountButton.title = currentUser
      ? `Benutzerkonto: ${currentUser.username}`
      : "Benutzerkonto";
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
        });
        if (!committed) return;
        renderCatalogManagement();
        showToast("Beruf wurde gelöscht.");
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
        });
        if (!committed) return;
        renderCatalogManagement();
        showToast("Zusatzqualifikation wurde gelöscht.");
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
      .map((part) => String(part || 0).padStart(3, "0"))
      .join(".");
  }

  function renderProjectMetadata() {
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${projectBuildNumber()}`;
  }

  function renderSidebarSystemStatus() {
    if (!elements.sidebarSystemStatus) return;
    const localMode = !isMariaDbMode();
    const status = localMode ? "local" : backendConnectionStatus;
    elements.sidebarSystemStatus.classList.toggle("is-local", status === "local");
    elements.sidebarSystemStatus.classList.toggle(
      "is-connected",
      status === "connected",
    );
    elements.sidebarSystemStatus.classList.toggle("is-error", status === "error");

    if (localMode) {
      elements.sidebarConnectionLabel.textContent = "Lokal bereit";
      elements.sidebarBackendLabel.textContent = "Browser · localForage";
      elements.sidebarServerLabel.textContent = "Dieses Browserprofil";
      elements.sidebarRevisionLabel.textContent = "lokal";
      elements.sidebarSchemaLabel.textContent = "IndexedDB";
      elements.sidebarSyncLabel.textContent = "Automatische lokale Speicherung";
      elements.sidebarServerLabel.title = "";
      elements.sidebarSyncLabel.title = "";
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
      const health = await window.TeOBackend.health(backendConfig.apiUrl);
      markBackendConnected({ health });
    } catch (error) {
      markBackendConnectionError(error);
    }
  }

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
                    style="--progress: ${stats.percent}%; --progress-color: ${color}"
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
        ${deadlines
          .slice(0, 25)
          .map(
            (item) => `
              <button
                class="deadline-row ${item.daysUntil < 0 ? "is-overdue" : ""}"
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
                  <strong>${escapeHtml(
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
        deadlines.length > 25
          ? `<p class="field-hint">${deadlines.length - 25} weitere Einträge werden in den jeweiligen Übersichten angezeigt.</p>`
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
    return items.filter(
      (item) =>
        activeKinds.has(deadlineFilterKind(item)) &&
        item.daysUntil <= horizon &&
        (!hideOverdue || item.daysUntil >= 0),
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
      if (daysUntil < 0) return;
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
    const searchTerm = vacationEmployeeSearchTerm.trim().toLocaleLowerCase("de-DE");
    if (!searchTerm) return employees;
    return employees.filter((employee) =>
      [
        fullName(employee),
        employee.lastName,
        employee.firstName,
        employee.username,
      ]
        .join(" ")
        .toLocaleLowerCase("de-DE")
        .includes(searchTerm),
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
      let date = parseLocalDate(period.start);
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
    });
    if (!committed) return;
    markFormClean(elements.bulkEditForm);
    elements.bulkEditDialog.close();
    const changedCount = selectedEmployeeIds.size;
    selectedEmployeeIds.clear();
    showToast(`${changedCount} Mitarbeiter wurden aktualisiert.`);
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
        <table class="data-table">
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
              ${renderEmployeeSortHeader("name", "Mitarbeiter", "23%")}
              ${renderEmployeeSortHeader("profession", "Beruf", "16%")}
              ${renderEmployeeSortHeader("employment", "Umfang", "10%")}
              ${renderEmployeeSortHeader("qualifications", "Qualifikationen", "22%")}
              ${renderEmployeeSortHeader("trainings", "Fortbildungen", "13%")}
              ${renderEmployeeSortHeader("status", "Status", "9%")}
              <th style="width: 138px"><span class="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(renderEmployeeRow).join("")}
          </tbody>
        </table>
      </div>
    `;
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

        const haystack = [
          employee.firstName,
          employee.lastName,
        ]
          .join(" ")
          .toLocaleLowerCase("de-DE");
        return haystack.includes(employeeSearchTerm);
      })
      .sort(compareEmployeesForTable);
  }

  function renderEmployeeRow(employee) {
    const selectedQualifications = Object.entries(employee.qualifications)
      .filter(([, selected]) => selected)
      .map(([key]) => qualificationLabel(key));
    const trainingStats = getEmployeeTrainingStats(employee.id);

    return `
      <tr>
        <td class="selection-column">
          <input
            type="checkbox"
            data-select-employee="${employee.id}"
            aria-label="${escapeHtml(fullName(employee))} auswählen"
            ${selectedEmployeeIds.has(employee.id) ? "checked" : ""}
          />
        </td>
        <td>
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
        <td>
          <span class="profession-cell">
            <strong>${escapeHtml(employee.profession)}</strong>
            <small>Dienstwochenende: ${escapeHtml(
              serviceWeekendLabel(employee.serviceWeekend),
            )}</small>
          </span>
        </td>
        <td><strong>${employee.employmentPercent}&thinsp;%</strong></td>
        <td>
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
        <td>
          <div class="table-progress">
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(fullName(employee))}: ${trainingStats.percent} Prozent der Pflichtfortbildungen aktuell"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${trainingStats.percent}"
            >
              <div class="progress-bar" style="--progress: ${trainingStats.percent}%"></div>
            </div>
            <span>${trainingStats.current}/${trainingStats.total}</span>
          </div>
        </td>
        <td>
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

  function renderEmployeeSortHeader(key, label, width) {
    const active = employeeSortKey === key;
    const direction = active ? (employeeSortDirection === "asc" ? "▲" : "▼") : "";
    return `
      <th style="width: ${width}">
        <button
          class="table-sort-button ${active ? "is-active" : ""}"
          type="button"
          data-employee-sort="${key}"
          aria-label="${escapeHtml(label)} sortieren"
        >
          ${escapeHtml(label)} <span aria-hidden="true">${direction}</span>
        </button>
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
                    <span style="--training-rate: ${rate}%"></span>
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
      teal: "--chip-color: var(--teal-700); --chip-bg: var(--teal-100)",
      orange: "--chip-color: var(--orange-700); --chip-bg: var(--orange-100)",
      blue: "",
    };

    return `
      <article class="summary-chip">
        <span class="summary-chip-icon" style="${tones[tone]}">
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
              <div class="progress-bar" style="--progress: ${stats.percent}%"></div>
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

  function renderAppointments() {
    const today = todayIso();
    const matchingAppointments = state.appointments.filter((appointment) => {
      if (appointmentPeriodFilter === "upcoming" && appointment.date < today) return false;
      if (appointmentPeriodFilter === "today" && appointment.date !== today) return false;
      if (appointmentPeriodFilter === "past" && appointment.date >= today) return false;
      if (!appointmentSearchTerm) return true;

      return [
        appointment.title,
        appointment.description,
        appointment.location,
        appointmentCategoryLabel(appointment),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("de-DE")
        .includes(appointmentSearchTerm);
    });
    const upcoming = [...matchingAppointments]
      .filter((appointment) => appointment.date >= today)
      .sort(sortAppointments);
    const past = [...matchingAppointments]
      .filter((appointment) => appointment.date < today)
      .sort((a, b) => sortAppointments(b, a));
    const todayCount = upcoming.filter((appointment) => appointment.date === today).length;

    elements.appointmentSummary.innerHTML = `
      ${renderSummaryChip("calendar", state.appointments.length, "Termine gesamt")}
      ${renderSummaryChip("alert", upcoming.length, "anstehende Termine", "orange")}
      ${renderSummaryChip("check", todayCount, "Termine heute", "teal")}
    `;

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

    if (matchingAppointments.length === 0) {
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
        class="meeting-card appointment-card ${daysUntil < 0 ? "is-past" : ""}"
        data-appointment-card="${appointment.id}"
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
              <h2>${escapeHtml(appointment.title)}${
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
        if (!searchTerm) return true;
        return `${device.productName} ${device.manufacturer}`
          .toLocaleLowerCase("de-DE")
          .includes(searchTerm);
      })
      .sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
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
      <article class="training-card device-card ${
        device.currentInventory ? "" : "is-former"
      }">
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
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceEmployeeSearchTerm)
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
                      <span>${escapeHtml(device.manufacturer)}</span>
                      <strong>${escapeHtml(device.productName)}</strong>
                      <small class="completion-progress ${completionProgressTone(
                        instructionPercentage,
                      )}">
                        ${instructionPercentage} % eingewiesen
                      </small>
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
        Herstellereinweisung als Gerätebeauftragte/r. Per Klick öffnet sich der Verlauf.
      </p>
    `;
  }

  function renderDeviceInstructionList() {
    elements.deviceInstructionSort.value = deviceInstructionSortKey;
    // Beide Sortierungen fallen auf das jeweils andere Datum zurueck, damit
    // gleichzeitig erfasste Nachweise eine stabile Reihenfolge behalten.
    const nachEingabe = deviceInstructionSortKey === "createdAt";
    const instructions = [...state.deviceInstructions].sort((a, b) =>
      nachEingabe
        ? b.createdAt.localeCompare(a.createdAt) ||
          b.date.localeCompare(a.date)
        : b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
    );
    if (!instructions.length) {
      elements.deviceInstructionList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Einweisungen dokumentiert",
            text: "Gespeicherte Einweisungen erscheinen hier chronologisch.",
            compact: true,
          })}
        </section>
      `;
      return;
    }

    elements.deviceInstructionList.innerHTML = `
      <div class="device-instruction-log">
        ${instructions
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
      </div>
    `;
  }

  function getDeviceInstructionPercentage(deviceId, employees) {
    if (!employees.length) return 0;
    const instructedEmployeeIds = new Set(
      state.deviceInstructions
        .filter((instruction) => instruction.deviceId === deviceId)
        .flatMap((instruction) =>
          instruction.participants.map((participant) => participant.employeeId),
        ),
    );
    const instructedCount = employees.filter((employee) =>
      instructedEmployeeIds.has(employee.id),
    ).length;
    return Math.round((instructedCount / employees.length) * 100);
  }

  // Gemeinsam genutzt von der Einweisungsmatrix und der Jahresauswertung der
  // Pflichtfortbildungen, damit beide denselben Farbmassstab verwenden.
  function completionProgressTone(percentage) {
    if (percentage <= 65) return "is-low";
    if (percentage <= 80) return "is-medium";
    return "is-high";
  }

  function renderDeviceMatrixCell(employee, device) {
    const instructions = state.deviceInstructions
      .filter(
        (instruction) =>
          instruction.deviceId === device.id &&
          instruction.participants.some(
            (participant) => participant.employeeId === employee.id,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
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
        });
        if (committed) showToast("Gerät wurde gelöscht.");
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
          `${device.manufacturer} ${device.productName}`
            .toLocaleLowerCase("de-DE")
            .includes(deviceInstructionDeviceSearchTerm),
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
    const anzahl = deviceInstructionDeviceDraft.size;
    elements.toggleAllInstructionDevices.textContent =
      anzahl && filteredInstructionDevices().every((device) =>
        deviceInstructionDeviceDraft.has(device.id),
      )
        ? "Sichtbare abwählen"
        : "Sichtbare auswählen";
    if (anzahl) elements.deviceInstructionDeviceError.textContent = "";
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
    elements.employeeInstructorMpoConfirmation.required = isEmployee;
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
          fullName(employee)
            .toLocaleLowerCase("de-DE")
            .includes(deviceParticipantSearchTerm),
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
    elements.employeeInstructorMpoConfirmation.setCustomValidity(
      isEmployee && !elements.employeeInstructorMpoConfirmation.checked
        ? "Bitte bestätigen Sie den Status zum Einweisungszeitpunkt."
        : "",
    );
    if (!elements.deviceInstructionForm.reportValidity()) return;
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
        });
        if (!committed) return;
        if (elements.deviceInstructionHistoryDialog.open) {
          elements.deviceInstructionHistoryDialog.close();
        }
        showToast("Einweisungsnachweis wurde gelöscht.");
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
              <div class="progress-bar" style="--progress: ${stats.percent}%"></div>
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
            style="--chart-segments: ${chartBackground}"
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
                      style="--legend-color: ${segment.color}"
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
    if (checkbox.checked) selectedEmployeeIds.add(checkbox.dataset.selectEmployee);
    else selectedEmployeeIds.delete(checkbox.dataset.selectEmployee);
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
      if (action === "edit-appointment") openAppointmentDialog(id);
      if (action === "delete-appointment") requestDeleteAppointment(id);
      return;
    }

    const card = event.target.closest("[data-appointment-card]");
    if (!card || (event.type === "keydown" && !["Enter", " "].includes(event.key))) {
      return;
    }
    if (event.type === "keydown") event.preventDefault();
    openAppointmentDialog(card.dataset.appointmentCard);
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
        });
        if (!committed) return;

        showToast("Mitarbeiter wurde gelöscht.");
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
        });
        if (!committed) return;

        showToast("Pflichtfortbildung wurde gelöscht.");
      },
    });
  }

  function openAppointmentDialog(appointmentId = null) {
    renderAppointmentCategoryOptions();
    elements.appointmentForm.reset();
    document.querySelector("#appointmentId").value = "";
    document.querySelector("#appointmentTitle").setCustomValidity("");
    document.querySelector("#appointmentEndTime").setCustomValidity("");
    document.querySelector("#appointmentDate").value = todayIso();
    elements.appointmentParticipantList.checked = false;

    const appointment = appointmentId ? getAppointment(appointmentId) : null;
    elements.appointmentDialogTitle.textContent = appointment
      ? "Termin bearbeiten"
      : "Termin anlegen";
    elements.appointmentSubmitLabel.textContent = appointment
      ? "Änderungen speichern"
      : "Termin speichern";

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

  function requestDeleteAppointment(appointmentId) {
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
        });
        if (!committed) return;
        showToast("Termin wurde gelöscht.");
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
        });
        if (!committed) return;

        showToast("Teamsitzung wurde gelöscht.");
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
        return [employee.firstName, employee.lastName, employee.profession]
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(attendanceSearchTerm);
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
        return [employee.firstName, employee.lastName, employee.profession]
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(completionSearchTerm);
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
        });
        if (!committed) return;

        showToast("Fortbildungsnachweis wurde gelöscht.");
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
    automaticBackupRequestSequence += 1;
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
    const requestSequence = automaticBackupRequestSequence;
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

      state.settings.lastBackupAt = exportedAt.toISOString();
      appendAuditEntry(
        automaticBackupSettings.encrypted
          ? "Verschlüsselte automatische Datensicherung exportiert"
          : "Automatische Datensicherung exportiert",
      );
      await persistState();
      automaticBackupSettings.lastBackupAt = exportedAt.toISOString();
      automaticBackupSettings.lastBackupSizeBytes = volume.sizeBytes;
      await persistAutomaticBackupConfiguration();
      automaticBackupRetryAt = 0;
      automaticBackupNotice = "";
      databaseSaveReminderArmed =
        automaticBackupRequestSequence !== requestSequence;
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
      automaticBackupNotice =
        error?.code === "backup_volume_exceeded"
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

  async function handleStartupBackupFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || startupBackupImportRunning) return;

    if (file.name.toLocaleLowerCase("de-DE") !== AUTO_BACKUP_FILENAME) {
      elements.startupBackupStatus.textContent =
        `Bitte wählen Sie die Datei „${AUTO_BACKUP_FILENAME}“ aus.`;
      return;
    }
    const volume = backupVolumeAssessment(file.size);
    if (volume.exceeded) {
      elements.startupBackupStatus.textContent = backupVolumeMessage(volume);
      return;
    }

    startupBackupImportRunning = true;
    elements.selectStartupBackupFileButton.disabled = true;
    elements.startupBackupStatus.textContent = "Sicherungsdatei wird geprüft …";
    try {
      const importedState = await readBackupFile(file);
      if (!importedState) {
        elements.startupBackupStatus.textContent =
          "Der Startabgleich wurde nicht abgeschlossen.";
        return;
      }
      if (startupBackupIsOlder(importedState)) {
        elements.startupBackupStatus.textContent =
          "Diese Sicherungsdatei ist älter als der zuletzt lokal gesicherte Datenstand. Bitte wählen Sie die aktuelle Datei aus.";
        return;
      }
      elements.startupBackupStatus.textContent = "Datenbestand wird übernommen …";
      if (!(await importDatabase(importedState))) {
        elements.startupBackupStatus.textContent =
          "Der Datenbestand konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.";
        return;
      }

      startupBackupSynchronized = true;
      await rememberBackupVolume(volume.sizeBytes);
      renderBackupVolumeMeter();
      if (elements.startupBackupDialog.open) elements.startupBackupDialog.close();
      document.body.classList.remove("is-auth-locked");
      applyAccessControl();
      scheduleAutomaticBackup();
      showToast(
        volume.warning
          ? backupVolumeMessage(volume)
          : "Der aktuelle Datenbestand wurde aus teo-autosicherung.json geladen.",
        volume.warning ? "warning" : undefined,
      );
    } catch (error) {
      console.warn("Startabgleich konnte nicht abgeschlossen werden.", error);
      elements.startupBackupStatus.textContent =
        error.message || "Die Sicherungsdatei ist ungültig.";
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
      const health = await window.TeOBackend.health(apiUrl);
      if (isMariaDbMode() && apiUrl === backendConfig.apiUrl) {
        markBackendConnected({ health });
      }
      elements.settingsBackendStatus.classList.remove("is-error");
      elements.settingsBackendStatus.innerHTML = health.initialized
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
      const health = await window.TeOBackend.health(apiUrl);
      let result;
      if (health.initialized) {
        result = await window.TeOBackend.login(
          apiUrl,
          currentUser.username,
          password,
        );
      } else {
        result = await window.TeOBackend.bootstrap(
          apiUrl,
          state,
          currentUser.username,
          password,
          elements.settingsMariaDbBootstrapToken.value.trim(),
        );
      }

      await dataStore.setItem(STORAGE_KEY, state);
      backendConfig = window.TeOBackend.writeConfig({
        mode: "mariadb",
        apiUrl,
      });
      backendMode = "mariadb";
      remoteRevision = Number(result.revision) || 1;
      markBackendConnected({ health, synchronized: true });
      window.TeOBackend.writeToken(result.token);
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
      applyTheme(state.settings.theme);
      completeLogin(remoteUser);
      showView("settings", false);
      showToast(
        health.initialized
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
    if (!visible) return;
    elements.databaseSaveWarningText.textContent =
      "Änderungen wurden automatisch gespeichert, aber noch nicht als Datensicherung exportiert.";
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
    databaseSaveReminderArmed = shouldRemindBeforeUnload(state);

    employeeSearchTerm = "";
    completionSearchTerm = "";
    attendanceSearchTerm = "";
    selectedCompletionEmployeeIds.clear();
    attendanceDraft.clear();
    elements.employeeSearch.value = "";
    applyTheme(state.settings.theme);
    currentUser = state.users.find((user) => user.id === currentUser?.id) || null;
    if (!currentUser) {
      showLoginDialog();
      return false;
    }
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
      : state.completions
          .filter(
            (completion) =>
              completion.employeeId === employeeId &&
              completion.trainingId === trainingId,
          )
          .sort(sortCompletionsDescending)[0];
  }

  function latestCompletionForTraining(employeeId, training, completedOnOrBefore = "") {
    return state.completions
      .filter(
        (completion) =>
          completion.employeeId === employeeId &&
          completionMatchesTraining(completion, training) &&
          (!completedOnOrBefore || completion.completedOn <= completedOnOrBefore),
      )
      .sort(sortCompletionsDescending)[0];
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
    const collections = [
      "employees",
      "trainings",
      "completions",
      "meetings",
      "meetingAttendances",
      "appointments",
      "devices",
      "deviceInstructions",
      "vacationEntitlements",
      "vacationDays",
      "users",
    ];
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
      .filter((collection) => collection !== "users")
      .some((collection) =>
        (candidateState[collection] || []).some((entry) =>
          ["updatedAt", "createdAt"].some(
            (property) =>
              Date.parse(entry?.[property] || "") > lastBackupTimestamp,
          ),
        ),
      );
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

  function getFilteredEmployeeEmailExport() {
    return getFilteredEmployeeEmailAddresses().join(";");
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
        style="--phone-columns: ${columns.length}; --phone-font-size: ${fontSize}; --phone-cell-padding: ${cellPadding}"
      >
        <header class="phone-list-document-header">
          <h1>Telefonliste</h1>
          <span>${rows.length} Mitarbeiter · Stand ${formatDate(new Date().toISOString().slice(0, 10))}</span>
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

  async function copyListToClipboard(werte, { erfolg, fehlerProtokoll }) {
    const exportText = werte.join(";");
    const meldung = erfolg(werte.length);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextWithFallback(exportText);
      }
      showToast(meldung);
    } catch (error) {
      try {
        copyTextWithFallback(exportText);
        showToast(meldung);
      } catch (fallbackError) {
        console.error(fehlerProtokoll, error, fallbackError);
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
      erfolg: (anzahl) =>
        `${anzahl} E-Mail-Adresse${
          anzahl === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      fehlerProtokoll: "E-Mail-Adressen konnten nicht kopiert werden.",
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
      erfolg: (anzahl) =>
        `${anzahl} Benutzername${
          anzahl === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      fehlerProtokoll: "Benutzernamen konnten nicht kopiert werden.",
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

    let copied = false;
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
        style="--avatar-fill: ${employmentPercent}%"
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

  function initializeFormattedDateInputs() {
    refreshFormattedDateInputs();
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
      updateFormattedDateInput(input);
    });
  }

  function handleFormattedDateInput(event) {
    if (event.target?.matches?.('input[type="date"]')) {
      updateFormattedDateInput(event.target);
    }
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">
        <svg><use href="#icon-${type === "success" ? "check" : "alert"}"></use></svg>
      </span>
      <span></span>
    `;
    toast.querySelector("span:last-child").textContent = message;
    if (type === "error") {
      toast.querySelector(".toast-icon").style.color = "#ffabb2";
      toast.querySelector(".toast-icon").style.background = "rgb(230 88 101 / 15%)";
    } else if (type === "warning") {
      toast.querySelector(".toast-icon").style.color = "#f4c86d";
      toast.querySelector(".toast-icon").style.background = "rgb(230 170 66 / 15%)";
    }

    elements.toastRegion.append(toast);
    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => toast.remove(), 190);
    }, 3400);
  }
})();
