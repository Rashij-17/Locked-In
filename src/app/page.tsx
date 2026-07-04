'use client';

/* ============================================================
   LOCKED IN — Root Landing & Redirect Page
   A minimalist clock entry animation styled in beige-brown.
   Redirects to the main dashboard after the animation completes.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RootPage() {
  const router = useRouter();
  const [time, setTime] = useState<Date | null>(null);

  // Clock ticking
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use a fixed default time (10:10) during SSR/initial render to prevent hydration mismatch
  const hours = time ? time.getHours() : 10;
  const minutes = time ? time.getMinutes() : 10;

  // Client-side redirect to dashboard after the landing animation (3.8 seconds)
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.replace('/dashboard');
    }, 3800);
    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F5F0E8', // Beige-brown background (Sand theme)
        color: '#2C2820',           // Dark brown primary text
        fontFamily: 'var(--font-body), system-ui, sans-serif',
      }}
    >
      {/* Container with subtle entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Modern Minimalist Clock */}
        <div
          style={{
            position: 'relative',
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            border: '2px solid rgba(44, 40, 32, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(44, 40, 32, 0.05)',
            backgroundColor: '#EDEADF', // Beige surface
          }}
        >
          {/* Hour Hand */}
          <motion.div
            style={{
              position: 'absolute',
              width: '4px',
              height: '32px',
              backgroundColor: '#2C2820', // Dark brown
              borderRadius: '9999px',
              transformOrigin: 'bottom',
              bottom: '50%',
            }}
            animate={{ rotate: hours * 30 + minutes * 0.5 }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
          {/* Minute Hand */}
          <motion.div
            style={{
              position: 'absolute',
              width: '2px',
              height: '48px',
              backgroundColor: '#6B6359', // Medium brown
              borderRadius: '9999px',
              transformOrigin: 'bottom',
              bottom: '50%',
            }}
            animate={{ rotate: minutes * 6 }}
            transition={{ type: 'spring', stiffness: 70 }}
          />
          {/* Center Dots */}
          <div
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              backgroundColor: '#2C2820',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              backgroundColor: '#C4965A', // Amber/brown dot accent
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Smooth Website Name Reveal */}
        <div style={{ overflow: 'hidden', padding: '8px 0' }}>
          <motion.h1
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: '36px',
              fontWeight: 300,
              letterSpacing: '0.15em',
              color: '#2C2820',
              fontFamily: 'var(--font-display), Georgia, serif',
            }}
          >
            locked<span style={{ color: '#C4965A', fontWeight: 'normal' }}>.</span>in
          </motion.h1>
        </div>

        {/* Subtitle fading in slightly later */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ delay: 1.4, duration: 1 }}
          style={{
            fontSize: '13px',
            fontWeight: 300,
            letterSpacing: '0.06em',
            textAlign: 'center',
            maxWidth: '280px',
            color: '#6B6359',
          }}
        >
          your schedule, strictly managed.
        </motion.p>
      </motion.div>
    </div>
  );
}