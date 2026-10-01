// TeO im echten Browser.
//
// Der DOM-Ersatz in load-app.mjs beantwortet Fragen an die Programmlogik. Was
// er nicht kann: sagen, ob eine Regel im Stylesheet auch wirkt. Genau das
// haben die früheren Tests durch Abschreiben der Regel ersetzt - eine Prüfung,
// die nur bestätigt, dass dort steht, was dort steht.
//
// Diese Umgebung startet TeO stattdessen. Playwright ist eine
// Entwicklungsabhängigkeit; fehlt sie, überspringt sich der Test mit Ansage,
// damit `npm test` ohne `npm ci` grün bleibt.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

let shared = null;

// Die Browserdatei gehört nicht zum Paket, sie wird getrennt geholt. Fehlt
// sie oder passt sie nicht zur installierten Playwright-Fassung, gilt dasselbe
// wie bei fehlendem Playwright: Der Test überspringt sich mit Ansage, statt den
// ganzen Lauf scheitern zu lassen. Die Meldung nennt den Grund und den Befehl.
async function startBrowser(playwright, t) {
  try {
    return await playwright.chromium.launch();
  } catch (error) {
    t.skip(
      "Playwright findet keinen Browser - „npx playwright install chromium“ " +
        `holt ihn nach (${String(error.message).split("\n")[0]})`,
    );
    return null;
  }
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

function startServer() {
  const server = http.createServer((request, response) => {
    const requested = decodeURIComponent(request.url.split("?")[0]);
    const file = path.join(projectRoot, requested === "/" ? "index.html" : requested);
    if (
      !file.startsWith(projectRoot) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    ) {
      response.writeHead(404);
      response.end("nicht gefunden");
      return;
    }
    response.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

// Öffnet TeO und liefert eine Handhabe darauf - oder null, wenn Playwright
// fehlt; dann ist der Test bereits als übersprungen vermerkt.
//
// Jeder Aufruf lädt die Seite neu: Die Tests sollen sich nicht gegenseitig
// den Zustand verstellen.
// Die Demodatenbank: 60 Mitarbeiter mit Qualifikationen, Fortbildungen,
// Sitzungen und Geräteeinweisungen. Sie wird einmal gelesen und je Aufruf
// kopiert, damit ein Test die Vorlage nicht für den nächsten verändert.
let demoBackup = null;

function loadDemoBackup() {
  if (!demoBackup) {
    demoBackup = JSON.parse(
      fs.readFileSync(
        path.join(projectRoot, "demo", "teo-demo-datenbank-60-ma-2025-2026.json"),
        "utf8",
      ),
    );
  }
  return structuredClone(demoBackup);
}

// Die Konten der Demodatenbank (siehe demo/README.md).
const DEMO_KONTEN = {
  admin: { username: "DemoAdmin", password: "DemoStart2026!" },
  user: { username: "DemoUser1", password: "DemoUser2026!" },
};

// Öffnet TeO und liefert eine Handhabe darauf - oder null, wenn Playwright
// fehlt; dann ist der Test bereits als übersprungen vermerkt.
//
// Jeder Aufruf bekommt einen eigenen Browserkontext und damit einen leeren
// Speicher: Die Tests sollen sich nicht gegenseitig den Zustand verstellen,
// und ein Datenbestand aus einem Test darf im nächsten nicht auftauchen.
//
// Optionen:
// - angemeldetAls: Rolle, mit der die Anmeldesperre gelöst wird
// - mitDemodaten: lädt die Demodatenbank; `true` oder eine Funktion, die den
//   Bestand vor dem Laden anpasst (etwa Urlaubseinträge ergänzt)
// - urlaubsansicht: gemerkter Zeitraum der Urlaubsplanung, z. B.
//   { year: 2026, month: 7, sort: "qualification" }
// - neustart: startet TeO im Kontext des vorigen Aufrufs neu, mit dessen
//   Speicher - für die Frage, ob etwas den nächsten Start überlebt
// - anmeldenAls: "admin" oder "user" - meldet sich wirklich an, mit einem
//   Konto der Demodatenbank, und durchläuft den Startabgleich mit derselben
//   Datei. Anders als angemeldetAls, das nur die Sperre löst und die Rolle an
//   der Oberfläche setzt, ist danach intern jemand angemeldet: Was Rechte
//   prüft, verhält sich wie im Betrieb. Lädt die Demodaten von selbst.
export async function openTeO(
  t,
  {
    angemeldetAls = "",
    mitDemodaten = false,
    urlaubsansicht = null,
    neustart = false,
    anmeldenAls = "",
  } = {},
) {
  if (anmeldenAls && !DEMO_KONTEN[anmeldenAls]) {
    throw new Error(`Unbekannte Rolle für anmeldenAls: ${anmeldenAls}`);
  }
  const playwright = await loadPlaywright();
  if (!playwright) {
    t.skip("Playwright ist nicht installiert - „npm ci“ holt es nach");
    return null;
  }

  if (!shared) {
    // Erst den Browser starten, dann den Server: Scheitert der Start - etwa
    // weil die Browserdatei zur installierten Playwright-Fassung fehlt -,
    // bliebe sonst ein lauschender Server offen. Der Testlauf endete dann nie,
    // weil node auf den offenen Anschluss wartet, und würde abgewürgt statt
    // einen Befund zu melden.
    const browser = await startBrowser(playwright, t);
    if (!browser) return null;
    const { server, port } = await startServer();
    shared = { server, port, browser, context: null, page: null, problems: [] };
  }

  if (neustart && shared.context) {
    await shared.page?.close().catch(() => {});
  } else {
    await shared.context?.close().catch(() => {});
    shared.context = await shared.browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
  }
  const page = await shared.context.newPage();
  shared.page = page;
  shared.problems.length = 0;
  page.on("pageerror", (error) => shared.problems.push(`Skriptfehler: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") shared.problems.push(`Konsole: ${message.text()}`);
  });

  const { port } = shared;
  const sicherung = mitDemodaten || anmeldenAls ? loadDemoBackup() : null;
  const bestand = sicherung ? sicherung.data : null;
  if (bestand) {
    if (typeof mitDemodaten === "function") mitDemodaten(bestand);
    // Die Benutzerkonten der Demo verlangen beim ersten Anmelden ein neues
    // Passwort. Für den Test ist das bereits geschehen.
    bestand.users.forEach((user) => {
      user.mustChangePassword = false;
    });
  }
  if (bestand || urlaubsansicht) {
    // Vor dem ersten Laden ablegen: TeO übernimmt einen Bestand unter dem
    // früheren localStorage-Schlüssel beim Start in seinen Speicher - der
    // Weg, auf dem auch ältere Installationen ihre Daten mitbringen.
    await page.addInitScript(
      ([daten, ansicht]) => {
        if (sessionStorage.getItem("teo-test-seeded")) return;
        sessionStorage.setItem("teo-test-seeded", "1");
        if (daten) {
          localStorage.setItem("intensivteam-personalverwaltung-v1", JSON.stringify(daten));
        }
        if (ansicht) {
          localStorage.setItem("intensivteam-vacation-view-v1", JSON.stringify(ansicht));
        }
      },
      [bestand, urlaubsansicht],
    );
  }
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.TeOProjectMeta), null, { timeout: 15000 });
  if (bestand) {
    await page.waitForFunction(
      () => Number(document.querySelector("#navEmployeeCount")?.textContent) > 0,
      null,
      { timeout: 15000 },
    );
  }
  if (anmeldenAls) {
    const konto = DEMO_KONTEN[anmeldenAls];
    await page.waitForSelector("#loginDialog[open]");
    await page.fill("#loginUsername", konto.username);
    await page.fill("#loginPassword", konto.password);
    await page.evaluate(() => document.querySelector("#loginForm").requestSubmit());
    // Der Startabgleich verlangt die gemeinsame Sicherungsdatei. Es ist
    // dieselbe Sicherung, mit der TeO gestartet wurde - auch ein angepasster
    // Bestand bleibt dabei erhalten.
    await page.waitForSelector("#startupBackupDialog[open]");
    await page.setInputFiles("#startupBackupFile", {
      name: "teo-autosicherung.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(sicherung)),
    });
    await page.waitForFunction(
      () =>
        !document.body.classList.contains("is-auth-locked") &&
        !document.querySelector("dialog[open]"),
      null,
      { timeout: 15000 },
    );
  }

  // Ohne dies misst ein Test unmittelbar nach einer Änderung den Startwert
  // eines laufenden Übergangs statt des Ergebnisses - beim Farbschema etwa
  // die alte Fläche. Geprüft wird hier, was am Ende dasteht, nicht wie es
  // dorthin kommt.
  await page.addStyleTag({
    content:
      "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });

  // Die Anmeldemaske liegt über allem. Für die Frage, ob eine Regel wirkt,
  // genügt es, die Sperre zu lösen und die Rolle zu setzen - der Anmeldeweg
  // selbst ist anderswo geprüft.
  if (angemeldetAls) {
    await page.evaluate((rolle) => {
      document.body.classList.remove("is-auth-locked");
      document.body.dataset.userRole = rolle;
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    }, angemeldetAls);
  }

  return {
    page,
    problems: shared.problems,

    evaluate: (fn, arg) => page.evaluate(fn, arg),

    // Wechselt die Ansicht über die Schaltfläche der Seitenleiste, also auf
    // demselben Weg wie eine Bedienung von Hand.
    async zeigeAnsicht(view) {
      await page.evaluate((name) => {
        document.querySelector(`[data-view="${name}"]`).click();
      }, view);
    },

    async setzeThema(key) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, key);
    },

    // Die Farbe, die an dieser Stelle wirklich auf dem Bildschirm steht.
    //
    // Für die Frage „liegt das obenauf?“ taugt elementFromPoint nicht: Eine
    // Meldungsschicht ist bewusst durchlässig für Klicks und taucht in der
    // Trefferliste gar nicht auf. Das Bild lügt dagegen nicht - es wird
    // aufgenommen, im Browser auf eine Leinwand gelegt und ausgelesen.
    async farbeAn(selector) {
      const feld = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return null;
        const rechteck = element.getBoundingClientRect();
        return {
          x: Math.round(rechteck.left + rechteck.width / 2),
          y: Math.round(rechteck.top + rechteck.height / 2),
        };
      }, selector);
      if (!feld) return null;
      const bild = await page.screenshot({
        clip: { x: feld.x - 1, y: feld.y - 1, width: 3, height: 3 },
      });
      return page.evaluate(async (base64) => {
        const antwort = await fetch(`data:image/png;base64,${base64}`);
        const bitmap = await createImageBitmap(await antwort.blob());
        const leinwand = new OffscreenCanvas(bitmap.width, bitmap.height);
        const stift = leinwand.getContext("2d");
        stift.drawImage(bitmap, 0, 0);
        const [r, g, b] = stift.getImageData(1, 1, 1, 1).data;
        return [r, g, b];
      }, bild.toString("base64"));
    },

    // Errechneter Stilwert eines Elements - die Frage, die ein Stylesheet
    // wirklich beantwortet.
    stil(selector, property) {
      return page.evaluate(
        ([sel, prop]) => {
          const element = document.querySelector(sel);
          if (!element) return null;
          return getComputedStyle(element).getPropertyValue(prop).trim();
        },
        [selector, property],
      );
    },
  };
}

export async function closeTeO() {
  if (!shared) return;
  const { browser, server } = shared;
  // Zuerst vergessen, dann schließen: Bricht das Schließen ab, soll kein
  // halber Stand liegen bleiben, den der nächste Aufruf weiterverwendet.
  shared = null;
  await browser.close().catch(() => {});
  server.close();
}
