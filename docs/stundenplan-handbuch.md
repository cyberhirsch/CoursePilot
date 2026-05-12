# Handbuch: Stundenplan erstellen

Dieser Abschnitt beschreibt den vollstaendigen Ablauf, um in CoursePilot einen Stundenplan zu erzeugen. Der Ablauf beginnt bei der Datenpflege, beschreibt die manuelle Eingabe und den Import per CSV aus Excel, und endet bei Planung, Kontrolle, Nachbearbeitung und Export.

## 1. Grundprinzip

Die Stundenplanung erzeugt aus den gepflegten Semesterplaenen einen wiederkehrenden Plan fuer ein ausgewaehltes Semester. CoursePilot plant dabei nur Module, die in den Gruppenplaenen fuer dieses Semester vorgesehen sind.

Der Planungsalgorithmus beruecksichtigt:

- Studiengruppen und deren Modulbelegung je Fachsemester.
- Module mit SWS, Teilnehmenden, Raumanforderungen und Modulverantwortlichen.
- Dozenten mit woechentlicher Verfuegbarkeit, Sperrzeiten und maximalen SWS pro Tag.
- Raeume mit Kapazitaet, Ausstattung und blockierten Zeiten.
- Semesterzeitraum, Vorlesungswochen und Vorlesungspausen.
- Systemregeln wie Tagesstart, Tagesende, Pausen zwischen Terminen, Mittagspause und geplante Wochentage.

Wichtig: Fuer alle zu planenden Module muss ein gueltiger Modulverantwortlicher hinterlegt sein. Fehlt diese Zuordnung, zeigt CoursePilot vor der Planung eine Tabelle mit den betroffenen Modulen und Dropdowns zur direkten Korrektur.

## 2. Datenpflege vorbereiten

Vor der Stundenplanung sollten die Daten in dieser Reihenfolge gepflegt werden:

1. Akademischer Kalender
2. Kataloge und Kategorien
3. Nutzer und Dozenten
4. Raeume
5. Module
6. Studiengaenge
7. Gruppen und Semesterplaene
8. Dozenten-Verfuegbarkeiten
9. Optionale Raumbelegungen oder Sperrzeiten

Diese Reihenfolge ist wichtig, weil spaetere Daten auf fruehere Daten verweisen. Ein Modul verweist zum Beispiel auf Kategorien, Studiengaenge und einen Modulverantwortlichen. Ein Gruppenplan verweist auf Module und Studiengaenge.

## 3. Daten manuell einpflegen

### 3.1 Akademischen Kalender anlegen

Oeffnen:

`Einstellungen -> Kalender`

Pflegen Sie dort:

- Beginn des akademischen Jahres.
- Semester-ID, z. B. `ws2026` oder `ss2027`.
- Semestername, z. B. `WS 2026/27`.
- Typ: `WS` oder `SS`.
- Jahr.
- Vorlesungsbeginn und Vorlesungsende.
- Pruefungsbeginn und Pruefungsende.
- Optional: Vorlesungspause mit Start- und Enddatum.

Die Stundenplanung verwendet den Vorlesungsbeginn, das Vorlesungsende und die Vorlesungspause, um die tatsaechlichen Einzeltermine zu erzeugen.

### 3.2 Kategorien und Dropdown-Werte pflegen

Oeffnen:

`Einstellungen -> Variablen`

Pflegen Sie hier:

- Modulkategorien, z. B. `Core Competencies` oder `Electives`.
- Pruefungsformen.
- Lehrformen.
- Sprachen.

Diese Werte helfen bei der einheitlichen Modulpflege und verhindern unterschiedliche Schreibweisen.

### 3.3 Nutzer und Dozenten anlegen

Oeffnen:

`Nutzerverwaltung` oder `Dozenten -> Dozentenuebersicht`

Pflegen Sie fuer Dozenten mindestens:

- ID
- Name
- E-Mail
- Rolle, z. B. `lecturer`, `professor`, `admin` oder `coordinator`
- Optional: Fachbereich

