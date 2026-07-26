# TeO MariaDB-Backend

Der Browser verbindet sich nicht direkt mit MariaDB. Dieser Node.js-Dienst stellt eine
authentifizierte HTTP-API bereit, speichert den TeO-Datenbestand in MariaDB und liefert
gleichzeitig die statischen App-Dateien aus.

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
   npm install
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

## Umgebungsvariablen

| Variable | Bedeutung | Standard |
| --- | --- | --- |
| `TEO_HOST` | Bind-Adresse des HTTP-Dienstes | `0.0.0.0` |
| `TEO_PORT` | HTTP-Port | `3000` |
| `TEO_SESSION_HOURS` | Laufzeit inaktiver Serversitzungen | `12` |
| `TEO_CORS_ORIGINS` | Kommagetrennte zusätzlich erlaubte Ursprünge; `*` erlaubt alle | leer |
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
- API-Sitzungen verwenden zufällige Bearer-Token und laufen automatisch ab.
- Fehlgeschlagene Anmeldungen werden pro IP begrenzt.
- Normale Benutzer dürfen serverseitig nur Fortbildungsnachweise,
  Teamsitzungsteilnahmen, ihr eigenes Passwort und das Farbthema verändern.
- Revisionsnummern verhindern, dass gleichzeitige Änderungen unbemerkt überschrieben
  werden.
- Passworthashes anderer Konten werden normalen Benutzern nicht ausgeliefert.

Für einen produktiven Betrieb mit personenbezogenen Daten sind zusätzlich HTTPS,
geregelte MariaDB-Backups, Betriebssystemhärtung, Zugriffsprotokollierung und die
Abstimmung mit Datenschutz und IT-Sicherheit erforderlich.
