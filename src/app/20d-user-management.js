  function openAccountDialog() {
    if (!currentUser) {
      showLoginDialog();
      return;
    }
    elements.accountDialogTitle.textContent = currentUser.username;
    elements.accountDialogRole.textContent = isAdmin()
      ? "Administrator"
      : "Normaler Benutzer";
    applyAccessControl();
    elements.accountDialog.showModal();
  }

  function openUserManagementDialog() {
    if (!requireAdmin()) return;
    if (elements.accountDialog.open) elements.accountDialog.close();
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    elements.createUserForm.reset();
    renderUserManagement();
    elements.userManagementDialog.showModal();
  }

  // Das eigene Konto bleibt ausgenommen, damit sich niemand mitten in der
  // Sitzung selbst aussperrt. Der letzte Administrator bleibt bestehen, weil
  // ein Datenbestand ohne Administrator nicht mehr verwaltbar wäre.
  function userDeletionBlocker(user) {
    if (user.id === currentUser?.id) return "Das eigene Konto kann nicht gelöscht werden.";
    if (
      user.role === "admin" &&
      state.users.filter((item) => item.role === "admin").length <= 1
    ) {
      return "Der letzte Administrator kann nicht gelöscht werden.";
    }
    return "";
  }

  function isUsernameTaken(username, exceptId = "") {
    const normalized = username.toLocaleLowerCase("de-DE");
    return state.users.some(
      (item) =>
        item.id !== exceptId &&
        item.username.toLocaleLowerCase("de-DE") === normalized,
    );
  }

  function renderUserManagement() {
    elements.userManagementList.innerHTML = state.users
      .map((user) => {
        const isSelf = user.id === currentUser?.id;
        const deletionBlocker = userDeletionBlocker(user);
        return `
          <article class="user-management-row">
            <span class="user-management-avatar">${escapeHtml(
              user.username.slice(0, 2).toUpperCase(),
            )}</span>
            <label class="user-management-username">
              <span>Benutzername</span>
              <input
                type="text"
                value="${escapeHtml(user.username)}"
                maxlength="40"
                pattern="[A-Za-z0-9]{4,40}"
                autocomplete="off"
                spellcheck="false"
                data-user-username="${user.id}"
                aria-label="Benutzername für ${escapeHtml(user.username)}"
              />
              <small>${user.role === "admin" ? "Administrator" : "Normaler Benutzer"}${
                isSelf ? " · eigenes Konto" : ""
              }${
                user.mustChangePassword ? " · Passwortänderung erforderlich" : ""
              }</small>
            </label>
            <div class="user-management-actions">
              <button
                class="button button-secondary"
                type="button"
                data-save-user-username="${user.id}"
              >
                <svg><use href="#icon-check"></use></svg>
                Benutzername speichern
              </button>
              ${
                isSelf
                  ? ""
                  : `<button
                    class="button button-secondary"
                    type="button"
                    data-reset-user-password="${user.id}"
                  >Passwort zurücksetzen</button>`
              }
              ${
                deletionBlocker
                  ? `<span class="tag tag-muted" title="${escapeHtml(
                      deletionBlocker,
                    )}">Nicht löschbar</span>`
                  : `<button
                    class="button button-danger"
                    type="button"
                    data-delete-user="${user.id}"
                    aria-label="Konto ${escapeHtml(user.username)} löschen"
                  >
                    <svg><use href="#icon-trash"></use></svg>
                    Löschen
                  </button>`
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function handleCreateUserSubmit(event) {
    event.preventDefault();
    if (!requireAdmin()) return;

    const username = elements.newUserUsername.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      elements.newUserUsername.focus();
      return;
    }
    if (isUsernameTaken(username)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      elements.newUserUsername.focus();
      return;
    }

    const role = elements.newUserRole.value === "admin" ? "admin" : "user";
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const newUser = {
      id: `user-${createId()}`,
      username,
      role,
      ...credentials,
      mustChangePassword: true,
    };

    const committed = await commitStateMutation(() => {
      state.users = [...state.users, newUser];
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(newUser.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das neue Konto nicht hinterlegt werden.", error);
    }
    elements.createUserForm.reset();
    renderUserManagement();
    showTemporaryPassword(username, temporaryPassword);
    showToast(
      `Konto „${username}“ wurde als ${
        role === "admin" ? "Administrator" : "normaler Benutzer"
      } angelegt.`,
    );
  }

  function requestDeleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const blocker = userDeletionBlocker(user);
    if (blocker) {
      showToast(blocker, "error");
      return;
    }
    requestConfirmation({
      title: "Benutzerkonto löschen?",
      message: `Das Konto „${user.username}“ wird dauerhaft entfernt und kann sich danach nicht mehr anmelden. Eine noch offene Serversitzung dieses Kontos endet beim nächsten Serverkontakt. Der fachliche Datenbestand bleibt unverändert.`,
      acceptLabel: "Konto löschen",
      tone: "danger",
      callback: () => deleteUser(user.id),
    });
  }

  async function deleteUser(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    if (!user || userDeletionBlocker(user)) return;

    const committed = await commitStateMutation(() => {
      state.users = state.users.filter((item) => item.id !== user.id);
    });
    if (!committed) return;

    try {
      await removeAutomaticBackupUserKey(user.id);
    } catch (error) {
      console.warn("Die alte Sicherungsschlüssel-Hülle konnte nicht entfernt werden.", error);
    }
    elements.temporaryPasswordResult.hidden = true;
    elements.temporaryPasswordValue.value = "";
    renderUserManagement();
    showToast(`Konto „${user.username}“ wurde gelöscht.`);
  }

  function showTemporaryPassword(username, password) {
    elements.temporaryPasswordUsername.textContent = username;
    elements.temporaryPasswordValue.value = password;
    elements.temporaryPasswordResult.hidden = false;
    elements.temporaryPasswordValue.focus();
    elements.temporaryPasswordValue.select();
  }

  async function saveUsername(userId) {
    if (!requireAdmin()) return;
    const user = state.users.find((item) => item.id === userId);
    const input = [
      ...elements.userManagementList.querySelectorAll(
        "[data-user-username]",
      ),
    ].find(
      (field) => field.dataset.userUsername === userId,
    );
    if (!user || !input) return;

    const username = input.value.trim();
    if (!/^[A-Za-z0-9]{4,40}$/.test(username)) {
      showToast(
        "Der Benutzername muss aus 4 bis 40 Buchstaben oder Ziffern bestehen.",
        "error",
      );
      input.focus();
      return;
    }
    if (isUsernameTaken(username, user.id)) {
      showToast("Dieser Benutzername ist bereits vergeben.", "error");
      input.focus();
      return;
    }
    if (username === user.username) {
      showToast("Der Benutzername ist bereits aktuell.");
      return;
    }

    const previousUsername = user.username;
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id ? { ...item, username } : item,
      );
    });
    if (!committed) return;

    if (currentUser?.id === user.id) {
      currentUser = state.users.find((item) => item.id === user.id);
      renderAll();
    }
    renderUserManagement();
    showToast(
      `Benutzername „${previousUsername}“ wurde in „${username}“ geändert.`,
    );
  }

  // Das eigene Passwort wird über den Kontodialog geändert, nicht hier
  // zurückgesetzt – sonst wäre die eigene Sitzung sofort änderungspflichtig.
  function resettableUser(userId) {
    return state.users.find(
      (item) => item.id === userId && item.id !== currentUser?.id,
    );
  }

  function requestPasswordReset(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    requestConfirmation({
      title: "Passwort zurücksetzen?",
      message: `Für ${user.username} wird ein zufälliges temporäres Passwort erzeugt. Beim nächsten Login muss ein neues Passwort festgelegt werden.`,
      acceptLabel: "Passwort zurücksetzen",
      tone: "primary",
      callback: () => resetUserPassword(user.id),
    });
  }

  async function resetUserPassword(userId) {
    if (!requireAdmin()) return;
    const user = resettableUser(userId);
    if (!user) return;
    const temporaryPassword = createTemporaryPassword();
    const credentials = await createPasswordCredentials(temporaryPassword);
    const committed = await commitStateMutation(() => {
      state.users = state.users.map((item) =>
        item.id === user.id
          ? { ...item, ...credentials, mustChangePassword: true }
          : item,
      );
    });
    if (!committed) return;

    try {
      await registerAutomaticBackupUserKey(user.id, temporaryPassword);
    } catch (error) {
      console.warn("Der Sicherungsschlüssel konnte für das zurückgesetzte Passwort nicht hinterlegt werden.", error);
    }
    renderUserManagement();
    showTemporaryPassword(user.username, temporaryPassword);
    showToast(`Passwort für ${user.username} wurde zurückgesetzt.`);
  }

  function createTemporaryPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const required = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
    ].map((characters) => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return characters[value % characters.length];
    });
    const random = Array.from({ length: 9 }, () => {
      const value = crypto.getRandomValues(new Uint32Array(1))[0];
      return alphabet[value % alphabet.length];
    });
    return [...required, ...random]
      .map((character) => ({ character, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
      .sort((a, b) => a.order - b.order)
      .map((item) => item.character)
      .join("");
  }
