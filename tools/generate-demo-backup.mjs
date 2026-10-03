import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_META } from "../src/meta/project-meta.mjs";

const SEED = 20260726;
const STATE_VERSION = PROJECT_META.stateVersion;
const BACKUP_FORMAT = PROJECT_META.backupFormat;
const EXPORTED_AT = "2026-07-26T12:00:00.000Z";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(
  PROJECT_ROOT,
  "demo",
  "teo-demo-datenbank-60-ma-2025-2026.json",
);

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
const PROFESSIONS = [
  "Pflegefachkraft",
  "Intensivtechnische/r Assistent/in",
  "Pflegefachassistenz",
  "Medizinische/r Fachangestellte/r",
  "Stationsassistenz",
];
const FIRST_NAMES = [
  "Ada", "Amira", "Anika", "Benedikt", "Cem", "Clara", "Daria", "Deniz",
  "Elena", "Emil", "Fatima", "Felix", "Greta", "Hannes", "Ida", "Ilja",
  "Jasmin", "Jonas", "Karla", "Kerem", "Lena", "Levin", "Maja", "Malik",
  "Mara", "Mats", "Mina", "Nele", "Nora", "Oskar", "Paula", "Rami",
  "Robin", "Samira", "Tarek", "Thea", "Vera", "Yara", "Yusuf", "Zoe",
];
const LAST_NAMES = [
  "Albers", "Bergmann", "Blum", "Brandt", "Dietrich", "Eberle", "Falk",
  "Geiger", "Hagedorn", "Hein", "Jung", "Kern", "Klose", "Kraft", "Lindner",
  "Mertens", "Naumann", "Ortmann", "Pohl", "Reuter", "Riedel", "Sander",
  "Scholz", "Seidel", "Sommer", "Stein", "Thiel", "Urban", "Vogel", "Winter",
];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

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
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
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

function dateToIso(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-");
}

function timestamp(date, hour = 12, minute = 0) {
  return `${dateToIso(date)}T${pad(hour)}:${pad(minute)}:00.000Z`;
}

function randomDate(start, end) {
  const startTime = start.getTime();
  const date = new Date(startTime + random() * (end.getTime() - startTime));
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

function trainingSeriesSignature(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/gi, "ss")
    .toLowerCase()
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function generatedTrainingSeriesId(title) {
  const signature = trainingSeriesSignature(title) || "fortbildung";
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
  if (!match) {
    throw new Error("Der Gerätekatalog konnte nicht aus app.js gelesen werden.");
  }
  const rows = JSON.parse(match[1].replace(/,(\s*[\]}])/g, "$1"));
  return rows.map(
    ([manufacturer, productName, category, currentInventory, annex1], index) => ({
      id: `device-catalog-${pad(index + 1, 3)}`,
      productName,
      manufacturer,
      category,
      annex1,
      currentInventory,
      createdAt: "2026-07-26T00:00:00.000Z",
      updatedAt: "2026-07-26T00:00:00.000Z",
    }),
  );
}

