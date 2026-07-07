const twilio = require('twilio');

class SMSService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && accountSid.startsWith('AC') && authToken && authToken !== 'your_twilio_auth_token' && this.fromPhoneNumber && !this.fromPhoneNumber.includes('your_')) {
      this.client = twilio(accountSid, authToken);
      console.log('SMS service initialized successfully');
    } else {
      console.warn('SMS service disabled - Twilio credentials not configured properly in .env');
      this.client = null;
    }
  }

  async sendSMS(to, message) {
    if (!this.client) {
      return { success: false, error: 'SMS service is not configured - missing Twilio credentials' };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const result = await this.client.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to: formattedNumber
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        error: null
      };
    } catch (error) {
      console.error('SMS send error:', error.message);
      return {
        success: false,
        error: error.message,
        messageId: null,
        status: 'failed'
      };
    }
  }

  async sendBulkSMS(messages) {
    const results = [];

    for (const message of messages) {
      const result = await this.sendSMS(message.to, message.message);
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

module.exports = SMSService;
