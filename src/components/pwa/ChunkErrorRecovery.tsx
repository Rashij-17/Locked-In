'use client';
import { useEffect } from 'react';

/* ============================================================
   LOCKED IN — Chunk Load Error Recovery
   Detects ChunkLoadError (stale JS chunks after a redeploy) and
   performs a one-time hard reload to fetch the latest build.

   Guard: uses sessionStorage so a genuinely broken deploy doesn't
   cause an infinite reload loop — it only retries once per session.
   ============================================================ */

const RELOAD_FLAG = 'chunk-error-reloaded';

function isChunkError(error: unknown): boolean {
    if (!error) return false;
    const name = (error as Error).name ?? '';
    const msg  = (error as Error).message ?? '';
    return (
        name === 'ChunkLoadError' ||
        /Loading chunk \d+ failed/i.test(msg) ||
        /Loading CSS chunk \d+ failed/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg)
    );
}

function attemptRecovery() {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(RELOAD_FLAG)) {
        // Already reloaded once — stop here to avoid a loop.
        console.warn('[ChunkErrorRecovery] Chunk still missing after reload — deploy may be incomplete.');
        return;
    }
    sessionStorage.setItem(RELOAD_FLAG, '1');
    window.location.reload();
}

export default function ChunkErrorRecovery() {
    useEffect(() => {
        // Synchronous script errors (covers most ChunkLoadErrors)
        const handleError = (event: ErrorEvent) => {
            if (isChunkError(event.error)) {
                event.preventDefault();
                attemptRecovery();
            }
        };

        // Promise rejections (dynamic import() failures)
        const handleRejection = (event: PromiseRejectionEvent) => {
            if (isChunkError(event.reason)) {
                event.preventDefault();
                attemptRecovery();
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
