'use client';
import { useEffect } from 'react';

export default function RegisterSW() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const base = process.env.NODE_ENV === 'production' ? '/Locked-In' : '';
            navigator.serviceWorker.register(`${base}/sw.js`).catch(console.error);
        }
    }, []);
    return null;
}