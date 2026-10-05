// Testdatensatz für 2026/2027: 60 fiktive Mitarbeiter einer Intensivstation
// mit fester Berufsverteilung, dazu Teamsitzungen, Pflichtfortbildungen und
// Geräteeinweisungen bis zum Stichtag sowie Termine, Memos und eine
// vollständige Urlaubsplanung für 2027.
//
// Anders als die Demo-Datenbank (generate-demo-backup.mjs), auf der die Tests
// aufbauen, steht dieser Datensatz frei: Er darf sich ändern, ohne dass ein
// Test nachzieht. Gleicher Startwert ergibt dieselbe Datei.
//
//   node tools/generate-test-data-2027.mjs [Zieldatei]
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_META } from "../src/meta/project-meta.mjs";

const SEED = 20270101;
const STATE_VERSION = PROJECT_META.stateVersion;
const BACKUP_FORMAT = PROJECT_META.backupFormat;
// Stichtag: Bis hierher reicht der Verlauf, danach beginnt die Planung.
const REFERENCE_DATE = "2026-10-05";
const EXPORTED_AT = `${REFERENCE_DATE}T12:00:00.000Z`;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(PROJECT_ROOT, "demo", "teo-testdatensatz-60-ma-2026-2027.json");

const NURSE = "Pflegefachkraft";
const ITA = "Intensivtechnische/r Assistent/in";
const MFA = "Medizinische/r Fachangestellte/r";
const WARD_ASSISTANT = "Stationsassistenz";
// 56 Pflegefachkräfte (gut 90 %), davon 17 mit Fachweiterbildung (30 %),
// 2 ITA, 1 MFA, 1 Stationsassistenz.
const PROFESSION_COUNTS = [
  [NURSE, 56],
  [ITA, 2],
  [MFA, 1],
  [WARD_ASSISTANT, 1],
];
const SPECIALIST_NURSES = 17;

const QUALIFICATIONS = [
  ["stationsleitung", "Stationsleitung"],
  ["stellvertretendeStationsleitung", "Stellvertretende Stationsleitung"],
  ["fachweiterbildungIA", "Fachweiterbildung I/A"],
  ["praxisanleiter", "Praxisanleiter/in"],
  ["hygienebeauftragter", "Hygienebeauftragte/r"],
  ["wundexperte", "Wundexperte/in"],
  ["demenzexperte", "Demenzexperte/in"],
  ["brandschutzbeauftragter", "Brandschutzbeauftragte/r"],
  ["medizinproduktebeauftragter", "Medizinproduktebeauftragte/r"],
];
const PROFESSIONS = [NURSE, ITA, "Pflegefachassistenz", MFA, WARD_ASSISTANT];
const FIRST_NAMES = [
  "Alina", "Anton", "Aylin", "Ben", "Bianca", "Carlo", "Charlotte", "Dana",
  "David", "Ella", "Emre", "Finn", "Frieda", "Gül", "Henrik", "Inga",
  "Jakob", "Janne", "Johanna", "Kai", "Katharina", "Lars", "Leonie", "Luca",
  "Marie", "Milan", "Miriam", "Nils", "Olga", "Pia", "Quentin", "Ronja",
  "Sami", "Sophie", "Till", "Tuba", "Ute", "Valentin", "Wiebke", "Zeynep",
];
const LAST_NAMES = [
  "Ahrens", "Bauer", "Brinkmann", "Busch", "Claßen", "Dahl", "Engel",
  "Fischer", "Franke", "Gerdes", "Haas", "Herrmann", "Janssen", "Kaiser",
  "Köhler", "Lange", "Lorenz", "Meißner", "Möller", "Nowak", "Otto",
  "Peters", "Rösner", "Schäfer", "Schmitt", "Schulte", "Thomsen", "Voigt",
  "Weber", "Zimmermann",
];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const ADMIN_ID = "user-admin";

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);
const pick = (values) => values[Math.floor(random() * values.length)];
const pad = (value, width = 2) => String(value).padStart(width, "0");

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function weightedPick(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;
  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }
  return entries.at(-1)[0];
}

function isoDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekday(iso) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

function randomDate(startIso, endIso) {
  const start = Date.parse(`${startIso}T12:00:00Z`);
  const end = Date.parse(`${endIso}T12:00:00Z`);
  const day = Math.floor((random() * (end - start)) / 86400000);
  return addDays(startIso, day);
}

