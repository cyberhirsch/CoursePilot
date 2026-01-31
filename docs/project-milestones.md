# 📅 Projekt-Meilensteine & Forschungs-TODOs: CoursePilot

Diese Liste orientiert sich am Forschungsantrag **"Optimierung der Studiengangs- und Semesterplanung durch Agentic AI"** und dient der Steuerung der operativen Tasks für das Sommersemester 2026.

---

## ✅ Phase 0: Fundament & Prototyping (Abgeschlossen)
- [x] Initiales Setup des Next.js Projekts.
- [x] Implementierung des interaktiven Planner Boards (Drag & Drop).
- [x] Anbindung an **PocketBase** (Cloudflare Tunnel) für Multi-User-Fähigkeit.
- [x] Erstellung eines ersten **Genkit AI Flows** zur SWS-Optimierung.
- [x] Dokumentation der Baseline-Architektur (README & Screenshots).

---

## 🏗️ Phase 1: Analyse & Experten-Check (Monat 1-2)
*Fokus: Validierung der akademischen Logik und Ermittlung der Nutzerbedarfe.*

- [ ] **Experteninterviews (Explorativ)**: Durchführung von Gesprächen mit der Hochschulverwaltung zur Ermittlung der IST-Situation und Schmerzpunkte (Requirement-Gathering laut Antrag).
- [ ] **Anforderungs-Check**: Abgleich der aktuellen `constraints.json` Logik mit den Erkenntnissen aus den Interviews und realen Prüfungsordnungen.
- [ ] **Anonymisierte Testdaten**: Erstellung eines umfangreichen Datensatzes mit mind. 5 Studiengängen zur Stress-Prüfung der KI.
- [ ] **TODO**: Review der `data/modules.json` auf Konsistenz (CP vs. SWS Verhältnisse).

---

## 🧠 Phase 2: Agentic AI Architektur & Evaluation (Monat 3)
*Fokus: Vergleich von Frameworks und Deep Logic.*

- [ ] **Benchmarking Prototyp**: Implementierung eines parallelen Optimierungs-Flows mit **LangGraph.js**, um die Transparenz ("Thought Process") zu vergleichen.
- [ ] **Rollen-Definition**: Ausarbeitung spezifischer Agenten-Personas (z.B. "Finanz-Prüfer", "Curriculum-Hüter").
- [ ] **Evaluation**: Vergleich der SWS-Einsparungen zwischen Genkit (aktuell) und dem neuen Agentengeflecht.
- [ ] **TODO**: Integration eines Feedback-Loops, bei dem der Nutzer KI-Vorschläge ablehnen und begründen kann (Lerneffekt für den Agenten).

---

## 🎨 Phase 3: Frontend & Prozess-Visualisierung (Monat 4)
*Fokus: "Gedankengänge" der KI sichtbar machen.*

- [ ] **AI-Dashboard**: Entwicklung einer Ansicht, die zeigt, *warum* die KI eine Konsolidierung vorschlägt (Visualisierung der Constraints).
- [ ] **Heatmap Optimierung**: Farblich abgestufte Darstellung der Raum- und SWS-Auslastung.
- [ ] **Intervations-UI**: Verfeinerung des Locking-Systems (Bulk-Locking ganzer Semester).
- [ ] **TODO**: Einbau einer "Was-wäre-wenn"-Simulation (Vorschau der Auswirkungen einer Änderung).

---

## 🧪 Phase 4: Testing, Iteration & Pilot (Monat 5)
*Fokus: Praxistest mit echten Studiengangsleitungen.*

- [ ] **Pilot-Lauf**: Durchführung von Planungssitzungen mit Test-Usern (Experteninterviews laut Antrag).
- [ ] **Bug-Fixing**: Behebung von Hydration-Issues und Performance-Flaschenhälsen (besonders bei großen Graphen).
- [ ] **Logic Tuning**: Feinjustierung der AI-Prompts basierend auf dem Experten-Feedback.
- [ ] **TODO**: Messung der Zeitersparnis im Vergleich zur manuellen Planung.

---

## 📝 Phase 5: Dokumentation & Publikation (Monat 6)
*Fokus: Wissenschaftliche Verwertung.*

- [ ] **Finaler Code-Audit**: Bereinigung des GitHub-Repos für die Open-Source-Veröffentlichung.
- [ ] **Whitepaper/Paper**: Erstellung der Projektdokumentation für die Media University.
- [ ] **Präsentation**: Vorbereitung der Ergebnisse für Fachkonferenzen (CHI / Design-Forschung).
- [ ] **TODO**: Evaluation der Kernhypothese: Ist Agentic AI besser für unstrukturierte Planung geeignet als traditionelle Heuristiken?

---

### 🚀 Nächste unmittelbare Schritte (Short Term TODOs):
1. [ ] Entscheidung für das Next-Gen AI Framework (LangGraph vs. Vercel SDK).
2. [ ] Ausbau der `CoursePilot` PocketBase-Kollektion für granulare Logging-Daten.
3. [ ] Erstes Meeting mit Studiengangsleitungen zur Anforderungsvalidierung planen.
