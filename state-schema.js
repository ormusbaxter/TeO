(function exposeTeoStateSchema(global) {
  "use strict";
const REQUIRED_COLLECTIONS = Object.freeze([
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
  "auditLog",
]);

const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9]{4,40}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateStateShape(
  state,
  {
    maxBytes = 20 * 1024 * 1024,
    requireAdmin = true,
    maxAuditEntries = 1000,
  } = {},
) {
  const issues = [];
  if (!isRecord(state)) {
    return result(["Der Datenbestand ist kein JSON-Objekt."], 0);
  }

  const byteLength = new TextEncoder().encode(JSON.stringify(state)).byteLength;
  if (byteLength > maxBytes) {
    issues.push(`Der Datenbestand überschreitet ${maxBytes} Byte.`);
  }
  if (!Number.isSafeInteger(Number(state.version)) || Number(state.version) < 1) {
    issues.push("Die Datenformatversion ist ungültig.");
  }
  for (const collection of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(state[collection])) {
      issues.push(`Die Sammlung „${collection}“ fehlt.`);
    }
  }
  if (!isRecord(state.settings)) issues.push("Die Einstellungen fehlen.");
  if (
    !isRecord(state.catalogs) ||
    !Array.isArray(state.catalogs?.professions) ||
    !Array.isArray(state.catalogs?.qualifications)
  ) {
    issues.push("Die Stammdatenkataloge fehlen.");
  }
  if (issues.length) return result(issues, byteLength);

  const employeeIds = validateIds(state.employees, "Mitarbeiter", issues);
  const trainingIds = validateIds(state.trainings, "Fortbildungen", issues);
  const meetingIds = validateIds(state.meetings, "Teamsitzungen", issues);
  const deviceIds = validateIds(state.devices, "Geräte", issues);
  validateIds(state.completions, "Fortbildungsnachweise", issues);
  validateIds(state.meetingAttendances, "Sitzungsteilnahmen", issues);
  validateIds(state.appointments, "Termine", issues);
  validateIds(state.deviceInstructions, "Geräteeinweisungen", issues);

  validateUsers(state.users, issues, requireAdmin);
  validateEmployeeUsernames(state.employees, issues);
  validateServiceWeekends(
    state.settings.serviceWeekends,
    state.employees,
    employeeIds,
    issues,
  );
  validateReferences(state, { employeeIds, trainingIds, meetingIds, deviceIds }, issues);
  validateDates(state, issues);

  if (state.auditLog.length > maxAuditEntries) {
    issues.push(`Das Änderungsprotokoll enthält mehr als ${maxAuditEntries} Einträge.`);
  }
  const oversizedString = findOversizedString(state);
  if (oversizedString) {
    issues.push(`Der Textwert „${oversizedString}“ überschreitet 5.000 Zeichen.`);
  }
  return result(issues, byteLength);
}

function validateServiceWeekends(
  serviceWeekends,
  employees,
  employeeIds,
  issues,
) {
  if (!isRecord(serviceWeekends)) {
    issues.push("Die Konfiguration der Dienstwochenenden fehlt.");
    return;
  }
  const ownerIds = new Set();
  for (const key of ["weekend_a", "weekend_b"]) {
    const configuration = serviceWeekends[key];
    if (
      !isRecord(configuration) ||
      !String(configuration.name || "").trim() ||
      String(configuration.name).length > 50
    ) {
      issues.push(`Dienstwochenende „${key}“ ist ungültig konfiguriert.`);
      continue;
    }
    const ownerId = String(configuration.ownerId || "");
    if (ownerId && !employeeIds.has(ownerId)) {
      issues.push(`Dienstwochenende „${key}“ verweist auf unbekanntes Personal.`);
    }
    const owner = employees.find((employee) => employee.id === ownerId);
    if (
      owner &&
      ![
        "stationsleitung",
        "stellvertretendeStationsleitung",
      ].some((qualificationId) => owner.qualifications?.[qualificationId])
    ) {
      issues.push(
        `Dienstwochenende „${key}“ ist keiner Leitungsfunktion zugeordnet.`,
      );
    }
    if (
      owner &&
      String(configuration.name || "").trim() !==
        String(owner.firstName || "").trim().slice(0, 50)
    ) {
      issues.push(
        `Die Bezeichnung von Dienstwochenende „${key}“ entspricht nicht dem Vornamen der verantwortlichen Person.`,
      );
    }
    if (ownerId && ownerIds.has(ownerId)) {
      issues.push("Eine Person ist beiden Dienstwochenenden zugeordnet.");
    }
    if (ownerId) ownerIds.add(ownerId);
  }
}

