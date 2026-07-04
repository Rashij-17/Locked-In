'use client';

/* ============================================================
   LOCKED IN — Settings Page
   Theme switcher, focus config, notification prefs, and account.
   ============================================================ */

import { useSettingsStore } from '@/store/useSettingsStore';
import type { ThemeName } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import Link from 'next/link';
import { usePushSubscription } from '@/lib/usePushSubscription';

/* ---- Theme preview data ---- */
const THEMES: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: 'sand',   label: 'Sand',   colors: ['#F5F0E8', '#5B7E6E', '#C4965A', '#C4715A'] },
  { name: 'slate',  label: 'Slate',  colors: ['#141618', '#4E9E85', '#D4A45A', '#E07060'] },
  { name: 'paper',  label: 'Paper',  colors: ['#FAFAF7', '#2563EB', '#D97706', '#DC2626'] },
  { name: 'forest', label: 'Forest', colors: ['#1A2420', '#4CAF82', '#D4A85A', '#D47060'] },
  { name: 'dusk',   label: 'Dusk',   colors: ['#1E1824', '#A882DD', '#D4A85A', '#82C9B8'] },
];

const FOCUS_OPTIONS = [15, 20, 25, 45, 60];
const SHORT_BREAK_OPTIONS = [5, 10];
const LONG_BREAK_OPTIONS = [15, 20, 30];
const LONG_INTERVAL_OPTIONS = [2, 3, 4];

/* ---- Toggle Component ---- */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={`toggle ${on ? 'toggle--on' : ''}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
    >
      <div className="toggle__knob" />
    </button>
  );
}

/* ---- Radio Select Component ---- */
function RadioSelect({
  options,
  value,
  onChange,
  suffix = '',
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt}
          className={value === opt ? 'btn btn--primary' : 'btn btn--secondary'}
          style={{ padding: '6px 14px', fontSize: 13, minHeight: 36 }}
          onClick={() => onChange(opt)}
        >
          {opt}{suffix}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { user, logout } = useAuth();
  const push = usePushSubscription();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__subtitle">Customize your experience</p>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="settings-section">
        <div className="settings-section__title">Appearance</div>

        {/* Theme Switcher */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>Theme</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.name}
                className={`theme-card ${settings.theme === t.name ? 'theme-card--active' : ''}`}
                onClick={() => settings.setTheme(t.name)}
                style={{ background: t.colors[0] }}
              >
                <div className="theme-card__preview">
                  {t.colors.slice(1).map((c, i) => (
                    <div key={i} className="theme-card__swatch" style={{ background: c }} />
                  ))}
                </div>
                <div
                  className="theme-card__name"
                  style={{
                    color: ['slate', 'forest', 'dusk'].includes(t.name)
                      ? '#E8E6E2'
                      : '#2C2820',
                  }}
                >
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Compact mode */}
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Compact mode</div>
            <div className="settings-row__desc">Reduce card padding and spacing</div>
          </div>
          <Toggle on={settings.compactMode} onToggle={settings.toggleCompactMode} />
        </div>
      </div>

      {/* FOCUS */}
      <div className="settings-section">
        <div className="settings-section__title">Focus</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className="settings-row__label">Focus duration</div>
          <RadioSelect
            options={FOCUS_OPTIONS}
            value={settings.focusMins}
            onChange={settings.setFocusMins}
            suffix=" min"
          />
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className="settings-row__label">Short break</div>
          <RadioSelect
            options={SHORT_BREAK_OPTIONS}
            value={settings.shortBreak}
            onChange={settings.setShortBreak}
            suffix=" min"
          />
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className="settings-row__label">Long break</div>
          <RadioSelect
            options={LONG_BREAK_OPTIONS}
            value={settings.longBreak}
            onChange={settings.setLongBreak}
            suffix=" min"
          />
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className="settings-row__label">Long break every</div>
          <RadioSelect
            options={LONG_INTERVAL_OPTIONS}
            value={settings.longInterval}
            onChange={settings.setLongInterval}
            suffix=" sessions"
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Auto-start breaks</div>
            <div className="settings-row__desc">Automatically begin break after focus session</div>
          </div>
          <Toggle on={settings.autoStartBreaks} onToggle={settings.toggleAutoStartBreaks} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Auto-start focus sessions</div>
            <div className="settings-row__desc">Automatically begin focus after break</div>
          </div>
          <Toggle on={settings.autoStartFocus} onToggle={settings.toggleAutoStartFocus} />
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="settings-section">
        <div className="settings-section__title">Notifications</div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Task reminders</div>
            <div className="settings-row__desc">Get notified before tasks are due</div>
          </div>
          <Toggle on={settings.taskRemindersEnabled} onToggle={settings.toggleTaskReminders} />
        </div>

        {/* Background push — works even when app is closed */}
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Background push notifications</div>
            <div className="settings-row__desc">
              {push.status === 'unsupported'
                ? 'Not supported on this browser'
                : push.status === 'subscribed'
                  ? '✓ This device will receive reminders even when the app is closed'
                  : 'Notify me even when the app is closed / phone is locked'}
            </div>
          </div>
          {push.status === 'unsupported' ? (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>N/A</span>
          ) : push.status === 'loading' ? (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>…</span>
          ) : (
            <button
              className={push.status === 'subscribed' ? 'btn btn--ghost' : 'btn btn--primary'}
              style={{ padding: '6px 14px', fontSize: 13, minHeight: 36 }}
              onClick={push.status === 'subscribed' ? push.unsubscribe : push.subscribe}
            >
              {push.status === 'subscribed' ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Focus session reminders</div>
            <div className="settings-row__desc">Remind when it&apos;s time to focus</div>
          </div>
          <Toggle on={settings.focusRemindersEnabled} onToggle={settings.toggleFocusReminders} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Daily digest</div>
            <div className="settings-row__desc">Morning summary of your day</div>
          </div>
          <Toggle on={settings.dailyDigestEnabled} onToggle={settings.toggleDailyDigest} />
        </div>
      </div>

      {/* ACCOUNT */}
      <div className="settings-section">
        <div className="settings-section__title">Account</div>
        <div style={{ padding: '12px 0' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.displayName || user.email}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/profile" className="btn btn--secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  View Profile & History
                </Link>
                <button onClick={logout} className="btn btn--ghost" style={{ padding: '8px 16px', fontSize: 13, color: 'var(--accent-coral)' }}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Not signed in.{' '}
              <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
