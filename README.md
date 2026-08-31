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

- **Übersicht:** Kennzahlen, Fristenmonitor und zuletzt bearbeitete Daten
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

- **Kompakte Tabellen** – in den Einstellungen unter **Darstellung**. Die
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
| Gerät | Hersteller, Produkt, Kategorie, Anlage 1, Bestand, Einweisungsquote, Einweisungsberechtigte | Anheften · Bearbeiten · **Übersicht** (Einweisungen des Geräts) |

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

### Arbeitsliste und Dashboard

Die Arbeitsliste auf der Übersicht führt die wichtigsten offenen Punkte aus
mehreren Bereichen zusammen: überfällige und anstehende Fristen, Termine,
offene Memos und Datenqualitätsprobleme mit hoher Priorität. **Überfällig** und
**7 Tage** begrenzen die Liste auf den unmittelbar relevanten Zeitraum. Ein
Klick führt direkt zum betreffenden Datensatz.

Über **Dashboard anpassen** werden Arbeitsliste, Fristen, Fortbildungsübersicht
und zuletzt bearbeitete Mitarbeiter ein- oder ausgeblendet und neu angeordnet.
Die Zusammenstellung ist persönlich für diesen Browser und gehört nicht zum
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
- **Direktbefehle** – unter anderem die überfällige Arbeitsliste und der Filter
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

Zurück geht es immer nur einen Schritt, und zwar den zuletzt gemeldeten: Sobald
eine weitere Änderung gespeichert wurde, ist der vorherige Schritt nicht mehr
verfügbar. Das Zurücknehmen ist selbst eine Änderung – im Änderungsprotokoll
stehen anschließend beide Zeilen, die Löschung und ihre Rücknahme. Für ältere
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

Administratoren dürfen zusätzlich drei Einstellungen ändern:

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
verändern, wenn der Client umgangen wird.

### Dialoge schließen

Unter **Einstellungen → Dialoge schließen** wird festgelegt, wie sich ein Klick
neben einen geöffneten Dialog auswirkt:

- **Schließt den Dialog nicht** (Voreinstellung) – Dialoge lassen sich nur über
  ihre Schaltflächen oder die Escape-Taste verlassen. Das verhindert, dass ein
  versehentlicher Klick eine begonnene Eingabe beendet.
- **Schließt den Dialog** – ein Klick auf die abgedunkelte Fläche schließt den
  Dialog.

In beiden Fällen gilt: Enthält der Dialog ein Formular mit ungespeicherten
Eingaben, fragt TeO vorher nach. Die drei Anmeldedialoge – Ersteinrichtung,
Anmeldung und Passwortänderung – bleiben von der Einstellung unberührt und
lassen sich weder per Klick daneben noch per Escape schließen.

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
- Stellenanteil des Mitarbeiters
- individuell erarbeitetem Zusatzurlaub durch Schichtdienst

Grundurlaub, Abwesenheitsgrenzen und Referenzsamstag werden unter
**Einstellungen → Urlaub** gepflegt.

Die fünf Summenspalten **Basis**, **Zusatz**, **Anspruch**, **Geplant** und
**Rest** bleiben beim horizontalen Scrollen fixiert.

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
In der maximierten Planung blättern die Pfeilschaltflächen über der Tabelle
durch die Monate; dort bleibt oberhalb der Tabelle nur die kompakte, mit den
farbigen Tabellensymbolen dargestellte Tastaturbelegung sichtbar.

Die Kopfzeile bleibt beim vertikalen Scrollen sichtbar. Wochenenden,
Feiertage, Schulferien und die beiden Dienstwochenenden werden farblich
unterschieden.

Unter dem Namen des Mitarbeiters stehen das feste **Dienstwochenende** und der
Beschäftigungsgrad. Der Beschäftigungsstatus bleibt im Tooltip der Zeile
sichtbar.

