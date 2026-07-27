# TeO – Team & Employee Organizer

TeO ist eine Mitarbeiter- und Organisationsverwaltung für eine Intensivstation.
Die Anwendung unterstützt Personalstammdaten, Pflichtfortbildungen,
Teamsitzungen, Geräteeinweisungen, Urlaubsplanung, Termine und Fristen.

Diese Datei ist zugleich das Benutzerhandbuch und wird beim Build vollständig
als Online-Hilfe in die Anwendung eingebettet.

## Schnellstart

### Anwendung starten

Im lokalen Einzelplatzmodus wird `index.html` in einem aktuellen Browser
geöffnet. Beim ersten Start führt TeO durch die Einrichtung des ersten
Administratorkontos.

Für den gemeinsamen Betrieb über MariaDB wird die Anwendung über den
TeO-Server aufgerufen. Die technische Einrichtung ist im Abschnitt
„Datenspeicherung und MariaDB“ beschrieben.

### Erste sinnvolle Schritte

1. Unter **Einstellungen** das gewünschte Farbthema und die
   Sicherungserinnerung festlegen.
2. Unter **Mitarbeiter** Personalstammdaten, Stellenanteile, Berufe und
   Qualifikationen erfassen.
3. Stationsleitung und stellvertretende Stationsleitung kennzeichnen.
4. Unter **Einstellungen → Feste Dienstwochenenden** die beiden
   verantwortlichen Personen bestimmen.
5. Pflichtfortbildungen, Teamsitzungen, Termine und Geräte katalogisieren.
6. Eine erste vollständige Datensicherung exportieren.

### Grundprinzip der Speicherung

Änderungen werden im lokalen Modus automatisch in localForage beziehungsweise
IndexedDB gespeichert. Im MariaDB-Modus werden sie an den zentralen Server
übertragen. Der zusätzliche **Sicherungsexport** ist trotzdem erforderlich,
damit eine unabhängige Wiederherstellungsdatei vorhanden ist.

Nach Änderungen zeigt TeO deshalb oben im Inhaltsbereich eine Warnleiste an.
Sie verschwindet erst nach einem erfolgreichen Sicherungsexport.

## Navigation und Bedienung

### Hauptnavigation

Die Desktop-Navigation befindet sich links. Auf kleinen Bildschirmen wird am
unteren Rand eine horizontal scrollbarere Mobilnavigation angezeigt.

Folgende Bereiche stehen zur Verfügung:

- **Übersicht:** Kennzahlen, Fristenmonitor und zuletzt bearbeitete Daten
- **Mitarbeiter:** Personalstammdaten, Filter, Sammelbearbeitung und Gesamtakten
- **Wochenendverteilung:** Vergleich der beiden festen Dienstwochenenden
- **Urlaubsplanung:** Monats- und Jahresplanung von Urlaub und Abwesenheiten
- **Terminkalender:** Termine mit Ort, Uhrzeit und Beschreibung
- **Pflichtfortbildungen:** Fortbildungskatalog, Nachweise und Jahresauswertung
- **Teamsitzungen:** Sitzungen, Teilnahmen und statistische Auswertung
- **Geräteeinweisungen:** Einweisungsnachweise und Einweisungsmatrix
- **Geräteverwaltung:** Administrativer Gerätekatalog
- **Einstellungen:** Darstellung, Datenbank, Sicherungen und Stammdaten
- **Hilfe:** Dieses Benutzerhandbuch mit Volltextsuche

### Suche und Filter

Suchfelder reagieren direkt während der Eingabe. Mehrere Filter können
kombiniert werden. Filter beziehen sich immer auf die aktuell sichtbare
Ansicht.

In der Mitarbeiterverwaltung berücksichtigt auch **E-Mails kopieren** nur die
aktuell gefilterte Liste.

Der Qualifikationsfilter bietet zusätzlich **Keine Qualifikation**. Damit
lassen sich gezielt Mitarbeiter anzeigen, denen aktuell keine
Zusatzqualifikation zugewiesen ist.

### Datums- und Zeitangaben

Datumswerte werden einheitlich als `TT.MM.JJJJ` dargestellt. Intern speichert
TeO Datumswerte im ISO-Format, damit Sortierung und Berechnung zuverlässig
funktionieren.

