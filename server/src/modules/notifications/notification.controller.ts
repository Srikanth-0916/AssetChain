import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = notificationService.getNotifications(req.user!.userId);
      const unreadCount = notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, { notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notification_id } = req.body;
      const success = notificationService.markRead(req.user!.userId, notification_id);
      sendSuccess(res, { success });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
