  // Eine gesperrte Seite ohne Dialog ist eine leere Seite: Die Sperre verdeckt
  // die Anwendung, und nichts laesst sich bedienen. So erging es TeO in Chrome
  // beim Oeffnen per Doppelklick - und wo die Entwicklerwerkzeuge gesperrt
  // sind, war nicht einmal zu sehen, woran es lag. Geht ein Fehler ins Leere,
  // waehrend die Seite so dasteht, zeigt TeO ihn deshalb im Startdialog an und
  // bietet dort den Weg ueber die Sicherungsdatei an.
  function bindBlankScreenGuard() {
    window.addEventListener("error", (event) => {
      handleUncaughtStartupError(event.error || event.message);
    });
    window.addEventListener("unhandledrejection", (event) => {
      handleUncaughtStartupError(event.reason);
    });
  }

  // Haengt der Start, ohne dass ein Fehler faellt - etwa weil eine Abfrage des
  // Browsers nie zurueckkehrt -, greift dieselbe Rettung nach einer Weile.
  function scheduleBlankScreenCheck(delay = STARTUP_LOOKUP_TIMEOUT_MS * 2) {
    window.setTimeout(() => {
      if (!lockedWithoutDialog()) return;
      console.error("Der Start ist ohne Dialog stehen geblieben.");
      recoverBlankScreen("Der Start ist stehen geblieben");
    }, delay);
  }

  function lockedWithoutDialog() {
    return (
      document.body.classList.contains("is-auth-locked") &&
      !document.querySelector("dialog[open]")
    );
  }

  function handleUncaughtStartupError(error) {
    // Erst nach dem laufenden Ablauf pruefen: Ein Dialog, der im selben Zug
    // noch aufgeht, ist ein Ausweg, und dann bleibt alles, wie es ist.
    window.setTimeout(() => {
      if (!lockedWithoutDialog()) return;
      console.error("Fehler bei gesperrter Seite.", error);
      recoverBlankScreen(uncaughtErrorText(error));
    }, 0);
  }

  function uncaughtErrorText(error) {
    const text = String(error?.message || error || "").trim();
    return text || "unbekannter Fehler";
  }

  function recoverBlankScreen(detail) {
    const message = `TeO ist beim Start auf einen Fehler gestoßen: ${detail}`;
    try {
      // Im lokalen Modus fuehrt die gewaehlte Sicherungsdatei zur Anmeldung.
      // Ein eben eingerichteter Bestand hat noch keine; er meldet sich gegen
      // die Konten dieses Browsers an.
      if (!isMariaDbMode() && !automaticBackupSettings?.firstSharedFilePending) {
        showStartupBackupDialog(
          `${message}. Bitte wählen Sie ${AUTO_BACKUP_FILENAME} aus.`,
        );
        return;
      }
      showLoginDialog();
      elements.loginError.textContent = message;
    } catch (recoveryError) {
      console.error("Der Startdialog konnte nicht geöffnet werden.", recoveryError);
      showToast(message, "error");
    }
  }
