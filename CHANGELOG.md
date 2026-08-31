### 4.46.0 – Leere Monatsplanungen zum Ausfüllen

- **Neu:** Die Urlaubsplanung druckt **leere Monatsplanungen**: je Monat des gewählten Jahres ein DIN-A4-Blatt quer, darauf alle aktiven und einzuarbeitenden Mitarbeiter alphabetisch untereinander – nach Nachname, Vorname – und die Tage des Monats als Spalten. Unter jedem Namen stehen Beschäftigungsumfang und Jahresurlaubsanspruch. Feiertage, Schulferien und das eigene Dienstwochenende sind vermerkt, die Felder bleiben leer. Wer nur einen Monat braucht, wählt die Seiten im Druckdialog
- **Neu:** Braucht ein Monat mehr als ein Blatt – auf eines passen 20 Mitarbeiter –, trägt jedes Blatt den Monat im Kopf und daneben **Seite x von y** für diesen Monat. So lässt sich ein Stapel wieder sortieren
- **Verbessert:** Das Handbuch beschreibt jetzt beide leeren Vordrucke – die Jahresübersicht je Mitarbeiter und die neue Monatsplanung

### 4.45.0 – Neue Farbthemen und schlankerer Start

- **Behoben:** Im Farbschema **Dark Mode** stand die Beschriftung der Hauptaktion – etwa **Sichern** – in Weiß auf hellblauem Grund und war kaum zu lesen (Kontrast 2,2:1 statt der geforderten 4,5:1). Sie ist jetzt dunkel, wie in den übrigen dunklen Schemata auch
- **Verbessert:** TeO startet schlanker: Das Handbuch wird erst aufgebaut, wenn die Hilfe zum ersten Mal gebraucht wird. Beim Start entstehen dadurch rund 2500 statt 4100 Elemente – jeder Ansichtswechsel wird dadurch etwas flüssiger
- **Verbessert:** Die Suche in der Hilfe reagiert unmittelbar. Sie verglich bisher bei jedem Tastendruck den vollständigen Text aller Themen; der Suchschlüssel entsteht jetzt einmal je Abschnitt
- **Verbessert:** Geräteliste und Einweisungsmatrix bauen spürbar sparsamer auf. Für jedes Gerät wurde bisher der gesamte Einweisungsbestand durchsucht, um die berechtigten Mitarbeiter zu ermitteln – auch dann, wenn gar nicht danach gefiltert war. Bei 40 Geräten waren das 41 Durchgänge statt einem
- **Neu:** Solarized Light, Gruvbox Dark und Tokyo Night erweitern die Themenauswahl um eine augenschonende helle und zwei kontrastreiche dunkle Paletten
- **Verbessert:** Native Formulare, Planungsmarkierungen und Meldungen übernehmen auch in den neuen dunklen Themes die passende Darstellung
- **Verbessert:** Die Anmeldemaske zeigt bereits vor der Anmeldung die aktuelle Software-Version und den Copyright-Hinweis

### 4.44.0 – Schnellansicht für alle Datenarten

- **Neu:** Termine, Memos und Geräte haben dieselbe Schnellansicht wie die Mitarbeiter: Ein Klick auf die Karte – im Terminkalender auch auf einen Eintrag im Monatsraster – öffnet rechts eine Übersicht mit den Eckdaten, ohne dass ein Dialog die Liste verdeckt. Von dort führen **Anheften**, **Bearbeiten** und je nach Datenart **Kalender**, **Erledigt** oder **Übersicht** weiter; der Stift auf der Karte öffnet wie bisher direkt den Bearbeitungsdialog
- **Neu:** Im Raster der Urlaubsplanung lässt sich mit der Maus über mehrere Felder ziehen; die gewählte Eintragsart landet in allen – dieselbe Bereichsauswahl, die es über Umschalt und Pfeiltaste schon gab
- **Neu:** Im Monatsraster des Terminkalenders lässt sich ein Termin auf einen anderen Tag ziehen. Der Zieltag hebt sich beim Ziehen ab; das Verschieben ist eine Änderung und lässt sich zurücknehmen
- **Neu:** Die rechte Maustaste öffnet ein Kontextmenü – auf Mitarbeiterzeilen und auf den Karten der Termine, Memos und Geräte. Es zeigt Schnellansicht, Bearbeiten und die weiteren Aktionen des Eintrags; gehört er zu einer Mehrfachauswahl, stehen dort die Sammelaktionen
- **Neu:** Termine, Memos und Geräte lassen sich mehrfach auswählen: **Strg + Klick** nimmt eine Karte hinzu, **Umschalt + Klick** alle bis zur zuletzt angeklickten, **Esc** hebt die Auswahl auf. Die Leiste über der Liste führt die Sammelaktionen – anpinnen, erledigen, Bestand ändern und löschen –, jede davon als ein Schritt, der sich zurücknehmen lässt
- **Neu:** Auch mehrere Mitarbeiter lassen sich auf einmal löschen; der Umfang entspricht dem einzelnen Löschen und ist ebenso zurücknehmbar
- **Verbessert:** Die Schnellansicht hebt sich mit Rahmen, Rundung, Schatten und leicht getönter Fläche von den Karten daneben ab. In mehreren Farbthemen ist die Fläche der Karten dieselbe wie die der Schnellansicht – dort waren die Grenzen bisher nicht zu erkennen. Im Windows-95-Thema ist sie ein erhabenes Fenster
- **Verbessert:** Geräte erscheinen jetzt ebenfalls in Verlauf und Favoriten von **Strg + K**; Termine, Memos und Geräte öffnen von dort die Schnellansicht statt eines Dialogs