// Verschiebt auf den nächsten Werktag.
function workday(iso) {
  let date = iso;
  while ([0, 6].includes(weekday(date))) date = addDays(date, 1);
  return date;
}

function timestamp(iso, hour = 12, minute = 0) {
  return `${iso}T${pad(hour)}:${pad(minute)}:00.000Z`;
}

function slug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/gi, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function generatedTrainingSeriesId(title) {
  const signature = String(title || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/gi, "ss")
    .toLowerCase()
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim() || "fortbildung";
  let hash = 2166136261;
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `training-series-${(hash >>> 0).toString(36)}`;
}

async function readDefaultDevices() {
  const appSource = await fs.readFile(path.join(PROJECT_ROOT, "app.js"), "utf8");
  const match = appSource.match(
    /const DEFAULT_DEVICE_CATALOG = Object\.freeze\((\[[\s\S]*?\])\);\s+const THEMES/,
  );
  if (!match) throw new Error("Der Gerätekatalog konnte nicht aus app.js gelesen werden.");
  const rows = JSON.parse(match[1].replace(/,(\s*[\]}])/g, "$1"));
  return rows.map(([manufacturer, productName, category, currentInventory, annex1], index) => ({
    id: `device-catalog-${pad(index + 1, 3)}`,
    productName,
    manufacturer,
    category,
    annex1,
    currentInventory,
    createdAt: "2026-07-26T00:00:00.000Z",
    updatedAt: "2026-07-26T00:00:00.000Z",
  }));
}

const employedOn = (employee, date) =>
  (!employee.entryDate || employee.entryDate <= date) &&
  (!employee.exitDate || date <= employee.exitDate);

// --- Mitarbeiter -----------------------------------------------------------

function createEmployees() {
  const names = shuffle(
    FIRST_NAMES.flatMap((firstName) => LAST_NAMES.map((lastName) => ({ firstName, lastName }))),
  ).slice(0, 60);
  const professions = shuffle(
    PROFESSION_COUNTS.flatMap(([profession, count]) => Array(count).fill(profession)),
  );
  // 55 aktiv, 3 in Einarbeitung (2026 eingetreten), 2 im Laufe von 2026
  // ausgetreten. Die Ausgetretenen sind Pflegefachkräfte, damit die
  // Einzelberufe vollständig im Dienst stehen.
  const nurseIndexes = professions.flatMap((profession, index) => (profession === NURSE ? [index] : []));
  const inactive = new Set(nurseIndexes.slice(0, 2));
  const onboarding = new Set(nurseIndexes.slice(2, 5));

  const employees = names.map(({ firstName, lastName }, index) => {
    const number = pad(index + 1, 3);
    const profession = professions[index];
    const status = inactive.has(index) ? "inactive" : onboarding.has(index) ? "onboarding" : "active";
    const entryDate =
      status === "onboarding"
        ? isoDate(2026, 3 + Math.floor(random() * 5), 1)
        : isoDate(1995 + Math.floor(random() * 30), Math.floor(random() * 12), 1);
    return {
      id: `employee-test-${number}`,
      firstName,
      lastName,
      username: `Test${number}`,
      birthDate: randomDate("1964-01-01", "2003-12-31"),
      phone: `+49 000 2027 ${pad(index + 1, 4)}`,
      email: `${slug(firstName)}.${slug(lastName)}.${number}@example.invalid`,
      employmentPercent:
        profession === WARD_ASSISTANT
          ? 100
          : weightedPick([[100, 46], [90, 5], [80, 22], [75, 6], [60, 10], [50, 8], [30, 3]]),
      profession,
      serviceWeekend:
        profession === WARD_ASSISTANT || profession === MFA
          ? "none"
          : weightedPick([["weekend_a", 46], ["weekend_b", 46], ["none", 8]]),
      active: status !== "inactive",
      employmentStatus: status,
      qualifications: Object.fromEntries(QUALIFICATIONS.map(([id]) => [id, false])),
      qualificationExpiries: {},
      entryDate,
      exitDate: status === "inactive" ? isoDate(2026, 2 + Math.floor(random() * 5), 0) : "",
      employmentChanges: [],
      createdAt: timestamp(entryDate < "2024-01-01" ? "2024-01-15" : entryDate, 8),
      updatedAt: EXPORTED_AT,
    };
  });

  const nurses = shuffle(
    employees.filter((employee) => employee.profession === NURSE && employee.employmentStatus === "active"),
  );
  // Die Fachweiterbildung haben 17 der 56 Pflegefachkräfte - unter ihnen
  // Leitung, Stellvertretung und die Medizinproduktebeauftragten.
  const specialists = nurses.slice(0, SPECIALIST_NURSES);
  specialists.forEach((employee) => (employee.qualifications.fachweiterbildungIA = true));
  specialists[0].qualifications.stationsleitung = true;
  specialists[0].serviceWeekend = "weekend_a";
  specialists[1].qualifications.stellvertretendeStationsleitung = true;
  specialists[1].serviceWeekend = "weekend_b";
  specialists.slice(2, 7).forEach((employee, index) => {
    employee.qualifications.medizinproduktebeauftragter = true;
    employee.qualificationExpiries.medizinproduktebeauftragter = isoDate(2027, index * 2, 28);
  });
  nurses.slice(5, 14).forEach((employee) => (employee.qualifications.praxisanleiter = true));
  nurses.slice(17, 20).forEach((employee) => (employee.qualifications.hygienebeauftragter = true));
  nurses.slice(20, 23).forEach((employee) => (employee.qualifications.wundexperte = true));
  nurses.slice(23, 25).forEach((employee) => (employee.qualifications.demenzexperte = true));
  nurses.slice(25, 28).forEach((employee) => (employee.qualifications.brandschutzbeauftragter = true));

  // Ein angekündigter Austritt Mitte 2027, zwei Änderungen des Stellenumfangs
  // zum Jahreswechsel.
  nurses[30].exitDate = "2027-06-30";
  nurses.slice(31, 33).forEach((employee) => {
    employee.employmentChanges = [
      { from: "2027-01-01", percent: employee.employmentPercent === 100 ? 75 : 100 },
    ];
  });
  return { employees, lead: specialists[0], deputy: specialists[1] };
}

