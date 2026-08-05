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
const timestamp = "2026-01-01T00:00:00.000Z";

test("Nicht zutreffende Sitzungsstatus werden aus der Anwesenheitsstatistik ausgeschlossen", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getMeetingStats",
    "getAnnualMeetingStatistics",
  ]);
  const participatingEmployee = createEmployee("employee-participating");
  const notApplicableEmployee = createEmployee("employee-not-applicable");
  const state = app.normalizeState(
    createMinimalState({
      employees: [participatingEmployee, notApplicableEmployee],
      meetings: [
        {
          id: "meeting-2026",
          title: "Teamsitzung",
          date: "2026-05-10",
          time: "14:00",
          notes: "",
          expectedEmployeeIds: [
            participatingEmployee.id,
            notApplicableEmployee.id,
          ],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      meetingAttendances: [
        {
          id: "attendance-participating",
          meetingId: "meeting-2026",
          employeeId: participatingEmployee.id,
          status: "teilgenommen",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: "attendance-not-applicable",
          meetingId: "meeting-2026",
          employeeId: notApplicableEmployee.id,
          status: "nicht_zutreffend",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }),
  );
  app.setState(state);

  const meetingStats = app.getMeetingStats(state.meetings[0]);
  assert.equal(meetingStats.total, 2);
  assert.equal(meetingStats.documented, 2);
  assert.equal(meetingStats.open, 0);
  assert.equal(meetingStats.applicableTotal, 1);
  assert.equal(meetingStats.applicableDocumented, 1);

  const annualStats = app.getAnnualMeetingStatistics(2026);
  assert.equal(annualStats.statusCounts.nicht_zutreffend, 1);
  assert.equal(annualStats.totalSlots, 1);
  assert.equal(annualStats.documented, 1);
  assert.equal(annualStats.participated, 1);
  assert.equal(annualStats.absent, 0);
  assert.equal(annualStats.attendanceRate, 100);
  assert.equal(annualStats.documentationRate, 100);
  assert.deepEqual(
    JSON.parse(JSON.stringify(annualStats.employeeRows.map(({ employeeId }) => employeeId))),
    [participatingEmployee.id],
  );
});

test("Die Startseite zeigt Fortbildungsfortschritt als Prozentwert", async () => {
  const source = await fs.readFile(
    path.join(projectRoot, "src/app/30-dashboard-weekends.js"),
    "utf8",
  );
  assert.match(source, /progress-value">\$\{stats\.percent\}&thinsp;%/);
  assert.doesNotMatch(source, /progress-value">\$\{activeCount/);
});