function createEmployees() {
  const namePairs = shuffle(
    FIRST_NAMES.flatMap((firstName) =>
      LAST_NAMES.map((lastName) => ({ firstName, lastName })),
    ),
  ).slice(0, 60);
  const statuses = shuffle([
    ...Array(52).fill("active"),
    ...Array(5).fill("onboarding"),
    ...Array(3).fill("inactive"),
  ]);

  const employees = namePairs.map(({ firstName, lastName }, index) => {
    const number = index + 1;
    const status = statuses[index];
    const birthDate = randomDate(
      new Date(Date.UTC(1963, 0, 1)),
      new Date(Date.UTC(2004, 11, 31)),
    );
    const profession = weightedPick([
      ["Pflegefachkraft", 78],
      ["Pflegefachassistenz", 7],
      ["Medizinische/r Fachangestellte/r", 5],
      ["Stationsassistenz", 5],
      ["Intensivtechnische/r Assistent/in", 5],
    ]);
    const serviceWeekend =
      profession === "Stationsassistenz"
        ? "none"
        : weightedPick([["weekend_a", 45], ["weekend_b", 45], ["none", 10]]);
    const qualifications = Object.fromEntries(
      QUALIFICATIONS.map(([id]) => [id, false]),
    );

    return {
      id: `employee-demo-${pad(number, 3)}`,
      firstName,
      lastName,
      username: `Demo${pad(number, 3)}`,
      birthDate: dateToIso(birthDate),
      phone: `+49 000 1000 ${pad(number, 4)}`,
      email: `${slug(firstName)}.${slug(lastName)}.${pad(number, 3)}@example.invalid`,
      employmentPercent: weightedPick([
        [100, 45], [90, 6], [80, 23], [75, 5], [70, 5], [60, 9], [50, 7],
      ]),
      profession,
      serviceWeekend,
      active: status !== "inactive",
      employmentStatus: status,
      qualifications,
      qualificationExpiries: {},
      createdAt: `2024-${pad((index % 12) + 1)}-01T08:00:00.000Z`,
      updatedAt: EXPORTED_AT,
    };
  });

  const activeNurses = shuffle(
    employees.filter(
      (employee) =>
        employee.employmentStatus !== "inactive" &&
        ["Pflegefachkraft", "Pflegefachassistenz"].includes(employee.profession),
    ),
  );
  activeNurses.slice(0, 22).forEach((employee) => {
    employee.qualifications.fachweiterbildungIA = true;
  });
  activeNurses.slice(8, 20).forEach((employee) => {
    employee.qualifications.praxisanleiter = true;
  });
  activeNurses.slice(20, 26).forEach((employee) => {
    employee.qualifications.hygienebeauftragter = true;
  });
  activeNurses.slice(26, 31).forEach((employee) => {
    employee.qualifications.wundexperte = true;
  });
  activeNurses.slice(31, 35).forEach((employee) => {
    employee.qualifications.demenzexperte = true;
  });
  activeNurses.slice(35, 40).forEach((employee) => {
    employee.qualifications.brandschutzbeauftragter = true;
  });
  activeNurses.slice(0, 10).forEach((employee, index) => {
    employee.qualifications.medizinproduktebeauftragter = true;
    employee.qualificationExpiries.medizinproduktebeauftragter =
      `202${7 + (index % 2)}-${pad((index % 12) + 1)}-28`;
  });

  return employees;
}

function meetingDate(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysUntilTuesday = (2 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, 8 + daysUntilTuesday));
}

function createMeetings(employees) {
  const expectedEmployeeIds = employees
    .filter((employee) => employee.employmentStatus !== "inactive")
    .map((employee) => employee.id);
  const meetings = [];
  const meetingAttendances = [];

  for (const year of [2025, 2026]) {
    const monthCount = year === 2026 ? 7 : 12;
    for (let monthIndex = 0; monthIndex < monthCount; monthIndex += 1) {
      const date = meetingDate(year, monthIndex);
      const meetingNumber = `${year}-${pad(monthIndex + 1)}`;
      const targetParticipation = clamp(0.66 + random() * 0.18, 0.66, 0.84);
      const meeting = {
        id: `meeting-demo-${meetingNumber}`,
        title: `Teamsitzung ${MONTH_NAMES[monthIndex]} ${year}`,
        date: dateToIso(date),
        time: monthIndex % 3 === 0 ? "13:30" : "14:00",
        notes: "Reguläre monatliche Teamsitzung (synthetischer Demo-Datensatz).",
        expectedEmployeeIds: [...expectedEmployeeIds],
        createdAt: timestamp(new Date(date.getTime() - 7 * 86400000), 8),
        updatedAt: timestamp(date, 16),
      };
      meetings.push(meeting);

      const orderedEmployees = shuffle(expectedEmployeeIds);
      const participantCount = Math.round(orderedEmployees.length * targetParticipation);
      orderedEmployees.forEach((employeeId, index) => {
        const status =
          index < participantCount
            ? "teilgenommen"
            : weightedPick([
                ["dienst", 29],
                ["urlaub", 24],
                ["krankheit", 22],
                ["schule", 11],
                ["entschuldigt", 11],
                ["unentschuldigt", 3],
              ]);
        meetingAttendances.push({
          id: `attendance-${meetingNumber}-${employeeId.replace("employee-demo-", "")}`,
          meetingId: meeting.id,
          employeeId,
          status,
          createdAt: timestamp(date, 16, 30),
          updatedAt: timestamp(date, 16, 30),
        });
      });
    }
  }
  return { meetings, meetingAttendances };
}

