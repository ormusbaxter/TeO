import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PROJECT_META } from "../src/meta/project-meta.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readmeMarkdown = await fs.readFile(
  path.join(projectRoot, "README.md"),
  "utf8",
);
const readmeHelp = renderMarkdownHelp(
  readmeMarkdown.replace(
    "<!-- CHANGELOG_ENTRIES -->",
    renderChangelogMarkdown(projectRoot),
  ),
);

const generatedProjectMeta = `(function exposeTeoProjectMeta(global) {
  "use strict";

  global.TeOProjectMeta = Object.freeze(${JSON.stringify(PROJECT_META, null, 2)});
})(window);
`;

await fs.writeFile(
  path.join(projectRoot, "project-meta.js"),
  generatedProjectMeta,
  "utf8",
);

const stateSchemaSource = await fs.readFile(
  path.join(projectRoot, "src", "shared", "state-schema.mjs"),
  "utf8",
);
const browserStateSchema = `(function exposeTeoStateSchema(global) {
  "use strict";
${stateSchemaSource.replace(/^export /gm, "")}
  global.TeOStateSchema = Object.freeze({ validateStateShape });
})(window);
`;
await fs.writeFile(
  path.join(projectRoot, "state-schema.js"),
  browserStateSchema,
  "utf8",
);

const manifests = [
  ["src/app", "app.js", "/* Generiert aus src/app/*.js – Änderungen dort vornehmen. */\n"],
  [
    "src/styles",
    "styles.css",
    "/* Generiert aus src/styles/*.css – Änderungen dort vornehmen. */\n",
  ],
  [
    "src/html",
    "index.html",
    "<!-- Generiert aus src/html/*.html – Änderungen dort vornehmen. -->\n",
  ],
];

for (const [source, output, banner] of manifests) {
  const sourceDirectory = path.join(projectRoot, source);
  try {
    const files = (await fs.readdir(sourceDirectory))
      .filter((fileName) => /\.(?:js|css|html)$/.test(fileName))
      .sort();
    if (!files.length) continue;
    const content = await Promise.all(
      files.map((fileName) =>
        fs.readFile(path.join(sourceDirectory, fileName), "utf8"),
      ),
    );
    const generatedContent =
      output === "index.html"
        ? content.join("\n").replace(
            "<!-- README_HELP_CONTENT -->",
            readmeHelp,
          )
        : content.join("\n");
    const outputs = output === "index.html" ? ["index.html", "app.html"] : [output];
    await Promise.all(
      outputs.map((fileName) =>
        fs.writeFile(
          path.join(projectRoot, fileName),
          `${banner}${generatedContent}`,
          "utf8",
        ),
      ),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function renderMarkdownHelp(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html = [];
  const headings = [];
  let paragraph = [];
  let listItems = [];
  let currentListItem = "";
  let listType = "ul";
  let codeLines = [];
  let inCodeBlock = false;
  let sectionOpen = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushListItem = () => {
    if (!currentListItem) return;
    listItems.push(currentListItem);
    currentListItem = "";
  };
  const flushList = () => {
    flushListItem();
    if (!listItems.length) return;
    html.push(
      `<${listType}>${listItems
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("")}</${listType}>`,
    );
    listItems = [];
    listType = "ul";
  };
  const flushCode = () => {
    html.push(`<pre><code>${escapeBuildHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const label = heading[2].trim();
      const id = uniqueHelpHeadingId(label, headings);
      headings.push({ level, label, id });
      if (level === 2) {
        if (sectionOpen) html.push("</section>");
        html.push(
          `<section class="help-section" data-help-section data-help-heading="${id}">`,
        );
        sectionOpen = true;
      }
      html.push(
        `<h${level} id="${id}">${renderInlineMarkdown(label)}</h${level}>`,
      );
      continue;
    }

    const unorderedListItem = line.match(/^\s*-\s+(.+)$/);
    const orderedListItem = line.match(/^\s*\d+\.\s+(.+)$/);
    const listItem = unorderedListItem || orderedListItem;
    if (listItem) {
      flushParagraph();
      const nextListType = orderedListItem ? "ol" : "ul";
      if (
        (currentListItem || listItems.length) &&
        listType !== nextListType
      ) {
        flushList();
      }
      listType = nextListType;
      flushListItem();
      currentListItem = listItem[1].trim();
      continue;
    }
    if (currentListItem && /^\s{2,}\S/.test(line)) {
      currentListItem += ` ${line.trim()}`;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (inCodeBlock) flushCode();
  flushParagraph();
  flushList();
  if (sectionOpen) html.push("</section>");

  const tableOfContents = headings
    .filter((heading) => heading.level === 2)
    .map(
      (heading) =>
        `<button type="button" data-help-target="${heading.id}" data-help-nav-target="${heading.id}">${escapeBuildHtml(
          heading.label,
        )}</button>`,
    )
    .join("");

  return `<div class="help-layout">
            <nav class="panel help-toc" aria-label="Inhaltsverzeichnis der Hilfe">
              <p class="eyebrow">Inhalt</p>
              ${tableOfContents}
            </nav>
            <article class="panel help-article">
              ${html.join("\n")}
            </article>
          </div>`;
}

function renderChangelogMarkdown(root) {
  try {
    const output = execFileSync(
      "git",
      ["log", "--date=format:%d.%m.%Y", "--pretty=format:%h%x1f%ad%x1f%s"],
      { cwd: root, encoding: "utf8" },
    );
    const entries = output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, date, subject] = line.split("\x1f");
        return `- **${date}** \`${hash}\` ${subject}`;
      });
    if (!entries.length) throw new Error("keine Commits gefunden");
    return entries.join("\n");
  } catch {
    return "Die Änderungshistorie ist in dieser Auslieferung nicht verfügbar, da kein Git-Repository vorliegt.";
  }
}

function renderInlineMarkdown(value) {
  let result = escapeBuildHtml(value);
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  return result.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function uniqueHelpHeadingId(label, headings) {
  const base =
    label
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "abschnitt";
  let id = `hilfe-${base}`;
  let suffix = 2;
  while (headings.some((heading) => heading.id === id)) {
    id = `hilfe-${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function escapeBuildHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
