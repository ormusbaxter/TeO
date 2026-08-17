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
  "Pflegefachassistenz",
  "Medizinische/r Fachangestellte/r",
  "Stationsassistenz",
  "Arzt/Ärztin",
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
      ["Arzt/Ärztin", 5],
    ]);
    const serviceWeekend =
      profession === "Stationsassistenz" || profession === "Arzt/Ärztin"
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
      vacationEntitlements: [],
      vacationDays: [],
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