function createTrainings(employees) {
  const definitions = [
    ["Reanimation und Notfallmanagement", 12],
    ["Hygiene und Infektionsprävention", 12],
    ["Brandschutzunterweisung", 12],
    ["Arbeitsschutz und Unfallverhütung", 12],
    ["Datenschutz im Stationsalltag", 12],
    ["Medizinprodukte-Sicherheit", 12],
  ];
  const trainings = [];
  const completions = [];

  for (const year of [2025, 2026]) {
    definitions.forEach(([title, recurrenceMonths], index) => {
      const trainingId = `training-demo-${year}-${pad(index + 1)}`;
      const created = new Date(Date.UTC(year, 0, 8 + index));
      trainings.push({
        id: trainingId,
        title,
        description: "Synthetische Pflichtfortbildung für den Demo-Datensatz.",
        year,
        recurrenceMonths,
        seriesId: generatedTrainingSeriesId(title),
        createdAt: timestamp(created, 9),
        updatedAt: timestamp(created, 9),
      });
      const eligible = employees.filter(
        (employee) => year === 2025 || employee.employmentStatus !== "inactive",
      );
      const coverage = year === 2025 ? 0.78 + random() * 0.18 : 0.55 + random() * 0.28;
      const selected = shuffle(eligible).slice(0, Math.round(eligible.length * coverage));
      const lastDate =
        year === 2025
          ? new Date(Date.UTC(2025, 11, 15))
          : new Date(Date.UTC(2026, 6, 20));
      selected.forEach((employee) => {
        const completionDate = randomDate(new Date(Date.UTC(year, 0, 15)), lastDate);
        completions.push({
          id: `completion-${trainingId}-${employee.id.replace("employee-demo-", "")}`,
          employeeId: employee.id,
          trainingId,
          completedOn: dateToIso(completionDate),
          note: "",
          createdAt: timestamp(completionDate, 15),
        });
      });
    });
  }

  const violenceId = "training-demo-2025-07";
  const violenceCreated = new Date(Date.UTC(2025, 1, 1));
  trainings.push({
    id: violenceId,
    title: "Gewaltprävention",
    description: "Fünfjährig zu wiederholende Pflichtfortbildung (Demo).",
    year: 2025,
    recurrenceMonths: 60,
    seriesId: generatedTrainingSeriesId("Gewaltprävention"),
    createdAt: timestamp(violenceCreated, 9),
    updatedAt: timestamp(violenceCreated, 9),
  });
  shuffle(employees).slice(0, 51).forEach((employee) => {
    const completionDate = randomDate(
      new Date(Date.UTC(2025, 1, 10)),
      new Date(Date.UTC(2025, 9, 31)),
    );
    completions.push({
      id: `completion-${violenceId}-${employee.id.replace("employee-demo-", "")}`,
      employeeId: employee.id,
      trainingId: violenceId,
      completedOn: dateToIso(completionDate),
      note: "",
      createdAt: timestamp(completionDate, 15),
    });
  });

  return { trainings, completions };
}

function instructionDate(year, batchIndex) {
  const end =
    year === 2025
      ? new Date(Date.UTC(2025, 11, 15))
      : new Date(Date.UTC(2026, 6, 20));
  const start = new Date(Date.UTC(year, 0, 8));
  const date = randomDate(start, end);
  date.setUTCDate(clamp(date.getUTCDate() + (batchIndex % 3), 1, 28));
  return date;
}

