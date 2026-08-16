import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Abschluss eintragen ist die primäre und letzte Aktion der Pflichtfortbildungen", async () => {
  const viewHtml = await fs.readFile(
    path.join(projectRoot, "src/html/20-calendar-training-meeting-views.html"),
    "utf8",
  );
  const trainingButton = viewHtml.match(
    /<button class="button ([^"]+)" type="button" data-open-training>/,
  );
  const completionButton = viewHtml.match(
    /<button class="button ([^"]+)" type="button" data-open-completion>/,
  );

  assert.equal(trainingButton?.[1], "button-secondary");
  assert.equal(completionButton?.[1], "button-primary");
  assert.ok(
    viewHtml.indexOf("data-open-training") < viewHtml.indexOf("data-open-completion"),
    "Fortbildung anlegen muss vor Abschluss eintragen stehen.",
  );
});
