# Modulbeschreibung / Module Description Mapping

This document outlines the standard information found in a PDF module description and maps it to the data fields implemented in the CoursePilot "Online Form" (application data).

**Bold fields** are those currently supported and transferred to the application's data structure (`Module` type).

## Allgemeine Informationen / General Information

*   **Modulbezeichnung (Module Name)**
*   **Modulcode / Modul-ID**
*   **Kürzel (Short Name)**
*   **Art des Moduls (Type: Pflicht/Wahlpflicht/Pool)**
*   **Studiengang (Programs)**
*   **Fakultät / Fachbereich (Department)**
*   **Modulverantwortliche(r) (Person in Charge)**
*   **Lehrsprache (Language)**
*   Dauer des Moduls (Duration) *(Calculated/Implicit)*
*   **Empfohlenes Semester (Semester Recommendation)**
*   **Häufigkeit des Angebots (Frequency)** *(Partially covered by algorithm/semester plans)*

## Ressourcen & Aufwand / Resources & Workload

*   **ECTS-Punkte (Credit Points)**
*   **SWS (Semesterwochenstunden)**
*   **Workload Gesamt (Total Workload)**
    *   Präsenzzeit (Contact Hours) *(Implicit in SWS/Workload)*
    *   Selbststudium (Self-study) *(Implicit in SWS/Workload)*
*   **Maximale Teilnehmerzahl (Max Participants)**

## Inhalte & Ziele / Content & Objectives

*   **Qualifikationsziele / Lernergebnisse (Learning Outcomes)**
*   **Inhalte (Description/Content)**
*   **Lehrformen (Teaching Methods)**
    *   (e.g., Vorlesung, Seminar, Workshop)
*   **Voraussetzungen für die Teilnahme (Prerequisites)**
    *   Formal (IDs)
    *   Inhaltlich (Context)
*   **Verwendbarkeit des Moduls (Usability)** *(Covered by Program/Cohort mappings)*

## Prüfung & Bewertung / Examination & Assessment

*   **Prüfungsform / Leistungsnachweis (Exam Type)**
    *   (e.g., Klausur, Präsentation, Projekt)
*   Benotung / Gewichtung (Grading/Weighting) *(To be implemented)*

## Sonstiges / Miscellaneous

*   **Literatur / Lernmaterialien (Literature)**
*   Medienformen (Media Types) *(Can be part of Description/Teaching Methods)*
*   Zuletzt aktualisiert (Last Updated) *(Implicit in file/Git history)*

---

## Technical Mapping Reference

| PDF Field            | CoursePilot Field (`Module`) | Status        |
| :------------------- | :--------------------------- | :------------ |
| Modulbezeichnung     | **`name`**                   | ✅ Implemented |
| Modul-ID             | **`id`**                     | ✅ Implemented |
| Kürzel               | **`shortName`**              | ✅ Implemented |
| ECTS                 | **`cp`**                     | ✅ Implemented |
| SWS                  | **`sws`**                    | ✅ Implemented |
| Modultyp             | **`type`**                   | ✅ Implemented |
| Kategorie            | **`category`**               | ✅ Implemented |
| Workload             | **`workload`**               | ✅ Implemented |
| Fachbereich          | **`department`**             | ✅ Implemented |
| Verantwortlich       | **`personInCharge`**         | ✅ Implemented |
| Sprache              | **`language`**               | ✅ Implemented |
| Beschreibung/Inhalte | **`description`**            | ✅ Implemented |
| Lernergebnisse       | **`learningOutcomes`**       | ✅ Implemented |
| Prüfungsform         | **`examType`**               | ✅ Implemented |
| Lehrformen           | **`teachingMethods`**        | ✅ Implemented |
| Literatur            | **`literature`**             | ✅ Implemented |
| Voraussetzungen      | **`prerequisites`**          | ✅ Implemented |
| Semesterempfehlung   | **`semesterRecommendation`** | ✅ Implemented |
| Max. Teilnehmer      | **`maxParticipants`**        | ✅ Implemented |
