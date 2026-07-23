import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from './supabase.js';

/**
 * Safely retrieve environment variables across Vite (import.meta.env) and Node (process.env)
 * @param {string} key 
 * @returns {string}
 */
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || 'placeholder-api-key',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || 'placeholder-app.firebaseapp.com',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || 'placeholder-project',
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || 'placeholder-project.appspot.com',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || '1234567890',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Safely get Firebase Messaging instance if supported in browser environment
 * @returns {Promise<Messaging|null>}
 */
export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('[Firebase] FCM Messaging is not supported in this browser environment.');
    return null;
  }
  try {
    return getMessaging(app);
  } catch (err) {
    console.warn('[Firebase] Error initializing getMessaging:', err.message);
    return null;
  }
}

/**
 * Request browser push notification permission, fetch FCM token, and store into Supabase `fcm_tokens` table.
 * @returns {Promise<string|null>} FCM Registration Token or null
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Firebase] Notification API not supported in browser environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Firebase] Notification permission was denied or dismissed:', permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('[Firebase] Firebase Messaging instance could not be retrieved.');
      return null;
    }

    const vapidKey = getEnvVar('VITE_FIREBASE_VAPID_KEY') || undefined;

    let serviceWorkerRegistration;
    if ('serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      }).catch((swErr) => {
        console.warn('[Firebase] Service worker registration warning:', swErr.message);
        return undefined;
      });
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration
    });

    if (token) {
      console.log('[Firebase] FCM Token acquired successfully:', token.substring(0, 15) + '...');
      
      // Store FCM token in Supabase fcm_tokens table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert(
            {
              user_id: user.id,
              token: token,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,token' }
          );

        if (error) {
          console.warn('[Firebase] Failed to persist FCM token to Supabase:', error.message);
        } else {
          console.log('[Firebase] FCM token saved to Supabase for user:', user.id);
        }
      }
    }

    return token;
  } catch (error) {
    console.error('[Firebase] Error in requestNotificationPermission:', error);
    return null;
  }
}

/**
 * Register handler for receiving FCM push notifications while tab is active in foreground
 * @param {Function} callback Callback receiving push notification payload
 * @returns {Promise<Function>} Unsubscribe function or no-op
 */
export async function onForegroundMessage(callback) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return () => {};
  }
  return onMessage(messaging, (payload) => {
    console.log('[Firebase] Foreground notification received:', payload);
    if (typeof callback === 'function') {
      callback(payload);
    }
  });
}

export default {
  app,
  getFirebaseMessaging,
  requestNotificationPermission,
  onForegroundMessage,
};