### 4.43.4 – Termin direkt im Dialog löschen

- **Neu:** Beim Bearbeiten eines Termins steht die Löschaktion direkt im Dialog bereit; sie verwendet weiterhin die Sicherheitsabfrage und kann anschließend rückgängig gemacht werden

### 4.43.3 – Klarer lokaler Speicherstatus

- **Verbessert:** Im lokalen Modus fasst der Systemstatus die technischen Angaben zu zwei verständlichen Punkten zusammen: Speicherort und Zeitpunkt der letzten erfolgreichen Speicherung mit Datum und Uhrzeit

### 4.43.2 – Einheitliche Windows-95-Seitenleiste

- **Behoben:** Im Windows-95-Theme verwendet die Seitenleiste jetzt dasselbe Grau wie die Inhaltsfenster; Konto, Systemstatus und Programminfo tragen dazu passende schwarze beziehungsweise dunkelgraue Texte

### 4.43.1 – Korrekte Änderungshistorie und Tabellenköpfe

- **Behoben:** Der Abschnitt für 4.43.0 stand am Ende der Änderungshistorie statt an erster Stelle und wirkte dadurch wie ein veralteter oder fehlender Stand
- **Behoben:** Die feststehende Namensspalte der Mitarbeitertabelle überdeckte einen Teil der folgenden Spalte; bei **Beruf** blieb dadurch im ungünstigsten Fall nur das letzte „F“ sichtbar

### 4.43.0 – Desktop-Arbeitsplatz

- **Neu:** Ein Klick auf eine Mitarbeiterzeile öffnet rechts eine Schnellansicht mit Stammdaten, Fortbildungsstand, Qualifikationen und den Aktionen **Anheften**, **Bearbeiten** und **Gesamtakte**. Pfeiltasten wechseln in der Tabelle zwischen den Zeilen
- **Neu:** Die Mitarbeitertabelle lässt sich wie ein Desktop-Datengrid einrichten: Spaltenbreiten sind ziehbar, die Reihenfolge ist wählbar und eine zusätzliche Spalte kann beim horizontalen Blättern fixiert werden. Die persönliche Anordnung bleibt im Browserprofil gespeichert
- **Verbessert:** Im Kopf der Mitarbeiteransicht bleiben Datenqualität und das Anlegen direkt sichtbar; seltenere Katalog-, Wochenend- und Exportaktionen stehen gesammelt unter **Mehr**
- **Neu:** Das Dashboard bündelt überfällige Fristen, anstehende Termine, offene Memos und wichtige Datenqualitätsprobleme in einer gemeinsamen Arbeitsliste mit den Filtern **Alles**, **Überfällig** und **7 Tage**
- **Neu:** Mitarbeiter lassen sich in der Schnellansicht anheften. Favoriten, zuletzt geöffnete Mitarbeiter, Termine und Memos sowie die letzten Befehle erscheinen in **Strg + K**; eine Vorschau beschreibt den markierten Treffer. Neue Direktbefehle führen außerdem zur überfälligen Arbeitsliste und zu den aktuell Beschäftigten
- **Neu:** Über **Dashboard anpassen** lassen sich Arbeitsliste, Fristen, Übersichten und zuletzt bearbeitete Mitarbeiter pro Arbeitsplatz ein- oder ausblenden und neu anordnen

### 4.42.0 – Tastatur und Rückgängig

