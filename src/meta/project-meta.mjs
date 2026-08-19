// Buildnummer major.minor.patch. Zu erhoehen mit jeder Auslieferung:
//   npm run version:feature   neue Funktion   -> minor + 1, patch auf 0
//   npm run version:fix       Fehlerbehebung  -> patch + 1
//   npm run version:major     Umbruch         -> major + 1, Rest auf 0
// Enthaelt eine Auslieferung beides, zaehlt sie als Funktion.
export const PROJECT_META = Object.freeze({
  name: "TeO – Team & Employee Organizer",
  version: Object.freeze({
    major: 4,
    minor: 43,
    patch: 0,
  }),
  stateVersion: 25,
  backupFormat: "intensivteam-datensicherung",
  backupFormatVersion: 1,
});

// Die Fassung wird ohne fuehrende Nullen geschrieben: 4.41.0 statt
// 004.041.000 - dieselbe Schreibweise wie im Tag und in package.json.
export function projectBuildNumber(meta = PROJECT_META) {
  return [meta.version.major, meta.version.minor, meta.version.patch]
    .map((value) => String(value || 0))
    .join(".");
}
