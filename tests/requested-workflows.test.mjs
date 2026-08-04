import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Die Mitarbeitersuche berücksichtigt nur Namen und kennt den kombinierten Status", async () => {
  const app = await loadAppFunctions(["normalizeState", "filteredEmployeesForTable"]);
  const active = {
    ...createEmployee("active"),
    firstName: "Anna",
    lastName: "Muster",
    profession: "Pflegefachkraft",
  };
  const onboarding = {
    ...createEmployee("onboarding"),
    firstName: "Berta",
    lastName: "Beispiel",
    employmentStatus: "onboarding",
  };
  const inactive = {
    ...createEmployee("inactive"),
    firstName: "Clara",
    lastName: "Alt",
    active: false,
    employmentStatus: "inactive",
  };
  app.setState(
    app.normalizeState(
      createMinimalState({ employees: [active, onboarding, inactive] }),
    ),
  );

  app.setEmployeeFilters({ search: "pflegefachkraft" });
  assert.equal(app.filteredEmployeesForTable().length, 0);
  app.setEmployeeFilters({ search: "muster" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.filteredEmployeesForTable().map(({ id }) => id))),
    ["active"],
  );
  app.setEmployeeFilters({ status: "employed" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.filteredEmployeesForTable().map(({ id }) => id).sort())),
    ["active", "onboarding"],
  );
});

test("Urlaubseinstellungen und Termin-Druckablauf sind vollständig verdrahtet", async () => {
  const [planningHtml, settingsHtml, dialogHtml, footerHtml, appSource, printCss] =
    await Promise.all([
      fs.readFile(path.join(projectRoot, "src/html/10-team-planning-views.html"), "utf8"),
      fs.readFile(path.join(projectRoot, "src/html/30-device-settings-views.html"), "utf8"),
      fs.readFile(path.join(projectRoot, "src/html/60-training-meeting-dialogs.html"), "utf8"),
      fs.readFile(path.join(projectRoot, "src/html/90-confirm-footer.html"), "utf8"),
      fs.readFile(path.join(projectRoot, "app.js"), "utf8"),
      fs.readFile(path.join(projectRoot, "src/styles/90-print.css"), "utf8"),
    ]);

  for (const id of [
    "vacationBaseDays",
    "vacationWeekdayAbsenceLimit",
    "vacationWeekendAbsenceLimit",
    "vacationWeekendAReferenceSaturday",
  ]) {
    assert.doesNotMatch(planningHtml, new RegExp(`id="${id}"`));
    assert.match(settingsHtml, new RegExp(`id="${id}"`));
  }
  assert.match(appSource, /VACATION_VIEW_KEY/);
  assert.match(appSource, /saveVacationViewPreference\(\)/);
  const trainingDialog = dialogHtml.slice(0, dialogHtml.indexOf('id="appointmentDialog"'));
  const appointmentDialog = dialogHtml.slice(dialogHtml.indexOf('id="appointmentDialog"'));
  assert.doesNotMatch(trainingDialog, /appointmentParticipantList|Speichern &amp; Drucken/);
  assert.match(appointmentDialog, /id="appointmentParticipantList"/);
  assert.match(appointmentDialog, /value="print"[^>]*>[\s\S]*Speichern &amp; Drucken/);
  assert.match(footerHtml, /id="appointmentPrintSurface"/);
  assert.match(appSource, /openAppointmentDialog\(button\.dataset\.deadlineAppointment\)/);
  assert.match(printCss, /@page appointment\s*{[^}]*size: A4 portrait;/s);
  assert.match(printCss, /\.appointment-print-document,\s*\.appointment-print-document \*\s*{[^}]*text-align: center;/s);
});