Ein **Geburtstag** ist an der goldenen Schraffur des Tagesfeldes erkennbar; der
Tooltip nennt das erreichte Lebensjahr. Fällt der Geburtstag auf den
29. Februar, wird er in Nicht-Schaltjahren am 28. Februar angezeigt.

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
Kennzahlen über der Tabelle und sämtliche Tagesgrenzen beziehen sich weiterhin
auf das gesamte Team, damit ein Filter die Auslastung nicht verfälscht. Ist ein
Filter aktiv, weist ein Hinweis über der Tabelle darauf hin.

### Abwesenheitsgrenzen

Standardmäßig gelten:

- Werktage: höchstens 8 gleichzeitig abwesende Mitarbeiter
- Wochenenden und Feiertage: höchstens 5 gleichzeitig abwesende Mitarbeiter

Beide Grenzwerte sind konfigurierbar. Eine Überplanung bleibt möglich, wird
aber deutlich rot markiert.

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

Nicht angerechnete Assistenzberufe sind gestrichelt umrandet. Ein Klick auf das
Datum springt in den zugehörigen Monat der Planungstabelle.

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
Übersichtsseite neben dem Fristenmonitor. Nur wenn solche Einträge vorhanden
sind, teilen sich beide Bereiche die verfügbare Breite zu gleichen Teilen; auf
schmaleren Bildschirmen stehen sie untereinander.

## Terminkalender und Fristenmonitor

### Termine anlegen

Ein Termin benötigt mindestens:

- Titel
- Datum

Optional können Uhrzeit von/bis, Ort, Beschreibung und eine **Kategorie**
hinterlegt werden.

**Speichern & Drucken** legt den Termin an und öffnet eine mittig gesetzte
DIN-A4-Druckansicht. Ist **Teilnehmerliste** aktiviert, enthält sie zusätzliche
Leerzeilen zur handschriftlichen Eintragung. Angelegte Termine lassen sich in
der Terminübersicht und im Fristenmonitor anklicken; beide Wege öffnen denselben
Detaildialog zum Ansehen oder Bearbeiten.

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
- Ein Klick auf einen Eintrag öffnet ihn zum Bearbeiten.
- Die Pfeile wechseln den Monat, **Heute** springt zum laufenden Monat zurück.

Suchfeld und Zeitraumfilter wirken in beiden Darstellungen; angepinnte Termine
bleiben wie in der Liste unabhängig vom Zeitraumfilter sichtbar. Die gewählte
Darstellung und der zuletzt angesehene Monat bleiben im Browser gespeichert und
stehen beim nächsten Aufruf wieder bereit. Auf schmalen Bildschirmen zeigt jedes
Tagesfeld statt der Titel farbige Balken – ein Tippen öffnet den Termin.

### Fristenmonitor

Der Fristenmonitor steht auf der Übersichtsseite direkt unter den Kennzahlen.
Sechs Einträge bleiben sichtbar, weitere sind innerhalb des Bereichs
scrollbar.

Er zeigt:

- anstehende Termine; Schulungen und Geräteeinweisungen aus dem Terminkalender
  werden dabei dem Filter **Fortbildungen** zugeordnet
- Geburtstage
- fällige und überfällige Pflichtfortbildungen
- ablaufende Zusatzqualifikationen

Der Zeitraum kann auf 30, 60 oder 90 Tage eingestellt werden. Kategorien
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

Titel, Datum, Uhrzeit und Notizen werden erfasst. Die Sitzungen werden
chronologisch sortiert.

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
Startabgleich und Import. Ab 90 % des eingestellten Volumens zeigt TeO eine
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

Bei der Einrichtung zeigt TeO einen Wiederherstellungsschlüssel an. Er muss
getrennt von den Sicherungsdateien sicher verwahrt werden und ermöglicht die
Wiederherstellung nach einem vollständigen Verlust des Browserprofils. Ein
bereits vorhandenes Konto ohne Schlüsselhülle benötigt ihn einmalig beim ersten
Login. Verschlüsselte Autosicherungen werden während einer entsperrten Sitzung
beim Prüfen und Importieren automatisch entschlüsselt.

