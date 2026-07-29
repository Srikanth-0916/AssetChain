import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config/database';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';

/**
 * Notification Service — notification store with Supabase write-through.
 * In development: logs warning on Supabase error and falls back to memory.
 * In production: throws HTTP 503 ServiceUnavailableError if Supabase write fails.
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

export class NotificationService {
  async notify(userId: string, type: NotificationType, title: string, message: string, data?: Record<string, any>): Promise<Notification> {
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
    // Keep last 50 notifications per user in memory
    notificationStore.set(userId, existing.slice(0, 50));

    try {
      const { error } = await supabaseAdmin.from('notifications').insert({
        id: notification.id,
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        data: notification.data,
        created_at: notification.createdAt,
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

  getNotifications(userId: string): Notification[] {
    return notificationStore.get(userId) || this.getSeedNotifications(userId);
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

  private getSeedNotifications(userId: string): Notification[] {
    const seeds: Notification[] = [
      {
        id: uuidv4(),
        userId,
        type: 'dividend_available',
        title: 'Dividend Ready to Claim',
        message: 'You have $350 USDC in unclaimed dividends from Manhattan Commercial Plaza.',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: uuidv4(),
        userId,
        type: 'proposal_created',
        title: 'New DAO Proposal',
        message: 'A new governance proposal "Install Rooftop Solar Panels" has been created. Your vote matters!',
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: uuidv4(),
        userId,
        type: 'kyc_approved',
        title: 'KYC Approved',
        message: 'Your identity verification has been approved. You can now participate in all platform activities.',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    notificationStore.set(userId, seeds);
    return seeds;
  }
}

export const notificationService = new NotificationService();
