'use client';

/* ============================================================
   LOCKED IN — usePushSubscription
   Subscribes the current device to Web Push using VAPID.
   Saves the subscription to Supabase push_subscriptions table.
   Works even when the app is fully closed / phone is locked.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { supabase, getUuidFromUid, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@/lib/firebase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/** Convert a base64url VAPID public key to a Uint8Array for pushManager.subscribe() */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export type PushStatus = 'unsupported' | 'not-subscribed' | 'subscribed' | 'loading' | 'error';

interface UsePushSubscriptionReturn {
  status: PushStatus;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const taskReminderMins = useSettingsStore((s) => s.taskReminderMins);
  const [status, setStatus] = useState<PushStatus>('loading');
  const subRef = useRef<PushSubscription | null>(null);

  /* --- Check existing subscription on mount --- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus('unsupported');
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          subRef.current = existing;
          setStatus('subscribed');
        } else {
          setStatus('not-subscribed');
        }
      } catch {
        setStatus('not-subscribed');
      }
    });
  }, []);

  /* --- Subscribe this device --- */
  const subscribe = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const user = auth.currentUser;
    if (!user) return;

    setStatus('loading');
    try {
      const reg = await navigator.serviceWorker.ready;

      // Request notification permission first
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('not-subscribed');
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      subRef.current = subscription;
      const json = subscription.toJSON();
      const userId = getUuidFromUid(user.uid);

      // Detect user timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          timezone,
          reminder_mins: taskReminderMins,
        },
        { onConflict: 'endpoint' }
      );

      setStatus('subscribed');
    } catch (err) {
      console.error('Push subscribe error:', err);
      setStatus('error');
    }
  }, [taskReminderMins]);

  /* --- Unsubscribe this device --- */
  const unsubscribe = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setStatus('loading');
    try {
      if (subRef.current) {
        const endpoint = subRef.current.endpoint;
        await subRef.current.unsubscribe();
        subRef.current = null;
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
      setStatus('not-subscribed');
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      setStatus('error');
    }
  }, []);

  /* --- Keep reminder_mins in sync when settings change --- */
  useEffect(() => {
    if (status !== 'subscribed' || !subRef.current) return;
    if (!isSupabaseConfigured || !supabase) return;
    const user = auth.currentUser;
    if (!user) return;

    supabase
      .from('push_subscriptions')
      .update({ reminder_mins: taskReminderMins })
      .eq('endpoint', subRef.current.endpoint)
      .then(({ error }) => {
        if (error) console.error('Error updating reminder_mins:', error);
      });
  }, [taskReminderMins, status]);

  return { status, subscribe, unsubscribe };
}
