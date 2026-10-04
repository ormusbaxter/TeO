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
- `src/app/*.js` – in alphabetischer Reihenfolge zu `app.js` verkettet; alle
  Dateien teilen sich **einen** IIFE-Gültigkeitsbereich, Funktionen sind also
  dateiübergreifend aufrufbar. Die Nummer gibt den Bereich an, ein Buchstabe
  die Teile eines Bereichs (`40-vacations-planner.js`, `40a-…`, `40b-…`; `-`
  sortiert vor jedem Buchstaben). Wächst eine Datei über rund 1000 Zeilen,
  wird sie an Funktionsgrenzen in aufeinanderfolgende Teile geschnitten – dann
  bleibt `app.js` bis auf Leerzeilen gleich, und genau das lässt sich prüfen:
  `diff <(grep -v '^\s*$' alt.js) <(grep -v '^\s*$' app.js)`
- `src/styles/*.css` – zu `styles.css` zusammengesetzt
- `src/shared/`, `src/meta/` – gemeinsame Bausteine für Browser und Tests

Die erzeugten Dateien gehören mit in den Commit.

```text
src/app/       Fachmodule der Browser-Anwendung
src/html/      Ansichten und Dialoge
src/styles/    Stile nach Fachbereichen, dazu Farbthemen und Druck
src/shared/    gemeinsamer Datenvertrag für Browser und Server
src/meta/      zentrale Projekt- und Datenformatversion
server/        MariaDB-API und Sitzungsverwaltung (eigenes server/README.md)
tests/         automatisierte Tests, tests/helpers/ für vm-Kontext und Browser
tools/         Build, Strukturprüfung, Release-Paket, Demodaten, Symbolsätze
vendor/        localForage 1.10.0 samt Lizenz
```

### Stylesheets

`src/styles/` ist nach den Bereichen der Anwendung geordnet, mit derselben
Nummernlogik wie `src/app/`: `00-foundation` (Farbmarken, Rücksetzen,
Elementregeln), `10-components` (Bausteine mehrerer Bereiche: Schaltflächen,
Felder, Tabellen, Dialoge, Meldungen …), `20-shell` (Seitenleiste, Seitenkopf,
Anmeldemaske), danach je Fachbereich eine Datei bis `78-settings`, dann
`80-themes` und `90-print`.

Die Reihenfolge ist Teil der Kaskade: Bausteine vor Rahmen, Rahmen vor den
Fachbereichen, Themen und Druck zuletzt. Eine Regel, die einen Baustein für
einen Bereich abwandelt, gehört deshalb in die Datei des Bereichs – dort steht
sie hinter dem Baustein und gewinnt bei gleicher Spezifität. Eine neue Regel
kommt in die Datei, deren Bereich sie betrifft, nicht ans Ende irgendeiner
Datei.

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
  Programm – `00-shell.js` öffnet die IIFE, `90c-ui-helpers.js` schließt sie –,
  und erst zusammengesetzt stimmt der Gültigkeitsbereich. Nur dort fällt eine
  ungenutzte Funktion oder ein unbekannter Bezeichner auf. `tools/lint.mjs`
  rechnet die Fundstelle anschließend auf die Quelldatei zurück, meldet also
  `src/app/40e-vacations-actions-settings.js:120` statt `app.js:10727`.
- **Playwright** für die Tests, die TeO wirklich starten. Sie beantworten die
  Frage, ob eine Regel im Stylesheet auch *wirkt* – der DOM-Ersatz kann das
  nicht, und eine abgeschriebene Regel bestätigt nur, dass dort steht, was dort
  steht. Ohne installiertes Playwright überspringen sie sich mit Ansage,
  `npm test` bleibt also grün.

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

Für alles Sichtbare `tests/helpers/browser.mjs`:

```js
const teo = await openTeO(t, { angemeldetAls: "admin" });
if (!teo) return;                       // Playwright fehlt, Test übersprungen
await teo.zeigeAnsicht("employees");
await teo.stil(".page-header", "position");   // errechneter Stilwert
await teo.farbeAn("#teoProbeToast");          // Bildpunkt, für „liegt obenauf?“
await teo.evaluate(() => …);                  // Rumpf läuft in der Seite
```

`after(closeTeO)` nicht vergessen. Jeder Aufruf von `openTeO` öffnet einen
eigenen Browserkontext mit leerem Speicher, damit Tests sich nicht gegenseitig
den Zustand verstellen; Übergänge und Animationen sind abgeschaltet, sonst misst
man den Startwert statt des Ergebnisses.

Für echte Ansichten statt nachgebauter Ausschnitte lädt `mitDemodaten` die
Demodatenbank (`demo/`, 60 Mitarbeiter). Als Funktion übergeben, bekommt sie
eine Kopie des Bestands zum Anpassen, bevor TeO startet. `urlaubsansicht`
setzt den gemerkten Zeitraum der Urlaubsplanung:

