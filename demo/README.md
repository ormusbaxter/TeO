# TeO Demo-Datenbank

`teo-demo-datenbank-60-ma-2025-2026.json` ist eine vollständig synthetische
Datensicherung für TeO Build 004.004 / Datenformat 24.

Enthalten sind:

- 60 fiktive Mitarbeiter mit eindeutig als Demo gekennzeichneten Kontaktdaten
- monatliche Teamsitzungen von Januar 2025 bis Juli 2026
- Pflichtfortbildungen und plausible Abschlüsse für 2025 und 2026
- der unveränderte Gerätekatalog der Anwendung
- plausible Geräteeinweisungen für 2025 und Januar bis Juli 2026
- Ein- und Austrittsdaten, zwei angekündigte Austritte und einige Änderungen
  des Stellenumfangs
- eine Urlaubs- und Abwesenheitsplanung für 2025 und 2026 mit Zusatzurlaub,
  Resturlaub-Übertrag nach 2026 sowie einzelnen Schul-, Nachtdienst- und
  Dienstzusage-Einträgen

Die Datei kann unter **Einstellungen → Gesamten Datenbestand sichern →
Sicherung importieren** geladen werden. Der Import ersetzt den gesamten
fachlichen Datenbestand. Daher vorher bei Bedarf eine Sicherung exportieren.

Die **Benutzerkonten werden nicht ersetzt**: Wer bereits ein Konto besitzt,
meldet sich nach dem Import weiterhin damit an. Die enthaltenen Demo-Konten
werden nur übernommen, wenn noch gar kein Konto existiert – also bei einem
Import direkt in eine frische, noch nicht eingerichtete TeO-Installation.

Demo-Anmeldung (nur bei Import in eine leere Installation):

- Administrator: `DemoAdmin` / `DemoStart2026!`
- Benutzer: `DemoUser1` oder `DemoUser2` / `DemoUser2026!`

Diese Konten gelten ausschließlich für die synthetische Demo-Sicherung und
dürfen nicht für einen Produktivdatenbestand übernommen werden.

Die Datei lässt sich mit `tools/generate-demo-backup.mjs` reproduzierbar neu
erzeugen. E-Mail-Adressen verwenden ausschließlich die reservierte Domain
`example.invalid`; Telefonnummern liegen im erkennbaren Demo-Nummernblock
`+49 000`.

## Testdatensatz 2026/2027

`teo-testdatensatz-60-ma-2026-2027.json` ist ein zweiter, ebenso synthetischer
Datensatz mit Stichtag 5. Oktober 2026 und Blick auf 2027:

- 60 fiktive Mitarbeiter: 56 Pflegefachkräfte, davon 17 mit Fachweiterbildung
  Intensiv/Anästhesie, 2 Intensivtechnische Assistentinnen bzw. Assistenten,
  1 Medizinische Fachangestellte, 1 Stationsassistenz; 3 in Einarbeitung,
  2 im Laufe von 2026 ausgetreten, ein angekündigter Austritt zum 30.06.2027
- Stationsleitung, Stellvertretung, Medizinproduktebeauftragte, Praxisanleitung
  und weitere Zusatzqualifikationen
- Teamsitzungen Januar bis September 2026 mit Teilnahmen
- Pflichtfortbildungen 2026 mit Nachweisen bis zum Stichtag, die Fortbildungen
  2027 bereits angelegt
- Geräteeinweisungen 2026 für alle Geräte im Bestand
- 18 Termine von Oktober 2026 bis Juni 2027 und 10 Memos
- Urlaubsplanung 2026 und eine nahezu vollständige Planung für 2027 mit
  Resturlaub-Übertrag, Sommerferien-Staffelung, Schul-, Nachtdienst- und
  Dienstzusage-Einträgen

Anmeldung: `TestAdmin` / `DemoStart2026!`, `TestUser1` / `DemoUser2026!`.
In eine frische Installation gelangt der Datensatz über **Vorhandenen
Datenbestand öffnen**: Die Datei als `teo-autosicherung.json` in einen leeren
Ordner legen und diesen Ordner wählen. In einen bestehenden Datenbestand lässt
er sich wie die Demo-Datenbank importieren; die vorhandenen Konten bleiben
dabei erhalten.

Neu erzeugen mit `node tools/generate-test-data-2027.mjs`.
