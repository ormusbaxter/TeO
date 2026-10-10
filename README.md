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
Administratorkontos und fragt anschließend nach dem Sicherungsordner, in dem es
die gemeinsame Datei `teo-autosicherung.json` anlegt (siehe „Erster Start an
einem weiteren Arbeitsplatz“).

Für den gemeinsamen Betrieb über MariaDB wird die Anwendung über den
TeO-Server aufgerufen. Die technische Einrichtung ist im Abschnitt
„Datenspeicherung und MariaDB“ beschrieben.

### Erste sinnvolle Schritte

1. Unter **Einstellungen** das gewünschte Farbthema – es gilt für das eigene
   Benutzerkonto – und die Sicherungserinnerung festlegen.
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

### Installation als App

Chrome und Edge können TeO über das Browsermenü als eigenständige Web-App
installieren. Die installierte Anwendung verwendet das TeO-App-Icon und öffnet
sich in einem eigenen Fenster. Sie bleibt technisch mit derselben
Serveradresse verbunden; deshalb sollte TeO immer über exakt dieselbe URL
installiert und gestartet werden.

Nach einer Änderung des App-Icons kann eine Neuinstallation erforderlich sein.
Beim Deinstallieren darf **Daten auch aus Chrome löschen** nicht ausgewählt
werden, wenn lokale Einstellungen oder ein lokaler Datenbestand erhalten
bleiben sollen.

## Navigation und Bedienung

### Hauptnavigation

Die Desktop-Navigation befindet sich links. Auf kleinen Bildschirmen wird am
unteren Rand eine horizontal scrollbarere Mobilnavigation angezeigt.

Folgende Bereiche stehen zur Verfügung:

- **Übersicht:** Wochenzusammenfassung, Kennzahlen, anstehende Fristen und offene Nachweise
- **Mitarbeiter:** Personalstammdaten, Filter, Sammelbearbeitung und Gesamtakten
- **Wochenendverteilung:** Vergleich der beiden festen Dienstwochenenden
- **Urlaubsplanung:** Monats- und Jahresplanung von Urlaub und Abwesenheiten
- **Terminkalender:** Termine mit Ort, Uhrzeit und Beschreibung, wahlweise als
  Liste oder als Monatskalender
- **Memo / ToDo:** persönliche und gemeinsame Notizen und Aufgaben
- **Pflichtfortbildungen:** Fortbildungskatalog, Nachweise und Jahresauswertung
- **Teamsitzungen:** Sitzungen, Teilnahmen und statistische Auswertung
- **Geräteeinweisungen:** Einweisungsnachweise und Einweisungsmatrix
- **Geräteverwaltung:** Administrativer Gerätekatalog
- **Einstellungen:** Darstellung, Datenbank, Sicherungen und Stammdaten
- **Hilfe:** Dieses Benutzerhandbuch mit Volltextsuche

Die Zahl neben einem Eintrag nennt bei **Mitarbeitern** die aktiven und die in
Einarbeitung befindlichen Personen – ausgetretene zählen nicht mit –, bei
**Terminen** die noch bevorstehenden, bei **Memo / ToDo** die sichtbaren offenen
Einträge und bei der **Geräteverwaltung** die Geräte im aktuellen Bestand.

### Suche und Filter

Suchfelder reagieren direkt während der Eingabe. Mehrere Filter können
kombiniert werden. Filter beziehen sich immer auf die aktuell sichtbare
Ansicht.

Alle Suchfelder sind nachsichtig geschrieben: Groß- und Kleinschreibung spielt
keine Rolle, Umlaute lassen sich auch ohne Punkte oder als „ae“, „oe“ und „ue“
eingeben, und „ß“, „ss“ und „s“ finden einander. „Müller“ wird also auch mit
„muller“ oder „mueller“ gefunden, „Weiß“ mit „weiss“ oder „weis“.

In der Mitarbeiterverwaltung berücksichtigt auch **E-Mails kopieren** nur die
aktuell gefilterte Liste.

Die Mitarbeitersuche durchsucht ausschließlich Vor- und Nachnamen. Mit dem
Statusfilter **Aktiv + In Einarbeitung** lassen sich alle aktuell beschäftigten
Personen gemeinsam anzeigen.

Der Qualifikationsfilter bietet zusätzlich **Keine Qualifikation**. Damit
lassen sich gezielt Mitarbeiter anzeigen, denen aktuell keine
Zusatzqualifikation zugewiesen ist.

### Aktive Filter und gemerkte Ansichten

Sobald ein Filter greift, erscheint unter der Filterleiste eine Zeile mit allen
aktiven Filtern als Chips – jeder mit seiner Bezeichnung und dem gewählten Wert.
Eine leere Liste nennt damit ihren Grund. Ein Klick auf das × eines Chips
entfernt genau diesen Filter; **Filter zurücksetzen** räumt weiterhin alle auf
einmal ab. Chips gibt es in **Mitarbeitern**, im **Terminkalender**, bei
**Memo / ToDo**, in den **Geräteeinweisungen** und in der **Geräteverwaltung**.

Rechts in derselben Zeile steht **Ansicht merken**. Damit werden die aktuellen
Filter dieser Ansicht im Browserprofil abgelegt und beim nächsten Start wieder
eingestellt – nützlich etwa für „nur aktive Pflegefachkräfte“ als tägliche
Arbeitsansicht. **Gemerkte Ansicht aufheben** entfernt sie wieder. Wie die
Reihenfolge der Navigation gilt das nur für diesen Rechner und diesen Browser
und ist nicht Teil der Datensicherung. Ist ein gemerkter Wert später entfallen
– etwa ein gelöschter Beruf –, wird er beim Start übersprungen.

### Tabellen anpassen

- **Kompakte Tabellen** – unter **Einstellungen → Allgemein**. Die
  Zeilen rücken enger zusammen, Zweitzeilen wie Kontaktdaten treten zurück; im
  gleichen Bildausschnitt sind damit rund zwanzig statt zwölf Mitarbeiter
  sichtbar. Die Einstellung gilt nur an diesem Arbeitsplatz.
- **Spalten** – die Schaltfläche in der Filterleiste der Mitarbeiter wählt aus,
  welche Spalten die Tabelle zeigt. Name und Aktionen bleiben immer stehen. War
  nach einer Spalte sortiert, die abgewählt wird, sortiert die Tabelle wieder
  nach dem Namen.
- **Mehrere Zeilen auswählen** – ein Klick auf ein Auswahlkästchen, dann ein
  Klick mit gedrückter **Umschalttaste** auf ein zweites: Alles dazwischen wird
  mitgewählt beziehungsweise mit abgewählt.
- **Kein versehentliches Markieren** – in Auswahlkarten und Auswahlspalten
  (etwa den Teilnehmerlisten beim Dokumentieren von Geräteeinweisungen und
  Fortbildungsnachweisen) lässt sich der Text nicht mehr markieren; ein
  verrutschter oder doppelter Klick trifft damit weiter das Kästchen. Der
  übrige Text der Anwendung bleibt zum Kopieren markierbar.
- **Feste erste Spalte** – in der Einweisungsmatrix und in der Jahresauswertung
  der Pflichtfortbildungen bleibt die Namensspalte beim seitlichen Blättern
  stehen.
- **Spaltenbreite und Reihenfolge** – in der Mitarbeitertabelle lässt sich die
  rechte Kante einer Überschrift ziehen. Im Dialog **Spalten** ordnen die
  Pfeile die wählbaren Spalten neu an. Eine davon kann zusätzlich fixiert
  werden; Auswahl und Name bleiben ohnehin am linken Rand stehen. Diese
  Einstellungen gelten nur am jeweiligen Arbeitsplatz.

### Schnellansicht

Ein Klick auf eine freie Stelle einer Mitarbeiterzeile öffnet rechts neben der
Tabelle eine Schnellansicht. Sie zeigt Status, Stellenumfang, Dienstwochenende,
Kontakt, Fortbildungsstand und Qualifikationen, ohne die Liste zu verlassen.
Von dort lässt sich der Mitarbeiter bearbeiten, seine Gesamtakte öffnen oder
für den Schnellzugriff anheften. Mit **Pfeil hoch** und **Pfeil runter** bewegt
sich der Fokus durch die Tabellenzeilen, **Enter** öffnet die Schnellansicht.

Dieselbe Schnellansicht gibt es für **Termine**, **Memos** und **Geräte**: Ein
Klick auf die Karte – im Terminkalender auch auf einen Eintrag im Monatsraster –
öffnet sie rechts neben der Liste.

| Datenart | Angaben | Aktionen |
| --- | --- | --- |
| Termin | Datum, Uhrzeit, Ort, Kategorie, angepinnt, Teilnehmerliste, Beschreibung | Anheften · Bearbeiten · **Kalender** (springt in den Monat des Termins) |
| Memo / ToDo | Datum, Kategorie, Sichtbarkeit, Status, angepinnt, Beschreibung | Anheften · Bearbeiten · **Erledigt** beziehungsweise **Wieder öffnen** |
| Gerät | Hersteller, Produkt, Kategorie, Anlage 1, Bestand, Einweisungsquote, angeordnete Neueinweisung, Einweisungsberechtigte | Anheften · Bearbeiten · **Übersicht** (Einweisungen des Geräts) |

Die Schaltflächen auf der Karte behalten ihre Aufgabe: Der Stift öffnet weiterhin
unmittelbar den Bearbeitungsdialog, der Papierkorb löscht. Persönliche Memos
anderer Konten erscheinen auch hier nicht. Angeheftete Datensätze und die zuletzt
geöffneten stehen in **Strg + K** und führen von dort wieder in die
Schnellansicht.

### Mehrere Einträge auf einmal

Termine, Memos und Geräte lassen sich wie Dateien in einer Liste auswählen:

- **Strg + Klick** nimmt eine Karte hinzu oder wieder heraus.
- **Umschalt + Klick** wählt alles bis zur zuletzt angeklickten Karte.
- Ein gewöhnlicher Klick hebt die Auswahl wieder auf und öffnet die
  Schnellansicht, **Esc** hebt sie ebenfalls auf.

Über der Liste erscheint dann eine Leiste mit der Zahl der ausgewählten Einträge
und den Sammelaktionen: Termine anpinnen oder lösen, Memos erledigen oder wieder
öffnen, Geräte im Bestand führen oder ausbuchen – und jeweils **Löschen**. Jede
Sammelaktion ist **eine** Änderung: Sie steht als eine Zeile im
Änderungsprotokoll und lässt sich unmittelbar danach mit **Rückgängig** oder
**Strg + Z** zurücknehmen. Gelöscht wird nur nach Rückfrage. Was ein Filter
ausblendet, fällt aus der Auswahl heraus – eine Sammelaktion trifft immer genau
das, was auch zu sehen ist.

In der Mitarbeitertabelle gilt das Bekannte weiter: Auswahlkästchen, **Umschalt
+ Klick** für einen Bereich, dazu jetzt **Auswahl löschen** neben **Auswahl
bearbeiten**.

### Kontextmenü

Die rechte Maustaste öffnet auf einer Mitarbeiterzeile und auf jeder Karte ein
Kontextmenü:

- **Einzelner Eintrag** – Schnellansicht, Bearbeiten und die weiteren Aktionen
  der Datenart (Gesamtakte, Kalender, Erledigt, Übersicht), Löschen sowie
  **Zur Auswahl hinzufügen**.
- **Teil einer Mehrfachauswahl** – stattdessen die Sammelaktionen für alle
  ausgewählten Einträge.

**Esc** schließt das Menü, ein Klick daneben ebenfalls.

### Die Übersicht

Oben begrüßt die Übersicht mit dem Datum und einem Satz zur Woche: wie viele
Fristen in den nächsten sieben Tagen anstehen, wie viele Personen diese Woche
abwesend sind und wie viele Nachweise bei den Pflichtfortbildungen noch fehlen.
Daneben öffnet **Abschluss eintragen** direkt den Nachweisdialog.

Darunter stehen vier Kennzahlen, jede ein Klick tief:

- **Nachweise überfällig** springt zu den offenen Nachweisen
- **Fristen in 7 Tagen** stellt die Liste „Als Nächstes“ auf sieben Tage
- **heute abwesend** öffnet die Urlaubsplanung
- **Geburtstage** zeigt die Liste „Als Nächstes“ für 30 Tage

