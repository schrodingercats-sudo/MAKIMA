import { supabase } from './supabase.js';

/**
 * Subscribe to real-time notification inserts from Supabase Realtime for a given recipient user
 * @param {string} userId Recipient User UUID
 * @param {Function} onNotificationReceived Callback invoked when a new notification arrives
 * @returns {Object} Supabase Realtime Channel instance
 */
export function subscribeToRealtimeNotifications(userId, onNotificationReceived) {
  if (!userId) {
    console.warn('[Notifications] Cannot subscribe to realtime notifications without userId.');
    return null;
  }

  const channel = supabase
    .channel(`user_notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      async (payload) => {
        console.log('[Notifications] Realtime notification received:', payload.new);
        const detailedNotification = await fetchNotificationDetails(payload.new.id);
        const finalData = detailedNotification || payload.new;

        if (typeof onNotificationReceived === 'function') {
          onNotificationReceived(finalData);
        }

        // If tab is in background, show fallback push notification
        if (typeof document !== 'undefined' && document.hidden) {
          triggerFallbackNotification(finalData);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Notifications] Realtime channel status for user ${userId}:`, status);
    });

  return channel;
}

/**
 * Fetch detailed notification record including source profile and artwork info
 * @param {string} notificationId 
 * @returns {Promise<Object|null>}
 */
export async function fetchNotificationDetails(notificationId) {
  if (!notificationId) return null;
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        recipient_id,
        source_id,
        type,
        artwork_id,
        is_read,
        created_at,
        source:profiles!notifications_source_id_fkey(id, display_name, handle, avatar_url),
        artwork:artworks(id, title, thumbnail_url, image_url)
      `)
      .eq('id', notificationId)
      .single();

    if (error) {
      console.warn('[Notifications] Error fetching notification details:', error.message);
      // Fallback query without explicit relationship name if constraint name differs
      const { data: fallbackData } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();
      return fallbackData || null;
    }

    return data;
  } catch (err) {
    console.warn('[Notifications] Failed to fetch notification details:', err.message);
    return null;
  }
}

/**
 * Fetch recent notifications for a user
 * @param {string} userId User UUID
 * @param {number} limit Max records to fetch (default: 20)
 * @returns {Promise<Array>} List of notifications
 */
export async function fetchUserNotifications(userId, limit = 20) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        recipient_id,
        source_id,
        type,
        artwork_id,
        is_read,
        created_at,
        source:profiles!notifications_source_id_fkey(id, display_name, handle, avatar_url),
        artwork:artworks(id, title, thumbnail_url, image_url)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[Notifications] Error fetching user notifications:', error.message);
      // Fallback query
      const { data: fallbackData } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return fallbackData || [];
    }

    return data || [];
  } catch (err) {
    console.warn('[Notifications] Failed to fetch user notifications:', err.message);
    return [];
  }
}

/**
 * Mark a single notification as read
 * @param {string} notificationId Notification UUID
 * @returns {Promise<boolean>} Success status
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return false;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('[Notifications] Error marking notification read:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Notifications] Failed marking notification read:', err.message);
    return false;
  }
}

/**
 * Mark all notifications for a user as read
 * @param {string} userId User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('[Notifications] Error marking all notifications read:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Notifications] Failed marking all notifications read:', err.message);
    return false;
  }
}

/**
 * Integration linking Supabase Realtime + background FCM push dispatch
 * Dispatches background FCM push payload for offline/background target recipients
 * @param {string} recipientUserId Recipient User UUID
 * @param {Object} notificationPayload Payload containing type, source, artwork, etc.
 * @returns {Promise<{ success: boolean, tokensCount: number }>}
 */
export async function dispatchFcmPushNotification(recipientUserId, notificationPayload) {
  if (!recipientUserId) return { success: false, tokensCount: 0 };
  try {
    // 1. Query recipient's registered FCM tokens from Supabase
    const { data: tokens, error } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', recipientUserId);

    if (error || !tokens || tokens.length === 0) {
      console.log(`[Notifications] No FCM registration tokens found for user ${recipientUserId}`);
      return { success: false, tokensCount: 0 };
    }

    const tokenList = tokens.map((t) => t.token);
    console.log(`[Notifications] Found ${tokenList.length} FCM tokens for user ${recipientUserId}`);

    // 2. Format notification push payload
    const sourceName = notificationPayload.source?.display_name || 'Someone';
    let title = 'Makima Fan Art Gallery';
    let body = 'You have a new update.';

    if (notificationPayload.type === 'like') {
      title = 'New Like!';
      body = `${sourceName} liked your artwork "${notificationPayload.artwork?.title || ''}"`;
    } else if (notificationPayload.type === 'comment') {
      title = 'New Comment!';
      body = `${sourceName} commented on your artwork "${notificationPayload.artwork?.title || ''}"`;
    } else if (notificationPayload.type === 'follow') {
      title = 'New Follower!';
      body = `${sourceName} started following you`;
    }

    const payload = {
      tokens: tokenList,
      notification: {
        title,
        body,
        icon: notificationPayload.source?.avatar_url || '/images/coming-soon.jpg',
        image: notificationPayload.artwork?.thumbnail_url || notificationPayload.artwork?.image_url
      },
      data: {
        url: notificationPayload.artwork_id ? `/artwork/${notificationPayload.artwork_id}` : '/gallery',
        type: notificationPayload.type,
        recipientId: recipientUserId
      }
    };

    // 3. Dispatch to backend API route if endpoint exists
    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        console.log('[Notifications] FCM Push notification dispatched via server API.');
      }
    } catch (apiErr) {
      console.log('[Notifications] Server push API not reachable, logged FCM dispatch payload:', payload);
    }

    return { success: true, tokensCount: tokenList.length };
  } catch (err) {
    console.warn('[Notifications] Error in dispatchFcmPushNotification:', err.message);
    return { success: false, tokensCount: 0 };
  }
}

/**
 * Trigger local browser notification fallback when tab is in background
 * @param {Object} notificationData 
 */
export function triggerFallbackNotification(notificationData) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const sourceName = notificationData.source?.display_name || 'Someone';
  let title = 'Makima Fan Art Gallery';
  let body = 'You have a new notification.';

  if (notificationData.type === 'like') {
    title = 'New Like!';
    body = `${sourceName} liked your artwork.`;
  } else if (notificationData.type === 'comment') {
    title = 'New Comment!';
    body = `${sourceName} left a comment on your artwork.`;
  } else if (notificationData.type === 'follow') {
    title = 'New Follower!';
    body = `${sourceName} started following you.`;
  }

  try {
    new Notification(title, {
      body,
      icon: notificationData.source?.avatar_url || '/images/coming-soon.jpg',
      tag: `notification:${notificationData.id || Date.now()}`
    });
  } catch (e) {
    console.warn('[Notifications] Browser fallback notification failed:', e);
  }
}

export default {
  subscribeToRealtimeNotifications,
  fetchNotificationDetails,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dispatchFcmPushNotification,
  triggerFallbackNotification
};
