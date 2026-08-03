@{
    format = "intensivteam-datensicherung"
    formatVersion = 1
    appVersion = 24
    exportedAt = (Get-Date -AsUTC).ToString("O").Replace("+00:00", "Z")
    synthetic = $true
    generator = @{
        name = "TeO Random Generator"
        seed = 20260727
        note = "Alle Mitarbeiter-, Kontakt- und Verlaufsdaten sind synthetisch randomisiert."
    }
    data = @{
        version = 24
        employees = @()
        meetings = @()
        meetingAttendances = @()
        devices = @()
        deviceInstructions = @()
        vacationDays = @()
        vacationEntitlements = @()
        trainings = @()
        completions = @()
        appointments = @()
        users = @()
        auditLog = @()
        settings = @{
            vacationWeekdayAbsenceLimit = 2
            vacationWeekendAbsenceLimit = 1
            serviceWeekends = @{
                weekend_a = @{
                    name = "Wochenende A"
                    owner = ""
                }
                weekend_b = @{
                    name = "Wochenende B"
                    owner = ""
                }
            }
        }
        catalogs = @{
            professions = @("Pflegefachkraft", "Medizinische/r Fachangestellte/r", "Stationsassistenz", "Arzt/Ärztin")
            qualifications = @(
                "stationsleitung", "stellvertretendeStationsleitung", "fachweiterbildungIA", "praxisanleiter",
                "hygienebeauftragter", "wundexperte", "demenzexperte", "brandschutzbeauftragter", "medizinproduktebeauftragter"
            )
        }
    }
} | ConvertTo-Json -Depth 100 | Out-File demo/teo-random-datenbank-60-ma-2025-2026.json -Encoding UTF8