// --- Teamsitzungen ---------------------------------------------------------

function createMeetings(employees) {
  const meetings = [];
  const meetingAttendances = [];
  for (let monthIndex = 0; monthIndex < 9; monthIndex += 1) {
    const first = isoDate(2026, monthIndex, 1);
    const date = addDays(first, 7 + ((2 - weekday(first) + 7) % 7));
    const expected = employees.filter((employee) => employedOn(employee, date));
    const meeting = {
      id: `meeting-test-2026-${pad(monthIndex + 1)}`,
      title: `Teamsitzung ${MONTH_NAMES[monthIndex]} 2026`,
      date,
      time: monthIndex % 3 === 0 ? "13:30" : "14:00",
      notes: "Monatliche Teamsitzung (synthetischer Testdatensatz).",
      expectedEmployeeIds: expected.map((employee) => employee.id),
      createdAt: timestamp(addDays(date, -7), 8),
      updatedAt: timestamp(date, 16),
    };
    meetings.push(meeting);
    const ordered = shuffle(expected);
    const attending = Math.round(ordered.length * (0.64 + random() * 0.2));
    ordered.forEach((employee, index) => {
      meetingAttendances.push({
        id: `attendance-2026-${pad(monthIndex + 1)}-${employee.id.slice(-3)}`,
        meetingId: meeting.id,
        employeeId: employee.id,
        status:
          index < attending
            ? "teilgenommen"
            : weightedPick([
                ["dienst", 30], ["urlaub", 24], ["krankheit", 20],
                ["schule", 12], ["entschuldigt", 11], ["unentschuldigt", 3],
              ]),
        createdAt: timestamp(date, 16, 30),
        updatedAt: timestamp(date, 16, 30),
      });
    });
  }
  return { meetings, meetingAttendances };
}

// --- Pflichtfortbildungen --------------------------------------------------