function createDeviceInstructions(devices, employees) {
  const deviceInstructions = [];
  const medicalProductsOfficers = employees.filter(
    (employee) =>
      employee.employmentStatus !== "inactive" &&
      employee.qualifications.medizinproduktebeauftragter,
  );
  let instructionCounter = 0;

  for (const year of [2025, 2026]) {
    const eligibleEmployees = employees.filter(
      (employee) =>
        year === 2025 || employee.employmentStatus !== "inactive",
    );

    devices.forEach((device) => {
      if (!device.currentInventory && year === 2026) return;
      const baseCoverage =
        year === 2025
          ? device.annex1
            ? 0.76 + random() * 0.18
            : 0.55 + random() * 0.27
          : device.annex1
            ? 0.52 + random() * 0.29
            : 0.33 + random() * 0.29;
      const formerDeviceFactor = device.currentInventory ? 1 : 0.45;
      const targetCount = Math.max(
        5,
        Math.round(eligibleEmployees.length * baseCoverage * formerDeviceFactor),
      );
      const participants = shuffle(eligibleEmployees).slice(0, targetCount);
      let cursor = 0;
      let batchIndex = 0;

      while (cursor < participants.length) {
        const batchSize = 7 + Math.floor(random() * 8);
        const batch = participants.slice(cursor, cursor + batchSize);
        const date = instructionDate(year, batchIndex);
        const manufacturerLed = random() < (device.annex1 ? 0.36 : 0.22);
        const instructor = manufacturerLed ? null : pick(medicalProductsOfficers);
        instructionCounter += 1;
        deviceInstructions.push({
          id: `device-instruction-demo-${pad(instructionCounter, 4)}`,
          deviceId: device.id,
          date: dateToIso(date),
          instructorType: manufacturerLed ? "manufacturer" : "employee",
          instructorEmployeeId: instructor?.id || "",
          instructorName: manufacturerLed
            ? `Schulungsservice ${device.manufacturer}`
            : `${instructor.firstName} ${instructor.lastName}`,
          instructorWasMedicalProductsOfficer: Boolean(instructor),
          participants: batch.map((employee) => ({
            employeeId: employee.id,
            wasMedicalProductsOfficer:
              employee.qualifications.medizinproduktebeauftragter,
          })),
          createdAt: timestamp(date, 15),
        });
        cursor += batchSize;
        batchIndex += 1;
      }
    });
  }
  return deviceInstructions;
}

// Urlaubsplanung 2025 und 2026: Jahresurlaub in Blöcken von einem Tag bis zwei
// Wochen, dazu einige Schul-, Nachtdienst- und Dienstzusage-Einträge. 2025 ist
// fast ausgeschöpft; der Rest wird als Übertrag nach 2026 mitgenommen. Je Tag
// bleibt die Zahl der Abwesenden unter der Tagesgrenze, damit die Demo nicht
// voller roter Tage steht. Wochenenden bleiben frei - Urlaub zählt nur an
// Werktagen.
const DEMO_DAY_CAP = { weekday: 6, weekend: 3 };

function isoDate(year, monthIndex, day) {
  return dateToIso(new Date(Date.UTC(year, monthIndex, day)));
}

