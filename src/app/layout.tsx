import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthContext';
import RegisterSW from '@/components/pwa/RegisterSW';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ChunkErrorRecovery from '@/components/pwa/ChunkErrorRecovery';

export const metadata: Metadata = {
  title: 'Locked In',
  description:
    'A calm, minimal, deeply functional productivity app built around a radial clock dashboard. Plan tasks, focus with Pomodoro, and own every hour.',
  keywords: ['productivity', 'task planner', 'pomodoro', 'focus timer', 'daily planner'],
  // Next.js Metadata API automatically prepends basePath to relative paths.
  // basePath is hardcoded in next.config.js — do NOT add /Locked-In/ here manually.
  manifest: '/manifest.json',
  themeColor: '#5B7E6E',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
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