function createTrainings(employees) {
  const definitions = [
    "Reanimation und Notfallmanagement",
    "Hygiene und Infektionsprävention",
    "Brandschutzunterweisung",
    "Arbeitsschutz und Unfallverhütung",
    "Datenschutz im Stationsalltag",
    "Medizinprodukte-Sicherheit",
  ];
  const trainings = [];
  const completions = [];
  const complete = (training, employee, date) =>
    completions.push({
      id: `completion-${training.id}-${employee.id.slice(-3)}`,
      employeeId: employee.id,
      trainingId: training.id,
      completedOn: date,
      note: "",
      createdAt: timestamp(date, 15),
    });

  for (const year of [2026, 2027]) {
    definitions.forEach((title, index) => {
      const created = year === 2026 ? isoDate(2026, 0, 8 + index) : isoDate(2026, 9, 1 + index);
      trainings.push({
        id: `training-test-${year}-${pad(index + 1)}`,
        title,
        description:
          year === 2026
            ? "Jährliche Pflichtfortbildung (Testdatensatz)."
            : "Jährliche Pflichtfortbildung, für 2027 bereits angelegt (Testdatensatz).",
        year,
        recurrenceMonths: 12,
        seriesId: generatedTrainingSeriesId(title),
        createdAt: timestamp(created, 9),
        updatedAt: timestamp(created, 9),
      });
    });
  }
  // 2026 bis zum Stichtag zu 55 bis 85 % erledigt; 2027 steht noch aus.
  trainings
    .filter((training) => training.year === 2026)
    .forEach((training) => {
      const eligible = employees.filter((employee) => employedOn(employee, REFERENCE_DATE));
      const coverage = 0.55 + random() * 0.3;
      shuffle(eligible)
        .slice(0, Math.round(eligible.length * coverage))
        .forEach((employee) => {
          const start = employee.entryDate > "2026-01-15" ? employee.entryDate : "2026-01-15";
          complete(training, employee, workday(randomDate(start, "2026-09-30")));
        });
    });

  const violence = {
    id: "training-test-2026-07",
    title: "Gewaltprävention",
    description: "Alle fünf Jahre zu wiederholende Pflichtfortbildung (Testdatensatz).",
    year: 2026,
    recurrenceMonths: 60,
    seriesId: generatedTrainingSeriesId("Gewaltprävention"),
    createdAt: timestamp("2026-02-02", 9),
    updatedAt: timestamp("2026-02-02", 9),
  };
  trainings.push(violence);
  shuffle(employees.filter((employee) => employee.employmentStatus === "active"))
    .slice(0, 38)
    .forEach((employee) => complete(violence, employee, workday(randomDate("2026-02-10", "2026-09-25"))));
  return { trainings, completions };
}

// --- Geräteeinweisungen ----------------------------------------------------

function createDeviceInstructions(devices, employees) {
  const instructions = [];
  const officers = employees.filter((employee) => employee.qualifications.medizinproduktebeauftragter);
  let counter = 0;
  devices
    .filter((device) => device.currentInventory)
    .forEach((device) => {
      const eligible = employees.filter((employee) => employedOn(employee, REFERENCE_DATE));
      const coverage = device.annex1 ? 0.6 + random() * 0.3 : 0.3 + random() * 0.35;
      const participants = shuffle(eligible).slice(0, Math.max(5, Math.round(eligible.length * coverage)));
      for (let cursor = 0; cursor < participants.length; ) {
        const batch = participants.slice(cursor, cursor + 6 + Math.floor(random() * 8));
        cursor += batch.length;
        const latestEntry = batch.reduce((latest, employee) => (employee.entryDate > latest ? employee.entryDate : latest), "2026-01-12");
        const date = workday(randomDate(latestEntry, "2026-09-30"));
        const manufacturerLed = random() < (device.annex1 ? 0.35 : 0.2);
        const instructor = manufacturerLed ? null : pick(officers);
        counter += 1;
        instructions.push({
          id: `device-instruction-test-${pad(counter, 4)}`,
          deviceId: device.id,
          date,
          instructorType: manufacturerLed ? "manufacturer" : "employee",
          instructorEmployeeId: instructor?.id || "",
          instructorName: manufacturerLed
            ? `Schulungsservice ${device.manufacturer}`
            : `${instructor.firstName} ${instructor.lastName}`,
          instructorWasMedicalProductsOfficer: Boolean(instructor),
          participants: batch
            .filter((employee) => employee.id !== instructor?.id)
            .map((employee) => ({
              employeeId: employee.id,
              wasMedicalProductsOfficer: employee.qualifications.medizinproduktebeauftragter,
            })),
          createdAt: timestamp(date, 15),
        });
      }
    });
  return instructions.filter((instruction) => instruction.participants.length);
}

// --- Termine und Memos -----------------------------------------------------