function validateIds(entries, label, issues) {
  const ids = new Set();
  entries.forEach((entry, index) => {
    if (!isRecord(entry) || !ID_PATTERN.test(String(entry.id || ""))) {
      issues.push(`${label}: ungültige ID an Position ${index + 1}.`);
      return;
    }
    if (ids.has(entry.id)) issues.push(`${label}: doppelte ID „${entry.id}“.`);
    ids.add(entry.id);
  });
  return ids;
}

function validateUsers(users, issues, requireAdmin) {
  const names = new Set();
  users.forEach((user, index) => {
    const username = String(user?.username || "");
    if (
      !isRecord(user) ||
      !ID_PATTERN.test(String(user.id || "")) ||
      !USERNAME_PATTERN.test(username) ||
      !["admin", "user"].includes(user.role)
    ) {
      issues.push(`Benutzerkonten: ungültiger Eintrag an Position ${index + 1}.`);
      return;
    }
    const normalized = username.toLocaleLowerCase("de-DE");
    if (names.has(normalized)) {
      issues.push(`Benutzerkonten: doppelter Benutzername „${username}“.`);
    }
    names.add(normalized);
  });
  if (requireAdmin && !users.some((user) => user?.role === "admin")) {
    issues.push("Der Datenbestand enthält kein Administratorkonto.");
  }
}

function validateEmployeeUsernames(employees, issues) {
  const names = new Set();
  employees.forEach((employee) => {
    const username = String(employee?.username || "").trim();
    if (!username) return;
    if (!USERNAME_PATTERN.test(username)) {
      issues.push(`Mitarbeiter: ungültiger Benutzername „${username}“.`);
      return;
    }
    const normalized = username.toLocaleLowerCase("de-DE");
    if (names.has(normalized)) {
      issues.push(`Mitarbeiter: doppelter Benutzername „${username}“.`);
    }
    names.add(normalized);
  });
}

function validateReferences(state, ids, issues) {
  state.completions.forEach((entry) => {
    if (!ids.employeeIds.has(entry.employeeId) || !ids.trainingIds.has(entry.trainingId)) {
      issues.push(`Fortbildungsnachweis „${entry.id}“ enthält ungültige Referenzen.`);
    }
  });
  state.meetingAttendances.forEach((entry) => {
    if (!ids.employeeIds.has(entry.employeeId) || !ids.meetingIds.has(entry.meetingId)) {
      issues.push(`Sitzungsteilnahme „${entry.id}“ enthält ungültige Referenzen.`);
    }
  });
  [...state.vacationEntitlements, ...state.vacationDays].forEach((entry) => {
    if (!ids.employeeIds.has(entry.employeeId)) {
      issues.push(`Urlaubsdatensatz „${entry.id || "ohne ID"}“ verweist auf unbekanntes Personal.`);
    }
  });
  state.deviceInstructions.forEach((entry) => {
    if (!ids.deviceIds.has(entry.deviceId)) {
      issues.push(`Geräteeinweisung „${entry.id}“ verweist auf ein unbekanntes Gerät.`);
    }
    if (
      !Array.isArray(entry.participants) ||
      entry.participants.some(
        (participant) => !ids.employeeIds.has(participant?.employeeId),
      )
    ) {
      issues.push(`Geräteeinweisung „${entry.id}“ enthält unbekannte Teilnehmer.`);
    }
  });
}

function validateDates(state, issues) {
  const values = [
    ...state.completions.map((entry) => ["Fortbildungsnachweis", entry.completedOn]),
    ...state.meetings.map((entry) => ["Teamsitzung", entry.date]),
    ...state.appointments.map((entry) => ["Termin", entry.date]),
    ...state.deviceInstructions.map((entry) => ["Geräteeinweisung", entry.date]),
    ...state.vacationDays.map((entry) => ["Abwesenheit", entry.date]),
  ];
  values.forEach(([label, value]) => {
    if (!validIsoDate(value)) issues.push(`${label}: ungültiges Datum „${value || ""}“.`);
  });
}

function validIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function findOversizedString(value, path = "data") {
  if (typeof value === "string") return value.length > 5000 ? path : "";
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = findOversizedString(value[index], `${path}[${index}]`);
      if (result) return result;
    }
    return "";
  }
  if (!isRecord(value)) return "";
  for (const [key, child] of Object.entries(value)) {
    const result = findOversizedString(child, `${path}.${key}`);
    if (result) return result;
  }
  return "";
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function result(issues, byteLength) {
  return {
    valid: issues.length === 0,
    issues,
    byteLength,
  };
}

  global.TeOStateSchema = Object.freeze({ validateStateShape });
})(window);
