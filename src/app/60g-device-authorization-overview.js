  // Einweisungsberechtigungen: Wer darf welches Gerät einweisen? Es gilt
  // dieselbe Regel wie an der Gerätekarte (getDeviceAuthorizedEmployees):
  // Teilnahme an einer gültigen Herstellereinweisung als Gerätebeauftragte/r.
  // Maßgeblich ist der Status zum Einweisungszeitpunkt.
  function getDeviceAuthorizationOverview({
    inventoryOnly = true,
    today = todayIso(),
  } = {}) {
    const devices = state.devices
      .filter((device) => !inventoryOnly || device.currentInventory)
      .sort((a, b) =>
        deviceLabel(a).localeCompare(deviceLabel(b), "de", {
          sensitivity: "base",
        }),
      );
    const deviceIds = new Set(devices.map((device) => device.id));
    const cutoffs = new Map(
      devices.map((device) => [device.id, deviceInstructionCutoff(device)]),
    );
    // Je Paar Gerät/Mitarbeiter das Datum der letzten gültigen Berechtigung.
    const latestDates = new Map();
    state.deviceInstructions.forEach((instruction) => {
      if (
        instruction.instructorType !== "manufacturer" ||
        !deviceIds.has(instruction.deviceId) ||
        !isDeviceInstructionValid(instruction, cutoffs.get(instruction.deviceId))
      ) {
        return;
      }
      instruction.participants.forEach((participant) => {
        if (!participant.wasMedicalProductsOfficer) return;
        const key = `${instruction.deviceId}|${participant.employeeId}`;
        if (!latestDates.has(key) || latestDates.get(key) < instruction.date) {
          latestDates.set(key, instruction.date);
        }
      });
    });

    const employeesById = new Map(
      state.employees.map((employee) => [employee.id, employee]),
    );
    const officerDevices = new Map();
    const deviceEntries = devices.map((device) => {
      const authorized = [];
      employeesById.forEach((employee) => {
        const date = latestDates.get(`${device.id}|${employee.id}`);
        if (!date) return;
        authorized.push({ employee, date });
        if (!officerDevices.has(employee.id)) officerDevices.set(employee.id, []);
        officerDevices.get(employee.id).push({ device, date });
      });
      authorized.sort((a, b) =>
        compareDeviceInstructionEmployees(a.employee, b.employee),
      );
      return { device, authorized };
    });

    // Aktuelle Gerätebeauftragte ohne Berechtigung gehören dazu: Bei ihnen
    // fehlt die Herstellereinweisung, und genau das soll auffallen.
    const officers = state.employees
      .filter(
        (employee) =>
          officerDevices.has(employee.id) ||
          (employee.active &&
            isEmployedOn(employee, today) &&
            employee.qualifications?.medizinproduktebeauftragter),
      )
      .sort(compareDeviceInstructionEmployees)
      .map((employee) => ({
        employee,
        devices: officerDevices.get(employee.id) || [],
        isEmployed: employee.active && isEmployedOn(employee, today),
        isCurrentOfficer: Boolean(
          employee.qualifications?.medizinproduktebeauftragter,
        ),
      }));

    return {
      devices: deviceEntries,
      officers,
      devicesWithoutAuthorization: deviceEntries
        .filter((entry) => !entry.authorized.length)
        .map((entry) => entry.device),
    };
  }

  function openDeviceAuthorizationOverview() {
    elements.deviceAuthorizationInventoryFilter.checked =
      deviceAuthorizationInventoryOnly;
    renderDeviceAuthorizationOverview();
    if (!elements.deviceAuthorizationDialog.open) {
      elements.deviceAuthorizationDialog.showModal();
    }
  }

  function setDeviceAuthorizationGrouping(grouping) {
    deviceAuthorizationGrouping = grouping === "device" ? "device" : "officer";
    renderDeviceAuthorizationOverview();
  }

  function deviceAuthorizationEmployeeNote({ isEmployed, isCurrentOfficer }) {
    if (!isEmployed) return "Nicht mehr beschäftigt";
    if (!isCurrentOfficer) return "Derzeit nicht als Gerätebeauftragte/r geführt";
    return "";
  }

  function renderDeviceAuthorizationOverview() {
    const overview = getDeviceAuthorizationOverview({
      inventoryOnly: deviceAuthorizationInventoryOnly,
    });
    elements.deviceAuthorizationGrouping
      .querySelectorAll("[data-device-authorization-grouping]")
      .forEach((button) => {
        const active =
          button.dataset.deviceAuthorizationGrouping ===
          deviceAuthorizationGrouping;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    const authorizedOfficers = overview.officers.filter(
      (officer) => officer.devices.length,
    ).length;
    elements.deviceAuthorizationSubtitle.textContent = overview.devices.length
      ? `${authorizedOfficers} einweisungsberechtigte Person${
          authorizedOfficers === 1 ? "" : "en"
        } für ${overview.devices.length - overview.devicesWithoutAuthorization.length} von ${
          overview.devices.length
        } Geräten`
      : "Keine Geräte angelegt";

    if (!overview.devices.length) {
      elements.deviceAuthorizationContent.innerHTML = renderEmptyState({
        title: deviceAuthorizationInventoryOnly
          ? "Keine Geräte im Bestand"
          : "Noch keine Geräte",
        text: "Nach dem Anlegen eines Geräts erscheinen hier seine Einweisungsberechtigten.",
        compact: true,
      });
      return;
    }

    const summary = `
      <div class="device-employee-overview-summary" aria-label="Zusammenfassung">
        <span class="is-complete"><strong>${authorizedOfficers}</strong> einweisungsberechtigt</span>
        <span><strong>${overview.devices.length}</strong> Geräte</span>
        <span class="${overview.devicesWithoutAuthorization.length ? "is-voided" : ""}"><strong>${
          overview.devicesWithoutAuthorization.length
        }</strong> ohne Einweisungsberechtigte</span>
      </div>
    `;
    elements.deviceAuthorizationContent.innerHTML = `${summary}${
      deviceAuthorizationGrouping === "device"
        ? renderDeviceAuthorizationByDevice(overview)
        : renderDeviceAuthorizationByOfficer(overview)
    }`;
  }

  function renderDeviceAuthorizationByOfficer(overview) {
    const officers = overview.officers.length
      ? `
        <div class="device-authorization-groups">
          ${overview.officers
            .map((officer) => {
              const note = deviceAuthorizationEmployeeNote(officer);
              return `
                <section class="device-authorization-group" data-device-authorization-officer="${officer.employee.id}">
                  <header>
                    ${renderAvatar(officer.employee, true)}
                    <span>
                      <strong>${escapeHtml(fullName(officer.employee))}</strong>
                      <small>${
                        officer.devices.length
                          ? `${officer.devices.length} Gerät${officer.devices.length === 1 ? "" : "e"}`
                          : "Keine gültige Herstellereinweisung als Gerätebeauftragte/r"
                      }${note ? ` · ${note}` : ""}</small>
                    </span>
                  </header>
                  ${
                    officer.devices.length
                      ? `<ul class="device-authorization-items">${officer.devices
                          .map(
                            ({ device, date }) => `
                              <li>
                                <strong>${escapeHtml(deviceLabel(device))}</strong>
                                <small>${escapeHtml(device.category)}${
                                  device.currentInventory ? "" : " · nicht mehr im Bestand"
                                } · Herstellereinweisung am ${formatDate(date)}</small>
                              </li>
                            `,
                          )
                          .join("")}</ul>`
                      : ""
                  }
                </section>
              `;
            })
            .join("")}
        </div>
      `
      : renderEmptyState({
          title: "Keine Gerätebeauftragten",
          text: "Einweisungsberechtigt wird, wer als Gerätebeauftragte/r an einer Herstellereinweisung teilnimmt.",
          compact: true,
        });
    const missing = overview.devicesWithoutAuthorization;
    return `
      ${officers}
      ${
        missing.length
          ? `
            <section class="device-authorization-missing">
              <h3>Ohne Einweisungsberechtigte</h3>
              <ul class="device-authorization-items">
                ${missing
                  .map(
                    (device) => `
                      <li data-device-authorization-missing="${device.id}">
                        <strong>${escapeHtml(deviceLabel(device))}</strong>
                        <small>${escapeHtml(device.category)}${
                          device.currentInventory ? "" : " · nicht mehr im Bestand"
                        }</small>
                      </li>
                    `,
                  )
                  .join("")}
              </ul>
            </section>
          `
          : ""
      }
    `;
  }

  function renderDeviceAuthorizationByDevice(overview) {
    return `
      <ul class="device-authorization-items device-authorization-by-device">
        ${overview.devices
          .map(
            ({ device, authorized }) => `
              <li class="${authorized.length ? "" : "is-missing"}" data-device-authorization-device="${device.id}">
                <span>
                  <strong>${escapeHtml(deviceLabel(device))}</strong>
                  <small>${escapeHtml(device.category)}${
                    device.currentInventory ? "" : " · nicht mehr im Bestand"
                  }</small>
                </span>
                <span class="device-authorization-people">${
                  authorized.length
                    ? authorized
                        .map(({ employee, date }) => {
                          const officer = {
                            isEmployed: employee.active && isEmployedOn(employee, todayIso()),
                            isCurrentOfficer: Boolean(
                              employee.qualifications?.medizinproduktebeauftragter,
                            ),
                          };
                          const note = deviceAuthorizationEmployeeNote(officer);
                          return `<span class="device-authorization-person ${
                            officer.isEmployed ? "" : "is-former"
                          }" title="Herstellereinweisung am ${formatDate(date)}${
                            note ? ` · ${note}` : ""
                          }">${escapeHtml(fullName(employee))}</span>`;
                        })
                        .join("")
                    : '<span class="device-authorization-none">Keine einweisungsberechtigte Person</span>'
                }</span>
              </li>
            `,
          )
          .join("")}
      </ul>
    `;
  }
