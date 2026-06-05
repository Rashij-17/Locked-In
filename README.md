# 🔒 Locked-In

An elegant, minimalist, and productivity-focused academic workspace combining a 24-hour radial timeline with an immersive Pomodoro ecosystem. Built for students who demand a distraction-free, visually balanced environment to sustain deep focus.

---

## ⚡ Quick Links
* [Live Deployment](https://Rashij-17.github.io/locked-in/)
* [Database Schema](./schema.sql)
* [Report an Issue](https://github.com/Rashij-17/Locked-In/issues)

---

## ✨ Key Features

### 📊 Metric Intelligence & Radial Timeline
* **24-Hour Radial Clock View:** A custom-engineered geometric SVG 24-hour clock mapping daily events as low-saturation progress arcs. Includes an interactive center information hub and precise tooltips.
* **Aggregated Stats Engine:** Real-time visibility into active task counts, completed Pomodoro modules, and cumulative daily deep-work durations.

### ⏱️ Immersive Focus Space
* **Cohesive Countdown Display:** A full-screen, distraction-free environment utilizing a smooth SVG stroke circular layout.
* **The "Focus Breath" Animation:** Rhythmic, low-frequency breathing guide graphics designed to lower heart rates during intense focus intervals.
* **Ambient State Shifting:** Grayscale-to-color ambient layout transitions that subconsciously signal rest blocks without harsh auditory alerts.

### 📅 Agenda Flow & Typography
* **Time Proximity Grouping:** Moves away from corporate Kanban lanes into a chronological, fluid task stack organized by *Today*, *Tomorrow*, and *Upcoming*.
* **Custom Context Tagging:** High-contrast, clean visual badges spanning 6 balanced tones (*Mint, Amber, Coral, Violet, Sage, Sky*) to quickly filter subjects or classes.

### 🎨 Dynamic Architecture & Performance
* **Zero-Runtime Tokens:** System layout values, border thresholds, and palette variables compile down to static CSS to ensure zero-lag transitions on mobile browsers.
* **Local-First Synchronization:** Synchronizes state locally with offline storage via Zustand, with secondary automated background streaming to a cloud relational database.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Optimizes performance via static HTML exports. |
| **State** | Zustand | Manages lightweight, non-reactive global task states. |
| **Animations** | Framer Motion | Drives weighted spring layout changes and inertia. |
| **Styling** | Vanilla CSS Tokens | Strictly isolates colors to CSS variables for uniform themes. |
| **Auth** | Firebase Auth | Handles client-side identity and session security. |
| **Database** | Supabase (PostgreSQL) | Stores configuration patterns and records behind secure RLS rules. |

---

## 📁 Directory Structure

```text
locked-in/
├── public/                 # Optimized static layout assets
├── schema.sql              # Relational tables & RLS security rules for Supabase
├── next.config.js          # Next.js build compilation configurations
├── package.json            # Deployment execution scripts & node manifests
└── src/
    ├── app/                # Next.js App Router core routing structure
    │   ├── (app)/          # Dashboard views, configuration layouts, and workspaces
    │   ├── (auth)/         # Minimalist user authentication gates
    │   └── globals.css     # Unified theme variables & baseline layout styles
    ├── components/         # Decoupled component interface files
    │   ├── auth/           # Secure context boundary files for Firebase
    │   ├── nav/            # Hardware-adaptive layout tracking components
    │   ├── radial/         # High-precision interactive SVG clock layers
    │   └── ui/             # Reusable capsule tags and layout panels
    ├── lib/                # Client definitions and time-conversion math
    ├── store/              # Isolated Zustand configuration storage files
    └── types/              # Type definitions and interface standards
