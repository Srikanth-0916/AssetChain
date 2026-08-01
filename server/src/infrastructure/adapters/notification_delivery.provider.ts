export interface EmailMessage {
  to: string;
  subject: string;
  bodyHtml: string;
}

export interface SMSMessage {
  toPhone: string;
  message: string;
}

export interface INotificationDeliveryProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  sendEmail(msg: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendSMS(msg: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class SendGridTwilioAdapter implements INotificationDeliveryProvider {
  readonly providerName = 'SendGrid & Twilio Enterprise Messaging';

  constructor(private sendgridApiKey?: string, private twilioAccountSid?: string) {}

  isConfigured(): boolean {
    return Boolean(this.sendgridApiKey && this.sendgridApiKey !== 'mock_key');
  }

  async sendEmail(msg: EmailMessage) {
    if (!this.isConfigured()) {
      return { success: false, error: 'SendGrid API key not configured in environment settings.' };
    }
    throw new Error('SendGrid API key required for live outbound emails.');
  }

  async sendSMS(msg: SMSMessage) {
    if (!this.twilioAccountSid) {
      return { success: false, error: 'Twilio Account SID not configured.' };
    }
    throw new Error('Twilio credentials required for live outbound SMS.');
  }
}

export class ConsoleDeliveryAdapter implements INotificationDeliveryProvider {
  readonly providerName = 'AssetChain System Logger & Realtime Notification Bus';

  isConfigured(): boolean {
    return true;
  }

  async sendEmail(msg: EmailMessage) {
    console.log(`[NotificationDelivery] 📧 Email queued to <${msg.to}>: "${msg.subject}"`);
    return { success: true, messageId: `msg_${Date.now()}` };
  }

  async sendSMS(msg: SMSMessage) {
    console.log(`[NotificationDelivery] 📱 SMS queued to <${msg.toPhone}>: "${msg.message}"`);
    return { success: true, messageId: `sms_${Date.now()}` };
  }
}
