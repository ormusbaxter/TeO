import assert from "node:assert/strict";
import test from "node:test";
import { createMinimalState, loadAppFunctions } from "./helpers/load-app.mjs";

function appointment(id, title, date, extra = {}) {
  return {
    id,
    title,
    date,
    startTime: "09:00",
    endTime: "",
    category: "",
    location: "",
    description: "",
    pinned: false,
    participantList: false,
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:00.000Z",
    ...extra,
  };
}

test("Die Suche im Monatsraster weist auf Treffer in anderen Monaten hin", async () => {
  const app = await loadAppFunctions(["renderAppointmentCalendarSearchNote"]);
  const state = createMinimalState();
  state.appointments = [
    appointment("a1", "Begehung Hygiene", "2026-08-20"),
    appointment("a2", "Weihnachtsfeier Station", "2026-12-11"),
    appointment("a3", "Weihnachtsfeier Klinik", "2027-12-04"),
    appointment("a4", "Jahresgespräch", "2026-08-28", { pinned: true }),
  ];
  app.setState(state);

  // Treffer nur außerhalb: Das Raster bliebe sonst wortlos leer.
  app.setAppointmentFilters({ search: "weihnachtsfeier", year: 2026, month: 8 });
  const außerhalb = app.renderAppointmentCalendarSearchNote(
    "August 2026",
    "2026-08-18",
  );
  assert.match(außerhalb, /Kein Treffer im August 2026/);
  assert.match(außerhalb, /2 weitere in anderen Monaten/);
  // Der nächstgelegene Treffer, nicht irgendeiner.
  assert.match(außerhalb, /data-appointment-search-jump="2026-12-11"/);
  assert.match(außerhalb, /Zum Treffer am 11\.12\.2026/);

  // Treffer im gezeigten Monat: kein Sprungangebot nötig.
  app.setAppointmentFilters({ search: "begehung", year: 2026, month: 8 });
  const imMonat = app.renderAppointmentCalendarSearchNote(
    "August 2026",
    "2026-08-18",
  );
  assert.match(imMonat, /1 Treffer im August 2026/);
  assert.doesNotMatch(imMonat, /data-appointment-search-jump/);

  // Ein angepinnter Termin ist kein Treffer, nur weil er sichtbar bleibt.
  app.setAppointmentFilters({ search: "jahresgespräch", year: 2026, month: 12 });
  const gepinnt = app.renderAppointmentCalendarSearchNote(
    "Dezember 2026",
    "2026-08-18",
  );
  assert.match(gepinnt, /Kein Treffer im Dezember 2026/);
  assert.match(gepinnt, /data-appointment-search-jump="2026-08-28"/);

  // Gar kein Treffer: Weg zurück anbieten.
  app.setAppointmentFilters({ search: "zahnarzt", year: 2026, month: 8 });
  const leer = app.renderAppointmentCalendarSearchNote(
    "August 2026",
    "2026-08-18",
  );
  assert.match(leer, /Kein Termin passt zur Suche/);
  assert.match(leer, /data-clear-appointment-search/);
});

test("Ein Suchbegriff gilt auch für angepinnte Termine, ein Zeitraumfilter nicht", async () => {
  const app = await loadAppFunctions(["appointmentIsVisible"]);
  const state = createMinimalState();
  const angepinnt = appointment("p1", "Jahresgespräch", "2026-07-02", {
    pinned: true,
  });
  const gewöhnlich = appointment("n1", "Begehung Hygiene", "2026-07-02");
  state.appointments = [angepinnt, gewöhnlich];
  app.setState(state);
  const heute = "2026-08-18";

  // Angepinnt bleibt sichtbar, obwohl der Zeitraumfilter nur Anstehendes zeigt.
  app.setAppointmentFilters({ period: "upcoming" });
  assert.equal(app.appointmentIsVisible(angepinnt, heute), true);
  assert.equal(app.appointmentIsVisible(gewöhnlich, heute), false);

  // Bei einer Suche zählt auch für ihn der Begriff - sonst sähe er wie ein
  // Treffer aus und die Suche wirkungslos.
  app.setAppointmentFilters({ period: "all", search: "begehung" });
  assert.equal(app.appointmentIsVisible(angepinnt, heute), false);
  assert.equal(app.appointmentIsVisible(gewöhnlich, heute), true);

  app.setAppointmentFilters({ period: "all", search: "jahresgespräch" });
  assert.equal(app.appointmentIsVisible(angepinnt, heute), true);
});
