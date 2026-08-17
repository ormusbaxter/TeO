  function memoVisibleToCurrentUser(memo, user = currentUser) {
    return Boolean(
      memo &&
        (memo.visibility === "all" ||
          (user?.id && memo.createdByUserId === user.id)),
    );
  }

  function visibleMemos() {
    return state.memos.filter((memo) => memoVisibleToCurrentUser(memo));
  }

  function sortMemos(a, b) {
    return (
      Number(b.pinned) - Number(a.pinned) ||
      Number(a.completed) - Number(b.completed) ||
      Number(!a.date) - Number(!b.date) ||
      String(a.date).localeCompare(String(b.date)) ||
      String(b.updatedAt).localeCompare(String(a.updatedAt)) ||
      a.title.localeCompare(b.title, "de")
    );
  }

  function filteredMemos() {
    return visibleMemos()
      .filter((memo) => {
        if (memoStatusFilter === "open" && memo.completed) return false;
        if (memoStatusFilter === "completed" && !memo.completed) return false;
        if (memoCategoryFilter !== "all" && memo.category !== memoCategoryFilter) {
          return false;
        }
        if (!memoSearchTerm) return true;
        return `${memo.title} ${memo.description} ${memo.category}`
          .toLocaleLowerCase("de-DE")
          .includes(memoSearchTerm);
      })
      .sort(sortMemos);
  }

  function renderMemoCategoryOptions() {
    elements.memoCategory.innerHTML = [
      '<option value="">Ohne Kategorie</option>',
      ...state.catalogs.memoCategories.map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      ),
    ].join("");
    elements.memoCategoryFilter.innerHTML = [
      '<option value="all">Alle Kategorien</option>',
      '<option value="">Ohne Kategorie</option>',
      ...state.catalogs.memoCategories.map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      ),
    ].join("");
    if (
      memoCategoryFilter !== "all" &&
      memoCategoryFilter !== "" &&
      !state.catalogs.memoCategories.includes(memoCategoryFilter)
    ) {
      memoCategoryFilter = "all";
    }
    elements.memoCategoryFilter.value = memoCategoryFilter;
  }

  function renderMemos() {
    renderMemoCategoryOptions();
    const allVisible = visibleMemos();
    const memos = filteredMemos();
    elements.memoSummary.innerHTML = `
      ${renderSummaryChip("empty", allVisible.length, "sichtbare Einträge")}
      ${renderSummaryChip("check", allVisible.filter((memo) => !memo.completed).length, "offen", "teal")}
      ${renderSummaryChip("alert", allVisible.filter((memo) => memo.pinned && !memo.completed).length, "wichtig", "orange")}
      ${renderSummaryChip("lock", allVisible.filter((memo) => memo.visibility === "private").length, "nur in meiner Ansicht")}
    `;

    if (!allVisible.length) {
      elements.memoList.innerHTML = `<section class="panel">${renderEmptyState({
        title: "Noch keine Memos oder ToDos",
        text: "Legen Sie eine persönliche Notiz oder eine gemeinsame Aufgabe an.",
        buttonText: "Ersten Eintrag anlegen",
        buttonAttribute: "data-empty-add-memo",
      })}</section>`;
      elements.memoList
        .querySelector("[data-empty-add-memo]")
        ?.addEventListener("click", () => openMemoDialog());
      return;
    }
    if (!memos.length) {
      elements.memoList.innerHTML = `<section class="panel">${renderEmptyState({
        title: "Keine passenden Einträge",
        text: "Passen Sie Suche, Kategorie oder Statusfilter an.",
        compact: true,
      })}</section>`;
      return;
    }
    elements.memoList.innerHTML = memos.map(renderMemoCard).join("");
  }

  function memoDatePresentation(memo) {
    if (!memo.date) return { date: "Ohne Datum", relative: "Keine Fälligkeit" };
    const days = daysBetween(parseLocalDate(todayIso()), parseLocalDate(memo.date));
    return {
      date: formatDate(memo.date),
      relative: appointmentRelativeLabel(days),
      overdue: days < 0 && !memo.completed,
    };
  }

  function memoCreatorLabel(memo) {
    return (
      state.users.find((user) => user.id === memo.createdByUserId)?.username ||
      "Ehemaliges Konto"
    );
  }

  function renderMemoCard(memo) {
    const date = memoDatePresentation(memo);
    const meta = [
      memo.category || "Ohne Kategorie",
      memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle",
      `Erstellt von ${memoCreatorLabel(memo)}`,
    ];
    return `
      <article class="meeting-card memo-card ${memo.pinned ? "is-pinned" : ""} ${memo.completed ? "is-completed" : ""}" data-memo-card="${memo.id}" tabindex="0" aria-label="${escapeHtml(memo.title)} öffnen">
        <div class="meeting-card-main">
          <div class="training-title-row">
            <span class="training-icon memo-icon"><svg><use href="#icon-memo"></use></svg></span>
            <div>
              <h2>${memo.pinned ? '<span class="appointment-pinned-badge"><span class="important-notification-icon" aria-hidden="true"></span>Wichtig</span>' : ""}${escapeHtml(memo.title)}${memo.completed ? ' <span class="memo-completed-badge">Erledigt</span>' : ""}</h2>
              <p>${escapeHtml(memo.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">${escapeHtml(meta.join(" · "))}</span>
            </div>
          </div>
          <div class="appointment-date-status ${date.overdue ? "is-overdue" : ""}"><strong>${escapeHtml(date.date)}</strong><span>${escapeHtml(date.relative)}</span></div>
          <div class="training-actions">
            <button class="icon-button memo-complete-button ${memo.completed ? "is-active" : ""}" type="button" data-action="toggle-memo-completed" data-id="${memo.id}" aria-label="${memo.completed ? "Wieder öffnen" : "Als erledigt markieren"}" title="${memo.completed ? "Wieder öffnen" : "Als erledigt markieren"}"><svg><use href="#icon-check"></use></svg></button>
            <button class="icon-button appointment-pin-button ${memo.pinned ? "is-active" : ""}" type="button" data-action="toggle-memo-pin" data-id="${memo.id}" aria-label="${memo.pinned ? "Nicht mehr anpinnen" : "Anpinnen"}" aria-pressed="${String(memo.pinned)}" title="${memo.pinned ? "Nicht mehr anpinnen" : "Anpinnen"}"><span class="important-notification-icon" aria-hidden="true"></span></button>
            <button class="icon-button" type="button" data-action="edit-memo" data-id="${memo.id}" aria-label="Bearbeiten" title="Bearbeiten"><svg><use href="#icon-edit"></use></svg></button>
            <button class="icon-button danger" type="button" data-action="delete-memo" data-id="${memo.id}" aria-label="Löschen" title="Löschen"><svg><use href="#icon-trash"></use></svg></button>
          </div>
        </div>
      </article>`;
  }

  function renderDashboardMemos() {
    const memos = visibleMemos().filter((memo) => !memo.completed).sort(sortMemos);
    const visible = memos.length > 0;
    elements.dashboardMemoPanel.hidden = !visible;
    elements.dashboardPriorityGrid.classList.toggle("has-memos", visible);
    if (!visible) {
      elements.dashboardMemoList.innerHTML = "";
      return;
    }
    elements.dashboardMemoList.innerHTML = `
      <div class="dashboard-memo-list">
        ${memos
          .slice(0, 6)
          .map((memo) => {
            const date = memoDatePresentation(memo);
            return `<button class="dashboard-memo-row ${memo.pinned ? "is-pinned" : ""}" type="button" data-dashboard-memo="${memo.id}">
              <span class="memo-dashboard-icon">${memo.pinned ? '<span class="important-notification-icon" aria-hidden="true"></span>' : '<svg><use href="#icon-memo"></use></svg>'}</span>
              <span><strong>${escapeHtml(memo.title)}</strong><small>${escapeHtml([memo.category || "Ohne Kategorie", memo.visibility === "private" ? "Nur in meiner Ansicht" : "Für alle"].join(" · "))}</small></span>
              <span><strong>${escapeHtml(date.date)}</strong><small>${escapeHtml(date.relative)}</small></span>
            </button>`;
          })
          .join("")}
      </div>
      ${memos.length > 6 ? `<p class="field-hint dashboard-memo-more">${memos.length - 6} weitere offene Einträge</p>` : ""}`;
  }

  function handleDashboardMemoAction(event) {
    const button = event.target.closest("[data-dashboard-memo]");
    if (button) openMemoDialog(button.dataset.dashboardMemo);
  }

  function handleMemoAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (button) {
      if (event.type === "keydown") return;
      const { action, id } = button.dataset;
      if (action === "toggle-memo-completed") void toggleMemoCompleted(id);
      if (action === "toggle-memo-pin") void toggleMemoPinned(id);
      if (action === "edit-memo") openMemoDialog(id);
      if (action === "delete-memo") requestDeleteMemo(id);
      return;
    }
    const card = event.target.closest("[data-memo-card]");
    if (!card || (event.type === "keydown" && !["Enter", " "].includes(event.key))) return;
    if (event.type === "keydown") event.preventDefault();
    openMemoDialog(card.dataset.memoCard);
  }

  function getMemo(memoId) {
    return state.memos.find((memo) => memo.id === memoId);
  }

  function openMemoDialog(memoId = null) {
    const memo = memoId ? getMemo(memoId) : null;
    if (memo && !memoVisibleToCurrentUser(memo)) return;
    renderMemoCategoryOptions();
    elements.memoForm.reset();
    document.querySelector("#memoId").value = "";
    document.querySelector("#memoTitle").setCustomValidity("");
    elements.memoVisibility.value = "all";
    elements.memoPinned.checked = false;
    elements.memoCompleted.checked = false;
    elements.memoDialogTitle.textContent = memo ? "Memo / ToDo bearbeiten" : "Memo / ToDo anlegen";
    elements.memoSubmitLabel.textContent = memo ? "Änderungen speichern" : "Memo / ToDo speichern";
    if (memo) {
      document.querySelector("#memoId").value = memo.id;
      document.querySelector("#memoTitle").value = memo.title;
      document.querySelector("#memoDate").value = memo.date;
      document.querySelector("#memoDescription").value = memo.description;
      elements.memoCategory.value = memo.category;
      elements.memoVisibility.value = memo.visibility;
      elements.memoPinned.checked = memo.pinned;
      elements.memoCompleted.checked = memo.completed;
    }
    elements.memoDialog.showModal();
    captureCleanForm(elements.memoForm);
    window.setTimeout(() => document.querySelector("#memoTitle").focus(), 0);
  }

  async function handleMemoSubmit(event) {
    event.preventDefault();
    const titleInput = document.querySelector("#memoTitle");
    titleInput.setCustomValidity(titleInput.value.trim() ? "" : "Bitte einen Titel eingeben.");
    if (!elements.memoForm.reportValidity()) return;
    const memoId = document.querySelector("#memoId").value;
    const existing = memoId ? getMemo(memoId) : null;
    if (existing && !memoVisibleToCurrentUser(existing)) return;
    const now = new Date().toISOString();
    const memo = {
      id: existing?.id || createId(),
      title: titleInput.value.trim(),
      description: document.querySelector("#memoDescription").value.trim(),
      date: document.querySelector("#memoDate").value,
      category: elements.memoCategory.value,
      pinned: elements.memoPinned.checked,
      completed: elements.memoCompleted.checked,
      visibility: elements.memoVisibility.value === "private" ? "private" : "all",
      createdByUserId: existing?.createdByUserId || currentUser.id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const committed = await commitStateMutation(() => {
      if (existing) {
        state.memos = state.memos.map((item) => (item.id === memo.id ? memo : item));
      } else {
        state.memos.push(memo);
      }
    });
    if (!committed) return;
    elements.memoDialog.close();
    showToast(existing ? "Memo / ToDo wurde aktualisiert." : "Memo / ToDo wurde angelegt.");
  }

  async function toggleMemoPinned(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    const pinned = !memo.pinned;
    const committed = await commitStateMutation(() => {
      state.memos = state.memos.map((item) =>
        item.id === memoId ? { ...item, pinned, updatedAt: new Date().toISOString() } : item,
      );
    });
    if (committed) showToast(pinned ? "Memo / ToDo wurde angepinnt." : "Memo / ToDo wurde gelöst.");
  }

  async function toggleMemoCompleted(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    const completed = !memo.completed;
    const committed = await commitStateMutation(() => {
      state.memos = state.memos.map((item) =>
        item.id === memoId ? { ...item, completed, updatedAt: new Date().toISOString() } : item,
      );
    });
    if (committed) showToast(completed ? "Memo / ToDo wurde erledigt." : "Memo / ToDo wurde wieder geöffnet.");
  }

  function requestDeleteMemo(memoId) {
    const memo = getMemo(memoId);
    if (!memoVisibleToCurrentUser(memo)) return;
    requestConfirmation({
      title: "Memo / ToDo löschen?",
      message: `„${memo.title}“ wird dauerhaft gelöscht.`,
      acceptLabel: "Eintrag löschen",
      callback: async () => {
        const committed = await commitStateMutation(() => {
          state.memos = state.memos.filter((item) => item.id !== memoId);
        });
        if (committed) showToast("Memo / ToDo wurde gelöscht.");
      },
    });
  }

  function renderMemoCategorySettings() {
    elements.memoCategoryList.innerHTML = state.catalogs.memoCategories.length
      ? state.catalogs.memoCategories.map((category, index) => `
          <div class="catalog-row" data-memo-category-index="${index}">
            <input type="text" maxlength="60" value="${escapeHtml(category)}" aria-label="Kategorie ${escapeHtml(category)} bearbeiten" />
            <button class="icon-button" type="button" data-memo-category-action="save" aria-label="Änderung speichern" title="Änderung speichern"><svg><use href="#icon-check"></use></svg></button>
            <button class="icon-button danger" type="button" data-memo-category-action="delete" aria-label="${escapeHtml(category)} löschen" title="Löschen"><svg><use href="#icon-trash"></use></svg></button>
          </div>`).join("")
      : '<p class="settings-empty-copy">Noch keine Kategorien angelegt.</p>';
  }

  async function addMemoCategory(event) {
    event.preventDefault();
    const category = elements.newMemoCategory.value.trim();
    if (!category) return;
    if (catalogIncludesLabel(state.catalogs.memoCategories, category)) {
      showToast("Diese Memo-/ToDo-Kategorie ist bereits vorhanden.", "error");
      return;
    }
    const committed = await commitStateMutation(() => {
      state.catalogs.memoCategories.push(category);
      state.catalogs.memoCategories.sort((a, b) => a.localeCompare(b, "de"));
    });
    if (!committed) return;
    elements.newMemoCategory.value = "";
    renderMemoCategorySettings();
    showToast("Memo-/ToDo-Kategorie wurde hinzugefügt.");
  }

  function handleMemoCategoryAction(event) {
    const button = event.target.closest("[data-memo-category-action]");
    const row = button?.closest("[data-memo-category-index]");
    if (!button || !row) return;
    const index = Number(row.dataset.memoCategoryIndex);
    if (button.dataset.memoCategoryAction === "save") {
      void saveMemoCategory(index, row.querySelector("input").value);
    } else {
      deleteMemoCategory(index);
    }
  }

  async function saveMemoCategory(index, nextValue) {
    const previous = state.catalogs.memoCategories[index];
    const category = String(nextValue || "").trim().slice(0, 60);
    if (!previous || !category) {
      showToast("Die Kategorie darf nicht leer sein.", "error");
      return;
    }
    if (previous.toLocaleLowerCase("de-DE") !== category.toLocaleLowerCase("de-DE") && catalogIncludesLabel(state.catalogs.memoCategories, category)) {
      showToast("Diese Memo-/ToDo-Kategorie ist bereits vorhanden.", "error");
      return;
    }
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.catalogs.memoCategories[index] = category;
      state.catalogs.memoCategories.sort((a, b) => a.localeCompare(b, "de"));
      state.memos = state.memos.map((memo) => memo.category === previous ? { ...memo, category, updatedAt: now } : memo);
    });
    if (!committed) return;
    renderMemoCategorySettings();
    showToast("Memo-/ToDo-Kategorie wurde aktualisiert.");
  }

  function deleteMemoCategory(index) {
    const category = state.catalogs.memoCategories[index];
    if (!category) return;
    const assignments = state.memos.filter((memo) => memo.category === category).length;
    requestConfirmation({
      title: "Memo-/ToDo-Kategorie löschen?",
      message: assignments ? `„${category}“ wird gelöscht und bei ${assignments} Eintrag${assignments === 1 ? "" : "en"} entfernt.` : `„${category}“ wird aus dem Katalog entfernt.`,
      acceptLabel: "Kategorie löschen",
      callback: async () => {
        const now = new Date().toISOString();
        const committed = await commitStateMutation(() => {
          state.catalogs.memoCategories.splice(index, 1);
          state.memos = state.memos.map((memo) => memo.category === category ? { ...memo, category: "", updatedAt: now } : memo);
        });
        if (!committed) return;
        renderMemoCategorySettings();
        showToast("Memo-/ToDo-Kategorie wurde gelöscht.");
      },
    });
  }
