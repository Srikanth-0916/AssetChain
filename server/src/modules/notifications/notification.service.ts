import { v4 as uuidv4 } from 'uuid';

/**
 * Notification Service — in-memory notification store.
 * In production: integrate with email/SMS/push/Telegram.
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
  notify(userId: string, type: NotificationType, title: string, message: string, data?: Record<string, any>): Notification {
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
    // Keep last 50 notifications per user
    notificationStore.set(userId, existing.slice(0, 50));

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
