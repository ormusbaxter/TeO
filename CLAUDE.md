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
| `npm run lint` | ESLint über Quellen, Werkzeuge, Tests und Server |

## Entwicklungswerkzeuge

`npm run verify` bleibt abhängigkeitsfrei: Build, Strukturprüfung und Tests
laufen mit `git clone` und `node`, ohne `npm install`. Der ausgelieferte Stand
ist davon ohnehin unberührt – `tools/New-ReleasePackage.ps1` kopiert eine feste
Liste von Dateien, kein `node_modules`.

Darüber hinaus gibt es zwei Entwicklungsabhängigkeiten. Wer sie benutzen will,
holt sie einmalig mit `npm ci`; in der CI laufen sie nach `npm run verify`.

- **ESLint** über `npm run lint`. Geprüft wird der Browserteil am erzeugten
  `app.js`, nicht an den Dateien in `src/app/`: Die sind einzeln kein gültiges
  Programm – `00-shell.js` öffnet die IIFE, `90-domain-utils.js` schließt sie –,
  und erst zusammengesetzt stimmt der Gültigkeitsbereich. Nur dort fällt eine
  ungenutzte Funktion oder ein unbekannter Bezeichner auf. `tools/lint.mjs`
  rechnet die Fundstelle anschließend auf die Quelldatei zurück, meldet also
  `src/app/40-vacations.js:1660` statt `app.js:10727`.
- **Playwright** für `tests/browser-smoke.test.mjs`. Alle übrigen Tests laufen
  ohne Browser gegen den DOM-Ersatz in `tests/helpers/load-app.mjs`; dieser eine
  startet TeO wirklich und prüft, was der Ersatz nicht kann – dass die
  Oberfläche hochkommt, die Hilfe erst bei Bedarf entsteht und die Adminsperre
  greift. Ohne installiertes Playwright überspringt er sich, `npm test` bleibt
  also grün.

## Tests schreiben

Verhalten prüfen, nicht Quelltext. `loadAppFunctions` holt Funktionen aus
`app.js` in einen vm-Kontext; `withDom: true` legt einen DOM-Ersatz dazu:

- `setDataStore(store)` – Speicher hinterlegen, damit `commitStateMutation`
  und `undoLastMutation` durchlaufen
- `dom.setQuery(selektor, element)` – Antwort auf `querySelector` festlegen,
  `null` eingeschlossen (ohne das erfindet der Ersatz für jede Abfrage ein
  Element, und Prüfungen wie „kein offener Dialog“ gehen ins Leere)
- `dom.setQueryAll(selektor, liste)` – Trefferliste hinterlegen
- `dom.setElementFromPoint(fn)` – was beim Ziehen unter dem Zeiger liegt
- `new app.HTMLElement({ tagName, dataset, classes, parentElement })` – ein
  Element mit `closest()`, `matches()`, `classList` und `dataset`

Listen aus dem vm-Kontext tragen dessen `Array`-Prototyp. `assert.deepEqual`
aus `node:assert/strict` stößt sich daran; verglichen wird deshalb über
`.join(",")`.

Am Quelltext prüfen ist dort richtig, wo es um den Bestand im Ganzen geht –
etwa ob zu jedem `showUndoToast` auch ein gemerkter Schritt gehört. Das lässt
sich an keinem einzelnen Beispiel zeigen.

## Veröffentlichen

Der Workflow `Release` legt Paket und GitHub-Release an. Der Weg dorthin:

1. `npm run version:fix|feature|major`, CHANGELOG-Eintrag, bauen, committen,
   nach `main` mergen und pushen.
2. Den Workflow `Release` auf `main` starten – ohne Eingaben. Er baut das
   Paket, lässt `npm run verify` laufen und **setzt den Tag erst danach**
   selbst; die Fassung liest er aus `package.json`.

Ein Tag von Hand ist damit nicht mehr nötig, funktioniert aber weiter: Ein
Push von `v*` startet denselben Workflow. Zeigt ein gleichnamiger Tag bereits
auf einen anderen Stand, bricht der Lauf ab, statt ihn zu verschieben.

Aus einer Sitzung von Claude Code im Web lassen sich Zweige pushen, Tags nicht
(GitHub weist `refs/tags` mit HTTP 403 ab). Deshalb der Umweg über den
Workflow: Ihn zu starten ist erlaubt, und den Tag setzt dann der Lauf selbst
mit dem `GITHUB_TOKEN`.

## Oberfläche

- Symbole sind Strichgrafiken in der Inline-Sprite in
  `src/html/00-shell-dashboard.html` (`fill: none`, `stroke: currentColor`).
  Keine externen Symbolschriften einbinden.
- Farben kommen aus den Farbmarken in `src/styles/00-core.css`; die Themes in
  `src/styles/80-themes.css` belegen dieselben Marken neu. Feste Farbwerte
  brechen die Schemata.
- Die CSP des Servers verbietet `style`-Attribute im Markup.
