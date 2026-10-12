import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmployee,
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

const timestamp = "2026-01-01T00:00:00.000Z";

// Fuer eine Teamsitzung genuegt "entschuldigt"; der Grund Krankheit waere ein
// Gesundheitsdatum. Bestandsdaten aus frueheren Fassungen duerfen dabei nicht
// verloren gehen - ein unbekannter Status wuerde den Eintrag sonst verwerfen.
test("Teilnahmestatus Krankheit geht beim Laden in Entschuldigt auf", async () => {
  const app = await loadAppFunctions([
    "normalizeState",
    "getAnnualMeetingStatistics",
  ]);
  const employee = createEmployee("employee-sick");
  const state = app.normalizeState(
    createMinimalState({
      employees: [employee],
      meetings: [
        {
          id: "meeting-2026",
          title: "Teamsitzung",
          date: "2026-05-10",
          time: "14:00",
          notes: "",
          expectedEmployeeIds: [employee.id],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      meetingAttendances: [
        {
          id: "attendance-sick",
          meetingId: "meeting-2026",
          employeeId: employee.id,
          status: "krankheit",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }),
  );

  assert.equal(state.meetingAttendances.length, 1);
  assert.equal(state.meetingAttendances[0].status, "entschuldigt");

  app.setState(state);
  const statistics = app.getAnnualMeetingStatistics(2026);
  const counts = statistics.employeeRows[0].statusCounts;
  assert.equal(counts.entschuldigt, 1);
  assert.equal(Object.hasOwn(counts, "krankheit"), false);
});

test("Krankheit ist kein auswählbarer Teilnahmestatus mehr", async () => {
  const app = await loadAppFunctions(["ATTENDANCE_STATUSES"]);
  assert.equal(Object.hasOwn(app.ATTENDANCE_STATUSES, "krankheit"), false);
  assert.equal(Object.hasOwn(app.ATTENDANCE_STATUSES, "entschuldigt"), true);
});