Nur Nutzer mit einer lehrenden Rolle koennen sinnvoll als Modulverantwortliche oder Dozenten in der Stundenplanung verwendet werden.

### 3.4 Raeume anlegen

Oeffnen:

`Raeume -> Raumuebersicht`

Pflegen Sie fuer jeden Raum:

- Raum-ID
- Raumname
- Raumtyp: `building`, `online` oder `hybrid`
- Kapazitaet
- Ausstattung: Beamer, Dozenten-PC, Mac-Raum, PC-Labor usw.
- Optional: Etage, Gebaeude, Flaeche, Link, Notizen
- Optional: blockierte Zeitraeume

Die Raumkapazitaet und Ausstattung werden in der automatischen Planung beruecksichtigt. Ein Modul mit PC-Labor-Anforderung wird also nicht in einen Raum ohne PC-Labor geplant.

### 3.5 Module pflegen

Oeffnen:

`Module -> Modulsheet` oder `Module -> Moduluebersicht`

Pflegen Sie fuer jedes Modul mindestens:

- Modul-ID
- Name
- SWS
- CP
- Typ: `Pflicht`, `Wahlpflicht` oder `Pool`
- Kategorie
- Zugeordnete Studiengaenge
- Modulverantwortliche(r)
- Optional: Voraussetzungen, verbotene Fachsemester, maximale Teilnehmerzahl
- Optional: Raumanforderungen

Wichtig fuer die Stundenplanung:

- `SWS` bestimmt die geplante Unterrichtszeit.
- `personInCharge` muss exakt dem Namen eines vorhandenen Dozenten entsprechen.
- `requirements` bestimmt, welche Raeume geeignet sind.
- `maxParticipants` und die Gruppengroessen helfen bei der Raumwahl.

### 3.6 Studiengaenge pflegen

Oeffnen:

`Semesterplan -> Semesterplan` oder die Studiengang-/Gruppenpflege

Ein Studiengang benoetigt:

- ID
- Name
- Anzahl Semester
- Standard-Teilnehmerzahl
- Liste der enthaltenen Module
- Optional: Reihenfolge der Kategorien
- Optional: Template-Plan

Der Template-Plan ist nuetzlich, um neue Gruppen schneller anzulegen.

### 3.7 Gruppen und Semesterplaene pflegen

Oeffnen:

`Semesterplan -> Semesterplan`

Fuer jede Gruppe benoetigen Sie:

- Gruppen-ID
- Name
- Studiengang
- Startsemester
- Teilnehmendenzahl
- Kurzname
- Gruppentyp
- Modulbelegung pro Fachsemester

Die Stundenplanung rechnet aus dem Startsemester und dem ausgewaehlten Planungssemester aus, welches Fachsemester der Gruppe gerade aktiv ist. Nur die Module in diesem Fachsemester werden fuer das ausgewaehlte Semester geplant.

### 3.8 Dozenten-Verfuegbarkeit pflegen

Oeffnen:

`Dozenten -> Verfuegbarkeit`

Pflegen Sie:

- Woechentliche Verfuegbarkeiten, z. B. Montag 08:00 bis 16:00.
- Woechentliche Sperrzeiten, z. B. Freitag 12:00 bis 18:00.
- Datumsbezogene negative Verfuegbarkeiten, z. B. 2026-10-05 08:00 bis 18:00.
- Maximale SWS pro Tag.
- Optional: Notizen.

Negative Verfuegbarkeiten sind besonders wichtig fuer Urlaub, Konferenzen, Blocktermine oder einzelne Tage, an denen ein Dozent nicht verfuegbar ist.

### 3.9 Planungsregeln einstellen

Oeffnen:

`Stundenplan`

In der rechten Einstellungsseite der Stundenplanung koennen Sie pflegen:

