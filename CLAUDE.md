# Arbeitsweise in diesem Projekt

## Ablauf für jede Änderung

1. Auf dem zugewiesenen Feature-Branch entwickeln.
2. `npm run verify` (Build, Strukturprüfung, Tests) muss grün sein.
3. Auf dem Feature-Branch committen und pushen.
4. **Immer anschließend** `main` pullen, den Branch mit `--no-ff` mergen,
   erneut verifizieren und `main` pushen. Ohne Rückfrage – das ist der
   Standardabschluss jeder Aufgabe, nicht ein zusätzlicher Wunsch.

## Quellen und erzeugte Dateien

`index.html`, `app.js`, `styles.css`, `project-meta.js`, `state-schema.js` und
`service-worker.js` im Wurzelverzeichnis werden von `tools/build.mjs` erzeugt.
Änderungen gehören nach `src/`:

- `src/html/*.html` – zu `index.html` zusammengesetzt
- `src/app/*.js` – in dieser Reihenfolge zu `app.js` verkettet; alle Dateien
  teilen sich **einen** IIFE-Gültigkeitsbereich, Funktionen sind also
  dateiübergreifend aufrufbar
- `src/styles/*.css` – zu `styles.css` zusammengesetzt
- `src/shared/`, `src/meta/` – gemeinsame Bausteine für Browser und Tests

Die erzeugten Dateien gehören mit in den Commit.

## Reihenfolge bei CHANGELOG-Einträgen

`README.md` ist das Handbuch und wird samt `CHANGELOG.md` in die Hilfe der
Anwendung eingebettet. Deshalb: erst den CHANGELOG-Eintrag schreiben, **dann**
`npm run build` – sonst kennt die eingebettete Hilfe den Eintrag nicht.

Entwicklungsinterne Hinweise gehören nicht in die `README.md`, sondern hierher.

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run build` | Quellen zu den Dateien im Wurzelverzeichnis bauen |
| `npm run check` | Strukturprüfung (`tools/check.mjs`) |
| `npm test` | Testlauf (`node --test`) |
| `npm run verify` | Build, Prüfung und Tests zusammen |

## Oberfläche

- Symbole sind Strichgrafiken in der Inline-Sprite in
  `src/html/00-shell-dashboard.html` (`fill: none`, `stroke: currentColor`).
  Keine externen Symbolschriften einbinden.
- Farben kommen aus den Farbmarken in `src/styles/00-core.css`; die Themes in
  `src/styles/80-themes.css` belegen dieselben Marken neu. Feste Farbwerte
  brechen die Schemata.
- Die CSP des Servers verbietet `style`-Attribute im Markup.