Uhrzeiten werden im 24-Stunden-Format `HH:MM` angezeigt.

## Benutzerkonten und Berechtigungen

### Administratoren

Administratoren dürfen:

- Mitarbeiter anlegen, bearbeiten, deaktivieren und löschen
- Berufe und Zusatzqualifikationen verwalten
- Pflichtfortbildungen und Fortbildungsreihen verwalten
- Teamsitzungen und Termine verwalten
- Geräte und Geräteeinweisungen verwalten
- Urlaubsansprüche und Abwesenheitsplanung bearbeiten
- Dienstwochenenden konfigurieren und Simulationen übernehmen
- Benutzerkonten verwalten und Passwörter zurücksetzen
- Daten sichern, importieren und das Speicher-Backend wechseln

### Normale Benutzer

Normale Benutzer dürfen:

- absolvierte Pflichtfortbildungen zuweisen
- Teamsitzungsteilnahmen und Abwesenheitsgründe dokumentieren

Administrative Stammdaten und Planungsgrundlagen bleiben geschützt.

### Ersteinrichtung und Passwörter

TeO enthält keine fest eingebauten Produktivkonten oder Standardpasswörter.
Beim ersten Start wird ein Administratorkonto erstellt.

Wird das Passwort eines normalen Benutzers zurückgesetzt, erzeugt TeO ein
temporäres Passwort. Beim nächsten Anmelden muss der Benutzer ein neues
Passwort festlegen.

Passwörter werden mit PBKDF2 gehasht gespeichert. Im lokalen Modus ist die
Anmeldung ein Schutz innerhalb der Browser-Anwendung. Im MariaDB-Modus werden
Anmeldung und Rollen zusätzlich serverseitig geprüft.

## Mitarbeiterverwaltung

### Mitarbeiter anlegen

1. **Mitarbeiter** öffnen.
2. **Mitarbeiter anlegen** auswählen.
3. Vorname, Nachname, Beruf und Stellenanteil erfassen.
4. Optional Geburtsdatum, Telefonnummer, E-Mail-Adresse und Benutzername
   ergänzen.
5. Mitarbeiterstatus und festes Dienstwochenende auswählen.
6. Zusatzqualifikationen kennzeichnen und gegebenenfalls ein Ablaufdatum
   hinterlegen.
7. Speichern.

### Mitarbeiterstatus

TeO unterscheidet:

- **Aktiv:** regulär beschäftigte Person
- **In Einarbeitung:** beschäftigte Person mit gesonderter Kennzeichnung
- **Inaktiv:** wird in aktuellen Planungen und Auswahlfeldern nicht regulär
  angeboten

### Berufe und Qualifikationen

Berufe und frei definierbare Zusatzqualifikationen werden über
**Einstellungen → Berufe & Qualifikationen** verwaltet.

Die Bezeichnungen „Gesundheits- und Krankenpfleger/in“ und
„3-jährig examiniert“ werden automatisch der Berufsgruppe
„Pflegefachkraft“ zugeordnet.

Die Qualifikationen **Stationsleitung** und
**Stellvertretende Stationsleitung** sind feste Systemrollen. Sie werden für
die Dienstwochenendzuweisung benötigt und können nicht gelöscht oder
umbenannt werden.

### Filtern, Sortieren und Sammelbearbeitung

Die Mitarbeiterliste kann nach Status, Beruf, Qualifikation,
Dienstwochenende und Suchtext eingeschränkt werden.

Über die Auswahlkästchen können mehrere Mitarbeiter gleichzeitig bearbeitet
werden. Möglich sind Änderungen an Status, Beruf, Dienstwochenende und
Zusatzqualifikationen.

Verantwortliche Personen eines Dienstwochenendes können nicht durch eine
Sammelaktion in ein anderes Wochenende verschoben werden.

### Mitarbeiter-Gesamtakte

Ein Klick auf einen Mitarbeiter öffnet die Gesamtakte mit:

- Stammdaten und Kontaktdaten
- Beschäftigungsstatus und Stellenanteil
- Qualifikationen und Ablaufdaten
- Pflichtfortbildungsstatus
- Teamsitzungsteilnahmen
- Druckansicht

### E-Mail-Adressen exportieren