- Geplante Wochentage.
- Tagesstart und Tagesende.
- Pause zwischen Terminen.
- Pause innerhalb laengerer Veranstaltungen.
- Intervall fuer interne Pausen.
- Mittagspause aktivieren/deaktivieren.
- Beginn und Ende der Mittagspause.

Diese Regeln beeinflussen direkt, welche Slots als planbar gelten.

## 4. Daten per CSV importieren

Oeffnen:

`Einstellungen -> Import`

Dort gibt es fuer jede JSON-Datei eine eigene Import-Karte. Jede Karte zeigt:

- den Namen der JSON-Datei,
- Pflichtspalten,
- optionale Spalten,
- das erwartete Werteformat,
- einen Button zum Herunterladen einer CSV-Vorlage,
- einen Button zum Importieren einer CSV-Datei.

Jeder Import ersetzt die passende Datenmenge im aktuellen Datenbestand. Beispiel: Ein Import fuer `modules.json` ersetzt die Modulliste. Andere Datenbereiche bleiben erhalten.

## 5. Daten aus Excel als CSV vorbereiten

### 5.1 Vorlage herunterladen

1. Oeffnen Sie `Einstellungen -> Import`.
2. Suchen Sie die passende Import-Karte, z. B. `modules.json`.
3. Klicken Sie auf den Download-Button.
4. Oeffnen Sie die heruntergeladene CSV-Vorlage in Excel.
5. Tragen Sie Ihre Daten in die vorhandenen Spalten ein.

Die erste Zeile muss die Spaltennamen enthalten. Spaltennamen duerfen nicht umbenannt werden.

### 5.2 Excel-Tabelle richtig aufbauen

Beachten Sie beim Arbeiten in Excel:

- Keine verbundenen Zellen verwenden.
- Keine Summenzeilen oder Zwischenueberschriften in den Datenbereich schreiben.
- Eine Datenzeile entspricht immer genau einem Datensatz.
- Datumswerte im Format `YYYY-MM-DD` speichern, z. B. `2026-10-05`.
- Zeiten im Format `HH:mm` speichern, z. B. `09:00`.
- Wahr/Falsch-Werte als `true` oder `false` eintragen.
- Listen mit dem Zeichen `|` trennen, z. B. `DSA|ARAI`.
- Mehrere Slot-Gruppen mit `;;` trennen, z. B. `monday|08:00|16:00;;tuesday|09:00|18:00`.
- JSON-Spalten nur verwenden, wenn wirklich strukturierte Detaildaten importiert werden sollen.

Falls Excel Datumswerte automatisch umformatiert, stellen Sie die betroffenen Spalten auf Text oder verwenden Sie eine Hilfsspalte mit:

```text
=TEXT(A2;"yyyy-mm-dd")
```

Fuer Uhrzeiten kann eine Hilfsspalte helfen:

```text
=TEXT(A2;"hh:mm")
```

### 5.3 CSV aus Excel exportieren

In Excel:

1. Datei oeffnen.
2. `Datei -> Speichern unter` waehlen.
3. Als Dateityp `CSV UTF-8 (durch Trennzeichen getrennt) (*.csv)` auswaehlen.
4. Datei speichern.
5. Falls Excel warnt, dass nur das aktive Tabellenblatt gespeichert wird, bestaetigen.

Hinweis: Je nach Windows-/Excel-Region verwendet Excel Komma oder Semikolon als Trennzeichen. Der Import ist fuer normale CSV-Dateien gedacht; am sichersten ist `CSV UTF-8`.

## 6. Benoetigte CSV-Spalten je Datenbereich

### 6.1 Module (`modules.json`)

Pflichtspalten:

`id`, `name`, `sws`, `cp`, `type`, `category`

Optionale wichtige Spalten:

`programIds`, `prerequisites`, `forbiddenSemesters`, `maxParticipants`, `personInCharge`, `duration`, `frequency`, `description`, `learningOutcomes`, `examType`, `teachingMethods`, `language`, `literature`, `equivalentTo`, `semesterRecommendation`, `beamer`, `lecturerPc`, `macRoom`, `pcLab`

