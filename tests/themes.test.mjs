import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shellSource = fs.readFileSync(path.join(projectRoot, "src/app/00-shell.js"), "utf8");
const uiSource = fs.readFileSync(
  path.join(projectRoot, "src/app/20-ui-auth-admin.js"),
  "utf8",
);
const settingsHtml = fs.readFileSync(
  path.join(projectRoot, "src/html/30-device-settings-views.html"),
  "utf8",
);
const themeStyles = fs.readFileSync(
  path.join(projectRoot, "src/styles/80-themes.css"),
  "utf8",
);

const themes = [
  ["nord", "Nord"],
  ["dracula", "Dracula"],
  ["catppuccin-latte", "Catppuccin Latte"],
  ["windows-95", "Windows 95"],
];

test("die zusätzlichen Farbthemen sind vollständig auswählbar", () => {
  for (const [key, label] of themes) {
    assert.match(shellSource, new RegExp(`(?:"${key}"|${key}): "${label}"`));
    assert.match(settingsHtml, new RegExp(`<option value="${key}">${label}</option>`));
    assert.match(themeStyles, new RegExp(`html\\[data-theme="${key}"\\]`));
  }
});

test("Windows 3.11 wird nicht mehr als Farbthema angeboten", () => {
  assert.doesNotMatch(shellSource, /windows-311|Windows 3\.11/);
  assert.doesNotMatch(settingsHtml, /windows-311|Windows 3\.11/);
  assert.doesNotMatch(themeStyles, /windows-311/);
});

test("die zusätzlichen dunklen Themes aktivieren native dunkle Formulare", () => {
  assert.match(
    shellSource,
    /const DARK_THEMES = new Set\(\["dark", "nord", "dracula"\]\)/,
  );
  assert.match(uiSource, /DARK_THEMES\.has\(activeTheme\)/);
  assert.match(themeStyles, /html\[data-theme="nord"\][\s\S]*color-scheme: dark/);
  assert.match(themeStyles, /html\[data-theme="dracula"\][\s\S]*color-scheme: dark/);
});

test("Text und Primäraktionen der neuen Paletten besitzen ausreichenden Kontrast", () => {
  const pairs = [
    ["#eceff4", "#2e3440"],
    ["#2e3440", "#88c0d0"],
    ["#f8f8f2", "#282a36"],
    ["#282a36", "#bd93f9"],
    ["#4c4f69", "#eff1f5"],
    ["#ffffff", "#1e66f5"],
    ["#000000", "#d4d0c8"],
    ["#ffffff", "#000080"],
  ];

  for (const [foreground, background] of pairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${foreground} auf ${background} unterschreitet 4,5:1`,
    );
  }
});

function contrastRatio(first, second) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
