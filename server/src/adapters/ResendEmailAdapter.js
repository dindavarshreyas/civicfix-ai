import { EmailAdapter } from './EmailAdapter.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class ResendEmailAdapter extends EmailAdapter {
  async send({ to, subject, text, html }) {
    if (!env.RESEND_API_KEY) {
      logger.warn('ResendEmailAdapter called but RESEND_API_KEY is not configured; falling back to console');
      return { success: false, error: 'RESEND_API_KEY_MISSING' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
          html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Resend API returned error status');
      }

      return { success: true, messageId: resData.id };
    } catch (err) {
      logger.error({ error: err.message, to }, 'Failed to deliver email via Resend');
      return { success: false, error: err.message };
    }
  }
}