Die Ordnerverknüpfung wird nur im aktuellen Browserprofil gespeichert und ist
nicht Teil des gemeinsamen Datenbestands. Sie wird von Chrome und Edge über
HTTPS oder `localhost` unterstützt. Nach einem Browser- oder Profilwechsel kann
eine erneute Freigabe erforderlich sein. Automatische Sicherungen laufen nur,
solange TeO geöffnet ist. Unverschlüsselte Sicherungen erfordern einen
angemessen geschützten Ordner. Manueller und verschlüsselter Export bleiben
unabhängig davon verfügbar.

Beim Start in der lokalen Browser-Betriebsart sucht TeO nach der Anmeldung
zuerst im zuletzt verknüpften Sicherungsordner nach `teo-autosicherung.json` und
lädt sie ohne zusätzliche Auswahl. Nur wenn der Ordnerzugriff nicht mehr gilt,
die Datei dort fehlt oder nicht gelesen werden kann, erscheint die Dateiauswahl.
Die Bedienoberfläche bleibt bis zum erfolgreichen Abgleich gesperrt. Die Datei
wird geprüft, gegebenenfalls mit dem beim Login entsperrten Schlüssel
entschlüsselt und als aktueller Datenbestand übernommen. Eine Sicherung, die
älter als der zuletzt lokal gesicherte Stand ist, wird abgewiesen. In der
MariaDB-Betriebsart übernimmt stattdessen der Server den verbindlichen
Startabgleich.

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
Beschreibung protokolliert. Das Protokoll kann als CSV exportiert werden. Die
Einsicht ist Administratoren vorbehalten.

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

Für den Server wird Node.js 20 oder neuer benötigt. Details stehen in
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

- **Allgemein:** Farbthema und Verhalten beim Schließen von Dialogen; das
  Farbthema gehört zum angemeldeten Benutzerkonto und begleitet es an jeden
  Arbeitsplatz, während andere Konten ihr eigenes Farbthema behalten
- **Planung:** feste Dienstwochenenden, Urlaubsplanung und Schulferien
- **Pflichtfortbildungen:** Soll-Zeiten
- **Stammdaten & Zugriffe:** Benutzer, Berufe, Qualifikationen,
  Memo-/ToDo-Kategorien und Datenqualität
- **Daten & Sicherung:** Datenbank-Backend, Sicherungserinnerung sowie manuelle
  und automatische Datensicherungen

Beim Wechsel eines Untermenüs werden nur die zugehörigen Einstellungskarten
angezeigt. Administratorgeschützte Funktionen bleiben weiterhin ausschließlich
für Administratoren sichtbar.

Die Einstellungsseite bündelt:

- Farbthema
- Dienstwochenendverantwortliche
- lokales oder MariaDB-Backend
- Benutzerverwaltung
- Berufe und Qualifikationen
- Memo-/ToDo-Kategorien
- Datenqualitätsprüfung
- Sicherungserinnerung
- Import, Export und Sicherungsprüfung
- verschlüsselten Export
- Änderungsprotokoll

Verfügbare Farbthemen sind Standard, Dark Mode, Solarized Light, Nord, Dracula,
Gruvbox Dark, Tokyo Night, Catppuccin Latte, Windows 95, Cellitinnen und
Cellitinnen Rot. Die Auswahl wird mit dem Datenbestand gespeichert.

Die Anmeldemaske nennt die aktuell eingesetzte Software-Version und den
Copyright-Hinweis bereits vor der Anmeldung.

Die Datenqualitätsprüfung sucht unter anderem nach:

- möglichen Dubletten
- ungültigen E-Mail-Adressen
- auffälligen Telefonnummern
- fehlenden Kontaktdaten

