# Locked-In

A premium, minimalist student planner web application built with Next.js 14, Zustand, and Firebase/Supabase.

## Features

- **Dashboard**: High-level overview with radial clock and metrics.
- **Agenda**: Chronological timeline with spring animations.
- **Focus Mode**: Breathing Pomodoro timer animations with background color transitions.
- **Tags**: Organize tasks by subject or priority.
- **Settings**: Customizable themes (Sand, Slate, Paper, Forest, Dusk).
- **Offline-First & Cloud Sync**: Uses local storage for instant loads, with Firebase Auth and optional Supabase syncing.

## Architecture

- **Framework**: Next.js 14 (App Router, static export)
- **State Management**: Zustand
- **Database/Auth**: Firebase Auth, Supabase (optional data sync)
- **Styling**: Minimalist, low-saturation CSS with custom themes. NO harsh neon glows, NO vibrant/distracting accents.
- **Deployment**: GitHub Pages (fully static build via `out` folder)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

To deploy to GitHub Pages:

```bash
# Build and deploy the static app
npm run deploy
```

This command builds the static files into the `out` directory and pushes them to the `gh-pages` branch. The app is configured with `trailingSlash: true` and a `404.html` fallback to ensure SPA routing works correctly on GitHub Pages.
