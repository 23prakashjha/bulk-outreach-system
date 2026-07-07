const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromWhatsAppNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && this.fromWhatsAppNumber) {
      this.client = twilio(accountSid, authToken);
      console.log('WhatsApp service initialized successfully');
    } else {
      console.warn('WhatsApp service disabled - missing Twilio credentials in .env');
      this.client = null;
    }
  }

  async sendWhatsAppMessage(to, message) {
    if (!this.client) {
      return { success: false, error: 'WhatsApp service is not configured - missing Twilio credentials' };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromWhatsAppNumber}`,
        to: `whatsapp:${formattedNumber}`
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        error: null
      };
    } catch (error) {
      console.error('WhatsApp send error:', error.message);
      return {
        success: false,
        error: error.message,
        messageId: null,
        status: 'failed'
      };
    }
  }

  async sendWhatsApp(to, message) {
    return this.sendWhatsAppMessage(to, message);
  }

  async sendBulkWhatsAppMessages(messages) {
    const results = [];

    for (const message of messages) {
      const result = await this.sendWhatsAppMessage(message.to, message.message);
      results.push({
        phone: message.to,
        ...result
      });
    }

    return results;
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    return '+' + cleaned;
  }

  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  }
}

module.exports = WhatsAppService;
