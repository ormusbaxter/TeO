// Buildnummer major.minor.patch. Zu erhoehen mit jeder Auslieferung:
//   npm run version:feature   neue Funktion   -> minor + 1, patch auf 0
//   npm run version:fix       Fehlerbehebung  -> patch + 1
//   npm run version:major     Umbruch         -> major + 1, Rest auf 0
// Enthaelt eine Auslieferung beides, zaehlt sie als Funktion.
export const PROJECT_META = Object.freeze({
  name: "TeO – Team & Employee Organizer",
  version: Object.freeze({
    major: 4,
    minor: 34,
    patch: 1,
  }),
  stateVersion: 24,
  backupFormat: "intensivteam-datensicherung",
  backupFormatVersion: 1,
});

export function projectBuildNumber(meta = PROJECT_META) {
  return [meta.version.major, meta.version.minor, meta.version.patch]
    .map((value) => String(value || 0).padStart(3, "0"))
    .join(".");
}
