# 🧠 Deep-Dive Anforderungsanalyse: KI-gestützte Hochschulplanung

Dieser Leitfaden dient der detaillierten Ermittlung von Schmerzpunkten und Wunsch-Features für ein neues System zur Semester- und Studiengangsplanung. Um unvoreingenommene Antworten zu erhalten, wird das Interview **ohne vorherige Demonstration** des aktuellen Prototyps geführt.

---

## 📅 Basisdaten & Rollenprofil
- **Experte/Kollege:**
- **Fachbereich/Rolle:**
- **Verantwortet (Studiengänge/Semester):**

### Status der Einbindung
- **Wie sind Sie derzeit in die *Semesterplanung* eingebunden?**
  - [ ] Aktiv (Gestaltung der Curricula, Modulallokation)
  - [ ] Passiv (Erhalt der fertigen Pläne, Rückmeldung bei Konflikten)
  - [ ] Gar nicht
- **Wie sind Sie derzeit in die *Stundenplanung* (Wochenplan/Raumplanung) eingebunden?**
  - [ ] Aktiv (Festlegung konkreter Zeiten/Räume)
  - [ ] Passiv
  - [ ] Gar nicht

---

## 🏥 Teil 1: Die "Dunkle Seite" der aktuellen Planung (Problemanalyse)

### 1.1 Der tägliche Workflow & Komplexität
- Beschreiben Sie bitte den Moment, in dem die Semesterplanung für Sie beginnt. Was ist der erste "Baustein", den Sie setzen?
- Wie behalten Sie den Überblick über die Abhängigkeiten zwischen den Modulen? (z.B. "Modul B darf erst belegt werden, wenn A bestanden ist").
- Wie managen Sie die Planung für verschiedene Kohorten (z.B. 1. Semester vs. 3. Semester), die sich eventuell Dozenten oder Räume teilen?

### 1.2 Schmerzpunkte & Fehler (Was raubt Ihnen den Schlaf?)
- Was war der schlimmste "Planungsunfall", den Sie erlebt haben? Wie wurde er entdeckt?
- Wie oft müssen Pläne nach der Veröffentlichung aufgrund von Fehlern oder übersehenen Abhängigkeiten geändert werden?
- **Daten-Silos**: Wie sicher sind Sie sich stets, dass Sie mit der absolut aktuellsten Version der Modulkataloge arbeiten? Woher kommen die Daten?
- **Das "Reise-nach-Jerusalem"-Problem**: Wenn Sie ein Modul im Plan verschieben, wie prüfen Sie manuell alle "Kettenreaktionen" in den Folgesemestern oder für andere Studiengänge?

### 1.3 Kommunikation & Abstimmung
- Wie erfolgt die Abstimmung mit anderen Studiengangsleitungen bei geteilten Modulen (Service-Lehre)?
- Wo entstehen im Kommunikationsfluss die meisten Reibungsverluste/Missverständnisse?

---

## 🎨 Teil 2: Das "Dream-System" (Feature-Wünsche)

### 2.1 Visualisierung & Interaktion
- Wenn Sie ein System vor sich hätten, das alles kann: Wie würde die perfekte Übersicht für Sie aussehen? (Tabelle, Kalender, Netzplan, Board?)
- Welche Informationen müssten *sofort* ins Auge springen, ohne zu klicken?
- Wäre eine "Drag-and-Drop"-Oberfläche hilfreich, oder bevorzugen Sie eine tabellarische Eingabe für mehr Präzision?

### 2.2 Validierung & Intelligenz
- Welche Arten von Fehlern sollte das System **automatisch verhindern**? (z.B. "Dozent doppelt belegt", "Prüfungsordnung verletzt").
- Wie wichtig wäre ein "Simulations-Modus" (Sandkasten), in dem man Änderungen testen kann, ohne den Live-Plan zu beeinflussen?
- Wünschen Sie sich eine Historie/Versionierung, um zu sehen: "Wer hat wann warum dieses Modul verschoben?"

### 2.3 Ressourceneffizienz & Bündelung
- Wie entscheiden Sie derzeit, ob zwei kleine Kurse zu einem großen zusammengelegt werden können? Was sind die Kriterien (Teilnehmerzahl, Fachbereich, Raumkapazität)?
- Würden Sie sich eine Funktion wünschen, die Ihnen aktiv Vorschläge macht, wo Lehrdeputate (SWS) eingespart werden können? Falls ja: Welche Kriterien muss so ein Vorschlag erfüllen, damit Sie ihn ernst nehmen?

---

## 🤖 Teil 3: Agentic AI - Der imaginäre Assistent

*Stellen Sie sich vor, das System hat eine "Intelligenz", die aktiv mitdenkt.*

### 3.1 Proaktive Unterstützung
- Sollte das System eher passiv bleiben (nur auf Fehler hinweisen) oder proaktiv Vorschläge machen (z.B. "Wenn Sie Modul X auf den Dienstag schieben, sparen wir 4 SWS und lösen einen Raumkonflikt")?
- Wie sollte der Assistent mit Ihnen kommunizieren? (Text-Chat, Pop-up-Warnungen, täglicher Report per Mail?)

### 3.2 Transparenz & Vertrauen
- Was würde passieren, wenn die KI einen Plan erstellt, den Sie auf Anhieb nicht verstehen? Welche Erklärungen bräuchten Sie (z.B.: "Ich habe das so geplant, weil sonst in Semester 5 ein Engpass entsteht")?
- Unter welchen Umständen würden Sie der KI die Erlaubnis geben, einfache Konflikte *selbstständig* zu lösen?

### 3.3 Interventionsmöglichkeiten
- Gibt es "Hert-Regeln", die eine KI niemals verändern dürfte? (z.B. "Der Freitag ist forschungsfrei", "Modul Y muss immer im SS stattfinden").
- Wie müsste eine "Sperrfunktion" (Locking) aussehen, damit Sie sich sicher fühlen, dass Ihre manuelle Vorarbeit nicht von einer Optimierungs-Logik überschrieben wird?

---

## 📊 Teil 4: Metriken & Erfolg
- Woran würden Sie messen, dass ein neues System ein voller Erfolg ist? (Zeitersparnis in %, weniger Fehler, höhere Dozentenzufriedenheit?)
- Gibt es exportierbare Formate oder Reportings, die Sie für die Hochschulleitung oder das Prüfungsamt zwingend benötigen?

---

## 🤝 Teil 5: Partizipation & Ausblick

16. **Aktive Mitwirkung**: Inwiefern hätten Sie Interesse daran, mit Ihrem Studiengang **aktiv an der Pilotphase** und Weiterentwicklung dieses Systems teilzunehmen?
17. **Datenpflege**: Wären Sie bereit, die spezifischen Daten Ihres Studiengangs (Module, SWS, Dozentenwünsche) **persönlich in das System einzupflegen**, um die Qualität der KI-Vorschläge zu erhöhen?
18. **Offene Punkte**: Gibt es administrative oder regulatorische Hürden, die wir bei der technologischen Umsetzung bisher nicht berücksichtigt haben?

---

### 📝 Notizen für den Interviewer:
Achten Sie auf emotionale Reaktionen bei der Beschreibung von Problemen – diese zeigen oft die drängendsten Feature-Bedarfe. Notieren Sie Fachbegriffe, die die Kollegen verwenden (z.B. "Überschneidungsfreiheit", "Deputatsabgleich"), um diese später im System korrekt zu benennen.
