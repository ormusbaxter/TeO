  function openWeekendOverviewDialog() {
    renderWeekendOverview();
    elements.weekendOverviewDialog.showModal();
  }

  function openWeekendSimulationDialog() {
    renderWeekendSimulation();
    elements.weekendSimulationDialog.showModal();
  }

  function renderWeekendSimulation() {
    const simulation = simulateWeekendDistribution();
    currentWeekendSimulation = simulation;
    if (simulation.employeeCount === 0) {
      elements.weekendSimulationContent.innerHTML = renderEmptyState({
        title: "Keine festen Wochenendzuordnungen",
        text: "Für die Simulation werden aktive Mitarbeiter mit einem bereits fest zugewiesenen Dienstwochenende benötigt.",
        compact: true,
      });
      return;
    }

    const metricRows = [
      ["Mitarbeiter", "headcount", (value) => String(value)],
      ["Vollzeitäquivalente", "fte", (value) => formatDecimal(value)],
      ["In Einarbeitung", "onboarding", (value) => String(value)],
      ["Fachweiterbildung I/A", "fachweiterbildung", (value) => String(value)],
      ["Praxisanleiter/in", "praxisanleiter", (value) => String(value)],
    ];
    const changedAssignments = simulation.assignments.filter(
      (assignment) => assignment.changeType !== "unchanged",
    );
    const improvement = Math.max(
      0,
      Math.round(
        ((simulation.currentBalanceScore - simulation.proposedBalanceScore) /
          Math.max(simulation.currentBalanceScore, 0.0001)) *
          100,
      ),
    );

    elements.weekendSimulationContent.innerHTML = `
      <div class="weekend-simulation-summary">
        <article>
          <span>Bestehende Wechsel</span>
          <strong>${simulation.switchedCount}</strong>
          <small>von ${simulation.fixedAssignmentCount} festen Zuordnungen</small>
        </article>
        <article>
          <span>Nicht zugeordnet</span>
          <strong>${simulation.unassignedCount}</strong>
          <small>bleiben ohne festes Wochenende</small>
        </article>
        <article>
          <span>Struktureller Ausgleich</span>
          <strong>${improvement} %</strong>
          <small>Verbesserung der gewichteten Abweichung</small>
        </article>
      </div>

      <section class="panel weekend-simulation-comparison">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ist und Simulation</p>
            <h3>Kennzahlenvergleich</h3>
          </div>
          <span class="weekend-comparison-note">
            VZÄ, Kopfzahl, Einarbeitung und Schlüsselqualifikationen werden gemeinsam gewichtet.
          </span>
        </div>
        <div class="weekend-comparison-scroll">
          <table class="weekend-comparison-table">
            <thead>
              <tr>
                <th rowspan="2">Kennzahl</th>
                <th colspan="2">Aktuell</th>
                <th colspan="2">Simulation</th>
              </tr>
              <tr>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_a"))}</th>
                <th>${escapeHtml(serviceWeekendLabel("weekend_b"))}</th>
              </tr>
            </thead>
            <tbody>
              ${metricRows
                .map(
                  ([label, key, formatter]) => `
                    <tr>
                      <th scope="row">${escapeHtml(label)}</th>
                      <td><strong>${formatter(simulation.current.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.current.weekend_b[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_a[key])}</strong></td>
                      <td><strong>${formatter(simulation.proposed.weekend_b[key])}</strong></td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <div class="weekend-simulation-groups">
        ${SERVICE_WEEKEND_KEYS
          .map((weekend) => {
            const assignments = simulation.assignments.filter(
              (assignment) => assignment.proposedWeekend === weekend,
            );
            return `
              <section class="panel weekend-simulation-group">
                <div class="weekend-distribution-header">
                  <div>
                    <p class="eyebrow">Simulierte Zuordnung</p>
                    <h2>${escapeHtml(serviceWeekendLabel(weekend))}</h2>
                  </div>
                  <strong>${assignments.length} Personen</strong>
                </div>
                <div class="weekend-simulation-list">
                  ${assignments.map(renderWeekendSimulationEmployee).join("")}
                </div>
              </section>
            `;
          })
          .join("")}
      </div>

      <section class="panel weekend-simulation-changes">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Minimale Veränderung</p>
            <h3>Abweichungen von der heutigen Zuordnung</h3>
          </div>
        </div>
        ${
          changedAssignments.length
            ? `<div class="weekend-simulation-change-list">
                ${changedAssignments
                  .map(
                    ({ employee, originalWeekend, proposedWeekend }) => `
                      <div>
                        <strong>${escapeHtml(fullName(employee))}</strong>
                        <span>${escapeHtml(serviceWeekendLabel(originalWeekend))} → ${escapeHtml(
                          serviceWeekendLabel(proposedWeekend),
                        )}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : '<p class="weekend-simulation-no-changes">Die bestehende feste Verteilung ist bereits die beste gefundene Lösung.</p>'
        }
      </section>
    `;
  }

  function requestApplyWeekendSimulation() {
    const simulation = currentWeekendSimulation;
    if (!simulation || simulation.employeeCount === 0) {
      showToast("Es liegt keine übernehmbare Simulation vor.", "error");
      return;
    }
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Mitarbeiterdaten haben sich verändert. Die Simulation wurde neu berechnet.",
        "error",
      );
      return;
    }
    const changedCount = simulation.switchedCount;
    if (changedCount === 0) {
      showToast("Die Simulation enthält keine geänderten Zuordnungen.");
      return;
    }

    requestConfirmation({
      title: "Wochenendverteilung übernehmen?",
      message:
        `${simulation.switchedCount} bestehende Zuordnung${
          simulation.switchedCount === 1 ? "" : "en"
        } werden zwischen den beiden Dienstwochenenden gewechselt. Mitarbeiter ohne festes Wochenende bleiben unberührt. Diese Änderung wird gespeichert.`,
      acceptLabel: "Verteilung übernehmen",
      tone: "primary",
      callback: () => applyWeekendSimulation(simulation),
    });
  }

  async function applyWeekendSimulation(simulation) {
    if (!weekendSimulationMatchesCurrentState(simulation)) {
      renderWeekendSimulation();
      showToast(
        "Die Ausgangsdaten haben sich geändert. Bitte prüfen Sie die neu berechnete Simulation.",
        "error",
      );
      return;
    }
    const proposedByEmployeeId = new Map(
      simulation.assignments.map((assignment) => [
        assignment.employee.id,
        assignment.proposedWeekend,
      ]),
    );
    const now = new Date().toISOString();
    const committed = await commitStateMutation(() => {
      state.employees.forEach((employee) => {
        const proposedWeekend = proposedByEmployeeId.get(employee.id);
        if (
          !SERVICE_WEEKEND_KEYS.includes(proposedWeekend) ||
          serviceWeekendOwnerKey(employee.id) ||
          employee.serviceWeekend === proposedWeekend
        ) {
          return;
        }
        employee.serviceWeekend = proposedWeekend;
        employee.updatedAt = now;
      });
    });
    if (!committed) return;

    currentWeekendSimulation = null;
    if (elements.weekendSimulationDialog.open) {
      elements.weekendSimulationDialog.close();
    }
    showToast(
      `Die simulierte Verteilung wurde für ${
        simulation.switchedCount
      } Mitarbeiter/innen übernommen.`,
    );
  }

  function weekendSimulationMatchesCurrentState(simulation) {
    const activeEmployees = activeEmployeeList().filter((employee) =>
      SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    );
    if (activeEmployees.length !== simulation.assignments.length) return false;
    const currentById = new Map(
      activeEmployees.map((employee) => [employee.id, employee]),
    );
    return simulation.assignments.every(
      ({ employee, originalWeekend, ownerWeekend }) => {
        const currentEmployee = currentById.get(employee.id);
        if (!currentEmployee) return false;
        const normalizedCurrentWeekend = SERVICE_WEEKEND_KEYS.includes(
          currentEmployee.serviceWeekend,
        )
          ? currentEmployee.serviceWeekend
          : "none";
        const currentOwnerWeekend = serviceWeekendOwnerKey(currentEmployee.id);
        return (
          normalizedCurrentWeekend === originalWeekend &&
          currentOwnerWeekend === ownerWeekend &&
          (!currentOwnerWeekend || currentOwnerWeekend === originalWeekend)
        );
      },
    );
  }

  function simulateWeekendDistribution(employees = activeEmployeeList()) {
    const unassignedCount = employees.filter(
      (employee) => !SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
    ).length;
    const candidates = employees
      .filter((employee) =>
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend),
      )
      .sort(sortEmployees);
    const originalAssignments = new Map(
      candidates.map((employee) => [
        employee.id,
        SERVICE_WEEKEND_KEYS.includes(employee.serviceWeekend)
          ? employee.serviceWeekend
          : "none",
      ]),
    );
    const assignments = new Map();
    candidates.forEach((employee) => {
      const original = originalAssignments.get(employee.id);
      if (original !== "none") assignments.set(employee.id, original);
    });

    let evaluation = evaluateWeekendSimulation(
      candidates,
      assignments,
      originalAssignments,
    );
    for (let iteration = 0; iteration < 100; iteration += 1) {
      let bestAction = null;
      let bestEvaluation = evaluation;

      candidates.forEach((employee) => {
        if (serviceWeekendOwnerKey(employee.id)) return;
        const currentWeekend = assignments.get(employee.id);
        assignments.set(
          employee.id,
          currentWeekend === "weekend_a" ? "weekend_b" : "weekend_a",
        );
        const candidateEvaluation = evaluateWeekendSimulation(
          candidates,
          assignments,
          originalAssignments,
        );
        assignments.set(employee.id, currentWeekend);
        if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
          bestEvaluation = candidateEvaluation;
          bestAction = { type: "move", first: employee.id };
        }
      });

      for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < candidates.length;
          rightIndex += 1
        ) {
          const left = candidates[leftIndex];
          const right = candidates[rightIndex];
          if (
            serviceWeekendOwnerKey(left.id) ||
            serviceWeekendOwnerKey(right.id)
          ) {
            continue;
          }
          const leftWeekend = assignments.get(left.id);
          const rightWeekend = assignments.get(right.id);
          if (leftWeekend === rightWeekend) continue;
          assignments.set(left.id, rightWeekend);
          assignments.set(right.id, leftWeekend);
          const candidateEvaluation = evaluateWeekendSimulation(
            candidates,
            assignments,
            originalAssignments,
          );
          assignments.set(left.id, leftWeekend);
          assignments.set(right.id, rightWeekend);
          if (candidateEvaluation.score < bestEvaluation.score - 0.000001) {
            bestEvaluation = candidateEvaluation;
            bestAction = { type: "swap", first: left.id, second: right.id };
          }
        }
      }

      if (!bestAction) break;
      if (bestAction.type === "move") {
        assignments.set(
          bestAction.first,
          assignments.get(bestAction.first) === "weekend_a" ? "weekend_b" : "weekend_a",
        );
      } else {
        const firstWeekend = assignments.get(bestAction.first);
        assignments.set(bestAction.first, assignments.get(bestAction.second));
        assignments.set(bestAction.second, firstWeekend);
      }
      evaluation = bestEvaluation;
    }

    const currentGroups = {
      weekend_a: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_a",
      ),
      weekend_b: candidates.filter(
        (employee) => originalAssignments.get(employee.id) === "weekend_b",
      ),
    };
    const current = {
      weekend_a: weekendSimulationMetrics(currentGroups.weekend_a),
      weekend_b: weekendSimulationMetrics(currentGroups.weekend_b),
    };
    const resultAssignments = candidates
      .map((employee) => {
        const originalWeekend = originalAssignments.get(employee.id);
        const proposedWeekend = assignments.get(employee.id);
        return {
          employee,
          originalWeekend,
          proposedWeekend,
          ownerWeekend: serviceWeekendOwnerKey(employee.id),
          isWeekendOwner: Boolean(serviceWeekendOwnerKey(employee.id)),
          changeType:
            originalWeekend === proposedWeekend ? "unchanged" : "switched",
        };
      })
      .sort(
        (left, right) =>
          left.proposedWeekend.localeCompare(right.proposedWeekend) ||
          sortEmployees(left.employee, right.employee),
      );

    return {
      employeeCount: candidates.length,
      unassignedCount,
      fixedAssignmentCount: resultAssignments.filter(
        (assignment) => assignment.originalWeekend !== "none",
      ).length,
      switchedCount: resultAssignments.filter(
        (assignment) => assignment.changeType === "switched",
      ).length,
      newAssignmentCount: 0,
      current,
      proposed: evaluation.metrics,
      currentBalanceScore: weekendSimulationBalanceScore(current),
      proposedBalanceScore: evaluation.balanceScore,
      assignments: resultAssignments,
    };
  }

  function evaluateWeekendSimulation(
    employees,
    assignments,
    originalAssignments,
  ) {
    const groups = { weekend_a: [], weekend_b: [] };
    employees.forEach((employee) => {
      const weekend = assignments.get(employee.id);
      if (groups[weekend]) groups[weekend].push(employee);
    });
    const metrics = {
      weekend_a: weekendSimulationMetrics(groups.weekend_a),
      weekend_b: weekendSimulationMetrics(groups.weekend_b),
    };
    const switchedCount = employees.filter((employee) => {
      const original = originalAssignments.get(employee.id);
      return original !== "none" && original !== assignments.get(employee.id);
    }).length;
    const balanceScore = weekendSimulationBalanceScore(metrics);
    return {
      metrics,
      balanceScore,
      switchedCount,
      score: balanceScore + switchedCount * 0.75,
    };
  }

  function weekendSimulationMetrics(employees) {
    const employmentPercent = employees.reduce(
      (sum, employee) => sum + currentEmploymentPercent(employee),
      0,
    );
    return {
      headcount: employees.length,
      employmentPercent,
      fte: employmentPercent / 100,
      onboarding: employees.filter(
        (employee) => employee.employmentStatus === "onboarding",
      ).length,
      fachweiterbildung: employees.filter((employee) =>
        hasCurrentQualification(employee, "fachweiterbildungIA"),
      ).length,
      praxisanleiter: employees.filter((employee) =>
        hasCurrentQualification(employee, "praxisanleiter"),
      ).length,
    };
  }

  function weekendSimulationBalanceScore(metrics) {
    const difference = (key) =>
      Math.abs((metrics.weekend_a[key] || 0) - (metrics.weekend_b[key] || 0));
    return (
      difference("headcount") ** 2 +
      difference("fte") ** 2 * 2 +
      difference("onboarding") ** 2 * 1.5 +
      difference("fachweiterbildung") ** 2 * 1.5 +
      difference("praxisanleiter") ** 2 * 1.5
    );
  }

  function renderWeekendSimulationEmployee({
    employee,
    originalWeekend,
    changeType,
    isWeekendOwner,
  }) {
    const changeLabel = {
      unchanged: isWeekendOwner ? "verantwortlich" : "unverändert",
      switched: `von ${serviceWeekendLabel(originalWeekend)}`,
    }[changeType];
    return `
      <div class="weekend-simulation-employee">
        <span class="weekend-employee-identity">
          ${renderAvatar(employee, true)}
          <span>
            <strong>${escapeHtml(fullName(employee))}</strong>
            <small>${currentEmploymentPercent(employee)} % · ${escapeHtml(
              employeeStatusLabel(employee),
            )}</small>
          </span>
        </span>
        <span class="simulation-change-badge is-${changeType}">${escapeHtml(
          changeLabel,
        )}</span>
        <span>${hasCurrentQualification(employee, "fachweiterbildungIA") ? "FWB" : "–"}</span>
        <span>${hasCurrentQualification(employee, "praxisanleiter") ? "PA" : "–"}</span>
      </div>
    `;
  }
