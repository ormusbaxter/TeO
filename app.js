(() => {
  "use strict";

  const STORAGE_KEY = "intensivteam-personalverwaltung-v1";
  const SESSION_USER_KEY = "intensivteam-session-user-v1";
  const STATE_VERSION = 19;
  const PROJECT_NAME = "TeO – Team & Employee Organizer";
  const PROJECT_VERSION = Object.freeze({ major: 2, minor: 0 });
  const BACKUP_FORMAT = "intensivteam-datensicherung";
  const BACKUP_FORMAT_VERSION = 1;
  const MAX_BACKUP_FILE_SIZE = 20 * 1024 * 1024;
  const MAX_AUDIT_LOG_ENTRIES = 1000;
  const DEFAULT_BACKUP_REMINDER_DAYS = 14;
  const DEFAULT_VACATION_BASE_DAYS = 30;
  const DEFAULT_OLI_REFERENCE_SATURDAY = "2026-01-03";
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
  };

  const PASSWORD_ITERATIONS = 210000;
  const INITIAL_USERS = [
    {
      id: "user-admin",
      username: "Becke003",
      role: "admin",
      passwordSalt: "PRJwiOdOJrDJMnvi9ii+Nw==",
      passwordHash: "nohBaPFvNb82bZ42kqeReikbLR0LPfsr1j9AxN0Qsdk=",
      mustChangePassword: false,
    },
    {
      id: "user-botze",
      username: "Botze003",
      role: "user",
      passwordSalt: "Pb5FJQr9W/AYuWWFTFMMJw==",
      passwordHash: "2ko1h7SMKwvKdWosUnOKb/HP0kc7tF8bk1EZ99RNWzI=",
      mustChangePassword: true,
    },
    {
      id: "user-ferre",
      username: "Ferre001",
      role: "user",
      passwordSalt: "TkRiTRbHdkRLB00eXtbHIA==",
      passwordHash: "2rUFkTolfTPNPz7KaVPHTEy/72gBBaxqGYXYJ0SIOy8=",
      mustChangePassword: true,
    },
  ];
  const USER_FIRST_NAME_FALLBACKS = {
    becke003: "Oliver",
    botze003: "Elisabeth",
    ferre001: "Claudio",
  };

  const DEFAULT_QUALIFICATIONS = {
    fachweiterbildungIA: "Fachweiterbildung I/A",
    praxisanleiter: "Praxisanleiter/in",
    hygienebeauftragter: "Hygienebeauftragte/r",
    wundexperte: "Wundexperte/in",
    demenzexperte: "Demenzexperte/in",
    brandschutzbeauftragter: "Brandschutzbeauftragte/r",
    medizinproduktebeauftragter: "Medizinproduktebeauftragte/r",
  };

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

  const EMPLOYEE_EMAIL_ASSIGNMENTS = [
    { names: ["Ali Taghipourlahijani"], email: "ali_P1386@yahoo.com" },
    { names: ["Alissa Kunn"], email: "alissa.kunn@googlemail.com" },
    { names: ["Anastasia Derr"], email: "nastiarsk@gmail.com" },
    { names: ["Anna Peter"], email: "annapeter049@gmail.com" },
    { names: ["Armin Kallrath"], email: "a.kallrath@gmail.com" },
    { names: ["Aylin Boran"], email: "aylinboran@gmx.de" },
    { names: ["Beyza Cicek"], email: "beyza2009@gmx.de" },
    { names: ["Christian Hirt"], email: "christian.hirt@web.de" },
    { names: ["Christof Michalski"], email: "stoepselmich@gmail.com" },
    { names: ["Claudio Ferreira"], email: "claudinofc@web.de" },
    { names: ["David Baldus"], email: "david.baldus@gmx.de" },
    { names: ["David Brisch"], email: "davidbrisch9@gmail.com" },
    { names: ["David Radtke"], email: "davidradtke84@googlemail.com" },
    { names: ["Edin Moranjkic"], email: "Edin_8c@hotmail.com" },
    { names: ["Elisabeth Botzet"], email: "elisabethbotzet@yahoo.de" },
    { names: ["Emina Celikovic"], email: "eminacelikovicc@gmail.com" },
    { names: ["Ertugrul Erol"], email: "ertugrulerol1995@icloud.com" },
    { names: ["Eva Sandmann"], email: "evasandmann@gmx.de" },
    { names: ["Henning Nordmann"], email: "h.nordmann@gmail.com" },
    { names: ["Isabel Hurtado"], email: "Hurtado.isabel94@gmail.com" },
    { names: ["Jana Lueken"], email: "jlueken2812@gmail.com" },
    { names: ["Jana Viertel"], email: "jana.viertel@web.de" },
    { names: ["Janna Heumann"], email: "heumann.janna@outlook.de" },
    { names: ["Julian Westermann"], email: "westermannjuli@gmail.com" },
    { names: ["Juliana Groß"], email: "grosses-julchen@web.de" },
    { names: ["Karim Keddo"], email: "kkeddo@web.de" },
    { names: ["Kathrin Quauck"], email: "kquauck@googlemail.com" },
    { names: ["Lara Holstein"], email: "liholstein@hotmail.de" },
    { names: ["Lea Ring"], email: "dielearing@web.de" },
    { names: ["Leah Deneu"], email: "Leah.deneu@gmail.com" },
    { names: ["Lilija Engels"], email: "lihe031181@gmail.com" },
    { names: ["Lisa Borjal"], email: "srlisa@hotmail.de" },
    { names: ["Marco Eßeling"], email: "marco_esseling@web.de" },
    { names: ["Meral Uzun"], email: "nc-uzunme3@netcologne.de" },
    { names: ["Michelle Kaiser"], email: "michelle.ksr@web.de" },
    { names: ["Miriam Ossege"], email: "miriam.ossege@icloud.com" },
    { names: ["Mladen Derikonja"], email: "derikonjamladen@gmail.com" },
    { names: ["Mo Golchin"], email: "golchin99@gmail.com" },
    { names: ["Nadir Kudic"], email: "nadirkudic99@gmail.com" },
    { names: ["Nico Ohlrogg"], email: "nicoohlrogg@outlook.de" },
    { names: ["Nils von der Gathen"], email: "nilsvondergathen@web.de" },
    { names: ["Oliver Becker"], email: "vestine@gmail.com" },
    { names: ["Pauline Müller"], email: "paulinemueller96@web.de" },
    { names: ["Ramona Dragu"], email: "ramona26@web.de" },
    { names: ["Rosa Diniz"], email: "Salinda1827@gmail.com" },
    { names: ["Negar Sadeghidehnavi"], email: "sadeghinegar84@gmail.com" },
    { names: ["Sanja Pavicic"], email: "Pavicicsanja1@gmail.com" },
    { names: ["Sebastian Gertzen"], email: "s.gertzen@gmx.net" },
    { names: ["Sigrun Ekstein"], email: "sigrun.ekstein@koeln.de" },
    { names: ["Silke Hönnicke"], email: "SHoennicke@aol.com" },
    { names: ["Susanne Bauer"], email: "susan.bauer.1987@web.de" },
    { names: ["Vanessa Ellerbrock"], email: "vanessa.ellerbrock@gmx.de" },
    { names: ["Viktoria Sarkadi"], email: "sarkadi.viktoria.klara@gmail.com" },
    { names: ["Wiebke Jost"], email: "wiebke.jost@web.de" },
    { names: ["Nina Skrijelj"], email: "ninaskrijelj00@gmail.com" },
    { names: ["Ilef Ayach"], email: "ilef.ayach@gmail.com" },
    {
      names: ["Maria Kimiyaei Asadi", "Maria Kimiyaeiasadi"],
      email: "maria.kimiyaeiasadi@gmail.com",
    },
  ];

  const SERVICE_WEEKENDS = {
    none: "Kein festes Dienstwochenende",
    oli: "Oli",
    claudio: "Claudio",
  };

  // Amtliche Ferienordnung NRW für die Schuljahre 2024/25 bis 2029/30:
  // https://bass.schule.nrw/19662.htm
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
  const NRW_SCHOOL_VACATION_FULL_YEARS = new Set([2025, 2026, 2027, 2028, 2029]);

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
      shortLabel: "UN",
      isAbsence: true,
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
      shortLabel: "FP",
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

  const ATTENDANCE_STATUSES = {
    teilgenommen: { label: "Teilgenommen", tone: "green" },
    urlaub: { label: "Urlaub", tone: "blue" },
    dienst: { label: "Dienst", tone: "purple" },
    krankheit: { label: "Krankheit", tone: "red" },
    schule: { label: "Schule", tone: "teal" },
    entschuldigt: { label: "Entschuldigt", tone: "orange" },
    unentschuldigt: { label: "Unentschuldigt", tone: "dark-red" },
  };

  const ATTENDANCE_CHART_COLORS = {
    teilgenommen: "#2b9b68",
    urlaub: "#4f8fdf",
    dienst: "#805bad",
    krankheit: "#d2525d",
    schule: "#25a29d",
    entschuldigt: "#dc8a31",
    unentschuldigt: "#9f2731",
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
  };

  const HASH_VIEWS = Object.fromEntries(
    Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view]),
  );

  let state = emptyState();
  let dataStore = null;
  let dataSyncChannel = null;
  let backendConfig = { mode: "local", apiUrl: "" };
  let backendMode = "local";
  let remoteRevision = 0;
  let pendingRemoteConflictState = null;
  let backendStartupError = "";
  let remoteSyncTimer = null;
  let remoteUpdateNoticeRevision = 0;
  let employeeStatusFilter = "all";
  let employeeSearchTerm = "";
  let completionSearchTerm = "";
  let selectedCompletionEmployeeIds = new Set();
  let attendanceSearchTerm = "";
  let attendanceStatusFilter = "all";
  let attendanceDraft = new Map();
  let attendanceEmployeeIds = [];
  let confirmCallback = null;
  let currentUser = null;
  let selectedEmployeeIds = new Set();
  let employeeProfessionFilter = "all";
  let employeeQualificationFilter = "all";
  let employeeWeekendFilter = "all";
  let employeeSortKey = "name";
  let employeeSortDirection = "asc";
  let trainingRecurrenceManuallyChanged = false;
  let backupReminderShown = false;
  let vacationYear = new Date().getFullYear();
  let vacationMonth = new Date().getMonth() + 1;
  let vacationEntryType = "vacation";
  let deviceInventoryFilter = "current";
  let deviceAnnexFilter = "all";
  let deviceCategoryFilter = "all";
  let deviceSearchTerm = "";
  let deviceManagementInventoryFilter = "current";
  let deviceManagementAnnexFilter = "all";
  let deviceManagementCategoryFilter = "all";
  let deviceEmployeeStatusFilter = "employed";
  let deviceEmployeeSearchTerm = "";
  let deviceParticipantSearchTerm = "";
  let deviceParticipantDraft = new Map();
  const cleanFormSnapshots = new WeakMap();

  const elements = {
    navEmployeeCount: document.querySelector("#navEmployeeCount"),
    navTrainingCount: document.querySelector("#navTrainingCount"),
    navMeetingCount: document.querySelector("#navMeetingCount"),
    navAppointmentCount: document.querySelector("#navAppointmentCount"),
    navDeviceManagementCount: document.querySelector("#navDeviceManagementCount"),
    mobileCreateButton: document.querySelector("#mobileCreateButton"),
    mobileThemeButton: document.querySelector("#mobileThemeButton"),
    mobileAccountButton: document.querySelector("#mobileAccountButton"),
    currentUsername: document.querySelector("#currentUsername"),
    currentUserRole: document.querySelector("#currentUserRole"),
    dashboardStats: document.querySelector("#dashboardStats"),
    dashboardTrainingProgress: document.querySelector("#dashboardTrainingProgress"),
    dashboardGreeting: document.querySelector("#dashboardGreeting"),
    projectBuildLabel: document.querySelector("#projectBuildLabel"),
    deadlineOverview: document.querySelector("#deadlineOverview"),
    deadlineHorizon: document.querySelector("#deadlineHorizon"),
    deadlineFilters: [...document.querySelectorAll("[data-deadline-filter]")],
    recentEmployees: document.querySelector("#recentEmployees"),
    employeeTable: document.querySelector("#employeeTable"),
    employeeSearch: document.querySelector("#employeeSearch"),
    copyActiveEmailsButton: document.querySelector("#copyActiveEmailsButton"),
    copyActiveEmailsLabel: document.querySelector("#copyActiveEmailsLabel"),
    openCatalogManagementButton: document.querySelector("#openCatalogManagementButton"),
    exportDataButton: document.querySelector("#exportDataButton"),
    importDataButton: document.querySelector("#importDataButton"),
    importDataFile: document.querySelector("#importDataFile"),
    validateBackupButton: document.querySelector("#validateBackupButton"),
    validateBackupFile: document.querySelector("#validateBackupFile"),
    exportEncryptedDataButton: document.querySelector("#exportEncryptedDataButton"),
    backupStatus: document.querySelector("#backupStatus"),
    browserStorageStatus: document.querySelector("#browserStorageStatus"),
    requestPersistentStorageButton: document.querySelector(
      "#requestPersistentStorageButton",
    ),
    settingsStorageBackend: document.querySelector("#settingsStorageBackend"),
    mariaDbSettingsFields: document.querySelector("#mariaDbSettingsFields"),
    settingsMariaDbApiUrl: document.querySelector("#settingsMariaDbApiUrl"),
    settingsMariaDbPassword: document.querySelector("#settingsMariaDbPassword"),
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
    saveGeneralSettingsButton: document.querySelector(
      "#saveGeneralSettingsButton",
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
    weekendDistributionContent: document.querySelector("#weekendDistributionContent"),
    vacationYear: document.querySelector("#vacationYear"),
    vacationMonth: document.querySelector("#vacationMonth"),
    vacationEntryType: document.querySelector("#vacationEntryType"),
    vacationBaseDays: document.querySelector("#vacationBaseDays"),
    vacationWeekdayAbsenceLimit: document.querySelector(
      "#vacationWeekdayAbsenceLimit",
    ),
    vacationWeekendAbsenceLimit: document.querySelector(
      "#vacationWeekendAbsenceLimit",
    ),
    vacationOliReferenceSaturday: document.querySelector(
      "#vacationOliReferenceSaturday",
    ),
    saveVacationSettingsButton: document.querySelector("#saveVacationSettingsButton"),
    vacationSummary: document.querySelector("#vacationSummary"),
    vacationPlanner: document.querySelector("#vacationPlanner"),
    openDataQualityButton: document.querySelector("#openDataQualityButton"),
    trainingSummary: document.querySelector("#trainingSummary"),
    trainingList: document.querySelector("#trainingList"),
    openTrainingMatrixButton: document.querySelector("#openTrainingMatrixButton"),
    meetingSummary: document.querySelector("#meetingSummary"),
    meetingList: document.querySelector("#meetingList"),
    openMeetingStatsButton: document.querySelector("#openMeetingStatsButton"),
    appointmentSummary: document.querySelector("#appointmentSummary"),
    appointmentList: document.querySelector("#appointmentList"),
    deviceSummary: document.querySelector("#deviceSummary"),
    deviceManagementSummary: document.querySelector("#deviceManagementSummary"),
    deviceCatalog: document.querySelector("#deviceCatalog"),
    deviceInstructionMatrix: document.querySelector("#deviceInstructionMatrix"),
    deviceInstructionList: document.querySelector("#deviceInstructionList"),
    deviceInventoryFilter: document.querySelector("#deviceInventoryFilter"),
    deviceAnnexFilter: document.querySelector("#deviceAnnexFilter"),
    deviceCategoryFilter: document.querySelector("#deviceCategoryFilter"),
    deviceSearch: document.querySelector("#deviceSearch"),
    deviceManagementInventoryFilter: document.querySelector(
      "#deviceManagementInventoryFilter",
    ),
    deviceManagementAnnexFilter: document.querySelector(
      "#deviceManagementAnnexFilter",
    ),
    deviceManagementCategoryFilter: document.querySelector(
      "#deviceManagementCategoryFilter",
    ),
    deviceEmployeeStatusFilter: document.querySelector("#deviceEmployeeStatusFilter"),
    deviceEmployeeSearch: document.querySelector("#deviceEmployeeSearch"),
    employeeDialog: document.querySelector("#employeeDialog"),
    employeeForm: document.querySelector("#employeeForm"),
    employeeDialogTitle: document.querySelector("#employeeDialogTitle"),
    employeeSubmitLabel: document.querySelector("#employeeSubmitLabel"),
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
    trainingMatrixContent: document.querySelector("#trainingMatrixContent"),
    exportTrainingMatrixCsvButton: document.querySelector(
      "#exportTrainingMatrixCsvButton",
    ),
    printTrainingMatrixButton: document.querySelector("#printTrainingMatrixButton"),
    loginDialog: document.querySelector("#loginDialog"),
    loginForm: document.querySelector("#loginForm"),
    loginError: document.querySelector("#loginError"),
    changePasswordDialog: document.querySelector("#changePasswordDialog"),
    changePasswordForm: document.querySelector("#changePasswordForm"),
    changePasswordError: document.querySelector("#changePasswordError"),
    accountDialog: document.querySelector("#accountDialog"),
    accountDialogTitle: document.querySelector("#accountDialogTitle"),
    accountDialogRole: document.querySelector("#accountDialogRole"),
    userManagementDialog: document.querySelector("#userManagementDialog"),
    userManagementList: document.querySelector("#userManagementList"),
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
    deviceInstructionDevice: document.querySelector("#deviceInstructionDevice"),
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
    weekendOverviewDialog: document.querySelector("#weekendOverviewDialog"),
    weekendOverviewContent: document.querySelector("#weekendOverviewContent"),
    printWeekendOverviewButton: document.querySelector("#printWeekendOverviewButton"),
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
    state = await loadState();
    applyTheme(state.settings.theme);
    renderProjectMetadata();

    const today = todayIso();
    document.querySelector("#birthDate").max = today;
    elements.completionDate.max = today;
    elements.deviceInstructionDate.max = today;

    bindNavigation();
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
        meetingAttendanceThreshold: 70,
        vacationBaseDays: DEFAULT_VACATION_BASE_DAYS,
        vacationOliReferenceSaturday: DEFAULT_OLI_REFERENCE_SATURDAY,
        vacationWeekdayAbsenceLimit: DEFAULT_WEEKDAY_ABSENCE_LIMIT,
        vacationWeekendAbsenceLimit: DEFAULT_WEEKEND_ABSENCE_LIMIT,
        deadlineKinds: [...DEADLINE_KINDS],
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
      const result = await window.TeOBackend.load(backendConfig.apiUrl, token);
      remoteRevision = Number(result.revision) || 0;
      backendStartupError = "";
      return normalizeState(result.state);
    } catch (error) {
      console.warn("MariaDB-Datenbestand konnte nicht geladen werden.", error);
      backendStartupError = error.message || "Der TeO-Server ist nicht erreichbar.";
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
    if ((Number(parsed.version) || 0) < 13) {
      applyEmployeeEmailAssignments(employees);
    }
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
        vacationOliReferenceSaturday: normalizeSaturdayDate(
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
        deadlineKinds: normalizeDeadlineKinds(parsed.settings?.deadlineKinds),
      },
      users: normalizeUsers(parsed.users),
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
    return INITIAL_USERS.map((user) => ({ ...user }));
  }

  function normalizeUsers(users) {
    if (!Array.isArray(users)) return initialUsers();
    const normalized = users.map(normalizeUser).filter(Boolean);
    const normalizedNames = new Set(
      normalized.map((user) => user.username.toLocaleLowerCase("de-DE")),
    );
    if (
      !normalized.length ||
      normalizedNames.size !== normalized.length ||
      !normalized.some((user) => user.role === "admin")
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

  function applyEmployeeEmailAssignments(employees) {
    const assignmentsByName = new Map();
    EMPLOYEE_EMAIL_ASSIGNMENTS.forEach(({ names, email }) => {
      names.forEach((name) => {
        assignmentsByName.set(employeeNameSignature(name), email);
      });
    });

    employees.forEach((employee) => {
      const signature = employeeNameSignature(
        `${employee.firstName} ${employee.lastName}`,
      );
      const email = assignmentsByName.get(signature);
      if (email) employee.email = email;
    });
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
      birthDate: String(employee.birthDate || ""),
      phone: String(employee.phone || ""),
      email: String(employee.email || ""),
      employmentPercent: clampNumber(employee.employmentPercent, 1, 100, 100),
      profession: normalizeProfession(employee.profession),
      serviceWeekend: Object.hasOwn(SERVICE_WEEKENDS, employee.serviceWeekend)
        ? employee.serviceWeekend
        : "none",
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
      createdAt,
      updatedAt: validTimestamp(training.updatedAt || training.createdAt),
    };
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

    return {
      id,
      title,
      date,
      startTime,
      endTime,
      location: String(appointment.location || "").trim().slice(0, 160),
      description: String(appointment.description || "").trim().slice(0, 1000),
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
    return parsed?.getDay() === 6 ? date : DEFAULT_OLI_REFERENCE_SATURDAY;
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
        pendingRemoteConflictState = null;
      } catch (error) {
        console.error("MariaDB-Datenbestand konnte nicht gespeichert werden.", error);
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
      renderAll();
      return true;
    }

    state = pendingRemoteConflictState || previousState;
    pendingRemoteConflictState = null;
    if (currentUser) {
      currentUser =
        state.users.find((user) => user.id === currentUser.id) || currentUser;
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

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_VIEWS[hash]) showView(HASH_VIEWS[hash], false);
    });
  }

  function showView(view, updateHash = true) {
    if (!VIEW_HASHES[view]) view = "dashboard";

    document.body.classList.toggle("is-vacation-view", view === "vacations");
    if (view === "dashboard") renderDashboardGreeting();
    elements.mobileCreateButton.hidden = view === "settings";

    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
    });

    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

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
    elements.openTrainingMatrixButton.addEventListener("click", openTrainingMatrixDialog);
    elements.trainingMatrixYear.addEventListener("change", renderTrainingMatrix);
    elements.exportTrainingMatrixCsvButton.addEventListener(
      "click",
      exportTrainingMatrixCsv,
    );
    elements.printTrainingMatrixButton.addEventListener("click", printTrainingMatrix);
    elements.openMeetingStatsButton.addEventListener("click", openMeetingStatsDialog);
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
    elements.exportDataButton.addEventListener("click", exportDatabase);
    elements.exportEncryptedDataButton.addEventListener("click", exportEncryptedDatabase);
    elements.requestPersistentStorageButton.addEventListener(
      "click",
      requestPersistentBrowserStorage,
    );
    elements.importDataButton.addEventListener("click", () => elements.importDataFile.click());
    elements.importDataFile.addEventListener("change", handleBackupFileSelection);
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
      renderVacationPlanner();
    });
    elements.vacationMonth.addEventListener("change", () => {
      vacationMonth = Number(elements.vacationMonth.value);
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
    elements.saveVacationSettingsButton.addEventListener(
      "click",
      saveVacationSettings,
    );
    elements.printWeekendOverviewButton.addEventListener("click", printWeekendOverview);
    elements.openDataQualityButton.addEventListener("click", openDataQualityDialog);
    document.querySelectorAll("[data-open-data-quality]").forEach((button) => {
      button.addEventListener("click", openDataQualityDialog);
    });
    elements.saveGeneralSettingsButton.addEventListener(
      "click",
      saveGeneralSettings,
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
    elements.employeeSearch.addEventListener("input", (event) => {
      employeeSearchTerm = event.target.value.trim().toLocaleLowerCase("de-DE");
      renderEmployees();
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
  }

  function bindDelegatedActions() {
    elements.employeeTable.addEventListener("click", handleEmployeeTableAction);
    elements.employeeTable.addEventListener("change", handleEmployeeTableSelection);
    elements.vacationPlanner.addEventListener("click", handleVacationPlannerClick);
    elements.vacationPlanner.addEventListener("change", handleVacationPlannerChange);
    elements.recentEmployees.addEventListener("click", handleRecentEmployeeAction);
    elements.trainingList.addEventListener("click", handleTrainingAction);
    elements.meetingList.addEventListener("click", handleMeetingAction);
    elements.appointmentList.addEventListener("click", handleAppointmentAction);
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
    elements.loginForm.addEventListener("submit", handleLoginSubmit);
    elements.changePasswordForm.addEventListener("submit", handlePasswordChangeSubmit);
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", logout);
    });
    document.querySelectorAll("[data-open-user-management]").forEach((button) => {
      button.addEventListener("click", openUserManagementDialog);
    });
    elements.mobileAccountButton.addEventListener("click", openAccountDialog);
    elements.userManagementList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-user-password]");
      if (button) requestPasswordReset(button.dataset.resetUserPassword);
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
        elements.deviceInstructionHistoryDialog,
        elements.attendanceDialog,
        elements.meetingStatsDialog,
        elements.accountDialog,
        elements.userManagementDialog,
        elements.catalogManagementDialog,
        elements.employeeDossierDialog,
        elements.vacationEmployeeOverviewDialog,
        elements.weekendOverviewDialog,
        elements.bulkEditDialog,
        elements.dataQualityDialog,
        elements.auditLogDialog,
        elements.confirmDialog,
      ].filter((dialog) => dialog.open);
      openDialogs.forEach((dialog) => dialog.close());

      state = await loadState();
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
      renderAll();
      showToast("Änderungen von einem anderen Arbeitsplatz wurden geladen.");
    } catch (error) {
      if (error.status === 401) {
        window.TeOBackend.writeToken("");
        showLoginDialog();
      } else {
        console.warn("MariaDB-Synchronisierung vorübergehend nicht verfügbar.", error);
      }
    }
  }

  function renderAll() {
    elements.navEmployeeCount.textContent = String(state.employees.length);
    elements.navTrainingCount.textContent = String(state.trainings.length);
    elements.navMeetingCount.textContent = String(state.meetings.length);
    elements.navAppointmentCount.textContent = String(
      state.appointments.filter((appointment) => appointment.date >= todayIso()).length,
    );
    elements.navDeviceManagementCount.textContent = String(
      state.devices.filter((device) => device.currentInventory).length,
    );
    updateEmailExportButton();
    renderDashboard();
    renderDeadlineOverview();
    renderEmployees();
    renderWeekendDistribution();
    renderVacationPlanner();
    renderTrainings();
    renderMeetings();
    renderAppointments();
    renderDevices();
    renderSettings();
    renderBackupStatus();
    void renderBrowserStorageStatus();
    applyAccessControl();
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
    const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
    const user = state.users.find((item) => item.id === sessionUserId);
    if (!user) {
      showLoginDialog();
      if (isMariaDbMode() && backendStartupError) {
        elements.loginError.textContent = backendStartupError;
      }
      return;
    }
    completeLogin(user);
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
        remoteRevision = Number(result.revision) || 0;
        backendStartupError = "";
        window.TeOBackend.writeToken(result.token);
        const remoteUser = state.users.find(
          (item) => item.id === result.user?.id,
        );
        if (!remoteUser) {
          throw new Error("Das angemeldete Benutzerkonto fehlt im Serverdatenbestand.");
        }
        completeLogin(remoteUser);
      } catch (error) {
        console.error("Serveranmeldung fehlgeschlagen.", error);
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

    document.body.classList.remove("is-auth-locked");
    if (elements.changePasswordDialog.open) elements.changePasswordDialog.close();
  }

  function showLoginDialog() {
    currentUser = null;
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
        "Das neue Passwort muss sich vom temporären Passwort unterscheiden.";
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

    currentUser = state.users.find((user) => user.id === currentUser.id);
    elements.changePasswordDialog.close();
    document.body.classList.remove("is-auth-locked");
    applyAccessControl();
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
    renderUserManagement();
    elements.userManagementDialog.showModal();
  }

  function renderUserManagement() {
    elements.userManagementList.innerHTML = state.users
      .map(
        (user) => `
          <article class="user-management-row">
            <span class="user-management-avatar">${escapeHtml(
              user.username.slice(0, 2).toUpperCase(),
            )}</span>
            <span>
              <strong>${escapeHtml(user.username)}</strong>
              <small>${user.role === "admin" ? "Administrator" : "Normaler Benutzer"}${
                user.mustChangePassword ? " · Passwortänderung erforderlich" : ""
              }</small>
            </span>
            ${
              user.role === "user"
                ? `<button
                    class="button button-secondary"
                    type="button"
                    data-reset-user-password="${user.id}"
                  >Passwort zurücksetzen</button>`
                : '<span class="tag tag-muted">Admin</span>'
            }
          </article>
        `,
      )
      .join("");
  }

  function requestPasswordReset(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId && item.role === "user");
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
    const user = state.users.find((item) => item.id === userId && item.role === "user");
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

    renderUserManagement();
    elements.temporaryPasswordUsername.textContent = user.username;
    elements.temporaryPasswordValue.value = temporaryPassword;
    elements.temporaryPasswordResult.hidden = false;
    elements.temporaryPasswordValue.focus();
    elements.temporaryPasswordValue.select();
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
    if (!requireAdmin()) return;
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
        (qualification) => `
          <div class="catalog-row" data-qualification-id="${qualification.id}">
            <input type="text" maxlength="100" value="${escapeHtml(
              qualification.label,
            )}" aria-label="Zusatzqualifikation ${escapeHtml(
              qualification.label,
            )} bearbeiten" />
            <button class="icon-button" type="button"
              data-catalog-action="save-qualification"
              aria-label="Änderung speichern" title="Änderung speichern">
              <svg><use href="#icon-check"></use></svg>
            </button>
            <button class="icon-button danger" type="button"
              data-catalog-action="delete-qualification"
              aria-label="${escapeHtml(qualification.label)} löschen" title="Löschen">
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        `,
      )
      .join("");
  }

  async function addProfession() {
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    const label = String(nextValue || "").trim();
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
    if (!requireAdmin()) return;
    const qualification = state.catalogs.qualifications.find((item) => item.id === id);
    if (!qualification) return;
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
    return [PROJECT_VERSION.major, PROJECT_VERSION.minor]
      .map((part) => String(part).padStart(3, "0"))
      .join(".");
  }

  function renderProjectMetadata() {
    elements.projectBuildLabel.textContent = `${PROJECT_NAME} - ${projectBuildNumber()}`;
  }

  function renderDashboard() {
    renderDashboardGreeting();
    const activeEmployees = activeEmployeeList();
    const inactiveCount = state.employees.length - activeEmployees.length;
    const onboardingCount = state.employees.filter(
      (employee) => employee.employmentStatus === "onboarding",
    ).length;
    const totalAssignments = activeEmployees.length * state.trainings.length;
    const currentAssignments = state.trainings.reduce(
      (sum, training) => sum + getTrainingStats(training).current,
      0,
    );
    const openAssignments = Math.max(0, totalAssignments - currentAssignments);

    const stats = [
      {
        label: "Aktive Mitarbeiter",
        value: activeEmployees.length,
        detail: `${onboardingCount} in Einarbeitung · ${inactiveCount} inaktiv`,
        icon: "users",
        className: "",
      },
      {
        label: "Mitarbeiter gesamt",
        value: state.employees.length,
        detail: "gespeicherte Personalakten",
        icon: "dashboard",
        className: "stat-teal",
      },
      {
        label: "Pflichtfortbildungen",
        value: state.trainings.length,
        detail: "im Fortbildungskatalog",
        icon: "training",
        className: "stat-orange",
      },
      {
        label: "Offene Nachweise",
        value: openAssignments,
        detail:
          totalAssignments > 0
            ? `${currentAssignments} von ${totalAssignments} aktuell`
            : "noch keine Zuordnungen",
        icon: "alert",
        className: openAssignments > 0 ? "stat-red" : "stat-teal",
      },
    ];

    elements.dashboardStats.innerHTML = stats
      .map(
        (stat) => `
          <article class="stat-card ${stat.className}">
            <div class="stat-top">
              <span class="stat-label">${stat.label}</span>
              <span class="stat-icon">
                <svg><use href="#icon-${stat.icon}"></use></svg>
              </span>
            </div>
            <strong class="stat-value">${stat.value}</strong>
            <span class="stat-detail">${stat.detail}</span>
          </article>
        `,
      )
      .join("");

    renderDashboardTrainingProgress(activeEmployees.length);
    renderRecentEmployees();
  }

  function renderDashboardTrainingProgress(activeCount) {
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

    const sortedTrainings = [...state.trainings]
      .map((training) => ({ training, stats: getTrainingStats(training) }))
      .sort((a, b) => a.stats.percent - b.stats.percent || a.training.title.localeCompare(b.training.title))
      .slice(0, 5);

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
                <span class="progress-value">${activeCount ? `${stats.current}/${activeCount}` : "–"}</span>
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
    const deadlines = getDeadlineItems().filter(
      (item) => activeKinds.has(item.kind) && item.daysUntil <= horizon,
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
          ? `Für die Auswahl ${formatList(selectedLabels)} sind innerhalb dieses Zeitraums keine Einträge vorhanden.`
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
                <strong>${deadlines.filter((item) => item.kind === kind).length}</strong>
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
                    ? '<span class="deadline-calendar-icon"><svg><use href="#icon-calendar"></use></svg></span>'
                    : renderAvatar(item.employee, true)
                }</span>
                <span>
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(
                    item.kind === "appointment"
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
        button.addEventListener("click", () => {
          showView("appointments");
          elements.appointmentList
            .querySelector(
              `[data-appointment-card="${button.dataset.deadlineAppointment}"]`,
            )
            ?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      });
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
      state.trainings.forEach((training) => {
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
        type: "Termin",
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
    const trainings = [...state.trainings].sort(
      (a, b) => b.year - a.year || a.title.localeCompare(b.title, "de"),
    );
    const attendances = state.meetingAttendances.filter(
      (attendance) => attendance.employeeId === employee.id,
    );
    const participated = attendances.filter(
      (attendance) => attendance.status === "teilgenommen",
    ).length;
    const expectedMeetings = state.meetings.filter((meeting) =>
      meeting.expectedEmployeeIds.includes(employee.id),
    ).length;

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
    const keys = ["oli", "claudio", "none"];
    const oli = distribution.oli.metrics;
    const claudio = distribution.claudio.metrics;
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
            Oli ↔ Claudio: ${Math.abs(oli.employmentPercent - claudio.employmentPercent)} %
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
                      `<th scope="col">${escapeHtml(SERVICE_WEEKENDS[key])}</th>`,
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
                    <h2>${escapeHtml(SERVICE_WEEKENDS[key])}</h2>
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
            <small>${escapeHtml(employeeStatusLabel(employee))}</small>
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

  function renderVacationPlanner() {
    renderVacationControls();
    const employees = activeEmployeeList().sort(sortEmployees);
    const daysInMonth = new Date(vacationYear, vacationMonth, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, index) =>
      [
        vacationYear,
        String(vacationMonth).padStart(2, "0"),
        String(index + 1).padStart(2, "0"),
      ].join("-"),
    );
    const holidays = getNrwHolidays(vacationYear);
    const schoolVacations = getNrwSchoolVacations(vacationYear);
    const selectedMonthLabel = new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
    }).format(new Date(vacationYear, vacationMonth - 1, 1, 12));
    const schoolVacationCoverageNote = NRW_SCHOOL_VACATION_FULL_YEARS.has(
      vacationYear,
    )
      ? "Amtliche NRW-Schulferien sind berücksichtigt; bewegliche Ferientage sind nicht enthalten."
      : schoolVacations.size
        ? "Für dieses Jahr sind nur die bereits amtlich veröffentlichten NRW-Schulferien markiert."
        : "Für dieses Jahr sind noch keine amtlichen NRW-Schulferientermine hinterlegt.";
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
    const totalEntitlement = employees.reduce(
      (sum, employee) => sum + getVacationEntitlement(employee, vacationYear).total,
      0,
    );
    const totalPlanned = employees.reduce(
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

    if (employees.length === 0) {
      elements.vacationPlanner.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Aktive Mitarbeiter und Mitarbeiter in Einarbeitung erscheinen hier automatisch.",
        compact: true,
      });
      return;
    }

    elements.vacationPlanner.innerHTML = `
      <div class="vacation-table-note">
        <span>
          „Urlaub“ und „Urlaub Einarbeitung“ werden vom Jahresanspruch abgezogen.
          Urlaub Einarbeitung und Dienstzusagen zählen nicht gegen die Tagesgrenze
          (${state.settings.vacationWeekdayAbsenceLimit} werktags,
          ${state.settings.vacationWeekendAbsenceLimit} an Wochenenden und Feiertagen).
          Eine Überschreitung bleibt möglich und färbt den Tag rot. Auf einem
          Dienstwochenende gleicht die Zusage eines Mitarbeiters vom jeweils anderen
          festen Wochenende einen Urlaub auf dem eigenen Wochenende aus.
        </span>
        <span class="${
          NRW_SCHOOL_VACATION_FULL_YEARS.has(vacationYear)
            ? ""
            : "is-warning"
        }">${schoolVacationCoverageNote}</span>
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
    ]);
    elements.vacationYear.innerHTML = [...availableYears]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((a, b) => a - b)
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");
    elements.vacationYear.value = String(vacationYear);
    elements.vacationMonth.value = String(vacationMonth);
    elements.vacationEntryType.value = vacationEntryType;
    elements.vacationBaseDays.value = String(state.settings.vacationBaseDays);
    elements.vacationWeekdayAbsenceLimit.value = String(
      state.settings.vacationWeekdayAbsenceLimit,
    );
    elements.vacationWeekendAbsenceLimit.value = String(
      state.settings.vacationWeekendAbsenceLimit,
    );
    elements.vacationOliReferenceSaturday.value =
      state.settings.vacationOliReferenceSaturday;
  }

  function renderVacationDayHeader(date, holidays, schoolVacations) {
    const day = parseLocalDate(date);
    const metadata = getVacationDayMetadata(date, holidays, schoolVacations);
    const stats = getPlannerDayStats(date, holidays);
    const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" })
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
          title="${escapeHtml(SERVICE_WEEKENDS[employee.serviceWeekend])}"
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
              <small>${escapeHtml(employeeStatusLabel(employee))} · ${employee.employmentPercent} %</small>
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
            return `
              <td class="vacation-day-cell ${metadata.className} ${
                dayStats.isOverLimit ? "is-over-limit" : ""
              } ${
                ownWeekend ? "is-own-weekend" : ""
              }">
                <button
                  type="button"
                  data-vacation-employee="${employee.id}"
                  data-vacation-date="${date}"
                  aria-pressed="${Boolean(entry)}"
                  aria-label="${escapeHtml(fullName(employee))}: ${
                    entryType
                      ? `${entryType.label} am ${formatDate(date)}`
                      : `Eintrag am ${formatDate(date)} anlegen`
                  }"
                  title="${escapeHtml(
                    [entryType?.label, metadata.title].filter(Boolean).join(" · "),
                  )}"
                  ${isAdmin() ? "" : "disabled"}
                  class="${entry ? `planner-entry-${entry.type}` : ""}"
                >${entryType?.shortLabel || ""}</button>
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
            ${isAdmin() ? "" : "disabled"}
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
        <span><i class="vacation-year-weekend-swatch is-oli"></i> Oli-Wochenende</span>
        <span><i class="vacation-year-weekend-swatch is-claudio"></i> Claudio-Wochenende</span>
      </div>
      ${renderVacationYearMatrix(entries, employee)}
    `;
    elements.vacationEmployeeOverviewDialog.showModal();
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
    const monthLabel = new Intl.DateTimeFormat("de-DE", {
      month: "long",
    }).format(new Date(vacationYear, month - 1, 1, 12));
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
    const weekday = new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
    }).format(parsedDate);
    const details = [
      formatDate(date),
      weekday,
      entryType?.label,
      metadata.holiday,
      metadata.schoolVacation ? `${metadata.schoolVacation} NRW` : "",
      metadata.weekendGroup
        ? employee.serviceWeekend === metadata.weekendGroup
          ? `Eigenes Dienstwochenende ${SERVICE_WEEKENDS[metadata.weekendGroup]}`
          : `Dienstwochenende ${SERVICE_WEEKENDS[metadata.weekendGroup]}`
        : "",
    ].filter(Boolean);
    return `
      <td
        class="${metadata.className} ${entry ? "has-entry" : ""}"
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
    return state.vacationDays.filter(
      (vacationDay) =>
        vacationDay.employeeId === employeeId &&
        Number(vacationDay.date.slice(0, 4)) === year &&
        PLANNER_ENTRY_TYPES[vacationDay.type]?.countsVacationEntitlement,
    ).length;
  }

  function getPlannerDayStats(
    date,
    holidays = getNrwHolidays(Number(date.slice(0, 4))),
  ) {
    const entries = state.vacationDays.filter(
      (entry) =>
        entry.date === date && getEmployee(entry.employeeId)?.active,
    );
    const absenceCount = entries.filter(
      (entry) => PLANNER_ENTRY_TYPES[entry.type]?.isAbsence,
    ).length;
    const dutyCount = entries.filter(
      (entry) => entry.type === "mandatoryDuty",
    ).length;
    const parsed = parseLocalDate(date);
    const weekendGroup =
      parsed && [0, 6].includes(parsed.getDay())
        ? getWeekendRotationForDate(date)
        : "";
    const ownWeekendVacationCount = weekendGroup
      ? entries.filter((entry) => {
          if (entry.type !== "vacation") return false;
          return getEmployee(entry.employeeId)?.serviceWeekend === weekendGroup;
        }).length
      : 0;
    const foreignWeekendDutyCount = weekendGroup
      ? entries.filter((entry) => {
          if (entry.type !== "mandatoryDuty") return false;
          const serviceWeekend = getEmployee(entry.employeeId)?.serviceWeekend;
          return (
            ["oli", "claudio"].includes(serviceWeekend) &&
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
    return new Intl.NumberFormat("de-DE", {
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
    if (!button || !requireAdmin()) return;
    const scrollPosition = captureVacationScrollPosition();
    const employeeId = button.dataset.vacationEmployee;
    const date = button.dataset.vacationDate;
    const existing = state.vacationDays.find(
      (vacationDay) =>
        vacationDay.employeeId === employeeId && vacationDay.date === date,
    );
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
    const updatedStats = getPlannerDayStats(date);
    if (updatedStats.isOverLimit) {
      const compensationNote = updatedStats.compensatedAbsenceCount
        ? ` (${updatedStats.absenceCount} eingetragen, ${updatedStats.compensatedAbsenceCount} ausgeglichen)`
        : "";
      showToast(
        `Warnung: Am ${formatDate(date)} bestehen ${updatedStats.effectiveAbsenceCount} wirksame Abwesenheiten${compensationNote}, vorgesehen sind maximal ${updatedStats.limit}.`,
        "error",
      );
    }
  }

  async function handleVacationPlannerChange(event) {
    const input = event.target.closest("[data-vacation-additional-employee]");
    if (!input || !requireAdmin()) return;
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

  async function saveVacationSettings() {
    if (!requireAdmin()) return;
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
    const referenceDate = elements.vacationOliReferenceSaturday.value;
    const parsedReference = parseLocalDate(referenceDate);
    if (!parsedReference || parsedReference.getDay() !== 6) {
      showToast("Die Oli-Referenz muss ein Samstag sein.", "error");
      elements.vacationOliReferenceSaturday.focus();
      return;
    }
    const committed = await commitStateMutation(() => {
      state.settings.vacationBaseDays = baseDays;
      state.settings.vacationOliReferenceSaturday = referenceDate;
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
        ? `Dienstwochenende ${SERVICE_WEEKENDS[weekendGroup]}`
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
    const reference = parseLocalDate(state.settings.vacationOliReferenceSaturday);
    if (!parsed || !reference) return "";
    const saturday = new Date(parsed);
    if (saturday.getDay() === 0) saturday.setDate(saturday.getDate() - 1);
    if (saturday.getDay() !== 6) return "";
    const weekDifference = Math.round(
      (saturday.getTime() - reference.getTime()) / (7 * 86400000),
    );
    return ((weekDifference % 2) + 2) % 2 === 0 ? "oli" : "claudio";
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
    NRW_SCHOOL_VACATION_PERIODS.forEach((period) => {
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
    if (!requireAdmin() || selectedEmployeeIds.size === 0) return;
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
    elements.bulkEditDialog.showModal();
    captureCleanForm(elements.bulkEditForm);
  }

  async function handleBulkEditSubmit(event) {
    event.preventDefault();
    if (!requireAdmin() || selectedEmployeeIds.size === 0) return;
    const active = elements.bulkActive.value;
    const profession = elements.bulkProfession.value;
    const weekend = elements.bulkServiceWeekend.value;
    const qualificationId = elements.bulkQualification.value;
    const qualificationState = elements.bulkQualificationState.value;
    if (!active && !profession && !weekend && !(qualificationId && qualificationState)) {
      showToast("Bitte mindestens eine Änderung auswählen.", "error");
      return;
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
    if (!requireAdmin()) return;
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
    const filtered = [...state.employees]
      .filter((employee) => {
        if (
          employeeStatusFilter !== "all" &&
          employee.employmentStatus !== employeeStatusFilter
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
          employeeQualificationFilter !== "all" &&
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

        const qualificationText = Object.entries(employee.qualifications)
          .filter(([, selected]) => selected)
          .map(([key]) => qualificationLabel(key))
          .join(" ");
        const haystack = [
          employee.firstName,
          employee.lastName,
          employee.profession,
          employee.email,
          qualificationText,
          serviceWeekendLabel(employee.serviceWeekend),
          employeeStatusLabel(employee),
        ]
          .join(" ")
          .toLocaleLowerCase("de-DE");
        return haystack.includes(employeeSearchTerm);
      })
      .sort(compareEmployeesForTable);

    updateEmployeeBulkBar();

    if (state.employees.length === 0) {
      elements.employeeTable.innerHTML = renderEmptyState({
        title: "Noch keine Mitarbeiter angelegt",
        text: "Erfassen Sie Stammdaten, Beschäftigungsumfang und Zusatzqualifikationen.",
        buttonText: isAdmin() ? "Ersten Mitarbeiter anlegen" : "",
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
              <th class="selection-column" data-admin-only>
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

  function renderEmployeeRow(employee) {
    const selectedQualifications = Object.entries(employee.qualifications)
      .filter(([, selected]) => selected)
      .map(([key]) => qualificationLabel(key));
    const trainingStats = getEmployeeTrainingStats(employee.id);

    return `
      <tr>
        <td class="selection-column" data-admin-only>
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
              <small>${escapeHtml(employee.email || employee.phone || "Keine Kontaktdaten")}</small>
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
            <span data-admin-only>
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
      ...state.catalogs.qualifications.map(
        (qualification) =>
          `<option value="${qualification.id}">${escapeHtml(qualification.label)}</option>`,
      ),
    ].join("");
    elements.employeeQualificationFilter.value = state.catalogs.qualifications.some(
      (qualification) => qualification.id === qualificationValue,
    )
      ? qualificationValue
      : "all";
    employeeQualificationFilter = elements.employeeQualificationFilter.value;
    elements.employeeWeekendFilter.value = employeeWeekendFilter;
  }

  function renderTrainings() {
    const activeCount = activeEmployeeList().length;
    const totalAssignments = activeCount * state.trainings.length;
    const currentAssignments = state.trainings.reduce(
      (sum, training) => sum + getTrainingStats(training).current,
      0,
    );
    const openAssignments = Math.max(0, totalAssignments - currentAssignments);

    elements.trainingSummary.innerHTML = `
      ${renderSummaryChip("training", state.trainings.length, "Fortbildungen angelegt")}
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
            buttonText: isAdmin() ? "Erste Fortbildung anlegen" : "",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    elements.trainingList.innerHTML = groupTrainingsByYear()
      .map(
        ([year, trainings]) => `
          <section class="training-year-group" aria-labelledby="trainingYear${year}">
            <div class="training-year-header">
              <div>
                <p class="eyebrow">Fortbildungsjahr</p>
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

  function groupTrainingsByYear() {
    const groups = new Map();
    state.trainings.forEach((training) => {
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
    const years = [...new Set(state.trainings.map((training) => training.year))].sort(
      (a, b) => b - a,
    );
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
    renderTrainingMatrix();
    elements.trainingMatrixDialog.showModal();
  }

  function renderTrainingMatrix() {
    const year = Number(elements.trainingMatrixYear.value);
    const matrix = getAnnualTrainingMatrix(year);
    elements.trainingMatrixDialogTitle.textContent = `Status der Pflichtfortbildungen · ${year}`;
    elements.trainingMatrixSummary.innerHTML = `
      <strong>${matrix.completedAssignments} von ${matrix.totalAssignments}</strong>
      <span>Nachweise vorhanden · ${matrix.completionRate}&thinsp;%</span>
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
      <div class="training-matrix-scroll" tabindex="0" aria-label="Fortbildungsmatrix ${year}">
        <table class="training-matrix-table">
          <thead>
            <tr>
              <th scope="col">Aktive Mitarbeiter</th>
              ${matrix.trainings
                .map(
                  (training) =>
                    `<th scope="col" title="${escapeHtml(training.title)}">${escapeHtml(
                      training.title,
                    )}</th>`,
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${matrix.rows
              .map(
                (row) => `
                  <tr>
                    <th scope="row">${escapeHtml(fullName(row.employee))}</th>
                    ${row.statuses
                      .map(
                        ({ training, completed }) => `
                          <td>
                            <span
                              class="matrix-status ${completed ? "matrix-complete" : "matrix-open"}"
                              role="img"
                              aria-label="${escapeHtml(
                                `${fullName(row.employee)}: ${training.title} ${
                                  completed ? "absolviert" : "offen"
                                }`,
                              )}"
                              title="${completed ? "Absolviert" : "Offen"}"
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
        ...row.statuses.map(({ completed }) => (completed ? "Absolviert" : "Offen")),
      ]),
    );
  }

  function getAnnualTrainingMatrix(year) {
    const trainings = state.trainings
      .filter((training) => training.year === year)
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    const employees = [...activeEmployeeList()].sort(sortEmployees);
    const completedKeys = new Set(
      state.completions.map(
        (completion) => `${completion.employeeId}\u0000${completion.trainingId}`,
      ),
    );
    let completedAssignments = 0;
    const rows = employees.map((employee) => ({
      employee,
      statuses: trainings.map((training) => {
        const completed = completedKeys.has(`${employee.id}\u0000${training.id}`);
        if (completed) completedAssignments += 1;
        return { training, completed };
      }),
    }));
    const totalAssignments = employees.length * trainings.length;

    return {
      year,
      trainings,
      employees,
      rows,
      completedAssignments,
      totalAssignments,
      completionRate: percentage(completedAssignments, totalAssignments),
    };
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
      .filter((completion) => completion.trainingId === training.id)
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
              data-admin-only
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
              data-admin-only
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
          }</summary>
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
          data-admin-only
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
    const upcoming = [...state.appointments]
      .filter((appointment) => appointment.date >= today)
      .sort(sortAppointments);
    const past = [...state.appointments]
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
            buttonText: isAdmin() ? "Ersten Termin anlegen" : "",
            buttonAttribute: "data-empty-add-appointment",
          })}
        </section>
      `;
      elements.appointmentList
        .querySelector("[data-empty-add-appointment]")
        ?.addEventListener("click", () => openAppointmentDialog());
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
    const meta = [
      formatDate(appointment.date),
      timeLabel,
      appointment.location,
    ].filter(Boolean);
    return `
      <article
        class="meeting-card appointment-card ${daysUntil < 0 ? "is-past" : ""}"
        data-appointment-card="${appointment.id}"
      >
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon appointment-icon">
              <svg><use href="#icon-calendar"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(appointment.title)}</h2>
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
              data-admin-only
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
              data-admin-only
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
    `;

    const visibleDevices = filteredDevices({
      inventoryFilter: deviceManagementInventoryFilter,
      annexFilter: deviceManagementAnnexFilter,
      categoryFilter: deviceManagementCategoryFilter,
      searchTerm: "",
    });
    if (!state.devices.length) {
      elements.deviceCatalog.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: "Noch keine Geräte",
            text: "Legen Sie das erste Gerät an, bevor Einweisungen dokumentiert werden.",
            buttonText: isAdmin() ? "Erstes Gerät anlegen" : "",
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
            text: "Passen Sie Anlage-1- oder Kategoriefilter an.",
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
              data-admin-only
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
              data-admin-only
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
                      <small class="device-instruction-progress ${deviceInstructionProgressTone(
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
                      <strong>${escapeHtml(fullName(employee))}</strong>
                      ${
                        employee.qualifications.medizinproduktebeauftragter
                          ? '<small class="device-mpo-status is-qualified">Gerätebeauftragte/r</small>'
                          : ""
                      }
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
    const instructions = [...state.deviceInstructions].sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
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
                    data-admin-only
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

  function deviceInstructionProgressTone(percentage) {
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
      showToast(
        isAdmin()
          ? "Bitte legen Sie zuerst ein Gerät an."
          : "Es wurde noch kein Gerät angelegt.",
        "error",
      );
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
    elements.deviceInstructionDate.value = todayIso();
    elements.deviceInstructionDevice.innerHTML = [...state.devices]
      .sort(
        (a, b) =>
          Number(b.currentInventory) - Number(a.currentInventory) ||
          a.productName.localeCompare(b.productName, "de") ||
          a.manufacturer.localeCompare(b.manufacturer, "de"),
      )
      .map(
        (device) =>
          `<option value="${device.id}">${escapeHtml(deviceLabel(device))}${
            device.currentInventory ? "" : " · nicht mehr im Bestand"
          }</option>`,
      )
      .join("");
    const selectedDeviceId = existingInstruction?.deviceId || deviceId;
    if (selectedDeviceId && getDevice(selectedDeviceId)) {
      elements.deviceInstructionDevice.value = selectedDeviceId;
    }
    elements.employeeInstructor.innerHTML = `
      <option value="">Bitte auswählen</option>
      ${[...state.employees]
        .sort(sortEmployees)
        .map(
          (employee) => `
            <option value="${employee.id}">
              ${escapeHtml(fullName(employee))}${
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
    renderDeviceParticipantList();
    elements.deviceInstructionDialog.showModal();
    captureCleanForm(elements.deviceInstructionForm);
    window.setTimeout(() => elements.deviceInstructionDevice.focus(), 0);
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
      .sort(sortEmployees);
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
    const instruction = {
      id: existingInstruction?.id || createId(),
      deviceId: elements.deviceInstructionDevice.value,
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
      createdAt: existingInstruction?.createdAt || new Date().toISOString(),
    };
    const committed = await commitStateMutation(() => {
      if (existingInstruction) {
        state.deviceInstructions = state.deviceInstructions.map((item) =>
          item.id === instruction.id ? instruction : item,
        );
      } else {
        state.deviceInstructions.push(instruction);
      }
    });
    if (!committed) return;
    markFormClean(elements.deviceInstructionForm);
    elements.deviceInstructionDialog.close();
    showToast(
      existingInstruction
        ? "Einweisung wurde aktualisiert."
        : `Einweisung wurde für ${instruction.participants.length} Mitarbeiter/in${
            instruction.participants.length === 1 ? "" : "nen"
          } gespeichert.`,
    );
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
                    data-admin-only
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
    if (!requireAdmin()) return;
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
    const meetingStats = state.meetings.map((meeting) => getMeetingStats(meeting));
    const completedMeetings = meetingStats.filter(
      (stats) => stats.total > 0 && stats.documented === stats.total,
    ).length;
    const openEntries = meetingStats.reduce((sum, stats) => sum + stats.open, 0);

    elements.meetingSummary.innerHTML = `
      ${renderSummaryChip("meeting", state.meetings.length, "Teamsitzungen angelegt")}
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
            buttonText: isAdmin() ? "Erste Teamsitzung anlegen" : "",
            buttonAttribute: "data-empty-add-meeting",
          })}
        </section>
      `;
      elements.meetingList
        .querySelector("[data-empty-add-meeting]")
        ?.addEventListener("click", () => openMeetingDialog());
      return;
    }

    elements.meetingList.innerHTML = [...state.meetings]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt),
      )
      .map(renderMeetingCard)
      .join("");
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
              data-admin-only
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
              data-admin-only
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
      ...Object.entries(ATTENDANCE_STATUSES).map(([status, config]) => ({
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
    if (!requireAdmin()) {
      elements.meetingAttendanceThreshold.value = String(
        state.settings.meetingAttendanceThreshold,
      );
      return;
    }
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
    elements.employeeBulkBar.hidden = !isAdmin() || selectedEmployeeIds.size === 0;
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
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "edit-appointment") openAppointmentDialog(id);
    if (action === "delete-appointment") requestDeleteAppointment(id);
  }

  function openEmployeeDialog(employeeId = null) {
    if (!requireAdmin()) return;
    elements.employeeForm.reset();
    ["#firstName", "#lastName", "#profession", "#birthDate"].forEach((selector) => {
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
    document.querySelector("#professionOptions").innerHTML = state.catalogs.professions
      .map((profession) => `<option value="${escapeHtml(profession)}"></option>`)
      .join("");
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
    if (!requireAdmin()) return;

    const birthDate = document.querySelector("#birthDate");
    const firstNameInput = document.querySelector("#firstName");
    const lastNameInput = document.querySelector("#lastName");
    const professionInput = document.querySelector("#profession");

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

    const employee = {
      id: existingEmployee?.id || createId(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
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
      serviceWeekend: document.querySelector("#serviceWeekend").value,
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
    const employee = getEmployee(employeeId);
    if (!employee) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
    const titleInput = document.querySelector("#trainingTitle");
    titleInput.setCustomValidity(
      titleInput.value.trim() ? "" : "Bitte eine Bezeichnung eingeben.",
    );
    if (!elements.trainingForm.reportValidity()) return;

    const trainingId = document.querySelector("#trainingId").value;
    const existingTraining = trainingId ? getTraining(trainingId) : null;
    const now = new Date().toISOString();
    const recurrence = Number(document.querySelector("#trainingRecurrence").value);
    const trainingYear = Number(document.querySelector("#trainingYear").value);
    const training = {
      id: existingTraining?.id || createId(),
      title: titleInput.value.trim(),
      year: trainingYear,
      recurrenceMonths: Number.isFinite(recurrence) && recurrence > 0 ? recurrence : null,
      description: document.querySelector("#trainingDescription").value.trim(),
      createdAt: existingTraining?.createdAt || now,
      updatedAt: now,
    };

    const committed = await commitStateMutation(() => {
      if (existingTraining) {
        state.trainings = state.trainings.map((item) =>
          item.id === training.id ? training : item,
        );
      } else {
        state.trainings.push(training);
      }
    });
    if (!committed) return;

    elements.trainingDialog.close();
    showToast(existingTraining ? "Fortbildung wurde aktualisiert." : "Fortbildung wurde angelegt.");
  }

  function requestDeleteTraining(trainingId) {
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
    elements.appointmentForm.reset();
    document.querySelector("#appointmentId").value = "";
    document.querySelector("#appointmentTitle").setCustomValidity("");
    document.querySelector("#appointmentEndTime").setCustomValidity("");
    document.querySelector("#appointmentDate").value = todayIso();

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
      document.querySelector("#appointmentLocation").value = appointment.location;
      document.querySelector("#appointmentDescription").value = appointment.description;
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
    if (!requireAdmin()) return;
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
      location: document.querySelector("#appointmentLocation").value.trim(),
      description: document.querySelector("#appointmentDescription").value.trim(),
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
  }

  function requestDeleteAppointment(appointmentId) {
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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
    if (!requireAdmin()) return;
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

    elements.meetingDialog.close();
    showToast(existingMeeting ? "Teamsitzung wurde aktualisiert." : "Teamsitzung wurde angelegt.");

    if (!existingMeeting && meeting.expectedEmployeeIds.length > 0) {
      openAttendanceDialog(meeting.id);
    }
  }

  function requestDeleteMeeting(meetingId) {
    if (!requireAdmin()) return;
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
          (!status || status === "teilgenommen")
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

    elements.completionTraining.innerHTML = groupTrainingsByYear()
      .map(
        ([year, trainings]) => `
          <optgroup label="Jahr ${year}">
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
    if (!requireAdmin()) return;
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

  async function exportDatabase() {
    if (!requireAdmin()) return;
    await createAndDownloadBackup();
  }

  async function exportEncryptedDatabase() {
    if (!requireAdmin()) return;
    const password = window.prompt(
      "Passwort für die verschlüsselte Sicherung eingeben (mindestens 8 Zeichen):",
    );
    if (password === null) return;
    if (password.length < 8) {
      showToast("Das Sicherungspasswort muss mindestens 8 Zeichen lang sein.", "error");
      return;
    }
    const confirmation = window.prompt("Passwort zur Bestätigung erneut eingeben:");
    if (confirmation !== password) {
      showToast("Die eingegebenen Passwörter stimmen nicht überein.", "error");
      return;
    }
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

  async function createAndDownloadBackup({
    encrypted = false,
    password = "",
    prefix = "datensicherung",
    silent = false,
  } = {}) {
    const exportedAt = new Date();
    const backup = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: STATE_VERSION,
      exportedAt: exportedAt.toISOString(),
      data: state,
    };
    let fileContent = JSON.stringify(backup, null, 2);
    if (encrypted) {
      fileContent = JSON.stringify(await encryptBackup(fileContent, password), null, 2);
    }
    downloadTextFile(
      `teo-${prefix}_${fileTimestamp(exportedAt)}${
        encrypted ? ".verschluesselt" : ""
      }.json`,
      fileContent,
      "application/json;charset=utf-8",
    );
    state.settings.lastBackupAt = exportedAt.toISOString();
    appendAuditEntry(
      encrypted
        ? "Verschlüsselte Datensicherung exportiert"
        : "Datensicherung exportiert",
    );
    await persistState();
    renderAll();
    if (!silent) {
      showToast(
        encrypted
          ? "Die verschlüsselte Datensicherung wurde exportiert."
          : "Die vollständige Datensicherung wurde exportiert.",
      );
    }
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
      const password = window.prompt("Passwort der verschlüsselten Sicherung eingeben:");
      if (password === null) throw new Error("Entschlüsselung wurde abgebrochen.");
      return parseBackup(await decryptBackup(envelope, password));
    }
    return parseBackup(fileContent);
  }

  async function handleBackupFileSelection(event) {
    if (!requireAdmin()) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BACKUP_FILE_SIZE) {
      showToast("Die Sicherungsdatei ist größer als 20 MB und kann nicht importiert werden.", "error");
      return;
    }

    let importedState;
    try {
      importedState = await readBackupFile(file);
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
      `${importedState.users.length} Benutzerkonten`,
    ].join(", ");

    requestConfirmation({
      title: "Datensicherung importieren?",
      message: `Die aktuellen Daten werden vollständig durch diese Sicherung ersetzt: ${counts}. Dieser Vorgang kann nur mit einer zuvor exportierten Sicherung rückgängig gemacht werden.`,
      acceptLabel: "Daten importieren",
      tone: "primary",
      callback: async () => {
        await createAndDownloadBackup({
          prefix: "vor-import",
          silent: true,
        });
        await importDatabase(importedState);
      },
    });
  }

  async function handleBackupValidationSelection(event) {
    if (!requireAdmin()) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      showToast("Die Sicherungsdatei ist größer als 20 MB.", "error");
      return;
    }
    try {
      const checkedState = await readBackupFile(file);
      showToast(
        `Sicherung gültig: ${checkedState.employees.length} Mitarbeiter, ${checkedState.trainings.length} Fortbildungen, ${checkedState.meetings.length} Teamsitzungen, ${checkedState.appointments.length} Termine und ${checkedState.devices.length} Geräte.`,
      );
    } catch (error) {
      showToast(error.message || "Die Sicherungsdatei ist ungültig.", "error");
    }
  }

  function renderSettings() {
    elements.settingsBackupReminderDays.value = String(
      state.settings.backupReminderDays,
    );
    elements.settingsStorageBackend.value = backendMode;
    elements.settingsMariaDbApiUrl.value = backendConfig.apiUrl || "";
    elements.settingsMariaDbPassword.value = "";
    elements.settingsBackendStatus.classList.toggle(
      "is-remote",
      isMariaDbMode(),
    );
    elements.settingsBackendStatus.classList.remove("is-error");
    elements.settingsBackendStatus.innerHTML = isMariaDbMode()
      ? `<i></i> MariaDB verbunden · Revision ${remoteRevision}`
      : "<i></i> Lokal verbunden";
    renderBackendSelection();
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
      elements.settingsBackendStatus.classList.remove("is-error");
      elements.settingsBackendStatus.innerHTML = health.initialized
        ? `<i></i> Server erreichbar · Datenrevision ${health.revision}`
        : "<i></i> Server erreichbar · noch nicht eingerichtet";
      showToast("Verbindung zum TeO-Server wurde erfolgreich geprüft.");
    } catch (error) {
      elements.settingsBackendStatus.classList.add("is-error");
      elements.settingsBackendStatus.innerHTML =
        "<i></i> Server nicht erreichbar";
      showToast(error.message || "Verbindungstest fehlgeschlagen.", "error");
    } finally {
      setBackendButtonsBusy(false);
    }
  }

  async function applyStorageBackend() {
    if (!isAdmin()) return;
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
      state = normalizeState(result.state);
      backendStartupError = "";
      const remoteUser = state.users.find(
        (user) => user.id === result.user?.id,
      );
      if (!remoteUser) {
        throw new Error("Das Administratorkonto fehlt im MariaDB-Datenbestand.");
      }
      elements.settingsMariaDbPassword.value = "";
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

  async function saveGeneralSettings() {
    if (!isAdmin()) return;

    const backupReminderDays = Number(
      elements.settingsBackupReminderDays.value,
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

    if (backupReminderDays === state.settings.backupReminderDays) {
      showToast("Die Einstellungen sind bereits aktuell.");
      return;
    }

    const committed = await commitStateMutation(() => {
      state.settings.backupReminderDays = backupReminderDays;
    });
    if (committed) {
      showToast("Einstellungen wurden gespeichert.");
    }
  }

  function renderBackupStatus() {
    const lastBackupAt = state.settings.lastBackupAt;
    if (!lastBackupAt) {
      elements.backupStatus.textContent =
        "Noch keine Sicherung dokumentiert – bitte zeitnah exportieren.";
      elements.backupStatus.classList.add("is-warning");
      if (isAdmin() && !backupReminderShown) {
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
    if (isAdmin() && overdue && !backupReminderShown) {
      backupReminderShown = true;
      showToast(
        `Die letzte Datensicherung liegt ${ageDays} Tage zurück. Bitte eine neue Sicherung exportieren.`,
        "error",
      );
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
        : "Best-Effort-Speicher";

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
      await renderBrowserStorageStatus();
      if (granted) {
        showToast("Dauerhafter Browserspeicher wurde aktiviert.");
      } else {
        showToast(
          "Der Browser hat dauerhaften Speicher nicht freigegeben.",
          "error",
        );
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

    return normalizedState;
  }

  async function importDatabase(importedState) {
    if (!requireAdmin()) return;
    const previousState = state;
    state = importedState;
    if (!(await persistState())) {
      state = previousState;
      renderAll();
      return;
    }

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
      return;
    }
    renderAll();
    showToast("Die Datensicherung wurde vollständig importiert.");
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
    const total = state.trainings.length;
    const current = state.trainings.filter((training) =>
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
    return state.completions
      .filter(
        (completion) =>
          completion.employeeId === employeeId && completion.trainingId === trainingId,
      )
      .sort(
        (a, b) =>
          b.completedOn.localeCompare(a.completedOn) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      )[0];
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

    return {
      total,
      documented,
      open: Math.max(0, total - documented),
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
      const participated = records.filter(
        (record) => record.status === "teilgenommen",
      ).length;
      const absent = Math.max(0, stats.documented - participated);

      totalSlots += stats.total;
      documented += stats.documented;
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
        return {
          employeeId: employee.id,
          name: fullName(employee),
          expected: expectedMeetingIds.length,
          documented: records.length,
          open: Math.max(0, expectedMeetingIds.length - records.length),
          statusCounts: employeeStatusCounts,
          attendanceRate: percentage(
            employeeStatusCounts.teilgenommen,
            expectedMeetingIds.length,
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

  function formatDecimal(value) {
    return new Intl.NumberFormat("de-DE", {
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
    return SERVICE_WEEKENDS[value] || SERVICE_WEEKENDS.none;
  }

  function employeeStatusLabel(employee) {
    return EMPLOYMENT_STATUSES[employee?.employmentStatus] || EMPLOYMENT_STATUSES.active;
  }

  function employmentStatusOrder(status) {
    return { active: 0, onboarding: 1, inactive: 2 }[status] ?? 3;
  }

  function getActiveEmployeeEmailAddresses() {
    const seenAddresses = new Set();

    return [...activeEmployeeList()]
      .sort(sortEmployees)
      .map((employee) => employee.email.trim())
      .filter((email) => {
        if (!email) return false;
        const normalizedEmail = email.toLocaleLowerCase("de-DE");
        if (seenAddresses.has(normalizedEmail)) return false;
        seenAddresses.add(normalizedEmail);
        return true;
      });
  }

  function getActiveEmployeeEmailExport() {
    return getActiveEmployeeEmailAddresses().join(";");
  }

  function updateEmailExportButton() {
    const emailCount = getActiveEmployeeEmailAddresses().length;
    elements.copyActiveEmailsLabel.textContent = emailCount
      ? `E-Mails kopieren (${emailCount})`
      : "E-Mails kopieren";
    elements.copyActiveEmailsButton.setAttribute(
      "aria-label",
      emailCount
        ? `${emailCount} E-Mail-Adressen aktiver Mitarbeiter kopieren`
        : "E-Mail-Adressen aktiver Mitarbeiter kopieren",
    );
  }

  async function copyActiveEmployeeEmails() {
    if (!requireAdmin()) return;
    const emailAddresses = getActiveEmployeeEmailAddresses();
    if (emailAddresses.length === 0) {
      showToast("Für aktive Mitarbeiter sind keine E-Mail-Adressen hinterlegt.", "error");
      return;
    }

    const exportText = emailAddresses.join(";");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextWithFallback(exportText);
      }

      showToast(
        `${emailAddresses.length} E-Mail-Adresse${
          emailAddresses.length === 1 ? "" : "n"
        } wurden in die Zwischenablage kopiert.`,
      );
    } catch (error) {
      try {
        copyTextWithFallback(exportText);
        showToast(
          `${emailAddresses.length} E-Mail-Adresse${
            emailAddresses.length === 1 ? "" : "n"
          } wurden in die Zwischenablage kopiert.`,
        );
      } catch (fallbackError) {
        console.error("E-Mail-Adressen konnten nicht kopiert werden.", error, fallbackError);
        showToast(
          "Die Zwischenablage ist nicht verfügbar. Bitte prüfen Sie die Browserberechtigung.",
          "error",
        );
      }
    }
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

  function getEmployee(employeeId) {
    return state.employees.find((employee) => employee.id === employeeId);
  }

  function getTraining(trainingId) {
    return state.trainings.find((training) => training.id === trainingId);
  }

  function getMeeting(meetingId) {
    return state.meetings.find((meeting) => meeting.id === meetingId);
  }

  function getAppointment(appointmentId) {
    return state.appointments.find(
      (appointment) => appointment.id === appointmentId,
    );
  }

  function getDevice(deviceId) {
    return state.devices.find((device) => device.id === deviceId);
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
    const tone = (hashString(employee.id) % 4) + 1;
    return `
      <span class="avatar avatar-tone-${tone} ${small ? "avatar-sm" : ""}" aria-hidden="true">
        ${escapeHtml(initials(employee))}
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

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
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
    const formattedAmount = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits,
    }).format(amount);

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
        <svg><use href="#icon-${type === "error" ? "alert" : "check"}"></use></svg>
      </span>
      <span></span>
    `;
    toast.querySelector("span:last-child").textContent = message;
    if (type === "error") {
      toast.querySelector(".toast-icon").style.color = "#ffabb2";
      toast.querySelector(".toast-icon").style.background = "rgb(230 88 101 / 15%)";
    }

    elements.toastRegion.append(toast);
    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => toast.remove(), 190);
    }, 3400);
  }
})();