**E-Mails kopieren** erzeugt aus den sichtbaren, aktiven Mitarbeitern einen
einzelnen String. Die Adressen werden durch Semikolon getrennt und direkt in
die Zwischenablage kopiert.

### Telefonliste drucken

**Telefonliste drucken** öffnet eine integrierte DIN-A4-Druckvorschau innerhalb
von TeO. Es wird kein separates Browser- oder `about:blank`-Fenster benötigt.
Die Liste ist alphabetisch nach Nachname und Vorname sortiert und enthält
ausschließlich die Spalten **Name** und **Nummer**.

Abhängig von der Anzahl der Mitarbeiter verteilt TeO die Liste automatisch
auf einen, zwei oder drei nebeneinanderliegende Tabellenblöcke. Rund 60
Mitarbeiter werden auf zwei breite Blöcke mit jeweils ungefähr 30 Zeilen
verteilt. Schriftgröße und Zeilenhöhe passen sich an die Listenlänge an, damit
die DIN-A4-Seite innerhalb eines umlaufenden Randes von 15 mm möglichst
vollständig genutzt wird. Über den
Browser-Druckdialog kann sie gedruckt oder als PDF gespeichert werden.
Mitarbeiter ohne Telefonnummer bleiben mit einem leeren Eintrag sichtbar.

Der Seitenrand ist Bestandteil der Druckfläche und damit unabhängig von den
Randvorgaben des Browsers oder Druckertreibers sichtbar.

Die Druckgestaltung ist für einen Schwarzweiß-Laserdrucker ausgelegt.
Informationen werden nicht ausschließlich über Farbe vermittelt. Schwarze
Trennlinien, kontrastreiche Tabellenköpfe und sparsame Grauflächen sorgen auch
ohne aktivierten Farbdruck für eine gut lesbare Liste.

## Dienstwochenenden

### Verantwortliche Personen festlegen

Jedes der beiden Dienstwochenenden benötigt eine verantwortliche Person.
Zuweisbar sind ausschließlich Mitarbeiter mit der Qualifikation
**Stationsleitung** oder **Stellvertretende Stationsleitung**.

Die Bezeichnung eines Wochenendes entspricht automatisch dem Vornamen der
verantwortlichen Person.

Eine verantwortliche Person:

- bleibt fest ihrem eigenen Wochenende zugeordnet
- kann nicht durch Sammelbearbeitung verschoben werden
- kann nicht durch die Verteilungssimulation verschoben werden
- kann erst gelöscht oder von der letzten Leitungsrolle befreit werden,
  nachdem eine andere verantwortliche Person festgelegt wurde

### Verteilung auswerten

Die Wochenendansicht vergleicht:

- Vollzeitäquivalente
- kumulierte Stellenanteile
- absolute Mitarbeiterzahl
- Personen in Einarbeitung
- Fachweiterbildung I/A
- Praxisanleiter

### Verteilung simulieren

Die Simulation versucht, die beiden Wochenenden anhand der genannten
Kennzahlen möglichst gleichmäßig zu verteilen und zugleich möglichst wenige
bestehende Zuordnungen zu verändern.

Mitarbeiter ohne festes Dienstwochenende werden nicht automatisch zugeordnet.
Die Simulation verändert zunächst keine Daten. Eine Übernahme muss gesondert
ausgewählt und nochmals bestätigt werden.

## Urlaubs- und Abwesenheitsplanung

### Urlaubsanspruch

Der Jahresanspruch setzt sich zusammen aus:

- konfigurierbarem Grundurlaub einer Vollzeitkraft
- Stellenanteil des Mitarbeiters
- individuell erarbeitetem Zusatzurlaub durch Schichtdienst

Die fünf Summenspalten **Basis**, **Zusatz**, **Anspruch**, **Geplant** und
**Rest** bleiben beim horizontalen Scrollen fixiert.

### Planungseinträge

Folgende Eintragsarten stehen zur Verfügung:

- Urlaub
- Urlaub Einarbeitung
- Schule, Weiterbildung oder Universität
- unbezahlter Urlaub
- externer Einsatz
- frei geplant
- verpflichtende Dienstzusage

