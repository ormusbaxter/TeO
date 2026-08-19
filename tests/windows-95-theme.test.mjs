import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Das Windows-95-Thema kleidet Schaltflächen, Menü und Ecken im Stil der Zeit", async () => {
  const styles = await fs.readFile(
    path.join(projectRoot, "styles.css"),
    "utf8",
  );

  // Erhabene Kante aus vier Innenschatten - das Kennzeichen der Oberflaeche.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\.button, \.icon-button[^)]*\)\s*\{[^}]*background: #c0c0c0;[^}]*inset 1px 1px #ffffff,[^}]*inset -1px -1px #000000,/s,
  );
  // Gedrueckt kehrt sie sich um.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\.button[^)]*\):active\s*\{[^}]*inset 1px 1px #808080,/s,
  );
  // Die Standardschaltflaeche traegt den zusaetzlichen schwarzen Rahmen.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] \.button-primary[^{]*\{[^}]*0 0 0 1px #000000,/s,
  );
  // Menue: graue Flaeche, navyblaue Hervorhebung.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] \.sidebar\s*\{[^}]*background: #d4d0c8;/s,
  );
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\s*\.nav-item:hover,[\s\S]*?\)\s*\{[^}]*background: #000080;/s,
  );
  // Ecken bleiben eckig.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] \*\s*\{\s*border-radius: 0 !important;\s*\}/s,
  );
  // Nur dieses Thema stellt die Ecken ab.
  assert.equal(
    (styles.match(/border-radius: 0 !important/g) ?? []).length,
    1,
  );

  // Seitenleiste und Inhaltsfenster verwenden dasselbe Grau. Die hellen
  // Schriftfarben der dunklen Standard-Sidebar duerfen im Fuss nicht bleiben.
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\.panel, \.stat-card, \.modal, \.page-header\) \{[^}]*background: #d4d0c8;/s,
  );
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\s*\.sidebar-system-status-header strong,[\s\S]*?\.sidebar-note strong\s*\) \{\s*color: #000000;/s,
  );
  assert.match(
    styles,
    /html\[data-theme="windows-95"\] :is\(\s*\.sidebar-system-status dt,[\s\S]*?\.sidebar-note p\s*\) \{\s*color: #404040;/s,
  );
});
