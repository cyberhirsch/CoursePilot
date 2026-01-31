# 🤖 Agentic AI Benchmarking: Alternativen zu Google Genkit

In diesem Dokument werden verschiedene Frameworks für **Agentic AI** evaluiert, die als Alternative zu Google Genkit für das Projekt **CoursePilot** dienen können. Der Fokus liegt auf der Eignung für komplexe Constraint-Satisfaction-Probleme in der akademischen Planung und der Integration in den bestehenden Next.js / TypeScript Stack.

---

## 🏗️ Kernanforderungen an das Framework
Für die Umsetzung des Forschungsantrags muss das Framework folgende Kriterien erfüllen:
1. **Multi-Agent Orchestration**: Fähigkeit, spezialisierte Agenten (z.B. Optimierer, Validierer) zu koordinieren.
2. **TypeScript/JavaScript Support**: Nahtlose Integration in Next.js.
3. **State Management**: Persistenz von Planungsschritten und "Thought Processes".
4. **Tool Calling**: Effiziente Anbindung an die PocketBase API und lokale JSON-Daten.
5. **Human-in-the-loop**: Mechanismen für manuelle Interventionen und Freigabeprozesse.

---

## 📊 Framework Benchmarking

| Feature          | **Google Genkit** | **LangGraph.js** | **n8n (AI Agent)** | **Clawdbot (OpenClaw)** | **Vercel AI SDK**  | **CrewAI**             |
| :--------------- | :---------------- | :--------------- | :----------------- | :---------------------- | :----------------- | :--------------------- |
| **Entwickler**   | Google            | LangChain        | n8n                | Open Source             | Vercel             | CrewAI                 |
| **Fokus**        | Dev Experience    | Stateful Graphen | Visual Automation  | Personal AI Assistant   | UI & Streaming     | Role-based Multi-Agent |
| **Multi-Agent**  | Begrenzt (Flows)  | **Exzellent**    | Sehr gut (visuell) | Begrenzt (Skills)       | Gut (Orchestrator) | **Herausragend**       |
| **Stateful?**    | Nein (extern)     | **Ja** (native)  | Ja (Context)       | Ja (Markdown)           | Ja (History)       | Ja (Memory)            |
| **Kurs-Eignung** | Gut               | **Ideal**        | Prototyping        | Personal Admin          | Chat-UI            | Sehr gut (Rollen)      |

---

## 🚀 Detaillierte Analyse der Optionen

### 1. LangGraph.js (Favorit für Forschung)
LangGraph ist die Evolution von LangChain für Agentic AI. Es erlaubt die Definition von **zyklistischen Graphen**, was ideal für die Semesterplanung ist (Planen -> Validieren -> Korrigieren -> Re-Validieren).
- **Vorteil**: Extrem feingranulare Kontrolle über den "State". Man kann exakt definieren, wann ein Agent den Graphen verlässt, um eine menschliche Entscheidung einzuholen.
- **Eignung**: Bestens geeignet für den Forschungsantrag, da es "Thought Processes" durch Graphen-Visualisierungen transparent macht.

### 2. Bee Agent Framework (IBM)
Ein natives TypeScript-Framework, das speziell für agentische Workflows gebaut wurde.
- **Vorteil**: Bietet robuste Abstraktionen für "Tools" und "Memory". Es ist sehr "Agent-first" und weniger "Prompt-first" als Genkit.
- **Eignung**: Wenn Autonomie im Vordergrund steht (z.B. Agent entscheidet selbstständig, welche SWS-Daten er aus PocketBase abfragt).

### 3. n8n (Visual AI Orchestration)
n8n bietet mittlerweile einen "AI Agent Node" auf Basis von LangChain.
- **Vorteil**: Extrem schnelle Entwicklung durch Drag-and-Drop. Man kann hunderte von Drittanbieter-Tools (Google Sheets, Slack, GitHub) ohne Code einbinden.
- **Eignung**: Hervorragend für das schnelle Prototyping von Workflows, bei denen Daten von außen kommen oder an andere Dienste gesendet werden müssen. Für die tiefe Integration *innerhalb* einer Next.js-Logik-Ebene kann der Overhead jedoch hinderlich sein.

### 4. Clawdbot / OpenClaw (Self-hosted Router)
Ein spezialisiertes Framework für Cloud-native, selbstgehostete Assistenten.
- **Vorteil**: Hoher Fokus auf Privatsphäre und lokale Infrastruktur. Nutzt Markdown-Dateien für Erinnerungen und Skills.
- **Eignung**: Weniger für eine eingebettete Business-Logik (wie die SWS-Optimierung) geeignet, aber sehr stark als persönlicher "Planungs-Assistent", der über verschiedene Endgeräte (Discord, WhatsApp) hinweg funktioniert.

### 5. Vercel AI SDK (Die pragmatische Lösung)
... (vorheriger Text)

### 4. CrewAI (Python-Alternative via Microservice)
Obwohl CrewAI Python-basiert ist, ist es der Goldstandard für Rollen-basierte Multi-Agenten-Systeme.
- **Option**: Man könnte die Optimierungs-Logik in einen kleinen Python-Service (FastAPI) auslagern und diesen von Next.js aus ansprechen.
- **Eignung**: Wenn die Forschung stark auf die Interaktion verschiedener "Rollen" (z.B. Dekan-Agent vs. Dozent-Agent) abzielt.

---

## 💡 Empfehlung für CoursePilot

Um die Ziele des Forschungsantrags (Transparenz, Interventionsmöglichkeit, komplexe Constraints) bestmöglich zu erreichen, empfehle ich einen Wechsel auf **LangGraph.js**.

**Gründe:**
1. **Visualisierter State**: Man kann den Graphen der Optimierung visualisieren (Research Benefit).
2. **Breakpoints**: Man kann die KI mitten im Prozess stoppen ("Human-in-the-loop"), Änderungen manuell vornehmen und die KI dann weiterrechnen lassen.
3. **Robustheit**: Bessere Handhabung von Edge-Cases bei der SWS-Optimierung durch deterministische Pfade im Graphen.

---
*Erstellt am 31.01.2026 im Rahmen der technologischen Machbarkeitsstudie für CoursePilot.*
