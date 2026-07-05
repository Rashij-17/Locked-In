'use client';
import { useEffect, useRef } from 'react';

/* ============================================================
   LOCKED IN — Service Worker Registration
   - Registers sw.js at the correct basePath-prefixed URL.
   - Listens for controllerchange (new SW took over) and shows
     a one-time "New version available" toast so stale tabs
     don't silently serve dead chunk references after a redeploy.
   ============================================================ */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function RegisterSW() {
    const toastRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.register(`${BASE}/sw.js`).catch(console.error);

        // When a new SW activates and claims the client, prompt a refresh
        // so the user never runs a mix of old HTML + new chunks.
        const handleControllerChange = () => {
            // Guard: only show once per session to avoid infinite-loop toasts.
            if (sessionStorage.getItem('sw-updated')) return;
            sessionStorage.setItem('sw-updated', '1');
            showUpdateToast();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    function showUpdateToast() {
        const toast = document.createElement('div');
        toastRef.current = toast;

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '99999',
            background: 'var(--bg-surface, #1E2124)',
            color: 'var(--text-primary, #E8E6E2)',
            border: '1px solid var(--accent-primary, #4E9E85)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'swToastIn 0.3s ease',
            maxWidth: 'calc(100vw - 48px)',
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes swToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);

        const text = document.createElement('span');
        text.textContent = '🔄 New version available';

        const btn = document.createElement('button');
        btn.textContent = 'Refresh';
        Object.assign(btn.style, {
            background: 'var(--accent-primary, #4E9E85)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
        });
        btn.onclick = () => window.location.reload();

        toast.appendChild(text);
        toast.appendChild(btn);
        document.body.appendChild(toast);
    }

    return null;
}