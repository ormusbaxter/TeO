import assert from "node:assert/strict";
import test from "node:test";
import {
  createMinimalState,
  loadAppFunctions,
} from "./helpers/load-app.mjs";

test("Teamsitzungen lassen sich nach dem anzuzeigenden Jahr filtern", async () => {
  const app = await loadAppFunctions([
    "getMeetingDisplayYears",
    "meetingsForDisplayYear",
  ]);
  app.setState(
    createMinimalState({
      meetings: [
        { id: "meeting-2024", date: "2024-12-10" },
        { id: "meeting-2025-a", date: "2025-01-15" },
        { id: "meeting-2025-b", date: "2025-09-20" },
        { id: "meeting-invalid", date: "ohne-datum" },
      ],
    }),
  );

  const currentYear = new Date().getFullYear();
  const years = JSON.parse(JSON.stringify(app.getMeetingDisplayYears()));
  assert.deepEqual(
    years,
    [...new Set([currentYear, 2025, 2024])].sort((a, b) => b - a),
    "Die Auswahl soll das aktuelle Jahr und alle Jahre mit Sitzungen anbieten.",
  );

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        app.meetingsForDisplayYear(2025).map((meeting) => meeting.id),
      ),
    ),
    ["meeting-2025-a", "meeting-2025-b"],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(app.meetingsForDisplayYear(2023))),
    [],
  );
});