Werte:

- `type`: `Pflicht`, `Wahlpflicht` oder `Pool`
- `programIds`: Studiengang-IDs mit `|` trennen
- `prerequisites`: Modul-IDs mit `|` trennen
- `forbiddenSemesters`: Zahlen mit `|` trennen
- Ausstattung: `true` oder `false`

### 6.2 Studiengaenge (`programs.json`)

Pflichtspalten:

`id`, `name`, `moduleIds`, `defaultStudents`, `semesters`

Optionale Spalten:

`categoryOrder`, `department`, `sem1`, `sem2`, `sem3`, `sem4`, `sem5`, `sem6`, `sem7`, `sem8`, `sem9`

Werte:

- `moduleIds`: alle Modul-IDs des Studiengangs mit `|` trennen
- `sem1` bis `sem9`: Module fuer den Template-Plan mit `|` trennen

### 6.3 Gruppen (`cohorts.json`)

Pflichtspalten:

`id`, `name`, `programId`, `startSemesterId`, `startSemesterName`, `startSemesterType`, `startSemesterYear`, `studentCount`, `semesters`, `shortName`, `type`

Optionale Spalten:

`userLockedModules`, `sem1`, `sem2`, `sem3`, `sem4`, `sem5`, `sem6`, `sem7`, `sem8`, `sem9`

Werte:

- `startSemesterType`: `SS` oder `WS`
- `type`: z. B. `klassisch` oder `dual`
- `sem1` bis `sem9`: Modul- oder Modulinstanz-IDs mit `|` trennen

### 6.4 Kategorien (`categories.json`)

Pflichtspalten:

`id`, `name`

### 6.5 Kataloge (`catalogs.json`)

Pflichtspalten:

`key`, `value`

Werte fuer `key`:

- `examTypes`
- `teachingMethods`
- `languages`
- `personInCharge`

### 6.6 Nutzer und Dozenten (`users.json`)

Pflichtspalten:

`id`, `name`, `email`, `role`

Optionale Spalten:

`department`, `cohortId`, `universityId`

Werte fuer `role`:

`superuser`, `admin`, `coordinator`, `professor`, `lecturer`, `student`, `guest`

### 6.7 Raeume (`rooms.json`)

Pflichtspalten:

`id`, `name`, `type`, `capacity`

Optionale Spalten:

`beamer`, `lecturerPc`, `macRoom`, `pcLab`, `darkenable`, `barrierFree`, `airConditioned`, `workspacesMac`, `workspacesPc`, `area`, `floor`, `building`, `weblink`, `blockedPeriods`, `notes`

Werte:

- `type`: `building`, `online` oder `hybrid`
- Ausstattung: `true` oder `false`
- `blockedPeriods`: `start|end|reason`, mehrere Eintraege mit `;;` trennen

### 6.8 Raumbelegung (`room-occupancy.json`)

Pflichtspalten:

`id`, `roomId`, `date`, `startTime`, `endTime`, `title`

Optionale Spalten:

`person`, `purpose`, `moduleId`, `cohortId`, `color`, `lockKind`

Werte:

- `date`: `YYYY-MM-DD`
- `startTime` und `endTime`: `HH:mm`
- `lockKind`: `soft` oder `hard`

### 6.9 Systemeinstellungen (`system-settings.json`)

Pflichtspalten:

`currentSemester`, `lecturesStart`, `lecturesEnd`, `defaultLocation`, `cpWorkloadFactor`, `swsDurationMinutes`, `defaultRoomBufferMinutes`, `startHour`, `endHour`, `standardPauseMinutes`

Optionale Spalten:

`examsStart`, `examsEnd`, `campusLocations`, `eventBreakDurationMinutes`, `eventBreakIntervalMinutes`, `plannedWeekdays`, `useLunchBreak`, `lunchBreakStart`, `lunchBreakEnd`