function workdaysFrom(startIso, count) {
  const days = [];
  const cursor = new Date(`${startIso}T12:00:00Z`);
  const year = cursor.getUTCFullYear();
  while (days.length < count && cursor.getUTCFullYear() === year) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(dateToIso(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function fullMonthsIn(employee, year) {
  let months = 0;
  for (let month = 0; month < 12; month += 1) {
    const first = isoDate(year, month, 1);
    const last = isoDate(year, month + 1, 0);
    if (
      (!employee.entryDate || employee.entryDate <= first) &&
      (!employee.exitDate || last <= employee.exitDate)
    ) {
      months += 1;
    }
  }
  return months;
}

// Ein- und Austritte sowie Änderungen des Stellenumfangs. Erst nach allen
// übrigen Daten erzeugt, damit diese bei gleichem Startwert unverändert
// bleiben. Ausgetretene sind inaktiv, Einzuarbeitende 2026 eingetreten.
function assignEmploymentPeriods(employees) {
  employees.forEach((employee) => {
    if (employee.employmentStatus === "onboarding") {
      employee.entryDate = isoDate(2026, Math.floor(random() * 6), 1);
    } else {
      employee.entryDate = isoDate(2002 + Math.floor(random() * 23), Math.floor(random() * 12), 1);
    }
    if (employee.employmentStatus === "inactive") {
      employee.exitDate = isoDate(2025, 3 + Math.floor(random() * 8), 0);
      if (employee.exitDate <= employee.entryDate) employee.entryDate = "2015-01-01";
    }
    employee.employmentChanges = [];
  });
  const active = employees.filter((employee) => employee.employmentStatus === "active");
  // Zwei angekündigte Austritte und einige Änderungen des Stellenumfangs.
  active.slice(0, 2).forEach((employee, index) => {
    employee.exitDate = index === 0 ? "2026-12-31" : "2027-03-31";
  });
  active.slice(2, 6).forEach((employee, index) => {
    const before = employee.employmentPercent;
    const after = before === 100 ? 75 : 100;
    employee.employmentChanges = [
      { from: index < 3 ? "2026-01-01" : "2027-01-01", percent: after },
    ];
  });
}

// Wer erst 2026 eingetreten ist, kann 2025 weder an einer Sitzung noch an
// einer Fortbildung teilgenommen haben. Die Sammlungen werden an Ort und
// Stelle bereinigt, damit die Demo zur Ein- und Austrittslogik passt.
function removeRecordsOutsideEmployment(employees, data) {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  const employedOn = (employeeId, date) => {
    const employee = byId.get(employeeId);
    return (
      employee &&
      (!employee.entryDate || employee.entryDate <= date) &&
      (!employee.exitDate || date <= employee.exitDate)
    );
  };
  const keep = (list, predicate) => {
    const kept = list.filter(predicate);
    list.splice(0, list.length, ...kept);
  };
  keep(data.completions, (completion) => employedOn(completion.employeeId, completion.completedOn));
  const meetingDate = new Map(data.meetings.map((meeting) => [meeting.id, meeting.date]));
  data.meetings.forEach((meeting) => {
    meeting.expectedEmployeeIds = meeting.expectedEmployeeIds.filter((employeeId) =>
      employedOn(employeeId, meeting.date),
    );
  });
  keep(data.meetingAttendances, (attendance) =>
    employedOn(attendance.employeeId, meetingDate.get(attendance.meetingId)),
  );
  data.deviceInstructions.forEach((instruction) => {
    instruction.participants = instruction.participants.filter((participant) =>
      employedOn(participant.employeeId, instruction.date),
    );
  });
  keep(data.deviceInstructions, (instruction) => instruction.participants.length > 0);
}

function createVacationPlan(employees) {
  const vacationDays = [];
  const vacationEntitlements = [];
  const perDay = new Map();
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const taken = new Set();
  let counter = 0;

  const fits = (employeeId, days) =>
    days.every((date) => {
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      const cap = weekday === 0 || weekday === 6 ? DEMO_DAY_CAP.weekend : DEMO_DAY_CAP.weekday;
      const employee = employeeById.get(employeeId);
      return (
        !taken.has(`${employeeId}:${date}`) &&
        (perDay.get(date) || 0) < cap &&
        (!employee.entryDate || employee.entryDate <= date) &&
        (!employee.exitDate || date <= employee.exitDate)
      );
    });
  const add = (employeeId, days, type) => {
    days.forEach((date) => {
      counter += 1;
      taken.add(`${employeeId}:${date}`);
      perDay.set(date, (perDay.get(date) || 0) + 1);
      vacationDays.push({
        id: `vacation-demo-${pad(counter, 5)}`,
        employeeId,
        date,
        type,
        createdAt: EXPORTED_AT,
        updatedAt: EXPORTED_AT,
      });
    });
  };
  // Legt bis zu `target` Tage in Blöcken an und gibt die tatsächliche Zahl zurück.
  const planBlocks = (employee, year, target, type, firstMonth = 0, lastMonth = 11) => {
    let planned = 0;
    for (let attempt = 0; attempt < 80 && planned < target; attempt += 1) {
      const length = Math.min(
        target - planned,
        weightedPick([[10, 3], [5, 5], [3, 3], [2, 2], [1, 2]]),
      );
      const month = firstMonth + Math.floor(random() * (lastMonth - firstMonth + 1));
      const start = isoDate(year, month, 1 + Math.floor(random() * 28));
      const days = workdaysFrom(start, length);
      if (days.length === length && fits(employee.id, days)) {
        add(employee.id, days, type);
        planned += length;
      }
    }
    return planned;
  };

  employees
    .filter((employee) => employee.employmentStatus !== "inactive")
    .forEach((employee) => {
      // Anteilig nach vollen Beschäftigungsmonaten - wie TeO selbst rechnet.
      const fullYear = 30 * (employee.employmentPercent / 100);
      const base = Math.round(fullYear * (fullMonthsIn(employee, 2025) / 12) * 2) / 2;
      const vacationType =
        employee.employmentStatus === "onboarding" ? "onboardingVacation" : "vacation";

      // 2025: fast ausgeschöpft, ein kleiner Rest bleibt für den Übertrag.
      const additional2025 = pick([0, 0, 1, 2, 3, 4]);
      const rest2025 = pick([0, 0, 0, 1, 2, 3, 5]);
      const planned2025 = planBlocks(
        employee,
        2025,
        Math.max(0, Math.floor(base + additional2025 - rest2025)),
        vacationType,
      );
      const carryOver = Math.max(0, Math.round((base + additional2025 - planned2025) * 2) / 2);
      vacationEntitlements.push({
        employeeId: employee.id,
        year: 2025,
        additionalDays: additional2025,
        carryOverDays: 0,
      });

      // 2026: Der Übertrag wird teils bis Ende März genommen, der Rest des
      // Jahres ist zu großen Teilen verplant.
      const additional2026 = pick([0, 0, 1, 2, 3, 4]);
      vacationEntitlements.push({
        employeeId: employee.id,
        year: 2026,
        additionalDays: additional2026,
        carryOverDays: Math.min(60, carryOver),
      });
      const earlyDays = planBlocks(employee, 2026, Math.ceil(carryOver * random()), vacationType, 0, 2);
      const share = 0.7 + random() * 0.25;
      planBlocks(
        employee,
        2026,
        Math.max(
          0,
          Math.floor(
            (fullYear * (fullMonthsIn(employee, 2026) / 12) + additional2026) *
              share,
          ) - earlyDays,
        ),
        vacationType,
      );

      // Weitere Eintragsarten - nicht bei jedem, damit die Tabelle lesbar bleibt.
      if (random() < 0.15) planBlocks(employee, pick([2025, 2026]), 5, "school");
      if (random() < 0.25) planBlocks(employee, pick([2025, 2026]), 5, "nightDuty");
      if (random() < 0.1) planBlocks(employee, 2026, 2, "plannedOff");
      if (employee.serviceWeekend !== "none" && random() < 0.3) {
        const saturday = workdaysFrom(isoDate(2026, Math.floor(random() * 12), 1), 1)[0];
        const date = new Date(`${saturday}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + ((6 - date.getUTCDay() + 7) % 7));
        const weekend = [dateToIso(date)];
        if (fits(employee.id, weekend)) add(employee.id, weekend, "mandatoryDuty");
      }
    });

  vacationDays.sort((a, b) => a.date.localeCompare(b.date) || a.employeeId.localeCompare(b.employeeId));
  return { vacationDays, vacationEntitlements };
}

function initialUsers() {
  return [
    {
      id: "user-admin",
      username: "DemoAdmin",
      role: "admin",
      passwordSalt: "IsuQeqq+lG55f5qseebb0w==",
      passwordHash: "+T4fSji3T70wJDJi7CfoM+8kRrah2J2TelxOq3XT0z0=",
      mustChangePassword: false,
    },
    {
      id: "user-botze",
      username: "DemoUser1",
      role: "user",
      passwordSalt: "M9joS35LnetkzDqbmevCug==",
      passwordHash: "SfywWsFa6OsRZTdKSlO7IcS3R/kC+kMWII86a/FB7AQ=",
      mustChangePassword: true,
    },
    {
      id: "user-ferre",
      username: "DemoUser2",
      role: "user",
      passwordSalt: "TGOkhLO5sEg+BWMPvqoFgg==",
      passwordHash: "+MSWxorSpl/CaYCPZTCxn6GA4AybIAFCgIrtdppyjYM=",
      mustChangePassword: true,
    },
  ];
}

function validateBackup(backup) {
  const { data } = backup;
  const errors = [];
  const employeeIds = new Set(data.employees.map((employee) => employee.id));
  const meetingIds = new Set(data.meetings.map((meeting) => meeting.id));
  const deviceIds = new Set(data.devices.map((device) => device.id));
  const currentDeviceIds = new Set(
    data.devices.filter((device) => device.currentInventory).map((device) => device.id),
  );

  if (backup.format !== BACKUP_FORMAT || backup.appVersion !== STATE_VERSION) {
    errors.push("Backup-Metadaten stimmen nicht mit dem aktuellen Importformat überein.");
  }
  if (data.employees.length !== 60 || employeeIds.size !== 60) {
    errors.push("Es müssen genau 60 eindeutige Mitarbeiter vorhanden sein.");
  }
  if (
    data.employees.some(
      (employee) =>
        !employee.email.endsWith("@example.invalid") ||
        !employee.phone.startsWith("+49 000 ") ||
        !/^Demo\d{3}$/.test(employee.username),
    )
  ) {
    errors.push("Mindestens ein Mitarbeiter enthält keine eindeutig synthetischen Kontaktdaten.");
  }
  if (data.meetings.length !== 19) {
    errors.push("Es werden 19 monatliche Sitzungen von Januar 2025 bis Juli 2026 erwartet.");
  }
  for (const meeting of data.meetings) {
    const attendance = data.meetingAttendances.filter(
      (entry) => entry.meetingId === meeting.id,
    );
    const participationRate =
      attendance.filter((entry) => entry.status === "teilgenommen").length /
      attendance.length;
    if (
      !meetingIds.has(meeting.id) ||
      attendance.length !== meeting.expectedEmployeeIds.length ||
      participationRate < 0.64 ||
      participationRate > 0.86
    ) {
      errors.push(`Unplausible oder unvollständige Teilnahme bei ${meeting.title}.`);
    }
  }
  if (
    data.meetingAttendances.some(
      (entry) =>
        !employeeIds.has(entry.employeeId) || !meetingIds.has(entry.meetingId),
    )
  ) {
    errors.push("Eine Teamsitzungsteilnahme verweist auf einen unbekannten Datensatz.");
  }
  if (
    data.deviceInstructions.some(
      (instruction) =>
        !deviceIds.has(instruction.deviceId) ||
        !instruction.participants.length ||
        instruction.participants.some(
          (participant) => !employeeIds.has(participant.employeeId),
        ),
    )
  ) {
    errors.push("Eine Geräteeinweisung enthält ungültige Referenzen.");
  }
  for (const year of [2025, 2026]) {
    const coveredDevices = new Set(
      data.deviceInstructions
        .filter((instruction) => Number(instruction.date.slice(0, 4)) === year)
        .map((instruction) => instruction.deviceId),
    );
    const requiredDeviceIds =
      year === 2026 ? currentDeviceIds : new Set(data.devices.map((device) => device.id));
    if ([...requiredDeviceIds].some((deviceId) => !coveredDevices.has(deviceId))) {
      errors.push(`Nicht alle relevanten Geräte besitzen Einweisungen für ${year}.`);
    }
  }
  if (
    data.deviceInstructions.some(
      (instruction) => instruction.date > "2026-07-26",
    )
  ) {
    errors.push("Eine Geräteeinweisung liegt nach dem Exportdatum.");
  }
  if (
    data.vacationDays.some(
      (entry) => !employeeIds.has(entry.employeeId) || !/^202[56]-\d{2}-\d{2}$/.test(entry.date),
    ) ||
    new Set(data.vacationDays.map((entry) => `${entry.employeeId}:${entry.date}`)).size !==
      data.vacationDays.length
  ) {
    errors.push("Die Urlaubsplanung enthält ungültige oder doppelte Einträge.");
  }
  if (errors.length) throw new Error(errors.join("\n"));

  const meetingRates = data.meetings.map((meeting) => {
    const entries = data.meetingAttendances.filter(
      (entry) => entry.meetingId === meeting.id,
    );
    return (
      entries.filter((entry) => entry.status === "teilgenommen").length /
      entries.length
    );
  });
  return {
    employees: data.employees.length,
    active: data.employees.filter((employee) => employee.employmentStatus === "active")
      .length,
    onboarding: data.employees.filter(
      (employee) => employee.employmentStatus === "onboarding",
    ).length,
    inactive: data.employees.filter(
      (employee) => employee.employmentStatus === "inactive",
    ).length,
    devices: data.devices.length,
    meetings: data.meetings.length,
    meetingAttendanceRecords: data.meetingAttendances.length,
    participationMinimum: Math.round(Math.min(...meetingRates) * 100),
    participationMaximum: Math.round(Math.max(...meetingRates) * 100),
    deviceInstructions2025: data.deviceInstructions.filter((entry) =>
      entry.date.startsWith("2025-"),
    ).length,
    deviceInstructions2026: data.deviceInstructions.filter((entry) =>
      entry.date.startsWith("2026-"),
    ).length,
    vacationDays2025: data.vacationDays.filter((entry) => entry.date.startsWith("2025-"))
      .length,
    vacationDays2026: data.vacationDays.filter((entry) => entry.date.startsWith("2026-"))
      .length,
    deviceInstructionParticipants: data.deviceInstructions.reduce(
      (sum, entry) => sum + entry.participants.length,
      0,
    ),
  };
}

export async function generateDemoBackup(outputPath = DEFAULT_OUTPUT) {
  const devices = await readDefaultDevices();
  const employees = createEmployees();
  const weekendAOwner = employees.find(
    (employee) =>
      employee.employmentStatus !== "inactive" &&
      employee.serviceWeekend === "weekend_a",
  );
  const weekendBOwner = employees.find(
    (employee) =>
      employee.employmentStatus !== "inactive" &&
      employee.serviceWeekend === "weekend_b" &&
      employee.id !== weekendAOwner?.id,
  );
  if (weekendAOwner) {
    weekendAOwner.qualifications.stationsleitung = true;
  }
  if (weekendBOwner) {
    weekendBOwner.qualifications.stellvertretendeStationsleitung = true;
  }
  const { meetings, meetingAttendances } = createMeetings(employees);
  const { trainings, completions } = createTrainings(employees);
  const deviceInstructions = createDeviceInstructions(devices, employees);
  // Zuletzt erzeugt: So bleiben alle übrigen Daten bei gleichem Startwert
  // unverändert.
  assignEmploymentPeriods(employees);
  removeRecordsOutsideEmployment(employees, {
    completions,
    meetings,
    meetingAttendances,
    deviceInstructions,
  });
  const { vacationDays, vacationEntitlements } = createVacationPlan(employees);
  const backup = {
    format: BACKUP_FORMAT,
    formatVersion: 1,
    appVersion: STATE_VERSION,
    exportedAt: EXPORTED_AT,
    synthetic: true,
    generator: {
      name: "TeO Demo-Datenbank",
      seed: SEED,
      note: "Alle Mitarbeiter-, Kontakt- und Verlaufsdaten sind synthetisch.",
    },
    data: {
      version: STATE_VERSION,
      employees,
      trainings,
      completions,
      meetings,
      meetingAttendances,
      appointments: [],
      memos: [],
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
          weekend_a: {
            name: weekendAOwner?.firstName || "Wochenende A",
            ownerId: weekendAOwner?.id || "",
          },
          weekend_b: {
            name: weekendBOwner?.firstName || "Wochenende B",
            ownerId: weekendBOwner?.id || "",
          },
        },
        deadlineKinds: ["appointment", "birthday", "training", "qualification"],
      },
      users: initialUsers(),
      auditLog: [],
      catalogs: {
        professions: PROFESSIONS,
        qualifications: QUALIFICATIONS.map(([id, label]) => ({ id, label })),
        memoCategories: ["Allgemein", "Aufgabe", "Information", "Rückfrage"],
      },
    },
  };
  const report = validateBackup(backup);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  return { outputPath, report };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] === fileURLToPath(import.meta.url)
) {
  const requestedOutput = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_OUTPUT;
  const result = await generateDemoBackup(requestedOutput);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
