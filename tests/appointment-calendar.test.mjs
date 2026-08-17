import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appointmentsHtml = fs.readFileSync(
  path.join(projectRoot, "src/html/20-calendar-training-meeting-views.html"),
  "utf8",
);
const appointmentSource = fs.readFileSync(
  path.join(projectRoot, "src/app/60-appointments-devices.js"),
  "utf8",
);
const calendarStyles = fs.readFileSync(
  path.join(projectRoot, "src/styles/85-planning-enhancements.css"),
  "utf8",
);

function createAppointment(overrides = {}) {
  return {
    id: "appointment-1",
    title: "Begehung Station",
    date: "2026-08-17",
    startTime: "09:00",
    endTime: "10:00",
    category: "begehung",
    location: "Station 1",
    description: "",
    pinned: false,
    ...overrides,
  };
}

test("die Umschaltung zwischen Liste und Kalender steht in der Oberfläche", () => {
  assert.match(appointmentsHtml, /data-appointment-view="list"/);
  assert.match(appointmentsHtml, /data-appointment-view="calendar"/);
  assert.match(appointmentsHtml, /id="appointmentCalendarGrid"/);
  assert.match(appointmentsHtml, /id="appointmentCalendarPreviousButton"/);
  assert.match(appointmentsHtml, /id="appointmentCalendarNextButton"/);
  assert.match(appointmentsHtml, /id="appointmentCalendarTodayButton"/);
});

test("das Monatsraster beginnt am Montag und füllt volle Wochen", async () => {
  const { appointmentCalendarDates } = await loadAppFunctions([
    "appointmentCalendarDates",
  ]);

  // August 2026 beginnt an einem Samstag: fünf Tage laufen dem Monat voraus.
  const august = appointmentCalendarDates(2026, 8);
  assert.equal(august.length, 42);
  assert.equal(august[0], "2026-07-27");
  assert.equal(august.at(-1), "2026-09-06");
  assert.equal(august.length % 7, 0);

  // Februar 2026 beginnt an einem Sonntag und braucht deshalb sechs Vortage.
  const february = appointmentCalendarDates(2026, 2);
  assert.equal(february.length, 35);
  assert.equal(february[0], "2026-01-26");
  assert.equal(february.at(-1), "2026-03-01");

  // Ein Monatsraster über den Jahreswechsel hinweg bleibt lückenlos.
  const january = appointmentCalendarDates(2027, 1);
  assert.equal(january[0], "2026-12-28");
  assert.ok(january.includes("2027-01-01"));
});

test("ein Termin im Kalender führt zum Bearbeiten und nennt seine Eckdaten", async () => {
  const { renderAppointmentCalendarEntry } = await loadAppFunctions([
    "renderAppointmentCalendarEntry",
  ]);
  const markup = renderAppointmentCalendarEntry(createAppointment());

  assert.match(markup, /data-appointment-card="appointment-1"/);
  assert.match(markup, /appointment-calendar-entry-time">09:00/);
  assert.match(markup, /Begehung Station/);
  assert.match(markup, /Begehung/);
  assert.match(markup, /Station 1/);
});

test("ein angepinnter Termin bleibt im Kalender als wichtig erkennbar", async () => {
  const { renderAppointmentCalendarEntry } = await loadAppFunctions([
    "renderAppointmentCalendarEntry",
  ]);
  const markup = renderAppointmentCalendarEntry(
    createAppointment({ pinned: true }),
  );

  assert.match(markup, /appointment-calendar-entry is-pinned/);
  assert.match(markup, /important-notification-icon/);
});

test("Titel aus dem Datenbestand werden im Kalender maskiert", async () => {
  const { renderAppointmentCalendarEntry } = await loadAppFunctions([
    "renderAppointmentCalendarEntry",
  ]);
  const markup = renderAppointmentCalendarEntry(
    createAppointment({ title: '<img src=x onerror="alert(1)">' }),
  );

  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /&lt;img/);
});

test("ein Tag zeigt Zustand, Feiertag und den Überlauf ab dem vierten Termin", async () => {
  const { renderAppointmentCalendarDay } = await loadAppFunctions([
    "renderAppointmentCalendarDay",
  ]);
  const entries = Array.from({ length: 4 }, (_, index) =>
    createAppointment({ id: `appointment-${index}`, title: `Termin ${index}` }),
  );
  const markup = renderAppointmentCalendarDay({
    date: new Date(2026, 9, 3, 12),
    iso: "2026-10-03",
    entries,
    inMonth: true,
    isToday: true,
    holidayName: "Tag der Deutschen Einheit",
  });

  assert.match(markup, /data-calendar-day="2026-10-03"/);
  assert.match(markup, /is-today/);
  assert.match(markup, /is-weekend/);
  assert.match(markup, /is-holiday/);
  assert.match(markup, /Tag der Deutschen Einheit/);
  assert.match(markup, /data-calendar-expand="2026-10-03"/);
  assert.match(markup, /\+1 weitere/);
});

test("ein Tag ohne Überlauf blendet die Aufklappen-Schaltfläche aus", async () => {
  const { renderAppointmentCalendarDay } = await loadAppFunctions([
    "renderAppointmentCalendarDay",
  ]);
  const markup = renderAppointmentCalendarDay({
    date: new Date(2026, 7, 18, 12),
    iso: "2026-08-18",
    entries: [createAppointment({ date: "2026-08-18" })],
    inMonth: true,
    isToday: false,
    holidayName: "",
  });

  assert.doesNotMatch(markup, /data-calendar-expand/);
  assert.doesNotMatch(markup, /is-today|is-weekend|is-holiday|is-outside/);
});

test("die gewählte Ansicht wird ohne Browserspeicher zur Liste", async () => {
  const { readAppointmentViewPreference } = await loadAppFunctions([
    "readAppointmentViewPreference",
  ]);
  const preference = readAppointmentViewPreference();

  assert.equal(preference.mode, "list");
  assert.ok(preference.year >= 2000 && preference.year <= 2100);
  assert.ok(preference.month >= 1 && preference.month <= 12);
});

test("die Kalenderansicht ist reine Darstellung und ändert den Datenbestand nicht", () => {
  const calendarSection = appointmentSource.slice(
    appointmentSource.indexOf("function renderAppointmentCalendar("),
    appointmentSource.indexOf("function handleAppointmentCalendarClick("),
  );
  assert.notEqual(calendarSection, "");
  assert.doesNotMatch(calendarSection, /commitStateMutation|state\.appointments =/);
});

test("die eingeklappte Tagesansicht und das Anzeigelimit nennen dieselbe Zahl", () => {
  assert.match(
    calendarStyles,
    /\.appointment-calendar-day-entries\s*\n?\s*li:nth-child\(n \+ 4\)/,
  );
});
