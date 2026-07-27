# TeO Demo-Datenbank

`teo-demo-datenbank-60-ma-2025-2026.json` ist eine vollständig synthetische
Datensicherung für TeO Build 004.004 / Datenformat 24.

Enthalten sind:

- 60 fiktive Mitarbeiter mit eindeutig als Demo gekennzeichneten Kontaktdaten
- monatliche Teamsitzungen von Januar 2025 bis Juli 2026
- Pflichtfortbildungen und plausible Abschlüsse für 2025 und 2026
- der unveränderte Gerätekatalog der Anwendung
- plausible Geräteeinweisungen für 2025 und Januar bis Juli 2026

Die Datei kann unter **Einstellungen → Gesamten Datenbestand sichern →
Sicherung importieren** geladen werden. Der Import ersetzt den gesamten
aktuellen Datenbestand. Daher vorher bei Bedarf eine Sicherung exportieren.

Demo-Anmeldung:

- Administrator: `DemoAdmin` / `DemoStart2026!`
- Benutzer: `DemoUser1` oder `DemoUser2` / `DemoUser2026!`

Diese Konten gelten ausschließlich für die synthetische Demo-Sicherung und
dürfen nicht für einen Produktivdatenbestand übernommen werden.

Die Datei lässt sich mit `tools/generate-demo-backup.mjs` reproduzierbar neu
erzeugen. E-Mail-Adressen verwenden ausschließlich die reservierte Domain
`example.invalid`; Telefonnummern liegen im erkennbaren Demo-Nummernblock
`+49 000`.