## Häufig gestellte Fragen

### Welche Datei muss ich nach der Anmeldung auswählen?

Im lokalen Browserbetrieb lädt TeO die gemeinsame Datei
`teo-autosicherung.json` automatisch aus dem zuletzt verknüpften Sicherungsordner.
Eine Auswahl ist nur erforderlich, wenn die gespeicherte Freigabe nicht mehr
gilt, die Datei fehlt oder nicht gelesen werden kann. Erst nach erfolgreicher
Prüfung und Übernahme wird die Anwendung freigegeben. Im MariaDB-Betrieb entfällt
dieser Startabgleich, weil der Server bereits den verbindlichen Datenstand liefert.

### Warum lässt sich der Startabgleich nicht überspringen?

Der verpflichtende Abgleich verhindert, dass versehentlich mit einem veralteten
Browserstand weitergearbeitet wird. Ohne gültige Sicherungsdatei kann die lokale
Anwendung deshalb nur abgemeldet, aber nicht geöffnet werden. Falls die Datei
nicht erreichbar ist, prüfen Sie die Netzwerkverbindung, den freigegebenen
Ordner und Ihre Zugriffsrechte.

### Warum wird `teo-autosicherung.json` beim Start abgelehnt?

TeO lehnt die Datei ab, wenn sie:

- anders heißt oder das unter **Einstellungen → Sicherungserinnerung**
  festgelegte Maximalvolumen überschreitet
- kein vollständiges und gültiges TeO-Sicherungsformat enthält
- beschädigt oder manuell unvollständig bearbeitet wurde
- aus einer neueren, nicht kompatiblen TeO-Version stammt
- älter als die zuletzt in diesem Browser erfolgreich erstellte Autosicherung ist
- verschlüsselt ist und nicht entschlüsselt werden kann

Die Meldung im Startdialog nennt den erkannten Grund. Verwenden Sie nicht
ersatzweise eine beliebige umbenannte JSON-Datei.

### Muss ich für eine verschlüsselte Autosicherung ein zweites Passwort eingeben?

Normalerweise nicht. Der gemeinsame Sicherungsschlüssel wird beim Login mit dem
persönlichen Benutzerpasswort automatisch entsperrt. Nur wenn dem Konto noch
keine passende Schlüsselhülle zugeordnet ist oder das Browserprofil vollständig
verloren ging, wird einmalig der separat aufbewahrte Wiederherstellungsschlüssel
benötigt. Dieser Schlüssel ist nicht das Login-Passwort.

### Wann wird die gemeinsame Datei aktualisiert?

Nach einer fachlichen Änderung wartet TeO zwei Sekunden. Weitere Änderungen in
diesem Zeitraum starten die Frist neu. Anschließend wird
`teo-autosicherung.json` vollständig überschrieben. Die Sicherung funktioniert
nur, solange TeO geöffnet ist und der Browser weiterhin Schreibzugriff auf den
gewählten Ordner besitzt.

### Können mehrere Personen gleichzeitig mit derselben JSON-Datei arbeiten?

Nein. Die gemeinsame JSON-Datei ist für eine nacheinander erfolgende Nutzung
gedacht. Jede geöffnete Anwendung hält einen vollständigen Datenstand und würde
beim Sichern die gesamte Datei überschreiben. Bei gleichzeitiger Bearbeitung
kann dadurch die zuletzt geschriebene Version Änderungen einer anderen Person
verdrängen. Für den parallelen Betrieb an mehreren Arbeitsplätzen muss MariaDB
als gemeinsamer Datenbestand verwendet werden.

### Warum sehe ich Änderungen eines anderen Arbeitsplatzes nicht sofort?

Im lokalen Betrieb wird die gemeinsame Datei nur beim verpflichtenden
Startabgleich eingelesen. Während einer bereits laufenden Sitzung werden fremde
Dateiänderungen nicht automatisch zusammengeführt. Melden Sie sich ab, laden
Sie TeO neu und wählen Sie anschließend erneut `teo-autosicherung.json`. Im
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

