# TeO – Team & Employee Organizer

Aktuelle Projektversion: **TeO – Team & Employee Organizer - 002.009**

Die Buildnummer besteht aus einer dreistelligen Major- und Minor-Nummer. Größere,
strukturelle Änderungen erhöhen die Major-Nummer; Funktionen, Erweiterungen und
Korrekturen erhöhen die Minor-Nummer.

Mitarbeiter- und Organisationsverwaltung für eine Intensivstation. TeO kann weiterhin
als lokale Browser-Anwendung oder gemeinsam an mehreren Arbeitsplätzen über das
optionale MariaDB-Backend betrieben werden.

## Start

Für den lokalen Einzelplatzmodus `index.html` in einem aktuellen Browser öffnen.

Für den gemeinsamen MariaDB-Betrieb wird Node.js 20 oder neuer benötigt. Einrichtung
und Serverkonfiguration sind in [`server/README.md`](server/README.md) beschrieben.
Der Server liefert die App anschließend selbst aus.

## Enthaltene Funktionen

- Mitarbeiter anlegen, bearbeiten, als aktiv, in Einarbeitung oder inaktiv führen und löschen
- E-Mail-Adressen aller aktiven Mitarbeiter als Semikolon-Liste in die Zwischenablage kopieren
- Stammdaten, Stellenumfang, Beruf, festes Dienstwochenende und Zusatzqualifikationen verwalten
- Mitarbeitern einen eindeutigen Benutzernamen zuweisen und damit Anmeldekonten
  zuverlässig den zugehörigen Personalstammdaten zuordnen
- Berufe und Zusatzqualifikationen in administrierbaren Katalogen ergänzen, umbenennen und löschen
- Die Berufsbezeichnungen „Gesundheits- und Krankenpfleger/in“ sowie
  „3-jährig examiniert“ automatisch unter „Pflegefachkraft“ zusammenführen
- Optionale Ablaufdaten für Zusatzqualifikationen hinterlegen
- Terminkalender mit Titel, Datum, optionaler Zeitspanne, Ort und Beschreibung;
  anstehende Termine erscheinen automatisch im Fristenmonitor
- Einheitliche sichtbare Datums- und Zeitdarstellung als `dd.mm.yyyy` und
  `hh:mm` im 24-Stunden-Format
- Fristenmonitor für anstehende Termine und Geburtstage sowie überfällige und
  innerhalb von 30, 60 oder 90 Tagen fällige Fortbildungen und Zusatzqualifikationen
- Geburtstage im Fristenmonitor mit Mitarbeitername, erreichtem Lebensjahr und
  vollständigem Geburtsdatum darstellen
- Fristenmonitor nach Terminen, Geburtstagen, Fortbildungen und Zusatzqualifikationen
  filterbar; die Auswahl bleibt lokal gespeichert
- Druckbare Gesamtakte je Mitarbeiter mit Stammdaten, Qualifikationen,
  Fortbildungsstatus und Teamsitzungsteilnahmen
- Mitarbeiter nach Beruf, Qualifikation, Status und Dienstwochenende kombinierbar filtern
- Mitarbeiterliste nach allen fachlichen Spalten auf- oder absteigend sortieren
- Mehrere Mitarbeiter gemeinsam bearbeiten: Aktivstatus, Beruf, Zusatzqualifikation
  und festes Dienstwochenende
- Eigene Menüansicht für die Dienstwochenendverteilung mit Mitarbeiterlisten,
  kumulierten Stellenanteilen, Vollzeitäquivalenten, Einarbeitungszahlen sowie der
  Verteilung von Fachweiterbildung I/A und Praxisanleitung
- Automatische Plausibilitätsprüfung auf mögliche Dubletten sowie auffällige oder
  fehlende Kontaktdaten
- Jahresbezogene Urlaubsansprüche aus konfigurierbarem Vollzeit-Grundurlaub,
  Stellenanteil und individuell erarbeitetem Zusatzurlaub berechnen
- Urlaubstage in einer monatlichen Teamtabelle planen; Wochenenden, gesetzliche
  Feiertage in Nordrhein-Westfalen sowie Oli- und Claudio-Dienstwochenenden werden
  unterschiedlich markiert
- Schule, Weiterbildung oder Universität, unbezahlten Urlaub, externe Einsätze,
  frei geplante Tage und verpflichtende Dienstzusagen zusätzlich zum regulären
  Urlaub eintragen
