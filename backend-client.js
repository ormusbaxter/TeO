(function exposeTeoBackend(global) {
  "use strict";

  const CONFIG_KEY = "teo-backend-config-v1";
  const TOKEN_KEY = "teo-backend-session-v1";
  const DEFAULT_CONFIG = Object.freeze({
    mode: "local",
    apiUrl: "",
  });

  class BackendError extends Error {
    constructor(message, status = 0, code = "", details = null) {
      super(message);
      this.name = "BackendError";
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  function normalizeApiUrl(value) {
    return String(value || "")
      .trim()
      .replace(/\/+$/, "");
  }

  function readConfig() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      if (parsed?.mode === "mariadb" && normalizeApiUrl(parsed.apiUrl)) {
        return {
          mode: "mariadb",
          apiUrl: normalizeApiUrl(parsed.apiUrl),
        };
      }
    } catch (error) {
      console.warn("Backend-Konfiguration konnte nicht gelesen werden.", error);
    }
    return { ...DEFAULT_CONFIG };
  }

  function writeConfig(config) {
    const normalized =
      config?.mode === "mariadb" && normalizeApiUrl(config.apiUrl)
        ? { mode: "mariadb", apiUrl: normalizeApiUrl(config.apiUrl) }
        : { ...DEFAULT_CONFIG };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function readToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function writeToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  async function request(apiUrl, path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    };

    let response;
    try {
      response = await fetch(`${normalizeApiUrl(apiUrl)}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });
    } catch (error) {
      throw new BackendError(
        "Der TeO-Server ist nicht erreichbar. Bitte Serveradresse und Netzwerkverbindung prüfen.",
        0,
        "network_error",
        error,
      );
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new BackendError(
        payload?.message || `Serveranfrage fehlgeschlagen (${response.status}).`,
        response.status,
        payload?.code || "",
        payload,
      );
    }
    return payload;
  }

  async function health(apiUrl) {
    return request(apiUrl, "/api/health");
  }

  async function bootstrap(apiUrl, state, username, password) {
    return request(apiUrl, "/api/bootstrap", {
      method: "POST",
      body: { state, username, password },
    });
  }

  async function login(apiUrl, username, password) {
    return request(apiUrl, "/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
  }

  async function logout(apiUrl, token) {
    if (!token) return;
    try {
      await request(apiUrl, "/api/auth/session", {
        method: "DELETE",
        token,
      });
    } catch {
      // Die lokale Sitzung wird auch dann beendet, wenn der Server nicht erreichbar ist.
    }
  }

  async function load(apiUrl, token) {
    return request(apiUrl, "/api/state", { token });
  }

  async function save(apiUrl, token, state, expectedRevision) {
    return request(apiUrl, "/api/state", {
      method: "PUT",
      token,
      body: { state, expectedRevision },
    });
  }

  global.TeOBackend = Object.freeze({
    BackendError,
    readConfig,
    writeConfig,
    readToken,
    writeToken,
    normalizeApiUrl,
    health,
    bootstrap,
    login,
    logout,
    load,
    save,
  });
})(window);