### Warum ist ein Tag in der Urlaubsplanung rot?

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

### Urlaubsanspruch bei Teilzeit

TeO kürzt den Grundanspruch linear zum hinterlegten Stellenumfang: 30 Tage bei
50 Prozent ergeben 15 Tage. Das Bundesurlaubsgesetz bemisst den Anspruch
dagegen nach der Zahl der **Arbeitstage pro Woche**. Beide Rechnungen stimmen
überein, solange Teilzeit auch weniger Arbeitstage bedeutet.

Arbeitet jemand in Teilzeit bei unveränderter Fünftagewoche – also kürzere Tage
statt weniger Tage –, steht dieser Person weiterhin der volle Anspruch zu; TeO
weist dann zu wenig aus. Der Wert muss in diesem Fall über **Zusätzliche Tage**
in der Urlaubsplanung ausgeglichen werden.

Ebenfalls nicht automatisch berücksichtigt: die anteilige Berechnung nach
§ 5 BUrlG bei Ein- oder Austritt im laufenden Kalenderjahr. Auch hier ist die
manuelle Korrektur über **Zusätzliche Tage** vorgesehen.

## Änderungshistorie

Die Änderungshistorie nennt die tatsächlich sichtbaren Funktionen und
Fehlerbehebungen in kurzen deutschen Stichpunkten, neueste Version zuerst.
Technische Merge-Commits und interne Branch-Namen werden nicht aufgeführt.

<!-- CHANGELOG_ENTRIES -->

## Entwicklung und Projektstruktur

Die aktuelle Projekt- und Datenformatversion wird zentral in
[`src/meta/project-meta.mjs`](src/meta/project-meta.mjs) gepflegt.
Sichtbare Neuerungen und Korrekturen werden pro Version kurz und auf Deutsch in
[`CHANGELOG.md`](CHANGELOG.md) ergänzt; Merge-Commits gehören nicht in diese Liste.

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

Ein geprüftes ZIP-Paket für den lokalen Einzelplatzbetrieb entsteht mit:

```text
npm run release:package
```

Der Befehl führt zuerst die vollständige Verifikation aus und schreibt danach
`dist/TeO-<Version>-lokaler-Betrieb.zip`. Das Paket enthält ausschließlich die
gebaute Anwendung und ihre unmittelbar benötigten Laufzeitdateien. Quellen,
Tests, Entwicklungswerkzeuge, Serverkomponenten und Demo-Daten bleiben außen
vor. `dist/` und lokale ZIP-Dateien werden von Git ignoriert.

### Buildnummer

Die Buildnummer folgt dem Muster `major.minor.patch` mit je drei Stellen und
wird unten in der Seitenleiste angezeigt. Sie steht an genau einer Stelle:
[`src/meta/project-meta.mjs`](src/meta/project-meta.mjs). Die Dateien
`project-meta.js` und `app.js` entstehen daraus beim Build.

Jede Auslieferung erhöht die Nummer:

| Anlass | Befehl | Wirkung |
| --- | --- | --- |
| Neue Funktion | `npm run version:feature` | `minor` + 1, `patch` auf 0 |
| Fehlerbehebung | `npm run version:fix` | `patch` + 1 |
| Umbruch | `npm run version:major` | `major` + 1, Rest auf 0 |

Enthält eine Auslieferung sowohl neue Funktionen als auch Fehlerbehebungen,
zählt sie als Funktion. Der Befehl passt zugleich die Version in `package.json`
an; anschließend ist `npm run build` nötig. `npm run check` bricht ab, wenn
beide Versionen auseinanderlaufen oder das Format nicht stimmt.

Die mitgelieferte localForage-Version `1.10.0` befindet sich zusammen mit ihrer
Lizenz im Ordner `vendor`.