**Urlaub Einarbeitung** wird nicht auf die tägliche Abwesenheitsgrenze und
nicht auf den regulären Urlaubsverbrauch angerechnet.

**Frei geplant** zählt als Abwesenheit, verbraucht aber keinen Urlaubstag.

### Monatsplanung

1. Jahr und Monat auswählen.
2. Gewünschte Eintragsart festlegen.
3. In der Zeile des Mitarbeiters auf den entsprechenden Tag klicken.
4. Ein erneuter Klick beziehungsweise die Auswahl „Kein Eintrag“ entfernt
   den Planungseintrag.

Die Kopfzeile bleibt beim vertikalen Scrollen sichtbar. Wochenenden,
Feiertage, Schulferien und die beiden Dienstwochenenden werden farblich
unterschieden.

### Abwesenheitsgrenzen

Standardmäßig gelten:

- Werktage: höchstens 8 gleichzeitig abwesende Mitarbeiter
- Wochenenden und Feiertage: höchstens 5 gleichzeitig abwesende Mitarbeiter

Beide Grenzwerte sind konfigurierbar. Eine Überplanung bleibt möglich, wird
aber deutlich rot markiert.

### Dienstwochenenden und Kompensation

Urlaub auf dem eigenen Dienstwochenende wirkt auf die
Abwesenheitsberechnung. Eine verpflichtende Dienstzusage eines Mitarbeiters
aus dem jeweils anderen Wochenende kann diesen Effekt kompensieren.

### Jahresübersicht je Mitarbeiter

Ein Klick auf den Mitarbeiternamen öffnet eine Jahresmatrix:

- Monate in der ersten Spalte
- Kalendertage in der Kopfzeile
- Wochenenden und Dienstwochenenden farblich markiert
- alle Abwesenheiten und Dienstzusagen tageweise sichtbar

### Feiertage und Schulferien

Gesetzliche Feiertage in Nordrhein-Westfalen werden automatisch berechnet.
Die amtlich festgelegten NRW-Schulferien werden angezeigt. Örtlich
unterschiedliche bewegliche Ferientage sind nicht enthalten.

## Terminkalender und Fristenmonitor

### Termine anlegen

Ein Termin benötigt mindestens:

- Titel
- Datum

Optional können Uhrzeit von/bis, Ort und Beschreibung hinterlegt werden.

### Fristenmonitor

Der Fristenmonitor auf der Übersichtsseite zeigt:

- anstehende Termine
- Geburtstage
- fällige und überfällige Pflichtfortbildungen
- ablaufende Zusatzqualifikationen

Der Zeitraum kann auf 30, 60 oder 90 Tage eingestellt werden. Kategorien
lassen sich einzeln ein- oder ausblenden.

Geburtstage erscheinen mit Name, erreichtem Lebensjahr und vollständigem
Geburtsdatum.

## Pflichtfortbildungen

### Fortbildungskatalog

Beim Anlegen einer Pflichtfortbildung werden Titel, Einführungsjahr,
Beschreibung und Wiederholungsintervall festgelegt.

Das angegebene Jahr ist das Einführungsjahr im Pflichtkatalog. Eine
Fortbildung steht ab diesem Jahr auch in späteren Jahren zur Verfügung.

### Wiederholungsintervalle

Standardmäßig gilt eine jährliche Wiederholung. Für Gewaltprävention sind
standardmäßig fünf Jahre vorgesehen. Andere Intervalle können ebenfalls
festgelegt werden.

Wiederkehrende Einträge desselben Themas werden zu einer Fortbildungsreihe
verbunden. Der neueste gültige Nachweis bestimmt die nächste Fälligkeit der
gesamten Reihe.

### Abschluss dokumentieren

1. **Pflichtfortbildungen** öffnen.
2. **Abschluss eintragen** wählen.
3. Fortbildung auswählen.
4. Abschlussdatum erfassen.
5. Einen oder mehrere aktive Mitarbeiter auswählen.
6. Speichern.

Historische Nachweise können anschließend korrigiert oder gelöscht werden.

### Jahresauswertung

Die Jahresmatrix zeigt:

- aktive Mitarbeiter in der ersten Spalte
- Pflichtfortbildungen in der Kopfzeile
- grünes Häkchen für erfüllt
- rotes Kreuz für offen

