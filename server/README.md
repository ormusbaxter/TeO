# TeO MariaDB-Backend

Der Browser verbindet sich nicht direkt mit MariaDB. Dieser Node.js-Dienst stellt eine
authentifizierte HTTP-API bereit, speichert den TeO-Datenbestand in MariaDB und liefert
gleichzeitig die statischen App-Dateien aus.

## Datenbankmodell

Seit Datenbankschema 4 wird der fachliche Datenbestand relational nach
Fachbereichen getrennt gespeichert. Jeder fachliche Datensatz besitzt eine
eigene Tabellenzeile. Häufig benötigte Felder liegen zusätzlich als
indexierbare Spalten vor; das vollständige Objekt bleibt als JSON-Payload
erhalten, damit Sicherungsformat und Browser-API kompatibel bleiben.

Wichtige Tabellen:

| Tabelle | Inhalt |
| --- | --- |
| `teo_meta` | Revision, Datenformat, Einstellungen und Kataloge |
| `teo_employees` | Mitarbeiter |
| `teo_trainings`, `teo_completions` | Fortbildungskatalog und Nachweise |
| `teo_meetings`, `teo_meeting_attendances` | Teamsitzungen und Teilnahmen |
| `teo_appointments` | Termine |
| `teo_memos` | Memos und ToDos |
| `teo_devices`, `teo_device_instructions` | Geräte und Einweisungen |
| `teo_vacation_entitlements`, `teo_vacation_days` | Urlaubsansprüche und Abwesenheiten |
| `teo_users` | Benutzerkonten und geschützte Passwortdaten |
| `teo_client_audit_entries` | fachliches Änderungsprotokoll |
| `teo_sessions`, `teo_audit_log` | Serversitzungen und Serverprotokoll |

Beim Speichern vergleicht der Server die einzelnen Datensätze und schreibt nur
neue, geänderte oder gelöschte Zeilen. Die globale Revision schützt weiterhin
vor unbemerkten konkurrierenden Änderungen.

### Normalisierte Beziehungen und Fremdschlüssel

Seit Datenbankschema 6 werden zusätzlich folgende Strukturen geführt:

| Tabelle | Inhalt |
| --- | --- |
| `teo_qualification_catalog` | Qualifikationskatalog |
| `teo_employee_qualifications` | aktuelle Qualifikationszuordnungen |
| `teo_employee_qualification_history` | zeitlicher Verlauf von Qualifikations- und Rollenzuordnungen |
| `teo_device_instruction_participants` | Einweisungsteilnehmer |
| `teo_meeting_expected_employees` | erwartete Teilnehmer einer Teamsitzung |

Fremdschlüssel sichern die Beziehungen zwischen Mitarbeitern, Fortbildungen,
Teamsitzungen, Abwesenheiten, Geräten, Einweisungsteilnehmern und
Benutzerkonten ab. Abhängige Fachdaten werden entsprechend der bestehenden
Löschlogik kaskadiert entfernt. Optionale historische Verweise wie die
einweisende Person oder die Mitarbeiterzuordnung eines Benutzerkontos werden
auf `NULL` gesetzt.

Qualifikationen, Einweisungsteilnehmer und Sollteilnehmer von Teamsitzungen
werden aus den normalisierten Tabellen gelesen. Die JSON-Payloads bleiben
vorerst als Kompatibilitätsschicht für Browser-API und Sicherungsformat
erhalten.

## Voraussetzungen

- Node.js 20 oder neuer
- MariaDB mit einer leeren Datenbank
- ein ausschließlich für TeO verwendetes Datenbankkonto
- HTTPS beziehungsweise ein vorgeschalteter Reverse Proxy für den produktiven Betrieb

## Einrichtung

1. In MariaDB `schema.sql` als administrativer Datenbankbenutzer ausführen. Das dortige
   Beispielpasswort vorher ändern.
2. `.env.example` als `.env` kopieren und insbesondere `DB_HOST`, `DB_NAME`, `DB_USER`
   und `DB_PASSWORD` eintragen.
3. Im Ordner `server` die Abhängigkeiten installieren:

   ```text
   npm ci
   ```

4. Den Dienst starten:

   ```text
   npm start
   ```

5. TeO anschließend bevorzugt über `http://SERVERNAME:3000` aufrufen. Unter
   **Einstellungen → Datenbank-Backend** dieselbe Serveradresse eintragen und als
   Administrator „MariaDB aktivieren“ wählen.

Ist die Datenbank noch leer, überträgt TeO den aktuellen lokalen Datenbestand. Ist sie
bereits eingerichtet, wird nach erfolgreicher Anmeldung der vorhandene Serverdatenbestand
geladen.

Bei einer Aktualisierung eines bestehenden Backends `schema.sql` einmal erneut als
administrativer MariaDB-Benutzer ausführen. Dadurch erhält das eingeschränkte
App-Konto auch das für abgelaufene Sitzungen notwendige `DELETE`-Recht. Die
eigentlichen Tabellenänderungen führt der Server danach versioniert selbst aus.

### Migration aus dem bisherigen JSON-Gesamtbestand

Beim ersten Serverstart mit Datenbankschema 4:

1. werden die relationalen Fachtabellen angelegt,
2. wird ein vorhandener Datensatz aus `teo_state` vollständig und innerhalb
   einer Transaktion übertragen,
3. werden Revision und Reihenfolge beibehalten,
4. wird die erfolgreiche Migration in `teo_schema_migrations` protokolliert.

