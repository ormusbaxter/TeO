export const PROJECT_META = Object.freeze({
  name: "TeO – Team & Employee Organizer",
  version: Object.freeze({
    major: 4,
    minor: 1,
  }),
  stateVersion: 24,
  backupFormat: "intensivteam-datensicherung",
  backupFormatVersion: 1,
});

export function projectBuildNumber(meta = PROJECT_META) {
  return [meta.version.major, meta.version.minor]
    .map((value) => String(value).padStart(3, "0"))
    .join(".");
}