Mehrjährig gültige Nachweise erfüllen auch nachfolgende Auswertungsjahre.
Die Matrix kann gedruckt, als PDF gespeichert oder Excel-kompatibel als CSV
exportiert werden.

## Teamsitzungen

### Sitzung anlegen

Administratoren erfassen Titel, Datum, Uhrzeit und Notizen. Die Sitzungen
werden chronologisch sortiert.

### Teilnahme effizient dokumentieren

Für das aktive Team stehen folgende Statuswerte zur Verfügung:

- teilgenommen
- Urlaub
- Dienst
- Krankheit
- Schule
- entschuldigt
- unentschuldigt

Über die Sammelaktion kann zunächst allen sichtbaren Mitarbeitern ein Status
zugewiesen werden. Anschließend müssen nur noch Ausnahmen einzeln geändert
werden.

### Statistische Auswertung

Die jahresbezogene Auswertung enthält:

- durchschnittliche Teilnahmequote
- Verteilung der Abwesenheitsgründe
- Teilnahmequote je Mitarbeiter
- konfigurierbare Mindestquote
- CSV-Export

## Geräteverwaltung und Geräteeinweisungen

### Gerätekatalog

Administratoren verwalten:

- Hersteller
- Produkt- oder Modellname
- Gerätekategorie
- aktueller Gerätebestand
- Medizinprodukt der Anlage 1

Der Katalog ist alphabetisch nach Gerätenamen sortiert. Standardmäßig werden
nur Geräte aus dem aktuellen Bestand angezeigt.

### Einweisung dokumentieren

Eine Geräteeinweisung enthält:

- Gerät
- Einweisungsdatum
- einen oder mehrere Teilnehmer
- Einweisenden

Einweisende können externe, vom Hersteller beauftragte Personen oder interne
Medizinproduktebeauftragte sein. Der Status zum Zeitpunkt der Einweisung wird
historisch festgehalten.

### Einweisungsmatrix

Die Matrix zeigt Mitarbeiter in den Zeilen und Geräte in den Spalten.
Filterbar sind unter anderem:

- Anlage 1
- Gerätekategorie
- aktueller Gerätebestand
- Mitarbeiterstatus
- Mitarbeitername
- Gerätename

Der Einweisungsstand je Gerät wird farblich angezeigt:

- 0 bis 65 Prozent: rot
- 66 bis 80 Prozent: gelb
- 81 bis 100 Prozent: grün

Bei Medizinproduktebeauftragten wird eine Herstellereinweisung gold
gekennzeichnet.

Unterhalb der Matrix werden dokumentierte Einweisungen chronologisch
aufgelistet und können bearbeitet werden.

## Datensicherung und Wiederherstellung

### Wann muss gesichert werden?

Nach jeder fachlichen Änderung aktiviert TeO:

- die Warnleiste im oberen Inhaltsbereich
- die Erinnerung beim Schließen oder Verlassen der Anwendung

Die Hinweise beziehen sich auf den unabhängigen Sicherungsexport. Die laufende
Browser- beziehungsweise MariaDB-Speicherung erfolgt bereits automatisch.

### Sicherung exportieren

1. In der Warnleiste **Jetzt exportieren** wählen oder
   **Einstellungen → Sicherung exportieren** öffnen.
2. Die JSON-Datei an einem geschützten Ort speichern.
3. Prüfen, ob die Datei vollständig heruntergeladen wurde.

Optional kann die Sicherung mit Passwort, PBKDF2 und AES-GCM verschlüsselt
werden. TeO verwendet dafür einen eigenen Passwortdialog mit Wiederholung,
Eingabeprüfung und optionaler Passwortanzeige. Das Passwort kann nicht aus der
Datei wiederhergestellt werden.

### Sicherung prüfen

Über **Sicherung prüfen** wird eine Datei validiert, ohne den aktuellen
Datenbestand zu verändern.

### Sicherung importieren

Vor einem Import:

1. Aktuellen Datenbestand exportieren.
2. Zu importierende Datei über **Sicherung prüfen** validieren.
3. **Sicherung importieren** auswählen.
4. Sicherheitsabfrage bestätigen.

TeO lädt vor dem Ersetzen zusätzlich eine Wiederherstellungssicherung
herunter.