function createAppointments() {
  const entries = [
    ["2026-10-14", "Begehung Hygiene", "begehung", "09:00", "11:00", "Station 3B", "Jährliche Begehung durch die Krankenhaushygiene."],
    ["2026-10-20", "Einweisung Hamilton C6 – Nachschulung", "geraeteeinweisung", "13:30", "15:00", "Besprechungsraum", "Für alle, die die Frühjahrsrunde verpasst haben.", true],
    ["2026-10-27", "Stationsleiterkonferenz", "stationsleiterkonferenz", "10:00", "12:00", "Konferenzraum Verwaltung", ""],
    ["2026-11-05", "Hospitation Anästhesie", "hospitation", "07:00", "15:00", "OP-Bereich", "Zwei Plätze, Anmeldung über die Leitung."],
    ["2026-11-11", "Schulung Delirmanagement", "schulung", "14:00", "16:00", "Seminarraum 2", "", true],
    ["2026-11-18", "Brandschutzübung", "schulung", "10:00", "11:00", "Station", "Räumungsübung mit der Werkfeuerwehr."],
    ["2026-11-25", "Abteilungsmeeting Intensivmedizin", "meeting", "15:00", "16:30", "Hörsaal", ""],
    ["2026-12-02", "Prüfung Praxisanleitung", "pruefung", "08:00", "12:00", "Seminarraum 1", "Abschlussprüfung im Rahmen der Fachweiterbildung."],
    ["2026-12-09", "Jahresgespräche – Planung", "meeting", "13:00", "14:00", "Büro Leitung", ""],
    ["2027-01-12", "Umbau Schleuse Bett 9–12", "baumassnahme", "", "", "Station 3B", "Die Betten 9 bis 12 sind bis Ende Januar gesperrt.", false, true],
    ["2027-01-20", "Neue Infusionspumpen – Einführung", "geraeteeinweisung", "13:30", "15:30", "Besprechungsraum", "Herstellereinweisung, Teilnahme für alle Pflegefachkräfte verpflichtend.", true],
    ["2027-02-03", "Stationsleiterkonferenz", "stationsleiterkonferenz", "10:00", "12:00", "Konferenzraum Verwaltung", ""],
    ["2027-02-17", "Reanimationstraining Megacode", "schulung", "08:30", "12:30", "Simulationszentrum", "", true],
    ["2027-03-10", "Begehung Arbeitsschutz", "begehung", "09:00", "10:30", "Station 3B", ""],
    ["2027-03-24", "Hospitation Notaufnahme", "hospitation", "08:00", "16:00", "Zentrale Notaufnahme", ""],
    ["2027-04-14", "Schulung ECMO-Grundlagen", "schulung", "13:00", "16:00", "Seminarraum 2", "", true],
    ["2027-05-05", "Stationsleiterkonferenz", "stationsleiterkonferenz", "10:00", "12:00", "Konferenzraum Verwaltung", ""],
    ["2027-06-09", "Prüfung Fachweiterbildung", "pruefung", "08:00", "13:00", "Bildungszentrum", ""],
  ];
  return entries.map(([date, title, category, startTime, endTime, location, description, participantList = false, pinned = false], index) => ({
    id: `appointment-test-${pad(index + 1, 3)}`,
    title,
    date,
    startTime,
    endTime,
    category,
    location,
    description,
    pinned,
    participantList,
    createdAt: timestamp(addDays(REFERENCE_DATE, -30 + index), 9),
    updatedAt: timestamp(addDays(REFERENCE_DATE, -30 + index), 9),
  }));
}

