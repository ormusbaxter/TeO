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
export async function openTeO(t, { angemeldetAls = "" } = {}) {
  const playwright = await loadPlaywright();
  if (!playwright) {
    t.skip("Playwright ist nicht installiert - „npm ci“ holt es nach");
    return null;
  }

  if (!shared) {
    const { server, port } = await startServer();
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    shared = { server, port, browser, page, problems: [] };
    page.on("pageerror", (error) => shared.problems.push(`Skriptfehler: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") shared.problems.push(`Konsole: ${message.text()}`);
    });
  }

  const { page, port } = shared;
  shared.problems.length = 0;
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.TeOProjectMeta), null, { timeout: 15000 });

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
  await shared.browser.close();
  shared.server.close();
  shared = null;
}