Die Kennzahlen zählen immer den ganzen Bestand, unabhängig von den Filtern der
Liste.

**Als Nächstes** ist der Fristenmonitor (siehe unten). Daneben liegen die
Schnellzugriffe zum Anlegen von Mitarbeitern, Fortbildungen, Teamsitzungen und
Memos.

**Offene Nachweise nach Fortbildung** fasst die überfälligen
Pflichtfortbildungen zusammen: eine Zeile je Fortbildung mit Erfüllungsgrad,
der Zahl der überfälligen Nachweise und den Kürzeln der Betroffenen. Ein Klick
auf die Zeile öffnet den Nachweisdialog für diese Fortbildung.

Über **Anpassen** werden Kennzahlen, „Als Nächstes“ samt Schnellzugriff und die
offenen Nachweise ein- oder ausgeblendet und neu angeordnet. Die
Zusammenstellung ist persönlich für diesen Browser und gehört nicht zum
gemeinsamen Datenbestand oder zur Datensicherung.

### Was ist neu?

Nach einer neuen Programmfassung erscheint beim ersten Start ein Hinweis mit den
Änderungen genau dieser Fassung – derselbe Abschnitt, der auch in der
**Änderungshistorie** dieser Hilfe steht. **Ganze Änderungsliste** führt dorthin.
Der Hinweis erscheint einmal je Fassung und Arbeitsplatz; bei einer
Neueinrichtung bleibt er aus.

### Termine im Monatsraster verschieben

Ein Termin lässt sich im Monatsraster mit der Maus auf einen anderen Tag ziehen.
Der Zieltag hebt sich während des Ziehens ab; beim Loslassen wird das Datum
geändert und die Meldung bietet **Rückgängig** an. Ein Klick ohne Ziehen öffnet
weiterhin die Schnellansicht des Termins.

### Datums- und Zeitangaben

Datumswerte werden einheitlich als `TT.MM.JJJJ` dargestellt. Intern speichert
TeO Datumswerte im ISO-Format, damit Sortierung und Berechnung zuverlässig
funktionieren.

In jedem Datumsfeld gibt es eine Schnelleingabe: Ist das Feld aktiv, trägt
**h** das heutige Datum ein, **g** das gestrige und **m** das morgige. Das
spart bei Einweisungs- und Fortbildungsnachweisen den Griff zur Zahlenreihe.
Die Tasten stehen auch im Kurzhinweis des Feldes. Felder mit einer Grenze
bleiben unberührt, wenn das Datum sie verletzen würde – ein Nachweis, der nicht
in der Zukunft liegen darf, nimmt **m** also nicht an. Ziffern funktionieren
unverändert.

Uhrzeiten werden im 24-Stunden-Format `HH:MM` angezeigt.

### Obermenüs in der Seitenleiste

Unter **Einstellungen → Allgemein** fasst **Obermenüs in der Seitenleiste**
die Menüpunkte zu Bereichen zusammen:

- **Personal:** Mitarbeiter, Wochenendverteilung, Urlaubsplanung
- **Termine:** Terminkalender, Memo / ToDo
- **Fortbildungen:** Pflichtfortbildungen, Teamsitzungen
- **Geräte:** Geräteeinweisungen, Geräteverwaltung

Übersicht, Einstellungen und Hilfe bleiben für sich. Ein Klick auf ein
Obermenü klappt es auf oder zu; ein zugeklapptes Obermenü, in dem die gerade
geöffnete Ansicht liegt, ist hervorgehoben. Wer eine Ansicht über die Suche
oder ein Tastenkürzel öffnet, sieht ihren Menüpunkt, weil das Obermenü dann
aufgeht. Umsortiert wird innerhalb eines Obermenüs; ein Obermenü steht dort,
wo sein erster Eintrag in der eigenen Reihenfolge steht. In der eingeklappten
Seitenleiste entfallen die Obermenüs, und alle Menüpunkte stehen wie gewohnt
als Symbole untereinander. Die Einstellung und welche Obermenüs zugeklappt
sind, gelten nur an diesem Arbeitsplatz.

### Seitenleiste einklappen

Der Winkel neben dem Namenszug klappt die Seitenleiste nach links ein. Im
eingeklappten Zustand bleibt eine schmale Spur mit den Symbolen der
Menüpunkte; wer mit der Maus darauf zeigt, sieht Bezeichnung und Zähler als
Kurzhinweis. Ein erneuter Klick klappt sie wieder auf. Der Zustand wird im
Browserprofil gespeichert und gilt beim nächsten Start wieder – er gehört wie
die Reihenfolge der Navigation nicht zum gemeinsamen Datenbestand.

Das Untermenü der Einstellungen entfällt im eingeklappten Zustand – die fünf
Bereiche stehen ohnehin als Leiste über den Einstellungen selbst.

Auch der Fuß der Seitenleiste schrumpft mit: Angemeldetes Konto, Systemstatus
und Namenszug stehen dann als drei gleich große Kacheln untereinander – Konto
mit den Schaltflächen für Benutzerverwaltung und Abmelden, Status als farbiger
Punkt, darunter das Programmzeichen. Alles, was dabei wegfällt, nennt der
Kurzhinweis der jeweiligen Kachel: Benutzername und Rolle, Verbindung und
Speicherstatus sowie Fassung und Urheberrecht. Im lokalen Modus zeigt der
Systemstatus nur den Speicherort im Browserprofil und Datum samt Uhrzeit der
letzten erfolgreichen Speicherung; im MariaDB-Modus bleiben Backend, Server,
Revision und DB-Schema sichtbar.

### Suchen und ausführen (Befehlspalette)

**Strg + K** – oder der Knopf **Suchen** über der Navigation – öffnet ein
einzelnes Feld für alles. Während der Eingabe zeigt es, gruppiert und
untereinander:

- **Favoriten, zuletzt geöffnet und letzte Befehle** – angeheftete sowie zuletzt
  verwendete Mitarbeiter, Termine und Memos und die zuletzt ausgeführten
  Ansichten oder Aktionen
- **Ansichten** – jeder Bereich der Anwendung, mit seinem Tastenkürzel dahinter
- **Aktionen** – Anlegen eines Mitarbeiters, Termins, Memos, einer Fortbildung,
  eines Nachweises, einer Teamsitzung, einer Geräteeinweisung oder eines
  Geräts; dazu Sicherung exportieren, Datenqualität prüfen, Berufe und
  Qualifikationen, Tastenkürzel und Abmelden. Administratoren finden hier
  außerdem Änderungsprotokoll und Benutzerverwaltung
- **Direktbefehle** – unter anderem die offenen Nachweise auf der Übersicht und der Filter
  für aktuell beschäftigte Mitarbeiter
- **Datensätze** – Mitarbeiter, Termine, Memos, Pflichtfortbildungen,
  Teamsitzungen und Geräte, sobald etwas eingegeben wurde

**Pfeil hoch** und **Pfeil runter** wählen, **Enter** öffnet, **Esc** schließt.
Ein gewählter Datensatz wechselt in seine Ansicht und öffnet ihn dort
unmittelbar zum Bearbeiten. Die Vorschau unter der Trefferliste nennt Gruppe,
Bezeichnung und Zusatz des gerade markierten Eintrags.

Gesucht wird so nachsichtig wie überall in TeO: Umlaute dürfen fehlen oder
ausgeschrieben sein, „ß“ und „ss“ finden einander. Treffer am Wortanfang stehen
vor Treffern in der Mitte. Je Gruppe erscheinen die fünf besten Treffer; die
Palette zeigt außerdem nur, was das angemeldete Konto ohnehin sehen darf.

### Tastenkürzel

Am Schreibtisch lässt sich TeO weitgehend über die Tastatur bedienen. Die
Kürzel gelten überall, solange kein Eingabefeld und kein Dialog den Fokus hat;
im Raster der Urlaubsplanung behalten die Buchstaben ihre dortige Bedeutung.

