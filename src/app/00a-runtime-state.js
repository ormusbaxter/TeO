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
  // Schritte, die sich zurücknehmen lassen: der Datenbestand, wie er vor der
  // Änderung aussah, und ihre Bezeichnung für Meldung und Protokoll.
  // Der Verlauf hält die letzten MAX_UNDO_STEPS gemeldeten Schritte, der
  // jüngste zuletzt. Eine Änderung ohne Bezeichnung räumt ihn ab, ebenso ein
  // von außen geladener Bestand. redoHistory hält zurückgenommene Schritte für
  // „Wiederholen“, bis eine neue Änderung sie hinfällig macht.
  let undoHistory = [];
  let redoHistory = [];
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
  // Von Hand gewaehlte teo-autosicherung.json fuer die naechste Anmeldung.
  // Bei verknuepftem Ordner bleibt das leer: Die Anmeldung liest dort frisch.
  let startupBackupFile = null;
  // Benutzername und Passwort einer Anmeldung, die erst auf die Auswahl der
  // Datei wartet. Nach der Auswahl geht sie von selbst weiter.
  let pendingStartupCredentials = null;
  // Groesse und Aenderungszeit der zuletzt gelesenen oder selbst geschriebenen
  // teo-autosicherung.json. Weicht die Datei davon ab, hat inzwischen ein
  // anderer Arbeitsplatz geschrieben.
  let sharedBackupFileStamp = null;
  // Ordner, den die Ordnerwahl der Ersteinrichtung abgelehnt hat, weil dort
  // schon ein Datenbestand liegt. Er laesst sich stattdessen oeffnen.
  let firstSharedFolderOccupiedHandle = null;
  let browserPersistenceNotice = "";
  // Beim Laden verworfene Benutzerkonten, damit der Verlust nicht unbemerkt
  // bleibt. Wird nach dem Start einmalig gemeldet.
  let discardedUserAccounts = 0;
  let dateInputObserver = null;
  const savedVacationView = readVacationViewPreference();
  let vacationYear = savedVacationView.year;
  let vacationMonth = savedVacationView.month;
  let vacationEntryType = "vacation";
  let vacationSortMode = savedVacationView.sort;
  let vacationCrosshairEnabled = savedVacationView.crosshair;
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
