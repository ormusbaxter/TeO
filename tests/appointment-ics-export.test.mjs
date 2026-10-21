import assert from "node:assert/strict";
import test, { after } from "node:test";
import { closeTeO, openTeO } from "./helpers/browser.mjs";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

after(closeTeO);

function appointment(id, title, date, extra = {}) {
  return {
    id,
    title,
    date,
    startTime: "09:00",
    endTime: "10:30",
    category: "",
    location: "",
    description: "",
    pinned: false,
    participantList: false,
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-02T10:15:00.000Z",
    ...extra,
  };
}

// Entfaltet umbrochene Zeilen wieder, wie es ein Kalenderprogramm tut.
function zeilen(ics) {
  return ics.replace(/\r\n /g, "").split("\r\n");
}

function ereignisse(ics) {
  return ics.split("BEGIN:VEVENT").slice(1).map((teil) => zeilen(`BEGIN:VEVENT${teil}`));
}

test("Ein Termin mit Uhrzeit steht in Berliner Zeit samt Zeitzonenbeschreibung", async () => {
  const app = await loadAppFunctions(["appointmentsIcsContent"]);
  app.setState(createMinimalState());
  const ics = app.appointmentsIcsContent(
    [
      appointment("a1", "Hygienebegehung", "2026-11-03", {
        location: "Raum 2",
        category: "begehung",
        pinned: true,
      }),
    ],
    new Date("2026-10-21T18:30:00.000Z"),
  );

  assert.ok(ics.endsWith("\r\n"), "Zeilen enden mit CRLF");
  assert.ok(!/[^\r]\n/.test(ics), "kein nacktes LF");
  const alle = zeilen(ics);
  assert.equal(alle[0], "BEGIN:VCALENDAR");
  assert.ok(alle.includes("VERSION:2.0"));
  assert.ok(alle.includes("TZID:Europe/Berlin"), "Outlook braucht die VTIMEZONE");

  const [termin] = ereignisse(ics);
  assert.ok(termin.includes("UID:a1@teo"), "gleiche UID, damit ein Reimport aktualisiert");
  assert.ok(termin.includes("DTSTAMP:20261021T183000Z"));
  assert.ok(termin.includes("LAST-MODIFIED:20260802T101500Z"));
  assert.ok(termin.includes("DTSTART;TZID=Europe/Berlin:20261103T090000"));
  assert.ok(termin.includes("DTEND;TZID=Europe/Berlin:20261103T103000"));
  assert.ok(termin.includes("SUMMARY:Hygienebegehung"));
  assert.ok(termin.includes("LOCATION:Raum 2"));
  assert.ok(termin.includes("CATEGORIES:Begehung"));
  assert.ok(termin.includes("PRIORITY:1"), "angepinnt heißt wichtig");
});

test("Ohne Uhrzeit ist der Termin ganztägig, ohne Ende nur ein Zeitpunkt", async () => {
  const app = await loadAppFunctions(["appointmentsIcsContent"]);
  app.setState(createMinimalState());
  const ics = app.appointmentsIcsContent([
    appointment("a1", "Klausurtag", "2026-12-31", { startTime: "", endTime: "" }),
    appointment("a2", "Übergabe", "2026-11-03", { endTime: "" }),
  ]);
  const [ganztags, ohneEnde] = ereignisse(ics);

  // Das Ende eines Datumswerts ist exklusiv - über den Jahreswechsel.
  assert.ok(ganztags.includes("DTSTART;VALUE=DATE:20261231"));
  assert.ok(ganztags.includes("DTEND;VALUE=DATE:20270101"));
  assert.ok(ohneEnde.includes("DTSTART;TZID=Europe/Berlin:20261103T090000"));
  assert.ok(!ohneEnde.some((zeile) => zeile.startsWith("DTEND")));
});

test("Nur ganztägige Termine brauchen keine Zeitzone", async () => {
  const app = await loadAppFunctions(["appointmentsIcsContent"]);
  app.setState(createMinimalState());
  const ics = app.appointmentsIcsContent([
    appointment("a1", "Klausurtag", "2026-12-31", { startTime: "", endTime: "" }),
  ]);
  assert.ok(!ics.includes("BEGIN:VTIMEZONE"));
});

test("Sonderzeichen werden maskiert, lange Zeilen nach 75 Oktetten umbrochen", async () => {
  const app = await loadAppFunctions(["appointmentsIcsContent"]);
  app.setState(createMinimalState());
  const beschreibung =
    "Bitte mitbringen: Ausweis, Kittel; Nachweis\\Liste\nZweite Zeile mit Umlauten äöüß ".repeat(4);
  const ics = app.appointmentsIcsContent([
    appointment("a1", "Schulung", "2026-11-03", { description: beschreibung.trim() }),
  ]);

  for (const zeile of ics.split("\r\n")) {
    assert.ok(new TextEncoder().encode(zeile).length <= 75, `zu lang: ${zeile}`);
  }
  const [termin] = ereignisse(ics);
  const text = termin.find((zeile) => zeile.startsWith("DESCRIPTION:"));
  assert.ok(
    text.startsWith(
      "DESCRIPTION:Bitte mitbringen: Ausweis\\, Kittel\\; Nachweis\\\\Liste\\nZweite Zeile mit Umlauten äöüß",
    ),
  );
  assert.ok(!/�/.test(text), "kein Zeichen beim Umbruch zerteilt");
});

test("Kalenderdatei im Terminkalender exportiert die angezeigten Termine", async (t) => {
  const teo = await openTeO(t, {
    angemeldetAls: "admin",
    mitDemodaten(bestand) {
      bestand.appointments = [
        appointment("ics-1", "Hygienebegehung", "2099-03-10"),
        appointment("ics-2", "Stationsleiterkonferenz", "2099-04-14"),
      ];
    },
  });
  if (!teo) return;
  await teo.zeigeAnsicht("appointments");
  await teo.page.fill("#appointmentSearch", "Hygiene");

  const [download] = await Promise.all([
    teo.page.waitForEvent("download"),
    teo.page.click("#exportAppointmentsIcsButton"),
  ]);
  assert.match(download.suggestedFilename(), /^teo-termin_2099-03-10_hygienebegehung\.ics$/);
  const { readFile } = await import("node:fs/promises");
  const ics = await readFile(await download.path(), "utf8");
  assert.match(ics, /SUMMARY:Hygienebegehung/);
  assert.doesNotMatch(ics, /Stationsleiterkonferenz/, "die Suche gilt auch für den Export");
});
