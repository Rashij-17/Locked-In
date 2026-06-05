# 🔒 Locked-In

A beautiful, premium, and productivity-focused Pomodoro and daily agenda planner web application. Designed with modern aesthetics, smooth animations, and rich themes, **Locked-In** helps you organize your day and stay fully locked in on your tasks.

---

## ✨ Key Features

*   **📊 Interactive Dashboard**: Get a high-level view of your daily stats, focus sessions, task completion status, and today's total focus time.
*   **🕒 Radial Clock View**: A gorgeous 24-hour SVG radial clock that maps today's tasks as colored progress arcs. Complete with a live "Now" hand, tooltip popovers on hover, and an interactive center information panel.
*   **⏱️ Immersive Focus Space**: A full-screen Pomodoro timer featuring a circular SVG progress countdown ring, deep-breathing guide animation, ambient transitions, and live logs of completed sessions.
*   **📅 Daily Agenda & Tags**: Organize your day using custom categories and color-coded labels (Mint, Amber, Coral, Violet, Sage, Sky).
*   **🎨 Dynamic Design System & Themes**: Five meticulously curated, fully responsive color themes:
    *   `Sand` (Warm Parchment Default)
    *   `Slate` (Midnight Dark Mode)
    *   `Paper` (High Contrast Light Mode)
    *   `Forest` (Deep Green Nature Mode)
    *   `Dusk` (Warm Purple Evening Mode)
*   **🔒 Secure Authentication**: Robust signup, sign-in, and password recovery pages integrated with **Firebase Authentication**.
*   **☁️ Dual Sync Support**: Setup with a local-first fallback structure. Uses client-side Zustand state synced to `localStorage` automatically when offline, and is pre-configured to interface with a cloud database instance (Supabase).

---

## 🛠️ Technology Stack

*   **Core Framework**: [Next.js 14](https://nextjs.org/) (App Router, Static Export ready)
*   **Frontend Library**: [React 18](https://react.dev/)
*   **Styling**: Vanilla CSS with custom design-system tokens and theme variables (zero hardcoded colors in components)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Authentication**: [Firebase Auth](https://firebase.google.com/)
*   **Database**: [Supabase](https://supabase.com/) (Schema support included)

---

## 📁 Directory Structure

```text
locked-in/
├── public/                # Static assets (images, icons)
├── schema.sql             # SQL Database schema for Supabase setup
├── next.config.js         # Next.js build & static export config
├── package.json           # Node dependencies and scripts
└── src/
    ├── app/               # Next.js App Router folders
    │   ├── (app)/         # Dashboard, focus workspace, profile, agenda, settings, tags
    │   ├── (auth)/        # Login, Signup, and Forgot-Password screens
    │   ├── globals.css    # Comprehensive CSS styling & Theme tokens
    │   ├── layout.tsx     # Global page layout wrapping providers
    │   └── page.tsx       # Root entry redirecting to /dashboard
    ├── components/        # Reusable UI & Layout Components
    │   ├── auth/          # Firebase Auth Context Provider
    │   ├── nav/           # Sidebar & Bottom navigation components
    │   ├── radial/        # Radial 24-hour SVG clock components
    │   ├── theme/         # Application Theme Context Provider
    │   └── ui/            # Generic Modals, Tag Pills, etc.
    ├── lib/               # Firebase/Supabase connections and time utilities
    ├── store/             # Zustand state stores (tasks, settings, focus sessions)
    └── types/             # Common TypeScript interfaces & type definitions
```

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) or another package manager of your choice

### 1. Clone & Install Dependencies

Clone the repository and install the project dependencies:

```bash
git clone https://github.com/Rashij-17/Locked-In.git
cd Locked-In
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory and configure your Firebase and (optional) Supabase credentials:

```ini
# Firebase Authentication Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configurations (Optional for Cloud sync)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🗄️ Database Setup (Optional)

To enable cloud storage synchronization with Supabase, run the queries in [schema.sql](file:///c:/Users/HP/OneDrive/Desktop/Locked-in/schema.sql) in your Supabase SQL Editor. This will set up the following tables:
*   `user_settings`: Focus time, breaks, and theme customizations.
*   `tags`: Custom labels.
*   `tasks`: User todo-list elements.
*   `focus_sessions`: Chronological history of completed Pomodoro blocks.

All tables are protected with **Row Level Security (RLS)** to guarantee that users can only read/write their own data.

---

## 📦 Build & Deployment

To compile the application into a static HTML/CSS/JS export (written to `/out`):

```bash
npm run build
```

To build and deploy the app directly to GitHub Pages:

```bash
npm run deploy
```

> [!NOTE]
> Ensure the `basePath` inside `next.config.js` matches your repository name if hosting on GitHub Pages (currently set to `/locked-in`).

---

## 🎨 Theme Architecture

All themes are configured using CSS variables declared under theme selectors in `src/app/globals.css`. Components make zero reference to hardcoded color hexes. 

Example snippet for custom variable theme setup:
```css
[data-theme="slate"] {
  --bg-base: #141618;
  --bg-surface: #1E2124;
  --text-primary: #E8E6E2;
  --accent-primary: #4E9E85;
  --timer-ring: #4E9E85;
}
```

This guarantees flawless rendering of custom styles dynamically when themes are updated from settings.
