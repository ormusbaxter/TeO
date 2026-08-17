import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadAppFunctions } from "./helpers/load-app.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const read = (relativePath) =>
  fs.readFile(path.join(projectRoot, relativePath), "utf8");

test("HTML-Escaping neutralisiert Text und Attributausbrüche", async () => {
  const { escapeHtml } = await loadAppFunctions(["escapeHtml"]);
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('xss')">`),
    "&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt;",
  );
});

test("die Server-CSP begrenzt Skripte, Verbindungen, Formulare und Frames", async () => {
  const source = await read("server/src/server.js");
  assert.match(source, /script-src 'self'/);
  // style-Attribute sind vollständig verboten: Dynamische CSS-Werte gehen
  // über dynamicStyle() und werden nach dem Einfügen per setProperty gesetzt.
  assert.match(source, /style-src 'self'; style-src-attr 'none'/);
  assert.doesNotMatch(source, /style-src-attr 'unsafe-inline'/);
  assert.match(source, /connect-src 'self';/);
  assert.doesNotMatch(source, /connect-src 'self' http: https:/);
  assert.match(source, /form-action 'self'/);
  assert.match(source, /frame-ancestors 'none'/);
  assert.match(source, /object-src 'none'/);
});

test("entfernte Ersteinrichtung ist durch einen separaten Schlüssel geschützt", async () => {
  const [serverSource, clientSource] = await Promise.all([
    read("server/src/server.js"),
    read("backend-client.js"),
  ]);
  assert.match(serverSource, /requireBootstrapAuthorization/);
  assert.match(serverSource, /isLoopbackRequest/);
  assert.match(serverSource, /TEO_BOOTSTRAP_TOKEN/);
  assert.match(clientSource, /X-TeO-Bootstrap-Token/);
});

test("interne Serverfehler werden nicht an Clients ausgegeben", async () => {
  const source = await read("server/src/server.js");
  assert.match(source, /status >= 500 \? "server_error"/);
  assert.match(
    source,
    /message: status >= 500\s*\? "Der TeO-Server konnte die Anfrage nicht verarbeiten\."\s*: error\?\.message/,
  );
});

test("Login-Drosselung wird in MariaDB persistiert", async () => {
  const [serverSource, migrationSource] = await Promise.all([
    read("server/src/server.js"),
    read("server/src/migrations.js"),
  ]);
  assert.match(serverSource, /INSERT INTO teo_login_attempts/);
  assert.doesNotMatch(serverSource, /const loginAttempts = new Map/);
  assert.match(migrationSource, /persistent_login_throttling/);
});

test("Die Anmeldedrosselung zählt vor der Entscheidung", async () => {
  const source = await read("server/src/server.js");
  const rateLimit = source.match(
    /async function loginRateLimit\(request, response, next\) \{[\s\S]*?\n\}/,
  );
  assert.ok(rateLimit, "loginRateLimit wurde nicht gefunden");

  // Wird zuerst gelesen und erst beim Fehlschlag gezählt, lesen gleichzeitig
  // eintreffende Anfragen denselben Wert und kommen gemeinsam am Limit vorbei.
  assert.match(
    rateLimit[0],
    /const attempts = await registerLoginAttempt\(request\.ip\)/,
    "Der Versuch muss vor der Entscheidung gezählt werden",
  );
  assert.doesNotMatch(
    rateLimit[0],
    /SELECT attempt_count/,
    "loginRateLimit darf den Zähler nicht selbst lesen, bevor er ihn erhöht hat",
  );
  assert.match(
    source,
    /async function registerLoginAttempt\(ip\) \{[\s\S]*?INSERT INTO teo_login_attempts[\s\S]*?ON DUPLICATE KEY UPDATE/,
    "Das Hochzählen muss in einer einzigen atomaren Anweisung geschehen",
  );
});

test("Ohne Anmeldung verrät die Statusauskunft keinen Betriebszustand", async () => {
  const source = await read("server/src/server.js");
  const health = source.match(
    /app\.get\("\/api\/health"[\s\S]*?\n\}\)\);/,
  );
  assert.ok(health, "Der Statusendpunkt wurde nicht gefunden");

  const anonymousAnswer = health[0].match(
    /if \(!session\) \{[\s\S]*?\n {2}\}/,
  );
  assert.ok(anonymousAnswer, "Der anonyme Zweig wurde nicht gefunden");
  for (const leak of [
    "initialized",
    "revision",
    "databaseSchemaVersion",
    "storageModel",
  ]) {
    assert.doesNotMatch(
      anonymousAnswer[0],
      new RegExp(`\\b${leak}\\b`),
      `„${leak}“ darf ohne angemeldete Sitzung nicht ausgeliefert werden`,
    );
  }
  assert.match(
    health[0],
    /const session = await readOptionalSession\(request\)/,
    "Der Endpunkt muss die Sitzung prüfen, ohne die Anfrage abzuweisen",
  );
});
