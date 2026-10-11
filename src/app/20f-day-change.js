  // TeO bleibt auf Stationsrechnern oft tagelang geöffnet. Neu aufgebaut wird
  // eine Ansicht aber nur, wenn sich Daten ändern - nach Mitternacht stünden
  // Datum, Fristen, Abwesenheiten, Quoten und Stellenumfänge sonst auf dem
  // Vortag, bis jemand etwas speichert oder neu lädt. Deshalb wird jede Minute
  // und bei der Rückkehr zum Fenster nachgesehen, ob ein neuer Tag begonnen
  // hat.
  let displayedDay = "";

  function bindDayChange() {
    displayedDay = todayIso();
    window.setInterval(checkDayChange, 60 * 1000);
    document.addEventListener("visibilitychange", checkDayChange);
    window.addEventListener("focus", checkDayChange);
  }

  function checkDayChange() {
    // Ein verdecktes Fenster holt den Wechsel nach, sobald es wieder sichtbar
    // ist - visibilitychange ruft dann erneut.
    if (document.hidden) return;
    const today = todayIso();
    if (today === displayedDay) return;
    const previousYear = Number(displayedDay.slice(0, 4));
    const year = Number(today.slice(0, 4));
    displayedDay = today;
    // Wer das laufende Jahr ansah, sieht nach Neujahr das neue. Ein bewusst
    // gewähltes anderes Jahr bleibt stehen, ebenso Monat und Jahr von
    // Urlaubsplanung und Terminkalender: Dort wird gerade gearbeitet, und die
    // Ansicht soll niemandem unter der Hand wegspringen.
    if (year !== previousYear) {
      if (trainingDisplayYear === previousYear) trainingDisplayYear = year;
      if (meetingDisplayYear === previousYear) meetingDisplayYear = year;
    }
    renderAll();
  }
