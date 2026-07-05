'use client';
import { useEffect } from 'react';

export default function RegisterSW() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Use NEXT_PUBLIC_BASE_PATH injected by actions/configure-pages@v5 at build time.
            // Falls back to '' for local development.
            const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
            navigator.serviceWorker.register(`${base}/sw.js`).catch(console.error);
        }
    }, []);
    return null;
}