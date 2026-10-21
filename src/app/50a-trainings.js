  // Pflichtfortbildungen und freiwillige Fortbildungen teilen sich eine
  // Ansicht; welche Art sie zeigt, entscheidet der Menuepunkt.
  const VOLUNTARY_TRAININGS_VIEW = "voluntary-trainings";
  const TRAINING_KIND_TEXT = {
    mandatory: {
      title: "Pflichtfortbildungen",
      subtitle: "Pflichtfortbildungen anlegen und absolvierte Nachweise dokumentieren.",
      emptyTitle: "Noch keine Pflichtfortbildungen",
      emptyYearTitle: (year) => `Bis ${year} keine Pflichtfortbildungen`,
      openLabel: "offene Nachweise",
      matrixTitle: "Status der Pflichtfortbildungen",
      matrixSummary: "Pflichten zum Jahresende erfüllt",
      done: "erfüllt",
      csvName: "teo-pflichtfortbildungen",
    },
    voluntary: {
      title: "Fortbildungen",
      subtitle:
        "Freiwillige Fortbildungen und ihre Teilnahmen dokumentieren – sie zählen nicht zu den Pflichtfortbildungen.",
      emptyTitle: "Noch keine Fortbildungen",
      emptyYearTitle: (year) => `Bis ${year} keine Fortbildungen`,
      openLabel: "ohne aktuellen Nachweis",
      matrixTitle: "Teilnahme an Fortbildungen",
      matrixSummary: "Teilnahmen zum Jahresende gültig",
      done: "teilgenommen",
      csvName: "teo-fortbildungen",
    },
  };

  function trainingViewMandatory() {
    return activeView !== VOLUNTARY_TRAININGS_VIEW;
  }

  function trainingKindText(mandatory = trainingViewMandatory()) {
    return TRAINING_KIND_TEXT[mandatory ? "mandatory" : "voluntary"];
  }

  function trainingsOfKind(mandatory) {
    return state.trainings.filter((training) => isMandatoryTraining(training) === mandatory);
  }

  function renderTrainings() {
    const mandatory = trainingViewMandatory();
    const text = trainingKindText(mandatory);
    const kindTrainings = trainingsOfKind(mandatory);
    elements.trainingsViewTitle.textContent = text.title;
    elements.trainingsViewSubtitle.textContent = text.subtitle;
    const availableYears = getTrainingDisplayYears(kindTrainings);
    if (!availableYears.includes(trainingDisplayYear)) {
      trainingDisplayYear = new Date().getFullYear();
    }
    elements.trainingDisplayYear.innerHTML = availableYears
      .map(
        (year) =>
          `<option value="${year}" ${year === trainingDisplayYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");

    const displayedTrainings = trainingCatalog(mandatory).filter(
      (training) => training.year <= trainingDisplayYear,
    );
    const activeCount = employedActiveEmployees().length;
    const totalAssignments = activeCount * displayedTrainings.length;
    const currentAssignments = displayedTrainings.reduce(
      (sum, training) => sum + getTrainingStats(training).current,
      0,
    );
    const openAssignments = Math.max(0, totalAssignments - currentAssignments);

    elements.trainingSummary.innerHTML = `
      ${renderSummaryChip("training", displayedTrainings.length, `im Katalog ${trainingDisplayYear}`)}
      ${renderSummaryChip("check", currentAssignments, "aktuelle Nachweise", "teal")}
      ${renderSummaryChip("alert", openAssignments, text.openLabel, mandatory ? "orange" : "blue")}
    `;
    elements.openTrainingMatrixButton.disabled = kindTrainings.length === 0;

    if (kindTrainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: text.emptyTitle,
            text: "Legen Sie eine Fortbildung an und erfassen Sie anschließend die absolvierten Nachweise aktiver Mitarbeiter.",
            buttonText: "Erste Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    if (displayedTrainings.length === 0) {
      elements.trainingList.innerHTML = `
        <section class="panel">
          ${renderEmptyState({
            title: text.emptyYearTitle(trainingDisplayYear),
            text: "Wählen Sie ein späteres Jahr oder ergänzen Sie den Fortbildungskatalog.",
            buttonText: "Fortbildung anlegen",
            buttonAttribute: "data-empty-add-training",
          })}
        </section>
      `;
      elements.trainingList
        .querySelector("[data-empty-add-training]")
        ?.addEventListener("click", () => openTrainingDialog());
      return;
    }

    elements.trainingList.innerHTML = groupTrainingsByYear(displayedTrainings)
      .map(
        ([year, trainings]) => `
          <section class="training-year-group" aria-labelledby="trainingYear${year}">
            <div class="training-year-header">
              <div>
                <p class="eyebrow">Im Katalog seit</p>
                <h2 id="trainingYear${year}">${year}</h2>
              </div>
              <span>${trainings.length} Fortbildung${trainings.length === 1 ? "" : "en"}</span>
            </div>
            <div class="training-year-items">
              ${trainings.map(renderTrainingCard).join("")}
            </div>
          </section>
        `,
      )
      .join("");
  }

  function getTrainingDisplayYears(trainings = state.trainings) {
    return [
      ...new Set([
        new Date().getFullYear(),
        ...trainings.map((training) => Number(training.year)),
      ]),
    ]
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
      .sort((yearA, yearB) => yearB - yearA);
  }

  function formatMinutesAsHoursAndMinutes(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function formatSecondsAsMinutesAndSeconds(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatSecondsAsRoundedMinutes(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const roundedMinutes = Math.round(safeSeconds / 60);
    return `${roundedMinutes} Minute${roundedMinutes === 1 ? "" : "n"}`;
  }

  function openTrainingTimeCalculator() {
    elements.timeSpanList.innerHTML = Array.from({ length: 20 }, (_, index) => `
      <div class="time-span-row">
        <span>${index + 1}.</span>
        <label>
          <span class="sr-only">Minuten der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-minutes placeholder="0" />
          <small>Min.</small>
        </label>
        <span aria-hidden="true">:</span>
        <label>
          <span class="sr-only">Sekunden der Zeitspanne ${index + 1}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-time-seconds placeholder="00" />
          <small>Sek.</small>
        </label>
      </div>
    `).join("");

    const configuredTrainings = state.trainings
      .filter((training) => Number.isInteger(training.targetMinutes) && training.targetMinutes > 0)
      .sort(
        (trainingA, trainingB) =>
          trainingA.title.localeCompare(trainingB.title, "de") ||
          trainingB.year - trainingA.year,
      );
    elements.creditedTrainingTimeList.innerHTML = configuredTrainings.length
      ? configuredTrainings
          .map(
            (training) => `
              <label class="credited-training-time-row">
                <span>
                  <strong>${escapeHtml(training.title)}</strong>
                  <small>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</small>
                </span>
                <span class="input-suffix">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-credited-training-minutes
                    data-training-id="${training.id}"
                    aria-label="Anrechenbare Minuten für ${escapeHtml(training.title)}"
                  />
                  <span>Min.</span>
                </span>
              </label>
            `,
          )
          .join("")
      : `<div class="time-calculator-empty">
          <strong>Keine Soll-Zeiten hinterlegt</strong>
          <p>Unter Einstellungen → Fortbildungen können Sie Soll-Zeiten in Minuten eintragen.</p>
        </div>`;

    updateTimeSpanTotal();
    updateCreditedTrainingTimeTotal();
    elements.trainingTimeCalculatorDialog.showModal();
    window.setTimeout(() => elements.timeSpanList.querySelector("input")?.focus(), 0);
  }

  function updateTimeSpanTotal() {
    const rows = [...elements.timeSpanList.querySelectorAll(".time-span-row")];
    const totalSeconds = rows.reduce((sum, row) => {
      const minutes = Math.max(
        0,
        Number(row.querySelector("[data-time-minutes]").value) || 0,
      );
      const seconds = Math.max(
        0,
        Number(row.querySelector("[data-time-seconds]").value) || 0,
      );
      return sum + Math.round(minutes * 60 + seconds);
    }, 0);
    elements.timeSpanTotalRoundedMinutes.textContent =
      formatSecondsAsRoundedMinutes(totalSeconds);
    elements.timeSpanTotalFormatted.value = formatSecondsAsMinutesAndSeconds(totalSeconds);
  }

  function updateCreditedTrainingTimeTotal() {
    const totalMinutes = [...elements.creditedTrainingTimeList.querySelectorAll(
      "[data-credited-training-minutes]",
    )].reduce((sum, input) => {
      const minutes = Math.max(0, Math.round(Number(input.value) || 0));
      return sum + minutes;
    }, 0);
    elements.creditedTrainingTotalMinutes.textContent = `${totalMinutes} Minute${totalMinutes === 1 ? "" : "n"}`;
    elements.creditedTrainingTotalFormatted.value = formatMinutesAsHoursAndMinutes(totalMinutes);
  }

  function groupTrainingsByYear(trainings = state.trainings) {
    const groups = new Map();
    trainings.forEach((training) => {
      if (!groups.has(training.year)) groups.set(training.year, []);
      groups.get(training.year).push(training);
    });

    return [...groups.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, trainings]) => [
        year,
        trainings.sort((a, b) => a.title.localeCompare(b.title, "de")),
      ]);
  }

  function openTrainingMatrixDialog() {
    trainingMatrixMandatory = trainingViewMandatory();
    const years = getTrainingEvaluationYears(trainingMatrixMandatory);
    if (years.length === 0) {
      showToast("Für die Auswertung sind noch keine Fortbildungen vorhanden.", "error");
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = years.includes(currentYear) ? currentYear : years[0];
    elements.trainingMatrixYear.innerHTML = years
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`,
      )
      .join("");
    renderTrainingRateHistory(years);
    renderTrainingMatrix();
    elements.trainingMatrixDialog.showModal();
  }

  function renderTrainingRateHistory(
    years = getTrainingEvaluationYears(trainingMatrixMandatory),
  ) {
    const annualRates = [...years]
      .sort((yearA, yearB) => yearA - yearB)
      .map((year) => ({
        year,
        rate: getAnnualTrainingMatrix(year, trainingMatrixMandatory).completionRate,
      }));
    elements.trainingRateHistoryChart.innerHTML = annualRates.length
      ? `<div class="training-rate-chart" role="img" aria-label="${escapeHtml(
          annualRates.map(({ year, rate }) => `${year}: ${rate} Prozent`).join(", "),
        )}">
          ${annualRates
            .map(
              ({ year, rate }) => `
                <div class="training-rate-bar-row">
                  <strong>${year}</strong>
                  <div class="training-rate-bar-track" aria-hidden="true">
                    <span${dynamicStyle({ "--training-rate": `${rate}%` })}></span>
                  </div>
                  <span>${rate}&thinsp;%</span>
                </div>
              `,
            )
            .join("")}
        </div>`
      : '<p class="training-rate-chart-empty">Noch keine Jahresdaten vorhanden.</p>';
  }

  function renderTrainingMatrix() {
    const year = Number(elements.trainingMatrixYear.value);
    const mandatory = trainingMatrixMandatory;
    const text = trainingKindText(mandatory);
    const matrix = getAnnualTrainingMatrix(year, mandatory);
    elements.trainingMatrixDialogTitle.textContent = `${text.matrixTitle} · ${year}`;
    elements.trainingRateHistorySummary.textContent = mandatory
      ? "Verlauf der Pflichtfortbildungsquote nach Jahren"
      : "Verlauf der Teilnahmequote nach Jahren";
    elements.trainingMatrixSummary.innerHTML = `
      <strong>${matrix.completedAssignments} von ${matrix.totalAssignments}</strong>
      <span>${text.matrixSummary} · ${matrix.completionRate}&thinsp;%</span>
    `;

    if (matrix.employees.length === 0) {
      elements.trainingMatrixContent.innerHTML = renderEmptyState({
        title: "Keine aktiven Mitarbeiter",
        text: "Für die Jahresauswertung wird mindestens ein aktiver Mitarbeiter benötigt.",
        compact: true,
      });
      return;
    }

    elements.trainingMatrixContent.innerHTML = `
      <div
        class="training-matrix-horizontal-scroll"
        tabindex="0"
        aria-label="Fortbildungsspalten horizontal scrollen"
      >
        <div class="training-matrix-horizontal-spacer"></div>
      </div>
      <div class="training-matrix-scroll" tabindex="0" aria-label="Fortbildungsmatrix ${year}">
        <table class="training-matrix-table">
          <thead>
            <tr>
              <th scope="col">Aktive Mitarbeiter</th>
              ${matrix.trainingColumns
                .map(
                  ({ training, completedCount, completionRate }) => `
                    <th scope="col" title="${escapeHtml(training.title)}">
                      <span>${escapeHtml(training.title)}</span>
                      <small
                        class="completion-progress ${completionProgressTone(completionRate)}"
                        title="${completedCount} von ${matrix.employees.length} aktiven Mitarbeitern ${
                          mandatory ? "erfüllen diese Pflicht" : "haben zum Jahresende einen gültigen Nachweis"
                        }"
                      >
                        ${completionRate}&thinsp;% ${text.done}
                      </small>
                    </th>
                  `,
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${matrix.rows
              .map(
                (row) => `
                  <tr>
                    <th scope="row">
                      <button
                        class="training-matrix-employee-link"
                        type="button"
                        data-training-matrix-employee="${row.employee.id}"
                        title="Mitarbeiter-Akte von ${escapeHtml(fullName(row.employee))} öffnen"
                      >${escapeHtml(fullName(row.employee))}</button>
                    </th>
                    ${row.statuses
                      .map(
                        ({ training, completed, coveredBy }) => {
                          const description = coveredBy
                            ? `durch ${coveredBy} abgedeckt`
                            : completed
                              ? `für das Auswertungsjahr ${text.done}`
                              : mandatory
                                ? "offen"
                                : "ohne Nachweis";
                          return `
                          <td>
                            <span
                              class="matrix-status ${completed ? "matrix-complete" : "matrix-open"}"
                              role="img"
                              aria-label="${escapeHtml(
                                `${fullName(row.employee)}: ${training.title} ${description}`,
                              )}"
                              title="${escapeHtml(
                                coveredBy
                                  ? `Durch ${coveredBy} abgedeckt`
                                  : completed
                                    ? `Für das Auswertungsjahr ${text.done}`
                                    : mandatory
                                      ? "Zum Jahresende offen"
                                      : "Kein gültiger Nachweis zum Jahresende",
                              )}"
                            >${completed ? "✓" : mandatory ? "×" : "–"}</span>
                          </td>
                        `;
                        },
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    elements.trainingMatrixContent
      .querySelectorAll("[data-training-matrix-employee]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          elements.trainingMatrixDialog.close();
          openEmployeeDossier(button.dataset.trainingMatrixEmployee);
        }),
      );
    bindTrainingMatrixScrollers();
  }

  function bindTrainingMatrixScrollers() {
    const horizontalScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-horizontal-scroll",
    );
    const matrixScroll = elements.trainingMatrixContent.querySelector(
      ".training-matrix-scroll",
    );
    const spacer = horizontalScroll?.querySelector(
      ".training-matrix-horizontal-spacer",
    );
    if (!horizontalScroll || !matrixScroll || !spacer) return;

    let syncing = false;
    const synchronize = (source, target) => {
      if (syncing) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };
    horizontalScroll.addEventListener("scroll", () =>
      synchronize(horizontalScroll, matrixScroll),
    );
    matrixScroll.addEventListener("scroll", () =>
      synchronize(matrixScroll, horizontalScroll),
    );

    window.requestAnimationFrame(() => {
      spacer.style.width = `${matrixScroll.scrollWidth}px`;
      horizontalScroll.hidden =
        matrixScroll.scrollWidth <= matrixScroll.clientWidth + 1;
      horizontalScroll.scrollLeft = matrixScroll.scrollLeft;
    });
  }

  function printTrainingMatrix() {
    if (!elements.trainingMatrixDialog.open) return;
    window.print();
  }

  function exportTrainingMatrixCsv() {
    const year = Number(elements.trainingMatrixYear.value);
    const mandatory = trainingMatrixMandatory;
    const matrix = getAnnualTrainingMatrix(year, mandatory);
    if (!matrix.employees.length || !matrix.trainings.length) {
      showToast("Für dieses Jahr sind keine auswertbaren Fortbildungsdaten vorhanden.", "error");
      return;
    }
    const done = mandatory ? "Erfüllt" : "Teilgenommen";

    downloadCsv(
      `${trainingKindText(mandatory).csvName}_${year}.csv`,
      ["Mitarbeiter", ...matrix.trainings.map((training) => training.title)],
      matrix.rows.map((row) => [
        fullName(row.employee),
        ...row.statuses.map(({ completed, coveredBy }) =>
          coveredBy ? `${done} (${coveredBy})` : completed ? done : "Offen",
        ),
      ]),
    );
  }

  // Die Jahresauswertung der Pflichten ist Grundlage der Quote im Dashboard;
  // freiwillige Fortbildungen werten dieselbe Rechnung getrennt aus.
  function getAnnualTrainingMatrix(year, mandatory = true) {
    const referenceDate = `${year}-12-31`;
    const trainings = trainingCatalog(mandatory)
      .filter((training) => training.year <= year)
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    // Erwartet wird, wer zum Stichtag des Jahres beschäftigt ist: Wer im
    // Herbst eintritt, gilt für dieses Jahr schon als verpflichtet, wer im
    // Frühjahr ausgetreten ist, nicht mehr.
    const employees = employedActiveEmployees(trainingReferenceDate(year)).sort(sortEmployees);
    let completedAssignments = 0;
    const completedPerTraining = trainings.map(() => 0);
    const rows = employees.map((employee) => ({
      employee,
      statuses: trainings.map((training, trainingIndex) => {
        const latest = latestCompletionForTraining(
          employee.id,
          training,
          referenceDate,
        );
        const completedByProof = Boolean(
          latest &&
            (!training.recurrenceMonths ||
              addMonths(latest.completedOn, training.recurrenceMonths) >= referenceDate),
        );
        const coveredBy =
          !completedByProof &&
          isTrainingCoveredByQualification(employee.id, training, year)
            ? trainingCoverageQualificationLabel(training)
            : "";
        const completed = completedByProof || Boolean(coveredBy);
        if (completed) {
          completedAssignments += 1;
          completedPerTraining[trainingIndex] += 1;
        }
        return { training, completed, coveredBy, completion: latest || null };
      }),
    }));
    const totalAssignments = employees.length * trainings.length;

    return {
      year,
      trainings,
      // Je Fortbildung, wie viele der aktiven Mitarbeiter sie zum Jahresende
      // erfuellt haben - Grundlage fuer den Komplettierungsgrad in der Spalte.
      trainingColumns: trainings.map((training, trainingIndex) => ({
        training,
        completedCount: completedPerTraining[trainingIndex],
        completionRate: percentage(completedPerTraining[trainingIndex], employees.length),
      })),
      employees,
      rows,
      completedAssignments,
      totalAssignments,
      completionRate: percentage(completedAssignments, totalAssignments),
    };
  }

  function getTrainingEvaluationYears(mandatory = true) {
    const currentYear = new Date().getFullYear();
    const trainings = trainingsOfKind(mandatory);
    if (!trainings.length) return [];
    const trainingYears = trainings
      .map((training) => Number(training.year))
      .filter(Number.isInteger);
    const completionYears = [];
    const trainingIds = new Set(trainings.map((training) => training.id));
    state.completions.forEach((completion) => {
      if (!trainingIds.has(completion.trainingId)) return;
      const completionYear = Number(completion.completedOn.slice(0, 4));
      if (Number.isInteger(completionYear)) completionYears.push(completionYear);
    });
    const firstYear = trainingYears.length
      ? Math.min(...trainingYears)
      : completionYears.length
        ? Math.min(...completionYears)
        : currentYear;
    const lastYear = Math.max(currentYear, ...trainingYears, ...completionYears);
    const years = new Set();
    for (let year = firstYear; year <= lastYear; year += 1) years.add(year);
    return [...years].sort((a, b) => b - a);
  }

  function renderSummaryChip(icon, value, label, tone = "blue") {
    const tones = {
      teal: "summary-chip-icon-teal",
      orange: "summary-chip-icon-orange",
      blue: "",
    };

    return `
      <article class="summary-chip">
        <span class="summary-chip-icon ${tones[tone] || ""}">
          <svg><use href="#icon-${icon}"></use></svg>
        </span>
        <span>
          <strong>${value}</strong>
          <small>${label}</small>
        </span>
      </article>
    `;
  }

  function renderTrainingCard(training) {
    const stats = getTrainingStats(training);
    const activeCount = employedActiveEmployees().length;
    const history = state.completions
      .filter((completion) => completionMatchesTraining(completion, training))
      .sort(
        (a, b) =>
          b.completedOn.localeCompare(a.completedOn) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );

    return `
      <article class="training-card">
        <div class="training-card-main">
          <div class="training-title-row">
            <span class="training-icon">
              <svg><use href="#icon-training"></use></svg>
            </span>
            <div>
              <h2>${escapeHtml(training.title)}</h2>
              <p>${escapeHtml(training.description || "Keine Beschreibung hinterlegt.")}</p>
              <span class="training-meta">
                <svg><use href="#icon-calendar"></use></svg>
                ${recurrenceLabel(training)}
              </span>
              ${
                trainingCoverageQualificationId(training)
                  ? `<span class="training-meta"><svg><use href="#icon-check"></use></svg>Gilt als absolviert, solange „${escapeHtml(trainingCoverageQualificationLabel(training))}“ gültig ist</span>`
                  : ""
              }
              ${
                training.targetMinutes
                  ? `<span class="training-meta"><svg><use href="#icon-chart"></use></svg>Soll-Zeit: ${training.targetMinutes} Minuten (${formatMinutesAsHoursAndMinutes(training.targetMinutes)})</span>`
                  : ""
              }
            </div>
          </div>
          <div class="training-progress-block">
            <strong>
              <span>Aktueller Stand</span>
              <span>${activeCount ? `${stats.current} von ${activeCount}` : "Kein aktives Personal"}</span>
            </strong>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="${escapeHtml(training.title)}: ${stats.percent} Prozent abgeschlossen"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${stats.percent}"
            >
              <div class="progress-bar"${dynamicStyle({ "--progress": `${stats.percent}%` })}></div>
            </div>
            <small>${
              isMandatoryTraining(training)
                ? `${stats.open} Nachweis${stats.open === 1 ? "" : "e"} offen`
                : `${stats.open} ohne aktuellen Nachweis`
            }</small>
          </div>
          <div class="training-actions">
            <button
              class="button button-secondary"
              type="button"
              data-action="add-completion"
              data-id="${training.id}"
            >
              <svg><use href="#icon-check"></use></svg>
              Abschluss
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="edit-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} bearbeiten"
              title="Bearbeiten"
            >
              <svg><use href="#icon-edit"></use></svg>
            </button>
            <button
              class="icon-button danger"
              type="button"
              data-action="delete-training"
              data-id="${training.id}"
              aria-label="${escapeHtml(training.title)} löschen"
              title="Löschen"
            >
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <details class="training-card-details">
          <summary>${history.length} erfasste${history.length === 1 ? "r" : ""} Nachweis${
            history.length === 1 ? "" : "e"
          }${training.recurrenceMonths ? " in dieser Fortbildungsreihe" : ""}</summary>
          <div class="completion-history">
            ${
              history.length
                ? history.map((completion) => renderCompletionRow(completion, training)).join("")
                : '<p class="completion-empty">Für diese Fortbildung wurde noch kein Abschluss erfasst.</p>'
            }
          </div>
        </details>
      </article>
    `;
  }

  function renderCompletionRow(completion, training) {
    const employee = getEmployee(completion.employeeId);
    if (!employee) return "";

    const validity = training.recurrenceMonths
      ? `gültig bis ${formatDate(addMonths(completion.completedOn, training.recurrenceMonths))}`
      : "ohne Ablauf";

    return `
      <div class="completion-row">
        <div class="completion-person">
          ${renderAvatar(employee, true)}
          <strong>${escapeHtml(fullName(employee))}</strong>
        </div>
        <span>${formatDate(completion.completedOn)}</span>
        <span title="${escapeHtml(completion.note || validity)}">${escapeHtml(
          completion.note || validity,
        )}</span>
        <button
          class="icon-button danger"
          type="button"
          data-action="delete-completion"
          data-id="${completion.id}"
          aria-label="Nachweis von ${escapeHtml(fullName(employee))} löschen"
          title="Nachweis löschen"
        >
          <svg><use href="#icon-trash"></use></svg>
        </button>
      </div>
    `;
  }
