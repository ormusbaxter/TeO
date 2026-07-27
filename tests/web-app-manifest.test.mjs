import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("Das Web-App-Manifest enthält normale und maskierbare TeO-Icons", async () => {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(projectRoot, "manifest.webmanifest"),
      "utf8",
    ),
  );

  assert.equal(manifest.name, "TeO – Team & Employee Organizer");
  assert.equal(manifest.short_name, "TeO");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.deepEqual(
    manifest.icons.map((icon) => [icon.sizes, icon.purpose]),
    [
      ["192x192", "any"],
      ["512x512", "any"],
      ["192x192", "maskable"],
      ["512x512", "maskable"],
    ],
  );

  for (const icon of manifest.icons) {
    const iconPath = path.join(
      projectRoot,
      icon.src.replace(/^\//, ""),
    );
    const png = await fs.readFile(iconPath);
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    const [expectedWidth, expectedHeight] = icon.sizes.split("x").map(Number);
    assert.equal(png.readUInt32BE(16), expectedWidth);
    assert.equal(png.readUInt32BE(20), expectedHeight);
  }
});

test("HTML und TeO-Server liefern Manifest und Icons aus", async () => {
  const [html, serverSource] = await Promise.all([
    fs.readFile(
      path.join(projectRoot, "src", "html", "00-shell-dashboard.html"),
      "utf8",
    ),
    fs.readFile(
      path.join(projectRoot, "server", "src", "server.js"),
      "utf8",
    ),
  ]);

  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /teo-favicon\.svg/);
  assert.match(serverSource, /app\.use\("\/assets", express\.static/);
  assert.match(serverSource, /"manifest\.webmanifest"/);
});