- **Behoben:** In der eingeklappten Seitenleiste stand das Untermenü der Einstellungen abgeschnitten in der schmalen Spur. Es entfällt dort jetzt – dieselben fünf Bereiche stehen als Leiste über den Einstellungen selbst
- **Behoben:** Beim Anklicken von Teilnehmern – etwa in „Geräteeinweisung dokumentieren“ und beim Fortbildungsnachweis – markierte ein verrutschter oder doppelter Klick den Namen statt das Auswahlkästchen zu treffen. Auswahlkarten, Auswahlkästchen und die Auswahlspalte der Mitarbeitertabelle lassen sich jetzt nicht mehr markieren; der übrige Text bleibt zum Kopieren markierbar
- **Neu:** Schnelleingabe in jedem Datumsfeld: Bei aktivem Feld trägt **h** das heutige Datum ein, **g** das gestrige und **m** das morgige – nützlich beim Dokumentieren von Geräteeinweisungen und Fortbildungsnachweisen. Felder mit einer Grenze nehmen ein Datum außerhalb nicht an, Ziffern funktionieren unverändert
- **Verbessert:** Die eingeklappte Seitenleiste hat jetzt auch am Fuß eine Minimalansicht: Konto, Systemstatus und Namenszug stehen als gleich große Kacheln untereinander, die Schaltflächen für Benutzerverwaltung und Abmelden bleiben erreichbar, und die weggefallenen Angaben – Benutzername, Rolle, Verbindung, Backend, Server, Revision, DB-Schema, Fassung – nennt der Kurzhinweis der jeweiligen Kachel
- **Neu:** Aktive Filter stehen als Chips unter der Filterleiste – in Mitarbeitern, Terminkalender, Memo / ToDo, Geräteeinweisungen und Geräteverwaltung. Jeder Chip nennt Filter und Wert und lässt sich einzeln wegklicken, sodass eine leere Liste ihren Grund nennt. **Ansicht merken** legt die Filter einer Ansicht im Browser ab und stellt sie beim nächsten Start wieder her
- **Neu:** Tabellen lassen sich anpassen: **Kompakte Tabellen** in den Einstellungen rückt die Zeilen enger zusammen – rund zwanzig statt zwölf Mitarbeiter im Bild –, die Schaltfläche **Spalten** wählt die sichtbaren Spalten der Mitarbeitertabelle, und ein Klick mit gedrückter **Umschalttaste** wählt alle Zeilen bis zur zuletzt angeklickten mit aus
- **Neu:** In der Einweisungsmatrix und in der Jahresauswertung der Pflichtfortbildungen bleibt die Namensspalte beim seitlichen Blättern stehen – bisher wusste man nach ein paar Geräten nicht mehr, wessen Zeile man liest
- **Neu:** Nach einer neuen Fassung zeigt ein Hinweis beim ersten Start, was sich geändert hat – der Abschnitt aus der Änderungshistorie der Hilfe, einmal je Fassung und Arbeitsplatz
- **Neu:** **Strg + K** öffnet eine Befehlspalette – ein Feld für alles: Sie findet Ansichten, Aktionen und Datensätze (Mitarbeiter, Termine, Memos, Fortbildungen, Teamsitzungen, Geräte) und führt beim Bestätigen aus, was gewählt wurde. Ein Datensatz wechselt dabei in seine Ansicht und öffnet sich dort zum Bearbeiten. Gesucht wird so nachsichtig wie überall, Treffer am Wortanfang stehen vorn, und gezeigt wird nur, was das angemeldete Konto sehen darf. Der Einstieg steht als Knopf **Suchen** über der Navigation
- **Neu:** TeO lässt sich über die Tastatur bedienen: **?** zeigt alle Kürzel, **/** springt in das Suchfeld der gezeigten Ansicht, **n** legt dort einen neuen Eintrag an, **g** gefolgt von einem Buchstaben wechselt die Ansicht (etwa **g m** zu den Mitarbeitern). Die Kürzel ruhen, solange ein Eingabefeld oder ein Dialog den Fokus hat; im Raster der Urlaubsplanung behalten die Buchstaben ihre dortige Bedeutung. Die Übersicht öffnet auch die Schaltfläche **Tastenkürzel** in der Hilfe
- **Neu:** Gelöschte Datensätze und Sammelbearbeitungen lassen sich zurücknehmen – über **Rückgängig** in der Meldung unten rechts oder mit **Strg + Z**. Zurück geht es einen Schritt, und zwar den zuletzt gemeldeten; das Zurücknehmen selbst steht mit im Änderungsprotokoll, sodass Löschung und Rücknahme beide nachvollziehbar bleiben. Angeboten wird es beim Löschen von Mitarbeitern, Terminen, Memos, Fortbildungen, Nachweisen, Teamsitzungen, Geräten, Einweisungsnachweisen und Katalogeinträgen sowie nach einer Sammelbearbeitung

### 4.41.0 – Nachsichtige Suche

- **Neu:** Die Seitenleiste lässt sich über den Winkel neben dem Namenszug nach links einklappen; eingeklappt bleibt eine schmale Spur mit den Symbolen der Menüpunkte, deren Beschriftung beim Zeigen als Kurzhinweis samt Zähler erscheint. Der Zustand bleibt im Browser gespeichert
- **Neu:** Alle Suchfelder der Anwendung sehen über die Schreibweise hinweg: Umlaute lassen sich ohne Punkte oder als „ae“, „oe“ und „ue“ eingeben, „ß“, „ss“ und „s“ finden einander, Akzente werden ignoriert. „Müller“ findet man mit „muller“ oder „mueller“, „Weiß“ mit „weiss“ oder „weis“ – in Mitarbeitern, Terminen, Memos, Geräten, Teilnahmelisten und der Hilfe
- **Verbessert:** Die Fassung wird ohne führende Nullen geschrieben – „4.41.0“ statt „004.041.000“, in der Anwendung, im Änderungsverzeichnis und im Namen des Offline-Zwischenspeichers. Ältere Abschnitte dieses Verzeichnisses behalten ihre Schreibweise und bleiben auffindbar
- **Behoben:** Im Monatsraster des Terminkalenders sah eine Suche wirkungslos aus, sobald der gesuchte Termin in einem anderen Monat lag: Das Raster zeigt nur den gewählten Monat, ein Treffer im Dezember blieb im August also unsichtbar. Die Zeile unter dem Raster nennt jetzt die Zahl der Treffer im gezeigten Monat, weist auf Treffer in anderen Monaten hin und führt auf Klick zum nächstgelegenen
- **Behoben:** Angepinnte Termine blieben auch bei einer Suche stehen und sahen dort wie Treffer aus – in der Liste wie im Monatsraster. Ein Suchbegriff gilt jetzt auch für sie; vom Zeitraumfilter bleiben sie wie bisher ausgenommen

### 004.040.000 – Eigene Symbole, klebende Kopfzeile und schnellere Ansichten

- **Neu:** Ein GitHub-Workflow baut das Paket und legt die Veröffentlichung mit Titel, Text und Prüfsumme an; Titel und Text stammen aus diesem Änderungsverzeichnis
- **Verbessert:** Wochenendverteilung, Urlaubsplanung und Terminkalender tragen in der Seitenleiste und in der mobilen Navigation je ein eigenes Symbol statt dreimal des Kalenderblatts
- **Verbessert:** Jede Ansicht wiederholt das Symbol ihres Menüpunkts klein vor der Bereichszeile über der Überschrift
- **Verbessert:** Die Warnung „Datensicherung erforderlich“ steht nicht mehr über der Kopfzeile der Ansicht, sondern als Einblendung unten rechts bei den übrigen Meldungen – dauerhaft sichtbar und über Ansicht, Dialog und Abdunklung
- **Verbessert:** Die Kopfzeile jeder Ansicht ist eine eigene Karte und bleibt beim Blättern oben stehen; sobald sie klebt, klappt sie auf eine Zeile mit Bereichssymbol, Titel und Schaltflächen ein
- **Verbessert:** Die Filterleiste der Geräteansichten kommt ohne Trennlinie zum Inhalt darunter aus
- **Verbessert:** Das Farbthema „Windows 95“ bringt auch die Bildlaufleisten im Stil der Zeit mit: gerasterte Bahn, erhabener Schieber und quadratische Pfeilfelder, die beim Drücken einsinken
- **Verbessert:** Das Farbthema „Windows 95“ reicht jetzt bis in Schaltflächen und Menü: graue Flächen mit erhabener Kante, die beim Drücken einsinkt, ein Menü mit navyblauer Hervorhebung, eingelassene Eingabefelder – und überall eckige statt runder Ecken
- **Verbessert:** Die Geräteansicht öffnet sich jetzt in einem Wimpernschlag statt nach anderthalb Sekunden: Die Einweisungsmatrix wird erst ausgemessen, wenn sie ins Bild kommt, das Einweisungsprotokoll lädt seitenweise und beantwortet die Frage nach den Einweisungen einer Zelle aus einem Verzeichnis statt aus dem gesamten Bestand
- **Verbessert:** Fortbildungsstände werden aus einem Verzeichnis der Nachweise beantwortet; die Auswertung eines mehrjährigen Archivs dauert damit einen Bruchteil der bisherigen Zeit
- **Behoben:** `npm test` und damit `npm run verify` und das Paketskript liefen unter Windows nicht – der Testaufruf verließ sich auf die Auflösung von Platzhaltern durch die Shell, die es dort nicht gibt
- **Behoben:** Beim Tippen in ein Datumsfeld blieb die graue Beschriftung „TT.MM.JJJJ“ stehen und verdeckte die Eingabe – ein unvollständiges Datum hat noch keinen Wert. Während der Eingabe zeigt das Feld jetzt seine eigene Anzeige, nach dem Verlassen wieder das Datum in deutscher Schreibweise
- **Behoben:** In den Schemata „Dunkel“, „Nord“, „Dracula“ und „Catppuccin Latte“ standen die Meldungen unten rechts als weiße Schrift auf heller Fläche und waren praktisch unlesbar; jedes Schema bringt jetzt eigene Farben für Fläche, Schrift und Symbole mit

### 004.039.000 – Terminkalender als Monatsansicht

- **Neu:** Der Terminkalender lässt sich zwischen der Liste und einem Monatsraster mit einem Feld je Tag umschalten; die Auswahl und der angesehene Monat bleiben im Browser gespeichert
- **Neu:** Im Monatsraster legt ein Klick auf einen Tag einen Termin für genau diesen Tag an, ein Klick auf einen Eintrag öffnet ihn zum Bearbeiten
- **Neu:** Das Monatsraster hebt den heutigen Tag hervor, setzt Wochenenden und Feiertage in Nordrhein-Westfalen ab und klappt ab dem vierten Termin eines Tages den Rest über „+n weitere“ auf
- **Verbessert:** Suchfeld und Zeitraumfilter wirken in beiden Darstellungen; angepinnte Termine bleiben wie in der Liste unabhängig vom Zeitraumfilter sichtbar

### 004.038.000 – Farbthema je Benutzerkonto

- **Neu:** Das Farbthema gehört zum Benutzerkonto: Jede Anmeldung bringt die eigene Auswahl mit, an jedem Arbeitsplatz, ohne die Ansicht der übrigen Konten zu verändern
- **Verbessert:** Das Farbthema aus den Einstellungen bleibt die gemeinsame Vorgabe – sie gilt vor der Anmeldung und für Konten, die noch nie ein eigenes Thema gewählt haben
- **Verbessert:** Ein Themenwechsel erscheint nicht mehr im Änderungsprotokoll; er betrifft nur die Anzeige eines einzelnen Kontos
- **Verbessert:** Die Abmeldung in der Sidebar trägt statt des Schließen-Kreuzes ein eigenes Symbol

### 004.037.008 – Strengere CSP und schlankeres Paket

- **Verbessert:** Die Anwendung kommt ohne style-Attribute aus; die CSP des Servers verbietet sie jetzt vollständig (`style-src-attr 'none'`)
- **Verbessert:** Die Statusauskunft des Servers nennt Revision und Schemastand nur noch einer angemeldeten Sitzung
- **Verbessert:** Die Anmeldedrosselung zählt jeden Versuch atomar, bevor sie entscheidet – gleichzeitige Anfragen kommen nicht mehr am Limit vorbei
- **Verbessert:** `app.html` ist keine 240 KB große Kopie von `index.html` mehr, sondern eine Weiterleitung
- **Verbessert:** Einheitlich englische Bezeichner im Programmcode

### 004.037.007 – Sicherungszeitpunkt und Datenbankabgleich

- **Behoben:** Lässt sich der Sicherungszeitpunkt nach einer automatischen Sicherung nicht speichern, gilt der Bestand nicht mehr fälschlich als gesichert; ein Serverkonflikt wird sofort statt bei der nächsten Änderung behandelt
- **Verbessert:** Der Datenbankabgleich vergleicht Datensätze unabhängig von der Feldreihenfolge – eine Umsortierung im Client schreibt nicht mehr den gesamten Bestand neu

### 004.037.006 – Schnellerer Start

- **Neu:** Der TeO-Server komprimiert Oberfläche und Programmdateien; die Startlast sinkt von rund 1 MB auf etwa 210 KB
- **Verbessert:** Die Skripte werden mit `defer` geladen und blockieren den Seitenaufbau nicht mehr

### 004.037.005 – Offlinebetrieb

- **Neu:** TeO läuft ohne Netzverbindung weiter und lässt sich als App installieren; Oberfläche und Programmdateien liegen in einem versionierten Zwischenspeicher
- **Neu:** Jeder Build legt einen eigenen Zwischenspeicher an und räumt den vorherigen, damit nie ein veralteter Stand ausgeliefert wird
- **Verbessert:** Anfragen an den MariaDB-Dienst werden nie zwischengespeichert, damit kein veralteter Datenbestand entsteht

### 004.037.004 – Klarere Einordnung von lokalem Modus, Memos und Urlaub

- **Verbessert:** Die Speicherort-Einstellung benennt jetzt deutlich, dass der lokale Modus keinen Zugriffsschutz bietet und wofür er geeignet ist
- **Verbessert:** „Nur für mich“ heißt jetzt „Nur in meiner Ansicht“ – der Eintrag bleibt Teil des gemeinsamen Datenbestands und erscheint in Datensicherungen
- **Verbessert:** Die Hilfe erklärt, wann die lineare Kürzung des Urlaubsanspruchs bei Teilzeit von der Berechnung nach Arbeitstagen abweicht und wie sich das ausgleichen lässt

### 004.037.003 – Robusterer Import und Kontenprüfung

- **Behoben:** Nach einem Import bleiben keine Filter mehr stehen – zuvor schränkten Suche, Kategorie- und Bestandsfilter den neuen Datenbestand weiter ein und ließen Listen leer wirken
- **Behoben:** Ein ungültiges oder doppelt vergebenes Benutzerkonto verwirft nicht mehr alle übrigen Konten; verworfene Konten werden nach dem Start gemeldet
- **Behoben:** Der Hinweis „noch nicht als Datensicherung exportiert“ verschwindet nach einer erfolgreichen automatischen Sicherung wieder zuverlässig
- **Neu:** Die Strukturprüfung meldet Filter, die beim Import nicht zurückgesetzt werden

### 004.037.002 – Prüfstrecke gegen toten Code

- **Neu:** Ein GitHub-Workflow führt bei jedem Push `npm run verify` aus und meldet, wenn die erzeugten Dateien nicht mehr zu den Quellen in `src/` passen
- **Neu:** Die Strukturprüfung meldet Funktionen, die nirgends aufgerufen werden, sowie Oberflächenverweise, die nie gelesen werden
- **Behoben:** `getFilteredEmployeeEmailExport` wurde nur noch vom Test verwendet – der E-Mail-Export ist jetzt über den tatsächlich genutzten Weg abgesichert
- **Behoben:** Nicht mehr benötigte Funktion `employeeNameSignature` sowie die Verweise auf `openCatalogManagementButton` und `backupVolumeBar` entfernt

### 004.037.001 – Memos in Protokoll und Sicherung

- **Behoben:** Änderungen an Memos und ToDos erscheinen im Änderungsprotokoll wieder namentlich statt als „Datenbestand aktualisiert“
- **Behoben:** Wurden seit der letzten Datensicherung nur Memos oder ToDos geändert, galt der Datenbestand fälschlich als gesichert – Warnhinweis, Schließen-Erinnerung und automatische Sicherung blieben aus
- **Behoben:** Der Dateiname des Geräte-Excel-Exports und das Stand-Datum der gedruckten Telefonliste nannten zwischen Mitternacht und 2 Uhr den Vortag
- **Verbessert:** Die nachverfolgten Sammlungen stehen jetzt an einer einzigen Stelle; ein neuer Test gleicht sie gegen den Datenvertrag ab, damit künftige Sammlungen nicht vergessen werden

### 004.037.000 – Memo / ToDo

- **Neu:** Eigener Bereich für persönliche und gemeinsame Memos und ToDos mit optionalem Datum, Beschreibung, Status und Wichtig-Markierung
- **Neu:** Memo-/ToDo-Kategorien lassen sich in den Stammdaten anlegen, umbenennen und löschen
- **Neu:** Offene sichtbare Einträge erscheinen bei Bedarf neben dem auf 50 Prozent verkleinerten Fristenmonitor
- **Verbessert:** Private Einträge werden ausschließlich dem erstellenden Konto angezeigt; Suche sowie Kategorie- und Statusfilter erleichtern die Übersicht

### 004.036.001 – Automatischer Startabgleich

- **Verbessert:** Nach dem Login lädt TeO `teo-autosicherung.json` automatisch aus dem zuletzt verknüpften Sicherungsordner
- **Verbessert:** Die Dateiauswahl erscheint nur noch, wenn Ordnerzugriff oder Sicherungsdatei nicht verfügbar sind oder die Datei nicht übernommen werden kann

### 004.036.000 – Excel-Export der Geräteverwaltung

- **Neu:** Der vollständige Gerätekatalog lässt sich unabhängig von den gesetzten Filtern als Excel-Datei exportieren
- **Neu:** Die neutral formatierte Tabelle enthält ID bzw. Nummer, Hersteller, Produktname, Gerätekategorie, Anlage-1-Status und aktuellen Bestandsstatus

### 004.035.002 – Primäraktion der Pflichtfortbildungen

- **Verbessert:** „Abschluss eintragen“ steht jetzt an der prominenten Aktionsposition und verwendet den Primärstil
- **Verbessert:** „Fortbildung anlegen“ steht davor und verwendet den zurückhaltenderen Sekundärstil

### 004.035.001 – Erkennbares Symbol für wichtige Termine

- **Verbessert:** Angepinnte Termine verwenden jetzt das deutlich erkennbare Glockensymbol „notifications_active“
- **Verbessert:** Das Material-Symbol ist als CSS-Maske vollständig offline eingebettet und übernimmt automatisch die jeweilige Theme-Farbe

### 004.035.000 – Terminbeschreibungen im Fristenmonitor

- **Neu:** Hinterlegte Terminbeschreibungen werden im Fristenmonitor unter den Termindetails angezeigt
- **Verbessert:** Lange Beschreibungen werden auf zwei Zeilen begrenzt und bleiben vollständig als Tooltip verfügbar

### 004.034.001 – Filter für angepinnte Termine

- **Fix:** Der Filter „Überfällige ausblenden“ gilt jetzt auch für angepinnte Termine im Fristenmonitor
- **Fix:** Angepinnte Termine erscheinen im Terminkalender nur noch im Abschnitt „Angepinnte Termine“ statt zusätzlich in einer Zeitraumgruppe

### 004.034.000 – Gerätebezogene Einweisungsübersicht

- **Neu:** Klick auf einen Gerätenamen in der Einweisungsmatrix öffnet die Übersicht aller eingewiesenen und nicht eingewiesenen Mitarbeiter
- **Neu:** Geräteübersicht lässt sich nach Name, Einweisungsstatus und Mitarbeiterstatus filtern
- **Verbessert:** Vorhandene Einweisungen führen direkt aus der Geräteübersicht in den vollständigen Einweisungsverlauf

### 004.033.000 – Angepinnte Termine

- **Neu:** Termine lassen sich im Formular oder direkt in der Terminliste anpinnen
- **Neu:** Angepinnte Termine stehen unabhängig von Suche, Zeitraum und sonstigen Filtern ganz oben in Terminliste und Fristenmonitor
- **Verbessert:** Wichtige Termine werden mit Pin-Symbol, Wichtig-Kennzeichnung und farblicher Hervorhebung dargestellt

### 004.032.001 – Farbthemen

- **Entfernt:** Farbschema Windows 3.11 wegen zu intensiver Darstellung

### 004.032.000 – Zusätzliche Farbthemen

- **Neu:** Nord, Dracula und Catppuccin Latte als etablierte Farbpaletten
- **Neu:** Retro-Farbschemata Windows 3.11 und Windows 95
- **Verbessert:** Dunkle Formulare, Urlaubsmarkierungen und Mindestkontraste der neuen Themes abgesichert

### 004.031.015 – Historische Änderungshistorie

- **Verbessert:** Changelog anhand der Git-Historie bis zur ersten Repository-Version vervollständigt

### 004.031.014 – Repository und Releaseprozess

- **Verbessert:** Veraltete Archive, Sicherungskopien und redundante Generatoren entfernt
- **Neu:** Reproduzierbarer Befehl zum Erstellen des geprüften lokalen Release-Pakets
- **Verbessert:** Ignorierregeln, Entwicklungsdokumentation und Änderungshistorie aktualisiert

### 004.031.013 – Release-Build

- **Release:** Geprüftes Betriebspaket als GitHub-Release veröffentlicht

### 004.031.012 – Einweisungsdokumentation

- **Neu:** Erfasste Einweisungen lassen sich durchsuchen und sortieren
- **Verbessert:** Standardsortierung nach Eingabedatum und scrollbare Liste mit zehn sichtbaren Einträgen

### 004.031.011 – Formularvalidierung

- **Fix:** Pflichtmeldung wird direkt an der zu bestätigenden Checkbox angezeigt

### 004.031.010 – Formularvalidierung

- **Fix:** Hinweis zur erforderlichen Bestätigung an der Checkbox verankert

### 004.031.009 – Statusmeldungen

- **Fix:** Statusmeldungen werden aus Dialogen herausgelöst und unten rechts im Viewport angezeigt

### 004.031.008 – Statusmeldungen

- **Fix:** Statusmeldungen bleiben unabhängig von geöffneten Widgets unten rechts positioniert

### 004.031.007 – Statusmeldungen

- **Fix:** Meldungen bleiben bei Dialogwechseln sichtbar und eindeutig zugeordnet

### 004.031.006 – Statusmeldungen

- **Fix:** Statusmeldungen werden nicht mehr mit der Hauptansicht ausgeblendet

### 004.031.005 – Sicherungsvolumen

- **Verbessert:** Sicherungsgröße wird als farbiger Balken mit aktuellem und maximalem Volumen dargestellt

### 004.031.004 – Sicherungsvolumen

- **Neu:** Maximale Sicherungsgröße ist einstellbar und warnt bei 90 Prozent Auslastung

### 004.031.003 – Hilfe

- **Verbessert:** Häufig gestellte Fragen an den aktuellen Sicherungs- und Anmeldeablauf angepasst

### 004.031.002 – Startabgleich

- **Neu:** Beim Start muss die gemeinsame Sicherungsdatei für einen aktuellen Datenstand ausgewählt werden

### 004.031.001 – Autosicherung

- **Verbessert:** Automatische Sicherungen verwenden dauerhaft dieselbe ausgewählte Datei

### 004.031.000 – Verschlüsselte Autosicherung

- **Neu:** Verschlüsselung und Entschlüsselung der Autosicherung werden beim Login automatisch freigeschaltet

### 004.030.000 – Automatische Sicherung

- **Neu:** Änderungen werden nach zwei Sekunden automatisch in den ausgewählten Ordner gesichert
- **Neu:** JSON-Sicherungen können optional verschlüsselt werden

### 004.029.000 – Teamsitzungen

- **Neu:** Das anzuzeigende Auswertungsjahr kann ausgewählt werden

### 004.028.000 – Geräteeinweisungen

- **Neu:** Ein Klick auf einen Mitarbeiter zeigt alle Geräte mit und ohne Einweisung

### 004.027.003 – Startseite

- **Verbessert:** Widget „Aktive Mitarbeiter“ von der Startseite entfernt

### 004.027.002 – Urlaubsdruck

- **Verbessert:** Schulferien NRW werden in der Drucklegende ausgewiesen

### 004.027.001 – Urlaubsdruck

- **Fix:** Fehlerhafte erste Seite und abschließende Leerseite entfernt

### 004.027.000 – Urlaubsdruck

- **Neu:** Leere Jahresübersicht für alle aktiven und einzuarbeitenden Mitarbeiter auf DIN A4
- **Neu:** Feiertage und Dienstwochenenden werden im Ausdruck markiert

### 004.026.002 – Geräteeinweisungen

- **Verbessert:** Einweisende Mitarbeiter sind nach Nachname und Vorname aufgebaut und per Anfangsbuchstaben auswählbar

### 004.026.001 – Geräteeinweisungen

- **Fix:** Mitarbeiterlisten werden nach Nachname und Vorname sortiert

### 004.026.000 – Termine, Mitarbeiter und Serversicherheit

- **Neu:** Terminverwaltung besitzt Suche und Filter
- **Neu:** Mitarbeiterringe zeigen Beschäftigungsumfang und Statusfarbe
- **Verbessert:** Sicherheitsheader, Sitzungen, Login-Drosselung und Servervalidierung erweitert

### 004.025.000 – Maximierbare Einweisungsmatrix

- **Neu:** Einweisungsmatrix lässt sich wie die Tabelle der Urlaubsplanung maximieren
- **Verbessert:** Verkleinern per Schaltfläche oder Escape-Taste

### 004.024.000 – Gegliederte Einstellungen

- **Neu:** Einstellungen-Untermenü in Sidebar und Einstellungsansicht
- **Verbessert:** Einstellungskarten in fünf fachlich passende Bereiche gegliedert

### 004.023.000 – Einweisungsberechtigung für Geräte

- **Neu:** Einweisungsberechtigte Mitarbeiter werden je Gerät aus Herstellereinweisungen angezeigt
- **Neu:** Gerätefilter nach berechtigter Person sowie Geräten mit oder ohne Einweisungsberechtigte

### 004.022.000 – Fortbildungsquote im Jahresvergleich

- **Neu:** Aufklappbarer Jahresverlauf der Pflichtfortbildungsquote als Balkendiagramm
- **Verbessert:** Mitarbeiternamen in der Fortbildungs-Jahresauswertung öffnen direkt die Mitarbeiter-Akte

### 004.021.000 – Fortbildungs- und Sitzungsstatus

- **Neu:** Fortbildungsfortschritt auf der Startseite als Prozentwert
- **Neu:** Sitzungsstatus „Nicht zutreffend“ ohne Einfluss auf die Anwesenheitsstatistik

### 004.020.000 – Pflichtfortbildungszeiten

- **Neu:** Optionale Soll-Zeiten je Pflichtfortbildung in den Einstellungen
- **Neu:** Rechner für bis zu 20 Zeitspannen und anrechenbare Fortbildungszeit

### 004.019.000 – Urlaubsplanung

- **Neu:** Nachtdienst als Planungseintrag ohne Urlaubsverbrauch
- **Verbessert:** Unbezahlter Urlaub mit Kürzel „uU“ und Tastenkürzel B

### 004.018.000 – Fristenmonitor

- **Neu:** Filter zum Ausblenden überfälliger Einträge im Fristenmonitor

### 004.017.001 – Fehlerbehebung

- **Fix:** Termin mit Teilnehmerliste passt auch bei Windows-Standardrändern auf eine A4-Seite

### 004.017.000 – Änderungshistorie

- **Verbessert:** Kuratierte Änderungshistorie mit kurzen deutschen Stichpunkten

### 004.016.001 – Fehlerbehebung

- **Fix:** Termindruck ohne Pflichtfortbildungs-Jahresauswertung

### 004.016.000 – Mitarbeiter, Urlaub und Termine

- **Neu:** Mitarbeitersuche ausschließlich nach Vor- und Nachname
- **Neu:** Statusfilter „Aktiv + In Einarbeitung“
- **Neu:** Speicherung des zuletzt gewählten Urlaubsmonats und Planungsjahrs
- **Verbessert:** Urlaubseinstellungen zentral unter Einstellungen → Urlaub
- **Verbessert:** Maximierte Urlaubsplanung mit Symbollegende und Monatsnavigation
- **Neu:** Termin-Druckansicht mit optionaler Teilnehmerliste
- **Neu:** Termindetails per Terminkarte und Fristenmonitor erreichbar

### 004.015.000 – Datensicherung

- **Neu:** Automatische Sicherungen mit wählbarem Intervall und Aufbewahrung
- **Verbessert:** Sicherungsstatus und Erinnerungen in der Anwendung

### 004.014.000 – Fristenmonitor

- **Neu:** Schulungen und Geräteeinweisungen als Fortbildungstermine im Fristenmonitor
- **Verbessert:** Terminkategorien mit passenden Symbolen und Filtern

### 004.013.001 – Urlaubsplanung und Druck

- **Neu:** Fensterfüllende Urlaubsplanung mit optimierter Druckansicht
- **Verbessert:** Fixierte Tabellenbereiche und kompaktere Monatsübersicht

### 004.013.000 – Bedienung und Auswertungen

- **Neu:** Tastaturbedienung, Bereichsauswahl und Konfliktprüfung in der Urlaubsplanung
- **Neu:** Schulferienverwaltung und Markierung in der Urlaubsplanung
- **Neu:** Mehrfachauswahl, Suche und Sortierung bei Geräteeinweisungen
- **Neu:** Sortierbare Navigation und zusätzliche Terminkategorien
- **Verbessert:** Schnellere Ansichtswechsel durch selektives Rendern
- **Verbessert:** Auswertungen, Dialogbedienung und Statusanzeigen

### 004.012.001 – Seitenleiste

- **Verbessert:** Sortierhinweis der Navigation oberhalb der Anmeldeinformationen angeordnet

### 004.012.000 – Urlaubsplanung

- **Neu:** Vollständige Tastaturbedienung und rechteckige Bereichsauswahl in der Monatsplanung
- **Neu:** Mitarbeiterfilter und detaillierte Prüfung von Abwesenheitsüberschneidungen
- **Neu:** Geburtstage, Beschäftigungsumfang und Dienstwochenenden in der Planung sichtbar
- **Verbessert:** Assistenzberufe werden bei den konfigurierten Abwesenheitsgrenzen gesondert behandelt

### 004.010.000 – Geräteeinweisungen

- **Neu:** Mehrere Geräte können gemeinsam für eine Einweisung ausgewählt werden
- **Neu:** Gerätesuche, alphabetische Sortierung und Auswahl aller sichtbaren Geräte
- **Neu:** Sortierung der Nachweise nach Einweisungs- oder Eingabedatum

### 004.009.000 – Navigation und Termine

- **Neu:** Persönlich sortierbare Seitenleiste mit Maus- und Tastaturbedienung
- **Neu:** Zusätzliche Terminkategorien mit eigenen Symbolen
- **Verbessert:** Startseite und Fristenmonitor kompakter und übersichtlicher gestaltet

### 004.008.000 – Schulferien und Buildnummer

- **Neu:** Schulferien lassen sich in den Einstellungen pflegen und um amtliche NRW-Termine ergänzen
- **Neu:** Ferienzeiträume erweitern automatisch die Jahresauswahl der Urlaubsplanung
- **Verbessert:** Einheitliche dreiteilige Buildnummer und Befehle für Versionssprünge eingeführt

### 004.004 – Web-App, Rollen und Auswertungen

- **Neu:** Installierbare Web-App mit Manifest und eigenen App-Symbolen
- **Neu:** Normale Konten dürfen den fachlichen Datenbestand vollständig bearbeiten
- **Neu:** Benutzerverwaltung mit temporären Passwörtern und geschütztem letzten Administratorkonto
- **Neu:** Benutzernamenexport, Gerätesuche und Fortbildungs-Komplettierungsgrad
- **Neu:** Einstellbares Verhalten beim Schließen von Dialogen
- **Verbessert:** Systemstatus, dauerhafter Browserspeicher und Demo-Daten erweitert

### 004.001 – Relationale MariaDB-Speicherung

- **Neu:** Fachliche Daten und Beziehungen werden in getrennten MariaDB-Tabellen gespeichert
- **Neu:** Automatische, transaktionale Migration des früheren JSON-Gesamtbestands
- **Verbessert:** Fremdschlüssel, relationale Zuordnungen und selektive Datenbankaktualisierung

### 003.023 – Projektstruktur und Administration

- **Neu:** Quellmodule für Anwendung, HTML, Styles, Datenvertrag und Metadaten eingeführt
- **Neu:** Reproduzierbarer Build mit Strukturprüfung und automatisierten Fachtests
- **Neu:** Persistente Serversitzungen, Datenbankmigrationen und abgesicherte Administrationsabläufe
- **Verbessert:** README als ausführliches Benutzerhandbuch und integrierte Online-Hilfe aufgebaut

### 002.009 – Fortbildungsreihen und Demo-Daten

- **Neu:** Wiederkehrende Pflichtfortbildungen werden zu Reihen mit fortgeschriebenen Fristen verbunden
- **Neu:** Einführungsjahr und mehrjährige Gültigkeit wirken in der Jahresauswertung
- **Neu:** Reproduzierbarer synthetischer Demo-Datensatz mit 60 Mitarbeitern
- **Verbessert:** Eindeutige Benutzernamen verknüpfen Konten mit Personalstammdaten

### 002.000 – Erste Repository-Version

- **Neu:** Mitarbeiterverwaltung, Dienstwochenenden, Urlaubsplanung und Terminkalender
- **Neu:** Pflichtfortbildungen, Teamsitzungen, Gerätekatalog und Einweisungsmatrix
- **Neu:** Lokaler IndexedDB-Betrieb sowie gemeinsamer Betrieb mit Node.js und MariaDB
- **Neu:** Benutzeranmeldung, Rollen, Datensicherung, Fristenmonitor und Änderungsprotokoll
- **Verbessert:** Datenrevisionen und gehärtete Synchronisierung verhindern unbemerkte Überschreibungen