| Taste | Wirkung |
| --- | --- |
| **Strg + K** | Suchen und ausführen: Ansicht, Eintrag oder Aktion |
| **?** | Übersicht aller Tastenkürzel öffnen |
| **/** | Suchfeld der gezeigten Ansicht anspringen |
| **n** | Neuen Eintrag der gezeigten Ansicht anlegen |
| **Strg + Z** | Letzte Löschung oder Massenänderung zurücknehmen |
| **Strg + Y** | Zurückgenommenen Schritt wiederholen (auch **Strg + Umschalt + Z**) |
| **Esc** | Dialog schließen, Vollbild verlassen, Auswahl aufheben |
| **Strg + Klick** | Karte zur Mehrfachauswahl hinzunehmen |
| **Umschalt + Klick** | Alle Karten bis zur zuletzt angeklickten auswählen |

Die Ansicht wechselt mit **g** gefolgt vom Buchstaben des Bereichs: **u**
Übersicht, **m** Mitarbeiter, **w** Wochenendverteilung, **p**
Urlaubsplanung, **t** Terminkalender, **o** Memo / ToDo, **f**
Pflichtfortbildungen, **s** Teamsitzungen, **g** Geräteeinweisungen, **v**
Geräteverwaltung, **e** Einstellungen, **h** Hilfe. Nach dem **g** bleibt
eineinhalb Sekunden Zeit für den zweiten Anschlag. Dieselbe Übersicht öffnet
die Schaltfläche **Tastenkürzel** in der Hilfe.

### Löschungen zurücknehmen

Nach dem Löschen eines Datensatzes und nach einer Sammelbearbeitung bietet die
Meldung unten rechts **Rückgängig** an; dasselbe leistet **Strg + Z**. Damit
kehrt der Datenbestand in den Zustand unmittelbar vor dieser Änderung zurück.

TeO merkt sich die letzten **zehn** solcher Schritte. Jedes weitere **Strg + Z**
nimmt den nächstälteren zurück. Nach einer Rücknahme bietet die Meldung
**Wiederholen** an; dasselbe leisten **Strg + Y** und **Strg + Umschalt + Z**.

Der Verlauf gilt nur, solange nichts anderes dazwischenkommt: Jede andere
gespeicherte Änderung, etwa ein bearbeiteter Mitarbeiter oder ein neuer
Planungseintrag, leert ihn, ebenso Daten aus einem anderen Tab, vom Server oder
aus einem Import. Eine neue zurücknehmbare Änderung verwirft die Schritte zum
Wiederholen. Der Verlauf lebt nur in diesem Browserfenster und ist nach einem
Neuladen leer.

Zurücknehmen und Wiederholen sind selbst Änderungen – im Änderungsprotokoll
stehen anschließend alle Zeilen, die Löschung und ihre Rücknahme. Für ältere
Stände bleibt die Datensicherung der Weg zurück.

### Reihenfolge der Navigation anpassen

Die Einträge der Seitenleiste lassen sich in eine eigene Reihenfolge bringen:

- **Ziehen** – einen Eintrag anfassen und nach oben oder unten schieben. Ein
  gewöhnlicher Klick wechselt weiterhin die Ansicht; als Ziehen zählt erst eine
  Bewegung von mehr als sechs Bildpunkten.
- **Tastatur** – Eintrag anwählen und mit **Alt + Pfeil hoch** beziehungsweise
  **Alt + Pfeil runter** verschieben.
- **Zurücksetzen** – die Schaltfläche über den Anmeldeinformationen erscheint
  nur, wenn eine eigene Reihenfolge gesetzt ist.

Die Reihenfolge ist eine persönliche Einstellung. Sie wird im Browserprofil
gespeichert, gilt also nur für diesen Rechner und diesen Benutzer, verändert
den gemeinsamen Datenbestand nicht und ist deshalb auch **nicht** Teil der
Datensicherung. Ändert sich das Menü in einer neuen Programmversion, bleiben
bekannte Einträge an ihrem Platz und neue erscheinen am Ende.

## Benutzerkonten und Berechtigungen

Jedes angemeldete Konto bedient TeO vollständig. Die Rollentrennung betrifft
ausschließlich die Verwaltung der Anwendung selbst, nicht die tägliche Arbeit.

### Normale Benutzer

Normale Benutzer dürfen alles, was zur regulären Bedienung gehört:

- Mitarbeiter anlegen, bearbeiten, deaktivieren und löschen
- Berufe und Zusatzqualifikationen verwalten
- Pflichtfortbildungen, Fortbildungsreihen und Nachweise verwalten
- Teamsitzungen, Teilnahmen und Termine verwalten
- Geräte und Geräteeinweisungen verwalten
- Urlaubsansprüche und Abwesenheitsplanung bearbeiten
- Dienstwochenenden konfigurieren und Simulationen übernehmen
- Datenqualität prüfen, Telefonliste und E-Mail-Adressen exportieren
- Daten sichern, prüfen und Sicherungen importieren
- das eigene Passwort und das eigene Farbthema ändern

### Administratoren

Administratoren dürfen zusätzlich fünf Einstellungen ändern:

- **Speicherort** – zwischen lokalem Browserspeicher und MariaDB wechseln
- **Benutzer verwalten** – siehe unten
- **Sicherungserinnerung** – nach wie vielen Tagen TeO zur Sicherung mahnt
- **Dialoge schließen** – ob ein Klick neben einen Dialog diesen schließt
- **Schulferien** – die in der Urlaubsplanung markierten Ferienzeiträume

Zusätzlich ist das **Änderungsprotokoll** Administratoren vorbehalten, weil es
die Tätigkeit der übrigen Konten nachvollziehbar macht.

Diese Aufteilung gilt im lokalen Modus und im MariaDB-Modus gleichermaßen. Im
MariaDB-Modus setzt der Server sie unabhängig vom Browser durch: Ein normales
Konto kann Benutzerkonten und die Sicherungserinnerung auch dann nicht
verändern, wenn der Client umgangen wird. Das Änderungsprotokoll liefert der
Server einem normalen Konto gar nicht erst aus, und es kann das Protokoll nur
um eigene Einträge ergänzen – Benutzername und Zeitpunkt eines neuen Eintrags
setzt der Server.

Im lokalen Modus ist die Aufteilung eine Sperre der Oberfläche, kein
Zugriffsschutz – siehe „Was der lokale Modus leistet – und was nicht“ im
Kapitel Datenschutz und IT-Sicherheit.

### Dialoge schließen

Unter **Einstellungen → Dialoge schließen** wird festgelegt, wie sich ein Klick
neben einen geöffneten Dialog auswirkt:

- **Schließt den Dialog nicht** (Voreinstellung) – Dialoge lassen sich nur über
  ihre Schaltflächen oder die Escape-Taste verlassen. Das verhindert, dass ein
  versehentlicher Klick eine begonnene Eingabe beendet.
- **Schließt den Dialog** – ein Klick auf die abgedunkelte Fläche schließt den
  Dialog.

In beiden Fällen gilt: Enthält der Dialog ein Formular mit ungespeicherten
Eingaben, fragt TeO vorher nach. Die sechs Dialoge rund um Start und Anmeldung –
Herkunft des Datenbestands, Ersteinrichtung, Sicherungsordner der
Ersteinrichtung, Laden des Datenbestands, Anmeldung und Passwortänderung –
bleiben von der Einstellung unberührt und lassen sich weder
per Klick daneben noch per Escape schließen.

### Schulferien pflegen

Unter **Einstellungen → Schulferien** werden die Zeiträume gepflegt, die die
Urlaubsplanung farblich markiert. Jeder Eintrag besteht aus Beginn, Ende und
einer Bezeichnung wie „Sommerferien“.

Bei der ersten Verwendung ist die amtliche Ferienordnung NRW für die Schuljahre
2024/25 bis 2029/30 hinterlegt – 26 Zeiträume bis April 2030. Weitere Jahre
lassen sich ohne Obergrenze ergänzen; ein Programmwechsel ist dafür nicht mehr
nötig.

- **Hinzufügen** – Beginn darf nicht nach dem Ende liegen, die Bezeichnung ist
  Pflicht. Bereits vorhandene Zeiträume werden nicht doppelt aufgenommen.
- **Entfernen** – über das Papierkorbsymbol der jeweiligen Zeile.
- **Amtliche NRW-Termine ergänzen** – fügt fehlende Zeiträume der mitgelieferten
  Liste hinzu, ohne eigene Einträge zu verändern.

Jahre, für die Ferien hinterlegt sind, erscheinen automatisch in der
Jahresauswahl der Urlaubsplanung. Bewegliche Ferientage sind nicht enthalten,
da jede Schule sie selbst festlegt.

Die Zeiträume sind Teil des Datenbestands und damit in jeder Sicherung
enthalten. Gesetzliche Feiertage werden dagegen weiterhin für jedes Jahr
berechnet und müssen nicht gepflegt werden.

### Benutzer verwalten

Über **Einstellungen → Stammdaten & Zugriffe → Benutzer verwalten** stehen
Administratoren zur Verfügung:

- **Konto anlegen** – Benutzername und Rolle wählen. TeO erzeugt ein einmalig
  angezeigtes temporäres Passwort; beim ersten Anmelden muss der Benutzer ein
  eigenes Passwort festlegen.
- **Benutzername ändern** – 4 bis 40 Buchstaben oder Ziffern, eindeutig.
- **Passwort zurücksetzen** – für jedes andere Konto, auch für weitere
  Administratoren. Es entsteht wieder ein temporäres Passwort. Das eigene
  Passwort wird stattdessen über **Konto → Passwort ändern** geändert.
- **Konto löschen** – dauerhaft; der fachliche Datenbestand bleibt unberührt.

Zwei Konten lassen sich nicht löschen und sind entsprechend gekennzeichnet: das
**eigene Konto**, damit man sich nicht mitten in der Sitzung aussperrt, und der
**letzte verbliebene Administrator**, weil ein Datenbestand ohne Administrator
nicht mehr verwaltbar wäre.

### Benutzerkonten beim Import

Ein Sicherungsimport ersetzt den fachlichen Datenbestand, **nicht** die
Benutzerkonten. Wer angemeldet ist, bleibt angemeldet, und die vorhandenen
Konten und Passwörter gelten unverändert weiter. Nur wenn noch gar kein Konto
existiert – etwa bei einer Wiederherstellung auf einem leeren System – werden
die Konten aus der Sicherungsdatei übernommen.

Deshalb kann der Import gefahrlos allen Konten offenstehen: Er ist kein Weg,
sich Administratorrechte zu verschaffen.

### Ersteinrichtung und Passwörter

TeO enthält keine fest eingebauten Produktivkonten oder Standardpasswörter.
Beim ersten Start wird ein Administratorkonto erstellt.

Wird das Passwort eines normalen Benutzers zurückgesetzt, erzeugt TeO ein
temporäres Passwort. Beim nächsten Anmelden muss der Benutzer ein neues
Passwort festlegen.

Passwörter werden mit PBKDF2 gehasht gespeichert. Im lokalen Modus steuert die
Anmeldung die Bedienung der Oberfläche, schützt den Datenbestand aber nicht
(siehe „Was der lokale Modus leistet – und was nicht“). Im MariaDB-Modus werden
Anmeldung und Rollen zusätzlich serverseitig geprüft.

## Mitarbeiterverwaltung

### Mitarbeiter anlegen

1. **Mitarbeiter** öffnen.
2. **Mitarbeiter anlegen** auswählen.
3. Vorname, Nachname, Beruf und Stellenumfang erfassen; bei Bedarf Ein- und
   Austrittsdatum.
4. Optional Geburtsdatum, Telefonnummer, E-Mail-Adresse und Benutzername
   ergänzen.
5. Mitarbeiterstatus und festes Dienstwochenende auswählen.
6. Zusatzqualifikationen kennzeichnen und gegebenenfalls ein Ablaufdatum
   hinterlegen.
7. Speichern.

TeO nennt Mitarbeiter überall in der Form **Nachname, Vorname** – in Listen,
Akten, Auswahlfeldern, Meldungen, Ausdrucken und Exporten. Die Suchfelder
finden einen Namen in beiden Reihenfolgen, also auch als „Vorname Nachname“.

### Eintritt, Austritt und Stellenumfang

**Eintrittsdatum** und **Austrittsdatum** begrenzen die Beschäftigung. Davor
und danach erscheint der Mitarbeiter nicht in der Urlaubsplanung; in Monaten
mit Ein- oder Austritt sind die Tage außerhalb schraffiert und gesperrt. Ist
das Austrittsdatum überschritten, der Mitarbeiter aber noch aktiv, meldet die
Datenqualitätsprüfung das. Den Status stellt TeO nicht selbst um; die
Schaltfläche **Auf Inaktiv setzen** in der Meldung erledigt es mit einem Klick,
und „Rückgängig“ nimmt es wieder zurück.

Auch Pflichtfortbildungen und Teamsitzungen beachten die Beschäftigung:

- Zu einer Pflichtfortbildung eines Jahres zählt, wer zum Jahresende
  beschäftigt ist – im laufenden Jahr, wer heute beschäftigt ist. Wer im Herbst
  eintritt, ist für das Jahr also schon verpflichtet; wer im Frühjahr
  ausgetreten ist, nicht mehr.
- Zu einer Teamsitzung erwartet wird, wer am Sitzungstag beschäftigt war.
  Bereits dokumentierte Teilnahmen bleiben in jedem Fall erhalten.

Ändert sich der Stellenumfang, trägt **Änderung hinzufügen** den neuen Wert
mit dem Tag ein, ab dem er gilt. Das Feld **Stellenumfang** ist dann der
Ausgangswert bis zur ersten Änderung. Überall angezeigt wird der heute
gültige Wert; eine bevorstehende Änderung nennt die Mitarbeiterliste unter
dem Wert („ab 01.01.2027: 75 %“), die Akte zeigt den Verlauf.

### Namensänderungen

Ändert sich ein Name, etwa nach Heirat oder Scheidung, hält
**Namensänderung eintragen** im Mitarbeiterdialog den bisherigen Namen mit
Datum und optional einem Grund fest; danach wird oben der neue Name
eingetragen. Wer den Namen nur überschreibt, ändert ihn dagegen ohne
früheren Namen – das passt für Tippfehler. Weicht der eingetippte Name vom gespeicherten
ab, ohne dass der bisherige festgehalten ist, erinnert ein Hinweis daran.

Der frühere Name bleibt auffindbar: Die Suche in der Mitarbeiterliste, in den
Auswahllisten und in der Befehlspalette findet den Mitarbeiter auch darunter,
die Liste nennt ihn unter dem Namen („früher: Albers, Felix“), die Akte zeigt
den **Namensverlauf**. Fortbildungsnachweise, Sitzungsteilnahmen, Planung und
Geräteeinweisungen hängen am Mitarbeiter, nicht am Namen, und bleiben deshalb
unverändert zugeordnet. Bei Einweisungen, die der Mitarbeiter selbst gegeben
hat, steht als einweisende Person weiter der Name vom Tag der Einweisung.

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
werden. Möglich sind Änderungen an Status, Beruf, Dienstwochenende,
Zusatzqualifikationen sowie Ein- und Austrittsdatum. Ein gemeinsamer Austritt
wird abgewiesen, wenn er bei einem der Ausgewählten vor dessen Eintritt läge.

Verantwortliche Personen eines Dienstwochenendes können nicht durch eine
Sammelaktion in ein anderes Wochenende verschoben werden.

### Mitarbeiter-Gesamtakte

Die Schaltfläche **Mitarbeiterakte** in der Zeile öffnet die Gesamtakte –
ebenso **Gesamtakte** in der Schnellansicht, im Kontextmenü und in der
Befehlspalette. Sie enthält:

- Stammdaten und Kontaktdaten
- Beschäftigungsstatus und Stellenanteil
- Namensverlauf nach Namensänderungen
- Qualifikationen und Ablaufdaten
- Pflichtfortbildungsstatus
- Teamsitzungsteilnahmen
- Änderungsverlauf (nur für Administratoren)
- Druckansicht

Der **Änderungsverlauf** zeigt die letzten 25 Änderungen an diesem Mitarbeiter:
wann, durch wen und was – etwa „Stammdaten: Beruf, Stellenumfang“,
„Abwesenheitsplanung: 3 Einträge“, „Fortbildungsnachweis“ oder
„Geräteeinweisung“. Erfasst sind Änderungen ab Version 4.51.0; was davor
geschah, steht nur im allgemeinen Änderungsprotokoll ohne Bezug zum
Mitarbeiter. Ältere Einträge fallen heraus, sobald das Protokoll seine
Höchstzahl von 1000 Einträgen erreicht.

### E-Mail-Adressen exportieren

**E-Mails kopieren** erzeugt aus den sichtbaren, aktiven Mitarbeitern einen
einzelnen String. Die Adressen werden durch Semikolon getrennt und direkt in
die Zwischenablage kopiert.

### Benutzernamen exportieren

**Benutzernamen kopieren** arbeitet nach demselben Prinzip und kopiert die
Benutzernamen der aktuell gefilterten Mitarbeiter, ebenfalls durch Semikolon
getrennt. Mitarbeiter ohne hinterlegten Benutzernamen werden übersprungen,
doppelte Namen nur einmal aufgenommen. Beide Schaltflächen zeigen die Anzahl
der betroffenen Einträge an.

### Telefonliste drucken

**Telefonliste drucken** öffnet eine integrierte DIN-A4-Druckvorschau innerhalb
von TeO. Es wird kein separates Browser- oder `about:blank`-Fenster benötigt.
Die Liste ist alphabetisch nach Nachname und Vorname sortiert und enthält
ausschließlich die Spalten **Name** und **Nummer**.

Die Telefonliste enthält immer alle Mitarbeiter mit dem Status **Aktiv** oder
**In Einarbeitung** – unabhängig davon, welche Filter in der Mitarbeiterübersicht
gerade gesetzt sind. Sie ist als Aushang gedacht und soll jede im Dienst
erreichbare Person führen. Inaktive Mitarbeiter erscheinen nicht.

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
- Stellenumfang des Mitarbeiters, gegebenenfalls mit Änderungen im Jahr
- Ein- und Austritt im Jahr
- individuell erarbeitetem Zusatzurlaub durch Schichtdienst
- übertragenem Resturlaub aus dem Vorjahr

Ein- und Austritt sowie Änderungen des Stellenumfangs im Jahr werden
gezwölftelt, wie es TVöD und AVR für Teiljahre vorsehen: Jeder **volle**
Beschäftigungsmonat bringt ein Zwölftel des Grundurlaubs, bemessen am
Stellenumfang dieses Monats; ändert er sich mitten im Monat, zählt jeder Tag mit
seinem Wert. Angefangene Monate zählen nicht. Beispiel:
Eintritt am 1. April bei 100 % ergibt 9/12 von 30 = 22,5 Tage; Wechsel von
100 % auf 50 % zum 1. Juli ergibt 15 + 7,5 = 22,5 Tage. Ein anteiliger Wert
in der Spalte **Basis** trägt ein Sternchen, der Tooltip nennt die Zahl der
vollen Monate.

Grundurlaub, Abwesenheitsgrenzen, Referenzsamstag und der Verfallstag des
Resturlaubs werden unter **Einstellungen → Planung** gepflegt.

Die sechs Summenspalten **Basis**, **Zusatz**, **Übertrag**, **Anspruch**,
**Geplant** und **Rest** bleiben beim horizontalen Scrollen fixiert.

### Urlaubsanspruch bei Teilzeit

TeO kürzt den Grundanspruch linear zum hinterlegten Stellenumfang: 30 Tage bei
50 Prozent ergeben 15 Tage. Das Bundesurlaubsgesetz bemisst den Anspruch
dagegen nach der Zahl der **Arbeitstage pro Woche**. Beide Rechnungen stimmen
überein, solange Teilzeit auch weniger Arbeitstage bedeutet.

Arbeitet jemand in Teilzeit bei unveränderter Fünftagewoche – also kürzere Tage
statt weniger Tage –, steht dieser Person weiterhin der volle Anspruch zu; TeO
weist dann zu wenig aus. Der Wert muss in diesem Fall über **Zusätzliche Tage**
in der Urlaubsplanung ausgeglichen werden.

### Resturlaub aus dem Vorjahr

Die Spalte **Übertrag** nimmt den Resturlaub aus dem Vorjahr auf. Er lässt sich
je Mitarbeiter von Hand eintragen oder für alle auf einmal übernehmen:
**Resturlaub übernehmen** über der Planungstabelle trägt für das gewählte
Planungsjahr den Rest des Vorjahres ein – also Anspruch minus geplante
Urlaubstage. Mitarbeiter ohne einen einzigen Planungseintrag im Vorjahr bleiben
dabei unverändert, weil für sie offensichtlich keine Daten vorliegen. Bereits
eingetragene Überträge werden ersetzt; die Übernahme lässt sich zurücknehmen.

Urlaub, der bis zum Verfallstag – vorgegeben ist der **31.03.** – geplant ist,
zehrt zuerst den Übertrag auf. Was danach noch übrig ist,

- wird **vor** dem Verfallstag orange hervorgehoben; ein Hinweis über der
  Tabelle nennt die betroffenen Mitarbeiter,
- ist **nach** dem Verfallstag verfallen: Der Wert erscheint durchgestrichen
  und zählt nicht mehr zum Anspruch.

Der Tooltip der Übertrag-Zelle nennt jeweils die Anzahl der Tage.

### Planungseinträge

Folgende Eintragsarten stehen zur Verfügung:

- Urlaub
- Urlaub Einarbeitung
- Schule, Weiterbildung oder Universität
- unbezahlter Urlaub
- Nachtdienst
- externer Einsatz
- frei geplant
- verpflichtende Dienstzusage

**Urlaub Einarbeitung** wird nicht auf die tägliche Abwesenheitsgrenze und
nicht auf den regulären Urlaubsverbrauch angerechnet.

**Frei geplant** zählt als Abwesenheit, verbraucht aber keinen Urlaubstag. Der
Eintrag erscheint als **×** im selben Grün wie der Urlaub.

**Nachtdienst** ist keine Abwesenheit und verbraucht keinen Urlaubstag.

### Monatsplanung

1. Jahr und Monat auswählen.
2. Gewünschte Eintragsart festlegen.
3. In der Zeile des Mitarbeiters auf den entsprechenden Tag klicken.
4. Ein erneuter Klick beziehungsweise die Auswahl „Kein Eintrag“ entfernt
   den Planungseintrag.

Der zuletzt gewählte Monat und das Planungsjahr werden im Browser gespeichert.
Die beiden Pfeile in der ersten Zelle der Tabelle – neben Monat und Jahr –
blättern zum vorherigen beziehungsweise nächsten Monat, auch über den
Jahreswechsel hinweg. In der maximierten Planung bleibt oberhalb der Tabelle
nur die kompakte, mit den farbigen Tabellensymbolen dargestellte
Tastaturbelegung sichtbar.

Die Kopfzeile bleibt beim vertikalen Scrollen sichtbar. Wochenenden,
Feiertage, Schulferien und die beiden Dienstwochenenden werden farblich
unterschieden.

### Sortierung der Planungstabelle

Die Namen stehen als **Nachname, Vorname**. Die Auswahl **Sortierung** in der
Steuerleiste ordnet die Zeilen wahlweise

- **Nachname (alphabetisch)** – alle Mitarbeiter nach Nachname, dann Vorname,
- **Qualifikation** – nach Gruppen und innerhalb einer Gruppe alphabetisch nach
  Nachname. Vorgegeben ist: Stationsleitung, Stellv. Stationsleitung,
  Fachweiterbildung, Pflegefachkraft, aktuell in Einarbeitung, ITA
  (Intensivtechnische/r Assistent/in), Pflegefachassistenz, MFA,
  Stationsassistenz. Wer in keine dieser Gruppen fällt, steht am Ende unter
  „Ohne Gruppe“. Jede Gruppe beginnt mit einer Zwischenzeile, die ihren Namen
  und die Zahl ihrer Mitarbeiter nennt.

Die Gruppe ergibt sich aus den Stammdaten, und zwar in dieser Rangfolge:
Qualifikation *Stationsleitung*, dann *Stellvertretende Stationsleitung*, dann
der Status *In Einarbeitung*, dann die Qualifikation *Fachweiterbildung I/A*,
zuletzt der Beruf: Zu ITA zählt ein Beruf namens „ITA“ oder
„Intensivtechnische/r Assistent/in“, zu MFA „Medizinische/r Fachangestellte/r“.
Eine Stationsleitung in Einarbeitung steht also bei der Stationsleitung.

Die Reihenfolge der Gruppen lässt sich unter **Einstellungen → Planung →
Sortierung nach Qualifikation** mit den Pfeilen umstellen; jede Verschiebung
gilt sofort für alle Arbeitsplätze, **Vorgabe wiederherstellen** setzt sie
zurück. Die gewählte Sortierart merkt sich dagegen jeder Browser selbst.

### Darstellung der Mitarbeiterzeilen

Unter dem Namen des Mitarbeiters stehen das feste **Dienstwochenende** und der
Beschäftigungsgrad. Der Beschäftigungsstatus bleibt im Tooltip der Zeile
sichtbar.

Ein **Geburtstag** ist an der goldenen Schraffur des Tagesfeldes erkennbar; der
Tooltip nennt das erreichte Lebensjahr. Fällt der Geburtstag auf den
29. Februar, wird er in Nicht-Schaltjahren am 28. Februar angezeigt.

### Fadenkreuz

Das Häkchen **Fadenkreuz** in der Steuerleiste schaltet eine Lesehilfe ein.
Vorgegeben ist „aus“; jeder Browser merkt sich die Wahl.

Eingeschaltet heben sich beim Überfahren einer Tageszelle deren Zeile und
Spalte leicht blau ab – die Zeile samt Name und Summen, die Spalte samt
Tageskopf. Die Zelle im Schnittpunkt ist etwas kräftiger getönt. Es genügt,
irgendwo in die Zelle zu zeigen, nicht nur auf das Feld darin. Bei der
Tastaturbedienung folgt das Fadenkreuz dem ausgewählten Feld.

Die Tönung liegt über den Zellen. Wochenend-, Feiertags-, Ferien- und
Überplanungskennzeichnung bleiben also sichtbar.

### Tastaturbedienung der Planungstabelle

Ein Klick auf ein Tagesfeld setzt den Ausgangspunkt; danach lässt sich die
Tabelle vollständig über die Tastatur ausfüllen.

| Taste | Wirkung |
| --- | --- |
| `U` | Urlaub |
| `A` | Urlaub Einarbeitung |
| `S` | Schule / Weiterbildung / Uni |
| `B` | Unbezahlter Urlaub |
| `N` | Nachtdienst |
| `E` | Externer Einsatz |
| `F` | Frei geplant |
| `D` | Verpflichtende Dienstzusage |
| `Entf` oder `Rücktaste` | Eintrag entfernen |
| Pfeiltasten | Feld wechseln |
| `Pos 1` / `Ende` | an den Monatsanfang oder das Monatsende springen |
| `Bild auf` / `Bild ab` | Monat wechseln, Zeile und Tag bleiben erhalten |
| `Umschalt` + Pfeil | Bereich über mehrere Tage und Zeilen markieren |
| `Esc` | Bereichsmarkierung aufheben |

Ein Buchstabe **weist zu** und schaltet nicht um: Wird derselbe Eintrag erneut
getippt, bleibt er stehen. Entfernt wird ausschließlich mit `Entf` oder der
Rücktaste. Die Auswahl **Eintragsart** in der Steuerleiste übernimmt den zuletzt
getippten Buchstaben, damit Klick und Tastatur dieselbe Eintragsart verwenden.

Eine mit `Umschalt` markierte Fläche wird in einem Zug beschrieben – das ergibt
einen einzigen Eintrag im Änderungsprotokoll und eine einzige Sammelmeldung,
falls dabei Abwesenheitsgrenzen überschritten werden.

Die Navigation folgt der sichtbaren Tabelle: Ist ein Namensfilter gesetzt,
springen die Pfeiltasten nur zwischen den angezeigten Zeilen.

### Mit der Maus über mehrere Tage ziehen

Im Monatsraster lässt sich mit gedrückter Maustaste über mehrere Felder ziehen –
auch über mehrere Zeilen hinweg. Beim Loslassen erhalten alle überstrichenen
Felder die in der Leiste gewählte Eintragsart. Das entspricht der
Bereichsauswahl über **Umschalt + Pfeiltaste** und ist wie jede andere Änderung
zurücknehmbar. Ein einzelner Klick setzt weiterhin genau ein Feld.

### Nach Mitarbeitern filtern

Das Suchfeld **Mitarbeiter** blendet alle Zeilen aus, die nicht zum Suchbegriff
passen; gesucht wird in Vor- und Nachname sowie im Benutzernamen. Die
Tagesgrenzen beziehen sich weiterhin auf das gesamte Team, damit ein Filter die
Auslastung nicht verfälscht. Ist ein Filter aktiv, weist ein Hinweis über der
Tabelle darauf hin.

### Abwesenheitsgrenzen

Standardmäßig gelten:

- Werktage: höchstens 8 gleichzeitig abwesende Mitarbeiter
- Wochenenden und Feiertage: höchstens 5 gleichzeitig abwesende Mitarbeiter

Beide Grenzwerte sind konfigurierbar. Eine Überplanung bleibt möglich, wird
aber deutlich markiert: Die Spalte des Tages ist rot eingerahmt, und die
Belegung im Spaltenkopf steht auf rotem Grund. Wochenend-, Feiertags- und
Ferienkennzeichnung bleiben darunter sichtbar.

Die Grenze beschreibt den Pflegepool, der sich gegenseitig vertritt. Nicht
mitgezählt werden Abwesenheiten von

- Medizinischen Fachangestellten
- Pflegefachassistenz
- Stationsassistenz

Diese Einträge bleiben in der Tabelle sichtbar und werden im Tooltip des Tages
gesondert ausgewiesen, belegen aber keinen der gleichzeitig möglichen Urlaube –
auch nicht beim Ausgleich am Dienstwochenende.

### Überschneidungen prüfen

Die Schaltfläche **Überschneidungen prüfen** öffnet eine Liste aller Tage des
Planungsjahres, an denen die Tagesgrenze überschritten ist. Zu jedem Tag
erscheinen:

- wirksame Abwesenheiten und geltende Grenze
- Feiertag, Schulferien und Dienstwochenende des Tages
- alle beteiligten Mitarbeiter mit Eintragsart, Beruf und Dienstwochenende

Einträge **Schule / Weiterbildung / Uni** und **Externer Einsatz** stehen je Tag
vorn und sind ausgegraut: Sie zählen als Abwesenheit, lassen sich aber meist
nicht verschieben. Die übrigen Abwesenheiten folgen darunter. Nicht angerechnete
Assistenzberufe sind gestrichelt umrandet. Ein Klick auf das Datum springt in
den zugehörigen Monat der Planungstabelle.

### Dienstwochenenden und Kompensation

Übernimmt ein Mitarbeiter einen Dienst an dem Wochenende, das nicht sein
festes Dienstwochenende ist – eingetragen als **Verpflichtende Dienstzusage**
(`D`) –, verringert das die wirksamen Abwesenheiten dieses Tages um eins. Jede
solche Dienstübernahme wird also von einer Überplanung abgezogen, gleich welche
Abwesenheit sie ausgleicht; unter null sinkt die Zahl nicht.

Im Spaltenkopf steht dann neben der Belegung, um wie viel sie gesenkt wurde
(etwa `−2`), und `D2` nennt die Zahl aller Dienstzusagen des Tages. Eine
Dienstzusage auf dem eigenen Dienstwochenende, an einem Werktag oder von einem
Mitarbeiter ohne festes Dienstwochenende zählt nicht, ebenso wenig die
Zusage eines nicht angerechneten Assistenzberufs.

### Jahresübersicht je Mitarbeiter

Ein Klick auf den Mitarbeiternamen öffnet eine Jahresmatrix:

- Monate in der ersten Spalte
- Kalendertage in der Kopfzeile
- das eigene Dienstwochenende blau umrahmt, Feiertage und Schulferien markiert
- alle Abwesenheiten und Dienstzusagen tageweise sichtbar
- rechts je Monat die genommenen Urlaubstage und – falls vorhanden – die Tage
  „Schule / Weiterbildung / Uni“

**Jahr drucken** gibt die Matrix aus. Da sie 31 Tagesspalten hat, ist das
Querformat voreingestellt.

### Leere Vordrucke zum Ausfüllen von Hand

Zwei Schaltflächen im Kopf der Urlaubsplanung geben leere Vordrucke aus –
gedacht für Aushang und Handeintrag, bevor die Planung in TeO übertragen wird.
Beide zeigen Feiertage, Schulferien und Dienstwochenenden, aber keine bereits
erfassten Einträge.

**Leere Jahresübersichten** druckt ein Blatt je aktivem oder einzuarbeitendem
Mitarbeiter: zwölf Monatszeilen, 31 Tagesspalten.

**Leere Monatsplanungen** druckt umgekehrt ein Blatt je Monat des gewählten
Jahres, darauf alle aktiven und einzuarbeitenden Mitarbeiter alphabetisch
untereinander – nach Nachname, Vorname – und die Tage des Monats als Spalten.
Unter jedem Namen stehen Beschäftigungsumfang und Jahresurlaubsanspruch
einschließlich zusätzlicher Tage. Das Dienstwochenende ist an der Umrandung
der betreffenden Tagesspalten abzulesen.

Auf ein Blatt passen 20 Mitarbeiter. Ein größeres Team verteilt sich auf
mehrere Blätter je Monat; jedes trägt dann den Monat im Kopf und daneben
**Seite x von y** für diesen Monat, damit ein Stapel sich wieder sortieren
lässt. Bei nur einem Blatt je Monat entfällt die Seitenangabe.

Wer nur einen einzelnen Monat braucht, wählt die Seiten im Druckdialog aus.

Beide Vordrucke sind auf DIN A4 quer ausgelegt.

### Feiertage und Schulferien

Gesetzliche Feiertage in Nordrhein-Westfalen werden für jedes Jahr automatisch
berechnet und müssen nicht gepflegt werden.

Die Schulferien stammen dagegen aus **Einstellungen → Schulferien** und lassen
sich dort für beliebige Jahre ergänzen; vorbelegt ist die amtliche
Ferienordnung NRW bis April 2030. Örtlich unterschiedliche bewegliche
Ferientage sind nicht enthalten.

## Memo / ToDo

Memos und ToDos benötigen nur einen Titel. Optional können Beschreibung,
Fälligkeitsdatum und Kategorie ergänzt werden. Einträge lassen sich als erledigt
markieren und wieder öffnen. Angepinnte Einträge werden farblich hervorgehoben
und unabhängig vom Datum zuerst angezeigt.

Mit **Für alle Nutzer sichtbar** steht der Eintrag jedem angemeldeten Konto zur
Verfügung. **Nur in meiner Ansicht** blendet ihn für andere Konten aus. Suche,
Kategorie und Status können miteinander kombiniert werden.

Wichtig zur Einordnung: „Nur in meiner Ansicht“ ist eine Anzeigeeinstellung,
keine Verschlüsselung und keine Zugriffsbeschränkung. Der Eintrag bleibt Teil
des gemeinsamen Datenbestands und erscheint deshalb unverändert in
Datensicherungen sowie in der Datenbank. Vertrauliche Angaben – etwa zu
einzelnen Personen – gehören nicht in ein Memo.

Die Kategorien werden unter **Einstellungen → Stammdaten & Zugriffe →
Memo-/ToDo-Kategorien** angelegt, umbenannt oder gelöscht. Umbenennungen werden
in vorhandene Einträge übernommen.

Offene, für das angemeldete Konto sichtbare Einträge erscheinen auf der
Übersichtsseite unter dem Schnellzugriff – nur wenn es solche
Einträge gibt.

## Terminkalender und Fristenmonitor

### Termine anlegen

Ein Termin benötigt mindestens:

- Titel
- Datum

Optional können Uhrzeit von/bis, Ort, Beschreibung und eine **Kategorie**
hinterlegt werden.

**Speichern & Drucken** legt den Termin an und öffnet eine mittig gesetzte
DIN-A4-Druckansicht. Ist **Teilnehmerliste** aktiviert, enthält sie zusätzliche
Leerzeilen zur handschriftlichen Eintragung. Ein Klick auf einen Termin im
Fristenmonitor öffnet ihn zum Bearbeiten; in der Terminübersicht öffnet ein
Klick auf die Karte die Schnellansicht, der Stift den Bearbeitungsdialog.

Zur Auswahl stehen Geräteeinweisung, Teamsitzung, Meeting,
Stationsleiterkonferenz, Begehung, Hospitation, Prüfung, Schulung und
Baumaßnahme. Jede Kategorie hat
ein eigenes Symbol, das in der Terminübersicht und im Fristenmonitor anstelle
des allgemeinen Kalendersymbols erscheint; im Fristenmonitor ersetzt die
Kategorie zusätzlich die Bezeichnung „Termin“. Termine ohne Kategorie behalten
das Kalendersymbol.

### Liste oder Monatskalender

Rechts in der Werkzeugleiste des Terminkalenders wird zwischen zwei
Darstellungen umgeschaltet:

- **Liste:** die gewohnte Aufstellung nach angepinnten, anstehenden und
  vergangenen Terminen
- **Kalender:** ein Monatsraster mit einem Feld je Tag, Woche ab Montag

Im Monatsraster steht in jedem Tagesfeld, was an diesem Tag ansteht – mit
Uhrzeit, Kategoriesymbol und Titel. Der heutige Tag ist hervorgehoben,
Wochenenden und Feiertage in Nordrhein-Westfalen sind abgesetzt; der Name des
Feiertags steht im Feld. Ab dem vierten Termin eines Tages klappt **+n
weitere** den Rest auf.

- Ein Klick auf ein Tagesfeld legt einen Termin für genau diesen Tag an.
- Ein Klick auf einen Eintrag öffnet seine Schnellansicht; ein Termin lässt
  sich auch auf einen anderen Tag ziehen.
- Die Pfeile wechseln den Monat, **Heute** springt zum laufenden Monat zurück.

Suchfeld und Zeitraumfilter wirken in beiden Darstellungen; angepinnte Termine
bleiben wie in der Liste unabhängig vom Zeitraumfilter sichtbar. Die gewählte
Darstellung und der zuletzt angesehene Monat bleiben im Browser gespeichert und
stehen beim nächsten Aufruf wieder bereit. Auf schmalen Bildschirmen zeigt jedes
Tagesfeld statt der Titel farbige Balken – ein Tippen öffnet den Termin.

### Fristenmonitor

Der Fristenmonitor steht auf der Übersichtsseite unter den Kennzahlen und
heißt dort **Als Nächstes**. Die nächsten sieben Tage stehen als Zeitleiste mit
Datum, alles Spätere als kurze Liste; höchstens 25 Einträge, angeheftete
Termine immer. Überfälliges und Datenqualitätsprobleme mit hoher Priorität
stehen oben unter **Überfällig und zu prüfen**.

Er zeigt:

- anstehende Termine; Schulungen und Geräteeinweisungen aus dem Terminkalender
  werden dabei dem Filter **Fortbildungen** zugeordnet
- Geburtstage
- fällige Pflichtfortbildungen; überfällige stehen gebündelt unter **Offene
  Nachweise nach Fortbildung**
- ablaufende Zusatzqualifikationen
- unter **Personal**: Ende der Probezeit (sechs Monate nach Eintritt),
  bevorstehende Austritte und Änderungen des Stellenumfangs sowie
  Dienstjubiläen nach 10, 20, 25, 30 und 40 Jahren. Bereits vergangene
  Personalfristen erscheinen nicht – ein abgelaufenes Probezeitende ist
  erledigt, keine offene Aufgabe.

Der Zeitraum kann auf 7, 30 oder 90 Tage eingestellt werden. Kategorien
lassen sich einzeln ein- oder ausblenden.
Der zusätzliche Filter **Überfällige ausblenden** zeigt nur aktuell anstehende
Einträge und wird gemeinsam mit den Kategorie-Filtern gespeichert.

Geburtstage erscheinen mit Name, erreichtem Lebensjahr und vollständigem
Geburtsdatum.

## Pflichtfortbildungen

### Fortbildungskatalog

Beim Anlegen einer Pflichtfortbildung werden Titel, Einführungsjahr,
Beschreibung und Wiederholungsintervall festgelegt.

Das angegebene Jahr ist das Einführungsjahr im Pflichtkatalog. Eine
Fortbildung steht ab diesem Jahr auch in späteren Jahren zur Verfügung.

Unter **Einstellungen → Pflichtfortbildungen** kann für jede Fortbildung
optional eine Soll-Zeit in Minuten hinterlegt werden.

### Zeiten berechnen

Über **Pflichtfortbildungen → Zeiten berechnen** öffnet sich ein Rechner mit
zwei Bereichen:

- Bis zu 20 Zeitspannen in Minuten und Sekunden werden live addiert und im
  Format `mm:ss` angezeigt.
- Alle Fortbildungen mit hinterlegter Soll-Zeit werden aufgelistet. Je
  Fortbildung kann die tatsächlich anzurechnende Arbeitszeit in Minuten
  eingegeben werden.

Die anrechenbare Fortbildungszeit wird als Minutenwert und zusätzlich im Format
`hh:mm` angezeigt.

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

Die Jahresauswertung zeigt die Pflichtfortbildungsquote des gewählten Jahres. Der
aufklappbare Verlauf stellt die Quote zusätzlich als Balkendiagramm über alle
Auswertungsjahre dar. Ein Klick auf einen Mitarbeiternamen in der Matrix öffnet
direkt die zugehörige Mitarbeiter-Akte.

Die Jahresmatrix zeigt:

- aktive Mitarbeiter in der ersten Spalte
- Pflichtfortbildungen in der Kopfzeile, darunter jeweils der
  Komplettierungsgrad in Prozent
- grünes Häkchen für erfüllt
- rotes Kreuz für offen

Der Komplettierungsgrad gibt an, welcher Anteil der aktiven Mitarbeiter diese
Pflicht zum Jahresende erfüllt. Die Farbskala entspricht der Einweisungsmatrix:
bis 65 Prozent rot, bis 80 Prozent orange, darüber grün. Der Tooltip nennt die
absoluten Zahlen.

Mehrjährig gültige Nachweise erfüllen auch nachfolgende Auswertungsjahre.
Die Matrix kann gedruckt, als PDF gespeichert oder Excel-kompatibel als CSV
exportiert werden.

## Teamsitzungen

### Sitzung anlegen

Titel, Datum, Uhrzeit und Notizen werden erfasst. Die Sitzungen stehen mit
der neuesten zuerst.

### Teilnahme effizient dokumentieren

Für das aktive Team stehen folgende Statuswerte zur Verfügung:

- teilgenommen
- Urlaub
- Dienst
- Krankheit
- Schule
- entschuldigt
- unentschuldigt
- nicht zutreffend

Der Status **nicht zutreffend** ist beispielsweise für Personen vorgesehen,
die zum Sitzungszeitpunkt noch nicht zum Team gehörten. Diese Einträge werden
weder im Zähler noch im Nenner der Anwesenheitsstatistik berücksichtigt.

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

Im Gerätekatalog werden verwaltet:

- Hersteller
- Produkt- oder Modellname
- Gerätekategorie
- aktueller Gerätebestand
- Medizinprodukt der Anlage 1

Der Katalog ist alphabetisch nach Gerätenamen sortiert. Standardmäßig werden
nur Geräte aus dem aktuellen Bestand angezeigt.

Über das Suchfeld der Geräteverwaltung lässt sich der Katalog nach **Geräte-
oder Herstellername** durchsuchen. Die Suche unterscheidet keine Groß- und
Kleinschreibung und wirkt zusätzlich zu den Filtern für Bestand, Anlage 1 und
Kategorie.

Je Gerät werden alle **einweisungsberechtigten Mitarbeiter** angezeigt. Als
einweisungsberechtigt gilt, wer bei einer dokumentierten Herstellereinweisung
für dieses Gerät teilgenommen hat und zum Einweisungszeitpunkt als
Gerätebeauftragter erfasst war. Der historische Status ist maßgeblich. Der
Katalog kann nach einer bestimmten berechtigten Person sowie nach Geräten mit
oder ohne hinterlegte Einweisungsberechtigte gefiltert werden.

### Einweisung dokumentieren

Eine Geräteeinweisung enthält:

- ein oder mehrere Geräte
- Einweisungsdatum
- einen oder mehrere Teilnehmer
- Einweisenden

Einweisende können externe, vom Hersteller beauftragte Personen oder interne
Medizinproduktebeauftragte sein. Der Status zum Zeitpunkt der Einweisung wird
historisch festgehalten.

Das **Einweisungsdatum ist nicht vorbelegt**. Einweisungen werden häufig
nachträglich erfasst; ein voreingetragenes Tagesdatum würde leicht übersehen.

Die Geräteauswahl ist durchsuchbar – nach Geräte- oder Herstellername, ohne
Beachtung der Groß- und Kleinschreibung – und alphabetisch nach Hersteller,
dann nach Gerätename sortiert. Geräte, die nicht mehr im Bestand sind, werden
entsprechend gekennzeichnet.

Beim Anlegen lassen sich **mehrere Geräte gleichzeitig** auswählen. Alle
erhalten dieselben Angaben zu Datum, Art der Einweisung, einweisender Person
und Teilnehmern; gespeichert wird je Gerät ein eigener Nachweis, sodass Verlauf
und Matrix unverändert arbeiten. **Sichtbare auswählen** übernimmt alle Geräte
der aktuellen Suche auf einmal.

Beim Bearbeiten eines vorhandenen Nachweises bleibt es bei genau einem Gerät –
ein Nachweis gehört immer zu einem Gerät.

### Erfasste Einweisungen sortieren

Die Liste **Erfasste Einweisungen** lässt sich auf zwei Arten ordnen:

- **Einweisungsdatum, neueste zuerst** (Voreinstellung) – zeigt den fachlichen
  Verlauf.
- **Eingabedatum, zuletzt erfasste zuerst** – zeigt, was zuletzt dokumentiert
  wurde. Das hilft beim Nacherfassen älterer Einweisungen, die sonst weit
  hinten stünden. In dieser Ansicht steht unter dem Einweisungsdatum
  zusätzlich das Erfassungsdatum.

Bei gleichem Wert entscheidet jeweils das andere Datum, damit die Reihenfolge
stabil bleibt.

### Einweisungsmatrix

Die Matrix zeigt Mitarbeiter in den Zeilen und Geräte in den Spalten.
Über **Maximieren** lässt sie sich wie die Tabelle der Urlaubsplanung nahezu
fensterfüllend anzeigen. **Verkleinern** oder die Escape-Taste stellt die
normale Ansicht wieder her; geöffnete Dialoge haben bei Escape Vorrang.
Filterbar sind unter anderem:

- Anlage 1
- Gerätekategorie
- aktueller Gerätebestand
- Mitarbeiterstatus
- Mitarbeitername
- Gerätename

Der Einweisungsstand je Gerät wird farblich angezeigt:

- 0 bis 65 Prozent: rot
- 66 bis 80 Prozent: orange
- 81 bis 100 Prozent: grün

Bei Medizinproduktebeauftragten wird eine Herstellereinweisung gold
gekennzeichnet.

Ein Klick auf einen Mitarbeiter öffnet seine Geräteübersicht mit allen Geräten
und ihrem Einweisungsstand. **Nur offene Einweisungen** blendet die Geräte aus,
für die eine Einweisung dokumentiert ist, **Nur Geräte im Bestand** die
ausgemusterten. Beide Filter lassen sich kombinieren und bleiben beim Wechsel
zum nächsten Mitarbeiter eingestellt.

**Export Excel** im Kopf der Matrix speichert sie als Excel-Datei (`.xlsx`),
mit denselben Filtern wie auf dem Bildschirm:

- Spaltenköpfe: Hersteller und Gerätename, etwa „Dräger Evita V500“
- Zeilenköpfe: Nachname, gegebenenfalls Geburtsname, Vorname und die
  Kennzeichnung als Medizinproduktebeauftragte/r, etwa „Müller, geb. Schmidt,
  Anna, MP-Beauftragte/r“. Als Geburtsname gilt der Nachname des ältesten
  eingetragenen Namens (siehe Namensänderungen), sofern er vom heutigen
  abweicht
- Zellen: Datum der letzten gültigen Einweisung. Ohne Einweisung oder wenn
  alle Einweisungen durch eine angeordnete Neueinweisung nichtig sind, bleibt
  die Zelle leer

Kopfzeile und Namensspalte sind fixiert, die Kopfzeile trägt einen
Autofilter, und die Daten lassen sich in Excel als Datum sortieren.

Unterhalb der Matrix werden dokumentierte Einweisungen chronologisch
aufgelistet und können bearbeitet werden.

### Neueinweisung anordnen

Macht ein Softwareupdate oder ein Umbau ein Gerät erneut
einweisungspflichtig, werden die bisherigen Einweisungen **für nichtig
erklärt**, statt sie zu löschen. Dazu dient **Neueinweisung anordnen** – das
Warnsymbol an der Gerätekarte oder die Schaltfläche in der Einweisungsübersicht
des Geräts. Anzugeben sind:

- der **Stichtag**, ab dem neu einzuweisen ist (vorbelegt mit heute, nicht in
  der Zukunft)
- ein **Grund**, etwa „Softwareupdate 3.2“

Der Dialog nennt vorab, wie viele Mitarbeiter ihre gültige Einweisung verlieren
und wie viele Einweisungsberechtigungen entfallen.

Danach gilt:

- Alle Einweisungen **vor** dem Stichtag sind nichtig. Eine Einweisung **am**
  Stichtag selbst zählt bereits.
- In der Matrix erscheinen nichtige Einweisungen orange mit **↻** und dem alten
  Datum. Der Prozentwert je Gerät zählt nur gültige Einweisungen.
- Die Nachweise bleiben im Verlauf und in **Erfasste Einweisungen** stehen,
  gekennzeichnet mit **nichtig seit …**.
- Wer als Medizinproduktebeauftragte/r nur vor dem Stichtag vom Hersteller
  eingewiesen wurde, ist nicht mehr **einweisungsberechtigt**, bis eine neue
  Herstellereinweisung dokumentiert ist.
- Die Gerätekarte zeigt Stichtag, Grund und wie viele schon neu eingewiesen
  sind. In der Einweisungsübersicht des Geräts filtert **Neueinweisung nötig**
  die Betroffenen; **Nur offene Einweisungen** in der Geräteübersicht eines
  Mitarbeiters schließt nichtige Einweisungen ein.
- Die Übersicht führt unter **Überfällig und zu prüfen** jedes Gerät im Bestand
  mit offenen Neueinweisungen; ein Klick öffnet seine Einweisungsübersicht.
- Wird beim Dokumentieren ein Datum vor dem Stichtag gewählt, weist der Dialog
  darauf hin. Speichern bleibt möglich, etwa für Nachträge.

Mehrere Neueinweisungen nacheinander sind möglich; maßgeblich ist der späteste
Stichtag. Im selben Dialog lässt sich eine irrtümlich angeordnete
Neueinweisung mit **Aufheben** zurücknehmen. Der Excel-Export des
Gerätekatalogs enthält Stichtag und Grund.

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

### Automatische Sicherung in einen Ordner

Unter **Einstellungen → Gesamten Datenbestand sichern** kann ein lokaler
Sicherungsordner ausgewählt werden. TeO schreibt sofort eine vollständige
JSON-Sicherung und danach zwei Sekunden nach der jeweils letzten Änderung
erneut. Jede Sicherung überschreibt dieselbe Datei
`teo-autosicherung.json`. Der Dateiname bleibt auch bei aktivierter
Verschlüsselung unverändert; TeO erkennt das Format am Dateiinhalt.

Administratoren können unter **Einstellungen → Sicherungserinnerung** die
maximale Größe einer Sicherungsdatei zwischen 1 und 100 MB festlegen. Der
Standardwert beträgt 20 MB. Die Grenze gilt beim Erstellen, Prüfen,
Laden vor der Anmeldung und Import. Ab 90 % des eingestellten Volumens zeigt TeO eine
Warnung mit aktueller Dateigröße und Grenzwert an. Wird die Grenze
überschritten, muss sie vor der nächsten Sicherung oder dem Import erhöht
werden.

Ein farbiger Balken in den Einstellungen zeigt die zuletzt gemessene
Sicherungsgröße als „xx von yy MB“. Solange noch keine Sicherung in diesem
Browser erstellt oder eingelesen wurde, verwendet TeO eine Schätzung des
aktuellen unverschlüsselten Datenbestands. Der Balken ist unter 90 % grün, ab
90 % gelb und bei überschrittenem Grenzwert rot.

Automatische Sicherungen können in den Einstellungen mit AES-GCM verschlüsselt
werden. TeO erzeugt dafür einen gemeinsamen zufälligen Sicherungsschlüssel und
hinterlegt ihn für jedes Konto geschützt durch dessen Login-Passwort. Beim
Anmelden wird der Schlüssel automatisch entsperrt; eine zusätzliche Eingabe für
laufende Sicherungen ist nicht nötig. Neue Konten, Passwortänderungen und
administrative Passwort-Resets erhalten automatisch eine aktualisierte
Schlüsselhülle.

Der Schlüssel gehört zum Datenbestand, nicht zum Arbeitsplatz: Sein Verzeichnis
mit den Schlüsselhüllen aller Konten steht in `teo-autosicherung.json` selbst –
in der äußeren Hülle, die auch ohne Schlüssel lesbar ist. Jeder Arbeitsplatz
entsperrt daraus mit dem gewohnten Login-Passwort denselben Schlüssel. Ein
einmal geschützter Datenbestand braucht dafür kein neues Passwort, und ein an
einem anderen Arbeitsplatz angelegtes Konto bekommt seine Hülle beim ersten
Login selbst.

Bei der Einrichtung zeigt TeO einen Wiederherstellungsschlüssel an. Er muss
getrennt von den Sicherungsdateien sicher verwahrt werden und ermöglicht die
Wiederherstellung nach einem vollständigen Verlust des Browserprofils. Nach ihm
fragt TeO erst, wenn auch das Schlüsselverzeichnis der gemeinsamen Datei keine
passende Hülle kennt. Verschlüsselte Autosicherungen werden während einer
entsperrten Sitzung beim Prüfen und Importieren automatisch entschlüsselt.

Die Ordnerverknüpfung wird nur im aktuellen Browserprofil gespeichert und ist
nicht Teil des gemeinsamen Datenbestands. Sie wird von Chrome und Edge über
HTTPS oder `localhost` unterstützt. Nach einem Browser- oder Profilwechsel kann
eine erneute Freigabe erforderlich sein. Automatische Sicherungen laufen nur,
solange TeO geöffnet ist. Unverschlüsselte Sicherungen erfordern einen
angemessen geschützten Ordner. Manueller und verschlüsselter Export bleiben
unabhängig davon verfügbar.

In der lokalen Browser-Betriebsart kommt der Datenbestand **vor der
Anmeldung**: Angemeldet wird mit den Konten aus `teo-autosicherung.json`, nicht
mit dem Stand, den dieser Browser zuletzt kannte. Ein an einem anderen
Arbeitsplatz geändertes Passwort oder gelöschtes Konto gilt damit sofort.

Beim Start sucht TeO die Datei im zuletzt verknüpften Sicherungsordner; die
Anmeldemaske nennt diesen Ordner. Mit der Anmeldung liest TeO die Datei frisch,
prüft Benutzername und Passwort gegen ihre Konten, entschlüsselt sie
gegebenenfalls mit dem Passwort und übernimmt sie als aktuellen Datenbestand –
**einschließlich der Benutzerkonten**, denn die gemeinsame Datei ist der
vollständige Datenbestand. Muss der Browser den Ordnerzugriff erneut bestätigen
lassen, fragt er beim Klick auf **Anmelden**.

Ist der Ordner nicht verknüpft, fehlt die Datei dort oder kann sie nicht
gelesen werden, erscheint vor der Anmeldung der Dialog **Aktuellen Datenbestand
laden**. Dort lässt sich die Datei einzeln wählen oder – besser – der
Sicherungsordner freigeben; die Verknüpfung gilt dann auch für die nächste
Sitzung. Stellt sich das erst beim Anmelden heraus, erscheint derselbe Dialog,
und die Anmeldung geht nach der Auswahl von selbst weiter.

Gibt es gar keine Sicherungsdatei, bietet derselbe Dialog unter **Keine
Sicherungsdatei vorhanden?** zwei Auswege:

- **Mit dem Stand dieses Browsers weiter** – angemeldet wird mit den Konten, die
  dieser Browser zuletzt kannte; danach legt TeO wie nach der Ersteinrichtung
  eine neue `teo-autosicherung.json` im gewählten Sicherungsordner an.
- **Neu beginnen** – löscht nach Rückfrage Datenbestand, Konten,
  Ordnerverknüpfung und Sicherungsschlüssel dieses Browsers und führt durch die
  Ersteinrichtung. Eine Datei auf einem Laufwerk bleibt unberührt; ist dieser
  Browser der einzige Ort der Daten, gehen sie verloren.

Gibt es die Datei eigentlich auf einem gemeinsamen Laufwerk, ist sie in beiden
Fällen die bessere Wahl – sonst arbeiten zwei Arbeitsplätze mit verschiedenen
Ständen.

Eine Sicherung, die
älter als der zuletzt an diesem Arbeitsplatz gesicherte Stand ist, wird
abgewiesen. Wer TeO innerhalb einer Sitzung neu lädt, bleibt bei einer
unverschlüsselten Datei angemeldet, sofern das Konto dort noch geführt wird; bei
einer verschlüsselten verlangt TeO das Passwort erneut. In der
MariaDB-Betriebsart prüft stattdessen der Server Anmeldung und Datenbestand.

Hat ein anderer Arbeitsplatz die Datei zwischenzeitlich geschrieben, überschreibt
TeO sie nicht. Stattdessen erscheint ein Hinweis; der sichere Weg ist abmelden,
TeO neu laden und erneut anmelden. Wer die Änderungen der
laufenden Sitzung dennoch sichern muss, wählt **Jetzt automatisch sichern** und
bestätigt das Überschreiben ausdrücklich.

### Erster Start an einem weiteren Arbeitsplatz

Liegt TeO in einem gemeinsamen Ordner und wird es an einem weiteren Arbeitsplatz
zum ersten Mal geöffnet, fragt TeO zunächst, woher der Datenbestand kommt:

- **Vorhandenen Datenbestand öffnen** – der Regelfall. TeO fragt nach dem
  gemeinsamen Sicherungsordner, liest dort `teo-autosicherung.json` und öffnet
  anschließend die Anmeldung. Dort gilt das Konto, das bereits am ersten
  Arbeitsplatz angelegt wurde, mit seinem gewohnten Passwort. Ordnerverknüpfung,
  Sicherungsschlüssel, Konten und Daten kommen damit in einem Schritt.
- **Neuen Datenbestand einrichten** – nur für den allerersten Arbeitsplatz. Es
  entsteht ein erstes Administratorkonto und ein leerer Datenbestand; darin
  sind bereits der Gerätekatalog und die NRW-Schulferien hinterlegt. Danach
  wird der Sicherungsordner festgelegt, am besten ein leerer Ordner auf einem
  gemeinsamen Laufwerk. TeO legt dort die erste `teo-autosicherung.json` an,
  verknüpft den Ordner und öffnet sich. Liegt in dem gewählten Ordner bereits
  eine solche Datei, überschreibt TeO sie nicht. Stattdessen lässt sich ein
  leerer Ordner wählen oder über **Vorhandenen Datenbestand öffnen** doch der
  bestehende laden: Nach Rückfrage verwirft TeO den eben eingerichteten
  Bestand samt neuem Konto, und die Anmeldung erfolgt mit einem Konto aus der
  Datei. Bis der Ordner festgelegt ist, fragt TeO bei jedem Start
  wieder danach statt nach der Datei. Browser ohne Ordnerfreigabe (etwa
  Firefox) bieten stattdessen **Ohne Ordner fortfahren** an; TeO arbeitet dann
  nur mit dem Speicher dieses Browsers.

Ein Konto muss also nur einmal angelegt werden. Neue Konten, Passwortänderungen
und Passwort-Resets werden über die gemeinsame Datei an alle Arbeitsplätze
weitergegeben, sobald dort die nächste automatische Sicherung geschrieben wurde.

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

Die Benutzerkonten werden dabei nicht ersetzt. Wer angemeldet ist, bleibt
angemeldet; bestehende Konten und Passwörter gelten unverändert weiter. Nur auf
einem System ohne jedes Konto werden die Konten aus der Sicherung übernommen.

### Änderungsprotokoll

Administrative und fachliche Änderungen werden mit Zeitpunkt, Benutzer und
Beschreibung protokolliert. Betrifft eine Änderung Mitarbeiter, nennt der
Eintrag sie mit Namen; daraus entsteht auch der Änderungsverlauf in der
Mitarbeiter-Akte. Das Protokoll kann als CSV exportiert werden, mit einer
Spalte für die betroffenen Mitarbeiter. Die Einsicht ist Administratoren
vorbehalten.

Im MariaDB-Modus führt der Server das Protokoll. Normale Konten erhalten es
nicht; eine Datensicherung, die ein normales Konto exportiert, enthält es
deshalb nicht, und ein Import durch ein normales Konto lässt das Protokoll
unverändert.

## Datenspeicherung und MariaDB

### Lokaler Modus

Im lokalen Modus liegen die Daten im Browserprofil des verwendeten
Arbeitsplatzes. localForage verwendet bevorzugt IndexedDB und fällt bei Bedarf
auf andere Browserspeicher zurück.

Wichtig:

- Ein Netzlaufwerk mit derselben `index.html` teilt nicht automatisch den
  IndexedDB-Datenbestand zwischen Arbeitsplätzen. Die gemeinsame
  `teo-autosicherung.json` übernimmt diese Aufgabe: Beim ersten Start an einem
  weiteren Arbeitsplatz führt **Vorhandenen Datenbestand öffnen** dorthin, und
  jeder folgende Start gleicht über sie ab.
- Jeder Browser und jedes Browserprofil besitzt seinen eigenen lokalen
  Speicher.
- Browserbereinigung oder ein Profilwechsel kann lokale Daten entfernen.
- Regelmäßige JSON-Sicherungen bleiben erforderlich.

Unter **Einstellungen** zeigt TeO den belegten und geschätzten verfügbaren
Browserspeicher an. Dauerhafter Speicher kann beim Browser angefordert werden.

Der Browser entscheidet selbst, ob er die Anforderung für dauerhaften
Browserspeicher freigibt. Chrome und Edge treffen diese Entscheidung
normalerweise automatisch und zeigen keinen Berechtigungsdialog. Eine
Ablehnung löscht keine vorhandenen Daten; sie verbleiben als
Best-Effort-Speicher und könnten nur bei erheblichem Speicherdruck oder durch
das bewusste Löschen der Websitedaten entfernt werden. TeO sollte über HTTPS
oder `localhost` aufgerufen werden. Unabhängige Sicherungsexporte bleiben auch
bei freigegebenem dauerhaftem Speicher erforderlich.

### MariaDB-Modus

Für gemeinsames Arbeiten mehrerer Arbeitsplätze wird der separate
TeO-API-Dienst verwendet. Datenbankzugangsdaten werden nicht an den Browser
ausgeliefert.

Beim ersten Verbinden kann der lokale Datenbestand kontrolliert auf den Server
übertragen werden. Anschließend:

- werden Änderungen zentral gespeichert
- werden Mitarbeiter, Fortbildungen, Sitzungen, Termine, Geräte und
  Abwesenheiten in getrennten MariaDB-Tabellen geführt
- werden beim Speichern nur tatsächlich veränderte Datensätze geschrieben
- werden Änderungen anderer Arbeitsplätze regelmäßig geladen
- verhindern Datenrevisionen unbemerkte Überschreibungen
- werden offene Formulare bei externen Änderungen vorsorglich geschlossen
- werden Sitzungen und Rollen serverseitig geprüft

Für den Server wird Node.js 22 oder neuer benötigt. Details stehen in
[`server/README.md`](server/README.md).

Bestehende MariaDB-Installationen mit dem früheren JSON-Gesamtbestand werden
beim ersten Start automatisch und transaktional in das relationale
Datenbankschema migriert. Sicherungsdateien bleiben unverändert kompatibel.

Ab Datenbankschema 6 werden Qualifikationen, Einweisungsteilnehmer und
erwartete Teamsitzungsteilnehmer zusätzlich in normalisierten
Beziehungstabellen geführt. Fremdschlüssel verhindern verwaiste
Fortbildungsnachweise, Teilnahmen, Abwesenheiten und Geräteeinweisungen. Der
Verlauf von Qualifikations- und Rollenzuordnungen wird ab dem
Migrationszeitpunkt protokolliert. Das JSON-Sicherungsformat bleibt dabei
unverändert kompatibel.

## Einstellungen und Administration

Die Einstellungen sind in fünf Untermenüs gegliedert. Das Untermenü erscheint
unter **Einstellungen** in der Sidebar und zusätzlich als Abschnittsnavigation
oben auf der Einstellungsseite:

- **Allgemein:** Farbthema, Symbolsatz, kompakte Tabellen und Verhalten beim
  Schließen von Dialogen; Farbthema und Symbolsatz gehören zum angemeldeten
  Benutzerkonto und begleiten es an jeden Arbeitsplatz, während andere Konten
  ihre eigene Wahl behalten
- **Planung:** feste Dienstwochenenden, Urlaubsplanung und Schulferien
- **Pflichtfortbildungen:** Soll-Zeiten
- **Stammdaten & Zugriffe:** Benutzer, Berufe, Qualifikationen,
  Memo-/ToDo-Kategorien und Datenqualität
- **Daten & Sicherung:** Datenbank-Backend, Sicherungserinnerung, manuelle und
  automatische Datensicherungen, Sicherungsprüfung, Import und
  Änderungsprotokoll

Beim Wechsel eines Untermenüs werden nur die zugehörigen Einstellungskarten
angezeigt. Administratorgeschützte Funktionen bleiben weiterhin ausschließlich
für Administratoren sichtbar.

Verfügbare Farbthemen sind Standard, Dark Mode, Solarized Light, Nord, Dracula,
Gruvbox Dark, Tokyo Night, Catppuccin Latte, GitHub, GitHub Dark, Windows 95,
Cellitinnen und Cellitinnen Rot. Die Auswahl wird für das angemeldete
Benutzerkonto gespeichert.

Unabhängig vom Farbthema lässt sich ein **Symbolsatz** wählen: TeO (die
eigenen Symbole, Standard), Lucide, Tabler, Heroicons und Phosphor. Der
Wechsel gilt sofort für alle Symbole der Anwendung; nur das Logo bleibt in
jedem Satz dasselbe. Jeder Symbolsatz lässt sich mit jedem Farbthema
kombinieren und wird wie dieses für das angemeldete Benutzerkonto gespeichert.
Die fremden Sätze stehen unter freien Lizenzen (ISC bzw. MIT); ihre
Lizenzhinweise liegen der Anwendung bei.

Die Anmeldemaske nennt die aktuell eingesetzte Software-Version und den
Copyright-Hinweis bereits vor der Anmeldung.

Die Datenqualitätsprüfung sucht unter anderem nach:

- möglichen Dubletten
- ungültigen E-Mail-Adressen
- auffälligen Telefonnummern
- fehlenden Kontaktdaten

## Häufig gestellte Fragen

### Welche Datei muss ich vor der Anmeldung auswählen?

Im lokalen Browserbetrieb lädt TeO die gemeinsame Datei
`teo-autosicherung.json` automatisch aus dem zuletzt verknüpften Sicherungsordner.
Eine Auswahl ist nur erforderlich, wenn die gespeicherte Freigabe nicht mehr
gilt, die Datei fehlt oder nicht gelesen werden kann. Wird dort statt der Datei
der Sicherungsordner freigegeben, entfällt die Auswahl auch künftig. Im
MariaDB-Betrieb entfällt die Auswahl, weil der Server bereits den verbindlichen
Datenstand liefert.

### Warum lässt sich die Sicherungsdatei nicht überspringen?

Angemeldet wird mit den Konten aus der gemeinsamen Datei, und erst sie liefert
den aktuellen Datenbestand. So wird nie versehentlich mit einem veralteten
Browserstand weitergearbeitet. Ohne gültige Sicherungsdatei lässt sich die
lokale Anwendung deshalb nicht öffnen. Falls die Datei nicht erreichbar ist,
prüfen Sie die Netzwerkverbindung, den freigegebenen Ordner und Ihre
Zugriffsrechte.

### Warum wird `teo-autosicherung.json` beim Start abgelehnt?

TeO lehnt die Datei ab, wenn sie:

- anders heißt oder das unter **Einstellungen → Sicherungserinnerung**
  festgelegte Maximalvolumen überschreitet
- kein vollständiges und gültiges TeO-Sicherungsformat enthält
- beschädigt oder manuell unvollständig bearbeitet wurde
- aus einer neueren, nicht kompatiblen TeO-Version stammt
- älter als die zuletzt in diesem Browser erfolgreich erstellte Autosicherung ist
- verschlüsselt ist und nicht entschlüsselt werden kann

Die Meldung im Dialog **Aktuellen Datenbestand laden** nennt den erkannten Grund. Verwenden Sie nicht
ersatzweise eine beliebige umbenannte JSON-Datei.

### Muss ich für eine verschlüsselte Autosicherung ein zweites Passwort eingeben?

Normalerweise nicht. Der gemeinsame Sicherungsschlüssel wird beim Login mit dem
persönlichen Benutzerpasswort automatisch entsperrt – auch an einem
Arbeitsplatz, an dem dieses Konto sich zum ersten Mal anmeldet: Die passende
Schlüsselhülle steht im Verzeichnis der gemeinsamen Datei. Erst wenn auch dort
keine Hülle zum Konto passt oder die Datei nicht erreichbar ist, wird einmalig
der separat aufbewahrte Wiederherstellungsschlüssel benötigt. Dieser Schlüssel
ist nicht das Login-Passwort.

Ein neuer Arbeitsplatz erzeugt dabei **kein** neues Passwort und macht das alte
nicht ungültig. Der Schlüssel bleibt derselbe, solange derselbe Datenbestand
verwendet wird.

### Wann wird die gemeinsame Datei aktualisiert?

Nach einer fachlichen Änderung wartet TeO zwei Sekunden. Weitere Änderungen in
diesem Zeitraum starten die Frist neu. Anschließend wird
`teo-autosicherung.json` vollständig überschrieben. Die Sicherung funktioniert
nur, solange TeO geöffnet ist und der Browser weiterhin Schreibzugriff auf den
gewählten Ordner besitzt.

### Können mehrere Personen gleichzeitig mit derselben JSON-Datei arbeiten?

Nein. Die gemeinsame JSON-Datei ist für eine nacheinander erfolgende Nutzung
gedacht. Jede geöffnete Anwendung hält einen vollständigen Datenstand und würde
beim Sichern die gesamte Datei überschreiben. TeO erkennt einen zwischenzeitlich
erfolgten fremden Schreibvorgang an Größe und Änderungszeit der Datei und
überschreibt sie dann nicht mehr stillschweigend, sondern meldet es – die
Änderungen der eigenen Sitzung bleiben in diesem Fall aber ungesichert. Für den
parallelen Betrieb an mehreren Arbeitsplätzen muss MariaDB als gemeinsamer
Datenbestand verwendet werden.

### Warum sehe ich Änderungen eines anderen Arbeitsplatzes nicht sofort?

Im lokalen Betrieb wird die gemeinsame Datei nur bei der Anmeldung eingelesen.
Während einer bereits laufenden Sitzung werden fremde Dateiänderungen nicht
automatisch zusammengeführt. Melden Sie sich ab und wieder an; TeO liest die
Datei dabei frisch. Im
MariaDB-Betrieb prüft TeO regelmäßig, ob eine neuere Serverrevision vorliegt.

### Warum fragt der Browser erneut nach dem Sicherungsordner?

Die Ordnerfreigabe gehört zum jeweiligen Browserprofil und kann durch einen
Browserwechsel, ein neues Profil, gelöschte Websitedaten oder geänderte
Berechtigungen verloren gehen. Wählen Sie den Ordner unter
**Einstellungen → Gesamten Datenbestand sichern** erneut aus. Für die direkte
Ordnerfreigabe werden Chrome oder Edge über HTTPS beziehungsweise `localhost`
benötigt.

### Warum erscheint beim Schließen weiterhin eine Warnung?

Die Warnung bedeutet, dass seit der letzten erfolgreich abgeschlossenen
Sicherung Änderungen vorliegen. Prüfen Sie unter **Einstellungen → Gesamten
Datenbestand sichern** den Sicherungsstatus und führen Sie bei Bedarf **Jetzt
automatisch sichern** aus. Browser verwenden beim Verlassen der Seite einen
eigenen Standardtext, den TeO nicht verändern kann.

### Warum wird ein Mitarbeiter nicht in einer Auswahl angezeigt?

Prüfen Sie den Beschäftigungsstatus sowie aktive Such-, Status-, Berufs- und
Qualifikationsfilter. Einige Auswahllisten zeigen bewusst nur aktive oder in
Einarbeitung befindliche Personen. Bei Namenslisten hilft die Eingabe des ersten
Buchstabens des Nachnamens, direkt zu den passenden Einträgen zu springen.

### Warum wird eine Fortbildung als offen oder fällig angezeigt?

Maßgeblich sind Einführungsjahr, Wiederholungsintervall, das Datum des neuesten
Nachweises, die Zuordnung zur richtigen Fortbildungsreihe und das ausgewählte
Auswertungsjahr. Prüfen Sie diese Angaben sowohl im Fortbildungskatalog als auch
im Nachweis des Mitarbeiters.

### Warum kann eine Leitungsrolle nicht entfernt werden?

Die Person ist noch als verantwortliche Leitung eines Dienstwochenendes
eingetragen. Wählen Sie zuerst unter **Einstellungen → Feste
Dienstwochenenden** eine andere Stationsleitung oder stellvertretende
Stationsleitung aus.

### Warum ist ein Tag in der Urlaubsplanung rot eingerahmt?

Die konfigurierte Abwesenheitsgrenze wurde überschritten. Die Eintragung bleibt
möglich, muss aber organisatorisch geprüft werden. **Überschneidungen prüfen**
listet die betroffenen Tage und Personen auf. Abwesenheiten von Medizinischen
Fachangestellten, Pflegefachassistenz und Stationsassistenz werden bei dieser
Grenze nicht mitgezählt.

### Wie stelle ich den Datenbestand nach einem Browser- oder Geräteverlust wieder her?

Öffnen Sie TeO in einem unterstützten Browser und importieren Sie die zuletzt
erfolgreich erstellte Sicherung. Bei einer verschlüsselten Datei benötigen Sie
den getrennt aufbewahrten Wiederherstellungsschlüssel. Bewahren Sie Datei und
Schlüssel nicht ausschließlich auf demselben Gerät auf. Im MariaDB-Betrieb
erfolgt die Wiederherstellung stattdessen über die geregelte Serversicherung.

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

### Was der lokale Modus leistet – und was nicht

Im lokalen Modus (localForage / IndexedDB) steuern Anmeldung und Rollen
ausschließlich die Bedienung der Oberfläche. Sie sind kein Zugriffsschutz:

- Der Datenbestand liegt **unverschlüsselt** im Profil des Browsers und lässt
  sich ohne TeO-Anmeldung auslesen.
- Wer am selben Benutzerkonto des Rechners arbeitet, kann die Anmeldung mit
  Bordmitteln des Browsers umgehen und erhält damit auch Administratorrechte.
- Die Rollentrennung wird erst im MariaDB-Betrieb serverseitig durchgesetzt.

Daraus folgt für den Betrieb:

- Den lokalen Modus nur auf einem **persönlich gesicherten Rechner** einsetzen –
  eigenes Windows- oder macOS-Konto, Anmeldekennwort, aktive Bildschirmsperre,
  idealerweise verschlüsselte Festplatte (BitLocker, FileVault).
- Auf gemeinsam genutzten Stationsrechnern und überall dort, wo mehrere Personen
  mit demselben Datenbestand arbeiten, den **MariaDB-Betrieb** verwenden. Dort
  prüft der Server jede Anmeldung und jede Änderung.
- Der lokale Modus eignet sich außerdem für Erprobung, Schulung und Demodaten.

## Änderungshistorie

Die Änderungshistorie nennt die tatsächlich sichtbaren Funktionen und
Fehlerbehebungen in kurzen deutschen Stichpunkten, neueste Version zuerst.
Technische Merge-Commits und interne Branch-Namen werden nicht aufgeführt.

<!-- CHANGELOG_ENTRIES -->