function createMemos() {
  const entries = [
    ["Dienstplan Dezember freigeben", "Aufgabe", "2026-10-20", "Wunschfrei-Einträge bis zum 15. berücksichtigen.", { pinned: true }],
    ["Urlaubsplanung 2027 abschließen", "Aufgabe", "2026-11-30", "Alle Wünsche sind eingetragen; Überschneidungen in den Sommerferien prüfen.", { pinned: true }],
    ["Neue Telefonnummer der Sterilgutversorgung", "Information", "", "Durchwahl 4711, ab sofort gültig."],
    ["Rückmeldung Fortbildungsbudget", "Rückfrage", "2026-10-31", "Pflegedirektion fragt nach dem Bedarf für 2027."],
    ["Defibrillator Bett 4 zur Wartung", "Information", "2026-10-09", "Ersatzgerät steht im Flur."],
    ["Einarbeitungskonzept überarbeiten", "Aufgabe", "2027-01-31", "Mit den Praxisanleitungen abstimmen."],
    ["Jahresbericht Hygiene", "Aufgabe", "2026-09-30", "An die Hygienekommission geschickt.", { completed: true }],
    ["Stationsausflug", "Allgemein", "2027-05-21", "Vorschlag: Kanutour, Abstimmung im Team."],
    ["Persönliche Notiz: Gespräch vorbereiten", "Allgemein", "2026-10-12", "Nur für mich sichtbar.", { visibility: "private" }],
    ["Bestellung Lagerungsmaterial", "Aufgabe", "2026-10-07", "Ist eingegangen.", { completed: true }],
  ];
  return entries.map(([title, category, date, description, extra = {}], index) => ({
    id: `memo-test-${pad(index + 1, 3)}`,
    title,
    description,
    date,
    category,
    pinned: Boolean(extra.pinned),
    completed: Boolean(extra.completed),
    visibility: extra.visibility === "private" ? "private" : "all",
    createdByUserId: ADMIN_ID,
    createdAt: timestamp(addDays(REFERENCE_DATE, -20 + index), 10),
    updatedAt: timestamp(addDays(REFERENCE_DATE, -20 + index), 10),
  }));
}

// --- Urlaubsplanung --------------------------------------------------------
// 2026 ist bis zum Stichtag genommen und bis Jahresende verplant, ein Rest
// geht als Übertrag nach 2027. 2027 ist fast vollständig geplant: der
// Übertrag bis Ende März, die Sommerferien gestaffelt. Je Tag bleibt die Zahl
// der Abwesenden unter der Tagesgrenze, damit die Tabelle nicht voller roter
// Tage steht.

const DAY_CAP = { weekday: 7, weekend: 4 };

function fullMonthsIn(employee, year) {
  let months = 0;
  for (let month = 0; month < 12; month += 1) {
    if (employedOn(employee, isoDate(year, month, 1)) && employedOn(employee, isoDate(year, month + 1, 0))) {
      months += 1;
    }
  }
  return months;
}

function percentIn(employee, year) {
  const change = employee.employmentChanges.find((entry) => entry.from.startsWith(String(year)));
  return change ? change.percent : employee.employmentPercent;
}

