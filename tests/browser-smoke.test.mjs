import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Alle übrigen Tests laufen ohne Browser. Sie prüfen damit alles außer der
// Frage, ob die Oberfläche im Browser überhaupt hochkommt - und genau dort
// fällt eine kaputte Vorlage, ein doppelter Bezeichner oder eine verletzte
// CSP auf. Dieser eine Test füllt die Lücke.
//
// Playwright ist eine Entwicklungsabhängigkeit und steht nicht überall
// bereit. Fehlt sie, überspringt sich der Test mit klarer Ansage, statt
// `npm test` an einem Arbeitsplatz ohne `npm ci` scheitern zu lassen.
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function startServer() {
  const server = http.createServer((request, response) => {
    const requested = decodeURIComponent(request.url.split("?")[0]);
    const file = path.join(projectRoot, requested === "/" ? "index.html" : requested);
    if (!file.startsWith(projectRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
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

test("TeO startet im Browser und baut die Hilfe erst bei Bedarf auf", async (t) => {
  const playwright = await loadPlaywright();
  if (!playwright) {
    t.skip("Playwright ist nicht installiert - „npm ci“ holt es nach");
    return;
  }

  const { server, port } = await startServer();
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`Skriptfehler: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`Konsole: ${message.text()}`);
  });

  try {
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "load" });
    await page.waitForFunction(() => Boolean(window.TeOProjectMeta), null, { timeout: 10000 });

    // Das Handbuch wartet in seiner Vorlage.
    const beimStart = await page.evaluate(() => ({
      imDokument: document.querySelectorAll("[data-help-section]").length,
      inDerVorlage: document.querySelector("#helpContentTemplate").content
        .querySelectorAll("[data-help-section]").length,
      behaelterLeer: document.querySelector("#helpContentHost").childElementCount === 0,
    }));
    assert.equal(beimStart.imDokument, 0, "Beim Start steht kein Hilfethema im Dokument");
    assert.ok(beimStart.inDerVorlage > 10, "Die Vorlage trägt das Handbuch");
    assert.equal(beimStart.behaelterLeer, true);

    // Beim Wechsel in die Hilfe wird es eingehängt, samt Inhaltsverzeichnis.
    await page.evaluate(() => document.querySelector('[data-view="help"]').click());
    const nachWechsel = await page.evaluate(() => ({
      imDokument: document.querySelectorAll("[data-help-section]").length,
      verzeichnis: document.querySelectorAll("[data-help-target]").length,
      status: document.querySelector("#helpSearchStatus").textContent,
    }));
    assert.equal(nachWechsel.imDokument, beimStart.inDerVorlage);
    assert.equal(nachWechsel.verzeichnis, beimStart.inDerVorlage);
    assert.match(nachWechsel.status, /^\d+ Hilfethemen$/);

    // Die Suche grenzt ein und blendet die passenden Einträge des
    // Inhaltsverzeichnisses mit aus.
    const gefunden = await page.evaluate(() => {
      const field = document.querySelector("#helpSearch");
      field.value = "Urlaub";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      return {
        sichtbar: [...document.querySelectorAll("[data-help-section]")].filter((s) => !s.hidden).length,
        navSichtbar: [...document.querySelectorAll("[data-help-nav-target]")].filter((b) => !b.hidden).length,
        status: document.querySelector("#helpSearchStatus").textContent,
      };
    });
    assert.ok(gefunden.sichtbar > 0, "„Urlaub“ findet Themen");
    assert.ok(gefunden.sichtbar < nachWechsel.imDokument, "und blendet die übrigen aus");
    assert.equal(gefunden.navSichtbar, gefunden.sichtbar);
    assert.match(gefunden.status, /^\d+ von \d+ Themen gefunden$/);

    // Die Adminsperre hängt am Stylesheet, nicht an einer Schleife.
    const sperre = await page.evaluate(() => {
      const probe = document.querySelector("[data-admin-only]");
      const sichtbar = () => getComputedStyle(probe).display !== "none";
      delete document.body.dataset.userRole;
      const ohneRolle = sichtbar();
      document.body.dataset.userRole = "user";
      const alsUser = sichtbar();
      document.body.dataset.userRole = "admin";
      return { ohneRolle, alsUser, alsAdmin: sichtbar() };
    });
    assert.equal(sperre.ohneRolle, false, "Vor der Anmeldung bleibt die Verwaltung verborgen");
    assert.equal(sperre.alsUser, false);
    assert.equal(sperre.alsAdmin, true);

    assert.deepEqual(problems, [], `Der Start meldet Fehler:\n${problems.join("\n")}`);
  } finally {
    await browser.close();
    server.close();
  }
});
