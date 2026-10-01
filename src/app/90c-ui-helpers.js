  function downloadCsv(filename, headers, rows) {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const content = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\r\n");
    downloadTextFile(filename, content, "text/csv;charset=utf-8");
    showToast("CSV-Datei wurde exportiert.");
  }

  // Dynamische CSS-Werte - Fortschrittsbalken, Diagrammsegmente,
  // Spaltenzahlen - kommen aus dem Datenbestand und koennen deshalb nicht im
  // Stylesheet stehen. Statt sie als style-Attribut auszugeben (was
  // style-src-attr 'unsafe-inline' in der CSP erzwingt), wandern sie als
  // data-teo-style in das Markup und werden nach dem Einfuegen per
  // setProperty gesetzt.
  //
  // Erlaubt sind ausschliesslich Custom Properties (--name). Damit kann ueber
  // diesen Weg keine beliebige CSS-Deklaration in die Seite gelangen.
  function dynamicStyle(properties) {
    const declarations = Object.entries(properties)
      .filter(([name, value]) => /^--[a-z0-9-]+$/i.test(name) && value !== "")
      .map(([name, value]) => `${name}:${String(value).replaceAll(";", "")}`)
      .join(";");
    return declarations ? ` data-teo-style="${escapeHtml(declarations)}"` : "";
  }

  function applyDynamicStyles(root) {
    if (!root?.querySelectorAll) return;
    const targets =
      root.matches?.("[data-teo-style]") === true
        ? [root, ...root.querySelectorAll("[data-teo-style]")]
        : [...root.querySelectorAll("[data-teo-style]")];
    targets.forEach((element) => {
      element.dataset.teoStyle.split(";").forEach((declaration) => {
        const separator = declaration.indexOf(":");
        if (separator < 1) return;
        const name = declaration.slice(0, separator).trim();
        if (!/^--[a-z0-9-]+$/i.test(name)) return;
        element.style.setProperty(name, declaration.slice(separator + 1).trim());
      });
      delete element.dataset.teoStyle;
    });
  }

  // Ein einzelner Beobachter statt eines Aufrufs hinter jeder der ueber
  // hundert innerHTML-Zuweisungen: So greift der Mechanismus auch in
  // Renderpfaden, die spaeter dazukommen. Der Rueckruf laeuft als Microtask
  // noch vor dem Zeichnen, die Werte sind also nie kurzzeitig ungesetzt.
  function observeDynamicStyles() {
    applyDynamicStyles(document.body);
    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) applyDynamicStyles(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Jede Suche in TeO vergleicht ueber diesen Schluessel. Er macht sie
  // nachsichtig: Gross- und Kleinschreibung, Akzente und Umlaute spielen keine
  // Rolle, "ae", "oe" und "ue" gelten wie ä, ö und ü, und ß, s und ss sind
  // untereinander austauschbar - "Strasse", "Strase" und "Straße" finden
  // einander. Der Preis ist bekannt: "Klasse" findet auch "Klase". Ein
  // Suchfeld darf grosszuegig sein, ein Vergleich von Benutzernamen nicht -
  // dort bleibt es beim genauen Vergleich.
  function searchKey(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("de-DE")
      .replace(/ß/g, "ss")
      .replace(/ae/g, "a")
      .replace(/oe/g, "o")
      .replace(/ue/g, "u")
      .replace(/ss/g, "s")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hasVisibleNotification() {
    return Boolean(
      elements.toastRegion.childElementCount ||
        !elements.databaseSaveWarning.hidden,
    );
  }

  function syncNotificationLayer() {
    const stack = elements.notificationStack;
    const popoverOpen =
      typeof stack.hidePopover === "function" && stack.matches(":popover-open");

    // Ein bereits geoeffnetes Popover kann in der Top-Layer-Reihenfolge hinter
    // einem spaeter geoeffneten Dialog liegen. Vor jeder Meldung kurz schliessen
    // und neu oeffnen, damit die Ebene ueber Dialog und Backdrop einsortiert wird.
    if (popoverOpen) stack.hidePopover();
    if (stack.parentElement !== document.body) {
      document.body.append(stack);
    }
    if (
      hasVisibleNotification() &&
      typeof stack.showPopover === "function" &&
      !stack.matches(":popover-open")
    ) {
      try {
        stack.showPopover();
      } catch (error) {
        console.warn("Die Statusmeldung konnte nicht in die oberste Ebene gehoben werden.", error);
      }
    }
  }

  // action haengt einen Knopf an die Meldung („Rückgängig“). Eine Meldung mit
  // Knopf bleibt laenger stehen - sie will nicht nur gelesen, sondern noch
  // getroffen werden - und verschwindet, sobald der Knopf gedrueckt wurde.
  function showToast(message, type = "success", { action = null } = {}) {
    const toast = document.createElement("div");
    // Die Art steht als Klasse am Element; die Farben dazu kommen aus den
    // Farbmarken, damit jedes Farbschema eigene setzen kann.
    toast.className = `toast is-${type === "error" || type === "warning" ? type : "success"}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">
        <svg><use href="#icon-${type === "success" ? "check" : "alert"}"></use></svg>
      </span>
      <span class="toast-text"></span>
    `;
    toast.querySelector(".toast-text").textContent = message;

    if (action) {
      const button = document.createElement("button");
      button.className = "toast-action";
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        toast.remove();
        syncNotificationLayer();
        action.onSelect();
      });
      toast.append(button);
    }

    elements.toastRegion.append(toast);
    syncNotificationLayer();
    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => {
        toast.remove();
        if (
          !hasVisibleNotification() &&
          typeof elements.notificationStack.hidePopover === "function" &&
          elements.notificationStack.matches(":popover-open")
        ) {
          elements.notificationStack.hidePopover();
        }
      }, 190);
    }, action ? 9000 : 3400);
  }

  // Meldet eine Aenderung und bietet im selben Atemzug an, sie zurueckzunehmen.
  function showUndoToast(message) {
    showToast(message, "success", {
      action: {
        label: "Rückgängig",
        onSelect: () => {
          void undoLastMutation();
        },
      },
    });
  }
})();