Werte:

- `campusLocations`: Standorte mit `|` trennen
- `plannedWeekdays`: Wochentage mit `|` trennen, z. B. `monday|tuesday|wednesday|thursday|friday`
- `useLunchBreak`: `true` oder `false`

### 6.10 Akademischer Kalender (`academic-calendar.json`)

Pflichtspalten:

`academicYearStartMonth`, `id`, `name`, `type`, `year`, `lecturesStart`, `lecturesEnd`, `examsStart`, `examsEnd`

Optionale Spalten:

`lectureBreakStart`, `lectureBreakEnd`

Werte:

- `type`: `SS` oder `WS`
- Datumswerte: `YYYY-MM-DD`

### 6.11 Dozenten-Verfuegbarkeit (`lecturer-availability.json`)

Pflichtspalten:

`userId`, `availableSlots`

Optionale Spalten:

`unavailableSlots`, `unavailableDateSlots`, `maxSwsPerDay`, `notes`

Werte:

- `availableSlots`: `day|start|end`, mehrere mit `;;` trennen
- `unavailableSlots`: `day|start|end`, mehrere mit `;;` trennen
- `unavailableDateSlots`: `id|date|start|end|reason`, mehrere mit `;;` trennen
- Wochentage: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

### 6.12 Bestehenden Stundenplan importieren (`schedule.json`)

Pflichtspalten:

`semesterId`, `status`, `semesterStartDate`, `semesterEndDate`, `weekStartDate`, `weekEndDate`, `entryId`, `moduleId`, `moduleName`, `roomId`, `roomName`, `day`, `date`, `startTime`, `endTime`, `sws`, `participants`

Optionale Spalten:

`generatedAt`, `moduleInstanceIds`, `cohortIds`, `cohortNames`, `lecturerUserId`, `lecturerName`, `occurrenceDates`, `score`, `warnings`, `totalOfferings`, `plannedRoomAssignments`, `teachingWeeks`

Dieser Import ist fuer bereits geplante Termine gedacht. Fuer die normale Stundenplanung ist es besser, Module, Gruppen, Raeume und Verfuegbarkeiten zu importieren und den Plan danach neu erzeugen zu lassen.

## 7. Import in CoursePilot durchfuehren

1. `Einstellungen -> Import` oeffnen.
2. Passende Import-Karte suchen.
3. CSV-Datei ueber den Upload-Button waehlen.
4. Erfolgsmeldung oder Fehlermeldung direkt in der Karte pruefen.
5. Bei Fehlern die CSV in Excel korrigieren und erneut als CSV UTF-8 speichern.
6. Import wiederholen.

Typische Fehler:

- Pflichtspalte fehlt.
- Spaltenname ist falsch geschrieben.
- Ein Datum liegt nicht im Format `YYYY-MM-DD` vor.
- Listen verwenden Komma statt `|`.
- Ein Modulverantwortlicher ist nicht als Dozent/Nutzer vorhanden.
- Ein Gruppenplan enthaelt Modul-IDs, die in `modules.json` fehlen.

## 8. Stundenplan erzeugen

1. Oeffnen Sie `Stundenplan`.
2. Waehlen Sie oben das gewuenschte Semester.
3. Pruefen Sie die Planungsregeln in der rechten Einstellungsseite.
4. Klicken Sie auf `Semester planen`.
5. Falls Modulverantwortliche fehlen, erscheint eine Tabelle.
6. Waehlen Sie in der Tabelle fuer jedes betroffene Modul einen Modulverantwortlichen.
7. Klicken Sie erneut auf `Semester planen`.

CoursePilot erzeugt danach:

- geplante Veranstaltungen,
- Einzeltermine ueber den Semesterzeitraum,
- Raumbelegungen,
- offene Probleme, falls kein konfliktfreier Termin gefunden wurde.

## 9. Ergebnis kontrollieren

Nach der Planung sollten Sie kontrollieren:

