  function renderWeekendDistribution() {
    elements.weekendDistributionContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendDistributionContent);
  }

  function renderWeekendOverview() {
    elements.weekendOverviewContent.innerHTML = renderWeekendDistributionMarkup();
    bindWeekendDistributionActions(elements.weekendOverviewContent, true);
  }

  function renderWeekendDistributionMarkup() {
    const distribution = getWeekendDistributionData();
    const keys = ["weekend_a", "weekend_b", "none"];
    const weekendA = distribution.weekend_a.metrics;
    const weekendB = distribution.weekend_b.metrics;
    const comparisonRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Stellenanteil kumuliert", "employmentPercent", (value) => `${value} %`],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];

    return `
      <section class="panel weekend-comparison-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Kumulativer Vergleich</p>
            <h2>Struktur der Dienstwochenenden</h2>
          </div>
          <span class="weekend-comparison-note">
            ${escapeHtml(serviceWeekendLabel("weekend_a"))} ↔ ${escapeHtml(serviceWeekendLabel("weekend_b"))}: ${Math.abs(weekendA.employmentPercent - weekendB.employmentPercent)} %
            Unterschied beim Stellenanteil
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th scope="col">Kennzahl</th>
                ${keys
                  .map(
                    (key) =>
                      `<th scope="col">${escapeHtml(serviceWeekendLabel(key))}</th>`,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${comparisonRows
                .map(
                  ([label, property, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      ${keys
                        .map((key) => {
                          const metrics = distribution[key].metrics;
                          const share =
                            ["fachweiterbildung", "praxisanleiter", "onboarding"].includes(
                              property,
                            ) && metrics.headcount
                              ? ` <small>(${percentage(
                                  metrics[property],
                                  metrics.headcount,
                                )} %)</small>`
                              : "";
                          return `<td><strong>${escapeHtml(
                            formatter(metrics[property]),
                          )}</strong>${share}</td>`;
                        })
                        .join("")}
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-group-grid weekend-distribution-groups">
        ${keys
          .map((key) => {
            const group = distribution[key];
            return `
              <section class="panel weekend-distribution-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Festes Dienstwochenende</p>
                    <h2>${escapeHtml(serviceWeekendLabel(key))}</h2>
                  </div>
                  <button
                    class="button button-ghost button-compact"
                    type="button"
                    data-filter-weekend="${key}"
                  >
                    In Mitarbeiterliste
                  </button>
                </div>
                <div class="weekend-group-metrics">
                  <span><strong>${group.metrics.headcount}</strong> Personen</span>
                  <span><strong>${group.metrics.employmentPercent} %</strong> Stellenanteil</span>
                  <span><strong>${formatDecimal(group.metrics.fte)}</strong> VZÄ</span>
                </div>
                <div class="weekend-distribution-list">
                  ${
                    group.employees
                      .map((employee) => renderWeekendEmployee(employee))
                      .join("") ||
                    '<p class="field-hint">Keine aktiven Mitarbeiter zugeordnet.</p>'
                  }
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function getWeekendDistributionData() {
    const groups = Object.fromEntries(
      Object.keys(SERVICE_WEEKENDS).map((key) => [key, []]),
    );
    activeEmployeeList()
      .sort(sortEmployees)
      .forEach((employee) => groups[employee.serviceWeekend].push(employee));

    return Object.fromEntries(
      Object.entries(groups).map(([key, employees]) => {
        const employmentPercent = employees.reduce(
          (sum, employee) => sum + currentEmploymentPercent(employee),
          0,
        );
        return [
          key,
          {
            employees,
            metrics: {
              headcount: employees.length,
              employmentPercent,
              fte: employmentPercent / 100,
              onboarding: employees.filter(
                (employee) => employee.employmentStatus === "onboarding",
              ).length,
              fachweiterbildung: employees.filter(
                (employee) =>
                  hasCurrentQualification(employee, "fachweiterbildungIA"),
              ).length,
              praxisanleiter: employees.filter(
                (employee) => hasCurrentQualification(employee, "praxisanleiter"),
              ).length,
            },
          },
        ];
      }),
    );
  }

  function renderWeekendEmployee(employee) {
    const fachweiterbildung = getQualificationDisplayState(
      employee,
      "fachweiterbildungIA",
    );
    const praxisanleiter = getQualificationDisplayState(
      employee,
      "praxisanleiter",
    );
    return `
      <button
        class="weekend-distribution-employee"
        type="button"
        data-weekend-employee="${employee.id}"
      >
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${escapeHtml(employeeStatusLabel(employee))}${
              serviceWeekendOwnerKey(employee.id)
                ? " · Verantwortliche Person"
                : ""
            }</small>
          </span>
        </span>
        <strong class="weekend-employment-percent">${currentEmploymentPercent(employee)} %</strong>
        <span class="weekend-qualification-state ${fachweiterbildung.className}"
          title="Fachweiterbildung I/A: ${fachweiterbildung.title}">
          ${fachweiterbildung.symbol} FWB I/A
        </span>
        <span class="weekend-qualification-state ${praxisanleiter.className}"
          title="Praxisanleiter/in: ${praxisanleiter.title}">
          ${praxisanleiter.symbol} PA
        </span>
      </button>
    `;
  }

  function hasCurrentQualification(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) return false;
    const expiry = employee.qualificationExpiries[qualificationId];
    return !expiry || expiry >= todayIso();
  }

  function getQualificationDisplayState(employee, qualificationId) {
    if (!employee.qualifications[qualificationId]) {
      return { symbol: "×", className: "", title: "nicht vorhanden" };
    }
    if (!hasCurrentQualification(employee, qualificationId)) {
      return { symbol: "!", className: "is-expired", title: "abgelaufen" };
    }
    return { symbol: "✓", className: "is-qualified", title: "vorhanden" };
  }

  function bindWeekendDistributionActions(container, closeDialog = false) {
    container
      .querySelectorAll("[data-filter-weekend]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          employeeWeekendFilter = button.dataset.filterWeekend;
          if (closeDialog) elements.weekendOverviewDialog.close();
          showView("employees");
          renderEmployees();
        }),
      );
    container
      .querySelectorAll("[data-weekend-employee]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          openEmployeeDossier(button.dataset.weekendEmployee),
        ),
      );
  }

  function printWeekendOverview() {
    document.body.classList.add("print-weekend-overview");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-weekend-overview"), 0);
  }
