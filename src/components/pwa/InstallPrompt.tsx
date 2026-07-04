'use client';

/* ============================================================
   LOCKED IN — PWA Install Prompt
   Shows a polished bottom-sheet / card inviting the user to
   install the app on desktop or mobile.
   ============================================================ */

import { useEffect, useState, useCallback } from 'react';
import LockedInLogo from '@/components/ui/LockedInLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'android' | 'ios' | 'desktop' | null;

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

const DISMISSED_KEY = 'lockedin_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [iosInstructions, setIosInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const detected = detectPlatform();
    setPlatform(detected);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the user is settled in the app first
      setTimeout(() => setShow(true), 3500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS doesn't fire beforeinstallprompt — show a manual guide instead
    if (detected === 'ios') {
      setTimeout(() => setShow(true), 3500);
    }

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setTimeout(() => setShow(false), 2500);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (platform === 'ios') {
      setIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setShow(false), 2500);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, platform]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="install-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="install-card" role="dialog" aria-modal="true" aria-label="Install Locked In">
        {/* Close button */}
        <button
          className="install-close"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header with logo */}
        <div className="install-logo-wrap">
          <LockedInLogo width={240} />
        </div>

        {installed ? (
          /* ── Installed state ── */
          <div className="install-installed">
            <div className="install-check">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="var(--accent-primary)" strokeWidth="2"/>
                <path d="M8 14l4 4 8-8" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="install-installed-text">You&apos;re all set! App installed.</p>
          </div>
        ) : iosInstructions ? (
          /* ── iOS manual guide ── */
          <div className="install-ios">
            <p className="install-subtitle">Install on iPhone / iPad</p>
            <ol className="install-ios-steps">
              <li>
                <span className="install-ios-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>
                Tap the <strong>Share</strong> button in Safari
              </li>
              <li>
                <span className="install-ios-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </span>
                Scroll down and tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                <span className="install-ios-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                Tap <strong>Add</strong> to confirm
              </li>
            </ol>
            <button className="install-btn install-btn--secondary" onClick={() => setIosInstructions(false)}>
              ← Back
            </button>
          </div>
        ) : (
          /* ── Default state ── */
          <>
            <p className="install-headline">Install the app</p>
            <p className="install-subtitle">
              Get Locked&nbsp;In on your {platform === 'android' ? 'home screen' : platform === 'ios' ? 'home screen' : 'desktop'} for instant access — offline&nbsp;ready, no browser needed.
            </p>

            {/* Feature pills */}
            <ul className="install-features">
              <li>⚡ Instant launch</li>
              <li>📵 Works offline</li>
              <li>🔔 Notifications</li>
            </ul>

            <div className="install-actions">
              <button
                className="install-btn install-btn--primary"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? (
                  <span className="install-spinner" />
                ) : platform === 'ios' ? (
                  'Show me how →'
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Install app
                  </>
                )}
              </button>
              <button className="install-btn install-btn--ghost" onClick={handleDismiss}>
                Not now
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        /* ── Backdrop ── */
        .install-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: installFadeIn 0.25s ease;
        }

        /* ── Card ── */
        .install-card {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: min(420px, calc(100vw - 32px));
          background: var(--bg-surface, #EDEADF);
          border: 1px solid var(--border-default, rgba(44,40,32,0.10));
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06) inset;
          padding: 32px 28px 28px;
          animation: installSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);
          text-align: center;
        }

        /* ── Close ── */
        .install-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-elevated, #E6E1D4);
          border: 1px solid var(--border-default, rgba(44,40,32,0.10));
          color: var(--text-secondary, #6B6359);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .install-close:hover {
          background: var(--border-strong, rgba(44,40,32,0.22));
          color: var(--text-primary, #2C2820);
        }

        /* ── Logo ── */
        .install-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        /* ── Text ── */
        .install-headline {
          font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--text-primary, #2C2820);
          margin: 0 0 8px;
        }
        .install-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px;
          color: var(--text-secondary, #6B6359);
          line-height: 1.6;
          margin: 0 0 18px;
        }

        /* ── Feature pills ── */
        .install-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .install-features li {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #6B6359);
          background: var(--bg-elevated, #E6E1D4);
          border: 1px solid var(--border-default, rgba(44,40,32,0.10));
          border-radius: 999px;
          padding: 5px 12px;
          letter-spacing: 0.3px;
        }

        /* ── Actions ── */
        .install-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .install-btn {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          padding: 13px 20px;
          cursor: pointer;
          border: none;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
        }
        .install-btn--primary {
          background: var(--accent-primary, #5B7E6E);
          color: var(--text-inverse, #FAF8F4);
          box-shadow: 0 4px 16px rgba(91,126,110,0.32);
        }
        .install-btn--primary:hover:not(:disabled) {
          background: var(--accent-mint, #8FBF9F);
          box-shadow: 0 6px 20px rgba(91,126,110,0.42);
          transform: translateY(-1px);
        }
        .install-btn--primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .install-btn--ghost {
          background: transparent;
          color: var(--text-tertiary, #A09589);
          font-size: 13px;
        }
        .install-btn--ghost:hover {
          color: var(--text-secondary, #6B6359);
        }
        .install-btn--secondary {
          background: var(--bg-elevated, #E6E1D4);
          color: var(--text-primary, #2C2820);
          border: 1px solid var(--border-default, rgba(44,40,32,0.10));
        }

        /* ── Spinner ── */
        .install-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: installSpin 0.6s linear infinite;
          display: inline-block;
        }

        /* ── Installed state ── */
        .install-installed {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 8px 0 4px;
        }
        .install-check {
          animation: installPop 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        .install-installed-text {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 15px;
          font-weight: 500;
          color: var(--accent-primary, #5B7E6E);
          margin: 0;
        }

        /* ── iOS steps ── */
        .install-ios-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .install-ios-steps li {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px;
          color: var(--text-primary, #2C2820);
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-elevated, #E6E1D4);
          border-radius: 12px;
          padding: 12px 14px;
          line-height: 1.5;
        }
        .install-ios-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-primary, #5B7E6E);
          color: #fff;
          flex-shrink: 0;
        }

        /* ── Keyframes ── */
        @keyframes installFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes installSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes installSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes installPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .install-card {
            bottom: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            width: 100%;
            padding: 28px 20px 36px;
          }
        }
      `}</style>
    </>
  );
}