function createVacationPlan(employees) {
  const vacationDays = [];
  const vacationEntitlements = [];
  const perDay = new Map();
  const taken = new Set();
  let counter = 0;

  const fits = (employee, days) =>
    days.every((date) => {
      const cap = [0, 6].includes(weekday(date)) ? DAY_CAP.weekend : DAY_CAP.weekday;
      return !taken.has(`${employee.id}:${date}`) && (perDay.get(date) || 0) < cap && employedOn(employee, date);
    });
  const add = (employee, days, type) =>
    days.forEach((date) => {
      counter += 1;
      taken.add(`${employee.id}:${date}`);
      perDay.set(date, (perDay.get(date) || 0) + 1);
      vacationDays.push({
        id: `vacation-test-${pad(counter, 5)}`,
        employeeId: employee.id,
        date,
        type,
        createdAt: EXPORTED_AT,
        updatedAt: EXPORTED_AT,
      });
    });
  const workdaysFrom = (start, count) => {
    const days = [];
    for (let date = start; days.length < count && date.slice(0, 4) === start.slice(0, 4); date = addDays(date, 1)) {
      if (![0, 6].includes(weekday(date))) days.push(date);
    }
    return days;
  };
  // Legt bis zu `target` Werktage in Blöcken zwischen `from` und `to` an.
  const planBlocks = (employee, target, type, from, to) => {
    let planned = 0;
    for (let attempt = 0; attempt < 120 && planned < target; attempt += 1) {
      const length = Math.min(target - planned, weightedPick([[15, 2], [10, 4], [5, 5], [3, 3], [2, 2], [1, 2]]));
      const days = workdaysFrom(randomDate(from, to), length);
      if (days.length === length && days.at(-1) <= to && fits(employee, days)) {
        add(employee, days, type);
        planned += length;
      }
    }
    return planned;
  };

  employees
    .filter((employee) => employee.employmentStatus !== "inactive")
    .forEach((employee) => {
      const type = employee.employmentStatus === "onboarding" ? "onboardingVacation" : "vacation";
      const yearly = (year) =>
        Math.round(30 * (percentIn(employee, year) / 100) * (fullMonthsIn(employee, year) / 12) * 2) / 2;

      const additional2026 = pick([0, 0, 0, 1, 2, 3]);
      vacationEntitlements.push({ employeeId: employee.id, year: 2026, additionalDays: additional2026, carryOverDays: 0 });
      const target2026 = Math.max(0, Math.floor(yearly(2026) + additional2026 - pick([0, 0, 1, 2, 3, 5])));
      const planned2026 = planBlocks(employee, target2026, type, "2026-01-02", "2026-12-23");
      const carryOver = Math.max(0, Math.round((yearly(2026) + additional2026 - planned2026) * 2) / 2);

      const additional2027 = pick([0, 0, 0, 1, 2, 3, 4]);
      vacationEntitlements.push({
        employeeId: employee.id,
        year: 2027,
        additionalDays: additional2027,
        carryOverDays: Math.min(60, carryOver),
      });
      // Erst der Übertrag bis Ende März, dann der Jahresurlaub - zu 85 bis
      // 100 % verplant, ein Teil davon in den Sommerferien.
      const early = planBlocks(employee, Math.ceil(carryOver * (0.6 + random() * 0.4)), "vacation", "2027-01-04", "2027-03-31");
      const year2027 = Math.floor((yearly(2027) + additional2027) * (0.85 + random() * 0.15));
      const summer = planBlocks(employee, Math.min(year2027, pick([5, 10, 10, 15])), "vacation", "2027-07-19", "2027-08-31");
      planBlocks(employee, Math.max(0, year2027 - summer - Math.max(0, early - carryOver)), "vacation", "2027-01-04", "2027-12-23");

      if (random() < 0.2) planBlocks(employee, 5, "school", "2027-01-11", "2027-11-26");
      if (random() < 0.3) planBlocks(employee, 5, "nightDuty", "2027-01-04", "2027-12-17");
      if (random() < 0.12) planBlocks(employee, 2, "plannedOff", "2027-02-01", "2027-11-30");
      if (employee.serviceWeekend !== "none" && random() < 0.35) {
        let saturday = randomDate("2027-01-02", "2027-12-18");
        while (weekday(saturday) !== 6) saturday = addDays(saturday, 1);
        if (fits(employee, [saturday])) add(employee, [saturday], "mandatoryDuty");
      }
    });

  vacationDays.sort((a, b) => a.date.localeCompare(b.date) || a.employeeId.localeCompare(b.employeeId));
  vacationDays.forEach((entry, index) => (entry.id = `vacation-test-${pad(index + 1, 5)}`));
  return { vacationDays, vacationEntitlements };
}

// --- Konten und Prüfung ----------------------------------------------------

// Dieselben Passwörter wie in der Demo-Datenbank: TestAdmin / DemoStart2026!,
// TestUser1 / DemoUser2026!.
function users() {
  return [
    {
      id: ADMIN_ID,
      username: "TestAdmin",
      role: "admin",
      passwordSalt: "IsuQeqq+lG55f5qseebb0w==",
      passwordHash: "+T4fSji3T70wJDJi7CfoM+8kRrah2J2TelxOq3XT0z0=",
      mustChangePassword: false,
    },
    {
      id: "user-test-1",
      username: "TestUser1",
      role: "user",
      passwordSalt: "M9joS35LnetkzDqbmevCug==",
      passwordHash: "SfywWsFa6OsRZTdKSlO7IcS3R/kC+kMWII86a/FB7AQ=",
      mustChangePassword: false,
    },
  ];
}

