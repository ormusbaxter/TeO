// Regelwerk für TeO.
//
// Der Browserteil ist eine einzige IIFE aus verketteten Dateien: Alles teilt
// sich einen Gültigkeitsbereich, und genau dort fallen ungenutzte Variablen,
// versehentliche Globals und tote Zweige nicht von selbst auf. Geprüft werden
// deshalb die Quellen in src/, die Werkzeuge, die Tests und der Server.
//
// Die erzeugten Dateien im Wurzelverzeichnis stehen bewusst nicht darin: Sie
// sind Ausgabe, keine Quelle. Ein Befund dort gehört nach src/.
import js from "@eslint/js";

const browserGlobals = {
  console: "readonly",
  document: "readonly",
  window: "readonly",
  navigator: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  crypto: "readonly",
  fetch: "readonly",
  CSS: "readonly",
  MutationObserver: "readonly",
  createImageBitmap: "readonly",
  OffscreenCanvas: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  queueMicrotask: "readonly",
  Blob: "readonly",
  File: "readonly",
  FileReader: "readonly",
  FormData: "readonly",
  Event: "readonly",
  CustomEvent: "readonly",
  HTMLElement: "readonly",
  Image: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly",
  BroadcastChannel: "readonly",
  AbortController: "readonly",
  atob: "readonly",
  btoa: "readonly",
  alert: "readonly",
  confirm: "readonly",
  matchMedia: "readonly",
  getComputedStyle: "readonly",
  showSaveFilePicker: "readonly",
  showOpenFilePicker: "readonly",
  showDirectoryPicker: "readonly",
};

const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  structuredClone: "readonly",
  fetch: "readonly",
  __dirname: "readonly",
  globalThis: "readonly",
};

const sharedRules = {
  ...js.configs.recommended.rules,
  // Was nirgends mehr benutzt wird, gehört heraus - der Grund, aus dem dieses
  // Regelwerk überhaupt hier steht. Führende Unterstriche bleiben erlaubt für
  // Parameter, die nur der Form halber dastehen.
  "no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
  ],
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-var": "error",
  "prefer-const": "error",
  "no-implicit-globals": "error",
  "no-throw-literal": "error",
  "no-return-await": "error",
  "no-unneeded-ternary": "error",
  "no-lonely-if": "error",
  "object-shorthand": ["error", "properties"],
};

export default [
  {
    ignores: [
      "node_modules/**",
      "server/node_modules/**",
      "dist/**",
      "vendor/**",
      "demo/**",
      // Die Bruchstücke der IIFE sind einzeln kein gültiges Programm und
      // ließen sich gar nicht erst einlesen. Geprüft werden sie über das
      // erzeugte app.js, siehe unten.
      "src/app/*.js",
      // Erzeugt aus src/html/, src/styles/ und der README - keine Quelle.
      "app.html",
    ],
  },

  // Der Browserteil wird am erzeugten app.js geprüft, nicht an den Dateien in
  // src/app/. Zwei Gründe: Die Bruchstücke sind einzeln kein gültiges
  // Programm - 00-shell.js öffnet die IIFE, 90-domain-utils.js schließt sie -,
  // und erst zusammengesetzt stimmt der Gültigkeitsbereich. Eine ungenutzte
  // Funktion oder ein unbekannter Bezeichner fällt nur dort auf.
  //
  // tools/lint.mjs rechnet die Fundstellen anschließend auf die Quelldatei in
  // src/app/ zurück, damit die Meldung dorthin zeigt, wo zu ändern ist.
  {
    files: ["app.js", "backend-client.js", "state-schema.js", "project-meta.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: { ...browserGlobals, self: "readonly", caches: "readonly", clients: "readonly", localforage: "readonly" },
    },
    rules: sharedRules,
  },

  // Ein Service Worker hat keinen umschließenden Bereich - seine Funktionen
  // stehen dort zu Recht global.
  {
    files: ["service-worker.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: { ...browserGlobals, self: "readonly", caches: "readonly", clients: "readonly" },
    },
    rules: { ...sharedRules, "no-implicit-globals": "off" },
  },

  {
    files: ["tools/**/*.mjs", "src/meta/*.mjs", "src/shared/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: nodeGlobals },
    rules: sharedRules,
  },

  // Tests laufen in Node, schicken aber Rümpfe in den Browser: Innerhalb von
  // page.evaluate() gilt die Umgebung der Seite. Beide Sätze zusammen, damit
  // die Prüfung nicht an jedem solchen Rumpf hängen bleibt.
  {
    files: ["tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...nodeGlobals, ...browserGlobals, KeyboardEvent: "readonly" },
    },
    rules: sharedRules,
  },

  {
    files: ["server/src/**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: nodeGlobals },
    rules: sharedRules,
  },
];
