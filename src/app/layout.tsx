import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthContext';
import RegisterSW from '@/components/pwa/RegisterSW';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export const metadata: Metadata = {
  title: 'Locked In',
  description:
    'A calm, minimal, deeply functional productivity app built around a radial clock dashboard. Plan tasks, focus with Pomodoro, and own every hour.',
  keywords: ['productivity', 'task planner', 'pomodoro', 'focus timer', 'daily planner'],
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
        <link rel="manifest" href={`${process.env.NODE_ENV === 'production' ? '/Locked-In' : ''}/manifest.json`} />
        <meta name="theme-color" content="#5B7E6E" />
        <link rel="icon" href={`${process.env.NODE_ENV === 'production' ? '/Locked-In' : ''}/favicon.png`} type="image/png" />
        <link rel="apple-touch-icon" href={`${process.env.NODE_ENV === 'production' ? '/Locked-In' : ''}/icon.png`} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <RegisterSW />
        <InstallPrompt />
      </body>
    </html>
  );
}