`teo_state` bleibt danach unverändert als technische Rückfallebene erhalten,
wird aber nicht mehr als Primärspeicher verwendet oder fortgeschrieben. Ein
Downgrade auf eine ältere Serverversion ist deshalb nach neuen Änderungen
nicht zulässig.

Falls zwischen Migration und Neustart noch ein alter Serverprozess eine höhere
Legacy-Revision gespeichert hat, erkennt der aktuelle Server dies beim Start
und übernimmt diese Revision einmalig erneut. Danach darf ausschließlich der
aktuelle Serverprozess betrieben werden.

### Migration der Beziehungen

Die Datenbankschemata 5 bis 7 werden beim Serverstart automatisch angewendet:

1. vorhandene Qualifikationen, Einweisungsteilnehmer und Sollteilnehmer werden
   aus den bisherigen Payloads in Beziehungstabellen übertragen,
2. Benutzerkonten werden anhand des eindeutigen Benutzernamens optional einem
   Mitarbeiter zugeordnet,
3. der aktuelle Qualifikationsstand wird als Ausgangspunkt der
   Qualifikationshistorie übernommen,
4. danach werden die Fremdschlüssel aktiviert und
5. fehlgeschlagene Loginversuche werden in einer eigenen Tabelle dauerhaft
   und serverübergreifend erfasst.

Vor dem ersten Start dieser Version sollte eine vollständige MariaDB-Sicherung
erstellt werden. Ein Downgrade auf einen Server vor Datenbankschema 6 ist
anschließend nicht zulässig.

## Umgebungsvariablen

| Variable | Bedeutung | Standard |
| --- | --- | --- |
| `TEO_HOST` | Bind-Adresse des HTTP-Dienstes | `0.0.0.0` |
| `TEO_PORT` | HTTP-Port | `3000` |
| `TEO_SESSION_HOURS` | Laufzeit inaktiver Serversitzungen | `12` |
| `TEO_CORS_ORIGINS` | Kommagetrennte zusätzlich erlaubte Ursprünge | leer |
| `TEO_TRUST_PROXY` | genau einen vorgeschalteten Reverse Proxy vertrauen | `false` |
| `TEO_HTTPS_ONLY` | unverschlüsselte Anfragen mit HTTP 426 ablehnen und HSTS senden; erst hinter vollständig eingerichtetem HTTPS aktivieren | `false` |
| `TEO_BOOTSTRAP_TOKEN` | mindestens 32 Zeichen langer Einrichtungsschlüssel für die erstmalige entfernte Initialisierung | leer |
| `DB_HOST` | MariaDB-Server | erforderlich |
| `DB_PORT` | MariaDB-Port | `3306` |
| `DB_NAME` | Datenbankname | erforderlich |
| `DB_USER` | eingeschränktes App-Konto | erforderlich |
| `DB_PASSWORD` | Passwort des App-Kontos | erforderlich |
| `DB_CONNECTION_LIMIT` | maximale Pool-Verbindungen | `5` |
| `DB_SSL` | TLS-Verbindung zu MariaDB erzwingen | `false` |

## Sicherheitskonzept

- MariaDB-Zugangsdaten liegen ausschließlich in der serverseitigen `.env`.
- Die Anmeldung erfolgt serverseitig mit den bestehenden PBKDF2-Passworthashes.
- API-Sitzungen verwenden zufällige Bearer-Token. Nur deren SHA-256-Hashes
  werden in MariaDB gespeichert; die Sitzungen überleben Serverneustarts und
  laufen automatisch ab.
- Fehlgeschlagene Anmeldungen werden pro IP dauerhaft in MariaDB begrenzt; die Begrenzung gilt dadurch auch nach Neustarts und über mehrere Serverinstanzen hinweg.
- Die Ersteinrichtung ist ohne Einrichtungsschlüssel ausschließlich über die Loopback-Schnittstelle möglich. Für eine entfernte Einrichtung muss `TEO_BOOTSTRAP_TOKEN` gesetzt und einmalig in der App eingegeben werden.
- Bei `TEO_HTTPS_ONLY=true` lehnt der Server jede vom Proxy als unverschlüsselt gemeldete Anfrage ab. Hinter einem Reverse Proxy muss zusätzlich `TEO_TRUST_PROXY=true` gesetzt sein und der Proxy `X-Forwarded-Proto` korrekt setzen.
- Normale Benutzer dürfen serverseitig nur Fortbildungsnachweise,
  Teamsitzungsteilnahmen, ihr eigenes Passwort und das Farbthema verändern.
- Revisionsnummern verhindern, dass gleichzeitige Änderungen unbemerkt überschrieben
  werden.
- Fachobjekte werden in getrennten Tabellen gespeichert; nur tatsächlich
  geänderte Zeilen werden aktualisiert.
- Passworthashes werden keinem Browser ausgeliefert und beim Speichern
  serverseitig geschützt wieder ergänzt.
- Ein unveränderbares Serverprotokoll in `teo_audit_log` dokumentiert
  Initialisierung und Datenrevisionen zusätzlich zum fachlichen App-Protokoll.
- Versionierte Migrationen in `src/migrations.js` aktualisieren das
  Datenbankschema beim Serverstart und werden in `teo_schema_migrations`
  protokolliert.

Für einen produktiven Betrieb mit personenbezogenen Daten sind zusätzlich HTTPS,
geregelte MariaDB-Backups, Betriebssystemhärtung, Zugriffsprotokollierung und die
Abstimmung mit Datenschutz und IT-Sicherheit erforderlich.