- Inaktive Mitarbeiter aus der Planung ausblenden und „Urlaub Einarbeitung“
  erfassen, ohne diesen auf die tägliche Abwesenheitsgrenze anzurechnen
- Tägliche Abwesenheitssummen mit getrennt konfigurierbaren Obergrenzen für
  Werktage sowie Wochenenden und Feiertage anzeigen; Überplanung zulassen und
  betroffene Tage deutlich rot kennzeichnen
- Urlaub auf dem eigenen festen Dienstwochenende durch eine verpflichtende
  Dienstzusage eines Mitarbeiters vom jeweils anderen Wochenende kompensieren
- Mitarbeiter in der Planung anhand ihres festen Oli- oder Claudio-Wochenendes
  farblich kennzeichnen
- Urlaubsplanung über die verfügbare Fensterbreite darstellen und die fünf
  Summenspalten Basis, Zusatz, Anspruch, Geplant und Rest beim Scrollen fixieren
- Per Klick auf den Mitarbeiternamen eine Jahresmatrix aller Abwesenheiten und
  Dienstzusagen öffnen: Tage in der Kopfzeile, Monate in der ersten Spalte und
  farblich markierte Dienstwochenenden
- Amtlich festgelegte NRW-Schulferien in der Monatsplanung kennzeichnen; örtlich
  unterschiedliche bewegliche Ferientage sind nicht enthalten
- Pflichtfortbildungen mit Wiederholungsintervall anlegen und bearbeiten:
  standardmäßig jährlich, Gewaltprävention standardmäßig alle fünf Jahre
- Wiederkehrende Fortbildungen thematisch zu Fortbildungsreihen verbinden, sodass
  ein neuerer Nachweis die Auffrischungsfrist der gesamten Reihe fortschreibt
- Das angegebene Jahr als Einführungsjahr in den Pflichtkatalog behandeln und die
  Fortbildung ab diesem Zeitpunkt in allen Folgejahren anbieten
- Jahresmatrix mit allen aktiven Mitarbeitern und absolvierten beziehungsweise offenen
  Pflichtfortbildungen anzeigen, Excel-kompatibel als CSV exportieren und im Querformat
  ausdrucken beziehungsweise über den Druckdialog als PDF speichern
- Jahresmatrix anhand der zum Jahresende gültigen Nachweise berechnen; mehrjährig
  gültige Abschlüsse erfüllen dadurch auch die folgenden Auswertungsjahre
- Abschlüsse für einen oder mehrere aktive Mitarbeiter gleichzeitig erfassen
- Historische Fortbildungsnachweise anzeigen und korrigieren
- Teamsitzungen anlegen, bearbeiten und löschen
- Teilnahme oder Abwesenheitsgrund (`Urlaub`, `Dienst`, `Krankheit`, `Schule`,
  `entschuldigt`, `unentschuldigt`) für das aktive Team dokumentieren
- Teilnahmestatus per Sammelaktion auf alle sichtbaren Mitarbeiter anwenden und nur
  Ausnahmen einzeln korrigieren
- Teamsitzungen jährlich nach Teilnahmequote, durchschnittlicher Teilnahme und
  Abwesenheitsgründen auswerten
- Jahresbezogene Teilnahmequote und Abwesenheitsgründe je Mitarbeiter mit einstellbarer
  Mindestquote anzeigen und als CSV exportieren
- Geräte mit Produktname, Hersteller, Gerätekategorie und Kennzeichnung als
  Medizinprodukt der Anlage 1 verwalten
- Vorgegebenen Gerätebestand mit Hersteller, Modell, Kategorie, Bestandsstatus
  und Anlage-1-Kennzeichnung bei der ersten Aktualisierung automatisch übernehmen
- Geräte als aktuell oder nicht mehr im Bestand kennzeichnen und den Gerätekatalog
  standardmäßig auf den aktuellen Bestand begrenzen
- Geräteeinweisungen mit Datum, mehreren Teilnehmern und einem externen oder internen
  Einweisenden dokumentieren; den historischen Medizinproduktebeauftragtenstatus
  je Teilnehmer und internem Einweisenden festhalten
- Einweisungsstand als filterbare Mitarbeiter-Geräte-Matrix darstellen und nach
  Anlage 1, Gerätekategorie sowie Mitarbeiterstatus einschränken
- Geräteeinweisungen und administrative Geräteverwaltung in getrennten Ansichten führen
- Dokumentierte Geräteeinweisungen chronologisch auflisten und nachträglich bearbeiten
- Zentrale Einstellungsseite für Farbthema, Datenspeicher, Sicherungen,
  Sicherungserinnerung und administrative Stammdaten