- Anzahl der Veranstaltungen.
- Anzahl offener Probleme.
- Anzahl der Einzeltermine.
- Vorlesungswochen.
- Filteransichten nach Gesamt, Dozent, Gruppe oder Raum.
- Stichproben in unterschiedlichen Wochen.

Nutzen Sie die Wochenpfeile oder das Datumsfeld, um durch das Semester zu wechseln. Mit `Erste Woche` springen Sie zur ersten Vorlesungswoche.

## 10. Konflikte und offene Probleme loesen

Wenn CoursePilot keinen Slot findet, erscheint ein offenes Problem. Typische Ursachen:

- Kein geeigneter Raum vorhanden.
- Raumkapazitaet reicht nicht aus.
- Raum hat die benoetigte Ausstattung nicht.
- Dozent ist nicht verfuegbar.
- Mittagspause oder Tageszeiten blockieren den Termin.
- Gruppe, Raum oder Dozent haette einen Konflikt.

Vorgehen:

1. Problem oeffnen.
2. Ursache lesen.
3. Datum, Raum, Start, Ende oder Dozent anpassen.
4. Verfuegbare Raeume im Dropdown pruefen.
5. Aktuelle Pruefung beachten.
6. Konfliktfrei planen oder bewusst manuell festlegen.

Wenn ein Termin gekuerzt wird, verschwindet die Unterrichtszeit nicht automatisch. Pruefen Sie deshalb die angezeigten Soll-/Ist-Werte fuer das ausgewaehlte Modul und passen Sie bei Bedarf Anzahl, erstes Datum oder letztes Datum der Termine an.

## 11. Termine manuell bearbeiten

Ein geplanter Termin kann geoeffnet und bearbeitet werden. Dabei sind u. a. relevant:

- Datum
- Raum
- Startzeit
- Endzeit
- Dozent
- manueller Lock
- Titel
- Notiz
- Anzahl geplanter Termine
- erster Termin
- letzter Termin
- Soll-/Ist-Unterrichtseinheiten fuer das ausgewaehlte Modul

Bei Serien sollten Sie besonders darauf achten, ob die Aenderung nur einen Einzeltermin oder die Terminserie betrifft.

## 12. Plan sperren oder entsperren

Wenn der Plan fertig kontrolliert ist:

1. Klicken Sie auf `Plan sperren`.
2. Der Plan wird gegen automatische Veraenderungen geschuetzt.

Wenn spaeter wieder automatisch angepasst werden soll:

1. Klicken Sie auf `Entsperren`.
2. Bestaetigen Sie die Rueckfrage.

## 13. Stundenplan exportieren

Im Bereich `Stundenplan` gibt es den Export:

- `CSV` fuer Tabellenkalkulation oder Nachbearbeitung.
- `iCal (.ics)` fuer Kalenderprogramme.
- `JSON` fuer technische Weiterverarbeitung oder Sicherung.
- `Drucken / PDF` fuer Ausdruck oder PDF-Erzeugung.

Empfehlung:

- Fuer Abstimmungen mit Verwaltung oder Dozenten: CSV.
- Fuer persoenliche Kalender: iCal.
- Fuer Sicherung oder technischen Austausch: JSON.
- Fuer ein Handout: Drucken / PDF.

## 14. Checkliste vor der finalen Freigabe

- Alle Module im relevanten Semester haben Modulverantwortliche.
- Alle Gruppen haben die korrekte Teilnehmendenzahl.
- Alle Raeume haben Kapazitaet und Ausstattung.
- Dozenten-Verfuegbarkeiten und negative Verfuegbarkeiten sind aktuell.
- Vorlesungszeitraum und Vorlesungspausen stimmen.
- Mittagspause und Tageszeiten sind korrekt eingestellt.
- Offene Probleme sind geloest oder bewusst dokumentiert.
- Soll-/Ist-Unterrichtseinheiten je Modul sind plausibel.
- Plan ist gesperrt.
- Export wurde erstellt.