### Änderungsprotokoll

Administrative und fachliche Änderungen werden mit Zeitpunkt, Benutzer und
Beschreibung protokolliert. Das Protokoll kann als CSV exportiert werden.

## Datenspeicherung und MariaDB

### Lokaler Modus

Im lokalen Modus liegen die Daten im Browserprofil des verwendeten
Arbeitsplatzes. localForage verwendet bevorzugt IndexedDB und fällt bei Bedarf
auf andere Browserspeicher zurück.

Wichtig:

- Ein Netzlaufwerk mit derselben `index.html` teilt nicht automatisch den
  IndexedDB-Datenbestand zwischen Arbeitsplätzen.
- Jeder Browser und jedes Browserprofil besitzt seinen eigenen lokalen
  Speicher.
- Browserbereinigung oder ein Profilwechsel kann lokale Daten entfernen.
- Regelmäßige JSON-Sicherungen bleiben erforderlich.

Unter **Einstellungen** zeigt TeO den belegten und geschätzten verfügbaren
Browserspeicher an. Dauerhafter Speicher kann beim Browser angefordert werden.

### MariaDB-Modus

Für gemeinsames Arbeiten mehrerer Arbeitsplätze wird der separate
TeO-API-Dienst verwendet. Datenbankzugangsdaten werden nicht an den Browser
ausgeliefert.

Beim ersten Verbinden kann der lokale Datenbestand kontrolliert auf den Server
übertragen werden. Anschließend:

- werden Änderungen zentral gespeichert
- werden Änderungen anderer Arbeitsplätze regelmäßig geladen
- verhindern Datenrevisionen unbemerkte Überschreibungen
- werden offene Formulare bei externen Änderungen vorsorglich geschlossen
- werden Sitzungen und Rollen serverseitig geprüft

Für den Server wird Node.js 20 oder neuer benötigt. Details stehen in
[`server/README.md`](server/README.md).

## Einstellungen und Administration

Die Einstellungsseite bündelt:

- Farbthema
- Dienstwochenendverantwortliche
- lokales oder MariaDB-Backend
- Benutzerverwaltung
- Berufe und Qualifikationen
- Datenqualitätsprüfung
- Sicherungserinnerung
- Import, Export und Sicherungsprüfung
- verschlüsselten Export
- Änderungsprotokoll

Verfügbare Farbthemen sind Standard, Dark Mode, Cellitinnen und
Cellitinnen Rot. Die Auswahl wird mit dem Datenbestand gespeichert.

Die Datenqualitätsprüfung sucht unter anderem nach:

- möglichen Dubletten
- ungültigen E-Mail-Adressen
- auffälligen Telefonnummern
- fehlenden Kontaktdaten

## Häufige Fragen und Problemlösung

### Warum sehe ich meine Daten an einem anderen Arbeitsplatz nicht?

Wahrscheinlich wird der lokale Modus verwendet. IndexedDB gehört zum
jeweiligen Browserprofil. Für einen gemeinsamen Datenbestand muss MariaDB
eingerichtet oder der JSON-Bestand kontrolliert exportiert und importiert
werden.

### Warum erscheint die Sicherungswarnung trotz automatischer Speicherung?

Automatische Speicherung und Sicherungsdatei sind zwei verschiedene Dinge.
Die Warnung bleibt bestehen, bis eine unabhängige JSON-Sicherung exportiert
wurde.

### Warum erscheint beim Schließen ein Browserdialog?

Seit der letzten Sicherung liegen Änderungen vor. Browser verwenden für diesen
Dialog einen eigenen Standardtext. Auch ein Neuladen kann technisch als
Verlassen der Seite gelten.

### Warum kann eine Leitungsrolle nicht entfernt werden?

Die Person ist noch als Verantwortliche eines Dienstwochenendes eingetragen.
Zuerst unter **Einstellungen → Feste Dienstwochenenden** eine andere
Stationsleitung oder stellvertretende Stationsleitung auswählen.

### Warum wird ein Mitarbeiter nicht in einer Auswahl angezeigt?

Prüfen:

- Ist der Mitarbeiter inaktiv?
- Ist ein Such- oder Statusfilter aktiv?
- Wird für die Funktion eine bestimmte Qualifikation benötigt?
- Gehört der Mitarbeiter bereits zu einer geschützten Zuordnung?