- Wahlweise localForage oder MariaDB als Datenspeicher verwenden; einen lokalen
  Datenbestand bei der ersten Verbindung kontrolliert nach MariaDB übertragen
- MariaDB über einen separaten JavaScript-API-Dienst anbinden, ohne
  Datenbankzugangsdaten an den Browser auszuliefern
- Serverseitige Anmeldung, zeitlich begrenzte Sitzungen und Rollenprüfung für
  Änderungen am zentralen Datenbestand
- Änderungen anderer Arbeitsplätze regelmäßig automatisch laden und offene
  Formulare dabei vor Überschreibungen schützen
- Gleichzeitige Schreibvorgänge über Datenrevisionen erkennen und unbemerkten
  Datenverlust verhindern
- Offene und aktuelle Nachweise in Übersicht und Fortschrittsanzeigen auswerten
- Asynchrone Speicherung mit localForage (bevorzugt über IndexedDB)
- Belegten und vom Browser geschätzten verfügbaren Speicherplatz direkt im
  Datensicherungsbereich anzeigen
- Dauerhafte Speicherung beim Browser anfordern und den bestätigten Schutzstatus anzeigen
- Automatische Übernahme eines eventuell vorhandenen Datenbestands aus `localStorage`
- Vollständigen Datenbestand als JSON-Sicherung exportieren und nach Prüfung wieder importieren
- Sicherungen ohne Import validieren, letztes Sicherungsdatum überwachen und vor jedem
  Import automatisch eine Wiederherstellungssicherung herunterladen
- Sicherungen optional mit Passwort, PBKDF2 und AES-GCM verschlüsselt exportieren
- Lokales Änderungsprotokoll mit Zeitpunkt, Benutzer und Änderung führen und als CSV exportieren
- Warnung vor dem Schließen von Formularen mit ungespeicherten Änderungen
- Zwischen Standard-, Dark- und Cellitinnen-Farbthema wechseln; Auswahl wird lokal gespeichert
- Lokale Anmeldung mit Administrator- und Nutzerrolle sowie erzwungener Passwortänderung
- Administrator kann Passwörter normaler Benutzer auf ein zufälliges temporäres Passwort
  zurücksetzen
- Administrator kann die eindeutigen Benutzernamen bestehender Konten bearbeiten

## Betriebsarten und Datenschutz

Im lokalen Modus liegen die Daten unverschlüsselt im verwendeten Browserprofil. Dieser
Modus bleibt eine lokale Einzelplatzlösung.

Im MariaDB-Modus werden die Daten zentral gespeichert und Anmeldung sowie Rollenprüfung
serverseitig durchgesetzt. Für einen produktiven Einsatz mit echten Beschäftigten- und
Gesundheitsdaten sind trotzdem mindestens HTTPS, geregelte MariaDB-Backups,
Betriebssystemhärtung, Netzwerkzugriffskontrollen, Protokollierung sowie eine mit
Datenschutz und IT-Sicherheit abgestimmte Betriebsvereinbarung erforderlich.

## Initiale Benutzerkonten

- `Becke003` – Administrator, Startpasswort `Hepar114`
- `Botze003` – normaler Benutzer, temporäres Startpasswort `Intensiv114!`
- `Ferre001` – normaler Benutzer, temporäres Startpasswort `Intensiv114!`

Die beiden normalen Benutzer müssen beim ersten Login ein eigenes Passwort vergeben. Normale
Benutzer können ausschließlich Fortbildungsnachweise und Teamsitzungsteilnahmen erfassen.
Die Urlaubs- und Abwesenheitsplanung sowie ihre Berechnungsgrundlagen werden durch
Administratoren gepflegt.
Passwörter werden mit PBKDF2 gehasht gespeichert.

Im lokalen Modus ist die Anmeldung lediglich ein Zugriffsschutz innerhalb der
Browser-Anwendung. Im MariaDB-Modus werden Zugangsdaten und Änderungsberechtigungen
zusätzlich vom API-Dienst geprüft.

Exportierte JSON-Sicherungen sind ebenfalls unverschlüsselt und enthalten den vollständigen
personenbezogenen Datenbestand. Sie müssen entsprechend geschützt aufbewahrt werden.

Die mitgelieferte localForage-Version `1.10.0` befindet sich zusammen mit ihrer Lizenz im
Ordner `vendor`.
