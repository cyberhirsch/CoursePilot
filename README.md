# 🧭 CoursePilot

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Genkit](https://img.shields.io/badge/AI-Genkit-orange?style=for-the-badge)](https://firebase.google.com/docs/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v11-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

**CoursePilot** is a sophisticated academic planning and resource optimization platform. Designed for higher education institutions, it empowers faculty and administrators to design, manage, and optimize study programs with a modern, constraint-aware interface and AI-driven intelligence.

---

## ✨ Key Features

### 🗓️ Interactive Planner Board
A premium drag-and-drop interface for semester-wise module allocation. 
- **Validation Engine**: Real-time checks for prerequisites and forbidden semesters.
- **Pool Management**: Seamlessly handle elective pools (Wahlpflichtfächer).
- **Multi-View Modes**: Switch between global **Semester View** and focused **Study Group Plans**.

### 🤖 AI Course Optimization
Integrated with **Google Genkit**, CoursePilot includes a specialized **Consolidation Agent**.
- **Resource Efficiency**: Automatically identifies opportunities to merge course offerings across different study groups.
- **Teaching Load (SWS) Reduction**: Calculates potential savings in Weekly Semester Hours (SWS).
- **Constraint Respect**: Suggestions honor locked modules and curriculum rules.

### 🔒 Advanced Control & Locking
Fine-grained control over the planning process:
- **Individual Locking**: Prevent specific modules from being moved or consolidated.
- **Bulk Locking**: Quickly lock all past semesters or entire module categories.
- **Category Management**: Organize curriculum into logical segments for better oversight.

### 📊 Strategic Visualizations
- **Heatmaps**: Visualize workload and resource allocation density.
- **Program Templates**: Manage master templates for different degree programs to ensure consistency.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Integration**: [Google Genkit](https://firebase.google.com/docs/genkit)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: React Hooks + Context
- **Data Persistence**: [Firebase](https://firebase.google.com/)
- **Components**: Radix UI, Lucide React, Recharts

---

## 🎨 Design System

CoursePilot features a professional "Glitchless" dark-themed aesthetic designed for focus and clarity.

- **Primary**: `#3F51B5` (Deep Indigo) - Professional & Trustworthy.
- **Background**: `#212121` (Slate Charcoal) - Eye-strain reduction.
- **Accent**: `#00BCD4` (Vibrant Cyan) - Highlighting interactions.
- **Typography**: [Inter](https://rsms.me/inter/) for UI, **Source Code Pro** for technical IDs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Firebase Project
- Google AI API Key (for Genkit features)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/CoursePilot.git
   cd CoursePilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file with your Firebase and AI credentials.

### Development
Run the development server:
```bash
npm run dev
```

Start the Genkit Developer UI:
```bash
npm run genkit:dev
```

---

## 📂 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/ai`: Genkit AI flows and configuration (Consolidation Agent).
- `src/components`: Reusable UI components (Planner, Board, Header).
- `src/types`: TypeScript interfaces for Modules, Programs, and Plans.
- `data`: Seed data for categories, programs, and modules.

---

## 🧭 Project Status
This project is currently in active development.
