import { redirect } from 'next/navigation';

/* Root page — redirects to dashboard (or login when auth is enabled) */
export default function RootPage() {
  redirect('/dashboard');
}