```js
const teo = await openTeO(t, {
  angemeldetAls: "admin",
  urlaubsansicht: { year: 2026, month: 7, sort: "qualification" },
  mitDemodaten(bestand) {
    bestand.vacationDays.push({ … });
  },
});
```

Die Demodatenbank bringt eine Urlaubsplanung für 2025 und 2026 mit, samt
Überträgen nach 2026. Ein Test, der eine leere oder ganz bestimmte Planung
braucht, setzt `bestand.vacationDays` selbst.

`angemeldetAls` löst nur die Sperre und setzt die Rolle an der Oberfläche –
intern ist dann niemand angemeldet, und was Rechte prüft (`isAdmin()`), sagt
nein. Für solche Fälle meldet `anmeldenAls: "admin"` bzw. `"user"` sich
wirklich an, mit den Konten der Demodatenbank, und durchläuft den
Startabgleich mit derselben Datei. Das lädt die Demodaten von selbst und
dauert etwas länger.

Soll etwas den nächsten Start überleben, öffnet der zweite Aufruf mit
`neustart: true`: Er lädt TeO im Kontext des vorigen Aufrufs neu, mit dessen
Speicher.

Zwei Fallstricke: `elementFromPoint` beantwortet **nicht**, ob etwas obenauf
liegt – eine Meldungsschicht ist durchlässig für Klicks und taucht in der
Trefferliste gar nicht auf; dafür ist `farbeAn` da. Und ein direkt gesetztes
`data-theme` lässt aus, was `applyTheme` sonst noch tut – gewechselt wird über
`[data-theme-select]`.

Am Quelltext prüfen ist dort richtig, wo es um den Bestand im Ganzen geht –
etwa ob zu jedem `showUndoToast` auch ein gemerkter Schritt gehört, ob nirgends
ein Browserdialog aufgeht, oder ob das Bauergebnis stimmt (`help-build`,
`release-notes`, `web-app-manifest`). Auch Druckregeln bleiben dort: Sie wirken
erst im Druckerzeugnis. Solche Prüfungen tragen ihre Begründung am Ort.

## Fassungsnummer

Die Fassung `major.minor.patch` steht an genau einer Stelle,
`src/meta/project-meta.mjs`; `project-meta.js`, `app.js` und `package.json`
folgen daraus. `npm run check` bricht ab, wenn sie auseinanderlaufen.

| Anlass | Befehl | Wirkung |
| --- | --- | --- |
| Neue Funktion | `npm run version:feature` | `minor` + 1, `patch` auf 0 |
| Fehlerbehebung | `npm run version:fix` | `patch` + 1 |
| Umbruch | `npm run version:major` | `major` + 1, Rest auf 0 |

Enthält eine Auslieferung Funktionen und Fehlerbehebungen, zählt sie als
Funktion. Danach `npm run build`.

## Veröffentlichen

Der Workflow `Release` legt Paket und GitHub-Release an. Der Weg dorthin:

1. `npm run version:fix|feature|major`, CHANGELOG-Eintrag, bauen, committen,
   nach `main` mergen und pushen.
2. Den Workflow `Release` auf `main` starten – ohne Eingaben. Er baut das
   Paket, lässt `npm run verify` laufen und **setzt den Tag erst danach**
   selbst; die Fassung liest er aus `package.json`.

Das Paket baut `tools/New-ReleasePackage.ps1` (lokal: `npm run
release:package`, Windows mit PowerShell). Es schreibt
`dist/TeO-<Version>-lokaler-Betrieb.zip` mit der gebauten Anwendung und ihren
Laufzeitdateien – ohne Quellen, Tests, Werkzeuge, Server und Demodaten.

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
- Die Symbolsätze Lucide, Tabler, Heroicons und Phosphor liegen als Daten in
  `src/app/00c-icon-sets.js` – erzeugt von `tools/import-icon-sets.mjs`, nicht
  von Hand bearbeiten. Die Zuordnung zu den TeO-Symbolen steht im Werkzeug;
  ein neues Symbol in der Sprite bekommt dort seine Entsprechung je Satz
  (sonst zeigt der Satz die TeO-Zeichnung). Die Pakete sind keine
  Abhängigkeit: `npm install --prefix <dir> lucide-static @tabler/icons
  heroicons @phosphor-icons/core`, dann `node tools/import-icon-sets.mjs <dir>`.
- Farben kommen aus den Farbmarken in `src/styles/00-foundation.css`; die Themes in
  `src/styles/80-themes.css` belegen dieselben Marken neu. Feste Farbwerte
  brechen die Schemata.
- Die CSP des Servers verbietet `style`-Attribute im Markup.