### Warum wird eine Fortbildung als offen oder fällig angezeigt?

Prüfen:

- Einführungsjahr der Fortbildung
- Wiederholungsintervall
- Datum des neuesten Nachweises
- Zuordnung zur richtigen Fortbildungsreihe
- ausgewähltes Auswertungsjahr

### Warum kann ein Gerät nicht gefunden werden?

Der Filter steht möglicherweise auf „aktueller Bestand“. Für ausgemusterte
Geräte den Bestandsfilter erweitern und zusätzlich Suchbegriff,
Gerätekategorie und Anlage-1-Filter prüfen.

### Warum ist ein Tag in der Urlaubsplanung rot?

Die konfigurierte Abwesenheitsgrenze wurde überschritten. Die Planung ist
bewusst weiterhin möglich, muss aber organisatorisch geprüft werden.

### Was tun, wenn der Import abgelehnt wird?

1. Datei über **Sicherung prüfen** untersuchen.
2. Sicherstellen, dass es sich um eine vollständige TeO-JSON-Sicherung handelt.
3. Bei verschlüsselten Dateien das korrekte Passwort verwenden.
4. Keine manuell bearbeiteten oder abgeschnittenen JSON-Dateien importieren.
5. Bei Sicherungen aus einer neueren TeO-Version zunächst die Anwendung
   aktualisieren.

Bei einer verschlüsselten Datei zeigt TeO einen eigenen Entschlüsselungsdialog.
Ein falsches Passwort kann dort erneut eingegeben werden, ohne die Datei noch
einmal auswählen zu müssen.

## Datenschutz und IT-Sicherheit

TeO verarbeitet personenbezogene Beschäftigtendaten und teilweise
gesundheits- oder qualifikationsbezogene Informationen. Für einen produktiven
Einsatz müssen Datenschutz, Informationssicherheit und betriebliche
Mitbestimmung berücksichtigt werden.

Mindestens erforderlich sind:

- geregelte Zugriffsrechte
- persönliche Benutzerkonten
- sichere Passwörter
- HTTPS im MariaDB-Betrieb
- kontrollierte Server- und Datenbank-Backups
- Betriebssystem- und Netzwerkhärtung
- Schutz exportierter Sicherungsdateien
- geregelte Aufbewahrungs- und Löschfristen
- Protokollierung und organisatorische Verantwortlichkeiten
- abgestimmte Betriebsvereinbarung

Unverschlüsselte JSON-Sicherungen enthalten den vollständigen Datenbestand und
müssen entsprechend geschützt gespeichert und übertragen werden.

## Entwicklung und Projektstruktur

Die aktuelle Projekt- und Datenformatversion wird zentral in
[`src/meta/project-meta.mjs`](src/meta/project-meta.mjs) gepflegt.

Die Buildnummer besteht aus einer dreistelligen Major- und Minor-Nummer.
Strukturelle Änderungen erhöhen die Major-Nummer; Funktionen und Korrekturen
erhöhen die Minor-Nummer.

Direkt startbare Dateien wie `index.html`, `styles.css`, `app.js`,
`project-meta.js` und `state-schema.js` werden aus den Quellen unter `src/`
erzeugt. Änderungen deshalb nicht in den generierten Dateien vornehmen.

```text
src/app/       Fachmodule der Browser-Anwendung
src/html/      Ansichten und Dialoge
src/styles/    Basis-, Themen-, Planungs- und Druckstile
src/shared/    gemeinsamer Datenvertrag für Browser und Server
src/meta/      zentrale Projekt- und Datenformatversion
server/src/    MariaDB-API und persistente Sitzungsverwaltung
tests/         automatisierte Migrations- und Fachlogiktests
tools/         Build, Strukturprüfung und Demo-Datengenerator
```

Mit Node.js 20 oder neuer:

```text
npm ci
npm run verify
```

`npm run verify` erzeugt die verteilbaren Dateien neu, prüft die Struktur und
führt alle automatisierten Tests aus.

Die mitgelieferte localForage-Version `1.10.0` befindet sich zusammen mit ihrer
Lizenz im Ordner `vendor`.
