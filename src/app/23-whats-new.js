  // „Was ist neu“ nach einer neuen Fassung.
  //
  // Das Änderungsverzeichnis steckt ohnehin in der Hilfe; dieser Hinweis holt
  // den Abschnitt der laufenden Fassung einmalig nach vorn. Die zuletzt
  // gesehene Fassung liegt im Browserprofil: Sie beschreibt diesen
  // Arbeitsplatz, nicht den Datenbestand - an einem zweiten Rechner soll der
  // Hinweis erneut erscheinen.
  const LAST_SEEN_VERSION_KEY = "teo-last-seen-version-v1";

  function bindWhatsNew() {
    elements.whatsNewHelpButton?.addEventListener("click", () => {
      elements.whatsNewDialog.close();
      showView("help");
      document
        .querySelector("#hilfe-anderungshistorie")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function readLastSeenVersion() {
    try {
      return localStorage.getItem(LAST_SEEN_VERSION_KEY) || "";
    } catch (error) {
      console.warn("Die zuletzt gesehene Fassung ist unlesbar.", error);
      return "";
    }
  }

  function rememberSeenVersion(version) {
    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
    } catch (error) {
      console.warn("Die gesehene Fassung konnte nicht gemerkt werden.", error);
    }
  }

  // Beim ersten Start überhaupt wird nur gemerkt: Wer TeO gerade einrichtet,
  // braucht keine Liste der Änderungen gegenüber einer Fassung, die er nie
  // benutzt hat.
  function showWhatsNewIfUpdated() {
    const version = projectBuildNumber();
    const lastSeen = readLastSeenVersion();
    if (lastSeen === version) return false;

    rememberSeenVersion(version);
    if (!lastSeen) return false;
    return openWhatsNewDialog(version, lastSeen);
  }

  function openWhatsNewDialog(version, lastSeen = "") {
    const section = changelogSectionMarkup(version);
    if (!section || !elements.whatsNewDialog) return false;

    elements.whatsNewVersion.textContent = section.title;
    elements.whatsNewEntries.innerHTML = section.entries;
    elements.whatsNewSubtitle.textContent = lastSeen
      ? `Zuletzt benutzt: Fassung ${lastSeen}. Das hat sich seitdem geändert:`
      : "Das ist in dieser Fassung neu:";
    elements.whatsNewDialog.showModal();
    return true;
  }

  // Der Abschnitt steht schon im Markup der Hilfe - als Überschrift der
  // Fassung und der Aufzählung dahinter. Er wird von dort übernommen, damit es
  // nicht zwei Fassungen desselben Textes gibt.
  function changelogSectionMarkup(version) {
    // Der Hinweis erscheint vor dem ersten Besuch der Hilfe. Gelesen wird
    // deshalb dort, wo das Handbuch gerade liegt - beim Start in seiner
    // Vorlage, die dafuer nicht ins Dokument muss.
    const headings = [...helpContentRoot().querySelectorAll(".help-section h3")];
    const heading = headings.find((item) => item.textContent.trim().startsWith(version));
    const list = heading?.nextElementSibling;
    if (!heading || list?.tagName !== "UL") return null;
    return { title: heading.textContent.trim(), entries: list.innerHTML };
  }