function validate(data) {
  const errors = [];
  const ids = new Set(data.employees.map((employee) => employee.id));
  const count = (profession) => data.employees.filter((employee) => employee.profession === profession).length;
  const nurses = data.employees.filter((employee) => employee.profession === NURSE);
  if (ids.size !== 60) errors.push("Es müssen genau 60 Mitarbeiter sein.");
  if (count(NURSE) !== 56 || count(ITA) !== 2 || count(MFA) !== 1 || count(WARD_ASSISTANT) !== 1) {
    errors.push("Die Berufsverteilung stimmt nicht.");
  }
  if (nurses.filter((employee) => employee.qualifications.fachweiterbildungIA).length !== SPECIALIST_NURSES) {
    errors.push("Die Zahl der Fachweiterbildungen stimmt nicht.");
  }
  const references = [
    ...data.completions.map((entry) => entry.employeeId),
    ...data.meetingAttendances.map((entry) => entry.employeeId),
    ...data.vacationDays.map((entry) => entry.employeeId),
    ...data.deviceInstructions.flatMap((entry) => entry.participants.map((participant) => participant.employeeId)),
  ];
  if (references.some((id) => !ids.has(id))) errors.push("Ein Eintrag verweist auf einen unbekannten Mitarbeiter.");
  if (new Set(data.vacationDays.map((entry) => `${entry.employeeId}:${entry.date}`)).size !== data.vacationDays.length) {
    errors.push("Die Urlaubsplanung enthält doppelte Tage.");
  }
  const byId = new Map(data.employees.map((employee) => [employee.id, employee]));
  if (data.vacationDays.some((entry) => !employedOn(byId.get(entry.employeeId), entry.date))) {
    errors.push("Ein Planungseintrag liegt außerhalb der Beschäftigung.");
  }
  if (data.deviceInstructions.some((entry) => entry.date > REFERENCE_DATE) || data.completions.some((entry) => entry.completedOn > REFERENCE_DATE)) {
    errors.push("Ein Nachweis liegt nach dem Stichtag.");
  }
  if (errors.length) throw new Error(errors.join("\n"));
  const days2027 = data.vacationDays.filter((entry) => entry.date.startsWith("2027-"));
  return {
    employees: data.employees.length,
    professions: Object.fromEntries(PROFESSION_COUNTS.map(([profession]) => [profession, count(profession)])),
    fachweiterbildung: nurses.filter((employee) => employee.qualifications.fachweiterbildungIA).length,
    meetings: data.meetings.length,
    trainings: data.trainings.length,
    completions: data.completions.length,
    deviceInstructions: data.deviceInstructions.length,
    appointments: data.appointments.length,
    memos: data.memos.length,
    planEntries2026: data.vacationDays.length - days2027.length,
    planEntries2027: days2027.length,
    vacationDays2027: days2027.filter((entry) => entry.type === "vacation" || entry.type === "onboardingVacation").length,
  };
}

export async function generateTestData(outputPath = DEFAULT_OUTPUT) {
  const devices = await readDefaultDevices();
  const { employees, lead, deputy } = createEmployees();
  const { meetings, meetingAttendances } = createMeetings(employees);
  const { trainings, completions } = createTrainings(employees);
  const deviceInstructions = createDeviceInstructions(devices, employees);
  const { vacationDays, vacationEntitlements } = createVacationPlan(employees);
  const data = {
    version: STATE_VERSION,
    employees,
    trainings,
    completions,
    meetings,
    meetingAttendances,
    appointments: createAppointments(),
    memos: createMemos(),
    devices,
    deviceInstructions,
    vacationEntitlements,
    vacationDays,
    settings: {
      theme: "standard",
      lastBackupAt: EXPORTED_AT,
      backupReminderDays: 14,
      meetingAttendanceThreshold: 70,
      vacationBaseDays: 30,
      vacationWeekendAReferenceSaturday: "2026-01-03",
      vacationWeekdayAbsenceLimit: 8,
      vacationWeekendAbsenceLimit: 5,
      serviceWeekends: {
        weekend_a: { name: lead.firstName, ownerId: lead.id },
        weekend_b: { name: deputy.firstName, ownerId: deputy.id },
      },
      deadlineKinds: ["appointment", "birthday", "training", "qualification", "employment"],
    },
    users: users(),
    auditLog: [],
    catalogs: {
      professions: PROFESSIONS,
      qualifications: QUALIFICATIONS.map(([id, label]) => ({ id, label })),
      memoCategories: ["Allgemein", "Aufgabe", "Information", "Rückfrage"],
    },
  };
  const report = validate(data);
  const backup = {
    format: BACKUP_FORMAT,
    formatVersion: 1,
    appVersion: STATE_VERSION,
    exportedAt: EXPORTED_AT,
    synthetic: true,
    generator: {
      name: "TeO Testdatensatz 2026/2027",
      seed: SEED,
      note: "Alle Mitarbeiter-, Kontakt- und Verlaufsdaten sind synthetisch.",
    },
    data,
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  return { outputPath, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_OUTPUT;
  process.stdout.write(`${JSON.stringify(await generateTestData(target), null, 2)}\n`);
}
