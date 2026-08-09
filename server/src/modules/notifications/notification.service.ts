import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { supabaseAdmin } from '../../config/database';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';
import { auditService } from '../audit/audit.service';

/**
 * Notification Service — notification store with Supabase write-through.
 * Phase 3.3: Added Server-Sent Events (SSE) push — real-time notifications without polling.
 */
export type NotificationType =
  | 'kyc_approved' | 'kyc_rejected'
  | 'asset_approved' | 'asset_rejected' | 'asset_tokenized'
  | 'dividend_available' | 'proposal_created' | 'vote_cast'
  | 'purchase_confirmed' | 'fraud_alert' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

const notificationStore = new Map<string, Notification[]>();

// ─── SSE Subscriber Registry (Phase 3.3) ─────────────────────────────────────
// Maps userId → Set of active SSE Response objects
const sseSubscribers = new Map<string, Set<Response>>();

export class NotificationService {
  /**
   * Create a notification and push it to all active SSE connections for the user.
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      data,
    };

    const existing = notificationStore.get(userId) || [];
    existing.unshift(notification);
    notificationStore.set(userId, existing.slice(0, 50));

    // Log to Audit Trail for compliance & activity tracking
    auditService.log(
      'notification_sent',
      userId,
      'system',
      `Notification dispatched: [${title}] ${message}`,
      { notificationId: notification.id, type, data },
      'info'
    );

    // Push to active SSE subscribers (Phase 3.3)
    this.pushToSSE(userId, notification);

    // Map service-layer type to DB notification_type ENUM
    // DB ENUM: asset_approved, asset_rejected, investment_confirmed, dao_vote_open,
    //          profit_distributed, kyc_approved, kyc_rejected, wallet_tx, security_alert
    const typeMap: Record<NotificationType, string> = {
      kyc_approved:        'kyc_approved',
      kyc_rejected:        'kyc_rejected',
      asset_approved:      'asset_approved',
      asset_rejected:      'asset_rejected',
      asset_tokenized:     'asset_approved',      // closest valid DB ENUM
      dividend_available:  'profit_distributed',
      proposal_created:    'dao_vote_open',
      vote_cast:           'dao_vote_open',
      purchase_confirmed:  'investment_confirmed',
      fraud_alert:         'security_alert',
      system:              'security_alert',
    };

    try {
      const { error } = await supabaseAdmin.from('notifications').insert({
        id: notification.id,
        user_id: notification.userId,
        type: typeMap[notification.type] ?? 'security_alert',
        title: notification.title,
        body: notification.message,           // DB col: body (not message)
        read_status: notification.read,       // DB col: read_status (not read)
        metadata: notification.data ?? {},   // DB col: metadata (not data)
      });

      if (error) {
        if (env.NODE_ENV === 'production') {
          console.error(`[NotificationService] 🚨 CRITICAL PROD FAILURE: Notification persistence failed for ${userId}:`, error.message);
          throw new ServiceUnavailableError(`Notification persistence failure: ${error.message}`);
        } else {
          console.warn(`[NotificationService] ⚠️ Dev Mode Warning: Supabase write failed for notification:`, error.message);
        }
      }
    } catch (err: any) {
      if (env.NODE_ENV === 'production') {
        throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError(`Notification store failure: ${err.message}`);
      }
    }

    return notification;
  }


  /**
   * Get all notifications for a user.
   * Checks in-memory store first (for SSE-pushed items), then falls back to Supabase.
   */
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    // Return in-memory store if cached for this session
    const inMemory = notificationStore.get(userId);
    if (inMemory !== undefined) {
      return inMemory;
    }

    // Fall back to Supabase for persisted notifications
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id, type, title, body, read_status, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        notificationStore.set(userId, []);
        return [];
      }

      const notifications: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.body || '',
        read: n.read_status ?? false,
        createdAt: n.created_at,
        data: n.metadata,
      }));

      // Cache in memory for this session
      notificationStore.set(userId, notifications);
      return notifications;
    } catch {
      // Quietly return empty array on network fetch failure, retry on next push
      notificationStore.set(userId, []);
      return [];
    }
  }

  // Keep legacy sync method for internal usage (SSE etc)
  getNotifications(userId: string): Notification[] {
    return notificationStore.get(userId) || [];
  }

  markRead(userId: string, notificationId: string): boolean {
    const notifications = notificationStore.get(userId) || [];
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  // ─── SSE Methods (Phase 3.3) ───────────────────────────────────────────────

  /**
   * Register an SSE subscriber for a user.
   * Call when client connects to GET /api/v1/notifications/stream.
   * Returns a cleanup function to call on connection close.
   */
  addSSESubscriber(userId: string, res: Response): () => void {
    if (!sseSubscribers.has(userId)) {
      sseSubscribers.set(userId, new Set());
    }
    sseSubscribers.get(userId)!.add(res);
    console.log(`[NotificationService] SSE subscriber added for ${userId}. Active: ${sseSubscribers.get(userId)!.size}`);

    return () => {
      const subscribers = sseSubscribers.get(userId);
      if (subscribers) {
        subscribers.delete(res);
        if (subscribers.size === 0) sseSubscribers.delete(userId);
      }
      console.log(`[NotificationService] SSE subscriber removed for ${userId}`);
    };
  }

  /**
   * Push a notification to all active SSE connections for a user.
   */
  private pushToSSE(userId: string, notification: Notification): void {
    const subscribers = sseSubscribers.get(userId);
    if (!subscribers || subscribers.size === 0) return;

    const payload = `data: ${JSON.stringify(notification)}\n\n`;
    const dead = new Set<Response>();

    for (const res of subscribers) {
      try {
        res.write(payload);
      } catch {
        dead.add(res); // Connection dropped — mark for cleanup
      }
    }

    // Remove dead connections
    for (const d of dead) subscribers.delete(d);
  }


}

export const notificationService = new NotificationService();
