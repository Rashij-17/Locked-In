import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthContext';
import RegisterSW from '@/components/pwa/RegisterSW';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ChunkErrorRecovery from '@/components/pwa/ChunkErrorRecovery';

// NOTE: Next.js 14 Metadata API does NOT apply basePath to icons/manifest
// in static export mode — paths must be hardcoded with the full prefix.
const BASE = '/Locked-In';

export const metadata: Metadata = {
  title: 'Locked In',
  description:
    'A calm, minimal, deeply functional productivity app built around a radial clock dashboard. Plan tasks, focus with Pomodoro, and own every hour.',
  keywords: ['productivity', 'task planner', 'pomodoro', 'focus timer', 'daily planner'],
  // IMPORTANT: Next.js 14 Metadata API does NOT apply basePath to these fields
  // in static export mode. Full paths must be hardcoded explicitly.
  manifest: `${BASE}/manifest.json`,
  themeColor: '#5B7E6E',
  icons: {
    icon: [
      { url: `${BASE}/favicon.ico`, sizes: 'any' },
      { url: `${BASE}/favicon.svg`, type: 'image/svg+xml' },
    ],
    apple: `${BASE}/apple-touch-icon.png`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('locked-in-settings');
                if (stored) {
                  var parsed = JSON.parse(stored);
                  if (parsed && parsed.state && parsed.state.theme) {
                    document.documentElement.setAttribute('data-theme', parsed.state.theme);
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <ChunkErrorRecovery />
        <RegisterSW />
        <InstallPrompt />
      </body>
    </html>
  );
}
