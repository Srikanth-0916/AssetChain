import { Request, Response, NextFunction } from 'express';
import { razorpayService } from './razorpay.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export class PaymentController {
  /**
   * POST /payments/create-order
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount_usd, asset_id, token_quantity } = req.body;
      const order = await razorpayService.createOrder(
        Number(amount_usd || 100),
        asset_id || 'default-asset',
        Number(token_quantity || 1)
      );
      sendCreated(res, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /payments/verify
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        asset_id,
        token_quantity,
      } = req.body;

      const result = await razorpayService.verifyAndMint(
        razorpay_order_id || '',
        razorpay_payment_id || '',
        razorpay_signature || '',
        asset_id || '',
        Number(token_quantity || 1)
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
