# 🧭 Projektdokument: CoursePilot - Agentic AI Planungssystem

## 📖 Projektübersicht
**CoursePilot** ist ein KI-gestütztes Ökosystem zur akademischen Planung und Ressourcenoptimierung. Das Ziel des Projekts ist es, die hochkomplexe Logik der Studiengangs-, Stunden- und Prüfungsplanung durch den Einsatz von **Agentic AI** zu vereinfachen, Fehler zu minimieren und Lehrressourcen (SWS) effizient zu bündeln.

---

## 🏗️ System-Architektur & Module

Das System ist in acht Hauptbereiche unterteilt, die jeweils spezialisierte Ansichten für unterschiedliche Nutzerrollen bieten:

### 1. 🗓️ Semesterplan
Das Herzstück der strategischen Planung zur Allokation von Modulen über die gesamte Studienzeit.
- **Semesterübersicht**: Globale Kalenderansicht über alle Studiengänge hinweg zur Prüfung der Auslastung (SWS, CP, Teilnehmer).
- **Studiengangsplan**: Interaktiver Drag-and-Drop Planner für einzelne Kohorten zur Erstellung der Semesterverlaufpläne.
- **Modul-Grid**: Kompakte Liste der für den gewählten Studiengang verfügbaren Module.
- **Optimierung**: KI-Assistent zur Analyse von Konsolidierungspotenzialen (Zusammenlegung von Kursen zur SWS-Einsparung).

### 2. 🕒 Stundenplan
(Derzeit in Entwicklung) Überführung der Semesterplanung in eine wöchentliche Taktung mit Fokus auf operative Durchführung.

### 3. 📝 Prüfungswesen
Zentrale Verwaltung aller studienrelevanten Leistungen und Termine.
- **Notenspiegel (Transcript of Records)**: Persönliche Übersicht für Studierende über erbrachte Leistungen, CP-Stand und Notendurchschnitt.
- **Noteneingabe (Grading Hub)**: Interface für Dozierende zur schnellen Erfassung von Prüfungsergebnissen für ihre jeweiligen Kurse.
- **Prüfungsverwaltung**: Werkzeug für das Prüfungsamt zur Administration von Anerkennungen, Nachprüfungen und Abschlussdokumenten.
- **Termine & Fristen**: Zeitliche Planung von Klausuren, Abgabefristen und Anmeldezeiträumen.

### 4. 📚 Module
Detaillierte Verwaltung der curricularen Bausteine.
- **Modulübersicht**: Tabellarische Liste aller Module im System mit Filterfunktionen nach Fachbereich und Typ.
- **Modulsheet**: Detailansicht (Datenblatt) zur Bearbeitung von Inhalten, Lernzielen, Prüfungsformen und Literatur.

### 5. 👥 Dozenten
Management der Lehrressourcen und deren Zeitkontingente.
- **Dozentenübersicht**: Liste aller Lehrenden mit Zuordnung zu Fachbereichen und Rollen.
- **Verfügbarkeit**: Kalenderansicht zur Pflege von Sperrzeiten und präferenzbasierten Verfügbarkeiten.

### 6. 🏫 Räume (Classrooms)
Infrastruktur-Management für den physischen und hybriden Campus.
- **Raumübersicht**: Verwaltung von Raumdaten (Typ: Präsenz/Online/Hybrid), Kapazitäten und technischer Ausstattung (Beamer, Mac, PC).
- **Raumbelegung**: Visualisierung der täglichen Auslastung in einem Grid-basierten Zeitstrahl.
- **Verfügbarkeit**: Menü zum Blockieren von Räumen für Wartungen oder Eigenbedarf.

### 7. 👤 Nutzerverwaltung
Verwaltung der Identitäten und Zugriffsrechte innerhalb des Systems.
- **Profil**: Persönliche Einstellungen, Rollenanzeige und (zukünftig) Kontoeinstellungen.
- **Nutzergruppen**: Definition von Rechten und Rollen (Admin, Dozent, Student) zur Steuerung der Sichtbarkeit und Editierbarkeit.

### 8. ⚙️ Einstellungen
Systemweite Konfiguration und Standards.
- **Allgemein**: Basisdaten des Systems (Standorte, Semesterzeittafeln).
- **Kategorien**: Zentrale Verwaltung der Modulkategorien zur Sicherstellung konsistenter Pläne.

---

## 🤖 Agentic AI Features (Die Intelligenz)

### 🚀 Konsolidierungs-Agent (SWS-Optimierer)
- Analysiert Pläne über alle Studiengänge hinweg.
- Identifiziert Möglichkeiten zur Zusammenlegung von Modulen (z.B. Grafikdesign & Kommunikationsdesign teilen sich "Layout 1").
- Berechnet aktiv die Einsparung an Lehrdeputaten.

### 🛡️ Validierungs-Wächter
- Agiert im Hintergrund und prüft jede manuelle Änderung gegen die Datenbank der "Harten Regeln".
- Erklärt Fehlermeldungen in natürlicher Sprache ("Dieser Tausch verletzt die Voraussetzungskette für Modul X").

### 🧠 Strategie-Berater (Explainable AI)
- Liefert Begründungen für KI-Vorschläge.
- Ermöglicht "Was-wäre-wenn"-Szenarien für strategische Kursänderungen.

---

## 🎨 Design-Philosophie
- **Dark Mode Primary**: Zur Reduzierung der Augenbelastung bei langen Planungssitzungen (#212121).
- **Navigation**: Zentrales Dropdown zur schnellen Umschaltung zwischen den Modulen (siehe Screenshot).
- **Fokus**: Minimalistische Oberfläche, die nur relevante Informationen pro Planungsschritt zeigt.

---
*Status: In Entwicklung (Phase 1: Analyse & Prototyping)*
